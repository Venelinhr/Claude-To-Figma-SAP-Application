// dump-compact.use_figma.js — READ-ONLY. One short row per layer of a v5 build (kit internals skipped, except
// the instance's visible texts), in tree order. Save as built.json → node build/verify-tree.js <tree.json> built.json
// Row: [name, type, component, {variant props}, fill token, stroke token, text style, text, font, [inner texts]]
const ROOT = '<node id>';
const root = await figma.getNodeByIdAsync(ROOT);
const vc = {}, sc = {};
const tok = async ps => { if (!Array.isArray(ps) || !ps[0] || ps[0].visible === false) return ''; const b = ps[0].boundVariables && ps[0].boundVariables.color;
  if (!b) return ps[0].type === 'IMAGE' ? 'IMAGE' : 'RAW'; if (!(b.id in vc)) { const v = await figma.variables.getVariableByIdAsync(b.id); vc[b.id] = v ? v.name.split('/').pop() : ''; } return vc[b.id]; };
const out = [];
async function walk(n) {
  const row = [n.name, n.type];
  if (n.type === 'INSTANCE') {
    const m = await n.getMainComponentAsync(), s = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
    const p = {}; for (const [k, v] of Object.entries(n.componentProperties)) if (v.type === 'VARIANT') p[k] = v.value;
    row.push(s ? s.name : '', p, '', '', '', '', '', n.findAll(x => x.type === 'TEXT' && x.visible).slice(0, 4).map(t => t.characters.slice(0, 40)));
    out.push(row); return;
  }
  const st = n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId ? (sc[n.textStyleId] ||= ((await figma.getStyleByIdAsync(n.textStyleId)) || {}).name || '') : '';
  row.push('', {}, 'fills' in n ? await tok(n.fills) : '', 'strokes' in n ? await tok(n.strokes) : '', st,
    n.type === 'TEXT' ? n.characters.slice(0, 60) : '', n.type === 'TEXT' ? (n.fontName === figma.mixed ? 'mixed' : n.fontName.family) : '', []);
  out.push(row);
  if ('children' in n) for (const c of n.children) if (c.visible !== false) await walk(c);
}
await walk(root);
return out;
