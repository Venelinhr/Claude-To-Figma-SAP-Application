// dump-tree.use_figma.js — READ-ONLY. Dumps a built frame for build/audit-plan.js.
// Set ROOT to the built frame id, run as one use_figma call, save the returned array as tree.json.
// inInst = the node sits inside a component instance (kit internals — hygiene checks skip it).
const ROOT = '<node id>';
const root = await figma.getNodeByIdAsync(ROOT);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
const tok = async ps => { if (!Array.isArray(ps) || !ps[0] || ps[0].visible === false) return ''; const id = ps[0].boundVariables && ps[0].boundVariables.color && ps[0].boundVariables.color.id;
  if (!id) return ps[0].type === 'IMAGE' ? 'IMAGE' : 'RAW'; const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name.split('/').pop() : ''; };
const inInst = n => { for (let p = n.parent; p && p !== root.parent; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const out = [];
for (const n of [root, ...root.findAll(() => true)]) {
  if (n.visible === false) continue;
  const ii = inInst(n);
  // kit internals: keep only text (presence check) and inner icon instances (icon check) —
  // frames/vectors/rects inside instances pushed real screens past the 20 KB reply cap
  if (ii && n.type !== 'TEXT' && n.type !== 'INSTANCE') continue;
  const base = { id: n.id, type: n.type, name: n.name, inInst: ii };
  if (n.type === 'TEXT') {
    if (ii) { out.push({ ...base, text: n.characters }); continue; }
    const st = typeof n.textStyleId === 'string' && n.textStyleId ? await figma.getStyleByIdAsync(n.textStyleId) : null;
    out.push({ ...base, text: n.characters, style: st ? st.name : '', fill: await tok(n.fills),
      font: n.fontName === figma.mixed ? [...new Set(n.getStyledTextSegments(['fontName']).map(g => g.fontName.family))].join('+') : n.fontName.family });
  } else if (n.type === 'INSTANCE') {
    const m = await n.getMainComponentAsync(), s = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
    const p = {}; let cpr = {}; try { cpr = n.componentProperties; } catch (_) { try { cpr = n.variantProperties || {}; for (const k in cpr) cpr[k] = { type: 'VARIANT', value: cpr[k] }; } catch (__) { cpr = {}; } }   // a kit set with errors throws here (2026-10-04) — the dump must not die
    for (const [k, v] of Object.entries(cpr)) if (v.type === 'VARIANT') p[k] = v.value;
    out.push({ ...base, component: s ? s.name : '', props: p, h: Math.round(n.height) });
  } else if ('fills' in n) {
    const fill = await tok(n.fills), stroke = 'strokes' in n ? await tok(n.strokes) : '';
    if (fill || stroke) out.push({ ...base, image: fill === 'IMAGE', fill, stroke });
  }
}
return out;
