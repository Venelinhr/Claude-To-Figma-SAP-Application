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

test('make-verify: Purchase Orders (Grid + Table + toolbars, synthetic dump rebuilt from the failing Make app) lands on the Make boxes', () => {
  const v = verify('make-po.dump.json');
  assert.ok(v.structure >= 97, v.out); assert.strictEqual(v.gross, 0, v.out);
  const r = convert(FX('make-po.dump.json'), kit, map, extra, null);
  assert.deepStrictEqual(r.warn.filter(w => /^layout:|not mapped/.test(w)), []);               // nothing was left to guess
  const find = (n, name, out = []) => { if (n.n === name) out.push(n); (n.c || []).forEach(k => find(k, name, out)); return out; };
  const [header] = find(r.tree, 'Header Row'), rows = find(r.tree, 'Row').filter(x => x.c && x.c.length === header.c.length && x.h === 51);
  assert.strictEqual(rows.length, 15);                                                          // 15 items, every row has one cell per column (+ the navigation arrow)
  assert.deepStrictEqual(rows[0].c.map(k => k.w), header.c.map(k => k.w));                       // header and rows share the column widths, so they line up
  assert.strictEqual(header.c.filter(k => /^F/.test(k.s)).length, 1);                           // exactly one column flexes: the table resizes
  const [grid] = find(r.tree, 'Grid'); assert.strictEqual(grid.d, 'H'); assert.strictEqual(grid.c.length, 6);   // the six filter fields sit side by side, not stacked
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
