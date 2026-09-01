// dump-tree.use_figma.js — reality-gate dump, COMPACT shape for build/expand-tree-dump.js.
// Send this code through use_figma (replace ROOT_ID and FROM/TO). One call returns ≤70 nodes to
// stay under the tool's result limit; for a 1440px List Report (~200 nodes outside kit internals)
// send it three times with FROM/TO = 0/70, 70/140, 140/999 in ONE message (parallel), then:
//   node build/expand-tree-dump.js output/<node>-compact.json output/<node>-tree.json --based-on <canonical-id>
//   node build/verify-invariants.js output/<node>-tree.json --canonical <canonical-id> --pre-bind --out output/<node>-verify.json
// where <node>-compact.json is a JSON array of the three {from, rows} results.
const root = await figma.getNodeByIdAsync('ROOT_ID');
if (!root) throw new Error('built frame not found');
const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const paintStr = (arr) => (Array.isArray(arr) ? arr : []).filter(p => p.type === 'SOLID' && p.visible !== false).map(p => hex(p.color) + '|' + ((p.boundVariables && p.boundVariables.color && p.boundVariables.color.id) ? '1' : '')).join(';');
const rows = [];
const walk = async (n, parentId) => {
  const bb = n.absoluteBoundingBox || { x: 0, y: 0, width: n.width || 0, height: n.height || 0 };
  let key = ''; if (n.type === 'INSTANCE') { try { const mc = await n.getMainComponentAsync(); key = mc ? mc.key : ''; } catch (e) { key = ''; } }
  let fam = '', fs = '';
  if (n.type === 'TEXT') { fam = n.fontName === figma.mixed ? 'MIXED' : n.fontName.family; fs = n.fontSize === figma.mixed ? 'MIXED' : n.fontSize; }
  rows.push([n.id, n.name, n.type, n.visible, n.layoutMode || '', n.children ? n.children.length : 0, key, fam, fs, Math.round(n.width * 10) / 10, Math.round(bb.x), Math.round(bb.y), Math.round(bb.width * 10) / 10, Math.round(bb.height * 10) / 10, n.layoutSizingHorizontal || '', !!n.clipsContent, parentId || '', paintStr(n.fills), paintStr(n.strokes)]);
  if (n.type === 'INSTANCE') return;            // kit internals are not build output
  if (n.children) for (const c of n.children) await walk(c, n.id);
};
await walk(root, '');
return { total: rows.length, from: FROM, rows: rows.slice(FROM, TO) };
