// plugin.test.js — guards for SAP Bridge v2:  node --test plugin-v2/test/plugin.test.js
'use strict';
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path'), vm = require('vm'), { spawnSync } = require('child_process');
const D = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(D, f), 'utf8');

test('manifest: valid, dev ports of both bridges and the Make port range', () => {
  const m = JSON.parse(read('manifest.json')), dom = m.networkAccess.devAllowedDomains;
  assert.strictEqual(m.main, 'code.js'); assert.strictEqual(m.ui, 'ui.html');
  for (const p of [41778, 41779, 41788, 41789, 41795]) assert.ok(dom.includes('http://localhost:' + p), 'port ' + p);
});

test('code.js and the ui.html script parse', () => {
  new vm.Script(read('code.js'), { filename: 'code.js' });
  const m = read('ui.html').match(/<script[^>]*>([\s\S]*)<\/script>/); assert.ok(m, 'no script in ui.html');
  new vm.Script(m[1], { filename: 'ui.html' });
});

test('no user-specific path is hard-coded', () => {
  for (const f of ['code.js', 'ui.html']) assert.ok(!/\/Users\/[A-Za-z0-9._-]+\//.test(read(f)), f + ' contains a /Users/<name>/ path');
});

test('generated blocks are in place (2 runtimes, 1 Make converter)', () => {
  const c = read('code.js'), n = re => (c.match(re) || []).length;
  assert.strictEqual(n(/^\/\/ ── GENERATED RUNTIME/gm), 2);
  assert.strictEqual(n(/^\/\/ ── end GENERATED RUNTIME/gm), 2);
  assert.strictEqual(n(/^\/\/ ── GENERATED MAKE CONVERTER/gm), 1);
  assert.strictEqual(n(/^\/\/ ── end GENERATED MAKE CONVERTER/gm), 1);
});

test('the Make engine is not older than its source (drift guard)', () => {
  const app = process.env.SAP_APP || path.join(require('os').homedir(), 'Downloads', 'Claude-To-Figma-SAP-Application');
  if (!fs.existsSync(path.join(app, 'build', 'make-convert.js'))) return;                   // the source project is not on this machine
  const r = spawnSync(process.execPath, [path.join(D, 'sync-make-engine.js'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
});

test('no new empty catch blocks in the hand-written part of code.js', () => {
  const c = read('code.js'), cut = s => { const a = s.indexOf('// <<MAKESA>>'); return a < 0 ? s : s.slice(0, a); };
  const strip = s => s.replace(/\/\/ ── GENERATED RUNTIME[\s\S]*?\/\/ ── end GENERATED RUNTIME ──\n?/g, '').replace(/\/\/ ── GENERATED MAKE CONVERTER[\s\S]*?\/\/ ── end GENERATED MAKE CONVERTER ──\n?/g, '');
  const hand = strip(c), empty = (hand.match(/catch\s*(\([^)]*\))?\s*\{\s*\}/g) || []).length;
  assert.ok(empty <= 3, 'empty catch blocks left in hand-written code: ' + empty + ' (use E(where, e))');
});

test('ui.html: every <button> has text or an aria-label, tabs have a tablist', () => {
  const h = read('ui.html');
  assert.ok(/role="tablist"/.test(h), 'tablist role');
  const bad = (h.match(/<button\b[^>]*>\s*<\/button>/g) || []).filter(b => !/aria-label=/.test(b));
  assert.deepStrictEqual(bad, []);
});
