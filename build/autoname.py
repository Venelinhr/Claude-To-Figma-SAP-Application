#!/usr/bin/env python3
"""autoname.py — name every measured shape WITHOUT a model, so an image job never stops and nothing is dropped.
   python3 build/autoname.py <job dir>  → <job>/names.json  {"icons": {"<id>": name}}  (+ one line per decision on stdout)
Rules (2026-10-04, flight screen: careless "skip" names dropped 41 elements):
   < 8 px → skip (noise) · hollow square 12–26 px → comp:Check Box · 2+ colours → image (logo / flag / badge)
   anything else → image (cut 1:1 from the reference — never lost); a mono glyph is listed as UPGRADE (a kit icon may replace it).
   Names already given in names.json win (the model or the user may upgrade a glyph to a kit icon)."""
import colorsys, json, os, sys
import numpy as np
from PIL import Image

job = sys.argv[1]
MEM = os.path.join(os.path.dirname(__file__), '..', 'knowledge', 'live', 'icon-memory.json')   # glyph signature → kit icon, learned from named jobs
mem = json.load(open(MEM)) if os.path.exists(MEM) else []
def sig(c):
    edge = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]]); ink = np.abs(c - np.median(edge, axis=0)).sum(axis=2) > 60
    ys, xs = np.nonzero(ink)
    if not len(ys): return None
    sub = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.uint8) * 255
    return (np.asarray(Image.fromarray(sub).resize((16, 16))) > 96).flatten(), sub.shape[1] / max(1, sub.shape[0])
def recall(c):
    s_ = sig(c)
    if s_ is None or not mem: return None
    best = min(mem, key=lambda m: (np.array(m['s'], bool) != s_[0]).sum() + 200 * abs(np.log(max(1e-3, m['a'] / max(1e-3, s_[1])))))
    d = (np.array(best['s'], bool) != s_[0]).sum() + 200 * abs(np.log(max(1e-3, best['a'] / max(1e-3, s_[1]))))
    return best['name'] if d <= 22 else None
mk = json.load(open(os.path.join(job, 'marks.json'))); k = mk.get('scale') or 1
img = np.asarray(Image.open(os.path.join(job, 'ref.png')).convert('RGB')).astype(int)
nf = os.path.join(job, 'names.json'); old = json.load(open(nf)) if os.path.exists(nf) else {}
names, up = dict(old.get('icons', {})), []
KNOWN = set(p.split('=')[0] for p in (sys.argv[sys.argv.index('--known') + 1].split(',') if '--known' in sys.argv else []) if '=' in p)
for ic in mk['icons']:
    i = str(ic['id'])
    x, y, w, h = ic['box']
    if i in names or f'{w}x{h}' in KNOWN: continue   # a name given by the model / user wins
    if max(w, h) < 8: names[i] = 'skip'; continue
    X0, Y0, X1, Y1 = int(x * k), int(y * k), int((x + w) * k) + 1, int((y + h) * k) + 1
    c = img[max(0, Y0 - 3):Y1 + 3, max(0, X0 - 3):X1 + 3]   # 3 px margin: the page around the mark is the background (a crop exactly on a box border read the border as background)
    if c.size == 0: names[i] = 'image'; continue
    edge = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]]); bg = np.median(edge, axis=0)
    ink = np.abs(c - bg).sum(axis=2) > 60
    px = c[ink]
    hues = set()
    for r, g, b in px[:: max(1, len(px) // 400)]:
        hh, ll, ss = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if ss > 0.35 and 0.15 < ll < 0.85: hues.add(int(hh * 12))
    ys, xs = np.nonzero(ink); hollow = False
    if len(ys) and 10 <= w <= 26:                    # a check box: a thin square OUTLINE (empty inside), measured on the ink's own bounds
        sub = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; sh, sw = sub.shape
        q = lambda a, b: slice(int(a * sh), int(b * sh)), lambda a, b: slice(int(a * sw), int(b * sw))
        inner = sub[int(.3 * sh):int(.7 * sh), int(.3 * sw):int(.7 * sw)]
        hollow = sh > 8 and abs(sh - sw) <= max(3, .2 * sw) and inner.size and inner.mean() < 0.08 and sub.mean() < 0.5 \
            and sub[:, 0].mean() > 0.5 and sub[:, -1].mean() > 0.5 and sub[0].mean() > 0.5 and sub[-1].mean() > 0.5
    # a small wide shape is usually a piece of TEXT the OCR missed ("6am -", "- 12pm"): read it, never cut a picture of letters.
    # Only REAL patterns are accepted (a time like 6am / 12pm, a 3-letter airport code); anything else stays a picture (no "v4" / "wil" from route dots).
    if 8 <= h <= 20 and (w >= 1.5 * h or w <= 12) and not hollow:   # also a lone glyph (& / +) the OCR dropped
        import re, subprocess
        pc = img[max(0, Y0 - 3):Y1 + 3, max(0, X0 - 3):X1 + 3]                       # 3 px margin: without it tesseract reads 6am as 5am
        t = Image.fromarray(pc.astype(np.uint8)).convert('L'); t = t.resize((t.width * 5, t.height * 5), Image.LANCZOS)
        fp = os.path.join(job, f'_ocr{i}.png'); t.save(fp)
        r = subprocess.run(['tesseract', fp, 'stdout', '--psm', '7'], capture_output=True).stdout.decode('utf8', 'ignore').strip(); os.remove(fp)
        r = re.sub(r'^[I|l](?=\dpm)', '1', r.replace('I2pm', '12pm').replace('l2pm', '12pm'))
        m = re.fullmatch(r'[-–.]?\s*(\d{1,2}\s?(?:am|pm))\s*[-–.]?', r, re.I) or re.fullmatch(r'()([A-Z]{3}|[&/+%])', r)
        if m:
            txt = (m.group(1) or m.group(2)).replace(' ', ''); names[i] = 'text:' + txt + ':' + ('SmallText/LHAuto/Regular' if h <= 14 else 'MediumText/LHAuto/Regular'); continue
    known = recall(c)
    circle = False
    if len(ys) and 12 <= w <= 28 and abs(w - h) <= 4 and not hollow:   # a ring: corners empty, centre empty, edge inked → a radio
        sub = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; sh, sw = sub.shape; cq = max(1, sh // 6)
        corners = np.mean([sub[:cq, :cq].mean(), sub[:cq, -cq:].mean(), sub[-cq:, :cq].mean(), sub[-cq:, -cq:].mean()])
        inner = sub[int(.35 * sh):int(.65 * sh), int(.35 * sw):int(.65 * sw)]
        circle = sh > 8 and corners < 0.15 and inner.size and inner.mean() < 0.1 and 0.15 < sub.mean() < 0.6
    if hollow: names[i] = 'comp:Check Box'
    elif circle: names[i] = 'comp:Radio Button'
    elif known: names[i] = known
    elif min(w, h) <= 5 and max(w, h) <= 20: names[i] = 'skip'   # a 4×14 sliver the OCR could not read is a glyph piece, not a picture ("Select Hotel ¦", 2026-10-04)
    elif len(hues) >= 2: names[i] = 'image'
    else: names[i] = 'image'; up.append(f'{i}:{w}x{h}')
if '--learn' in sys.argv:            # --learn "WxH=kit-icon,…": store the signature of every shape named with a kit icon
    L = dict(p.split('=', 1) for p in sys.argv[sys.argv.index('--learn') + 1].split(',') if '=' in p); n0 = len(mem)
    for ic in mk['icons']:
        nm = L.get(f"{ic['box'][2]}x{ic['box'][3]}")
        if not nm or nm in ('image', 'skip') or ':' in nm: continue
        x, y, w, h = ic['box']; s_ = sig(img[int(y * k):int((y + h) * k) + 1, int(x * k):int((x + w) * k) + 1])
        if s_ is not None: mem.append({'name': nm, 's': [int(v) for v in s_[0]], 'a': round(s_[1], 3)})
    json.dump(mem, open(MEM, 'w')); print(f'LEARN {len(mem) - n0} glyphs → {MEM}'); sys.exit(0)
json.dump({**old, 'icons': names}, open(nf, 'w'), indent=1)
cnt = {}
for v in names.values(): cnt[v.split(':')[0] if v.startswith('comp:') else v] = cnt.get(v.split(':')[0] if v.startswith('comp:') else v, 0) + 1
print('AUTONAME ' + ' · '.join(f'{n} {v}' for v, n in sorted(cnt.items(), key=lambda a: -a[1])) + (f' · UPGRADE (kit icon may replace the cut): {" ".join(up[:20])}' if up else ''))
