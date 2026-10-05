#!/usr/bin/env python3
"""mark.py <ref.png> <spec.json> <job dir>  — two pictures for ONE look at the start of an image job:
  ref-marked.png   the reference with every icon boxed + numbered (1,2,3 …) and every big zone boxed + lettered (A,B,C …)
  icons-sheet.png  every icon cut out, enlarged, with its number (and the guess the script already has)
  marks.json       number → box, letter → box   (spec2tree --marks … --names … turns the names into the tree)
Claude names the numbers (kit icon words) and the letters (what the zone is: Shell Bar, Icon Tab Bar …) in names.json."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
ref, specf, job = sys.argv[1:4]
spec = json.load(open(specf)); im = Image.open(ref).convert('RGB')
fw = spec['frame']['w']; f = im.width / fw
icons, zones, texts, comps = [], [], [], []
def walk(o, d):
    b = o.get('box')
    if o['type'] == 'icon' and b: icons.append({'box': b, 'icon': o.get('icon') or '', 'meaning': o.get('meaning')})
    elif o['type'] == 'text' and b: texts.append({'box': b, 'text': o.get('text', ''), 'style': o.get('style', '')})
    elif o['type'] == 'component' and b: comps.append({'box': b, 'component': o.get('component', ''), 'text': o.get('text', '')})
    elif o['type'] in ('row', 'column', 'box', 'stack') and b and 0 < d <= 2 and b[2] * b[3] >= 0.02 * spec['frame']['w'] * spec['frame']['h'] and not (b[2] >= fw * .98 and b[3] >= spec['frame']['h'] * .98):
        zones.append({'box': b, 'type': o['type'], 'texts': []})
    for c in o.get('children', []): walk(c, d + 1)
for s in spec['sections']: walk(s, 0)
# a zone inside a zone of the same size is the same zone
zones = [z for i, z in enumerate(zones) if not any(j < i and all(abs(z['box'][k] - y['box'][k]) <= 6 for k in range(4)) for j, y in enumerate(zones))]
zones = sorted(zones, key=lambda z: (z['box'][1] // 40, z['box'][0]))[:26]
def font(n):
    try: return ImageFont.load_default(size=n)
    except Exception: return ImageFont.load_default()
S = 2000 / im.width if im.width > 2000 else 1.0          # output scale: the model's picture reader shrinks wide images anyway
big = im.resize((int(im.width * S), int(im.height * S)), Image.LANCZOS); dr = ImageDraw.Draw(big)
fo = font(max(14, int(big.width / 90)))
for i, z in enumerate(zones):
    z['id'] = chr(65 + i); x, y, w, h = [v * f * S for v in z['box']]
    dr.rectangle([x, y, x + w, y + h], outline=(0, 90, 255), width=2); dr.rectangle([x, y, x + fo.size * 1.1, y + fo.size * 1.25], fill=(0, 90, 255)); dr.text((x + 3, y), z['id'], fill='white', font=fo)
for i, ic in enumerate(icons, 1):
    ic['id'] = i; x, y, w, h = [v * f * S for v in ic['box']]
    dr.rectangle([x - 3, y - 3, x + w + 3, y + h + 3], outline=(230, 0, 120), width=2)
    ty = y - fo.size * 1.35 if y > fo.size * 1.5 else y + h + 4
    tw = dr.textlength(str(i), font=fo)
    dr.rectangle([x - 2, ty - 1, x + tw + 3, ty + fo.size * 1.15], fill=(230, 0, 120)); dr.text((x, ty), str(i), fill='white', font=fo)   # white on pink: readable on dark bars too
fs2 = font(max(11, int(big.width / 140)))
def tag(x, y, s, col):                                  # a small filled label at the box's top-left corner
    tw = dr.textlength(s, font=fs2); ty = y - fs2.size * 1.2 if y > fs2.size * 1.3 else y
    dr.rectangle([x, ty, x + tw + 4, ty + fs2.size * 1.15], fill=col); dr.text((x + 2, ty), s, fill='white', font=fs2)
for i, t in enumerate(texts, 1):
    t['id'] = 'T%d' % i; x, y, w, h = [v * f * S for v in t['box']]
    dr.rectangle([x - 1, y - 1, x + w + 1, y + h + 1], outline=(0, 150, 70), width=1); tag(x, y, t['id'], (0, 150, 70))
for i, c in enumerate(comps, 1):
    c['id'] = 'C%d' % i; x, y, w, h = [v * f * S for v in c['box']]
    dr.rectangle([x - 2, y - 2, x + w + 2, y + h + 2], outline=(240, 130, 0), width=2); tag(x, y + h + fs2.size * 1.3, c['id'] + ' ' + c['component'], (240, 130, 0))
big.save(os.path.join(job, 'ref-marked.png'))
# the sheet: each icon enlarged on a grey tile with ±10 px context
T, cols = 150, 8; rows = max(1, (len(icons) + cols - 1) // cols)
sh = Image.new('RGB', (cols * T, rows * (T + 34)), (245, 246, 247)); sd = ImageDraw.Draw(sh); fs = font(18)
for i, ic in enumerate(icons):
    x, y, w, h = ic['box']; m = 10
    c = im.crop((max(0, int((x - m) * f)), max(0, int((y - m) * f)), min(im.width, int((x + w + m) * f)), min(im.height, int((y + h + m) * f))))
    k = min((T - 12) / max(1, c.width), (T - 12) / max(1, c.height)); c = c.resize((max(1, int(c.width * k)), max(1, int(c.height * k))), Image.LANCZOS)
    ox, oy = (i % cols) * T, (i // cols) * (T + 34)
    sh.paste(c, (ox + (T - c.width) // 2, oy + 30 + (T - c.height) // 2)); sd.rectangle([ox, oy, ox + T - 1, oy + T + 33], outline=(200, 200, 205))
    sd.text((ox + 6, oy + 4), f"{ic['id']}" + (f"  ({ic['icon'][:14]})" if ic['icon'] else ''), fill=(230, 0, 120), font=fs)
sh.save(os.path.join(job, 'icons-sheet.png'))
json.dump({'scale': f, 'icons': icons, 'zones': zones, 'texts': texts, 'components': comps}, open(os.path.join(job, 'marks.json'), 'w'))
print(f"MARKS {len(icons)} icons ({sum(1 for i in icons if not i['icon'])} unnamed) · {len(zones)} zones · {len(texts)} texts · {len(comps)} components")
print('READ  ' + ' · '.join(f'{t["id"]} "{t["text"]}"' for t in texts))
if comps: print('READ  ' + ' · '.join(f'{c["id"]} {c["component"]} "{c["text"]}"' for c in comps))
