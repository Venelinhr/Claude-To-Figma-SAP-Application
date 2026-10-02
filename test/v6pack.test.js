// v6pack.test.js — the Figma Agent v6 pack: what the plugin writes into a file must load and behave the same as in Node.
'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('node:fs'), path = require('node:path');
const { buildPack, installJs, MAX_ENTRY } = require('../build/v6pack.js');
const { applyOps } = require('../build/ops.js');
const { sketch, scene, layerTree } = require('../build/sketch.js');
const AF = Object.getPrototypeOf(async () => {}).constructor;

const pack = buildPack();
const store = { v6rt: pack.rt, v6build: pack.build, v6tools: pack.tools };
for (const [k, v] of Object.entries(pack.golds)) store['gold_' + k] = v;
const fakeFigma = () => { global.figma = { root: { getSharedPluginDataKeys: () => Object.keys(store), getSharedPluginData: (ns, k) => store[k] || '', setSharedPluginData: (ns, k, v) => { store[k] = v; } } }; };
const tools = (name, ops, mode) => { fakeFigma(); return new AF('G', 'NAME', 'OPS', 'MODE', store.v6tools)(k => store[k] || '', name, ops, mode); };

test('pack: every entry fits one sharedPluginData value, golds pass the door, a broken dump is skipped', () => {
  for (const [k, v] of Object.entries(store)) assert.ok(v.length < MAX_ENTRY, `${k} is ${v.length} chars`);
  assert.ok(Object.keys(pack.golds).length >= 3);
  assert.ok(pack.skipped.some(s => /broken dump/.test(s)));
  assert.match(installJs(pack), /setSharedPluginData\('sapfiori', k, D\[k\]\)/);
});

test('in-file tools: list, names, plan — the plan equals the Node sketch of the same tree', async () => {
  const list = await tools('', null, 'list');
  assert.match(list, /support-overview-1440 \| 1440x800/);
  const names = await tools('support-overview-1440', null, 'names');
  assert.match(names, /"Page title" text: "Customer Support Overview"/);
  assert.match(names, /repeats x6/);
  const ops = { set: [{ n: 'Page title', t: 'Orders' }], clone: [{ n: 'Row CS-10482', times: 1 }] };
  const r = await tools('support-overview-1440', ops, 'plan');
  const T = JSON.parse(pack.golds['support-overview-1440']).tree;
  assert.deepStrictEqual(applyOps(T, ops).errs, []);
  assert.strictEqual(r.plan, scene(T).text);
  assert.strictEqual(r.layers, layerTree(T));
  const phone = await tools('approval-timeline-362', {}, 'plan');
  assert.strictEqual(phone.plan, sketch(JSON.parse(pack.golds['approval-timeline-362']).tree));
});

test('in-file tools: geometry and unknown layers are refused, a missing gold is named', async () => {
  const r = await tools('support-overview-1440', { set: [{ n: 'Page title', w: 9 }, { n: 'Nope', t: 'x' }] }, 'plan');
  assert.strictEqual(r.errors.length, 2);
  assert.match(await tools('nope', {}, 'plan'), /NO GOLD "nope"/);
});

test('in-file build helpers load and carry the full kit', async () => {
  fakeFigma();
  const h = await new AF(store.v6build)();
  for (const f of ['I', 'T', 'fill', 'stroke', 'space', 'AL', 'put', 'sub', 'setP']) assert.strictEqual(typeof h[f], 'function', f);
  assert.ok(Object.keys(h.KIT.c).length > 100);
});

test('the lean Figma Agent skill stays small (fast to read every turn)', () => {
  const s = fs.readFileSync(path.join(__dirname, '..', 'docs', 'v6', 'figma-agent-skill.md'), 'utf8');
  assert.ok(s.length < 15000, `skill is ${s.length} chars`);
  assert.match(s, /^---\nname: sap-figma-agent\n/);
});
