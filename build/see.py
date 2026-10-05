#!/usr/bin/env python3
"""see.py — read a screen image like a careful human, and compare a build with its reference the same way.

  python3 build/see.py read <image> [--w 1280] [--lang bg] [--out DIR]
      every text (exact letters via macOS Vision OCR, SAP size + weight, colour -> token), icon,
      image/logo (crop box), line and box (fill, border, corner radius) in FRAME px, plus
      full-resolution tiles and a numbered overview to look at.
  python3 build/see.py diff <ref> <build> [--w 1280] [--lang bg] [--out DIR]
      matches element to element (not pixel to pixel, so a shifted layout still compares) and lists
      MISSING / EXTRA / TEXT / SIZE / WEIGHT / COLOUR / ICON / IMAGE / BOX / POSITION differences,
      with EYE MATCH %, a side-by-side sheet and zoom pairs. LOOK at the sheet before trusting a line.

--w     frame width in px (default: image width, halved when >= 2000 px — Figma 2x exports)
--lang  bg (Bulgarian, default) | de | en — the text language of the image. macOS Vision has no
        Bulgarian model: bg reads with the Cyrillic model, then fixes Latin look-alike letters.
"""
import argparse, difflib, json, os, re, subprocess, sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LANGS = {'bg': 'ru-RU,en-US', 'de': 'de-DE,en-US', 'en': 'en-US'}
BG_LETTERS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯабвгдежзийклмнопрстуфхцчшщъьюя'
ALLOWED = {'bg': BG_LETTERS + 'A-Za-z', 'de': 'A-Za-zÄÖÜäöüß', 'en': 'A-Za-z'}
PUNCT = r"0-9\s.,:;!?%€$£+\-–—•·/()\[\]\"'«»„“”*&#@=<>_|"
LAT2CYR = str.maketrans('aceopxyABCEHKMOPTX', 'асеорхуАВСЕНКМОРТХ')
TALL = set('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯÄÖÜбйёbdfhklitßäöü€%$£&#@?!()[]/')
SAP_SIZES = [12, 14, 16, 20, 24, 32, 48]
# font "72" metrics, calibrated on SAP builds with known text styles (build/see.py calib)
CAP, XH = 0.71, 0.525         # cap/digit height and x-height as a share of the font size
BOLD_AT = 0.105               # stroke width / font size above this = Bold
RADII = [0, 2, 4, 6, 8, 12, 16, 24]   # SAP corner radius steps


# ── colours ──────────────────────────────────────────────────────────────────────────────
def lab(rgb):
    return cv2.cvtColor(np.array([[rgb]], np.float32) / 255, cv2.COLOR_RGB2Lab)[0, 0]

def hexc(rgb):
    return '#%02x%02x%02x' % tuple(int(round(v)) for v in rgb)

def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)

def de(a, b):
    return float(np.linalg.norm(lab(a) - lab(b)))

def _tokens():
    kit = json.load(open(os.path.join(ROOT, 'knowledge/live/kit.json')))
    out = {}
    for name, v in kit['vars'].items():
        p = v.split('|')
        if len(p) > 2 and p[1] == 'C' and re.match(r'#[0-9a-fA-F]{6}$', p[2]):
            out[name.split('/')[-1]] = p[2]
    ex = os.path.join(ROOT, 'knowledge/live/vars-extra.json')
    if os.path.exists(ex):
        for n, v in json.load(open(ex))['vars'].items():
            out.setdefault(n, v['hex'])
    return [(n, np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)) for n, h in out.items()]
TOKENS = _tokens()
TLAB = np.array([lab(c) for _, c in TOKENS])
# many SAP tokens share one hex: pick the one that fits the role of the thing that has the colour
PREF = {'text': ['sapTextColor', 'sapTitleColor', 'sapContent_LabelColor', 'sapLinkColor', 'sapErrorColor', 'sapWarningColor',
                 'sapField_WarningColor', 'sapContent_ContrastTextColor', 'sapContent_Selected_ForegroundColor'],
        'fill': ['sapBaseColor', 'sapBackgroundColor', 'sapTile_Background', 'sapList_Background', 'sapErrorBackground', 'sapSelectedColor'],
        'border': ['sapList_BorderColor', 'sapTile_BorderColor', 'sapButton_BorderColor', 'sapField_BorderColor', 'sapGroup_TitleBorderColor'],
        'icon': ['sapContent_IconColor', 'sapErrorColor', 'sapWarningColor', 'sapContent_Selected_ForegroundColor', 'sapSelectedColor']}

UNITS = {'h', 'm', 's', 'min', 'ч', 'мин', 'м', 'с', 'д', 'kg', 'km', 'cm', 'mm', 'кг', 'км', 'см', 'мм', 'x', 'х', 'px', 'pt', 'st', 'nd', 'rd', 'th'}
# the SAP tokens a thing of this kind may take (a text is never painted with a border token, a line never with a text token)
ROLE_RE = {'text': r'(Text|Title|Label|Link)Color$|^sap(Error|Warning|Success|Information|Negative|Positive|Critical|Neutral)Color$|^sapField_(Warning|Invalid|Success|Information)Color$|Selected_(Text|Foreground)Color$',
           'icon': r'Icon|Foreground|^sap(Error|Warning|Success|Information|Negative|Positive|Critical|Neutral|Selected)Color$',
           'line': r'Border|Separator|IconColor',
           'fill': r'Background|BaseColor|^sapSelectedColor$|^sapButton_Emphasized',
           'border': r'Border|Separator'}

def role_near(hexcol, kind):
    """closest SAP token for a thing of this kind → (lab, ΔE)"""
    idx = [i for i, (n, _) in enumerate(TOKENS) if re.search(ROLE_RE[kind], n)]
    d = np.linalg.norm(TLAB[idx] - lab(rgb(hexcol)), axis=1)
    j = int(d.argmin()); return TLAB[idx[j]], float(d[j])

def sap_colour(ref_hex, build_hex, kind):
    """a person accepts the SAP translation of a colour: the build shows a real SAP token of the right kind, and it is
    the closest one to the reference — or the reference colour is a brand colour SAP has nothing near (ΔE > 8)"""
    best, dr = role_near(ref_hex, kind)
    _, db = role_near(build_hex, kind)
    return db <= 4 and (dr > 8 or float(np.linalg.norm(best - lab(rgb(build_hex)))) <= 4)

def token(rgb, role=None):
    """nearest SAP colour token → (name, ΔE); among equal colours the one that fits the role"""
    d = np.linalg.norm(TLAB - lab(rgb), axis=1)
    i = int(d.argmin())
    if role:
        for n in PREF[role]:
            j = next((j for j, t in enumerate(TOKENS) if t[0] == n), None)
            if j is not None and d[j] <= d[i] + 1.5: return n, round(float(d[j]), 1)
    return TOKENS[i][0], round(float(d[i]), 1)


# ── text: macOS Vision OCR ───────────────────────────────────────────────────────────────
def ocr_bin():
    src, b = os.path.join(HERE, 'ocr.swift'), os.path.join(HERE, '.bin', 'ocr')
    if not os.path.exists(b) or os.path.getmtime(b) < os.path.getmtime(src):
        os.makedirs(os.path.dirname(b), exist_ok=True)
        subprocess.run(['swiftc', '-O', src, '-o', b], check=True, capture_output=True)
    return b

def ocr(path, lang):
    r = subprocess.run([ocr_bin(), path, LANGS[lang]], capture_output=True, text=True)
    return json.loads(r.stdout or '[]')

def clean_word(t, lang):
    t = t.strip('|')                          # a separator line next to the text
    if lang == 'bg' and re.search('[А-Яа-я]', t) and re.search('[A-Za-z]', t):
        t = t.translate(LAT2CYR)              # "oт" (Latin o) → "от"
    return t

def clean_line(s, lang):
    s = re.sub(r'(?<![\w/])[\d/]*\d[\d/]*,[\d/]+(?![\w/])', lambda m: m.group().replace('/', '7'), s)   # "3/,2/ €" = 37,27 € (a thin 7)
    if lang == 'bg':                          # Vision reads the Bulgarian "ч" (hours) as "4": 3ч 7мин → "34 7мин", 3 ч. → "34."
        s = re.sub(r'(?<=\d)4(?=\s?\d{1,2}\s?мин)', 'ч', s)
        s = re.sub(r'(?<![\d,.])(\d{1,2})4\.(?!\d)', r'\1ч.', s)
    return s

def junk(t, lang, edge=False):
    """a token that is not text in this language = an icon Vision tried to read ('^', '→', '฿', '•Іß',
    a radio circle read as '•' at the start of a line, a check mark read as 'V', a close icon as 'x')"""
    if edge and t in ('•', '·', 'o', 'O', 'о', 'О'): return True
    if lang == 'bg' and re.fullmatch('[A-Za-z]', t): return True
    core = re.sub(f'[{PUNCT}]', '', t)
    m = re.fullmatch(r'\d+([A-Za-zА-Яа-я]+)', re.sub(r'[^\w]', '', t))   # "6XZ", "0xx" = an icon row; "3h", "15m", "3ч" = a number + unit
    if m and len(m.group(0)) <= 4 and m.group(1).lower() not in UNITS: return True
    if not re.search(r'[0-9A-Za-zА-Яа-яÄÖÜäöüß€]', t): return t not in ('•', '·', '-', '–', '+', '%', '€')
    return bool(re.search(f'[^{ALLOWED[lang]}]', core))

def reread(img, lines, lang, tmp):
    """Vision is unsure on small or tight text: read those lines again from one 3x strip."""
    weak = [l for l in lines if l['conf'] < 0.99]
    if not weak: return lines
    H, W = img.shape[:2]
    parts, bands, y = [], [], 0
    for l in weak:
        p = int(l['h'] * 0.6) + 4
        x0, y0, x1, y1 = max(0, int(l['x']) - p), max(0, int(l['y']) - p), min(W, int(l['x'] + l['w']) + p), min(H, int(l['y'] + l['h']) + p)
        c = cv2.resize(img[y0:y1, x0:x1], None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        parts.append((c, x0, y0)); bands.append((y, y + c.shape[0])); y += c.shape[0] + 60
    strip = np.full((y, max(c.shape[1] for c, _, _ in parts), 3), 255, np.uint8)
    for (c, _, _), (b0, _) in zip(parts, bands): strip[b0:b0 + c.shape[0], :c.shape[1]] = c
    cv2.imwrite(tmp, cv2.cvtColor(strip, cv2.COLOR_RGB2BGR))
    got = ocr(tmp, lang)
    for l, (c, x0, y0), (b0, b1) in zip(weak, parts, bands):
        hit = [g for g in got if b0 <= g['y'] + g['h'] / 2 <= b1]
        if not hit: continue
        mid = (b0 + b1) / 2                        # keep only the line in the middle (neighbour lines peek into the crop)
        near = min(hit, key=lambda g: abs(g['y'] + g['h'] / 2 - mid))
        hit = [g for g in hit if abs((g['y'] + g['h'] / 2) - (near['y'] + near['h'] / 2)) < 0.5 * near['h']]
        conf = min(g['conf'] for g in hit)
        if conf <= l['conf']: continue
        hit.sort(key=lambda g: g['x'])
        new = ' '.join(g['text'] for g in hit)
        if len(new.replace(' ', '')) < 0.85 * len(l['text'].replace(' ', '')): continue   # a re-read corrects letters, it does not cut the line
        l['text'] = new; l['conf'] = conf
        l['words'] = [{**w, 'x': x0 + w['x'] / 3, 'y': y0 + (w['y'] - b0) / 3, 'w': w['w'] / 3, 'h': w['h'] / 3} for g in hit for w in g['words']]
    return lines


def ink(crop):
    """background = median of the crop border; ink = pixels at least half-way to the strongest contrast"""
    ring = np.concatenate([crop[:2].reshape(-1, 3), crop[-2:].reshape(-1, 3), crop[:, :2].reshape(-1, 3), crop[:, -2:].reshape(-1, 3)])
    bg = np.median(ring, 0)
    d = np.linalg.norm(crop.astype(float) - bg, axis=2)
    top = np.percentile(d, 99.5)
    if top < 30: return None
    return bg, d, top

def measure_text(img, x, y, w, h, text, k):
    H, W = img.shape[:2]
    p = max(2, int(h * 0.15))
    x0, y0, x1, y1 = max(0, int(x) - p), max(0, int(y) - p), min(W, int(x + w) + p), min(H, int(y + h) + p)
    crop = img[y0:y1, x0:x1]
    r = ink(crop) if crop.size else None
    if r is None: return None
    bg, d, top = r
    m = d >= 0.5 * top
    m[m.mean(1) > 0.8] = False                # a divider or box edge crossing the crop is not a glyph
    m[:, m.mean(0) > 0.6] = False            # a vertical separator next to the text (letter stems cover < 50%)
    n_, _, st_, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    comp = sorted((st_[i] for i in range(1, n_) if st_[i][4] > 3), key=lambda s: s[0])
    if len(comp) > 3:                         # a radio ring / icon next to the words: taller than the letters and apart from them
        hmed = np.median([s[3] for s in comp])
        for c_, nx_ in ((comp[0], comp[1]), (comp[-1], comp[-2])):
            gap_ = nx_[0] - (c_[0] + c_[2]) if nx_[0] > c_[0] else c_[0] - (nx_[0] + nx_[2])
            if c_[3] >= 1.6 * hmed and gap_ >= 0.4 * c_[3]: m[:, c_[0]:c_[0] + c_[2]] = False
    if not m.any(): return None
    # keep the main band of ink rows (this line of text); drop bands of the lines above/below that peek in
    rows = m.sum(1)
    runs, s = [], None
    for i, v in enumerate(list(rows) + [0]):
        if v and s is None: s = i
        if not v and s is not None: runs.append([s, i - 1]); s = None
    if not runs: return None
    main = max(runs, key=lambda r: rows[r[0]:r[1] + 1].sum())
    if re.search('[йёijäöü]', text):                # lowercase accents / i-dots sit a small gap above the letters (a capital Й's breve rises above the caps: leave it out)
        ink_main, gap = rows[main[0]:main[1] + 1].sum(), max(2, (main[1] - main[0]) // 4)
        for r in sorted(runs, key=lambda r: -r[0]):
            if r[1] < main[0] and main[0] - r[1] <= gap and rows[r[0]:r[1] + 1].sum() < 0.12 * ink_main: main[0] = r[0]
    m[:main[0]] = False; m[main[1] + 1:] = False
    col = np.median(crop[(d >= 0.8 * top) & m], 0) if ((d >= 0.8 * top) & m).any() else np.median(crop[d >= 0.8 * top], 0)
    rows = m.sum(1)
    ys = np.nonzero(rows)[0]
    xs = np.nonzero(m.sum(0))[0]
    dens = rows / rows.max()
    base = np.nonzero(dens >= 0.25)[0][-1]
    tall = any(ch in TALL for ch in text)
    height = (base - ys[0] + 1) * k
    size = height / (CAP if tall else XH)
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    per = sum(cv2.arcLength(c, True) for c in cs)
    stroke = 2 * m.sum() / per * k if per else 0
    snap = min(SAP_SIZES, key=lambda s: abs(s - size))
    tok, dE = token(col, 'text')
    ink_box = [round((x0 + xs[0]) * k), round((y0 + ys[0]) * k), round((xs[-1] - xs[0] + 1) * k), round((ys[-1] - ys[0] + 1) * k)]
    return {'size_px': round(float(size), 1), 'size': snap, 'weight': 'Bold' if stroke / max(size, 1) > BOLD_AT else 'Regular',
            'stroke': round(float(stroke / max(size, 1)), 3), 'color': hexc(col), 'token': tok, 'dE': dE, 'bg': hexc(bg), 'box': ink_box}


def texts(img, path, lang, k, tmp):
    lines = reread(img, ocr(path, lang), lang, tmp)
    out, icons = [], []
    for l in lines:
        seg = []
        words = [dict(w, t=clean_word(w['t'], lang)) for w in l['words']] or [{'t': clean_word(l['text'], lang), **{c: l[c] for c in 'xywh'}}]
        words = [w for w in words if w['t']]
        fixed = clean_line(' '.join(w['t'] for w in words), lang).split(' ')
        if len(fixed) == len(words):
            for w, t in zip(words, fixed): w['t'] = t
        for n, w in enumerate(words + [None]):
            lead_icon = n == 0 and w is not None and len(words) > 1 and re.fullmatch(r'\d', w['t']) and re.fullmatch(r'[A-ZА-Я][A-ZА-Я\-]{2,}', words[1]['t'])
            if w is not None and (lead_icon or junk(w['t'], lang, edge=n in (0, len(words) - 1))):   # "7 НАЙ-БЪРЗО" = a bolt icon + a badge
                icons.append({'x': w['x'], 'y': w['y'], 'w': w['w'], 'h': w['h'], 'ocr': w['t']})
                w = 'break'
            gap = w not in (None, 'break') and seg and w['x'] - (seg[-1]['x'] + seg[-1]['w']) > 1.6 * max(seg[-1]['h'], 1)
            if w in (None, 'break') or gap:
                if seg:
                    x0 = min(s['x'] for s in seg); y0 = min(s['y'] for s in seg)
                    x1 = max(s['x'] + s['w'] for s in seg); y1 = max(s['y'] + s['h'] for s in seg)
                    t = ' '.join(s['t'] for s in seg)
                    scrap = (lang == 'bg' and l['conf'] <= 0.5 and not re.search('[А-Яа-я0-9]', t) and not re.fullmatch('[A-Z]{2,4}', t)) \
                        or (l['conf'] <= 0.3 and len(t) <= 3 and not re.search('[0-9]', t))
                    if scrap:
                        icons.append({'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0, 'ocr': t}); seg = []
                        if w not in (None, 'break'): seg.append(w)
                        continue
                    mt = measure_text(img, x0, y0, x1 - x0, y1 - y0, t, k)
                    if mt:
                        out.append({'kind': 'text', 'text': t, 'conf': l['conf'], **mt})   # box = the ink box, not Vision's loose box
                seg = []
            if w not in (None, 'break'): seg.append(w)
    return out, icons


# ── shapes: boxes, lines, icons, images ──────────────────────────────────────────────────
def shapes(img, k, text_boxes, words=()):
    """works at frame scale, like an eye: logos/pictures first (saturated square patches), then boxes
    (flat areas: fill, border width + colour, corner radius, shadow; one box even when a divider splits
    it), thin lines (dividers, separators, the selected-tab bar), and what is left = icons"""
    f = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_AREA) if k != 1 else img.copy()
    H, W = f.shape[:2]
    fi = f.astype(np.int16)
    diff = np.zeros((H, W), np.int16)
    for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):
        sh = np.roll(np.roll(fi, dy, 0), dx, 1)
        diff = np.maximum(diff, np.abs(fi - sh).max(2))
    flat = (diff <= 4).astype(np.uint8)
    flat[0, :] = flat[-1, :] = flat[:, 0] = flat[:, -1] = 0
    tmask = np.zeros((H, W), np.uint8)
    for b in text_boxes: cv2.rectangle(tmask, (b[0] - 2, b[1] - 2), (b[0] + b[2] + 2, b[1] + b[3] + 2), 1, -1)

    # pictures / logos: a filled, saturated, roughly square patch 24–110 px (a button is wide, a radio is a ring)
    hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
    sat = ((hsv[..., 1] > 90) & (hsv[..., 2] > 40)).astype(np.uint8)
    sat = cv2.morphologyEx(sat, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lb, st, _ = cv2.connectedComponentsWithStats(sat, 8)
    pics = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if 24 <= w <= 110 and 24 <= h <= 110:       # lettering on a logo leaves holes: count the filled outline
            cs, _ = cv2.findContours((lb[y:y + h, x:x + w] == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            a = sum(cv2.contourArea(c) for c in cs)
        worded = any(inside(t['box'], [x, y, w, h], 0.6) and t['conf'] >= 0.99 and len(re.findall(r'[^\W\d_]', t['text'])) >= 3 for t in words)
        if 24 <= w <= 110 and 24 <= h <= 110 and 0.5 <= w / h <= 2 and a >= 0.6 * w * h and not worded:
            crop = f[y:y + h, x:x + w]
            pics.append({'kind': 'image', 'box': [int(x), int(y), int(w), int(h)], 'color': hexc(np.median(crop.reshape(-1, 3), 0)),
                         'token': '', '_rgb': cv2.resize(crop, (16, 16), interpolation=cv2.INTER_AREA), '_thumb': np.zeros((12, 12), np.float32)})
    in_pic = lambda b: any(inside(b, p['box'], 0.7) for p in pics)

    # boxes: connected flat areas, holes (their content) filled
    n, lab_, st, _ = cv2.connectedComponentsWithStats(flat, 4)
    boxes = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if w < 24 or h < 16 or a < 500: continue
        m = (lab_[y:y + h, x:x + w] == i).astype(np.uint8)
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        full = np.zeros_like(m); cv2.drawContours(full, cs, -1, 1, -1)
        if full.sum() < 0.8 * w * h or in_pic([x, y, w, h]): continue
        boxes.append({'kind': 'box', 'box': [int(x), int(y), int(w), int(h)], 'fill': hexc(np.median(f[y:y + h, x:x + w][m > 0], 0)), '_m': full})
    # one card split by a divider = one box (same fill, same edges, a gap of <= 4 px)
    again = True
    while again:
        again = False
        for p_ in boxes:
            for q in boxes:
                if p_ is q or de(rgb(p_['fill']), rgb(q['fill'])) >= 2: continue
                (ax, ay, aw, ah), (bx, by, bw, bh) = p_['box'], q['box']
                below = abs(ax - bx) <= 2 and abs(ax + aw - bx - bw) <= 2 and 0 <= by - (ay + ah) <= 4
                right = abs(ay - by) <= 2 and abs(ay + ah - by - bh) <= 2 and 0 <= bx - (ax + aw) <= 4
                if not (below or right): continue
                x0, y0 = min(ax, bx), min(ay, by)
                x1, y1 = max(ax + aw, bx + bw), max(ay + ah, by + bh)
                mm = np.zeros((y1 - y0, x1 - x0), np.uint8)
                mm[ay - y0:ay - y0 + ah, ax - x0:ax - x0 + aw] |= p_['_m']
                mm[by - y0:by - y0 + bh, bx - x0:bx - x0 + bw] |= q['_m']
                if below: mm[ay + ah - y0:by - y0, :] = 1
                else: mm[:, ax + aw - x0:bx - x0] = 1
                p_['box'], p_['_m'], p_['dividers'] = [x0, y0, x1 - x0, y1 - y0], mm, p_.get('dividers', 0) + 1
                boxes.remove(q); again = True; break
            if again: break
    page = max(boxes, key=lambda b: area(b['box'])) if boxes else None
    for b in boxes:
        x, y, w, h = b['box']
        full = b.pop('_m')
        fillc = rgb(b['fill'])
        b['token'], b['dE'] = token(fillc, 'fill')
        b['page'] = b is page
        # corner radius: a rounded corner leaves a gap d on the diagonal, r = d / (1 - 1/√2)
        R_ = min(32, w // 2, h // 2)                  # the missing corner area of a radius r is r²(1 - π/4): sub-pixel exact
        cut = sorted(int((c[:R_, :R_] == 0).sum()) for c in (full, full[:, ::-1], full[::-1], full[::-1, ::-1]))
        a_in = (cut[1] + cut[2]) / 2
        b['inner'] = [x, y, w, h]
        if b['page']: b['radius'] = 0; continue
        # walk outward from the flat inside, side by side: margin, border (width, colour), then shadow
        prof = {}
        for side in 'tbrl':
            nn = 14
            if side == 'l': s = f[y + h // 4:y + 3 * h // 4 + 1, max(0, x - nn):x][:, ::-1].mean(0)
            elif side == 'r': s = f[y + h // 4:y + 3 * h // 4 + 1, x + w:min(W, x + w + nn)].mean(0)
            elif side == 't': s = f[max(0, y - nn):y, x + w // 4:x + 3 * w // 4 + 1][::-1].mean(1)
            else: s = f[y + h:min(H, y + h + nn), x + w // 4:x + 3 * w // 4 + 1].mean(1)
            if len(s) >= 8: prof[side] = s
        bws, bcs, sh, offs = [], [], {}, []
        for side, s in prof.items():
            i0 = next((i for i in range(3) if de(s[i], fillc) > 6), None)
            bw = 0
            if i0 is not None:                       # a border = a short run of ONE colour, then the colour changes
                while i0 + bw < len(s) - 4 and bw < 3 and de(s[i0 + bw], fillc) > 6 and de(s[i0 + bw], s[i0]) < 6: bw += 1
                if bw and de(s[i0 + bw], s[i0]) < 6: bw = 0
            if not bw:                               # no border: the box's own last pixel touches the outside, so it is never "flat"
                i0 = 1 if de(s[0], fillc) < 6 else 0
            bws.append(bw); offs.append((i0 or 0) + bw)
            if bw: bcs.append(s[i0:i0 + bw].mean(0))
            rest = s[(i0 or 0) + bw:]                # shadow = grey darkening that fades out (a colour change is not a shadow)
            if len(rest) >= 6:
                far = lab(rest[-2:].mean(0))
                L = [lab(v) for v in rest[:-2]]
                dl = [float(far[0] - v[0]) for v in L]
                grey = all(abs(v[1] - far[1]) < 3 and abs(v[2] - far[2]) < 3 for v in L[:3])
                ext = next((i for i, v in enumerate(dl) if v < 0.6), len(dl))
                if grey and ext >= 2 and dl[0] >= 1.2 and len(dl) > 2 and dl[0] > dl[2] + 0.3: sh[side] = ext
        bw = int(np.median(bws)) if bws else 0
        if bw and len(bcs) >= 3:
            bc = np.median(bcs, 0); b['border'] = hexc(bc); b['border_token'] = token(bc, 'border')[0]; b['border_w'] = bw
        o = int(np.median(offs)) if offs else 0
        b['box'] = [x - o, y - o, w + 2 * o, h + 2 * o]
        # the flat inside is the real shape shrunk by o px, so its corner radius is r - o
        # (+ its soft arc: A ≈ 0.2146·r² + 0.9·r, fitted on SAP builds), snapped to the SAP radius steps
        ri = (-0.9 + (0.81 + 4 * 0.2146 * a_in) ** 0.5) / (2 * 0.2146) if a_in >= 2 else 0
        b['radius_px'] = round(o + ri, 1) if ri else 0
        b['radius'] = min(RADII, key=lambda v: abs(v - b['radius_px'])) if ri else 0
        if len(sh) >= 2: b['shadow'] = {'y': sh.get('b', 0) - sh.get('t', 0), 'spread': max(sh.values()), 'sides': ''.join(sorted(sh))}

    # lines: thin runs that differ from BOTH neighbours the same way (a gradient step is not a line)
    gray = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY).astype(np.int32)   # int16 overflows on up*dn
    lines = []
    for orient, kern, ax_ in (('h', (40, 1), 0), ('v', (1, 40), 1)):
        up, dn = gray - np.roll(gray, 3, ax_), gray - np.roll(gray, -3, ax_)
        m = ((up * dn > 0) & (np.minimum(np.abs(up), np.abs(dn)) > 6)).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, kern))
        m[tmask > 0] = 0
        n2, _, st2, _ = cv2.connectedComponentsWithStats(m, 8)
        for i in range(1, n2):
            x, y, w, h, a = st2[i]
            if (orient == 'h' and (w < 40 or h > 6)) or (orient == 'v' and (h < 40 or w > 6)) or in_pic([x, y, w, h]): continue
            L = [x, y, w, h]
            edge = False                             # a box edge (border) is not a divider
            for b in boxes:
                bx, by, bw_, bh = b['box']
                if orient == 'h' and min(abs(y - by), abs(y + h - by - bh)) <= 3 and inside(L, [bx - 3, by - 3, bw_ + 6, bh + 6], 0.7): edge = True
                if orient == 'v' and min(abs(x - bx), abs(x + w - bx - bw_)) <= 3 and inside(L, [bx - 3, by - 3, bw_ + 6, bh + 6], 0.7): edge = True
            if edge: continue
            px = f[y:y + h, x:x + w].reshape(-1, 3).astype(float)
            ring = f[max(0, y - 3):y + h + 3, max(0, x - 3):x + w + 3].reshape(-1, 3).astype(float)
            dist = np.linalg.norm(px - np.median(ring, 0), axis=1)
            c = np.median(px[dist >= 0.6 * dist.max()], 0) if dist.max() > 0 else np.median(px, 0)   # the line's core, not its soft edge
            lines.append({'kind': 'line', 'box': [int(x), int(y), int(w), int(h)], 'orient': orient, 'color': hexc(c), 'token': token(c, 'border')[0]})
    lmask = np.zeros((H, W), np.uint8)
    for l in lines: x, y, w, h = l['box']; lmask[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2] = 1

    # icons: what is left — not flat, not text, not a line, not a box edge, not a picture
    fg = ((flat == 0) & (tmask == 0) & (lmask == 0)).astype(np.uint8)
    for b in boxes:
        x, y, w, h = b['box']
        cv2.rectangle(fg, (x - 2, y - 2), (x + w + 1, y + h + 1), 0, 5)
    for p_ in pics:
        x, y, w, h = p_['box']; fg[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2] = 0
    fg = cv2.dilate(fg, np.ones((3, 3), np.uint8))
    n3, _, st3, _ = cv2.connectedComponentsWithStats(fg, 8)
    marks = []
    for i in range(1, n3):
        x, y, w, h, a = st3[i]
        if w < 5 or h < 5 or a < 20 or w > W * 0.6 or h > H * 0.6: continue
        if max(w, h) > 64 or min(w, h) < 3 or (max(w, h) > 5 * min(w, h) and min(w, h) < 8): continue   # frame px
        # an icon is at most 64 px: bigger = a region of other things; thin and long = a sliver of an edge, not an icon
        corner = False                              # the rounded corner of a bordered box is not an icon
        for b in boxes:
            if b.get('page') or not b['radius']: continue
            bx, by, bw_, bh = b['box']
            for cx, cy in ((bx, by), (bx + bw_, by), (bx, by + bh), (bx + bw_, by + bh)):
                if max(w, h) <= b['radius'] + 8 and abs(x + w / 2 - cx) <= b['radius'] + 4 and abs(y + h / 2 - cy) <= b['radius'] + 4: corner = True
        if corner: continue
        crop = f[y:y + h, x:x + w]
        r = ink(np.pad(crop, ((2, 2), (2, 2), (0, 0)), mode='edge'))
        if r is None: continue
        bg, d, top = r
        d = d[2:-2, 2:-2]
        ys_, xs_ = np.nonzero(d >= 0.5 * top)            # the shape ends where its contrast is half: a light ring and a dark one of one size read alike
        if len(xs_):
            x0_, y0_, x1_, y1_ = xs_.min(), ys_.min(), xs_.max() + 1, ys_.max() + 1
            x, y, w, h = x + x0_, y + y0_, x1_ - x0_, y1_ - y0_
            crop, d = crop[y0_:y1_, x0_:x1_], d[y0_:y1_, x0_:x1_]
            if min(w, h) < 3 or (max(w, h) > 5 * min(w, h) and min(w, h) < 8): continue
        col = np.median(crop[d >= 0.8 * top], 0)
        marks.append({'kind': 'icon', 'box': [int(x), int(y), int(w), int(h)], 'color': hexc(col), 'token': token(col, 'icon')[0],
                      '_thumb': cv2.resize((d >= 0.5 * top).astype(np.float32), (12, 12), interpolation=cv2.INTER_AREA),
                      '_rgb': cv2.resize(crop, (16, 16), interpolation=cv2.INTER_AREA)})
    return f, boxes, lines, pics + marks


def area(b):
    return b[2] * b[3]

def inside(a, b, t=0.9):
    ix = max(0, min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1]))
    return ix * iy >= t * max(1, area(a))

def union(bs):
    x0, y0 = min(b[0] for b in bs), min(b[1] for b in bs)
    return [x0, y0, max(b[0] + b[2] for b in bs) - x0, max(b[1] + b[3] for b in bs) - y0]

def center(b):
    return np.array([b[0] + b[2] / 2, b[1] + b[3] / 2], float)


def regions(els, W, H):
    """Make's top-down reading (2026-10-04, traced from Figma Make): a person sees a SIDE PANEL + a MAIN list of the SAME cards before
    any pixel. The measure alone cut the hotel page into horizontal bands that each mixed filters with results, and missed a white card
    on white (card 1) — three cards came out with three different trees. Two synthetic boxes fix the reading before nesting:
      1. a repeated card that has no box gets one: same size as its siblings, placed by the texts that repeat at the same offset;
      2. a side panel + main area split along a clear vertical gutter that runs down at least 45 % of the screen."""
    page = next((e for e in els if e['kind'] == 'box' and e.get('page')), None)
    nid = [max([e['id'] for e in els] + [0])]
    def synth(box, like, **kw):
        nid[0] += 1
        b = {k: v for k, v in like.items() if not k.startswith('_') and k not in ('box', 'id', 'inner', 'padding', 'page', 'parent', 'group', 'dividers')}
        b.update({'kind': 'box', 'box': [int(v) for v in box], 'inner': [int(v) for v in box], 'id': nid[0], 'page': False}); b.update(kw); els.append(b); return b
    added = []
    # 1 repeated cards
    boxes = [e for e in els if e['kind'] == 'box' and not e.get('page')]
    cards = [b for b in boxes if b['box'][2] >= 0.3 * W and b['box'][3] >= 100]
    best = []
    for c in cards:
        g = [d for d in cards if abs(d['box'][2] - c['box'][2]) <= 0.03 * c['box'][2] and abs(d['box'][3] - c['box'][3]) <= 0.15 * c['box'][3] and abs(d['box'][0] - c['box'][0]) <= 8]
        if len(g) > len(best): best = g
    if len(best) >= 2:
        texts = [e for e in els if e['kind'] == 'text']
        rel = {}
        for c in best:
            for t in texts:
                if inside(t['box'], c['box']): rel.setdefault(t['text'], []).append((t['box'][0] - c['box'][0], t['box'][1] - c['box'][1]))
        anchors = {k: (int(np.median([v[0] for v in vs])), int(np.median([v[1] for v in vs]))) for k, vs in rel.items()
                   if len(vs) >= 2 and max(v[1] for v in vs) - min(v[1] for v in vs) <= 12 and len(k) >= 3}
        cw, ch = int(np.median([c['box'][2] for c in best])), int(np.median([c['box'][3] for c in best])); cx = int(np.median([c['box'][0] for c in best]))
        votes = {}
        for t in texts:
            if t['text'] not in anchors or any(inside(t['box'], c['box']) for c in best): continue
            ax, ay = anchors[t['text']]
            if abs(t['box'][0] - (cx + ax)) > 12: continue
            y = t['box'][1] - ay
            key = next((k for k in votes if abs(k - y) <= 10), y); votes.setdefault(key, set()).add(t['text'])
        for y, names in votes.items():
            if len(names) < 2 or y < 0 or y + ch > H + 6: continue
            nb = [cx, y, cw, min(ch, H - y)]
            if any(inside(nb, b['box'], 0.15) or inside(b['box'], nb, 0.5) for b in cards): continue
            added.append(synth(nb, best[0], synthetic='repeat'))
    # 2 side panel | main | right rail: a vertical gutter that stays clear over the longest stretch of the screen (the search bar or a
    #   bottom banner may cross it above or below — that stretch is simply shorter), with content on both sides
    lines_all = [e for e in els if e['kind'] == 'line' and e['box'][2] < 0.85 * W]
    items = [e for e in els if not e.get('page') and e['box'][2] < 0.85 * W and e['kind'] != 'line' and not (e['kind'] == 'box' and e['box'][3] >= 0.85 * H)]
    walls = [e for e in els if not e.get('page') and not (e['kind'] == 'box' and e['box'][3] >= 0.85 * H)]   # a full-width header / banner / line ends a stretch
    def gutter(pool, xlo, xhi):
        best_ = None
        for x in range(int(xlo), int(xhi), 2):
            cross = sorted((e['box'][1], e['box'][1] + e['box'][3]) for e in walls if e['box'][0] < x < e['box'][0] + e['box'][2])
            free, y = [], 0
            for a_, b_ in cross:
                if a_ > y: free.append((y, a_))
                y = max(y, b_)
            free.append((y, H))
            a_, b_ = max(free, key=lambda t: t[1] - t[0])
            if b_ - a_ < 0.45 * H: continue
            inb = lambda e: e['box'][1] >= a_ - 2 and e['box'][1] + e['box'][3] <= b_ + 2
            L = [e for e in pool if inb(e) and e['box'][0] + e['box'][2] <= x]; Rr = [e for e in pool if inb(e) and e['box'][0] >= x]
            if len(L) < 6 or len(Rr) < 6: continue
            if not best_ or b_ - a_ > best_[2] - best_[1]: best_ = (x, a_, b_, L, Rr)
        return best_
    like = page or {'fill': '#ffffff', 'token': 'sapBaseColor', 'dE': 0}
    pad = lambda b: [b[0] - 2, b[1] - 2, b[2] + 4, b[3] + 4]
    def region(members, a_, b_, nm, xlo, xhi, gx):
        # a region takes in EVERY part on its side that it touches (a tab separator that starts 20 px above the stretch, a divider):
        # a part left half outside overlaps the region and gets pinned. It never grows across a part that crosses the gutter.
        u = union([m['box'] for m in members]); grown = True
        crossing = [e for e in walls if e['box'][0] < gx < e['box'][0] + e['box'][2]]
        while grown:
            grown = False
            for e in els:
                if e.get('page') or e.get('region') or e in members: continue
                x0_, y0_, w_, h_ = e['box']
                if x0_ < xlo - 1 or x0_ + w_ > xhi + 1: continue
                if not (y0_ < u[1] + u[3] and y0_ + h_ > u[1]) or inside(e['box'], u, 0.999): continue
                nu = union([u, e['box']])
                if any(c['box'][1] < nu[1] + nu[3] and c['box'][1] + c['box'][3] > nu[1] and not (c['box'][1] < u[1] + u[3] and c['box'][1] + c['box'][3] > u[1]) for c in crossing): continue
                u = nu; members = members + [e]; grown = True
        return synth(u, like, region=nm, radius=0, border=False, shadow=False)   # exact: a 2-px margin was added twice and moved the whole panel 2 px
    g1 = gutter(items, 0.12 * W, 0.45 * W)
    if g1:
        x, a_, b_, L, Rr = g1
        added.append(region(L, a_, b_, 'side', 0, x, x)); added.append(region(Rr, a_, b_, 'main', x, W, x))
        g2 = gutter(Rr, 0.6 * W, 0.92 * W)                       # a right rail (ads, a detail column) inside the main area
        if g2:
            x2, a2, b2, M_, Rail = g2
            added.append(region(M_, a2, b2, 'list', x, x2, x2)); added.append(region(Rail, a2, b2, 'rail', x2, W, x2))
    else:
        g2 = gutter(items, 0.6 * W, 0.92 * W)
        if g2:
            x2, a2, b2, M_, Rail = g2
            added.append(region(M_, a2, b2, 'main', 0, x2, x2)); added.append(region(Rail, a2, b2, 'rail', x2, W, x2))
    return added

def structure(els):
    """who sits inside which box, every box's padding, and which children sit side by side as a group"""
    page = next((e for e in els if e['kind'] == 'box' and e.get('page')), None)
    boxes = [e for e in els if e['kind'] == 'box' and not e.get('page')]
    for e in els:
        if e is page: e['parent'] = 0; continue
        c = [b for b in boxes if b is not e and area(b['box']) > area(e['box']) and inside(e['box'], b['box'])]
        e['parent'] = min(c, key=lambda b: area(b['box']))['id'] if c else (page['id'] if page else 0)
    groups = []
    for b in ([page] if page else []) + boxes:
        kids = [e for e in els if e['parent'] == b['id']]
        if not kids: continue
        if not b.get('page'):
            inner = b.get('inner', b['box'])
            content = [e for e in kids if not (e['kind'] == 'line' and (e['box'][2] >= 0.9 * inner[2] or e['box'][3] >= 0.9 * inner[3]))] or kids
            u = union([e['box'] for e in content])
            b['padding'] = [u[1] - inner[1], inner[0] + inner[2] - (u[0] + u[2]), inner[1] + inner[3] - (u[1] + u[3]), u[0] - inner[0]]
        rows = []                                   # children whose vertical spans overlap = one row
        for e in sorted((e for e in kids if e['kind'] != 'line'), key=lambda e: e['box'][1] + e['box'][3] / 2):
            y0, y1 = e['box'][1], e['box'][1] + e['box'][3]
            for r in rows:
                if min(y1, r[1]) - max(y0, r[0]) >= 0.5 * min(y1 - y0, r[1] - r[0]):
                    r[2].append(e); r[0], r[1] = min(r[0], y0), max(r[1], y1); break
            else: rows.append([y0, y1, [e]])
        for _, _, its in rows:                      # side by side with a small gap = one group
            its.sort(key=lambda e: e['box'][0])
            g = [its[0]]
            for p, q in zip(its, its[1:]):
                gap = q['box'][0] - (p['box'][0] + p['box'][2])
                if p['kind'] in ('text', 'icon', 'image') and q['kind'] in ('text', 'icon', 'image') and -2 <= gap <= max(12, 0.9 * min(p['box'][3], q['box'][3])): g.append(q)
                else: groups.append(g); g = [q]
            groups.append(g)
    out = []
    for g in groups:
        if len(g) < 2: continue
        gid = len(out) + 1
        for e in g: e['group'] = gid
        out.append({'id': gid, 'members': [e['id'] for e in g], 'box': union([e['box'] for e in g]), 'parent': g[0]['parent'],
                    'gap': int(np.median([q['box'][0] - (p['box'][0] + p['box'][2]) for p, q in zip(g, g[1:])]))})
    return out


def ui_width(path, lang, tmp_dir):
    """the TRUE frame width of a screenshot, from its text: SAP body / table text is 14 px in every density, so the screenshot's scale is
    (measured body font in image px) / 14. Root cause of the 2026-10-03 disaster: "image >= 2000 px → frame = half" read a 2000-px capture of a
    ~1600-px screen as 1000 px wide — every text came out 12 px, every kit part (Shell Bar 52, Button 26) was too big for it, and the screen broke."""
    img = cv2.imread(path); iw = img.shape[1]
    R, _, _ = read(path, lang, iw, tmp_dir)                    # k = 1: boxes in image pixels
    sizes = []
    for e in R['elements']:
        if e.get('kind') != 'text' or len(str(e.get('text', ''))) < 3: continue
        t, h = str(e['text']), e['box'][3]
        desc = any(c in t for c in 'gjpqy()[]{}|,;')            # letters below the line (and brackets) make the glyph box taller
        sizes.append(h / (0.93 if desc else 0.72))              # glyph box → font size: cap height ≈ 0.72 em, cap + descender ≈ 0.93 em
    if len(sizes) < 4: return None
    sizes.sort(); body = sizes[len(sizes) // 4]               # the lower quartile = body / table text (headings are fewer and bigger)
    W = iw / (body / 14.0)
    for std in (1024, 1280, 1366, 1440, 1536, 1600, 1680, 1728, 1920, 2560):   # a common screen width within 4 % wins
        if abs(W - std) / std <= 0.04: return std
    return int(round(W))


def read(path, lang='bg', w=None, tmp_dir=None, regions_=False):
    img = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
    if w is None:
        try: w = ui_width(path, lang, tmp_dir)
        except Exception: w = None
    W = w or (img.shape[1] // 2 if img.shape[1] >= 2000 else img.shape[1])
    if img.shape[1] < 1.5 * W:                 # a 1x screenshot: read it from a 2x upscale, like zooming in
        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        path = os.path.join(tmp_dir or '/tmp', 'see-2x.png'); cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    k = W / img.shape[1]
    ts, junk_icons = texts(img, path, lang, k, os.path.join(tmp_dir or '/tmp', 'see-strip.png'))
    f, boxes, lines, marks = shapes(img, k, [t['box'] for t in ts], ts)
    pics = [m['box'] for m in marks if m['kind'] == 'image']
    ts = [t for t in ts if not any(inside(t['box'], b, 0.6) for b in pics)]   # lettering inside a logo is the logo
    els = ts + marks + lines + boxes
    for i, e in enumerate(els): e['id'] = i + 1
    if regions_: regions(els, W, f.shape[0])        # only for the spec (the plan): the EYE check reads the reference as it is
    groups = structure(els)
    return {'image': path, 'frame': [W, f.shape[0]], 'k': k, 'lang': lang, 'elements': els, 'groups': groups}, img, f


# ── report / pictures ────────────────────────────────────────────────────────────────────
COL = {'text': (40, 110, 255), 'icon': (230, 120, 0), 'image': (170, 0, 200), 'line': (0, 160, 90), 'box': (120, 120, 120)}

def pub(e):
    return {k: (v.tolist() if isinstance(v, np.ndarray) else v) for k, v in e.items() if not k.startswith('_')}

def describe(e):
    x, y, w, h = e['box']
    at = f"{x},{y} {w}×{h}"
    if e['kind'] == 'text':
        return f'text  {at:>17}  {e["size"]}px {e["weight"]:<7} {e["color"]} {e["token"]}{"" if e["dE"] < 6 else " (≉ ΔE" + str(e["dE"]) + ")"}  "{e["text"]}"'
    if e['kind'] == 'box':
        b = f' · border {e["border_w"]}px {e["border"]} {e["border_token"]}' if e.get('border') else ' · no border'
        sh = f' · shadow y{e["shadow"]["y"]:+d} ~{e["shadow"]["spread"]}px' if e.get('shadow') else ''
        pd = ' · padding ' + '/'.join(map(str, e['padding'])) if e.get('padding') else ''
        return f'box   {at:>17}  fill {e["fill"]} {e["token"]}{b} · radius {e["radius"]}{sh}{pd}'
    if e['kind'] == 'line':
        return f'line  {at:>17}  {"horizontal" if e["orient"] == "h" else "vertical"} {e["color"]} {e["token"]}'
    return f'{e["kind"]:<5} {at:>17}  {e["color"]} {e["token"]}' + ('  crop:[%d,%d,%d,%d]' % tuple(e['box']) if e['kind'] == 'image' else '')

def tree(R):
    """the screen as a human reads it: page → boxes → rows/groups, top-left to bottom-right"""
    els, groups = R['elements'], {g['id']: g for g in R['groups']}
    kids = {}
    for e in els: kids.setdefault(e['parent'], []).append(e)
    page = next((e for e in els if e.get('page')), None)
    out = [f"FRAME {R['frame'][0]}×{R['frame'][1]} · page fill {page['fill']} {page['token']}" if page else f"FRAME {R['frame'][0]}×{R['frame'][1]}"]
    def walk(pid, depth):
        done = set()
        for e in sorted(kids.get(pid, []), key=lambda e: (e['box'][1] // 10, e['box'][0])):
            if e['id'] in done: continue
            g = e.get('group')
            if g:
                G = groups[g]
                out.append('  ' * depth + f"┌ group · {len(G['members'])} side by side · gap {G['gap']}px")
                for m in sorted((x for x in kids.get(pid, []) if x.get('group') == g), key=lambda x: x['box'][0]):
                    out.append('  ' * depth + f"│ #{m['id']:<3} {describe(m)}"); done.add(m['id'])
                continue
            out.append('  ' * depth + f"#{e['id']:<3} {describe(e)}")
            if e['kind'] == 'box': walk(e['id'], depth + 1)
    walk(page['id'] if page else 0, 1)
    return out

def overview(f, els, path, marks=None):
    o = f.copy()
    for e in els:
        x, y, w, h = e['box']
        if e.get('page'): continue
        cv2.rectangle(o, (x, y), (x + w - 1, y + h - 1), COL[e['kind']], 1)
        cv2.putText(o, str(e['id']), (x, max(9, y - 2)), cv2.FONT_HERSHEY_SIMPLEX, 0.32, COL[e['kind']], 1, cv2.LINE_AA)
    cv2.imwrite(path, cv2.cvtColor(o, cv2.COLOR_RGB2BGR))

def tiles(img, out):
    """full-resolution pieces of the image: look at these, not at a shrunk whole image"""
    H, W = img.shape[:2]
    tw, th, ov = 1100, 800, 80
    paths = []
    for r, y in enumerate(range(0, max(1, H - ov), th - ov)):
        for c, x in enumerate(range(0, max(1, W - ov), tw - ov)):
            p = os.path.join(out, f'tile-{r}{c}.png')
            cv2.imwrite(p, cv2.cvtColor(img[y:y + th, x:x + tw], cv2.COLOR_RGB2BGR)); paths.append(p)
    return paths

def cmd_read(a):
    os.makedirs(a.out, exist_ok=True)
    R, img, f = read(a.image, a.lang, a.w, a.out)
    json.dump({**R, 'elements': [pub(e) for e in R['elements']]}, open(os.path.join(a.out, 'read.json'), 'w'), ensure_ascii=False, indent=1)
    overview(f, R['elements'], os.path.join(a.out, 'overview.png'))
    tp = tiles(img, a.out)
    els = R['elements']
    print(f"image ×{R['k']:.3f} · lang {a.lang} · " + ' · '.join(f"{sum(e['kind'] == kd for e in els)} {kd}s" for kd in ('text', 'icon', 'image', 'line', 'box')) + f" · {len(R['groups'])} groups")
    print('\n'.join(tree(R)))
    print(f"LOOK: {os.path.join(a.out, 'overview.png')} (#ids) · full-size tiles: {', '.join(os.path.basename(p) for p in tp)}")


# ── diff: element to element, like a person comparing two screens ─────────────────────────
def ntext(t):
    return re.sub(r'^[•·.,:;\-–]+|[•·.,:;\-–]+$', '', re.sub(r'[\s|]+', '', t.translate(LAT2CYR).lower()).translate(LAT2CYR))

class Map:
    """ref position → expected build position: layout scale s (from anchor distances) + local shift of the nearest matched
    texts. Text scale t (from text sizes) is separate: a brand site steps 16→14 px while its layout can grow (1159→1280)."""
    def __init__(self): self.s, self.t, self.A = 1.0, 1.0, []
    def add(self, ea, eb): self.A.append((center(ea['box']), center(eb['box']), ea['id']))
    def __call__(self, p, skip=None):
        c = sorted(((np.linalg.norm(a - p), b - self.s * a) for a, b, i in self.A if i != skip), key=lambda t: t[0])[:4]
        return self.s * p + (np.median([v for _, v in c], 0) if c else 0)

def greedy(cands, pairs, ua, ub, M=None):
    for c in sorted(cands, key=lambda c: c[0]):
        ea, eb = c[1], c[2]
        if ea['id'] in ua or eb['id'] in ub: continue
        pairs.append(c[1:]); ua.add(ea['id']); ub.add(eb['id'])
        if M is not None and len(c) > 3 and c[3] == 1: M.add(ea, eb)

def match(A, B, GA=(), GB=()):
    M, pairs, ua, ub = Map(), [], set(), set()
    TA, TB = [e for e in A if e['kind'] == 'text'], [e for e in B if e['kind'] == 'text']
    na, nb = {e['id']: ntext(e['text']) for e in TA}, {e['id']: ntext(e['text']) for e in TB}
    va, vb = list(na.values()), list(nb.values())
    for ea in TA:                                   # 1. texts that appear once on both screens = anchors
        t = na[ea['id']]
        if va.count(t) == 1 and vb.count(t) == 1 and len(t) > 1:
            eb = next(e for e in TB if nb[e['id']] == t)
            pairs.append((ea, eb, 1.0)); ua.add(ea['id']); ub.add(eb['id'])
    for t in set(va):                               # 1b. the same text N times on both screens: pair in reading order
        if len(t) > 1 and va.count(t) == vb.count(t) > 1:
            xa = sorted((e for e in TA if na[e['id']] == t), key=lambda e: (e['box'][1], e['box'][0]))
            xb = sorted((e for e in TB if nb[e['id']] == t), key=lambda e: (e['box'][1], e['box'][0]))
            for ea, eb in zip(xa, xb):
                pairs.append((ea, eb, 1.0)); ua.add(ea['id']); ub.add(eb['id'])
    r = [eb['size_px'] / ea['size_px'] for ea, eb, _ in pairs if ea['size_px'] >= 10]
    M.t = float(np.median(r)) if r else 1.0
    if abs(M.t - 1) < 0.06: M.t = 1.0
    ca, cb = [center(ea['box']) for ea, _, _ in pairs], [center(eb['box']) for _, eb, _ in pairs]
    d = [np.linalg.norm(cb[i] - cb[j]) / da for i in range(len(ca)) for j in range(i + 1, len(ca))
         if (da := np.linalg.norm(ca[i] - ca[j])) > 40]
    M.s = float(np.median(d)) if len(d) >= 3 else M.t
    if abs(M.s - 1) < 0.03: M.s = 1.0
    for ea, eb, _ in pairs: M.add(ea, eb)
    cands = []                                      # 2. repeated and changed texts, by expected position
    for ea in TA:
        if ea['id'] in ua: continue
        pa = M(center(ea['box']))
        for eb in TB:
            if eb['id'] in ub: continue
            sim = 1.0 if na[ea['id']] == nb[eb['id']] else difflib.SequenceMatcher(None, na[ea['id']], nb[eb['id']]).ratio()
            d = np.linalg.norm(pa - center(eb['box']))
            same_size = abs(ea['size_px'] * M.t - eb['size_px']) <= 4
            if (sim == 1 and d <= 140) or (sim >= 0.75 and d <= 50 and same_size): cands.append(((1 - sim) * 200 + d, ea, eb, sim))
    greedy(cands, pairs, ua, ub, M)
    for ea in TA:                                   # 2a. a text read as part of a longer line on the other screen (OCR joined two labels)
        t = na[ea['id']]
        if ea['id'] in ua or len(t) < 5: continue
        pa = M(center(ea['box']))
        for eb in TB:
            bx, by, bw, bh = eb['box']
            if t in nb[eb['id']] and len(nb[eb['id']]) > len(t) and bx - 40 <= pa[0] <= bx + bw + 40 and abs(pa[1] - (by + bh / 2)) <= 20:
                ea['_part'] = True; pairs.append((ea, eb, 1.0)); ua.add(ea['id']); ub.add(eb['id']); break
    byA, byB, used = {e['id']: e for e in A}, {e['id']: e for e in B}, set()
    gc = []                                         # 2b. a row of icons: group to group, then members left to right
    for ga in GA:
        if not any(byA[i]['kind'] in ('icon', 'image') for i in ga['members']): continue
        pa = M(center(ga['box']))
        for gb in GB:
            d = np.linalg.norm(pa - center(gb['box']))
            if len(gb['members']) == len(ga['members']) and d <= 80: gc.append((d, ga, gb))
    for d, ga, gb in sorted(gc, key=lambda c: c[0]):
        if ('a', ga['id']) in used or ('b', gb['id']) in used: continue
        used |= {('a', ga['id']), ('b', gb['id'])}
        for ea, eb in zip(sorted((byA[i] for i in ga['members']), key=lambda e: e['box'][0]), sorted((byB[i] for i in gb['members']), key=lambda e: e['box'][0])):
            if ea['kind'] == eb['kind'] and ea['id'] not in ua and eb['id'] not in ub:
                pairs.append((ea, eb, None)); ua.add(ea['id']); ub.add(eb['id'])
    for kind, lim in (('image', 70), ('icon', 40), ('line', 40)):   # 3. pictures, icons, lines by position + size
        cands = []
        for ea in (e for e in A if e['kind'] == kind):
            pa = M(center(ea['box']))
            for eb in (e for e in B if e['kind'] == kind and (kind != 'line' or e['orient'] == ea['orient'])):
                d = np.linalg.norm(pa - center(eb['box']))
                if d <= lim: cands.append((d + abs(ea['box'][2] * M.s - eb['box'][2]) + abs(ea['box'][3] * M.s - eb['box'][3]), ea, eb, None))
        greedy(cands, pairs, ua, ub)
    kids = {}
    inA = {id(e) for e in A}
    for e in A + B: kids.setdefault((id(A) if id(e) in inA else id(B), e['parent']), []).append(e)
    def desc(L, b):
        out, st = set(), [b['id']]
        while st:
            for e in kids.get((id(L), st.pop()), []):
                out.add(e['id'])
                if e['kind'] == 'box': st.append(e['id'])
        return out
    fwd = {ea['id']: eb['id'] for ea, eb, _ in pairs}
    cands = []                                      # 4. boxes: the one holding the same things
    for ra in (e for e in A if e['kind'] == 'box' and not e.get('page')):
        da = {fwd[i] for i in desc(A, ra) if i in fwd}
        pa = M(center(ra['box']))
        for rb in (e for e in B if e['kind'] == 'box' and not e.get('page')):
            db = {i for i in desc(B, rb) if any(e['id'] == i and e['kind'] != 'box' for e in B)}
            sz = abs(ra['box'][2] * M.s - rb['box'][2]) / max(rb['box'][2], 1) + abs(ra['box'][3] * M.s - rb['box'][3]) / max(rb['box'][3], 1)
            if da or db:
                j = len(da & db) / max(1, len(da | db))
                if j >= 0.5: cands.append((1 - j + sz * 0.3, ra, rb, None))
            elif np.linalg.norm(pa - center(rb['box'])) <= 30 and sz < 0.3:
                cands.append((0.8 + sz, ra, rb, None))
    greedy(cands, pairs, ua, ub)
    return pairs, M

def rel_weight(E):
    """bold or regular the way a person sees it: against the other texts of the same screen (fonts differ in stroke)"""
    T = [e for e in E if e['kind'] == 'text' and e.get('stroke')]
    v = np.sort([e['stroke'] for e in T])
    if len(v) < 4: return
    cut = max(((len(v[:i]) * len(v[i:]) * (v[i:].mean() - v[:i].mean()) ** 2, (v[i - 1] + v[i]) / 2) for i in range(1, len(v))))[1]
    lo, hi = v[v <= cut], v[v > cut]
    if not len(hi) or hi.mean() / lo.mean() < 1.15: cut = BOLD_AT         # one weight on the whole screen
    for e in T:
        e['wrel'] = 'Bold' if e['stroke'] > cut else 'Regular'
        e['wamb'] = abs(e['stroke'] - cut) / cut < 0.05                    # right on the line: a person can't tell

def cmp(ea, eb, sim, M, bmap):
    s, out = M.s, []
    k = ea['kind']
    if k == 'text':
        if sim < 1: out.append(('TEXT', f'"{ea["text"]}" → "{eb["text"]}"'))
        sa = min(SAP_SIZES, key=lambda v: abs(v - ea['size_px'] * M.t))
        if not ea.get('_part') and sa != eb['size'] and abs(ea['size_px'] * M.t - eb['size_px']) > max(1.5, 0.12 * eb['size_px']):
            out.append(('FONT SIZE', f'"{eb["text"]}" {sa}px → {eb["size"]}px'))
        if not ea.get('_part') and ea.get('wrel', ea['weight']) != eb.get('wrel', eb['weight']) and not (ea.get('wamb') or eb.get('wamb')):
            out.append(('WEIGHT', f'"{eb["text"]}" {ea.get("wrel", ea["weight"])} → {eb.get("wrel", eb["weight"])} (stroke {ea["stroke"]:.3f} → {eb["stroke"]:.3f})'))
    if k in ('text', 'icon', 'line'):
        d = de(rgb(ea['color']), rgb(eb['color']))
        if d > 12:
            ok = sap_colour(ea['color'], eb['color'], k)
            out.append(('COLOUR' + (' (brand→SAP)' if ok else ''), f'{ea.get("text", k)[:30]!s}: {ea["color"]} {ea["token"]} → {eb["color"]} {eb["token"]}'))
    if k == 'icon':
        ta, tb = ea['_thumb'].ravel(), eb['_thumb'].ravel()
        if ta.std() > 0 and tb.std() > 0 and np.corrcoef(ta, tb)[0, 1] < 0.45: out.append(('ICON SHAPE', 'a different icon'))
    tol = max(3, 0.15 * max(ea['box'][2], ea['box'][3]) * s)   # 20 vs 23 px reads as the same icon; 15 vs 21 does not
    if k in ('icon', 'image') and (abs(ea['box'][2] * s - eb['box'][2]) > tol or abs(ea['box'][3] * s - eb['box'][3]) > tol):
        out.append((k.upper() + ' SIZE', f'{ea["box"][2]}×{ea["box"][3]} → {eb["box"][2]}×{eb["box"][3]}'))
    if k == 'image' and np.abs(ea['_rgb'].astype(float) - eb['_rgb'].astype(float)).mean() > 45:
        out.append(('IMAGE CONTENT', 'the picture shows something else'))
    if k == 'box':
        wa, ha = ea['box'][2] * s, ea['box'][3] * s
        if abs(wa - eb['box'][2]) > max(3, 0.03 * wa) or abs(ha - eb['box'][3]) > max(3, 0.03 * ha):
            out.append(('BOX SIZE', f'{ea["box"][2]}×{ea["box"][3]} → {eb["box"][2]}×{eb["box"][3]}'))
        if abs(ea['radius'] - eb['radius']) > 2: out.append(('RADIUS', f'{ea["radius"]} → {eb["radius"]}'))
        if de(rgb(ea['fill']), rgb(eb['fill'])) > 3:
            out.append(('FILL' + (' (brand→SAP)' if sap_colour(ea['fill'], eb['fill'], 'fill') else ''), f'{ea["fill"]} {ea["token"]} → {eb["fill"]} {eb["token"]}'))
        ba, bb = ea.get('border'), eb.get('border')
        if bool(ba) != bool(bb): out.append(('BORDER', f'{"border " + ba + " " + ea["border_token"] if ba else "no border"} → {"border " + bb + " " + eb["border_token"] if bb else "no border"}'))
        elif ba and de(rgb(ba), rgb(bb)) > 8:
            out.append(('BORDER COLOUR' + (' (brand→SAP)' if sap_colour(ba, bb, 'border') else ''), f'{ba} {ea["border_token"]} → {bb} {eb["border_token"]}'))
        elif ba and ea['border_w'] != eb['border_w']: out.append(('BORDER WIDTH', f'{ea["border_w"]}px → {eb["border_w"]}px'))
        if bool(ea.get('shadow')) != bool(eb.get('shadow')): out.append(('SHADOW', f'{"shadow" if ea.get("shadow") else "no shadow"} → {"shadow" if eb.get("shadow") else "no shadow"}'))
        pa, pb = ea.get('padding'), eb.get('padding')
        if pa and pb and max(abs(x * s - y) for x, y in zip(pa, pb)) > 3:
            out.append(('PADDING', f'{"/".join(map(str, pa))} → {"/".join(map(str, pb))} (top/right/bottom/left)'))
    if k != 'box':                                  # inside the same box as in the reference?
        pa, pb = ea['parent'], eb['parent']
        if pa in bmap and bmap[pa] != pb: out.append(('MOVED', f'{ea.get("text", k)[:30]!s} sits in another box'))
        (xa, ya, wa, ha), (xb, yb, wb, hb) = ea['box'], eb['box']
        r = min((np.array([xb + fb * wb, yb + hb / 2]) - M(np.array([xa + fa * wa, ya + ha / 2]), skip=ea['id']) for fa, fb in ((0, 0), (.5, .5), (1, 1))),
                key=lambda v: np.abs(v).max())       # a person sees a text in place when it keeps its left, centre or right edge
        if k == 'text' and not ea.get('_part') and np.abs(r).max() > 6: out.append(('POSITION', f'{ea.get("text", k)[:30]!s} {r[0]:+.0f},{r[1]:+.0f}px from where the reference puts it'))
    if eb.get('sap') == 'control':                 # a real SAP control (Radio Button, Slider, Button): look and height come from the kit
        look = {'ICON SHAPE', 'ICON SIZE', 'COLOUR', 'FILL', 'BORDER', 'BORDER COLOUR', 'BORDER WIDTH', 'RADIUS', 'SHADOW', 'PADDING', 'FONT SIZE', 'WEIGHT'}
        same_w = abs(ea['box'][2] * s - eb['box'][2]) <= max(4, 0.1 * eb['box'][2])      # the width is the builder's choice: still checked
        out = [(f'SAP LOOK · {kd}' if kd in look or (kd == 'BOX SIZE' and same_w) else kd, w) for kd, w in out]
    elif eb.get('sap') == 'icon':                  # a real SAP icon: its drawing is the kit's; its size is still the builder's choice
        out = [(f'SAP LOOK · {kd}' if kd in ('ICON SHAPE', 'COLOUR') else kd, w) for kd, w in out]
    return out

ORDER = ['MISSING', 'EXTRA', 'MOVED', 'TEXT', 'BOX SIZE', 'BORDER', 'BORDER COLOUR', 'BORDER WIDTH', 'RADIUS', 'SHADOW', 'PADDING', 'FILL',
         'ICON SHAPE', 'IMAGE CONTENT', 'FONT SIZE', 'WEIGHT', 'COLOUR', 'ICON SIZE', 'IMAGE SIZE', 'GAP', 'POSITION', 'COLOUR (brand→SAP)']

def label(e):
    return f'"{e["text"][:40]}"' if e['kind'] == 'text' else f'{e["kind"]} {e["box"][2]}×{e["box"][3]}' + (f' fill {e["fill"]}' if e['kind'] == 'box' else '')

def cmd_diff(a):
    os.makedirs(a.out, exist_ok=True)
    RA, ia, fa = read(a.ref, a.lang, a.w_ref, a.out)
    RB, ib, fb = read(a.build, a.lang, a.w, a.out)
    A, B = RA['elements'], RB['elements']
    if a.tree:                                      # which build pixels come from a real SAP component instance
        cover = {k_: np.zeros((RB['frame'][1] + 8, RB['frame'][0] + 8), bool) for k_ in ('control', 'icon')}   # +3 px: the eye's box is a bit looser
        for n in load_tree(a.tree):
            if n['type'] == 'INSTANCE':
                x, y, w, h = n['box']; cover['icon' if str(n['text']).startswith('icon:') else 'control'][max(0, y - 3):y + h + 3, max(0, x - 3):x + w + 3] = True
        for e in B:
            x, y, w, h = e['box']
            for k_ in ('control', 'icon'):
                if w > 0 and h > 0 and cover[k_][y:y + h, x:x + w].mean() >= 0.8: e['sap'] = k_; break
    for E in (A, B): rel_weight(E)
    pairs, M = match(A, B, RA['groups'], RB['groups'])
    bmap = {ea['id']: eb['id'] for ea, eb, _ in pairs if ea['kind'] == 'box'}
    pa_ = next((e for e in A if e.get('page')), None); pb_ = next((e for e in B if e.get('page')), None)
    if pa_ and pb_: bmap[pa_['id']] = pb_['id']
    diffs, ua, ub = [], {ea['id'] for ea, _, _ in pairs}, {eb['id'] for _, eb, _ in pairs}
    for ea, eb, sim in pairs:
        for kind, what in cmp(ea, eb, sim or 1, M, bmap): diffs.append({'kind': kind, 'what': what, 'a': ea, 'b': eb})
    for e in A:
        if e['id'] not in ua and not e.get('page'): diffs.append({'kind': 'MISSING', 'what': label(e), 'a': e, 'b': None})
    for e in B:
        if e['id'] not in ub and not e.get('page'): diffs.append({'kind': 'EXTRA', 'what': label(e), 'a': None, 'b': e})
    gb = {g['id']: g for g in RB['groups']}
    fwd = {ea['id']: eb for ea, eb, _ in pairs}
    for g in RA['groups']:                           # spacing inside groups (icon rows, label + value…)
        mem = [fwd[i] for i in g['members'] if i in fwd]
        ids = {e.get('group') for e in mem}
        if len(mem) == len(g['members']) and len(ids) == 1 and None not in ids and abs(g['gap'] * M.s - gb[ids.pop()]['gap']) > 3:
            G = gb[mem[0]['group']]
            diffs.append({'kind': 'GAP', 'what': f'{len(mem)} items side by side: gap {g["gap"]}px → {G["gap"]}px', 'a': {'box': g['box']}, 'b': {'box': G['box']}})
    diffs.sort(key=lambda d: (ORDER.index(d['kind']) if d['kind'] in ORDER else 99, (d['a'] or d['b'])['box'][1]))
    total = sum(1 for e in A if not e.get('page'))
    expected = lambda d: d['kind'].endswith('(brand→SAP)') or d['kind'].startswith('SAP LOOK')
    bad = {d['a']['id'] for d in diffs if d['a'] and 'id' in d['a'] and not expected(d)}
    eye = round(100 * (total - len(bad)) / max(total, 1))
    # pictures: side by side, numbered; and zoomed pairs
    Hs = max(fa.shape[0], fb.shape[0])
    sheet = np.full((Hs + 24, fa.shape[1] + fb.shape[1] + 24, 3), 255, np.uint8)
    sheet[24:24 + fa.shape[0], :fa.shape[1]] = fa; sheet[24:24 + fb.shape[0], fa.shape[1] + 24:] = fb
    cv2.putText(sheet, 'REFERENCE', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
    cv2.putText(sheet, 'BUILD', (fa.shape[1] + 28, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
    zooms = []
    for n, d in enumerate(diffs, 1):
        c = (220, 30, 30) if d['kind'] == 'MISSING' else (30, 90, 230) if d['kind'] == 'EXTRA' else (240, 140, 0)
        for side, e, dx in (('a', d['a'], 0), ('b', d['b'], fa.shape[1] + 24)):
            if not e: continue
            x, y, w, h = e['box']
            cv2.rectangle(sheet, (dx + x - 1, 24 + y - 1), (dx + x + w, 24 + y + h), c, 1)
            cv2.putText(sheet, str(n), (dx + x + w + 2, 24 + y + 9), cv2.FONT_HERSHEY_SIMPLEX, 0.33, c, 1, cv2.LINE_AA)
        if n <= 24:
            parts = []
            for e, f in ((d['a'], fa), (d['b'], fb)):
                if e is None:                            # show where it should be
                    o = d['a'] or d['b']; e = {'box': list(map(int, [*(M(center(o['box'])) - np.array(o['box'][2:]) / 2), *o['box'][2:]]))} if f is fb else o
                x, y, w, h = e['box']
                x0, y0 = max(0, int(x) - 16), max(0, int(y) - 16)
                crop = f[y0:min(f.shape[0], int(y + h) + 16), x0:min(f.shape[1], int(x + w) + 16)]
                if crop.size == 0: crop = np.full((20, 20, 3), 255, np.uint8)
                z = 120 / crop.shape[0]
                crop = cv2.resize(crop, (min(520, max(1, int(crop.shape[1] * z))), 120), interpolation=cv2.INTER_CUBIC)
                parts.append(crop)
            row = np.full((140, parts[0].shape[1] + parts[1].shape[1] + 30, 3), 255, np.uint8)
            row[20:, :parts[0].shape[1]] = parts[0]; row[20:, parts[0].shape[1] + 30:] = parts[1]
            cv2.putText(row, f'{n} {d["kind"]}', (2, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, c, 1, cv2.LINE_AA)
            zooms.append(row)
    cv2.imwrite(os.path.join(a.out, 'diff-sheet.png'), cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))
    if zooms:
        wz = max(z.shape[1] for z in zooms)
        cv2.imwrite(os.path.join(a.out, 'zooms.png'), cv2.cvtColor(np.vstack([np.pad(z, ((0, 6), (0, wz - z.shape[1]), (0, 0)), constant_values=255) for z in zooms]), cv2.COLOR_RGB2BGR))
    json.dump({'eye_match': eye, 'scale': M.s, 'text_scale': M.t, 'frames': [RA['frame'], RB['frame']],
               'diffs': [{'n': n, 'kind': d['kind'], 'what': d['what'], 'ref': d['a'] and d['a'].get('box'), 'build': d['b'] and d['b'].get('box'),
                          'ref_id': d['a'] and d['a'].get('id'), 'build_id': d['b'] and d['b'].get('id')} for n, d in enumerate(diffs, 1)]},
              open(os.path.join(a.out, 'diff.json'), 'w'), ensure_ascii=False, indent=1)
    fr = '' if RA['frame'] == RB['frame'] else f" · FRAME {RA['frame'][0]}×{RA['frame'][1]} → {RB['frame'][0]}×{RB['frame'][1]}"
    print(f"EYE MATCH {eye}%  ({total - len(bad)} of {total} reference elements look the same · layout ×{M.s:.2f} · text ×{M.t:.2f}{fr})")
    def line(n, d):
        at = f"ref {d['a']['box'][0]},{d['a']['box'][1]}" if d['a'] else ''
        bt = f"build {d['b']['box'][0]},{d['b']['box'][1]}" if d['b'] else ''
        return f"{n:>3} {d['kind']:<13} {d['what']}  [{' → '.join(t for t in (at, bt) if t)}]"
    for n, d in enumerate(diffs, 1):
        if not expected(d) and d['kind'] != 'EXTRA': print(line(n, d))
    extra = [(n, d) for n, d in enumerate(diffs, 1) if d['kind'] == 'EXTRA']
    if extra: print(f"EXTRA in the build ({len(extra)}, not in the %): " + ' · '.join(f"#{n} {d['what']}" for n, d in extra))
    look = [(n, d) for n, d in enumerate(diffs, 1) if d['kind'].startswith('SAP LOOK')]
    if look: print(f"SAP component look (expected, {len(look)}): " + ' · '.join(f"#{n} {d['kind'][11:]} {d['what'][:40]}" for n, d in look))
    info = sum(d['kind'].endswith('(brand→SAP)') for d in diffs)
    if info: print(f"    + {info} brand colours in the reference shown with the closest SAP token (expected)")
    print(f"LOOK: {os.path.join(a.out, 'diff-sheet.png')} (numbers = lines above) · {os.path.join(a.out, 'zooms.png')} (first 24, ref | build) — confirm each line by eye")
    passed = eye >= a.pass_at
    if a.tree and not passed:
        allf = instructions(diffs, pairs, A, B, RA, RB, load_tree(a.tree), M)
        fixes = [f for f in allf if 'no layer found' not in f]
        eye_ = [f for f in allf if 'no layer found' in f]
        body = 'Fix these on the build, exact node ids, nothing else. Then re-run the check.\n\n' + '\n'.join(fixes) + '\n'
        if eye_: body += '\nCHECK BY EYE FIRST (no build layer matched — confirm on zooms.png, may be a reading error):\n' + '\n'.join(eye_) + '\n'
        open(os.path.join(a.out, 'fix.md'), 'w').write(body)
        print(f"FIX LIST ({len(fixes)} + {len(eye_)} to check by eye): {os.path.join(a.out, 'fix.md')}")
        print('\n'.join(fixes))
    print(f"VERDICT: {'PASS — matches the reference' if passed else f'NOT YET — {eye}% < {a.pass_at}%, apply the fix list and re-check'}")
    sys.exit(0 if passed else 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    r = sp.add_parser('read'); r.add_argument('image')
    d = sp.add_parser('diff'); d.add_argument('ref'); d.add_argument('build'); d.add_argument('--w-ref', type=int)
    d.add_argument('--tree', help='geometry.json of the build (build/templates/dump-geometry.use_figma.js) → fix list with node ids')
    d.add_argument('--pass-at', type=int, default=95, help='EYE MATCH %% needed to pass (default 95)')
    sp_ = sp.add_parser('spec'); sp_.add_argument('image'); sp_.add_argument('--no-regions', action='store_true', help='no side panel / repeated card boxes (the old bottom-up reading)'); sp_.add_argument('--text-scale', type=float, help='text size step to SAP (default: 0.85 when body text is 16px, else 1)')
    for p in (r, d, sp_):
        p.add_argument('--w', type=int); p.add_argument('--lang', default='bg', choices=list(LANGS)); p.add_argument('--out', default='see-out')
    a = ap.parse_args()
    if a.cmd == 'read': cmd_read(a)
    elif a.cmd == 'spec': cmd_spec(a)
    else: cmd_diff(a)



# ── fix list: one instruction per mismatch, naming the build's Figma node (needs --tree) ─────
STYLE = {(12, 'Regular'): 'SmallText/LHAuto/Regular', (12, 'Bold'): 'SmallText/LHAuto/Bold', (14, 'Regular'): 'MediumText/LHAuto/Regular',
         (14, 'Bold'): 'MediumText/LHAuto/Bold', (16, 'Regular'): 'LargeText/LHAuto/Regular', (16, 'Bold'): 'H5/Bold',
         (20, 'Regular'): 'H4/Regular', (20, 'Bold'): 'H4/Bold', (24, 'Regular'): 'H3/Regular', (24, 'Bold'): 'H3/Bold',
         (32, 'Regular'): 'H2/Regular', (32, 'Bold'): 'H2/Bold', (48, 'Regular'): 'H1/Regular', (48, 'Bold'): 'H1/Bold'}

def load_tree(path):
    cols = ['id', 'type', 'name', 'x', 'y', 'w', 'h', 'radius', 'stroke', 'fill', 'padding', 'gap', 'layout', 'text']
    return [dict(zip(cols, r), box=[r[3], r[4], r[5], r[6]]) for r in json.load(open(path))]

def iou(a, b):
    ix = max(0, min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])); iy = max(0, min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1]))
    u = area(a) + area(b) - ix * iy
    return ix * iy / u if u else 0

def node_for(e, tree):
    """the build layer a seen element belongs to"""
    if not e or 'box' not in e: return None
    c = center(e['box'])
    if e.get('kind') == 'text':
        t = ntext(e['text'])
        ns = [n for n in tree if n['type'] == 'TEXT' and n['text'] and (ntext(n['text']).startswith(t[:40]) or t.startswith(ntext(n['text'])[:40]))]
        return min(ns, key=lambda n: np.linalg.norm(center(n['box']) - c)) if ns else None
    if e.get('kind') == 'icon':
        ns = [n for n in tree if n['type'] == 'INSTANCE' and np.linalg.norm(center(n['box']) - c) <= 8]
        return min(ns, key=lambda n: area(n['box'])) if ns else None
    ns = [(iou(n['box'], e['box']), n) for n in tree if n['type'] in ('FRAME', 'INSTANCE', 'LINE', 'RECTANGLE')]
    ns = [(v, n) for v, n in ns if v >= 0.6]
    if not ns: return None
    best = max(v for v, _ in ns)
    return min((n for v, n in ns if v >= best - 0.08), key=lambda n: (not (n['fill'] or n['stroke']), -area(n['box'])))

def holder(ids_boxes, tree):
    """smallest build frame that holds all these boxes"""
    u = union(ids_boxes)
    ns = [n for n in tree if n['type'] == 'FRAME' and inside(u, n['box'], 0.98)]
    return min(ns, key=lambda n: area(n['box'])) if ns else None

def nm(n):
    return f'{n["id"]} "{n["name"]}"' if n else '(no layer found — look at the zoom)'

def instructions(diffs, pairs, A, B, RA, RB, tree, M):
    fwd = {ea['id']: eb for ea, eb, _ in pairs}
    kids = {}
    for e in A: kids.setdefault(e['parent'], []).append(e)
    def desc(bid):
        out, st = [], [bid]
        while st:
            for e in kids.get(st.pop(), []):
                out.append(e)
                if e['kind'] == 'box': st.append(e['id'])
        return out
    out = []
    root = tree[0]
    if RA['frame'] != RB['frame']:
        out.append(f'Resize the frame {nm(root)} to {RA["frame"][0]}×{RA["frame"][1]} (now {RB["frame"][0]}×{RB["frame"][1]}).')
    for n_, d in enumerate(diffs, 1):
        a, b, k = d['a'], d['b'], d['kind']
        N = node_for(b, tree) if b else None
        if k == 'COLOUR (brand→SAP)': continue
        if k == 'MISSING' and a['kind'] == 'box':
            inner = [fwd[e['id']] for e in desc(a['id']) if e['id'] in fwd]
            H_ = holder([e['box'] for e in inner], tree) if inner else None
            look = f'fill {a["token"]} ({a["fill"]}), ' + (f'{a["border_w"]}px inside stroke {a["border_token"]}, ' if a.get('border') else 'no stroke, ') + f'radius {a["radius"]}' \
                   + (f', visible inset {"/".join(map(str, a["padding"]))}' if a.get('padding') else '') + (', drop shadow' if a.get('shadow') else '')
            if H_ and iou(H_['box'], [v * M.s for v in a['box']]) >= 0.5:
                out.append(f'{n_}. Style {nm(H_)} as the reference box ({a["box"][2]}×{a["box"][3]}): {look}.')
            elif inner:
                ids = sorted({x['id'] for x in (node_for(e, tree) for e in inner) if x})
                out.append(f'{n_}. Wrap {", ".join(ids[:8])}{"…" if len(ids) > 8 else ""} in one frame {a["box"][2]}×{a["box"][3]}: {look}.')
            else:
                out.append(f'{n_}. Add a box {a["box"][2]}×{a["box"][3]} where the reference has it ({a["box"][0]},{a["box"][1]}): {look}.')
        elif k == 'MISSING':
            p = next((e for e in A if e['id'] == a['parent']), None)
            where = f'inside {nm(node_for(fwd.get(p["id"]), tree))}' if p and p['id'] in fwd else f'at reference {a["box"][0]},{a["box"][1]}'
            what = f'text "{a["text"]}" ({STYLE.get((a["size"], a["weight"]), a["size"])}, {a["token"]})' if a['kind'] == 'text' else \
                   f'{a["kind"]} {a["box"][2]}×{a["box"][3]} colour {a.get("token") or a.get("color")}' + (' (crop it from the reference)' if a['kind'] == 'image' else '')
            out.append(f'{n_}. Add {what} {where}.')
        elif k == 'EXTRA':
            if b['kind'] == 'box': out.append(f'{n_}. Remove fill and stroke of {nm(N)} — the reference has no box there.')
            else: out.append(f'{n_}. Remove {nm(N)} ({label(b)}) — not in the reference.')
        elif k == 'MOVED':
            P = node_for(fwd.get(a['parent']), tree) if a['parent'] in fwd else None
            out.append(f'{n_}. Move {nm(N)} into {nm(P)} (it sits in that box in the reference).')
        elif k == 'TEXT': out.append(f'{n_}. Set the text of {nm(N)} to "{a["text"]}".')
        elif k in ('FONT SIZE', 'WEIGHT'):
            sz = min(SAP_SIZES, key=lambda v: abs(v - a['size_px'] * M.s))
            st_ = STYLE.get((sz, a['weight']), f"{sz}px {a['weight']}")
            out.append(f'{n_}. Set text style of {nm(N)} to {st_}.')
        elif k == 'COLOUR':
            what = 'text fill' if a['kind'] == 'text' else 'icon colour' if a['kind'] == 'icon' else 'stroke'
            out.append(f'{n_}. Bind the {what} of {nm(N)} to {token(rgb(a["color"]), "text" if a["kind"] == "text" else "icon")[0]} (reference {a["color"]}, now {b["color"]}).')
        elif k == 'BOX SIZE': out.append(f'{n_}. Resize {nm(N)} to {round(a["box"][2] * M.s)}×{round(a["box"][3] * M.s)} (now {b["box"][2]}×{b["box"][3]}).')
        elif k == 'RADIUS': out.append(f'{n_}. Set corner radius of {nm(N)} to {a["radius"]} (now {b["radius"]}).')
        elif k == 'FILL': out.append(f'{n_}. Bind the fill of {nm(N)} to {a["token"]} ({a["fill"]}).')
        elif k == 'BORDER':
            out.append(f'{n_}. ' + (f'Add a {a["border_w"]}px inside stroke {a["border_token"]} to {nm(N)}.' if a.get('border') else f'Remove the stroke of {nm(N)}.'))
        elif k == 'BORDER COLOUR': out.append(f'{n_}. Bind the stroke of {nm(N)} to {a["border_token"]}.')
        elif k == 'BORDER WIDTH': out.append(f'{n_}. Set stroke weight of {nm(N)} to {a["border_w"]}.')
        elif k == 'SHADOW': out.append(f'{n_}. ' + (f'Add the card drop shadow to {nm(N)}.' if a.get('shadow') else f'Remove the drop shadow of {nm(N)}.'))
        elif k == 'PADDING':
            now = [int(v) for v in N['padding'].split('/')] if N and N.get('padding') else None
            want = [round(x * M.s - y) for x, y in zip(a['padding'], b['padding'])]
            if now: out.append(f'{n_}. Set padding of {nm(N)} to {"/".join(str(max(0, p + w)) for p, w in zip(now, want))} (now {N["padding"]}) — visible inset must be {"/".join(map(str, a["padding"]))}.')
            else: out.append(f'{n_}. Make the visible inset of {nm(N)} {"/".join(map(str, a["padding"]))} (now {"/".join(map(str, b["padding"]))}) (top/right/bottom/left).')
        elif k == 'ICON SHAPE': out.append(f'{n_}. Swap icon {nm(N)} — the reference shows a different icon (zoom {n_}).')
        elif k == 'IMAGE CONTENT': out.append(f'{n_}. Replace the image of {nm(N)} with reference crop {a["box"]}.')
        elif k in ('ICON SIZE', 'IMAGE SIZE'): out.append(f'{n_}. Resize {nm(N)} to {round(a["box"][2] * M.s)}×{round(a["box"][3] * M.s)} (now {b["box"][2]}×{b["box"][3]}).')
        elif k == 'GAP':
            G = holder([b['box']], tree)
            out.append(f'{n_}. Set the gap of {nm(G)} to {d["what"].split("→")[0].split("gap")[-1].strip()} (now {d["what"].split("→")[1].strip()}).')
        elif k == 'POSITION': out.append(f'{n_}. Move {nm(N)}: {d["what"]}.')
    return out


# ── spec: GATE 1 — the complete structure of the screen, per section, before anything is built ─────────
def sap_step(px, scale):
    """measured text px → SAP size after the density step (consumer sites set body text 16px; SAP Compact 14)"""
    return min(SAP_SIZES, key=lambda v: abs(v - px * scale))

def layout_of(kids):
    """how children sit: one row, a column of rows, the gaps between them"""
    items = [e for e in kids if e['kind'] != 'line' or max(e['box'][2], e['box'][3]) < 200]
    if not items: return {'dir': 'none'}
    rows = []
    for e in sorted(items, key=lambda e: e['box'][1]):
        y0, y1 = e['box'][1], e['box'][1] + e['box'][3]
        for r in rows:
            if min(y1, r[1]) - max(y0, r[0]) >= 0.4 * min(y1 - y0, r[1] - r[0]): r[2].append(e); r[0], r[1] = min(r[0], y0), max(r[1], y1); break
        else: rows.append([y0, y1, [e]])
    rows.sort(key=lambda r: r[0])
    vg = [b[0] - a[1] for a, b in zip(rows, rows[1:])]
    out = {'dir': 'column' if len(rows) > 1 else 'row', 'rows': len(rows)}
    if vg: out['gap'] = int(np.median(vg))
    hg = [q['box'][0] - (p['box'][0] + p['box'][2]) for r in rows for p, q in zip(sorted(r[2], key=lambda e: e['box'][0]), sorted(r[2], key=lambda e: e['box'][0])[1:])]
    if hg: out['row_gap'] = int(np.median(hg))
    return out

RING = ((lambda yy, xx: ((np.hypot(yy - 5.5, xx - 5.5) >= 4.3) & (np.hypot(yy - 5.5, xx - 5.5) <= 6.2)).astype(np.float32))(*np.mgrid[0:12, 0:12]))

RING_DOT = np.maximum(RING, (lambda yy, xx: (np.hypot(yy - 5.5, xx - 5.5) <= 2.4).astype(np.float32))(*np.mgrid[0:12, 0:12]))

def ring(thumb):
    """how much an icon looks like a round radio: an empty ring, or a ring with a dot (selected)"""
    if thumb.std() == 0: return 0.0
    return max(float(np.corrcoef(thumb.ravel(), t.ravel())[0, 1]) for t in (RING, RING_DOT))

def components(R, accent):
    """what a person recognises: radio + label, button, range slider, tab bar, collapse arrow"""
    els = {e['id']: e for e in R['elements']}
    found, used = [], set()
    by_group = {}
    for e in R['elements']:
        if e.get('group'): by_group.setdefault(e['group'], []).append(e)
    for g in by_group.values():                      # radio: a round mark 14–26 px, its label right next to it
        g = sorted(g, key=lambda e: e['box'][0])
        for a, b in zip(g, g[1:]):
            if a['kind'] == 'icon' and b['kind'] == 'text' and 14 <= a['box'][3] <= 26 and 0.7 <= a['box'][2] / a['box'][3] <= 1.3 and ring(a['_thumb']) > 0.3 \
                    and not any(t['kind'] == 'text' and abs(t['box'][0] - b['box'][0]) <= 12 and b['box'][1] + b['box'][3] <= t['box'][1] <= b['box'][1] + b['box'][3] + 30 for t in R['elements']):   # a field label with a value under it (pin + "From Where") is not a radio
                sel = a['token'].startswith('sapContent_Selected') or (accent is not None and de(rgb(a['color']), rgb(accent)) < 25)
                g_ = np.asarray(a.get('_rgb'), float); g_ = g_.mean(axis=2) if g_.ndim == 3 else g_
                square = g_.ndim == 2 and g_.shape[0] >= 8 and np.mean([g_[:2, :2].mean(), g_[:2, -2:].mean(), g_[-2:, :2].mean(), g_[-2:, -2:].mean()]) < g_[6:10, 6:10].mean() - 40   # dark corners, light centre = a square box
                if square:   # inked corners = a square box = a Check Box (2026-10-04: filter check boxes came out as radios)
                    found.append({'component': 'Check Box', 'props': {'Check': 'Unchecked'}, 'text': b['text'], 'box': union([a['box'], b['box']]), 'ids': [a['id'], b['id']]}); used |= {a['id'], b['id']}; continue
                found.append({'component': 'Radio Button', 'props': {'Selected': 'True' if sel else 'False'}, 'text': b['text'], 'box': union([a['box'], b['box']]), 'ids': [a['id'], b['id']]})
                used |= {a['id'], b['id']}
    for b in (e for e in R['elements'] if e['kind'] == 'box' and not e.get('page')):   # button: a filled pill with one word on it
        kids = [e for e in R['elements'] if e['parent'] == b['id']]
        sat = cv2.cvtColor(np.uint8([[rgb(b['fill'])]]), cv2.COLOR_RGB2HSV)[0, 0, 1] > 90
        if sat and len(kids) == 1 and kids[0]['kind'] == 'text' and 20 <= b['box'][3] <= 64:
            found.append({'component': 'Button', 'props': {'Type': 'Primary', 'Form Factor': 'Cozy' if b['box'][3] >= 32 else 'Compact'},
                          'text': kids[0]['text'], 'box': b['box'], 'ids': [b['id'], kids[0]['id']], 'width': b['box'][2]})
            used |= {b['id'], kids[0]['id']}
    lines = [e for e in R['elements'] if e['kind'] == 'line' and e['orient'] == 'h']
    icons = [e for e in R['elements'] if e['kind'] == 'icon' and e['id'] not in used]
    for l in lines:                                  # range slider: a track with a handle at each end
        x0, x1, cy = l['box'][0], l['box'][0] + l['box'][2], l['box'][1] + l['box'][3] / 2
        hs = [i for i in icons if abs(i['box'][1] + i['box'][3] / 2 - cy) <= 8 and (x0 - 40 <= i['box'][0] <= x1 + 20)]
        dur = [e for e in R['elements'] if e['kind'] == 'text' and re.search(r'\d+\s*h\b|\d+\s*m\b|^[A-Z]{3}$', str(e.get('text', '')).strip()) and abs(e['box'][1] + e['box'][3] / 2 - cy) <= 34 and e['box'][0] < x1 + 40 and e['box'][0] + e['box'][2] > x0 - 40]   # duration (1h 52m) or airport code (EWR) touching the line
        if len(hs) >= 2 and l['box'][2] >= 60 and not dur:   # a flight route line has its duration (1h 52m) beside it — not a slider
            bx = union([l['box']] + [h['box'] for h in hs])
            found.append({'component': 'Range Slider', 'props': {'Form Factor': 'Compact'}, 'box': bx, 'ids': [l['id']] + [h['id'] for h in hs]})
            used |= {l['id']} | {h['id'] for h in hs}
    for i in icons:                                  # collapse arrow: a small wide chevron — which way it points
        if i['id'] in used or not (8 <= i['box'][2] <= 26 and i['box'][2] > 1.25 * i['box'][3]): continue
        t = i['_thumb']; up = t[:6].sum() < t[6:].sum()
        found.append({'icon': 'navigation-up-arrow' if up else 'navigation-down-arrow', 'meaning': 'collapse' if up else 'expand', 'box': i['box'], 'ids': [i['id']]})
        used.add(i['id'])
    return found, used

def split(items, axis):
    its = sorted(items, key=lambda n: n['box'][axis])
    groups, end = [], None
    for n in its:
        a0, a1 = n['box'][axis], n['box'][axis] + n['box'][axis + 2]
        if groups and a0 <= end: groups[-1].append(n); end = max(end, a1)
        else: groups.append([n]); end = a1
    return groups

def cut(items):
    """split a set of things at the white gaps, like a person: side by side = row, one under the other = column,
    recursively (the XY-cut); the wider gap decides which way to cut first"""
    if len(items) == 1: return items[0]
    best = None
    for axis in (1, 0):
        its = sorted(items, key=lambda n: n['box'][axis])
        groups, end = [], None
        for n in its:
            a0, a1 = n['box'][axis], n['box'][axis] + n['box'][axis + 2]
            if groups and a0 <= end: groups[-1].append(n); end = max(end, a1)
            else: groups.append([n]); end = a1
        if len(groups) > 1:
            gaps = [min(n['box'][axis] for n in b) - max(n['box'][axis] + n['box'][axis + 2] for n in a) for a, b in zip(groups, groups[1:])]
            if best is None or max(gaps) > best[0]: best = (max(gaps), axis, groups, gaps)
    if not best: return {'type': 'stack', 'box': union([n['box'] for n in items]), 'children': items}
    _, axis, groups, gaps = best
    if axis == 0 and len(groups) >= 3:               # columns that line up in the same bands = rows (a person reads flight rows)
        for n_ in range(len(groups), 2, -1):
            for i0 in range(0, len(groups) - n_ + 1):
                run = groups[i0:i0 + n_]
                flat = [x for g in run for x in g]
                bands = split(flat, 1)
                if len(bands) >= 2 and all(sum(any(x in g for x in b) for g in run) >= 2 for b in bands):
                    rows = {'type': 'column', 'gap': int(np.median([min(x['box'][1] for x in b2) - max(x['box'][1] + x['box'][3] for x in b1) for b1, b2 in zip(bands, bands[1:])])),
                            'box': union([x['box'] for x in flat]), 'children': [cut(b) for b in bands]}
                    rest = groups[:i0] + [[rows]] + groups[i0 + n_:]
                    gg = [min(x['box'][0] for x in b) - max(x['box'][0] + x['box'][2] for x in a) for a, b in zip(rest, rest[1:])]
                    return {'type': 'row', 'gap': int(np.median(gg)) if gg else 0, 'box': union([n['box'] for n in items]),
                            'children': [g[0] if g == [rows] else cut(g) for g in rest]}
    return {'type': 'column' if axis == 1 else 'row', 'gap': int(np.median(gaps)), 'box': union([n['box'] for n in items]),
            'children': [cut(g) for g in groups]}

def cmd_spec(a):
    os.makedirs(a.out, exist_ok=True)
    R, img, f = read(a.image, a.lang, a.w, a.out, regions_=not getattr(a, 'no_regions', False) and os.environ.get('SEE_NO_REGIONS') != '1')
    els = R['elements']
    byid = {e['id']: e for e in els}
    texts = [e for e in els if e['kind'] == 'text']
    brand_src = texts and sum(e['dE'] > 8 for e in texts) > 0.5 * len(texts)
    scale = a.text_scale or (0.85 if brand_src else 1.0)
    # accent = the brand colour of the selected state (the most common saturated text/icon colour)
    hsv_ = lambda h: cv2.cvtColor(np.uint8([[rgb(h)]]), cv2.COLOR_RGB2HSV)[0, 0]
    sats = [e['color'] for e in els if e['kind'] in ('text', 'icon') and hsv_(e['color'])[1] > 120 and hsv_(e['color'])[2] > 120]
    accent = max(set(sats), key=sats.count) if sats else None
    comps, used = components(R, accent)
    ask, brand, shapes_ = [], {}, []
    def node(e):
        if e['kind'] == 'text':
            sz = sap_step(e['size_px'], scale)
            tok = e['token']
            if e['dE'] > 8:
                hsv = cv2.cvtColor(np.uint8([[rgb(e['color'])]]), cv2.COLOR_RGB2HSV)[0, 0]
                if hsv[1] < 90 or hsv[2] < 70: tok = 'sapTextColor' if hsv[2] < 90 else 'sapContent_LabelColor'   # a neutral (or near-black): the role is plain
                else: brand.setdefault(e['color'], []).append(f'text "{e["text"][:24]}"'); tok = '?'
            n = {'type': 'text', 'text': e['text'], 'style': STYLE.get((sz, e['weight']), f'{sz}px {e["weight"]}'), 'measured': f'{e["size"]}px {e["weight"]}',
                 'token': tok, 'color': e['color'], 'box': e['box']}
            if e.get('conf', 1) < 0.5: ask.append(f'text "{e["text"][:30]}": OCR unsure — check the letters on the tile')
            return n
        if e['kind'] == 'icon':
            kind_ = next((k for k in shapes_ if abs(k['w'] - e['box'][2]) <= 3 and abs(k['h'] - e['box'][3]) <= 3 and float(np.corrcoef(k['t'].ravel(), e['_thumb'].ravel())[0, 1] if k['t'].std() and e['_thumb'].std() else 0) > 0.8), None)
            if kind_: kind_['n'] += 1
            else: shapes_.append({'w': e['box'][2], 'h': e['box'][3], 't': e['_thumb'], 'n': 1, 'at': e['box'][:2], 'color': e['color'], 'id': len(shapes_) + 1}); kind_ = shapes_[-1]
            return {'type': 'icon', 'box': e['box'], 'token': e['token'], 'color': e['color'], 'meaning': '?', 'shape': kind_['id']}
        if e['kind'] == 'image': return {'type': 'image', 'crop': e['box'], 'box': e['box']}
        if e['kind'] == 'line': return {'type': 'divider' if e['orient'] == 'h' else 'separator', 'box': e['box'], 'token': e['token'], 'thickness': min(e['box'][2], e['box'][3])}
        n = {'type': 'box', 'box': e['box'], 'size': [e['box'][2], e['box'][3]], 'fill': e['token'], 'fill_hex': e['fill'],
             'border': f'{e["border_w"]}px {e["border_token"]}' if e.get('border') else 'none', 'radius': e['radius'],
             'padding': e.get('padding'), 'shadow': bool(e.get('shadow'))}
        if e.get('region'): n['region'] = e['region']
        if e.get('synthetic'): n['synthetic'] = e['synthetic']
        if e['dE'] > 8: brand.setdefault(e['fill'], []).append(f'box {e["box"][2]}×{e["box"][3]}')
        kids = [k for k in els if k['parent'] == e['id']]
        n['layout'] = layout_of(kids)
        n['children'] = children(kids, e['id'])
        return n
    def children(kids, pid):
        out, done = [], set()
        for c in comps:
            if c['ids'] and byid[c['ids'][0]]['parent'] == pid:
                out.append({'type': 'component' if 'component' in c else 'icon', **{k: v for k, v in c.items() if k != 'ids'}}); done |= set(c['ids'])
        for k in kids:
            if k['id'] not in done and k['id'] not in used: out.append(node(k))
        return [cut(out)] if out else []
    page = next((e for e in els if e.get('page')), None)
    top = [e for e in els if e['parent'] == (page['id'] if page else 0) and not e.get('page')]
    sections = children(top, page['id'] if page else 0)
    if scale != 1: ask.insert(0, f'density: the reference is a brand site — texts step down to SAP Compact (×{scale}: 24→20, 16→14, 14→12, as gold 270:6722). OK?')
    for col, users in sorted(brand.items(), key=lambda kv: -len(kv[1])):
        ask.append(f'brand colour {col} ({token(rgb(col))[0]} nearest) on {len(users)}: {", ".join(users[:4])}{"…" if len(users) > 4 else ""} — which SAP role (selected / link / price / warning / button)?')
    for k in shapes_:
        ask.append(f'icon shape #{k["id"]} {k["w"]}×{k["h"]} ×{k["n"]} (first at {k["at"][0]},{k["at"][1]}, {k["color"]}) — which SAP icon? (router-table icon_meanings)')
    spec = {'frame': {'w': R['frame'][0], 'h': R['frame'][1], 'fill': page['token'] if page else None,
                      'text_scale': scale, 'density': 'Compact' if scale < 1 else 'as measured', 'accent': accent},
            'sections': sections, 'ask': ask}
    json.dump(spec, open(os.path.join(a.out, 'spec.json'), 'w'), ensure_ascii=False, indent=1)
    tiles(img, a.out)
    def show(n, d=0):
        pad = '  ' * d
        t = n['type']
        if t == 'box':
            L = n['layout']
            print(f"{pad}BOX {n['size'][0]}×{n['size'][1]} · fill {n['fill']} · border {n['border']} · radius {n['radius']} · padding {'/'.join(map(str, n['padding'])) if n['padding'] else '-'}"
                  f" · {L.get('dir')}{' gap ' + str(L['gap']) if 'gap' in L else ''}{' · row gap ' + str(L['row_gap']) if 'row_gap' in L else ''}{' · shadow' if n['shadow'] else ''}")
            for c in n['children']: show(c, d + 1)
        elif t in ('row', 'column', 'stack'):
            if len(n['children']) == 1: return show(n['children'][0], d)
            print(f"{pad}{t.upper()}{' gap ' + str(n['gap']) if 'gap' in n else ''}")
            for c in n['children']: show(c, d + 1)
        elif t == 'component': print(f"{pad}{n['component']} {json.dumps(n['props'], ensure_ascii=False)}{' “' + n['text'] + '”' if n.get('text') else ''}{' w' + str(n['width']) if n.get('width') else ''}")
        elif t == 'text': print(f"{pad}text “{n['text'][:60]}” {n['style']} {n['token']}{' (brand ' + n['color'] + ')' if n.get('brand') else ''}")
        elif t == 'icon': print(f"{pad}icon {n.get('icon') or ('shape #' + str(n['shape']) if n.get('shape') else '?')} {n['box'][2]}×{n['box'][3]} {n.get('token', '')}")
        elif t == 'image': print(f"{pad}image/logo crop {n['crop']}")
        else: print(f"{pad}{t} {n['box'][2]}×{n['box'][3]} {n['token']}")
    fr = spec['frame']
    print(f"GATE 1 SPEC · frame {fr['w']}×{fr['h']} fill {fr['fill']} · text scale ×{scale} ({fr['density']}) · accent {accent}")
    for n in spec['sections']: show(n, 1)
    print(f"ASK ({len(ask)}) — answer each before GATE 2:")
    for q in ask: print('  - ' + q)
    print(f"spec: {os.path.join(a.out, 'spec.json')} · tiles: {a.out}/tile-*.png")
    sys.exit(0 if not ask else 1)


if __name__ == '__main__':
    main()
