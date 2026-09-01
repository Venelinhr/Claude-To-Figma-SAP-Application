// dump-delta.use_figma.js — reality-gate dump of ONLY what the build changed vs. its canonical.
//
// Why (AUDIT-V2 §9.3): a full dump of a 1440px List Report is ~200 nodes = three use_figma calls
// in (~15k tokens) plus a 30 KB JSON written back out (~9k tokens) — the single largest cost of a
// v2 build, and enough to force a context compaction. A Level 1–4 build starts from a PM-confirmed
// canonical, so only the nodes the build ADDED or CHANGED need the reality gate; unchanged inherited
// nodes are approved by provenance (INV 4). This walks the clone and the canonical in parallel by
// child index and emits a node only if its type / visibility / size / relative position / sizing /
// fills / strokes / text differ, or it has no counterpart (added) — plus the parent chain of every
// emitted node so INV 5 can check overflow. Rename-only differences are ignored (names do not
// affect any invariant except naming, which the canonical already passed).
//
// Send via use_figma with ROOT_ID (the built clone) and CANON_ID (its canonical). Then:
//   Write the returned `rows` array to output/<node>-delta.json and run
//   node build/expand-tree-dump.js output/<node>-delta.json output/<node>-tree.json --based-on <canonical-id>
//   node build/verify-invariants.js output/<node>-tree.json --canonical <canonical-id> --pre-bind --out output/<node>-verify.json
const root = await figma.getNodeByIdAsync('ROOT_ID');
const canon = await figma.getNodeByIdAsync('CANON_ID');
if (!root || !canon) throw new Error('root or canonical not found');
const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const paintStr = (arr) => (Array.isArray(arr) ? arr : []).filter(p => p.type === 'SOLID' && p.visible !== false).map(p => hex(p.color) + '|' + ((p.boundVariables && p.boundVariables.color && p.boundVariables.color.id) ? '1' : '')).join(';');
const bb = (n) => n.absoluteBoundingBox || { x: 0, y: 0, width: n.width || 0, height: n.height || 0 };
// Positions are compared LOCAL to the parent (n.x / n.y), never relative to the root: one extra
// filter row shifts every node below it, but a row whose own offset inside the table is unchanged
// is not a change. (Root-relative comparison emitted 200 of 203 nodes; local emits the real delta.)
// Measured 2026-09-02 on a heavy adaptation (column widened, every row text changed): 171 of 203 —
// the delta helps light edits most; the big saving is capture-dump.sh (no write-back at all).
const sig = (n) => [n.type, n.visible, n.layoutMode || '', n.children ? n.children.length : 0, Math.round(n.width), Math.round(n.height), Math.round(n.x), Math.round(n.y), n.layoutSizingHorizontal || '', paintStr(n.fills), paintStr(n.strokes), n.type === 'TEXT' ? n.characters : ''].join('|');
const row = async (n, parentId) => {
  const b = bb(n); let key = ''; if (n.type === 'INSTANCE') { try { const mc = await n.getMainComponentAsync(); key = mc ? mc.key : ''; } catch (e) {} }
  let fam = '', fs = ''; if (n.type === 'TEXT') { fam = n.fontName === figma.mixed ? 'MIXED' : n.fontName.family; fs = n.fontSize === figma.mixed ? 'MIXED' : n.fontSize; }
  return [n.id, n.name, n.type, n.visible, n.layoutMode || '', n.children ? n.children.length : 0, key, fam, fs, Math.round(n.width * 10) / 10, Math.round(b.x), Math.round(b.y), Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10, n.layoutSizingHorizontal || '', !!n.clipsContent, parentId || '', paintStr(n.fills), paintStr(n.strokes)];
};
const rows = []; const emitted = new Set(); let compared = 0, changed = 0, added = 0;
const emit = async (n) => {
  const chain = []; let p = n.parent;
  while (p && p.id !== root.id && p.type !== 'PAGE') { chain.unshift(p); p = p.parent; }
  for (const a of chain) if (!emitted.has(a.id)) { emitted.add(a.id); rows.push(await row(a, a.parent && a.parent.id === root.id ? root.id : (a.parent ? a.parent.id : ''))); }
  if (!emitted.has(n.id)) { emitted.add(n.id); rows.push(await row(n, n.parent ? n.parent.id : '')); }
};
const walk = async (n, c) => {
  compared++;
  if (!c) { added++; await emit(n); }
  else if (sig(n) !== sig(c)) { changed++; await emit(n); }
  if (n.type === 'INSTANCE') return;
  if (n.children) for (let i = 0; i < n.children.length; i++) await walk(n.children[i], c && c.children && c.children[i] && c.type !== 'INSTANCE' ? c.children[i] : null);
};
emitted.add(root.id); rows.push(await row(root, ''));
if (root.children) for (let i = 0; i < root.children.length; i++) await walk(root.children[i], canon.children ? canon.children[i] : null);
// keep every emitted node's parentId resolvable: parents were emitted by emit(); the root is first.
return { canonical: canon.name, compared, changed, added, emitted: rows.length, rows };
