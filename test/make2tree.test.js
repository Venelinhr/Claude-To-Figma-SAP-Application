// make2tree.test.js — the Make converter is pure and stable: the saved Flugsuche probe dump must give the saved tree.
'use strict';
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { convert } = require('../build/make-convert.js');
const FX = f => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
const kit = require('../knowledge/live/kit.json'), map = require('../build/make-map.json'), extra = require('../knowledge/live/icons-extra.json').icons || {};

test('convert(): Flugsuche dump → golden tree', () => {
  const r = convert(FX('make-fly.dump.json'), kit, map, extra, 'Flugsuche — SAP kit');
  assert.deepStrictEqual(r.tree, FX('make-fly.tree.json'));
  assert.deepStrictEqual(r.warn, []);
  assert.strictEqual(r.images.length, 3);
});

test('convert(): no fs / path / require inside the module (it is compiled into the plugin)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'build', 'make-convert.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/\brequire\(|\bfs\.|\bpath\./.test(src));
});

test('door.js accepts the golden tree', () => {
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'build', 'door.js'), path.join(__dirname, 'fixtures', 'make-fly.tree.json')]).toString();
  assert.match(out, /ALL IN/);
});

test('plugin: the compiled-in converter (slim kit) gives the same tree as the node converter', () => {
  const vm = require('vm');
  const code = fs.readFileSync(path.join(__dirname, '..', 'plugin', 'sap-bridge', 'code.js'), 'utf8');
  const a = code.indexOf('// ── GENERATED MAKE CONVERTER'), z = code.indexOf('// ── end GENERATED MAKE CONVERTER');
  assert.ok(a > 0 && z > a, 'generated block missing — run node build/plugin-bundle.js');
  const ctx = vm.createContext({});
  vm.runInContext(code.slice(a, z) + '\nthis.out = { MAKE_CONVERT, MAKE_MAP, MAKE_EXTRA, MAKE_KIT, FULL_KIT };', ctx);
  const { MAKE_CONVERT, MAKE_MAP, MAKE_EXTRA, MAKE_KIT, FULL_KIT } = ctx.out;
  const r = MAKE_CONVERT(FX('make-fly.dump.json'), MAKE_KIT, MAKE_MAP, MAKE_EXTRA, 'Flugsuche — SAP kit');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.tree)), FX('make-fly.tree.json'));
  // every kit name the tree uses is in the full packed KIT the plugin builds with
  const miss = [];
  (function walk(o) {
    if (o.cp && !FULL_KIT.c[o.cp]) miss.push('component ' + o.cp);
    if (o.st && !FULL_KIT.t[o.st]) miss.push('text style ' + o.st);
    if (o.ic && !FULL_KIT.i[o.ic]) miss.push('icon ' + o.ic);
    for (const t of [o.bg, o.bc]) if (typeof t === 'string' && !t.startsWith('RAW') && !FULL_KIT.v[t]) miss.push('variable ' + t);
    (o.nav || []).forEach(x => { if (x.icon && !FULL_KIT.i[x.icon]) miss.push('icon ' + x.icon); });
    (o.c || []).forEach(walk);
  })(r.tree);
  assert.deepStrictEqual([...new Set(miss)], []);
});

// ── make-verify: the offline "does the Figma frame equal the Make app?" check (build/make-verify.js) ────────────────────────────────────────────
// STRUCTURE = the share of nodes that land on their Make box when every part has its Make size (tests the layout logic only). GROSS = a node off by > 40 px / bigger than the screen.
const verify = f => { let out; try { out = execFileSync(process.execPath, [path.join(__dirname, '..', 'build', 'make-verify.js'), path.join(__dirname, 'fixtures', f), '--quiet']).toString(); } catch (e) { out = e.stdout.toString(); }
  return { structure: parseFloat(/STRUCTURE\s+\d+\/\d+ nodes land on their Make box = ([\d.]+) %/.exec(out)[1]), gross: parseInt(/GROSS\s+(\d+) nodes/.exec(out)[1], 10), out }; };

test('make-verify: Purchase Orders (Grid + Table + toolbars, REAL dump read from the published app) lands on the Make boxes', () => {
  const v = verify('make-po.dump.json');
  assert.ok(v.structure >= 97, v.out); assert.strictEqual(v.gross, 0, v.out);
  const r = convert(FX('make-po.dump.json'), kit, map, extra, null);
  assert.deepStrictEqual(r.warn.filter(w => /^layout:|not mapped/.test(w)), []);               // nothing was left to guess
  const find = (n, name, out = []) => { if (n.n === name) out.push(n); (n.c || []).forEach(k => find(k, name, out)); return out; };
  const [header] = find(r.tree, 'Header Row'), rows = find(r.tree, 'Row').filter(x => x.c && x.c.length === header.c.length && x.h >= 50 && x.h <= 56);   // a row is ~52 px; long supplier names wrap to ~54 px
  assert.strictEqual(rows.length, 15);                                                          // 15 items, every row has one cell per column (+ the navigation arrow)
  assert.deepStrictEqual(rows[0].c.map(k => k.w), header.c.map(k => k.w));                       // header and rows share the column widths, so they line up
  assert.strictEqual(header.c.filter(k => /^F/.test(k.s)).length, 1);                           // exactly one column flexes: the table resizes
  const [grid] = find(r.tree, 'Grid'); assert.strictEqual(grid.d, 'H'); assert.strictEqual(grid.c.length, 6);   // the six filter fields sit side by side, not stacked
});

test('convert(): status cells are kit Object Status components (state + badge), filter fields are Multi Combobox with the sample tokens hidden', () => {
  const r = convert(FX('make-po.dump.json'), kit, map, extra, null), all = [];
  (function w(n) { all.push(n); (n.c || []).forEach(w); })(r.tree);
  const st = all.filter(n => n.k === 'i' && n.cp === 'Object Status');
  assert.strictEqual(st.length, 15);                                                              // one per order, never plain text
  assert.ok(st.every(n => n.tx && n.tx.Text));
  assert.ok(st.filter(n => n.pr.Inverted === 'Yes').every(n => ['Warning', 'Error'].includes(n.pr.Semantic)));   // Pending Approval / Rejected are badges
  assert.ok(st.some(n => n.pr.Inverted === 'Yes') && st.some(n => n.pr.Semantic === 'Success' && n.pr.Inverted === 'No'));
  const mc = all.filter(n => n.k === 'i' && n.cp === 'Multi Combobox');
  assert.strictEqual(mc.length, 5);
  assert.ok(mc.every(n => ['1st Token', '2nd Token', 'Overflow Link / Typing'].every(x => n.hide.includes(x)) && n.add[0].into === '⿻ Tokens Compact' && n.add[0].t));   // sample tokens hidden, the placeholder text goes into the tokens slot
  assert.ok(st.every(n => n.pr['Large Design'] === undefined && n.s === 'XX'));                 // normal size (Large Design = Yes is the 24 px display size); the box follows Make
  assert.ok(st.filter(n => n.pr.Inverted === 'Yes').every(n => n.h >= 22) && st.filter(n => n.pr.Inverted === 'No').every(n => n.h >= 16 && n.h <= 20));   // badge taller than plain status, like Make (24 / 18 px)
});

test('make-verify: hidden / off-screen controls (OverflowToolbar clones, probe hid:1) never enter the tree', () => {
  const D = FX('make-po.dump.json'), before = convert(D, kit, map, extra, null);
  const clone = { ...D.controls.find(c => c.cls === 'sap.m.Button'), id: '__clone', box: [9000, 10, 32, 32], props: { icon: 'sap-icon://overflow' } }, hid = { ...clone, id: '__hid', box: [400, 60, 32, 32], hid: 1 };
  D.controls.push(clone, hid);
  const after = convert(D, kit, map, extra, null);
  assert.deepStrictEqual(after.tree, before.tree);
});

test('make-verify: saved dumps do not get worse (regression floor per app)', () => {
  // floors are what the converter reached when this check was written; raise them when the converter improves
  const floors = { 'make-fly.dump.json': 46, 'make-search.dump.json': 56, 'make-tabs.dump.json': 98 };
  for (const [f, min] of Object.entries(floors)) { const v = verify(f); assert.ok(v.structure >= min, `${f}: STRUCTURE ${v.structure} % < ${min} %\n${v.out}`); assert.strictEqual(v.gross, 0, `${f}\n${v.out}`); }
});

test('convert(): a wrapped Text keeps only the lines Make shows (maxLines, or what fits the measured box) — Figma truncates with "…"', () => {
  const find = (t, s) => { let hit = null; JSON.stringify(t, (k, v) => { if (v && v.k === 't' && v.t === s) hit = v; return v; }); return hit; };
  const run = mut => {
    const d = FX('make-po.dump.json'), base = convert(d, kit, map, extra, 'T').tree, c = d.controls.find(x => x.cls === 'sap.m.Text' && x.props.text && find(base, x.props.text));
    mut(c); return { c, node: find(convert(d, kit, map, extra, 'T').tree, c.props.text) };
  };
  const a = run(c => { c.box[3] = 32; c.tx = Object.assign({}, c.tx, { fs: 14, lh: 16 }); c.props.text = 'Seal leakage with pressure drop in the main pump housing'; });
  assert.strictEqual(a.node.ml, 2, 'box of 2 lines → 2 lines');
  const b = run(c => { c.box[3] = 64; c.tx = Object.assign({}, c.tx, { fs: 14, lh: 16 }); c.props.maxLines = 3; c.props.text = 'Belt misalignment on the conveyor line, please check the drive'; });
  assert.strictEqual(b.node.ml, 3, 'the control maxLines wins');
  const one = run(c => { c.box[3] = 16; c.tx = Object.assign({}, c.tx, { fs: 14, lh: 16 }); c.props.text = 'Single line'; });
  assert.strictEqual(one.node.ml, undefined, 'a one-line text is not limited');
});

test('convert(): a flex-wrap row of small items becomes ONE Figma wrap row (re-wraps when the frame is resized), and still lands on the Make boxes', () => {
  const r = convert(FX('make-maint.dump.json'), kit, map, extra, 'M');
  const rows = []; JSON.stringify(r.tree, (k, v) => { if (v && v.wrapRow) rows.push(v); return v; });
  assert.strictEqual(rows.length, 1, 'the filter bar');
  assert.strictEqual(rows[0].d, 'H'); assert.match(rows[0].s, /^F/, 'wrap row spans its parent'); assert.ok(rows[0].c.length >= 6);
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'build', 'make-verify.js'), path.join(__dirname, 'fixtures', 'make-maint.dump.json'), '--quiet']).toString();
  assert.match(out, /STRUCTURE .*100 %/); assert.match(out, /GROSS +0 /);
});

test('convert(): a table that Make scrolls sideways (columns wider than the table) is fitted to the table width — every row adds up', () => {
  const r = convert(FX('make-support.dump.json'), kit, map, extra, 'S');
  const rows = []; JSON.stringify(r.tree, (k, v) => { if (v && (v.n === 'Header Row' || v.n === 'Row') && v.c && v.c.length > 5 && v.c[0].n === 'Cell') rows.push(v); return v; });
  assert.ok(rows.length >= 20, 'header + rows');
  for (const row of rows) assert.ok(Math.abs(row.c.reduce((q, c) => q + c.w, 0) - row.w) <= 1.5, `cells ${row.c.reduce((q, c) => q + c.w, 0)} vs row ${row.w}`);
});

test('convert(): an OPEN Dialog (static area, position:fixed → probe says hidden) becomes its own frame; a page without one has none', () => {
  const r = convert(FX('make-dialog.dump.json'), kit, map, extra, 'D');
  assert.strictEqual(r.extra.length, 1);
  const e = r.extra[0]; assert.match(e.name, /^Dialog — Case /); assert.deepStrictEqual(e.tree.w, 832); assert.ok(e.tree.c.length >= 3, 'title bar, content, footer');
  const js = JSON.stringify(e.tree);
  assert.ok(js.includes('"✏️ Label":"Customer"') && js.includes('"✏️ Label":"Response Deadline"') && js.includes('Conversation'), 'the dialog fields are there');
  assert.strictEqual(convert(FX('make-support.dump.json'), kit, map, extra, 'S').extra.length, 0);
});
