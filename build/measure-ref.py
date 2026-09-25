#!/usr/bin/env python3
"""Measure a reference screenshot so the build uses NUMBERS, not guesses.

Usage: python3 build/measure-ref.py <image> [--scale 1|2] [--crop x,y,w,h] [--depth N] [--json]
  --crop measures inside one region (logical px) — use it on each card / bar / form you see.

Prints (all values in logical px = Figma px; 2x screenshots are auto-detected by DPI):
  - canvas size, page background colour -> nearest SAP token
  - dominant surface colours -> nearest SAP tokens
  - long 1px lines (dividers / region edges): shell bottom, side-nav edge, header rules
  - surfaces (cards, panels, bars): x, y, w, h, fill token, corner radius guess
  - per surface: inner padding (left/top/right), content rows (y:h) and the gaps between them
Everything is a measurement. Snap to the SAP spacing scale in the skill, do not copy odd values.
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
          'sapInformationBackgroundColor', 'sapField_BorderColor', 'sapList_HeaderBackground')


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
            short = name.split('/')[-1]
            out.append((short, h, np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])))
    return out


TOKENS = load_tokens()


def token(rgb):
    """Nearest SAP colour token; common semantic tokens win ties."""
    if not TOKENS:
        return '#%02x%02x%02x' % tuple(int(c) for c in rgb)
    rgb = np.array(rgb, dtype=int)
    t = min(TOKENS, key=lambda t: (round(float(np.linalg.norm(t[2] - rgb))), 0 if t[0] in PREFER else 1, len(t[0])))
    return '%s %s Δ%d' % (t[0], t[1], np.linalg.norm(t[2] - rgb))


def hexc(rgb):
    return '#%02x%02x%02x' % tuple(int(c) for c in rgb)


def components(mask, cell):
    """Connected components on a boolean grid (4-neighbour). Returns boxes in px + cell count."""
    H, W = mask.shape
    lab = np.zeros((H, W), np.int32)
    boxes, cur = [], 0
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not lab[y, x]:
                cur += 1
                stack = [(y, x)]
                lab[y, x] = cur
                y0 = y1 = y; x0 = x1 = x; n = 0
                while stack:
                    cy, cx = stack.pop(); n += 1
                    y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = cur; stack.append((ny, nx))
                boxes.append((x0 * cell, y0 * cell, (x1 + 1) * cell, (y1 + 1) * cell, n))
    return boxes


def lines(a, axis, min_frac=0.25):
    """Long thin rules: rows (axis=0) or columns (axis=1) where a long run of pixels differs
    from the pixels 2px before AND after it — a 1-2px line, not the edge of a fill."""
    img = (a if axis == 0 else a.transpose(1, 0, 2)).astype(int)
    H, W, _ = img.shape
    out = []
    for y in range(2, H - 2):
        on = (np.abs(img[y] - img[y - 2]).sum(1) > 24) & (np.abs(img[y] - img[y + 2]).sum(1) > 24)
        if on.sum() < max(40, W * min_frac):
            continue
        d = np.diff(np.concatenate(([0], on.astype(int), [0])))
        starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
        i = int(np.argmax(ends - starts))
        if ends[i] - starts[i] >= max(40, W * min_frac):
            out.append((y, int(starts[i]), int(ends[i]), np.median(img[y, starts[i]:ends[i]], 0)))
    merged = []
    for l in out:  # a 2px rule shows as two adjacent rows
        if merged and l[0] - merged[-1][0] <= 1 and abs(l[1] - merged[-1][1]) < 8:
            continue
        merged.append(l)
    return merged


def rows_in(a, box, surf):
    """Content rows + padding inside a surface box."""
    x0, y0, x1, y1 = box
    sub = a[y0 + 2:y1 - 2, x0 + 2:x1 - 2].astype(int)
    if sub.size == 0:
        return None
    ink = np.abs(sub - np.array(surf)).sum(2) > 60
    ys = np.where(ink.any(1))[0]; xs = np.where(ink.any(0))[0]
    if not len(ys):
        return None
    rows, s = [], ys[0]
    for i in range(1, len(ys)):
        if ys[i] != ys[i - 1] + 1:
            rows.append((s, ys[i - 1])); s = ys[i]
    rows.append((s, ys[-1]))
    return dict(pad_left=int(xs[0]) + 2, pad_top=int(ys[0]) + 2, pad_right=int(sub.shape[1] - xs[-1]) + 1,
                rows=[(int(r0) + 2, int(r1 - r0 + 1)) for r0, r1 in rows],
                gaps=[int(rows[i + 1][0] - rows[i][1] - 1) for i in range(len(rows) - 1)])


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


def xycut(a, box, depth=0, maxd=6, minsz=10):
    """Recursive XY-cut: split a region along full-width/height blank bands. Returns a layout tree."""
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1].astype(int)
    node = {'box': [x0, y0, x1 - x0, y1 - y0]}
    if depth >= maxd or min(x1 - x0, y1 - y0) < minsz:
        return node
    for axis in (0, 1):
        sep = _seps(sub, axis)
        blocks = [(s, e) for s, e in _runs(sep, False) if e - s >= 2]
        if len(blocks) < 2 and not (blocks and (blocks[0][0] > 0 or blocks[0][1] < len(sep))):
            continue
        if len(blocks) < 2:  # single block with padding around it: record padding, trim, and try the other axis
            continue
        bgpix = sub[sep] if axis == 0 else sub[:, sep]
        bg = np.median(bgpix.reshape(-1, 3), 0)
        node['bg'] = hexc(bg)
        node['split'] = 'rows' if axis == 0 else 'cols'
        node['pad'] = [int(blocks[0][0]), int(len(sep) - blocks[-1][1])]
        node['gaps'] = [int(blocks[i + 1][0] - blocks[i][1]) for i in range(len(blocks) - 1)]
        kids = []
        for s, e in blocks:
            cb = (x0, y0 + s, x1, y0 + e) if axis == 0 else (x0 + s, y0, x0 + e, y1)
            # trim the child on the other axis
            csub = a[cb[1]:cb[3], cb[0]:cb[2]].astype(int)
            osep = _seps(csub, 1 - axis)
            ob = [(s2, e2) for s2, e2 in _runs(osep, False)]
            if ob:
                if axis == 0: cb = (cb[0] + ob[0][0], cb[1], cb[0] + ob[-1][1], cb[3])
                else: cb = (cb[0], cb[1] + ob[0][0], cb[2], cb[1] + ob[-1][1])
            kids.append(xycut(a, cb, depth + 1, maxd, minsz))
        node['kids'] = kids
        return node
    return node


def print_tree(n, ind=0, out=None, limit=45):
    out = out if out is not None else []
    if len(out) >= limit:
        return out
    x, y, w, h = n['box']
    if (w < 40 or h < 12) and ind > 0:
        return out
    line = '  ' * ind + f"[{x},{y},{w},{h}]"
    if 'split' in n:
        tok = token([int(n['bg'][i:i + 2], 16) for i in (1, 3, 5)]).split(' Δ')[0]
        line += f" bg {tok} · {n['split']} pad {n['pad'][0]}/{n['pad'][1]} gaps {n['gaps'][:10]}{'…' if len(n['gaps']) > 10 else ''} ({len(n['kids'])} kids)"
    out.append(line)
    for k in n.get('kids', [])[:12]:
        print_tree(k, ind + 1, out, limit)
    return out


def main():
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
    depth = int(args[args.index('--depth') + 1]) if '--depth' in args else 3
    if '--crop' in args:
        cx, cy, cw, ch = (int(v) for v in args[args.index('--crop') + 1].split(','))
        a = a[cy:cy + ch, cx:cx + cw]
        H, W, _ = a.shape
        R['crop'] = [cx, cy]
        depth = int(args[args.index('--depth') + 1]) if '--depth' in args else 5

    flat = a.reshape(-1, 3)[::3]
    q = flat // 6
    cnt = Counter(map(tuple, q))
    total = sum(cnt.values())
    dom = []
    for c, n in cnt.most_common(8):
        if n / total <= 0.01: break
        dom.append((tuple(int(v) for v in np.round(flat[(q == np.array(c)).all(1)].mean(0))), n / total))
    R['colours'] = [{'hex': hexc(c), 'share': round(s, 3), 'token': token(c)} for c, s in dom]
    R['h_lines'] = [{'y': y, 'x': [x0, x1], 'hex': hexc(c), 'token': token(c)} for y, x0, x1, c in lines(a, 0)]
    R['v_lines'] = [{'x': x, 'y': [y0, y1], 'hex': hexc(c), 'token': token(c)} for x, y0, y1, c in lines(a, 1)]

    # page background = colour along the outer edge; surfaces = big one-colour regions
    R['layout'] = xycut(a, (0, 0, W, H), maxd=depth)
    cell = 4
    small = a[::cell, ::cell].astype(int)
    surfaces = []
    for c, share in dom[:5]:
        if share < 0.03:
            continue
        m = np.abs(small - np.array(c)).sum(2) <= 12
        for bx0, by0, bx1, by1, n in components(m, cell):
            bx1, by1 = min(bx1, W), min(by1, H)
            w, h = bx1 - bx0, by1 - by0
            if w < 80 or h < 24 or n * cell * cell < 0.5 * w * h:
                continue
            top = a[min(by0 + 1, H - 1), bx0:bx0 + 16].astype(int)
            rad = int(np.argmax(np.abs(top - np.array(c)).sum(1) <= 12))
            s = {'box': [bx0, by0, w, h], 'fill': hexc(c), 'token': token(c).split(' ')[0], 'radius~': rad}
            inner = rows_in(a, (bx0, by0, bx1, by1), c)
            if inner:
                inner['rows'] = inner['rows'][:14]; inner['gaps'] = inner['gaps'][:13]
                s.update(inner)
            surfaces.append(s)
    surfaces.sort(key=lambda s: (s['box'][1], s['box'][0]))
    R['surfaces'] = surfaces[:24]

    # FRAME: build at the reference's own size first; breakpoint is info only.
    # Density: SAP rows are 32px (Compact) or 44px (Cozy); controls 26 vs 36.
    ys = sorted({l['y'] for l in R['h_lines']})
    pitch = [b - a_ for a_, b in zip(ys, ys[1:]) if 24 <= b - a_ <= 60]
    p = Counter(pitch).most_common(1)[0][0] if pitch else None
    dens = ('Cozy' if p >= 40 else 'Compact') if p else 'unknown — look at button height: ~26px Compact, ~36px Cozy'
    fw, fh = (8 * round(v / 8) for v in (W, H))
    bp = 'S' if fw < 600 else 'M' if fw < 1024 else 'L' if fw < 1440 else 'XL'
    R['frame'] = {'build': [fw, fh], 'breakpoint': bp, 'row_pitch': p, 'density': dens}

    if '--json' in args:
        print(json.dumps(R)); return
    f = R['frame']
    print(f"FRAME → build {f['build'][0]}x{f['build'][1]} (match the reference; SAP breakpoint {f['breakpoint']}, info only)"
          f"  · row pitch {f['row_pitch']} → {f['density']}")
    off = R.get('crop', [0, 0])
    print(f"{R['image']}  logical {W}x{H}  (scale {scale:g})" + (f"  CROP at {off} — coords below are relative to the crop" if 'crop' in R else ''))
    print('COLOURS (share → nearest SAP token):')
    for c in R['colours']:
        print(f"  {c['hex']} {c['share']:.0%}  → {c['token']}")
    print('HORIZONTAL RULES (y, x-span):')
    for l in R['h_lines'][:20]:
        print(f"  y={l['y']:<4} x={l['x'][0]}–{l['x'][1]}  {l['hex']} → {l['token'].split(' Δ')[0]}")
    print('VERTICAL RULES (x, y-span):')
    for l in R['v_lines'][:12]:
        print(f"  x={l['x']:<4} y={l['y'][0]}–{l['y'][1]}  {l['hex']} → {l['token'].split(' Δ')[0]}")
    print('SURFACES ([x,y,w,h] fill-token radius · pad L/T/R · rows y:h · gaps):')
    for s in R['surfaces']:
        line = f"  {s['box']} {s['token']} r~{s['radius~']}"
        if 'rows' in s:
            line += f"  pad {s['pad_left']}/{s['pad_top']}/{s['pad_right']}  rows " + ' '.join(f"{r}:{hh}" for r, hh in s['rows'][:8])
            line += f"  gaps {s['gaps'][:8]}"
        print(line)

    print(f'LAYOUT (XY-cut depth {depth}: [x,y,w,h] · bg token · split rows|cols · pad before/after · gaps between kids):')
    print('\n'.join(print_tree(R['layout'])))


if __name__ == '__main__':
    main()

