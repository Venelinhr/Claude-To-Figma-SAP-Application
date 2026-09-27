// dump-tree.use_figma.js — READ-ONLY. Dumps a built frame for build/audit-plan.js.
// Set ROOT to the built frame id, run as one use_figma call, save the returned array as tree.json.
const ROOT = '<node id>';
const root = await figma.getNodeByIdAsync(ROOT);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
const tok = async ps => { if (!Array.isArray(ps) || !ps[0]) return ''; const id = ps[0].boundVariables && ps[0].boundVariables.color && ps[0].boundVariables.color.id;
  if (!id) return ps[0].type === 'IMAGE' ? 'IMAGE' : 'RAW'; const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name.split('/').pop() : ''; };
const out = [];
for (const n of [root, ...root.findAll(() => true)]) {
  if (n.type === 'TEXT') {
    const st = typeof n.textStyleId === 'string' && n.textStyleId ? await figma.getStyleByIdAsync(n.textStyleId) : null;
    out.push({ type: 'TEXT', name: n.name, text: n.characters, style: st ? st.name : '', fill: await tok(n.fills) });
  } else if (n.type === 'INSTANCE') {
    const m = await n.getMainComponentAsync(), s = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
    const p = {}; for (const [k, v] of Object.entries(n.componentProperties)) if (v.type === 'VARIANT') p[k] = v.value;
    out.push({ type: 'INSTANCE', name: n.name, component: s ? s.name : '', props: p, h: Math.round(n.height) });
  } else if ('fills' in n) {
    const fill = await tok(n.fills), stroke = 'strokes' in n ? await tok(n.strokes) : '';
    if (fill === 'IMAGE' || stroke) out.push({ type: n.type, name: n.name, image: fill === 'IMAGE', fill, stroke });
  }
}
return out;
