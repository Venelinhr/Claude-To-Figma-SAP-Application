// dump-geometry.use_figma.js — READ-ONLY. The build's layers with their place on screen, for
// `python3 build/see.py diff ... --tree geometry.json`: every visual mismatch then names the node to fix.
// Set ROOT, run as one use_figma call, save the returned array as geometry.json.
// Row: [id, type, name, x, y, w, h, radius, "strokeW strokeHex", fillHex, "t/r/b/l padding", gap, layout, text | control:<set> | icon:<name>]
const ROOT = '<node id>';
const root = await figma.getNodeByIdAsync(ROOT);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
const R = root.absoluteBoundingBox;
const hex = p => p && p.type === 'SOLID' ? '#' + [p.color.r, p.color.g, p.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : (p ? p.type : '');
const vis = a => Array.isArray(a) ? a.filter(p => p.visible !== false) : [];
const deep = n => { for (let p = n.parent; p && p !== root; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const out = [];
for (const n of [root, ...root.findAll(n => n.visible)]) {
  if (deep(n) || !n.absoluteBoundingBox) continue;
  const b = n.absoluteBoundingBox, f = vis(n.fills), s = vis(n.strokes);
  let kind = '';                                  // an instance of a component SET = a UI control (look + size fixed by SAP); a single component = an icon
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); kind = m && m.parent && m.parent.type === 'COMPONENT_SET' ? 'control:' + m.parent.name : 'icon:' + (m ? m.name : ''); }
  out.push([n.id, n.type, n.name.slice(0, 30), Math.round(b.x - R.x), Math.round(b.y - R.y), Math.round(b.width), Math.round(b.height),
    typeof n.cornerRadius === 'number' ? n.cornerRadius : 'mix', s.length ? `${typeof n.strokeWeight === "number" ? n.strokeWeight : "mix"} ${hex(s[0])}` : '', f.length ? hex(f[0]) : '',
    n.layoutMode && n.layoutMode !== 'NONE' ? [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') : '',
    n.layoutMode && n.layoutMode !== 'NONE' ? n.itemSpacing : '', n.layoutMode || '', n.type === 'TEXT' ? n.characters.slice(0, 60) : kind, n.parent ? n.parent.id : '']);   // last column = parent id (structure.js)
}
return out;
