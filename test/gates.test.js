const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PLAN = path.join(ROOT, 'knowledge/gold/plans/flight-search-results.plan.json');
const TREE = path.join(ROOT, 'test/fixtures/tree-gold-270-6722.json');

function run(args, env) {
  try {
    return { code: 0, out: execFileSync(process.execPath, ['build/gates.js', ...args], { cwd: ROOT, env: { ...process.env, ...env } }).toString() };
  } catch (e) { return { code: e.status, out: String(e.stdout || '') }; }
}
function jobDir(tree) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gates-'));
  if (tree) fs.writeFileSync(path.join(d, 'tree.json'), JSON.stringify(tree));
  return d;
}

// a tiny clean plan + build that passes
function cleanJob() {
  const d = jobDir([{ type: 'TEXT', name: 'Title', text: 'Purchase Orders', fill: 'sapTitleColor', font: '72' }]);
  const plan = path.join(d, 'plan.json');
  fs.writeFileSync(plan, JSON.stringify({ rows: [{ section: 'A', kind: 'text', element: 'Title', text: 'Purchase Orders', token: 'sapTitleColor' }] }));
  return { d, plan };
}

test('gates.js: the real gold build — measured MATCH 97 %, its 3 real hygiene lines block the pass, audit.txt written', () => {
  const d = jobDir(JSON.parse(fs.readFileSync(TREE, 'utf8')));
  const r = run([PLAN, d]);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /MATCH 97% · HYGIENE 3 · EYE — \(no reference\)/);
  assert.match(r.out, /NOT PASSED — hygiene 3/);
  assert.ok(fs.existsSync(path.join(d, 'audit.txt')));
});

test('gates.js: raw colour fails with the reason; --record writes nothing on a fail', () => {
  const { d, plan } = cleanJob();
  fs.writeFileSync(path.join(d, 'tree.json'), JSON.stringify([
    { type: 'TEXT', name: 'Title', text: 'Purchase Orders', fill: 'sapTitleColor', font: '72' },
    { type: 'FRAME', name: 'Card', fill: 'RAW' }]));
  const mem = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));
  const r = run([plan, d, '--record', 'test', '--node', '1:2'], { SAP_BRIDGE_MEMORY_DIR: mem });
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /NOT PASSED — hygiene 1/);
  assert.match(r.out, /not recorded/);
  assert.ok(!fs.existsSync(path.join(mem, 'v4-run-log.md')));
});

test('gates.js: a pass with --record adds one run-log line above "Related", with the time', () => {
  const { d, plan } = cleanJob();
  const mem = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-'));
  fs.writeFileSync(path.join(mem, 'v4-run-log.md'), 'Runs:\n- old\n\nRelated: [[x]].\n');
  const r = run([plan, d, '--record', 'po list', '--node', '5:6', '--ms', '185000'], { SAP_BRIDGE_MEMORY_DIR: mem });
  assert.strictEqual(r.code, 0, r.out);
  const log = fs.readFileSync(path.join(mem, 'v4-run-log.md'), 'utf8');
  assert.match(log, /"po list" → 5:6 · via \/screen · measured MATCH 100% · EYE — · gate rounds 0 · 3m 5s · PASS\nRelated/);
});

test('gates.js: no tree = not passed, file named', () => {
  const r = run([PLAN, jobDir(null)]);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /gate files missing: tree\.json/);
});

// ── v5 layout trees ──
const TREE_FLIGHT = path.join(ROOT, 'knowledge/gold/trees/flight-results-1000.tree.json');
const TREE_PO = path.join(ROOT, 'knowledge/gold/trees/po-list-report-1440.tree.json');
const node = (args) => { try { return { code: 0, out: execFileSync(process.execPath, args, { cwd: ROOT }).toString() }; } catch (e) { return { code: e.status, out: String(e.stdout || '') + String(e.stderr || '') }; } };

test('tree.js show: the first screen — ASCII, layer tree, lists with components + states, lint clean', () => {
  const r = node(['build/tree.js', 'show', TREE_PO, '2']);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /SCREEN {2}Purchase Orders — List Report · 1440×640 · 88 layers/);
  assert.match(r.out, /\+Purchase Orders — List Report-+/);
  assert.match(r.out, /Components {3}Table Cell ×31 · Table Cell \(Object Identifier - Link\) ×6/);
  assert.match(r.out, /LINT {2}✓ clean — ready to build/);
});

test('tree.js lint: unknown kit name, raw colour, unstyled text, generic name → exit 1', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tree-')), 'bad.tree.json');
  fs.writeFileSync(f, JSON.stringify({ n: 'Frame 1', w: 100, h: 50, d: 'V', c: [{ n: 'x', k: 't', t: 'Hi', w: 10, h: 10, bg: 'RAW#ff0000' }, { n: 'y', k: 'i', cp: 'Buttonz', w: 10, h: 10 }] }));
  const r = node(['build/tree.js', 'lint', f]);
  assert.strictEqual(r.code, 1);
  for (const re of [/Buttonz: NOT FOUND/, /raw colour #ff0000/, /no SAP text style/, /"Frame 1": generic layer name/]) assert.match(r.out, re);
});

test('kit.js pack --plan <tree>: every name found; an icon that is also a component lands in the icon list', () => {
  const r = node(['build/kit.js', 'pack', '--plan', TREE_PO]);
  assert.strictEqual(r.code, 0);
  assert.doesNotMatch(r.out, /NOT FOUND/);
  const K = JSON.parse(r.out.replace(/^const KIT = /, '').replace(/;\s*$/, ''));
  for (const [g, n] of [['i', 'settings'], ['i', 'filter'], ['c', 'Table Cell'], ['c', 'Object Status'], ['v', 'sapList_BorderColor'], ['t', 'H4/Bold']])
    assert.match(K[g][n] || '', /^[0-9a-f]{40}$/, `KIT.${g}["${n}"]`);
});

test('render.js: install stores the runtime; lean sends only KIT + tree and refuses an old runtime', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
  assert.strictEqual(node(['build/render.js', '--install', '--out', path.join(d, 'i.js')]).code, 0);
  assert.strictEqual(node(['build/render.js', TREE_FLIGHT, '--lean', '--out', path.join(d, 'l.js')]).code, 0);
  const i = fs.readFileSync(path.join(d, 'i.js'), 'utf8'), l = fs.readFileSync(path.join(d, 'l.js'), 'utf8');
  const ver = i.match(/v5rt_ver', '([0-9a-f]{10})'/)[1];
  assert.ok(l.includes(`!== '${ver}') return 'INSTALL FIRST'`));
  assert.ok(!l.includes('function NODE') && l.includes('const TREE = ') && l.length < 25000);
  for (const f of ['i.js', 'l.js']) new Function('figma', `return (async()=>{${fs.readFileSync(path.join(d, f), 'utf8')}})`);
});

test('verify-tree.js: a built layer that differs from the tree is named; an exact build passes', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-'));
  const tree = { n: 'Screen', sz: 'x', w: 100, h: 50, d: 'V', bg: 'sapBackgroundColor', c: [
    { n: 'Title', k: 't', t: 'Orders', st: 'H4/Bold', bg: 'sapTitleColor', w: 60, h: 20 },
    { n: 'Status', k: 'i', cp: 'Object Status', pr: { Semantic: 'Warning' }, tx: { Text: 'Pending' }, w: 60, h: 16 }] };
  const good = [['Screen', 'FRAME', '', {}, 'sapBackgroundColor', '', '', '', '', []], ['Title', 'TEXT', '', {}, 'sapTitleColor', '', 'H4/Bold', 'Orders', '72', []],
    ['Status', 'INSTANCE', 'Object Status', { Semantic: 'Warning' }, '', '', '', '', '', ['Pending']]];
  fs.writeFileSync(path.join(d, 't.json'), JSON.stringify(tree));
  fs.writeFileSync(path.join(d, 'b.json'), JSON.stringify(good));
  let r = node(['build/verify-tree.js', path.join(d, 't.json'), path.join(d, 'b.json')]);
  assert.strictEqual(r.code, 0, r.out); assert.match(r.out, /MATCH 100%/);
  good[2][3].Semantic = 'Error'; good[2][9] = ['Warning']; good[1][8] = 'Inter';
  fs.writeFileSync(path.join(d, 'b.json'), JSON.stringify(good));
  r = node(['build/verify-tree.js', path.join(d, 't.json'), path.join(d, 'b.json')]);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Status: Semantic=Error, tree Warning · inner text "Pending" missing/);
  assert.match(r.out, /"Title": font Inter/);
});
