#!/usr/bin/env python3
"""crop-logos.py — cut every logo out of the reference, so the build shows the real logo.

    python3 build/crop-logos.py <plan.json> <reference.png> <out-dir>

For every plan row with kind "logo" and crop [x, y, w, h] in FRAME px (like the measure-ref
boxes; the script scales to the image by image width ÷ plan.frame.w)
it writes <out-dir>/<n>-<group>-<element>.png and prints one line per file. SAP has no brand
logos, and the Figma Agent cannot read local files, so Claude Code places these with
upload_assets on the logo frames after the build (v4 step 4). Logos were the #1 gap to the
gold builds (every build scoring 8+ had real logos).
"""
import json, os, re, sys
from PIL import Image

if len(sys.argv) != 4:
    sys.exit(__doc__)
plan_f, ref_f, out_dir = sys.argv[1:]
plan = json.load(open(plan_f, encoding='utf-8'))
img = Image.open(ref_f).convert('RGB')
os.makedirs(out_dir, exist_ok=True)
k = img.width / plan['frame']['w'] if plan.get('frame', {}).get('w') else 1.0   # frame px → image px
slug = lambda s: re.sub(r'[^A-Za-z0-9]+', '-', str(s or '')).strip('-').lower() or 'x'
n = 0
for r in plan.get('rows', []):
    if r.get('kind') != 'logo' or not r.get('crop'):
        continue
    x, y, w, h = [int(round(v * k)) for v in r['crop']]
    box = (max(0, x), max(0, y), min(img.width, x + w), min(img.height, y + h))
    if box[2] <= box[0] or box[3] <= box[1]:
        print(f'✗ {r.get("element")}: crop {r["crop"]} is outside the {img.width}×{img.height} reference')
        continue
    n += 1
    f = os.path.join(out_dir, f'{n:02d}-{slug(r.get("group"))}-{slug(r.get("element"))}.png')
    img.crop(box).save(f)
    print(f'▸ {f}  {box[2] - box[0]}×{box[3] - box[1]}  ({r.get("group", "")} · {r.get("element")})')
print(f'{n} logo(s) cropped' + ('' if n else ' — no logo rows with a crop in the plan'))
