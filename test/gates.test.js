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
