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
  assert.match(r.out, /MATCH 97% · HYGIENE 3 · STRUCTURE \? · EYE — \(no reference\)/);
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

test('see.py match: text 16→14 on the same frame keeps layout ×1 (text scale is separate) — 451:9507 false MISSING', () => {
  const py = `
import sys; sys.path.insert(0, 'build'); import see
def T(i, t, x, y, px): return {'id': i, 'kind': 'text', 'text': t, 'size_px': px, 'box': [x, y, 8 * len(t), px], 'parent': None}
W = ['Stops', 'Hours', 'Baggage', 'Best', 'Cheapest', 'Fastest', 'Select']
P = [(40, 50), (40, 450), (40, 830), (800, 40), (1200, 40), (1600, 40), (1800, 370)]
A = [T(i, w, x, y, 16) for i, (w, (x, y)) in enumerate(zip(W, P))]
B = [T(i, w, x, y, 14) for i, (w, (x, y)) in enumerate(zip(W, P))]
_, M = see.match(A, B)
print(round(M.s, 2), round(M.t, 3))`;
  const out = execFileSync('python3', ['-c', py], { cwd: ROOT }).toString().trim();
  assert.strictEqual(out, '1.0 0.875');
});

test('tree.js plan: the main-style analysis — wireframe, L1-L5 layers with folded rows, components with real kit keys and states', () => {
  const r = node(['build/tree.js', 'plan', TREE_PO, '5', '--grid']);   // --grid = the detailed to-scale grid + L1-L5 list; the default style is covered in test/sketch.test.js
  assert.strictEqual(r.code, 0, r.out);
  for (const re of [/^WIREFRAME[\s\S]*\[Search supplier\]/m, /^L1 Purchase Orders — List Report {3}VERTICAL/m, /^L2 {3}Shell Bar {3}SAP Shell Bar/m,
    /… ×5 more with the same structure/, /\| Object Status +\| 748d609ead… \| Semantic=Warning +\| 2 +\|/, /DOOR {2}✓ ALL IN/])
    assert.match(r.out, re);
  assert.doesNotMatch(r.out, /NOT FOUND/);
  assert.ok(r.out.split('\n').length < 110, 'the analysis must stay short enough to paste');
});

test('door.js (front door): the approved gold trees get in; wrong state, placeholder, colour role, fake component, missing sizing stay out', () => {
  for (const t of [TREE_PO, TREE_FLIGHT]) { const r = node(['build/door.js', t]); assert.strictEqual(r.code, 0, r.out); assert.match(r.out, /DOOR {2}✓ ALL IN/); }
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'door-')), 'bad.tree.json');
  fs.writeFileSync(f, JSON.stringify({ n: 'Screen', sz: 'x', w: 400, h: 200, d: 'V', bg: 'sapBackgroundColor', c: [
    { n: 'Save', k: 'i', cp: 'Button', s: 'HH', w: 60, h: 26, pr: { Type: 'Primry' } },
    { n: 'Price', k: 't', t: '12 €', st: 'H4/Bold', bg: 'sapList_BorderColor', s: 'HH', w: 40, h: 20 },
    { n: 'Card', s: 'FH', w: 400, h: 40, bc: 'sapTextColor', d: 'H', c: [{ n: 'Hint', k: 't', t: 'Typed Text', st: 'H4/Bold', bg: 'sapTextColor', w: 60, h: 20 }] },
    { n: 'Go button', s: 'HH', w: 60, h: 26, bg: 'sapButton_Background', d: 'H', c: [{ n: 'Go', k: 't', t: 'Go', st: 'H4/Bold', bg: 'sapTextColor', s: 'HH', w: 20, h: 16 }] }] }));
  const r = node(['build/door.js', f]);
  assert.strictEqual(r.code, 1);
  for (const re of [/state +"Save" <Button> Type=Primry — allowed: Primary, Secondary/, /placeholder +"Save" <Button> shows the kit default "Button"/,
    /colour role +"Price" text painted with sapList_BorderColor \(a border variable\)/, /colour role +"Card" border sapTextColor is a ink variable/,
    /placeholder +"Hint" text "Typed Text"/, /sizing +"Hint" has no sizing decision/, /fake component +"Go button" is a frame drawn like a button/])
    assert.match(r.out, re);
});

test('door.js --ref: a build frame that is not the reference size and a reference text that is not placed stay out; brand colours become questions', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'door-ref-'));
  fs.writeFileSync(path.join(d, 't.json'), JSON.stringify({ n: 'Results', sz: 'x', w: 1280, h: 680, d: 'V', bg: 'sapBackgroundColor', c: [
    { n: 'Title', k: 't', t: 'Спирки', st: 'H5/Bold', bg: 'sapTextColor', s: 'HH', w: 60, h: 16 }] }));
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ frame: { w: 1159, h: 616 }, sections: [{ type: 'row', children: [
    { type: 'text', text: 'Спирки' }, { type: 'text', text: 'Часове' }] }], ask: ['brand colour #de307c on 8 texts — which SAP role?'] }));
  const r = node(['build/door.js', path.join(d, 't.json'), '--ref', path.join(d, 'spec.json')]);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /frame size +frame 1280×680 — the reference is 1159×616/);
  assert.match(r.out, /missing +reference text "Часове" is not placed/);
  assert.doesNotMatch(r.out, /"Спирки" is not placed/);
  assert.match(r.out, /ASK {2}brand colour #de307c/);
});

test('front.js (front door in one command): text request → the right gold tree, door ✓ ALL IN, the 4-step answer, under 1 s', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'front-')), t0 = Date.now();
  const r = node(['build/front.js', 'purchase order list report, filter by supplier and status', '--job', d]);
  assert.ok(Date.now() - t0 < 3000, 'front door must be fast');
  assert.strictEqual(r.code, 0, r.out);
  for (const re of [/^1 ANALYZE {2}7 key words/m, /^2 UNSURE/m, /^3 DECIDE {3}gold po-list-report-1440 — places 7\/7 request words/m, /DOOR {2}✓ ALL IN/, /^4 PROPOSE {2}node build\/tree.js plan/m])
    assert.match(r.out, re);
  assert.ok(fs.existsSync(path.join(d, 'tree.json')));
});

test('spec2tree.js (from zero): measured alignment, role colours, aligned text with spare width, icon frame around the drawing', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2t-'));
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ frame: { w: 400, h: 200, fill: 'sapBaseColor' }, sections: [
    { type: 'box', box: [10, 10, 380, 180], fill: 'sapBaseColor', border: '1px sapTile_SeparatorColor', radius: 8, layout: { dir: 'column' }, children: [
      { type: 'row', box: [20, 20, 360, 40], children: [
        { type: 'text', text: 'Спирки', style: 'H5/Bold', token: 'sapTextColor', box: [20, 32, 60, 16] },
        { type: 'icon', icon: 'decline', token: 'sapField_BorderColor', box: [364, 32, 16, 16] }] },
      { type: 'stack', box: [20, 80, 200, 60], children: [
        { type: 'text', text: '365,72 €', style: 'H4/Bold', token: '?', color: '#de307c', box: [120, 80, 100, 20] },
        { type: 'component', component: 'Button', text: 'Избор', box: [60, 110, 160, 30] }] }] }] }));
  const r = node(['build/spec2tree.js', path.join(d, 'spec.json'), path.join(d, 't.json')]);
  assert.strictEqual(r.code, 0, r.out);
  const T = JSON.parse(fs.readFileSync(path.join(d, 't.json'), 'utf8')), all = [];
  (function w(o) { all.push(o); (o.c || []).forEach(w); })(T);
  const get = n => all.find(o => o.n === n);
  assert.strictEqual(get('Card Спирки').bc, 'sapList_BorderColor', 'border by role, not pixel distance; the card frame survives the flow');
  const hrow = all.find(o => o.d === 'H' && (o.c || []).some(c => c.n === 'Спирки'));
  assert.ok(hrow, 'title + trailing icon → a horizontal row (baked gap, not free-placed)');
  assert.strictEqual(get('decline').bg, 'sapContent_NonInteractiveIconColor', 'icon painted with an icon colour');
  assert.strictEqual(get('decline').w, 16, 'icon keeps its measured footprint (no 1/0.8 inflation)');
  const p = get('365,72 €');
  assert.strictEqual(p.bg, 'sapContent_Selected_ForegroundColor', 'brand → SAP accent');
  assert.ok(p.ta === 'R' && p.s[0] === 'H', 'price: right-aligned + HUG width (a FILL text wraps in Figma; textAlignHorizontal keeps its edge)');
  assert.ok(!all.some(o => o.xy && !o.abs), 'responsive: no free-placed layer left (abs overlap pins are allowed)');
  assert.ok(/^X/.test(get('Избор').s), 'button keeps its measured width');
  assert.strictEqual(node(['build/door.js', path.join(d, 't.json')]).code, 0, 'the tree gets through the front door');
});

test('structure.js: a strip where the reference has a nested pink box, a collapsed tab, an overlap, a hidden layer and a wrong frame size all fail; the right build passes', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'struct-'));
  const R = (id, type, name, x, y, w, h, text = '', parent = '') => [id, type, name, x, y, w, h, 0, '', '', '', '', '', text, parent];
  const spec = { frame: { w: 400, h: 300 }, sections: [{ type: 'box', box: [10, 40, 380, 150], children: [{ type: 'box', box: [14, 76, 372, 110], children: [] }] }] };
  const good = [R('1', 'FRAME', 'Screen', 0, 0, 400, 300), R('2', 'FRAME', 'Tabs', 10, 0, 380, 36), R('3', 'TEXT', 'A', 20, 10, 40, 14, 'Tab', '2'),
    R('4', 'FRAME', 'Recommended', 10, 40, 380, 150), R('5', 'FRAME', 'Card', 14, 76, 372, 110), R('6', 'TEXT', 'B', 30, 90, 40, 14, '06:00')];
  const run = (rows, sp = spec) => { fs.writeFileSync(path.join(d, 'g.json'), JSON.stringify(rows)); fs.writeFileSync(path.join(d, 's.json'), JSON.stringify(sp)); return node(['build/structure.js', path.join(d, 'g.json'), '--spec', path.join(d, 's.json')]); };
  let r = run(good); assert.strictEqual(r.code, 0, r.out); assert.match(r.out, /STRUCTURE {2}✓ 0/);
  const strip = good.map(g => g[0] === '4' ? R('4', 'FRAME', 'Recommended', 10, 40, 380, 36) : g);          // the 471:9819 defect: pink strip, not a box
  r = run(strip); assert.strictEqual(r.code, 1); assert.match(r.out, /BOX {2}the reference has a box 380×150 at 10,40.*nearest "Recommended" 380×36/);
  r = run([...good.slice(0, 1), R('2', 'FRAME', 'Sort tabs', 10, 0, 380, 1), ...good.slice(2)]); assert.match(r.out, /COLLAPSED {2}"Sort tabs"/);
  r = run([...good, R('7', 'TEXT', 'C', 40, 92, 30, 14, 'SOF')]); assert.match(r.out, /OVERLAP {2}"06:00".*"SOF"/);
  r = run([...good, R('8', 'FRAME', 'Baggage', 10, 290, 100, 30)]); assert.match(r.out, /OUTSIDE {2}"Baggage"/);
  r = run(good.map(g => g[0] === '1' ? R('1', 'FRAME', 'Screen', 0, 0, 380, 290) : g)); assert.match(r.out, /FRAME {2}build 380×290, the reference is 400×300/);
  // a kit instance is a box: a reference box that the build draws as a component instance (Radio Button ring) is found; a wrong-sized instance still fails
  const ring = { frame: { w: 400, h: 300 }, sections: [{ type: 'box', box: [20, 200, 34, 35], children: [] }] };
  const base = [R('1', 'FRAME', 'Screen', 0, 0, 400, 300)];
  r = run([...base, R('2', 'INSTANCE', 'Marker 3', 20, 200, 34, 35)], ring); assert.strictEqual(r.code, 0, r.out);
  r = run([...base, R('2', 'INSTANCE', 'Marker 3', 20, 200, 12, 12)], ring); assert.strictEqual(r.code, 1); assert.match(r.out, /BOX {2}the reference has a box 34×35 at 20,200/);
});

test('gates.js: MATCH 100 % with a structure defect is NOT a pass, and the defect line is printed', () => {
  const { d, plan } = cleanJob();
  fs.writeFileSync(path.join(d, 'geometry.json'), JSON.stringify([['1', 'FRAME', 'Screen', 0, 0, 200, 100, 0, '', '', '', '', '', '', ''], ['2', 'FRAME', 'Tabs', 0, 0, 200, 1, 0, '', '', '', '', '', '', '1'],
    ['3', 'TEXT', 'T', 5, 5, 40, 14, 0, '', '', '', '', '', 'Orders', '2']]));
  const r = run([plan, d]);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /MATCH 100% · HYGIENE 0 · STRUCTURE 1/);
  assert.match(r.out, /COLLAPSED {2}"Tabs"/);
  assert.match(r.out, /NOT PASSED — structure 1/);
});

test('door.js responsive rule: a fixed-width card in a column, a free-placed frame and a row with no FILL child stay out', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'resp-'));
  const bad = { n: 'Screen', sz: 'x', w: 800, h: 400, bg: 'sapBaseColor', c: [{ n: 'Card', d: 'V', g: 0, p: [0, 0, 0, 0], s: 'XH', w: 700, h: 100, bg: 'sapTile_Background', c: [{ n: 'Free', xy: [5, 5], s: 'XX', w: 50, h: 20, bg: 'sapBaseColor' }] }] };
  fs.writeFileSync(path.join(d, 'b.json'), JSON.stringify(bad));
  const r = node(['build/door.js', path.join(d, 'b.json')]);
  assert.notStrictEqual(r.code, 0);
  assert.match(r.out, /responsive/);
});

// ── compact wire format (build/tree-codec.js) + smaller, cleaner spec2tree output ──
const codec = require(path.join(ROOT, 'build/tree-codec.js'));
const GOLD_TREES = ['flight-results-1000.tree.json', 'po-list-report-1440.tree.json'].map(f => path.join(ROOT, 'knowledge/gold/trees', f));

test('tree-codec: decode(encode(tree)) deep-equals every gold tree (lossless round-trip)', () => {
  for (const f of GOLD_TREES) {
    const t = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert.deepStrictEqual(codec.decode(codec.encode(t)), t, path.basename(f));
    const env = codec.encode(t);
    assert.strictEqual(env.$c, 1); assert.ok(Array.isArray(env.d) && env.d.length, 'dictionary is built');
    // the checksum is over the tree the runtime reconstructs, so it verifies on the decoded tree
    assert.strictEqual(codec.fnv(JSON.stringify(codec.decode(env))), env.k, 'checksum matches the decoded tree of ' + path.basename(f));
  }
});

test('tree-codec: a plain tree passes through decode unchanged; a corrupted envelope fails its checksum', () => {
  // two texts share a text style + colour → those strings land in the dictionary, so corrupting one is caught
  const plain = { n: 'X', sz: 'x', w: 10, h: 40, d: 'V', c: [
    { n: 'A', k: 't', t: 'Hi', st: 'H4/Bold', bg: 'sapTextColor', s: 'HH', w: 5, h: 5 },
    { n: 'B', k: 't', t: 'Yo', st: 'H4/Bold', bg: 'sapTextColor', s: 'HH', w: 5, h: 5 }] };
  assert.deepStrictEqual(codec.decode(plain), plain, 'a tree with no $c is returned as-is');
  const env = codec.encode(plain);
  assert.ok(env.d.length >= 1 && env.d.includes('sapTextColor'), 'the repeated colour is dictionaried');
  env.d[env.d.indexOf('sapTextColor')] = 'CORRUPTED';   // a typo by the typing model in a dictionary entry
  assert.notStrictEqual(codec.fnv(JSON.stringify(codec.decode(env))), env.k, 'checksum no longer matches');
});

test('tree-codec: the decode + checksum inlined in render-tree.js reproduces the tree and returns PAYLOAD CORRUPTED on a mismatch', () => {
  const rt = fs.readFileSync(path.join(ROOT, 'build/templates/render-tree.js'), 'utf8');
  const src = rt.match(/const _DKEYS = \[[\s\S]*?function _decode\(env\)\{[\s\S]*?\n\}/);
  assert.ok(src, 'render-tree.js still contains the inlined _DKEYS/_fnv/_decode');
  const sb = {}; new Function('e', src[0] + '\ne._decode=_decode;e._fnv=_fnv;')(sb);
  const t = JSON.parse(fs.readFileSync(GOLD_TREES[0], 'utf8')), env = codec.encode(t);
  assert.deepStrictEqual(sb._decode(env), t, 'runtime decode matches the original tree');
  assert.strictEqual(sb._fnv(JSON.stringify(sb._decode(env))), env.k, 'runtime fnv agrees with the encoder checksum');
  // simulate BUILD_TREE's guard: a bad checksum → PAYLOAD CORRUPTED (no build)
  const bad = { ...env, k: '00000000' };
  const verdict = sb._fnv(JSON.stringify(sb._decode(bad))) !== bad.k ? 'PAYLOAD CORRUPTED' : 'ok';
  assert.strictEqual(verdict, 'PAYLOAD CORRUPTED');
});

test('render.js --lean: the flight tree ships as a compact checksummed envelope, no plain tree, and stays small', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'lean-'));
  assert.strictEqual(node(['build/render.js', '--install', '--out', path.join(d, 'i.js')]).code, 0);
  assert.strictEqual(node(['build/render.js', GOLD_TREES[0], '--lean', '--out', path.join(d, 'l.js')]).code, 0);
  const l = fs.readFileSync(path.join(d, 'l.js'), 'utf8');
  assert.match(l, /const TREE = \{"\$c":1,"d":\[/, 'the tree is the compact envelope, not a plain tree');
  assert.ok(!l.includes('function NODE'), 'the runtime is not inlined (lean)');
  assert.ok(l.length < fs.readFileSync(GOLD_TREES[0], 'utf8').length + 2000, 'lean is not bigger than the raw tree + KIT overhead');
  new Function('figma', '(async()=>{' + l + '})');   // compiles
});

test('spec2tree.js: the responsive tree carries no "Spacer" or "offset" frames — designer containers (row/column/group) instead', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2t-clean-'));
  // three bands with uneven spacing and a cross-axis offset → the old flow() would emit spacers + offset wrappers
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ frame: { w: 600, h: 300, fill: 'sapBaseColor' }, sections: [
    { type: 'box', box: [10, 10, 580, 280], fill: 'sapBaseColor', border: '1px sapTile_SeparatorColor', radius: 8, children: [
      { type: 'text', text: 'Резултати', style: 'H4/Bold', token: 'sapTitleColor', box: [24, 24, 120, 20] },
      { type: 'component', component: 'Button', text: 'Избор', box: [470, 22, 100, 26] },
      { type: 'component', component: 'Button', text: 'Директни', box: [24, 90, 110, 24] },
      { type: 'text', text: 'от 365 €', style: 'SmallText/LHAuto/Regular', token: 'sapTextColor', box: [40, 118, 60, 12] },
      { type: 'text', text: 'Най-евтино', style: 'SmallText/LHAuto/Bold', token: 'sapTextColor', box: [24, 170, 90, 12] },
      { type: 'text', text: '191,00 € • 15ч', style: 'SmallText/LHAuto/Regular', token: 'sapTextColor', box: [24, 190, 130, 12] }] }] }));
  assert.strictEqual(node(['build/spec2tree.js', path.join(d, 'spec.json'), path.join(d, 't.json')]).code, 0);
  const T = JSON.parse(fs.readFileSync(path.join(d, 't.json'), 'utf8')), all = [];
  (function w(o) { all.push(o); (o.c || []).forEach(w); })(T);
  assert.ok(!all.some(o => o.n === 'Spacer'), 'no Spacer frame is emitted');
  assert.ok(!all.some(o => / offset$/.test(o.n)), 'no "offset" wrapper frame is emitted');
  assert.ok(!all.some(o => o.xy && !o.abs), 'no layer is free-placed (abs overlap pins allowed)');
  assert.ok(!all.some(o => Array.isArray(o.p) && o.p.some(v => v < 0)), 'never negative padding');
  assert.ok(!all.some(o => o.g === 0), 'default gap 0 is dropped');
  assert.ok(!all.some(o => Array.isArray(o.p) && o.p.every(v => v === 0)), 'default padding [0,0,0,0] is dropped');
  assert.ok(!all.some(o => o.a === 'MM'), 'default alignment MM is dropped');
  assert.strictEqual(node(['build/door.js', path.join(d, 't.json')]).code, 0, 'the clean tree still passes the front door');
});

test('spec2tree.js (hairline XY-cut): a card with a full-height vertical separator and a full-width divider lays out geometrically right (POSITION ≥ 95, no negative padding)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2t-hair-'));
  // a mini flight card: left leg content | full-height separator | right price column; a full-width divider under the leg.
  // the old flow() banded by y-overlap, so the full-height separator + full-width divider collapsed the whole card into one
  // row and pushed the price ~1000 px away. The hairline-aware XY-cut must pull each rule out as an item and place the rest.
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ frame: { w: 600, h: 200, fill: 'sapBaseColor' }, sections: [
    { type: 'box', box: [10, 10, 580, 180], fill: 'sapBaseColor', border: '1px sapTile_SeparatorColor', radius: 8, children: [
      { type: 'text', text: '06:00', style: 'H4/Bold', token: 'sapTextColor', box: [30, 40, 60, 18] },
      { type: 'text', text: 'SOF', style: 'SmallText/LHAuto/Regular', token: 'sapTextColor', box: [30, 66, 40, 12] },
      { type: 'text', text: '07:15', style: 'H4/Bold', token: 'sapTextColor', box: [300, 40, 60, 18] },
      { type: 'text', text: 'LTN', style: 'SmallText/LHAuto/Regular', token: 'sapTextColor', box: [300, 66, 40, 12] },
      { type: 'divider', box: [30, 120, 380, 2], token: 'sapList_BorderColor' },                 // full-width horizontal rule
      { type: 'separator', box: [430, 20, 2, 160], token: 'sapList_BorderColor' },               // full-height vertical rule
      { type: 'text', text: '365,72 €', style: 'H4/Bold', token: 'sapTextColor', box: [470, 40, 90, 22] },
      { type: 'component', component: 'Button', text: 'Избор', box: [470, 130, 100, 30] }] }] }));
  assert.strictEqual(node(['build/spec2tree.js', path.join(d, 'spec.json'), path.join(d, 't.json')]).code, 0);
  const T = JSON.parse(fs.readFileSync(path.join(d, 't.json'), 'utf8')), all = [];
  (function w(o) { all.push(o); (o.c || []).forEach(w); })(T);
  assert.ok(!all.some(o => Array.isArray(o.p) && o.p.some(v => v < 0)), 'never negative padding');
  // the vertical separator is a real item in a horizontal flow (its parent frame lays out left→right)
  const sep = all.find(o => o.k === 'r' && o.h > o.w && o.h >= 120);
  assert.ok(sep, 'the full-height separator survives as a rectangle item');
  const r = node(['build/layout-sim.js', path.join(d, 't.json'), '--expect', path.join(d, 't.expect.json')]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /POSITION\s+\d+\/\d+ leaves within 4 px of the reference = (9[5-9]|100) %/);
  assert.match(r.out, /OVERFLOW\s+0 leaves/);
  // and it resizes: the door's responsive rule passes, and no child spills the frame when scaled
  assert.strictEqual(node(['build/door.js', path.join(d, 't.json')]).code, 0, 'front door incl. responsive rule');
  for (const s of ['0.85', '1.15']) assert.match(node(['build/layout-sim.js', path.join(d, 't.json'), '--expect', path.join(d, 't.expect.json'), '--scale', s]).out, /OVERFLOW\s+0 leaves/, 'no overflow at scale ' + s);
});

test('spec2tree.js: a text box uses the kit LINE HEIGHT (floor(size×1.17)), top-aligned on the glyph, and never FILL (would wrap in Figma)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2t-lh-'));
  // H5/Bold is 16 px in the kit → line height floor(16×1.17)=18; the measured glyph was 14 → the box must be 18, top-aligned
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ frame: { w: 300, h: 120, fill: 'sapBaseColor' }, sections: [
    { type: 'box', box: [10, 10, 280, 100], fill: 'sapBaseColor', border: '1px sapTile_SeparatorColor', children: [
      { type: 'text', text: 'Спирки', style: 'H5/Bold', token: 'sapTextColor', box: [24, 24, 60, 14] },
      { type: 'text', text: '365 €', style: 'H5/Bold', token: 'sapTextColor', box: [200, 24, 40, 14] }] }] }));
  assert.strictEqual(node(['build/spec2tree.js', path.join(d, 'spec.json'), path.join(d, 't.json')]).code, 0);
  const T = JSON.parse(fs.readFileSync(path.join(d, 't.json'), 'utf8')), all = [];
  (function w(o) { all.push(o); (o.c || []).forEach(w); })(T);
  const title = all.find(o => o.t === 'Спирки');
  assert.strictEqual(title.h, 18, 'text height = kit line height floor(16×1.17), not the 14-px glyph');
  assert.ok(!all.some(o => o.k === 't' && (o.s || 'XX')[0] === 'F'), 'no text is FILL width (a FILL text wraps in Figma)');
});

test('layout-sim --geometry: reports how the SIMULATED layout diverges from a REAL Figma dump (calibration tool)', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-'));
  const tree = { n: 'Screen', sz: 'x', w: 200, h: 100, d: 'V', bg: 'sapBaseColor', p: [10, 0, 0, 10], c: [
    { n: 'Title', k: 't', t: 'Orders', st: 'H4/Bold', bg: 'sapTitleColor', w: 60, h: 20, s: 'HH' }] };
  fs.writeFileSync(path.join(d, 't.json'), JSON.stringify(tree));
  // a real dump where "Title" is 30 px lower than the simulator places it (row: [id,type,name,x,y,w,h,...])
  fs.writeFileSync(path.join(d, 'geo.json'), JSON.stringify([
    ['1', 'FRAME', 'Screen', 0, 0, 200, 100, 0, '', '', '', 0, 'VERTICAL', '', ''],
    ['2', 'TEXT', 'Title', 10, 40, 60, 20, 0, '', '', '', 0, '', 'Orders', '1']]));
  const r = node(['build/layout-sim.js', path.join(d, 't.json'), '--geometry', path.join(d, 'geo.json'), '--tol', '4']);
  assert.match(r.out, /GEOMETRY\s+\d+\/\d+ uniquely-named nodes match real Figma/);
  assert.match(r.out, /Title: real 10,40 .* sim 10,10 .*Δxy 0,-30/, 'names the node and its real-vs-sim divergence');
});
