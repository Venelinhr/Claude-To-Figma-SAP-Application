#!/usr/bin/env python3
"""Read a reference screenshot the way a person reads it: top-left first, then to the right, then down.

Usage: python3 build/measure-ref.py <image> [--scale 1|2] [--crop x,y,w,h] [--depth N] [--json]
  --crop measures inside one region (reference px) — use it on one card / bar / form.

Prints — every number is in BUILD px (the reference is scaled to the SAP frame width first):
  FRAME    build size, SAP breakpoint, scale factor, density
  READ     the sections in reading order: A top, B below A, C left, D right of C ...
           each with box, padding, gaps between its parts, text height → font size, ink token
  BOXES    outlined and filled boxes (fields, chips, cards, buttons) with radius, border/fill token,
           inner padding, and a component guess
  ACCENTS  coloured text / icons (links, green prices, selected tab) with position and token
  COLOURS  page colours → nearest SAP token
Everything is a measurement. Snap to the SAP spacing scale (4/8/16/32/48), do not copy odd values.
"""
import json, os, sys
from collections import Counter
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, 'knowledge', 'live', 'kit.json')
PREFER = ('sapBackgroundColor', 'sapShellColor', 'sapGroup_ContentBackground', 'sapList_Background',
          'sapList_BorderColor', 'sapGroup_TitleBorderColor', 'sapTextColor', 'sapTitleColor',
          'sapContent_LabelColor', 'sapLinkColor', 'sapBrandColor', 'sapButton_Emphasized_Background',
          'sapList_SelectionBackgroundColor', 'sapToolbar_SeparatorColor', 'sapPageHeader_Background',
          'sapObjectHeader_Background', 'sapShell_Background', 'sapNeutralBorderColor',
          'sapInformationBackgroundColor', 'sapField_BorderColor', 'sapList_HeaderBackground',
          'sapPositiveTextColor', 'sapPositiveColor', 'sapList_SelectionBorderColor')
SCALE = 1.0  # reference px → build px, set in main()


def S(v):
    return int(round(v * SCALE))


def SB(b):
    return [S(v) for v in b]


def load_tokens():
    """COLOR variables with their resolved Horizon Light hex."""
    if not os.path.exists(KIT):
        return []
    v = json.load(open(KIT))['vars']

    def res(n, d=0):
        s = v.get(n, '||?').split('|')[2]
        return res(s[1:], d + 1) if s.startswith('→') and d < 8 else s
    out = []
    for name, enc in v.items():
        if enc.split('|')[1] != 'C':
            continue
        h = res(name)
        if len(h) == 7 and h.startswith('#'):
            out.append((name.split('/')[-1], h, np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])))
    return out


def load_text_sizes():
    """Every real SAP text-style font size, sorted: [12, 14, 16, 20, 24, 32, 48, ...]."""
    if not os.path.exists(KIT):
        return []
    t = json.load(open(KIT))['text']
    sizes = set()
    for enc in t.values():
        parts = enc.split('|')
        if len(parts) > 2:
            try:
                sizes.add(int(parts[2]))
            except ValueError:
                pass
    return sorted(sizes)


TOKENS = load_tokens()
TEXT_SIZES = load_text_sizes()


def nearest_text_size(px):
    """Snap a measured font-size estimate to the nearest REAL SAP text-style size —
    never report a raw pixel guess as if it were a design-system value."""
    if not TEXT_SIZES:
        return px
    return min(TEXT_SIZES, key=lambda s: abs(s - px))


# Real component HEIGHTS pulled directly from the SAP Web UI Kit (Figma file
# SILcWzK5uFghKun9jx6D7c), Compact vs Cozy Form Factor — measured, not guessed. Height is
# what's fixed by the design system; width legitimately varies with label/content length,
# so only height is checked. A box whose guessed role is one of these but whose height
# lands far from BOTH the Compact and Cozy value is either the wrong component, a custom
# frame standing in for one, or resized in a way the kit doesn't define.
COMPONENT_HEIGHTS = {
    'Switch': {'Compact': 20, 'Cozy': 24},
    'Check Box': {'Compact': 16, 'Cozy': 22},
    'Button': {'Compact': 26, 'Cozy': 36},
    'Input': {'Compact': 26, 'Cozy': 36},
    'Select': {'Compact': 26, 'Cozy': 36},
    'field': {'Compact': 26, 'Cozy': 36},  # role alias used by find_boxes' guess()
}


def nearest_component_density(role_name, h):
    """Which SAP density (Compact/Cozy) a measured height is closest to, and how far off
    (build px) — None if this role has no known reference height."""
    table = COMPONENT_HEIGHTS.get(role_name)
    if not table:
        return None
    best = min(table.items(), key=lambda kv: abs(kv[1] - h))
    return {'density': best[0], 'expected': best[1], 'measured': h, 'delta': abs(best[1] - h)}


# guess() string (or its prefix before " (" / " —") -> COMPONENT_HEIGHTS key
_GUESS_TO_COMPONENT = {
    'Switch track': 'Switch',
    'Check Box': 'Check Box',
    'Field with label': 'field',
    'Input / Select': 'field',
    'Input / Button': 'field',
}


def component_check(guess, h):
    """For a box whose guessed role is a real SAP interactive component, report how close
    its height is to that component's real Compact/Cozy height. Returns None for roles
    with no known component (cards, chips, avatars — those vary by design, not by kit)."""
    base = guess.split(' (')[0].split(' —')[0].strip()
    comp = _GUESS_TO_COMPONENT.get(base)
    if not comp:
        return None
    return nearest_component_density(comp, h)


def token(rgb, full=False):
    """Nearest SAP colour token; common semantic tokens win ties."""
    if not TOKENS:
        return hexc(rgb)
    rgb = np.array(rgb, dtype=int)
    t = min(TOKENS, key=lambda t: (round(float(np.linalg.norm(t[2] - rgb)) / 6), 0 if t[0] in PREFER else 1, len(t[0])))
    return f'{t[0]} {t[1]} Δ{np.linalg.norm(t[2] - rgb):.0f}' if full else t[0]


def hexc(rgb):
    return '#%02x%02x%02x' % tuple(int(c) for c in rgb)


def components(mask, cell=1):
    """Connected components (4-neighbour) on a boolean grid. Returns (x0,y0,x1,y1,count) in px."""
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y, x in np.argwhere(mask):
        if seen[y, x]:
            continue
        seen[y, x] = True
        stack, n = [(y, x)], 0
        y0 = y1 = y; x0 = x1 = x
        while stack:
            cy, cx = stack.pop(); n += 1
            if cy < y0: y0 = cy
            if cy > y1: y1 = cy
            if cx < x0: x0 = cx
            if cx > x1: x1 = cx
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        out.append((x0 * cell, y0 * cell, (x1 + 1) * cell, (y1 + 1) * cell, n))
    return out


def thin_runs(a, axis, minlen):
    """Every 1-3px line run (not only the longest per row): (pos, start, end, rgb).
    axis=0 → horizontal runs, axis=1 → vertical runs."""
    img = (a if axis == 0 else a.transpose(1, 0, 2)).astype(int)
    H = img.shape[0]
    out = []
    for y in range(2, H - 2):
        on = (np.abs(img[y] - img[y - 2]).sum(1) > 24) & (np.abs(img[y] - img[y + 2]).sum(1) > 24)
        if on.sum() < minlen:
            continue
        d = np.diff(np.concatenate(([0], on.astype(np.int8), [0])))
        for s, e in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if e - s >= minlen:
                out.append((y, int(s), int(e), np.median(img[y, s:e], 0)))
    merged = []  # a 2-3px line shows as 2-3 adjacent rows
    for l in out:
        m = next((m for m in merged[-12:] if 0 < l[0] - m[0] <= 2 and abs(l[1] - m[1]) < 6 and abs(l[2] - m[2]) < 6), None)
        if m:
            continue
        merged.append(l)
    return merged


def ink_box(a, box, bg, inset=3):
    """Bounding box of everything that is not the background inside box, and the ink colour."""
    x0, y0, x1, y1 = box
    sub = a[y0 + inset:y1 - inset, x0 + inset:x1 - inset].astype(int)
    if sub.size == 0:
        return None
    ink = np.abs(sub - np.array(bg)).sum(2) > 60
    ys, xs = np.where(ink.any(1))[0], np.where(ink.any(0))[0]
    if not len(ys):
        return None
    return (x0 + inset + xs[0], y0 + inset + ys[0], x0 + inset + xs[-1] + 1, y0 + inset + ys[-1] + 1)


def ink_colour(a, box, bg):
    """Colour of the strongest ink (text) inside box."""
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].reshape(-1, 3).astype(int)
    if not len(sub):
        return None
    d = np.abs(sub - np.array(bg)).sum(1)
    if d.max() < 60:
        return None
    strong = sub[d >= np.percentile(d, 90)]
    return np.median(strong, 0)


def find_boxes(a, bg):
    """Outlined rectangles (1-3px border, any radius) + filled blocks of one colour.

    Two conflicting needs, both real: (1) a genuine SAP Check Box is only 16-22px, and
    the original minlen=20/14 missed it more often than not; (2) lowering minlen alone
    (tried first) also caught small TEXT fragments/underlines as fake "boxes" — a 41x9
    or 26x11 sliver is text, not a control. Fix: lower minlen to catch small controls,
    but then require near-square aspect ratio (SAP's small controls — Check Box, Radio
    Button, Switch — are square or near-square) OR a minimum absolute size, before
    accepting a small candidate. A genuine wide/short outline (an input field's
    underline-only bottom edge) still needs the old wider minlen, so both thresholds
    run and their results are merged, filtered by shape."""
    H, W, _ = a.shape
    hs, vs = thin_runs(a, 0, 12), thin_runs(a, 1, 12)
    boxes, used = [], set()
    for i, t in enumerate(hs):
        if i in used:
            continue
        ty, tx0, tx1, tc = t
        for j, b in enumerate(hs):
            by, bx0, bx1, _ = b
            if j == i or j in used or by <= ty + 10 or abs(bx0 - tx0) > 4 or abs(bx1 - tx1) > 4:
                continue
            L = [v for v in vs if tx0 - 26 <= v[0] <= tx0 + 2 and v[1] <= ty + 28 and v[2] >= by - 28]
            R = [v for v in vs if tx1 - 3 <= v[0] <= tx1 + 26 and v[1] <= ty + 28 and v[2] >= by - 28]
            if not L or not R:
                continue
            lx, rx = max(v[0] for v in L), min(v[0] for v in R)
            w, h = rx + 1 - lx, by + 1 - ty
            # Bug found while verifying: this filter must reason in BUILD-scale px (what
            # the rest of the tool reports and what the audit compares), not raw image
            # px — a reference shot at 2000px wide with SCALE=0.72 has every raw
            # measurement ~1.4x bigger than the number everyone actually looks at. Using
            # raw px here let a 57x21 raw sliver (= 41x15 at build scale — clearly a text
            # fragment) slip through untouched because 57 > the un-scaled "44" ceiling.
            sw, sh = S(w), S(h)
            # A "small" candidate (fits in a 44x44 box in BUILD px — bigger than any real
            # small SAP control) must be near-square (Check Box/Radio/Switch-like) or
            # sized like a real bordered control (>=14 build-px on the SHORT side);
            # anything under that on its short side, at any width, is a text fragment or
            # underline the lowered minlen picked up — not a component. A wide chip/
            # field/card (short side >=44 build-px) is never subject to this filter.
            if min(sw, sh) < 44 and min(sw, sh) < 14:
                continue
            if max(sw, sh) <= 44 and not (0.5 <= sw / max(sh, 1) <= 2.0):
                continue
            boxes.append({'kind': 'outline', 'box': (lx, ty, rx + 1, by + 1), 'r': max(0, tx0 - lx),
                          'edge': token(tc), 'edge_rgb': tc})
            used.update((i, j))
            break
    # filled blocks: one flat colour, not the page, not thin text
    cell = 2
    sm = a[::cell, ::cell].astype(int)
    q = sm // 8
    keyed = q[..., 0] * 1024 + q[..., 1] * 32 + q[..., 2]
    bgk = (np.array(bg) // 8)
    bgk = bgk[0] * 1024 + bgk[1] * 32 + bgk[2]
    vals, counts = np.unique(keyed, return_counts=True)
    for k, n in zip(vals, counts):
        if k == bgk or n < 120:
            continue
        m = keyed == k
        for x0, y0, x1, y1, cnt in components(m, cell):
            w, h = x1 - x0, y1 - y0
            if w < 20 or h < 16 or cnt * cell * cell < 0.6 * w * h:
                continue
            rgb = np.median(a[y0:y1, x0:x1].reshape(-1, 3), 0)
            if np.abs(rgb - np.array(bg)).sum() < 9:
                continue
            row = a[min(y0 + 1, H - 1), x0:x1].astype(int)
            hit = np.where(np.abs(row - rgb).sum(1) <= 30)[0]
            boxes.append({'kind': 'fill', 'box': (x0, y0, min(x1, W), min(y1, H)), 'r': int(hit[0]) if len(hit) else 0,
                          'fill': token(rgb), 'fill_rgb': rgb})
    # a filled box inside an outline with the same size is the outline's fill (selected chip)
    for f in [b for b in boxes if b['kind'] == 'fill']:
        for o in [b for b in boxes if b['kind'] == 'outline']:
            if all(abs(f['box'][k] - o['box'][k]) <= 5 for k in range(4)):
                o['fill'], o['fill_rgb'] = f['fill'], f['fill_rgb']
                boxes.remove(f); break
    for b in boxes:
        inner_bg = b.get('fill_rgb', bg)
        ib = ink_box(a, b['box'], inner_bg)
        x0, y0, x1, y1 = b['box']
        if ib:
            b['pad'] = [ib[1] - y0, x1 - ib[2], y1 - ib[3], ib[0] - x0]  # T R B L
            c = ink_colour(a, ib, inner_bg)
            if c is not None:
                b['ink'] = token(c)
                b['ink_rgb'] = c
        b['guess'] = guess(b)
    boxes.sort(key=lambda b: (b['box'][1] // 12, b['box'][0]))
    return boxes


def guess(b):
    """Component guess from shape, in build px."""
    x0, y0, x1, y1 = b['box']
    w, h, r = S(x1 - x0), S(y1 - y0), S(b['r'])
    if b['kind'] == 'fill':
        rgb = b['fill_rgb']
        sat = rgb.max() - rgb.min()
        if abs(w - h) <= 4 and r >= w / 2 - 3:
            return 'Avatar / icon circle' if w >= 24 else 'dot'
        if sat > 80 and h <= 48:
            return f'Button Primary ({"Cozy" if h >= 32 else "Compact"})'
        if h <= 40 and w <= 80 and r >= h / 2 - 3:
            return 'Switch track'
        return 'filled panel / selected item'
    if h >= 70 and w >= 280:
        return 'Card / list item'
    if h >= 34 and w >= 150:
        return 'Field with label (Label + Input/Select)' if h >= 44 else 'Input / Select'
    if h >= 40 and w < 280:
        return 'Tile / chip' + (' — SELECTED' if b.get('fill') else '')
    if abs(w - h) <= 3 and h <= 24:
        return 'Check Box'
    if h <= 40:
        return 'Input / Button (outline)'
    return 'box'


def accents(a, bg):
    """Coloured (saturated) text/icons grouped into words: links, green prices, selected tab, logos."""
    img = a.astype(int)
    sat = img.max(2) - img.min(2)
    m = (sat > 70) & (np.abs(img - np.array(bg)).sum(2) > 90)
    if not m.any():
        return []
    g = m[::2, ::2]
    dil = g.copy()  # join letters into words
    for s in range(1, 5):
        dil[:, s:] |= g[:, :-s]; dil[:, :-s] |= g[:, s:]
    dil[1:] |= g[:-1]; dil[:-1] |= g[1:]
    out = []
    for x0, y0, x1, y1, n in components(dil, 2):
        if (x1 - x0) * (y1 - y0) < 60:
            continue
        pix = img[y0:y1, x0:x1][m[y0:y1, x0:x1]]
        if len(pix) < 12:
            continue
        rgb = np.median(pix, 0)
        out.append({'box': (x0, y0, x1, y1), 'hex': hexc(rgb), 'token': token(rgb)})
    out.sort(key=lambda o: (o['box'][1] // 12, o['box'][0]))
    return out


def _seps(sub, axis, tol=14):
    """Boolean per row (axis=0) / column (axis=1): True when >=97% of its pixels match its median colour."""
    arr = sub if axis == 0 else sub.transpose(1, 0, 2)
    med = np.median(arr, 1, keepdims=True)
    return (np.abs(arr - med).sum(2) <= tol).mean(1) >= 0.97


def _runs(flags, want):
    out, start = [], None
    for i, f in enumerate(list(flags) + [not want]):
        if f == want and start is None: start = i
        elif f != want and start is not None: out.append((start, i)); start = None
    return out


def xycut(a, box, depth=0, maxd=6, minsz=10, rel=0.7):
    """Recursive XY-cut that groups like a person: at each level cut on the axis with the widest
    blank band, and only at bands at least `rel` × that width. Small gaps stay inside a group."""
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].astype(int)
    node = {'box': [x0, y0, x1 - x0, y1 - y0]}
    if depth >= maxd or min(x1 - x0, y1 - y0) < minsz:
        return node
    best = None
    for axis in (0, 1):
        sep = _seps(sub, axis)
        blocks = [(s, e) for s, e in _runs(sep, False) if e - s >= 2]
        if len(blocks) < 2:
            continue
        gaps = [blocks[i + 1][0] - blocks[i][1] for i in range(len(blocks) - 1)]
        if best is None or max(gaps) > best[0]:
            best = (max(gaps), axis, sep, blocks, gaps)
    if not best or best[0] < 3:
        return node
    g, axis, sep, blocks, gaps = best
    merged = [list(blocks[0])]
    for (s, e), gp in zip(blocks[1:], gaps):
        if gp >= max(3, rel * g): merged.append([s, e])
        else: merged[-1][1] = e
    blocks = [tuple(b) for b in merged]
    bgpix = sub[sep] if axis == 0 else sub[:, sep]
    node['bg'] = np.median(bgpix.reshape(-1, 3), 0)
    node['split'] = 'rows' if axis == 0 else 'cols'
    node['gaps'] = [int(blocks[i + 1][0] - blocks[i][1]) for i in range(len(blocks) - 1)]
    kids = []
    for s, e in blocks:
        cb = (x0, y0 + s, x1, y0 + e) if axis == 0 else (x0 + s, y0, x0 + e, y1)
        csub = a[cb[1]:cb[3], cb[0]:cb[2]].astype(int)
        ob = _runs(_seps(csub, 1 - axis), False)
        if ob:  # trim the child on the other axis
            if axis == 0: cb = (cb[0] + ob[0][0], cb[1], cb[0] + ob[-1][1], cb[3])
            else: cb = (cb[0], cb[1] + ob[0][0], cb[2], cb[1] + ob[-1][1])
        kids.append(xycut(a, cb, depth + 1, maxd, minsz, rel))
    node['kids'] = kids
    return node


def where(i, n, split):
    if n == 1:
        return 'only'
    if split == 'rows':
        return 'top' if i == 0 else ('bottom' if i == n - 1 else 'middle') if n > 2 else ('top', 'bottom')[i]
    return 'left' if i == 0 else ('right' if i == n - 1 else 'middle') if n > 2 else ('left', 'right')[i]


def label(parent, i):
    if not parent:
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] if i < 26 else f'Z{i}'
    return f'{parent}.{i + 1}'


def read_order(a, node, boxes, pg_bg, out, name='', pos='page', depth=0, maxd=4, limit=70):
    """Print sections in reading order with position words, padding, gaps, text size, ink colour."""
    if len(out) >= limit:
        return
    x, y, w, h = node['box']
    if (w < 8 or h < 6) and depth:
        return
    own = [b for b in boxes if abs(b['box'][0] - x) <= 6 and abs(b['box'][1] - y) <= 6
           and abs(b['box'][2] - (x + w)) <= 6 and abs(b['box'][3] - (y + h)) <= 6]
    inside = [b for b in boxes if b not in own and b['box'][0] >= x - 2 and b['box'][1] >= y - 2
              and b['box'][2] <= x + w + 2 and b['box'][3] <= y + h + 2]
    ind = '  ' * depth
    tag = f'{ind}{name or "PAGE"} {pos:<6} {SB(node["box"])}'
    if own:
        b = own[0]
        tag += f"  = BOX {b['guess']}"
    if 'split' in node:
        kids = node['kids']
        tag += f"  → {len(kids)} {'rows (top→bottom)' if node['split'] == 'rows' else 'cols (left→right)'}"
        if node['gaps']:
            gs = [S(v) for v in node['gaps']]
            tag += f"  gap {gs[0] if len(set(gs)) == 1 else gs[:8]}"
        bgt = token(node['bg'])
        if np.abs(node['bg'] - np.array(pg_bg)).sum() > 9:
            tag += f'  bg {bgt}'
        if inside and depth < maxd:
            kinds = Counter(b['guess'].split(' (')[0].split(' —')[0] for b in inside)
            tag += '  holds ' + ', '.join(f'{n}× {k}' for k, n in kinds.most_common(4))
        out.append(tag)
        if depth >= maxd:
            return
        for i, k in enumerate(kids):
            read_order(a, k, boxes, pg_bg, out, label(name, i), where(i, len(kids), node['split']), depth + 1, maxd, limit)
    else:
        c = ink_colour(a, (x, y, x + w, y + h), pg_bg)
        if h <= 60 and c is not None:
            # text line: ink height with descenders ≈ 0.93 × font size, caps only ≈ 0.72;
            # snap the midpoint estimate to the nearest REAL SAP text-style size (12/14/
            # 16/20/24/32/48), not a raw pixel guess — that's the number to build with.
            est = S(h) / 0.83  # midpoint of the 0.93-0.72 range
            snapped = nearest_text_size(est)
            tag += f'  text h{S(h)} → {snapped}px SAP size (raw est. ~{round(est)}px), ink {token(c)}'
        elif c is not None:
            tag += f'  ink {token(c)}'
        out.append(tag)


def main():
    global SCALE
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    path = args[0]
    raw = Image.open(path)
    if '--scale' in args:
        scale = float(args[args.index('--scale') + 1])
    else:
        dpi = (raw.info.get('dpi') or (72, 72))[0]
        scale = 2.0 if dpi and dpi > 110 else 1.0
    im = raw.convert('RGB')
    if scale != 1:
        im = im.resize((round(im.width / scale), round(im.height / scale)), Image.LANCZOS)
    a = np.asarray(im)
    H, W, _ = a.shape
    R = {'image': os.path.basename(path), 'scale': scale, 'size': [W, H]}
    depth = int(args[args.index('--depth') + 1]) if '--depth' in args else 4
    if '--crop' in args:
        cx, cy, cw, ch = (int(v) for v in args[args.index('--crop') + 1].split(','))
        a = np.ascontiguousarray(a[cy:cy + ch, cx:cx + cw])
        H, W, _ = a.shape
        R['crop'] = [cx, cy]

    # page background = most common colour on the outer edge
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]).astype(int)
    pg_bg = np.array(Counter(map(tuple, edge // 4)).most_common(1)[0][0]) * 4 + 2
    pg_bg = np.median(edge[(np.abs(edge - pg_bg).sum(1) <= 12)], 0)

    # FRAME: a full screen snaps to the nearest SAP width and EVERY number is scaled with it;
    # a component crop keeps its measured size.
    fw, fh = (8 * round(v / 8) for v in (W, H))
    std = [(768, 'tablet 768'), (1024, 'M 1024'), (1280, 'L 1280'), (1440, 'XL 1440')]
    is_screen = fw >= 700 and fh >= 500
    snap, bp = min(std, key=lambda s: abs(s[0] - fw)) if is_screen else (fw, 'crop')
    SCALE = snap / W if is_screen else 1.0
    hint = 'ask: mobile / tablet / desktop?' if not is_screen and W / max(H, 1) < 0.9 and H > 500 else ''

    boxes = find_boxes(a, pg_bg)
    acc = accents(a, pg_bg)
    btn = [S(b['box'][3] - b['box'][1]) for b in boxes if b['guess'].startswith(('Button', 'Input', 'Field'))]
    ctl = min(btn) if btn else None
    dens = 'unknown' if ctl is None else ('Cozy' if ctl >= 32 else 'Compact')
    R['frame'] = {'build': [snap if is_screen else fw, S(H)], 'breakpoint': bp, 'measured': [W, H],
                  'scale': round(SCALE, 3), 'density': dens, 'hint': hint}
    layout = xycut(a, (0, 0, W, H), maxd=depth + 3)
    order = []
    read_order(a, layout, boxes, pg_bg, order, maxd=depth)

    flat = a.reshape(-1, 3)[::3].astype(int)
    q = flat // 6
    cnt = Counter(map(tuple, q))
    total = sum(cnt.values())
    dom = [(np.round(flat[(q == np.array(c)).all(1)].mean(0)), n / total) for c, n in cnt.most_common(8) if n / total > 0.01]
    R['colours'] = [{'hex': hexc(c), 'share': round(s, 3), 'token': token(c, True)} for c, s in dom]
    R['read'] = order
    def xyxy_to_xywh(b):
        x0, y0, x1, y1 = b
        return SB([x0, y0, x1 - x0, y1 - y0])
    def rgbhex(b, k):
        v = b.get(k + '_rgb')
        return hexc(v) if v is not None else None
    def cc(b):
        h = S(b['box'][3] - b['box'][1])
        return component_check(b['guess'], h)
    R['boxes'] = [{'box': xyxy_to_xywh(b['box']), 'kind': b['kind'], 'r': S(b['r']), 'guess': b['guess'],
                   **{k: b[k] for k in ('edge', 'fill', 'ink') if k in b},
                   **{k + '_hex': rgbhex(b, k) for k in ('edge', 'fill', 'ink') if rgbhex(b, k)},
                   **({'pad': [S(v) for v in b['pad']]} if 'pad' in b else {}),
                   **({'component_check': cc(b)} if cc(b) else {})} for b in boxes]
    R['accents'] = [{'box': xyxy_to_xywh(o['box']), 'hex': o['hex'], 'token': o['token']} for o in acc]

    if '--json' in args:
        print(json.dumps(R, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))); return
    f = R['frame']
    note = f" (measured {W}x{H} → SAP {bp}, all numbers ×{f['scale']})" if is_screen else ' (crop — measured size)'
    print(f"FRAME → build {f['build'][0]}x{f['build'][1]}{note}  · density {dens} (smallest control h{ctl})"
          + (f"  · {hint}" if hint else ''))
    print(f"page bg {token(pg_bg, True)}" + (f"  · CROP at {R['crop']} (reference px)" if 'crop' in R else ''))
    print('\nREAD (top-left → right, then down · [x,y,w,h] · letters = sections, .n = parts inside):')
    print('\n'.join(order))
    print('\nBOXES ([x,y,w,h] · radius · border/fill token · pad T/R/B/L · ink · guess · SAP density):')
    for b in R['boxes'][:40]:
        paint = ' '.join(f'{k} {b[k]}' for k in ('edge', 'fill') if k in b)
        pad = f" pad {'/'.join(map(str, b['pad']))}" if 'pad' in b else ''
        cc = b.get('component_check')
        cctxt = f"  [SAP {cc['density']} h{cc['expected']}, measured h{cc['measured']}{' Δ'+str(cc['delta']) if cc['delta'] else ' — exact'}]" if cc else ''
        print(f"  {b['box']} r{b['r']} {paint}{pad}{' ink ' + b['ink'] if 'ink' in b else ''}  → {b['guess']}{cctxt}")
    print('\nACCENTS (coloured text / icons · [x,y,w,h] · token):')
    for o in R['accents'][:30]:
        print(f"  {o['box']} {o['hex']} → {o['token']}")
    print('\nCOLOURS (share → nearest SAP token):')
    for c in R['colours']:
        print(f"  {c['hex']} {c['share']:.0%}  → {c['token']}")


if __name__ == '__main__':
    main()
