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
        l['text'] = ' '.join(g['text'] for g in hit); l['conf'] = conf
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
            if w is not None and junk(w['t'], lang, edge=n in (0, len(words) - 1)):
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
            c = np.median(f[y:y + h, x:x + w].reshape(-1, 3), 0)
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
        corner = False                               # the rounded corner of a bordered box is not an icon
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


def read(path, lang='bg', w=None, tmp_dir=None):
    img = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
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
    return re.sub(r'^[•·.,:;\-–]+|[•·.,:;\-–]+$', '', re.sub(r'[\s|]+', '', t.lower()).translate(LAT2CYR))

class Map:
    """ref position → expected build position: global scale (from text sizes) + local shift of the nearest matched texts"""
    def __init__(self): self.s, self.A = 1.0, []
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
    M.s = float(np.median(r)) if r else 1.0
    if abs(M.s - 1) < 0.06: M.s = 1.0
    for ea, eb, _ in pairs: M.add(ea, eb)
    cands = []                                      # 2. repeated and changed texts, by expected position
    for ea in TA:
        if ea['id'] in ua: continue
        pa = M(center(ea['box']))
        for eb in TB:
            if eb['id'] in ub: continue
            sim = 1.0 if na[ea['id']] == nb[eb['id']] else difflib.SequenceMatcher(None, na[ea['id']], nb[eb['id']]).ratio()
            d = np.linalg.norm(pa - center(eb['box']))
            same_size = abs(ea['size_px'] * M.s - eb['size_px']) <= 4
            if (sim == 1 and d <= 140) or (sim >= 0.75 and d <= 50 and same_size): cands.append(((1 - sim) * 200 + d, ea, eb, sim))
    greedy(cands, pairs, ua, ub, M)
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

def cmp(ea, eb, sim, M, bmap):
    s, out = M.s, []
    k = ea['kind']
    if k == 'text':
        if sim < 1: out.append(('TEXT', f'"{ea["text"]}" → "{eb["text"]}"'))
        sa = min(SAP_SIZES, key=lambda v: abs(v - ea['size_px'] * s))
        if sa != eb['size']: out.append(('FONT SIZE', f'"{eb["text"]}" {sa}px → {eb["size"]}px'))
        if ea['weight'] != eb['weight']: out.append(('WEIGHT', f'"{eb["text"]}" {ea["weight"]} → {eb["weight"]}'))
    if k in ('text', 'icon', 'line'):
        d = de(rgb(ea['color']), rgb(eb['color']))
        if d > 12:
            brand = token(rgb(ea['color']))[1] > 8
            out.append(('COLOUR' + (' (brand→SAP)' if brand else ''), f'{ea.get("text", k)[:30]!s}: {ea["color"]} {ea["token"]} → {eb["color"]} {eb["token"]}'))
    if k == 'icon':
        ta, tb = ea['_thumb'].ravel(), eb['_thumb'].ravel()
        if ta.std() > 0 and tb.std() > 0 and np.corrcoef(ta, tb)[0, 1] < 0.45: out.append(('ICON SHAPE', 'a different icon'))
    if k in ('icon', 'image') and (abs(ea['box'][2] * s - eb['box'][2]) > 3 or abs(ea['box'][3] * s - eb['box'][3]) > 3):
        out.append((k.upper() + ' SIZE', f'{ea["box"][2]}×{ea["box"][3]} → {eb["box"][2]}×{eb["box"][3]}'))
    if k == 'image' and np.abs(ea['_rgb'].astype(float) - eb['_rgb'].astype(float)).mean() > 45:
        out.append(('IMAGE CONTENT', 'the picture shows something else'))
    if k == 'box':
        wa, ha = ea['box'][2] * s, ea['box'][3] * s
        if abs(wa - eb['box'][2]) > max(3, 0.03 * wa) or abs(ha - eb['box'][3]) > max(3, 0.03 * ha):
            out.append(('BOX SIZE', f'{ea["box"][2]}×{ea["box"][3]} → {eb["box"][2]}×{eb["box"][3]}'))
        if abs(ea['radius'] - eb['radius']) > 2: out.append(('RADIUS', f'{ea["radius"]} → {eb["radius"]}'))
        if de(rgb(ea['fill']), rgb(eb['fill'])) > 3: out.append(('FILL', f'{ea["fill"]} {ea["token"]} → {eb["fill"]} {eb["token"]}'))
        ba, bb = ea.get('border'), eb.get('border')
        if bool(ba) != bool(bb): out.append(('BORDER', f'{"border " + ba + " " + ea["border_token"] if ba else "no border"} → {"border " + bb + " " + eb["border_token"] if bb else "no border"}'))
        elif ba and de(rgb(ba), rgb(bb)) > 8: out.append(('BORDER COLOUR', f'{ba} {ea["border_token"]} → {bb} {eb["border_token"]}'))
        elif ba and ea['border_w'] != eb['border_w']: out.append(('BORDER WIDTH', f'{ea["border_w"]}px → {eb["border_w"]}px'))
        if bool(ea.get('shadow')) != bool(eb.get('shadow')): out.append(('SHADOW', f'{"shadow" if ea.get("shadow") else "no shadow"} → {"shadow" if eb.get("shadow") else "no shadow"}'))
        pa, pb = ea.get('padding'), eb.get('padding')
        if pa and pb and max(abs(x * s - y) for x, y in zip(pa, pb)) > 3:
            out.append(('PADDING', f'{"/".join(map(str, pa))} → {"/".join(map(str, pb))} (top/right/bottom/left)'))
    if k != 'box':                                  # inside the same box as in the reference?
        pa, pb = ea['parent'], eb['parent']
        if pa in bmap and bmap[pa] != pb: out.append(('MOVED', f'{ea.get("text", k)[:30]!s} sits in another box'))
        r = center(eb['box']) - M(center(ea['box']), skip=ea['id'])
        if k == 'text' and np.abs(r).max() > 6: out.append(('POSITION', f'{ea.get("text", k)[:30]!s} {r[0]:+.0f},{r[1]:+.0f}px from where the reference puts it'))
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
    bad = {d['a']['id'] for d in diffs if d['a'] and 'id' in d['a'] and d['kind'] != 'COLOUR (brand→SAP)'}
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
    json.dump({'eye_match': eye, 'scale': M.s, 'frames': [RA['frame'], RB['frame']],
               'diffs': [{'n': n, 'kind': d['kind'], 'what': d['what'], 'ref': d['a'] and d['a'].get('box'), 'build': d['b'] and d['b'].get('box'),
                          'ref_id': d['a'] and d['a'].get('id'), 'build_id': d['b'] and d['b'].get('id')} for n, d in enumerate(diffs, 1)]},
              open(os.path.join(a.out, 'diff.json'), 'w'), ensure_ascii=False, indent=1)
    fr = '' if RA['frame'] == RB['frame'] else f" · FRAME {RA['frame'][0]}×{RA['frame'][1]} → {RB['frame'][0]}×{RB['frame'][1]}"
    real = [d for d in diffs if d['kind'] != 'COLOUR (brand→SAP)']
    print(f"EYE MATCH {eye}%  ({total - len(bad)} of {total} reference elements look the same · scale ×{M.s:.2f}{fr})")
    for n, d in enumerate(diffs, 1):
        if d['kind'] == 'COLOUR (brand→SAP)': continue
        at = f"ref {d['a']['box'][0]},{d['a']['box'][1]}" if d['a'] else ''
        bt = f"build {d['b']['box'][0]},{d['b']['box'][1]}" if d['b'] else ''
        print(f"{n:>3} {d['kind']:<13} {d['what']}  [{' → '.join(t for t in (at, bt) if t)}]")
    info = len(diffs) - len(real)
    if info: print(f"    + {info} brand colours in the reference mapped to SAP tokens (expected, not listed)")
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
    for p in (r, d):
        p.add_argument('--w', type=int); p.add_argument('--lang', default='bg', choices=list(LANGS)); p.add_argument('--out', default='see-out')
    a = ap.parse_args()
    if a.cmd == 'read': cmd_read(a)
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


if __name__ == '__main__':
    main()
