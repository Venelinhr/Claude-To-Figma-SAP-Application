// v6 — build/run.js (the one-command driver) and its parts: exit codes, the ASSUMED ledger, the geometry guard, the text lane,
// STRUCT-SIM, the gold flywheel. Nothing here talks to Figma or to the bridge (a dead port stands in for "bridge down").
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'v6-'));
const node = (args, env) => { const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, SAP_RUN_NO_ENSURE: '1', SAP_BRIDGE_PORT: '9', ...(env || {}) } }); return { code: r.status, out: String(r.stdout || '') + String(r.stderr || '') }; };
const run = (args, env) => node(['build/run.js', ...args], env);
const REF = path.join(ROOT, 'bridge-out/flight-v5b/ref.png');
const PO = 'purchase order list report with supplier and status filters';
const treeOf = job => JSON.parse(fs.readFileSync(path.join(job, 'tree.json'), 'utf8'));

test('classifyAsk: only an ask that changes the screen blocks; the rest gets a documented SAP default', () => {
  const { classifyAsk } = require('../build/run.js');
  assert.strictEqual(classifyAsk('the reference looks like a mobile screen 390×844 — build it as one?').blocking, true);
  assert.strictEqual(classifyAsk('floorplan: list report or object page?').blocking, true);
  const c = classifyAsk('brand colour #de307c (…) on 3: Book — which SAP role?');
  assert.strictEqual(c.blocking, false); assert.match(c.default, /Button Primary/);
  assert.strictEqual(classifyAsk('icon shape #3 24×24 ×2 — which SAP icon?').blocking, false);
  assert.strictEqual(classifyAsk('something new nobody has seen').blocking, false);
});

test('text job: the skeleton is found, the model is asked for CONTENT only (exit 2), the output stays short', () => {
  const job = tmp(), r = run([PO, '--job', job, '--dry']);
  assert.strictEqual(r.code, 2, r.out);
  assert.match(r.out, /GOLD po-list-report-1440/); assert.match(r.out, /NEED\s+real content/); assert.match(r.out, /no geometry/);
  assert.ok(r.out.trim().split('\n').length <= 20, 'the skeleton names fit in ≤ 20 lines');
});

test('text lane: ops put content on the skeleton, geometry untouched, door ALL IN, dry run ready (exit 0)', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  fs.writeFileSync(path.join(job, 'ops.json'), JSON.stringify({ set: [{ n: 'Page title', t: 'Open Purchase Orders' }, { n: 'Table title', t: 'Open Purchase Orders (12)' }] }));
  const r = run(['--job', job, '--resume', '--spec-json', path.join(job, 'ops.json'), '--as-is', '--dry']);   // --as-is: the content audit is tested below
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /RESKIN ✓ 2 set/); assert.match(r.out, /DOOR ✓ ALL IN/); assert.match(r.out, /READY \(dry run\)/);
  assert.ok(JSON.stringify(treeOf(job)).includes('Open Purchase Orders (12)'));
});

test('content audit in the driver: partial content (old skeleton texts left) stops before any build; --as-is is refused inside a plugin job', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  fs.writeFileSync(path.join(job, 'ops.json'), JSON.stringify({ set: [{ n: 'Page title', t: 'Open Purchase Orders' }] }));
  const r = run(['--job', job, '--resume', '--spec-json', path.join(job, 'ops.json'), '--dry']);
  assert.strictEqual(r.code, 1, r.out); assert.match(r.out, /CONTENT ✗/); assert.match(r.out, /LEFTOVER/); assert.doesNotMatch(r.out, /READY/);
  const p = node(['build/run.js', '--job', job, '--resume', '--as-is', '--dry'], { SAP_BRIDGE_JOB: 'x' });
  assert.match(p.out, /not allowed in a plugin job/);
});

test('reskin.js: geometry / structure keys are refused, nothing is written', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  const ops = path.join(job, 'bad.json'), before = fs.readFileSync(path.join(job, 'tree.json'), 'utf8');
  fs.writeFileSync(ops, JSON.stringify({ set: [{ n: 'Page title', w: 999 }] }));
  const r = node(['build/reskin.js', path.join(job, 'tree.json'), ops]);
  assert.strictEqual(r.code, 1); assert.match(r.out, /geometry/); assert.strictEqual(fs.readFileSync(path.join(job, 'tree.json'), 'utf8'), before);
});

test('reskin.js clone: copies get unique layer names, inner ops address the original names', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  const T = treeOf(job); let row = null; (function w(o) { if (!row && o.d === 'H' && (o.c || []).some(k => k.k === 't')) row = o; (o.c || []).forEach(w); })(T);
  assert.ok(row, 'the gold has a row with a text leaf');
  const leaf = row.c.find(k => k.k === 't'), ops = path.join(job, 'clone.json');
  fs.writeFileSync(ops, JSON.stringify({ clone: [{ n: row.n, times: 2, with: [[{ n: leaf.n, t: 'copy one' }], [{ n: leaf.n, t: 'copy two' }]] }] }));
  const r = node(['build/reskin.js', path.join(job, 'tree.json'), ops]);
  assert.strictEqual(r.code, 0, r.out);
  const names = [], texts = []; (function w(o) { names.push(o.n); if (o.t) texts.push(o.t); (o.c || []).forEach(w); })(treeOf(job));
  assert.ok(names.includes(row.n + ' 2') && names.includes(row.n + ' 3'));
  assert.ok(texts.includes('copy one') && texts.includes('copy two'));
});

test('door --baseline: a text edit passes, a model edit of measured geometry is OUT, --allow re-opens exactly that node', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  const f = path.join(job, 'tree.json'), base = path.join(job, 'tree.baseline.json'), T = treeOf(job);
  let leaf = null; (function w(o) { if (!leaf && o.k === 't') leaf = o; (o.c || []).forEach(w); })(T); leaf.t = 'Edited text'; fs.writeFileSync(f, JSON.stringify(T));
  assert.strictEqual(node(['build/door.js', f, '--baseline', base]).code, 0);
  const T2 = treeOf(job); T2.c[0].h = (T2.c[0].h || 0) + 9; fs.writeFileSync(f, JSON.stringify(T2));
  const bad = node(['build/door.js', f, '--baseline', base]);
  assert.strictEqual(bad.code, 1); assert.match(bad.out, /OUT\s+geometry/); assert.match(bad.out, /script-owned/);
  assert.strictEqual(node(['build/door.js', f, '--baseline', base, '--allow', T2.c[0].n]).code, 0);
  const r = run(['--job', job, '--resume', '--as-is', '--dry']);   // the driver applies the same guard on every resume
  assert.strictEqual(r.code, 1); assert.match(r.out, /DOOR ✗/);
});

test('STRUCT-SIM: layout-sim --geometry-out feeds structure.js — a collapsed frame that holds content is caught before any build', () => {
  const dir = tmp(), tree = path.join(dir, 't.json'), geom = path.join(dir, 'g.json');
  fs.writeFileSync(tree, JSON.stringify({ n: 'Root', w: 300, h: 200, d: 'V', s: 'XX', c: [{ n: 'Strip', s: 'FX', w: 300, h: 1, d: 'V', c: [{ n: 'Label', k: 't', t: 'Hello', st: 'H5/Bold', bg: 'sapTextColor', s: 'HH', w: 40, h: 18 }] }] }));
  assert.strictEqual(node(['build/layout-sim.js', tree, '--geometry-out', geom]).code, 0);
  const lines = require('../build/structure.js').check(JSON.parse(fs.readFileSync(geom, 'utf8')), null);
  assert.ok(lines.some(l => /COLLAPSED\s+"Strip"/.test(l)), lines.join('|'));
  const gold = path.join(ROOT, 'knowledge/gold/trees/po-list-report-1440.tree.json'), g2 = path.join(dir, 'po.json');
  node(['build/layout-sim.js', gold, '--geometry-out', g2]);
  assert.deepStrictEqual(require('../build/structure.js').check(JSON.parse(fs.readFileSync(g2, 'utf8')), null), [], 'a proven gold tree raises no STRUCT-SIM finding');
});

test('image job (dry): a gold tree whose STRUCTURE misses the reference boxes is rejected → from zero (exit 2 = name the icons); then --resume --icons builds it', { skip: !fs.existsSync(REF) && 'needs bridge-out/flight-v5b/ref.png' }, () => {
  const job = tmp(), r = run([REF, '--job', job, '--dry']);
  assert.strictEqual(r.code, 2, r.out);                          // the first live run (job-09300515) proved that gold-adapt here gives EYE 19 % / STRUCTURE 17
  assert.match(r.out, /reference boxes are missing in its structure/); assert.match(r.out, /FROM ZERO/); assert.match(r.out, /NEED\s+name these icons/);
  assert.ok(r.out.trim().split('\n').length <= 8, 'short:\n' + r.out);
  for (const f of ['front.json', 'assumed.json', 'tree.baseline.json', 'run.json']) assert.ok(fs.existsSync(path.join(job, f)), f);
  const un = String(node(['build/spec2tree.js', path.join(job, 'see-ref/spec.json'), path.join(tmp(), 't.json')]).out.match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/)[1]);
  const icons = un.split(' · ').map(x => x.match(/^(\d+x\d+)/)[1]).filter((v, i, a) => a.indexOf(v) === i).map(w => w === '53x8' ? '53x8=text:Багаж:H5/Bold' : `${w}=navigation-right-arrow`).join(',');
  const r2 = run(['--job', job, '--resume', '--icons', icons, '--dry']);
  assert.match(r2.out, /FROM ZERO tree written/, r2.out);
  const L = JSON.parse(fs.readFileSync(path.join(job, 'assumed.json'), 'utf8'));
  for (const x of L.assumed) { assert.ok(x.id && x.text, JSON.stringify(x)); assert.ok(x.flip === null || ['density', 'text'].includes(x.flip)); }
  assert.strictEqual(new Set(L.assumed.map(x => x.id)).size, L.assumed.length, 'ledger ids are unique');
});

test('bridge down → exit 3 with both options named honestly', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  const r = run(['--job', job, '--resume', '--as-is', '--file', 'abc123']);
  assert.strictEqual(r.code, 3, r.out); assert.match(r.out, /Options/); assert.match(r.out, /fallback/); assert.match(r.out, /5-10 min/);
});

test('a screen-changing ask stops the run (exit 4) until the user answered (--go)', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  fs.writeFileSync(path.join(job, 'assumed.json'), JSON.stringify({ assumed: [], asks: ['the reference looks like a mobile screen 390×844 — build it as one?'] }));
  const stop = run(['--job', job, '--resume', '--as-is', '--dry']);
  assert.strictEqual(stop.code, 4, stop.out); assert.match(stop.out, /STOP\s+ask the user/);
  assert.strictEqual(run(['--job', job, '--resume', '--as-is', '--dry', '--go']).code, 0);
});

test('the 2-fix-round cap is enforced by the driver, not by a promise (exit 6 on the 4th build)', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  const st = JSON.parse(fs.readFileSync(path.join(job, 'run.json'), 'utf8')); st.builds = 3; fs.writeFileSync(path.join(job, 'run.json'), JSON.stringify(st));
  const r = run(['--job', job, '--resume', '--as-is', '--file', 'abc123']);
  assert.strictEqual(r.code, 6, r.out); assert.match(r.out, /2 fix rounds/); assert.match(r.out, /STATUS DRAFT/);
});

// ── gold flywheel — a temp library, never the real one
function goldJob(planText) {
  const job = tmp(), chk = path.join(job, 'check'); fs.mkdirSync(chk);
  fs.writeFileSync(path.join(job, 'tree.json'), JSON.stringify({ n: 'Root', w: 400, h: 100, d: 'V', sz: 'x', s: 'XX', bg: 'sapBackgroundColor', c: [{ n: 'Title', k: 't', t: 'Purchase Orders', st: 'H2/Bold', bg: 'sapTitleColor', s: 'HH', w: 120, h: 20 }] }));
  fs.writeFileSync(path.join(chk, 'tree.json'), JSON.stringify([{ type: 'TEXT', name: 'Title', text: 'Purchase Orders', fill: 'sapTitleColor', font: '72' }]));
  fs.writeFileSync(path.join(chk, 'plan.json'), JSON.stringify({ rows: [{ section: 'A', kind: 'text', element: 'Title', text: planText, token: 'sapTitleColor' }] }));
  return job;
}
test('gold.js: refuses a build that does not pass, promotes a measured pass, never overwrites, demote retires', () => {
  const lib = tmp(); fs.mkdirSync(path.join(lib, 'trees'));
  const env = { SAP_GOLD_DIR: lib, SAP_BRIDGE_MEMORY_DIR: tmp() };
  const bad = node(['build/gold.js', goldJob('A text the build does not have')], env);
  assert.strictEqual(bad.code, 1, bad.out); assert.match(bad.out, /REFUSED the gates do not pass/);
  const job = goldJob('Purchase Orders'), ok = node(['build/gold.js', job, '--name', 'po test'], env);
  assert.strictEqual(ok.code, 0, ok.out); assert.match(ok.out, /GOLD ✓ po-test-400/);
  assert.ok(fs.existsSync(path.join(lib, 'trees', 'po-test-400.tree.json')));
  const again = node(['build/gold.js', job, '--name', 'po test'], env);
  assert.strictEqual(again.code, 1); assert.match(again.out, /already exists — never overwritten/);
  const dem = node(['build/gold.js', '--demote', 'po-test-400'], env);
  assert.strictEqual(dem.code, 0, dem.out); assert.ok(fs.existsSync(path.join(lib, 'retired', 'po-test-400.tree.json')));
  assert.match(node(['build/gold.js', '--from-node', 'https://www.figma.com/design/k/x?node-id=12-34'], env).out, /dump-layout/);
});

test('route verbs: show prints the plan, fix lifts the cap for that job, tweak goes through the ACT router', () => {
  const job = tmp(); run([PO, '--job', job, '--dry']);
  assert.match(node(['build/route.js', 'show', job]).out, /WIREFRAME/);
  const fix = node(['build/route.js', 'fix', job]); assert.strictEqual(fix.code, 0, fix.out); assert.match(fix.out, /ROUND 3 allowed/);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(job, 'run.json'), 'utf8')).allowRound3, true);
  assert.match(node(['build/route.js', 'tweak', 'make the Save button primary', 'https://www.figma.com/design/k/x?node-id=1-2']).out, /"mode": "ACT"/);
});

test('sketch: a phone tree is drawn as a boxed wireframe (aligned glyphs, zone letters, a real bar) and a box-drawing layer tree', () => {
  const { sketch, layerTree } = require('../build/sketch.js');
  const T = { n: 'Phone', w: 390, h: 600, d: 'V', s: 'XX', c: [
    { n: 'Header row', d: 'H', s: 'FH', w: 390, h: 44, a: 'MC', c: [
      { n: 'Page header', k: 'i', cp: 'Header', pr: { Type: 'Title with back button' }, tx: { Title: 'Dream Hotel' }, s: 'FH', w: 294, h: 44 },
      { n: 'Share', k: 'i', cp: 'Icon Button', pr: { Icon: 'share' }, s: 'HH', w: 36, h: 36 }] },
    { n: 'Body', d: 'V', s: 'FH', w: 390, h: 100, c: [
      { n: 'Bar A', k: 'i', cp: 'Progress Indicator', pr: { '✏️ Progress Bar': 'write/delete to move the progress value'.slice(0, 34) }, s: 'FH', w: 358, h: 16 },
      { n: 'Bar B', k: 'i', cp: 'Progress Indicator', pr: { '✏️ Progress Bar': 'write/delete to move the progress value'.slice(0, 34) }, s: 'FH', w: 358, h: 16 }] }] };
  const s = sketch(T).split('\n');
  assert.ok(s[0].startsWith('┌') && s[s.length - 1].startsWith('└'));
  for (const l of s.filter(x => x.startsWith('│'))) assert.strictEqual([...l][39], '│', 'every row closes at the same column: ' + l);
  assert.match(s[1], /‹\s+Dream Hotel\s+⇪ │ A  Header \+ Icon Button/);      // back glyph left, title centred, share glyph right, zone letter + names
  assert.ok(s.some(l => /#+-+ │ B  Progress Indicator ×2/.test(l)), 'the bar has a fill and a track');
  const { GLYPH, SAFE_GLYPHS } = require('../build/sketch.js');
  for (const [k, g] of Object.entries(GLYPH)) assert.ok(SAFE_GLYPHS.has(g), `icon ${k} uses a glyph that can break the border: ${g}`);
  assert.ok(!/[▓░◇⌖⛟…◉○☐]/.test(sketch(T)), 'no glyph that a font may draw with another width');
  const t = layerTree(T).split('\n').map(l => l.replace(/\s+← L\d.*$/, ''));   // 2026-10-01: every line ends with a level marker
  assert.strictEqual(t[0], 'Phone 390×600 (V, FIXED)');
  assert.ok(t.includes('├─ Header row (H)') && t.some(l => /Bar ×2 \(Progress Indicator\)/.test(l)), t.join('\n'));
  assert.match(node(['build/tree.js', 'plan', path.join(ROOT, 'test/fixtures/make-fly.tree.json')]).out, /WIREFRAME/);
});
