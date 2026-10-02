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
  const T = JSON.parse(pack.golds['support-overview-1440']).tree, base0 = JSON.parse(pack.golds['support-overview-1440']).tree;
  assert.deepStrictEqual(applyOps(T, ops).errs, []);
  require('../build/content-audit.js').autoname(T, base0, JSON.stringify(ops));   // the in-file tool renames stale layers before it draws the plan
  assert.strictEqual(r.plan, scene(T).text);
  assert.strictEqual(r.layers, layerTree(T));
  const phone = await tools('approval-timeline-362', {}, 'plan');
  const P = JSON.parse(pack.golds['approval-timeline-362']).tree; require('../build/content-audit.js').autoname(P, JSON.parse(pack.golds['approval-timeline-362']).tree, '{}');
  assert.strictEqual(phone.plan, sketch(P));
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

test('driver: a request that names summary cards picks a layout with a card band; an invoice list picks the invoice layout', () => {
  const { execFileSync } = require('node:child_process'), os = require('node:os');
  const run = text => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'front-')); try { return execFileSync(process.execPath, [path.join(__dirname, '..', 'build', 'front.js'), text, '--job', d], { stdio: 'pipe' }).toString(); } catch (e) { return String(e.stdout || ''); } };
  assert.match(run('Procurement Overview with four summary cards and a table of purchase orders, filters supplier plant buyer status'), /gold support-overview-1440/);
  assert.match(run('Open supplier invoices list with filters and status'), /gold invoice-list-1440/);
});

// ── content audit (2026-10-02): the plugin once shipped 7 headers over 8-cell rows with old support statuses under "Status"
const { audit, autoname } = require('../build/content-audit.js');
const cellT = (n, t) => ({ n, k: 'i', cp: 'Table Cell', pr: { '✏️ Text': t }, s: 'FF', w: 100, h: 40 });
const tbl = (head, rows) => ({ n: 'Screen', w: 1440, h: 800, d: 'V', c: [{ n: 'Table Area', d: 'V', c: [
  { n: 'Header Row', d: 'H', c: head.map((h, i) => ({ n: 'Header ' + h, k: 'i', cp: 'Table Cell', tx: { Text: h } })) },
  ...rows.map((r, j) => ({ n: 'Row ' + r[0], d: 'H', c: r.map((v, i) => cellT(i ? 'Cell' + i : 'Case ' + r[0], v)) }))] }] });
const OLD = tbl(['Case Number', 'Customer', 'Status'], [['CS-10482', 'Brightline Logistics', 'Escalated'], ['CS-10479', 'Nordwind Energy', 'Resolved']]);
const REQ = 'purchase orders with PO number, supplier and status';

test('content audit: leftovers and a column count mismatch are caught (the real faulty job)', () => {
  const bad = tbl(['PO Number', 'Supplier'], [['PO-1', 'Acme', 'Escalated'], ['PO-2', 'Orbis', 'Resolved']]);   // header lost a column, rows kept it
  const p = audit(bad, OLD, REQ);
  assert.ok(p.some(x => /^COLUMNS/.test(x)), p.join('\n'));
  assert.ok(p.some(x => /^LEFTOVER "escalated"/.test(x)), p.join('\n'));
});

test('content audit: clean content passes, and layer names are rewritten from the new content', () => {
  const ok = tbl(['PO Number', 'Supplier', 'Status'], [['PO-1', 'Acme Parts', 'Late Delivery'], ['PO-2', 'Orbis Safety', 'Delivered']]);
  assert.deepStrictEqual(audit(ok, OLD, REQ).filter(x => !/^NAMES/.test(x)), []);
  const n = autoname(ok, OLD, REQ), names = []; (function w(o) { names.push(o.n); (o.c || []).forEach(w); })(ok);
  assert.ok(n >= 0);
  assert.ok(!names.some(x => /Case Number|Customer|Escalated/i.test(x)), names.join(' | '));
});

test('content audit: one status label = one colour; one column = one date format', () => {
  const st = { n: 'S', c: [{ n: 'a', k: 'i', cp: 'Object Status', tx: { Text: 'Open' }, pr: { Semantic: 'Information' } }, { n: 'b', k: 'i', cp: 'Object Status', tx: { Text: 'Open' }, pr: { Semantic: 'None' } }] };
  assert.ok(audit(st, { n: 'S' }, 'x').some(x => /^STATUS "Open"/.test(x)));
  const dt = tbl(['Due'], [['05 Oct 2026'], ['2024-09-15']]);
  assert.ok(audit(dt, { n: 'S' }, 'x').some(x => /^DATES/.test(x)));
});

test('in-file build refuses old content (the same audit runs inside Figma)', async () => {
  const r = await tools('support-overview-1440', { set: [{ n: 'Page title', t: 'Orders' }] }, 'build');
  assert.ok(r.errors && r.errors.some(x => /^LEFTOVER/.test(x)), JSON.stringify(r).slice(0, 200));
});

test('compact ops: filters, cards and table are filled by position; header and rows always agree; link cells need their second line', () => {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge', 'gold', 'v6', 'support-overview-1440.tree.json'), 'utf8'));
  const row = (n, d) => [{ t: n, d }, 'Acme', 'Steel', '5 PC', 'Lena', '01 Oct 2026', { t: 'Late', sem: 'Error' }];
  const r = applyOps(T, { filters: [{ label: 'Supplier' }, { from: 4, label: 'Delivery Date' }], cards: [{ title: 'Open', value: '1', caption: 'x' }, { title: 'Late', value: '2', caption: 'y' }],
    table: { keep: [0, 1, 2, 3, 4, 5, 7], header: ['PO', 'Supplier', 'Material', 'Qty', 'Buyer', 'Date', 'Status'], rows: [row('45001', 'Plant 1'), row('45002', 'Plant 2'), row('45003', 'Plant 3')] } });
  assert.deepStrictEqual(r.errs, []);
  const find = (o, re) => re.test(o.n || '') ? o : (o.c || []).map(c => find(c, re)).find(Boolean);
  const area = find(T, /^Table Area$/), head = area.c.find(k => /^Header Row/.test(k.n)), rows = area.c.filter(k => /^Row/.test(k.n));
  assert.strictEqual(rows.length, 3); for (const x of rows) assert.strictEqual(x.c.length, head.c.length);
  assert.strictEqual(find(T, /^Summary Cards$/).c.filter(k => /^Card /.test(k.n)).length, 2);
  assert.strictEqual(find(T, /^Filter Bar$/).c.filter(k => /^Filter /.test(k.n) && !/spacer|Actions/.test(k.n)).length, 2);
  const bad = applyOps(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge', 'gold', 'v6', 'support-overview-1440.tree.json'), 'utf8')), { table: { keep: [0, 1], header: ['A', 'B'], rows: [['x', 'y']] } });
  assert.ok(bad.errs.some(e => /link cell/.test(e)), bad.errs.join('|'));
});

test('capabilities: the NEED block names the real layers, says when a layout has no cards, and flags link columns', () => {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge', 'gold', 'v6', 'invoice-list-1440.tree.json'), 'utf8'));
  const L = require('../build/content-audit.js').capabilities(T.tree || T).join('\n');
  assert.match(L, /cards → none/); assert.match(L, /0: Invoice \| LINK/); assert.match(L, /table title: \{n:"Table title"/);
  const base = tbl(['A'], [['x']]); base.c.push({ n: 'N', k: 't', t: '1000 abc' });
  const now = tbl(['A'], [['x']]); now.c.push({ n: 'M', k: 't', t: '1000' });
  assert.ok(!audit(now, { n: 'S', c: [{ n: 'N', k: 't', t: '1000' }] }, 'x').some(x => /^LEFTOVER "1000"/.test(x)), 'a plain number is content, not a leftover');
});

test('reflow: a step cloned into a phone stack grows the stack and the frame by itself; the door accepts exactly that; removing shrinks back', () => {
  const { baselineDiff } = require('../build/door.js');
  const load = () => { const g = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge', 'gold', 'v6', 'approval-timeline-362.tree.json'), 'utf8')); return g.tree || g; };
  const T = load(), B = load(), h0 = T.h;
  assert.deepStrictEqual(applyOps(T, { clone: [{ n: 'Step 5', times: 1 }] }).errs, []);
  assert.ok(T.h > h0 && T.gh === T.h - h0, `root ${h0} → ${T.h}`);
  assert.deepStrictEqual(baselineDiff(T, B, []), [], 'the script-made growth must not be a geometry violation');
  T.h += 7; assert.ok(baselineDiff(T, B, []).length > 0, 'a model edit on top of it still is');
  const R = load(); applyOps(R, { remove: ['Step 5'] }); assert.ok(R.h < h0);
  const L = require('../build/content-audit.js').capabilities(load()).join('\n');
  assert.match(L, /repeat → "Approval steps" has 5 "Step" groups/); assert.ok(!/shell bar title: \{n:"\?"/.test(L) && !/filters → none/.test(L));
});
