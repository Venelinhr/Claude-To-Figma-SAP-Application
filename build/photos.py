#!/usr/bin/env python3
"""photos.py — find photographs / maps / illustrations in a reference (no model). Writes <job>/photos.json = [[x,y,w,h], …] in FRAME pixels.
   python3 build/photos.py <job dir> <frame width>
A cell is 'photo' when most of its pixels differ from the cell's own background AND it holds many distinct colours (text and flat UI do not).
Why (2026-10-04, hotel screen): photos were never detected as pictures — they became scattered fragments and left blank holes."""
import json, os, sys
import cv2, numpy as np
job, fw = sys.argv[1], float(sys.argv[2])
img = cv2.imread(os.path.join(job, 'ref.png')); k = fw / img.shape[1]
img = cv2.resize(img, None, fx=k, fy=k, interpolation=cv2.INTER_AREA); H, W = img.shape[:2]
C = 8; gh, gw = H // C, W // C; cell = np.zeros((gh, gw), np.uint8)
q = (img // 24).astype(np.int32); code = q[..., 0] * 100 + q[..., 1] * 10 + q[..., 2]
for gy in range(gh):
    for gx in range(gw):
        b = img[gy * C:(gy + 1) * C, gx * C:(gx + 1) * C].reshape(-1, 3).astype(int); cd = code[gy * C:(gy + 1) * C, gx * C:(gx + 1) * C].ravel()
        vals, cnt = np.unique(cd, return_counts=True); mode = vals[cnt.argmax()]
        far = (cd != mode).mean(); uniq = len(vals)
        if far > 0.45 and uniq >= 6: cell[gy, gx] = 255
sp = os.path.join(job, 'see-ref', 'spec.json')                             # cells under OCR text are text, not picture
if os.path.exists(sp):
    def tb(n, out):
        if isinstance(n, dict):
            if n.get('type') == 'text' and n.get('box'): out.append(n['box'])
            for c in (n.get('children') or n.get('sections') or []): tb(c, out)
        elif isinstance(n, list):
            for c in n: tb(c, out)
    T = []; tb(json.load(open(sp)).get('sections', []), T)
    for x, y, w, h in T:
        cell[max(0, int(y // C)):int((y + h) // C) + 1, max(0, int(x // C)):int((x + w) // C) + 1] = 0
cell = cv2.morphologyEx(cell, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
cell = cv2.morphologyEx(cell, cv2.MORPH_OPEN, np.ones((4, 4), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(cell)
out = []
for i in range(1, n):
    x, y, w, h, a = st[i]
    if w < 8 or h < 6 or a / (w * h) < 0.6: continue                       # at least 64×48 px, mostly filled
    out.append([int(x * C), int(y * C), int(w * C), int(h * C)])
# a photo belongs to ONE card (Make's reading, 2026-10-04): the 40-px closing bridged the 28-px gap between two hotel cards and made one
# 288×496 picture over both — both cards were then pinned and pushed 300 px right. A photo that crosses card boxes is cut at their edges,
# and each part shrinks to its own picture cells.
if os.path.exists(sp):
    def bx_(n, acc):
        if isinstance(n, dict):
            if n.get('type') == 'box' and n.get('box') and n['box'][2] >= 200 and n['box'][3] >= 100: acc.append(n['box'])
            for c in (n.get('children') or n.get('sections') or []): bx_(c, acc)
        elif isinstance(n, list):
            for c in n: bx_(c, acc)
    CB = []; bx_(json.load(open(sp)).get('sections', []), CB)
    def clip(a, b):
        x0, y0 = max(a[0], b[0]), max(a[1], b[1]); x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
        return [x0, y0, x1 - x0, y1 - y0] if x1 > x0 and y1 > y0 else None
    split = []
    for ph in out:
        parts = [c for c in (clip(ph, b) for b in CB) if c and c[2] * c[3] >= 0.15 * ph[2] * ph[3]]
        parts = [c for c in parts if not any(d is not c and d[2] * d[3] < c[2] * c[3] and clip(d, c) and clip(d, c)[2] * clip(d, c)[3] >= 0.9 * d[2] * d[3] for d in parts)]   # nested boxes (a card inside the main area): the innermost wins
        if len(parts) < 2: split.append(ph); continue
        for c in parts:
            m = cell[c[1] // C:(c[1] + c[3]) // C, c[0] // C:(c[0] + c[2]) // C]
            ys, xs = np.nonzero(m)
            if len(ys) and (xs.max() - xs.min() + 1) >= 8 and (ys.max() - ys.min() + 1) >= 6:
                part = clip([int((c[0] // C + xs.min()) * C), int((c[1] // C + ys.min()) * C), int((xs.max() - xs.min() + 1) * C), int((ys.max() - ys.min() + 1) * C)], c)
                if part: split.append(part)   # the 8-px cell grid rounds outward: clip back into the card, or the part falls out of it
    out = [list(t) for t in dict.fromkeys(tuple(b) for b in split)]   # two nested boxes can cut the same part twice
# ORPHANS: ink no measured part covers (a logo the OCR could not read) → cut 1:1, so nothing visible is ever lost
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.int16); bgm = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 31).astype(np.int16)
ink = (np.abs(lum - bgm) > 40).astype(np.uint8)
cover = np.zeros_like(ink)
if os.path.exists(sp):
    def lv(n, acc):
        if isinstance(n, dict):
            if n.get('type') in ('text', 'icon', 'image', 'component', 'divider', 'separator') and n.get('box'): acc.append(n['box'])
            for c in (n.get('children') or n.get('sections') or []): lv(c, acc)
        elif isinstance(n, list):
            for c in n: lv(c, acc)
    L = []; lv(json.load(open(sp)).get('sections', []), L)
    def bx(n, acc):
        if isinstance(n, dict):
            if n.get('type') == 'box' and n.get('box') and not n.get('region'): acc.append(n['box'])   # a region (side panel / main) is invisible: it has no edge ink
            for c in (n.get('children') or n.get('sections') or []): bx(c, acc)
        elif isinstance(n, list):
            for c in n: bx(c, acc)
    B = []; bx(json.load(open(sp)).get('sections', []), B)
    for x, y, w, h in B:                                                    # a measured box draws its own border: its edge band is covered
        x, y, w, h = int(x), int(y), int(w), int(h)
        for sl in ((slice(max(0, y - 4), y + 5), slice(max(0, x - 4), x + w + 5)), (slice(max(0, y + h - 5), y + h + 5), slice(max(0, x - 4), x + w + 5)),
                   (slice(max(0, y - 4), y + h + 5), slice(max(0, x - 4), x + 5)), (slice(max(0, y - 4), y + h + 5), slice(max(0, x + w - 5), x + w + 5))): cover[sl] = 1
    for x, y, w, h in L + out: cover[max(0, int(y) - 4):int(y + h) + 5, max(0, int(x) - 4):int(x + w) + 5] = 1
ink[cover == 1] = 0
ink = cv2.dilate(ink, np.ones((5, 5), np.uint8))
n2, _, st2, _ = cv2.connectedComponentsWithStats(ink)
orph = [[int(x), int(y), int(w), int(h)] for x, y, w, h, a in st2[1:] if w >= 24 and h >= 12 and min(w, h) >= 8 and a / (w * h) > 0.15 and w * h < 0.05 * W * H]
# PANELS: flat light-grey surfaces a little darker than the page (a card the box finder missed for low contrast) → drawn behind the content
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32); cm = cv2.resize(g, (gw, gh), interpolation=cv2.INTER_AREA)
sd = np.sqrt(np.maximum(cv2.resize(g * g, (gw, gh), interpolation=cv2.INTER_AREA) - cm * cm, 0))
flat = sd < 2.5; page = float(np.median(cm[flat])) if flat.any() else 255.0
pan = (flat & (page - cm >= 3) & (page - cm <= 25)).astype(np.uint8) * 255
pan = cv2.morphologyEx(pan, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n3, _, st3, _ = cv2.connectedComponentsWithStats(pan)
panels = [[int(x * C), int(y * C), int(w * C), int(h * C), int(round(float(np.median(cm[y:y + h, x:x + w]))))] for x, y, w, h, a in st3[1:] if w >= 18 and h >= 10 and a / (w * h) > 0.35 and w * h < 0.4 * gw * gh]
json.dump({'photos': out, 'orphans': orph, 'panels': panels}, open(os.path.join(job, 'photos.json'), 'w'))
print('ORPHANS ' + str(len(orph)) + ' ' + ' '.join(f'{w}x{h}@{x},{y}' for x, y, w, h in orph[:8]) + ' · PANELS ' + str(len(panels)) + ' ' + ' '.join(f'{w}x{h}@{x},{y}' for x, y, w, h, _ in panels[:6]))
print('PHOTOS ' + str(len(out)) + ' ' + ' '.join(f'{w}x{h}@{x},{y}' for x, y, w, h in out[:12]))
