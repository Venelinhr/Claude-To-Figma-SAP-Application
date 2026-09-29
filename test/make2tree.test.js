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
