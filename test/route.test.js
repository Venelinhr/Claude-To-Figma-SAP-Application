// route.test.js — Jev router: routing cases, drift, image Gate 0, audit-plan, and the
// Figma ROUTE block run against a mock Figma.   node --test test/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { route, routeImage } = require('../build/route.js');
const T = require('../build/router-table.json');
const KIT = require('../build/kit-live.js').components;

// [request, mode, expected trace fragments...] — real requests from the 2026-09 sessions
const CASES = [
  ['check box off', 'ACT', 'Check Box · Check=Unchecked'],
  ['check box on', 'ACT', 'Check Box · Check=Checked'],
  ['checkbox on', 'ACT', 'Check=Checked'],
  ['tick the check box', 'ACT', 'Check Box'],
  ['switch on', 'ACT', 'Switch · Checked=True'],
  ['switch off', 'ACT', 'Checked=False'],
  ['turn the toggle off', 'ACT', 'Switch · Checked=False'],
  ['make radio selected', 'ACT', 'Radio Button · Selected=True'],
  ['unselect the radio', 'ACT', 'Selected=False'],
  ['row selected', 'ACT', 'Table Cell · Selected=True'],
  ['make button sap blue primary', 'ACT', 'Button · Type=Primary'],
  ['button secondary', 'ACT', 'Type=Secondary'],
  ['buttons are cozy', 'ACT', 'Button · Form Factor=Cozy'],
  ['inputs compact', 'ACT', 'Input · Form Factor=Compact'],
  ['input error', 'ACT', 'Input · Value State=Negative'],
  ['input warning', 'ACT', 'Value State=Critical'],
  ['status success', 'ACT', 'Object Status · Semantic=Success'],
  ['object status error', 'ACT', 'Semantic=Error'],
  ['make the switch disabled', 'ACT', 'Interaction State=Disabled'],
  ['input read only', 'ACT', 'Interaction State=Read Only'],
  ['tag positive', 'ACT', 'Tag · Value State=Positive'],
  ['change to active state', 'ACT', 'state=active (resolve on selection)'],
  ['unselect card border, gaps 12', 'ACT', 'border sapList_BorderColor 1px', 'itemSpacing=12'],
  ['add selected card border', 'ACT', 'border sapList_SelectionBorderColor 2px'],
  ['card selected', 'ACT', 'border sapList_SelectionBorderColor 2px'],
  ['gaps 12', 'ACT', 'itemSpacing=12'],
  ['gap 10', 'ACT', 'itemSpacing=8'],
  ['app padding 12', 'ACT', 'all4=12'],
  ['padding 16', 'ACT', 'all4=16'],
  ['side padding 16', 'ACT', 'leftRight=16'],
  ['add 16 px side padding', 'ACT', 'leftRight=16'],
  ['check box off, switch on', 'ACT', 'Check=Unchecked', 'Checked=True'],
  ['move icons outside the card', 'QUICK'],
  ['center the three icons in the middle', 'QUICK'],
  ['add missing text too', 'QUICK'],
  ['add a column', 'QUICK'],
  ['swap Input for Select', 'QUICK'],
  ['remove the second row', 'QUICK'],
  ['build sap screen based on this', 'THINK', 'floorplan: from image / ask'],
  ['build a flight booking results page', 'THINK', 'List Report'],
  ['new dialog to schedule an operation', 'THINK', 'Dialog'],
  ['add a dialog for delete confirm', 'THINK', 'Dialog'],
  ['create a wizard for onboarding', 'THINK', 'Wizard-in-Dialog'],
  ['kpi dashboard for sales', 'THINK', 'Overview'],
  ['edit one record details of an order', 'THINK', 'Object Page'],
  ['make it better', 'THINK'],
  ['make it nicer', 'THINK'],
  ['what is wrong here', 'THINK'],
  ['suggest a layout', 'THINK'],
  ['check box off, and build a new dialog for scheduling', 'SPLIT', 'Check Box · Check=Unchecked'],
  ['change the box', 'ACT', 'ask: "box"'],
  ['fix the bar', 'ACT', 'ask: "bar"'],
];

test(`${CASES.length} routing cases — right door every time`, () => {
  const bad = [];
  for (const [q, mode, ...frags] of CASES) {
    const r = route(q);
    if (r.mode !== mode || frags.some(f => !r.trace.includes(f))) bad.push(`${q} → ${r.trace} (want ${mode} ${frags.join(' | ')})`);
  }
  assert.deepStrictEqual(bad, []);
  assert.ok(CASES.length >= 40);
});

test('candidates are asked, never guessed', () => {
  const r = route('change the box');
  assert.strictEqual(r.handler, 'ask-candidates');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.components.length, 0);
});

test('a state the component does not have is reported, not invented', () => {
  const r = route('switch error');
  assert.ok(r.missing.length || r.states.every(s => s.component !== 'Switch' || s.prop !== 'Value State'));
});

test('drift: every table component, key, token and candidate exists in kit.json', () => {
  const vars = require('../build/kit-live.js').vars;
  const varKey = n => Object.entries(vars).find(([k]) => k.endsWith('/' + n))?.[1].split('|')[0];
  for (const r of T.gate3_component.rules) {
    assert.ok(KIT[r.component], `${r.component} not in kit`);
    assert.strictEqual(r.key, KIT[r.component].key, `${r.component} key drift`);
  }
  for (const c of T.gate3_component.candidates) for (const o of c.options) assert.ok(KIT[o], `candidate ${o} not in kit`);
  for (const b of ['frame_active_border', 'frame_normal_border'])
    if (!T.act_route[b].verified) assert.strictEqual(T.act_route[b].key, varKey(T.act_route[b].token), `${b} token key drift`);
  const names = new Set(T.image_labels.rules.flatMap(r => r.size.map(s => s.component || s.else)));
  for (const n of names) if (!['container', 'candidates', 'unmapped', 'decoration'].includes(n)) assert.ok(KIT[n], `image label → ${n} not in kit`);
});

test('drift: every state value in the table is offered by at least one kit component', () => {
  const all = new Set();
  for (const c of Object.values(KIT)) for (const v of Object.values(c.props)) if (v.startsWith('V:')) v.slice(2).split('|')[1].split(',').forEach(x => all.add(x));
  for (const [k, s] of Object.entries(T.gate4_state.keys)) for (const v of s.values) assert.ok(all.has(v), `${k}: value ${v} not in kit`);
});

test('drift: SKILL.md router section and the Figma block are generated from the table', () => {
  execFileSync('node', [path.join(ROOT, 'build/gen-router.js'), '--check']);
  const skill = fs.readFileSync(path.join(ROOT, '.claude/skills/sap-figma-agent/SKILL.md'), 'utf8');
  for (const r of T.gate3_component.rules) assert.ok(skill.includes(r.key), `${r.component} key missing in SKILL.md`);
  assert.ok(!skill.includes('sap-figma-act'), 'SKILL.md still points to sap-figma-act');
  assert.ok(!fs.existsSync(path.join(ROOT, '.claude/skills/sap-figma-act')), 'sap-figma-act still exists');
});

test('Gate 0: flight reference → List Report, XL Compact, every box typed, 0 unmapped', () => {
  const img = path.join(ROOT, 'knowledge/gold/snapshots/flight-search-v3-reference.webp');
  const m = JSON.parse(execFileSync('python3', [path.join(ROOT, 'build/measure-ref.py'), img, '--json'], { maxBuffer: 1 << 26 }));
  const r = routeImage(m);
  assert.strictEqual(r.floorplan, 'List Report');
  assert.strictEqual(r.frame.density, 'Compact');
  assert.deepStrictEqual(r.unmapped, []);
  assert.strictEqual(r.zones.length, m.boxes.length);
  for (const z of r.zones.filter(z => z.component === 'Check Box')) assert.ok(z.key && z.density);
});

test('audit-screen.py role() reads the router table (same families as before)', () => {
  const out = execFileSync('python3', ['-c', `import sys; sys.argv=['x']; sys.path.insert(0,'${path.join(ROOT, 'build')}')
import importlib.util as u; s=u.spec_from_file_location('a','${path.join(ROOT, 'build/audit-screen.py')}'); m=u.module_from_spec(s); s.loader.exec_module(m)
print('|'.join(m.role(g) for g in ['Field with label (Label + Input/Select)','Input / Select','Input / Button (outline)','Tile / chip — SELECTED','filled panel / selected item','Card / list item','Button Primary (Compact)','Check Box']))`]).toString().trim();
  assert.strictEqual(out, 'field|field|field|tile|tile|card|button|Check Box');
});

test('audit-plan: text-prompt build passes, a removed Tag is MISSING, a wrong state is WRONG PROP', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-'));
  const plan = route('tag positive, check box on, button primary');
  const tree = [
    { name: 'Tag', component: 'Tag', props: { 'Value State': 'Positive' } },
    { name: 'CB', component: 'Check Box', props: { Check: 'Checked' } },
    { name: 'Book', component: 'Button', props: { Type: 'Primary' } },
  ];
  fs.writeFileSync(path.join(dir, 'p.json'), JSON.stringify(plan));
  const run = t => { fs.writeFileSync(path.join(dir, 't.json'), JSON.stringify(t));
    try { return { code: 0, out: execFileSync('node', [path.join(ROOT, 'build/audit-plan.js'), path.join(dir, 'p.json'), path.join(dir, 't.json')]).toString() }; }
    catch (e) { return { code: e.status, out: e.stdout.toString() }; } };
  assert.strictEqual(run(tree).code, 0);
  const noTag = run(tree.slice(1));
  assert.strictEqual(noTag.code, 1); assert.match(noTag.out, /MISSING \(1\)[\s\S]*Tag/);
  const off = run([tree[0], { ...tree[1], props: { Check: 'Unchecked' } }, tree[2]]);
  assert.match(off.out, /WRONG PROP \(1\)[\s\S]*Check=Unchecked, plan says Checked/);
});

// ── the Figma ROUTE block, run against a mock Figma ──────────────────────────
const BLOCK = fs.readFileSync(path.join(ROOT, 'build/templates/route.use_figma.js'), 'utf8');
function mockFigma() {
  const set = (name, defs) => ({ type: 'COMPONENT_SET', name, componentPropertyDefinitions:
    Object.fromEntries(Object.entries(defs).map(([k, o]) => [k, { type: 'VARIANT', variantOptions: o }])) });
  const inst = (name, s, props) => ({ type: 'INSTANCE', name, props: { ...props },
    getMainComponentAsync: async () => ({ parent: s }), setProperties(p) { Object.assign(this.props, p); } });
  const CB = set('Check Box', { Check: ['Unchecked', 'Checked', 'Tristate'], 'Value State': ['None', 'Negative'] });
  const SW = set('Switch', { Checked: ['True', 'False'], 'Interaction State': ['Regular', 'Disabled'] });
  const IN = set('Input', { 'Value State': ['None', 'Negative', 'Critical'], 'Interaction State': ['Regular', 'Hover', 'Active'] });
  const cb = inst('cb', CB, { Check: 'Unchecked' }), sw = inst('sw', SW, { Checked: 'False' }), inp = inst('in', IN, {});
  const frame = (name, kids = []) => ({ type: 'FRAME', name, layoutMode: 'VERTICAL', paddingTop: 0, paddingRight: 0, paddingBottom: 0,
    paddingLeft: 0, itemSpacing: 0, strokes: [], strokeWeight: 0, children: kids, findAll: f => kids.filter(f) });
  const card = frame('Card', [cb, sw]), sib = frame('Card 2');
  sib.strokes = [{ type: 'SOLID', boundVariables: { color: { id: 'V1' } } }];
  const parent = { children: [card, sib] }; card.parent = parent; sib.parent = parent;
  const figma = { currentPage: { selection: [] }, imports: 0, variables: {
    getVariableByIdAsync: async id => (id === 'V1' ? { key: T.act_route.frame_active_border.key } : null),
    importVariableByKeyAsync: async key => { figma.imports++; return { key }; },
    setBoundVariableForPaint: (p, f, v) => ({ ...p, boundVariables: { color: { key: v.key } } }) } };
  figma.getNodeByIdAsync = async () => figma.byId;
  return { figma, card, cb, sw, inp, sib };
}
// the saved code takes A as a parameter; install + call go through sharedPluginData like in Figma
const AF = Object.getPrototypeOf(async function () {}).constructor;
const runBlock = async (figma, A) => new AF('figma', 'A', BLOCK)(figma, A);
const actOf = q => route(q).act;
const SKILL_TXT = fs.readFileSync(path.join(ROOT, '.claude/skills/sap-figma-agent/SKILL.md'), 'utf8');
const codeAfter = h => SKILL_TXT.split(h)[1].split('```js\n')[1].split('\n```')[0];

test('tiny CALL: under 400 chars; INSTALL once, then CALL works through sharedPluginData', async () => {
  const CALL = codeAfter('**CALL**'), INSTALL = codeAfter('**INSTALL**');
  console.log(`    CALL: ${CALL.length} chars · INSTALL: ${INSTALL.length} chars (once per file)`);
  assert.ok(CALL.length < 400);
  const m = mockFigma(), data = {};
  m.figma.root = { getSharedPluginData: (ns, k) => data[ns + k] || '', setSharedPluginData: (ns, k, v) => { data[ns + k] = v; } };
  globalThis.figma = m.figma;                                            // the saved code reads the global, as in Figma
  m.figma.byId = m.card;
  const call = CALL.replace(/^const A = .*$/m, "const A = { node: '1:1', state: 'on', border: 'selected', exclusive: true };");
  assert.strictEqual(await new AF('figma', call)(m.figma), 'INSTALL FIRST');
  assert.match(await new AF('figma', INSTALL)(m.figma), /^installed act_/);
  const r = await new AF('figma', call)(m.figma);
  assert.strictEqual(m.card.strokeWeight, 2); assert.strictEqual(m.cb.props.Check, 'Checked'); assert.strictEqual(m.sib.strokeWeight, 1);
  assert.ok(r.done.includes('border selected'));
  delete globalThis.figma;
});

test('ACT block (A from route.js) against a mock Figma: state, card selected, padding, gap', async () => {
  let m = mockFigma(); m.figma.currentPage.selection = [m.cb];
  await runBlock(m.figma, actOf('check box on'));
  assert.strictEqual(m.cb.props.Check, 'Checked');

  m = mockFigma(); m.figma.currentPage.selection = [m.card];
  await runBlock(m.figma, actOf('switch on'));
  assert.strictEqual(m.sw.props.Checked, 'True');

  m = mockFigma(); m.figma.currentPage.selection = [m.inp];
  await runBlock(m.figma, actOf('change to active state'));
  assert.strictEqual(m.inp.props['Interaction State'], 'Active');

  m = mockFigma(); m.figma.currentPage.selection = [m.card];
  const A = actOf('selected state of the card, app padding 12, gaps 10');
  assert.deepStrictEqual(A, { state: 'on', border: 'selected', exclusive: true, pad: 12, gap: 8 });
  await runBlock(m.figma, A);
  assert.strictEqual(m.card.strokeWeight, 2);
  assert.strictEqual(m.figma.imports, 1, 'normal border for the sibling is imported once, selected one copied');
  assert.strictEqual(m.cb.props.Check, 'Checked');                        // the check inside turns on
  assert.strictEqual(m.sib.strokeWeight, 1);                              // exclusive: the other card goes normal
  assert.deepStrictEqual([m.card.paddingTop, m.card.paddingLeft, m.card.itemSpacing], [12, 12, 8]);

  m = mockFigma(); m.figma.currentPage.selection = []; m.figma.byId = m.card;   // link, no selection
  await runBlock(m.figma, { ...actOf('side padding 16'), node: '1:1' });
  assert.deepStrictEqual([m.card.paddingLeft, m.card.paddingRight, m.card.paddingTop], [16, 16, 0]);
});

test('speed: route() under 5 ms per request', () => {
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 20; i++) for (const [q] of CASES) route(q);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / (20 * CASES.length);
  console.log(`    route(): ${ms.toFixed(3)} ms per request`);
  assert.ok(ms < 5);
});

test('SKILL.md fits the Figma Agent limit (65,536 chars) with room to grow', () => {
  const n = fs.readFileSync(path.join(ROOT, '.claude/skills/sap-figma-agent/SKILL.md'), 'utf8').length;
  console.log(`    SKILL.md: ${n} / 65536 chars`);
  assert.ok(n < 62000, `SKILL.md is ${n} chars — move history or examples out`);
});

test('BUILD KIT: INSTALL saves helpers + keys, the 3 load lines give I/T/fill/AL and the real KIT', async () => {
  const INSTALL = codeAfter('**BUILD INSTALL**'), LOAD = codeAfter('3 lines, then build');
  const data = {}, figma = { root: { getSharedPluginData: (ns, k) => data[ns + k] || '', setSharedPluginData: (ns, k, v) => { data[ns + k] = v; } } };
  globalThis.figma = figma;
  const load = LOAD + '\nreturn { I, T, fill, stroke, AL, put, KIT, WARN };';
  assert.strictEqual(await new AF('figma', load)(figma), 'INSTALL BUILD FIRST');
  assert.match(await new AF('figma', INSTALL)(figma), /^installed build_/);
  const r = await new AF('figma', load)(figma);
  for (const f of ['I', 'T', 'fill', 'stroke', 'AL', 'put']) assert.strictEqual(typeof r[f], 'function', f);
  assert.strictEqual(r.KIT.c['Tag'], KIT['Tag'].key);
  assert.strictEqual(Object.keys(r.KIT.t).length, 25);
  assert.ok(r.KIT.v.sapList_SelectionBorderColor && r.KIT.v.sapTextColor);
  assert.strictEqual(await r.I('Not A Component'), null);                  // unknown name → WARN, not a crash
  assert.match(r.WARN[0], /KIT\.c has no "Not A Component"/);
  delete globalThis.figma;
});

test('skill tells the Figma Agent no terminal: no bare python3/node/kit.js steps outside "Claude Code" notes', () => {
  const paras = SKILL_TXT.split(/\n\s*\n/).filter(p => /python3 |node build\//.test(p));
  const bad = paras.filter(p => !/Claude Code|no terminal|JEV-ROUTER|router section is generated/.test(p)).map(p => p.slice(0, 80));
  assert.deepStrictEqual(bad, []);
});

// ── Gate 0 v2: element plan (run-3 fix) ──────────────────────────────────────
const { validatePlan } = require('../build/route.js');
const GOLD = path.join(ROOT, 'knowledge/gold/plans/flight-ticket-selection.plan.json');
const BAD = path.join(ROOT, 'test/fixtures/plan-run3-bad.json');

test('element plan: every run-3 mistake is rejected with its fix', () => {
  const r = validatePlan(JSON.parse(fs.readFileSync(BAD, 'utf8')));
  assert.strictEqual(r.ok, false);
  const all = r.errors.join('\n');
  for (const want of [/selected card needs border_role selected_border/, /not allowed for role link — use sapLinkColor/,
    /"luggage" uses icon suitcase/, /"price_tag" uses icon tag/, /Type="Emphasized"/, /role primary_cta needs Type=Primary/,
    /logo needs crop/, /meaning "seat" uses icon grid, not information/, /"information" used for .* one icon per meaning/])
    assert.match(all, want);
});

test('element plan: the gold plan for this reference passes, 0 questions (seat icon now maps to grid)', () => {
  const r = validatePlan(JSON.parse(fs.readFileSync(GOLD, 'utf8')));
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.questions.length, 0);
  for (const k of ['ticket_card', 'provider_row', 'flight_leg_card', 'summary_card']) assert.ok(r.recipes.some(x => x.endsWith(k)), k);
  assert.ok(r.count.logo >= 6 && r.count.icon >= 10);
});

test('element plan: a wrong ROLE is caught from the measured reference colour', () => {
  const row = { section: 'S', element: 'Ankunft', kind: 'text', text: 'Ankunft', style: 'SmallText/LHAuto/Bold', ref_hex: '#b6763a' };
  assert.strictEqual(validatePlan([{ ...row, role: 'secondary_text' }]).ok, false);
  assert.strictEqual(validatePlan([{ ...row, role: 'warning_text' }]).ok, true);
  assert.strictEqual(validatePlan([{ ...row, role: 'secondary_text', ref_hex: '#556b82' }]).ok, true);   // no false alarm
});

test('audit-plan (element plan): perfect build passes; missing logo, grey Ankunft, wrong icon fail', () => {
  const plan = JSON.parse(fs.readFileSync(GOLD, 'utf8')), rows = plan.rows.filter(r => !r.ask);
  const R = require('../build/router-table.json').colour_roles;
  const tree = [];
  for (const r of rows) {
    if (r.kind === 'text') tree.push({ type: 'TEXT', name: r.element, text: r.text, style: r.style, fill: r.token || R[r.role][0] });
    if (r.kind === 'component') tree.push({ type: 'INSTANCE', name: r.element, component: r.component, props: r.props || {} });
    if (r.kind === 'icon') tree.push({ type: 'INSTANCE', name: r.icon, component: r.icon, props: {} });
    if (r.kind === 'logo') tree.push({ type: 'RECTANGLE', name: r.element, image: true });
    if (r.kind === 'divider') tree.push({ type: 'LINE', name: r.element, stroke: R.divider[0] });
    if (r.kind === 'container') tree.push({ type: 'FRAME', name: r.element,
      stroke: r.selected ? R.selected_border[0] : r.border_role ? R[r.border_role][0] : '', fill: r.fill_role ? R[r.fill_role][0] : '' });
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-'));
  const run = t => { fs.writeFileSync(path.join(dir, 't.json'), JSON.stringify(t));
    try { return { code: 0, out: execFileSync('node', [path.join(ROOT, 'build/audit-plan.js'), GOLD, path.join(dir, 't.json')]).toString() }; }
    catch (e) { return { code: e.status, out: e.stdout.toString() }; } };
  assert.strictEqual(run(tree).code, 0, run(tree).out);
  const bad = tree.filter((n, i) => !(n.image && i === tree.findIndex(x => x.image)))
    .map(n => n.text === 'Ankunft: Do 8. Okt' ? { ...n, fill: 'sapContent_LabelColor' } : n)
    .map(n => n.component === 'suitcase' ? { ...n, component: 'information', name: 'information' } : n);
  const b = run(bad);
  assert.strictEqual(b.code, 1);
  assert.match(b.out, /logo ".*" \(image crop/); assert.match(b.out, /Ankunft: Do 8\. Okt": sapContent_LabelColor, role warning_text/); assert.match(b.out, /icon "suitcase"/);
});

test('drift: every role token, icon meaning and recipe role exists', () => {
  const T2 = require('../build/router-table.json'), KJ = require('../build/kit-live.js');
  const toks = new Set([...Object.keys(KJ.vars).map(n => n.split('/').pop()), T2.act_route.frame_active_border.token]);
  for (const [role, list] of Object.entries(T2.colour_roles)) if (role !== '_doc') for (const t of list) assert.ok(toks.has(t), `${role}: ${t}`);
  const icons = new Set([...Object.keys(KJ.icons).map(n => n.split('/').pop()), ...Object.keys(require('../knowledge/live/icons-extra.json').icons)]);
  for (const [m, icon] of Object.entries(T2.icon_meanings)) if (m !== '_doc' && icon) assert.ok(icons.has(icon), `${m} → ${icon}`);
  for (const p of Object.values(T2.patterns)) if (p.frame) for (const k of ['fill_role', 'border_role', 'selected_border_role'])
    if (p.frame[k]) assert.ok(T2.colour_roles[p.frame[k]], `${k} ${p.frame[k]}`);
});

test('docs: every I(...) example uses real kit values (the Emphasized bug)', () => {
  const bad = [];
  for (const f of ['CLAUDE.md', 'build/templates/sap-kit.prelude.js', '.claude/skills/sap-figma-agent/SKILL.md']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of src.matchAll(/I\('([^']+)',\s*\{([^}]*)\}/g)) {
      const c = KIT[m[1]]; if (!c) { bad.push(`${f}: component ${m[1]}`); continue; }
      for (const pv of m[2].matchAll(/'?([\w ]+)'?\s*:\s*'([^']+)'/g)) {
        const def = c.props[pv[1]]; if (!def || !def.startsWith('V:')) continue;
        if (!def.slice(2).split('|')[1].split(',').includes(pv[2])) bad.push(`${f}: ${m[1]}.${pv[1]}='${pv[2]}'`);
      }
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('section map: read like a person — Z order, every section filled, every row in a section', () => {
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  assert.deepStrictEqual(gold.sections.map(s => s.id), ['A', 'B', 'C', 'D']);
  const swapped = { ...gold, sections: [gold.sections[0], gold.sections[2], gold.sections[1], gold.sections[3]] };
  assert.match(validatePlan(swapped).errors.join('\n'), /not in Z order: declared A → C → B → D, reading order is A → B → C → D/);
  assert.match(validatePlan({ ...gold, sections: undefined }).errors.join('\n'), /plan\.sections missing/);
  assert.match(validatePlan({ ...gold, frame: undefined }).errors.join('\n'), /plan\.frame missing/);
  const lost = { ...gold, rows: gold.rows.map(r => r.section === 'D' ? { ...r, section: 'E' } : r) };
  const e = validatePlan(lost).errors.join('\n');
  assert.match(e, /section D \(Step 2: provider list\) has no elements/); assert.match(e, /section "E" is not in the section map/);
  assert.ok(gold.rows.some(r => r.section === 'A' && /Favourite|Share/.test(r.element)), 'heart/share belong to section A');
});

test('section map: each section is first described like a person, with positions', () => {
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  assert.ok(gold.sections.every(s => s.describe && s.describe.length > 40));
  const vague = { ...gold, sections: gold.sections.map(s => s.id === 'B' ? { ...s, describe: 'cards' } : s) };
  assert.match(validatePlan(vague).errors.join('\n'), /section B: describe it first like a person/);
});

test('--map: per section, what you see → SAP component · state · style · variable', () => {
  const { sapMap } = require('../build/route.js');
  const m = sapMap(JSON.parse(fs.readFileSync(GOLD, 'utf8')));
  for (const want of [/^FRAME 1440×891 · XL 1440 · Compact · List Report/m, /^B — Ticket type cards/m, /sees: Three cards side by side/,
    /Radio Button · Selected=True, Form Factor=Compact/, /border sapList_SelectionBorderColor · SELECTED/,
    /Text · style SmallText\/LHAuto\/Bold · sapField_WarningColor \(warning_text\)/, /Icon Button · Type=Secondary/, /SAP icon grid \(seat\)/])
    assert.match(m, want);
});

// ── v4: audit gives MATCH %, hygiene (main's invariants minus instance internals), 90% gate ──
test('v4 audit: MATCH %, 90% gate, hygiene catches default globes, placeholders, raw colour, non-72 font', () => {
  const plan = JSON.parse(fs.readFileSync(GOLD, 'utf8')), rows = plan.rows.filter(r => !r.ask);
  const R = require('../build/router-table.json').colour_roles;
  const tree = [];
  for (const r of rows) {
    if (r.kind === 'text') tree.push({ type: 'TEXT', name: r.element, text: r.text, style: r.style, fill: r.token || R[r.role][0], font: '72' });
    if (r.kind === 'component') tree.push({ type: 'INSTANCE', name: r.element, component: r.component, props: r.props || {} });
    if (r.kind === 'icon') tree.push({ type: 'INSTANCE', name: r.icon, component: r.icon, props: {} });
    if (r.kind === 'logo') tree.push({ type: 'RECTANGLE', name: r.element, image: true });
    if (r.kind === 'divider') tree.push({ type: 'LINE', name: r.element, stroke: R.divider[0] });
    if (r.kind === 'container') tree.push({ type: 'FRAME', name: r.element,
      stroke: r.selected ? R.selected_border[0] : r.border_role ? R[r.border_role][0] : '', fill: r.fill_role ? R[r.fill_role][0] : '' });
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v4-'));
  const run = t => { fs.writeFileSync(path.join(dir, 't.json'), JSON.stringify(t));
    try { return { code: 0, out: execFileSync('node', [path.join(ROOT, 'build/audit-plan.js'), GOLD, path.join(dir, 't.json')]).toString() }; }
    catch (e) { return { code: e.status, out: e.stdout.toString() }; } };
  let r = run(tree); assert.strictEqual(r.code, 0, r.out); assert.match(r.out, /MATCH 100%/);
  // 5 logos missing of ~82 rows → still ≥ 90% → pass, but lines listed
  const noLogos = tree.filter((n, i) => !(n.image && tree.filter(x => x.image).indexOf(n) < 5));
  r = run(noLogos); assert.strictEqual(r.code, 0, r.out); assert.match(r.out, /MATCH 9\d%/); assert.match(r.out, /logo "/);
  // half the texts gone → below 90% → fail
  let k = 0; r = run(tree.filter(n => n.type !== 'TEXT' || k++ % 2)); assert.strictEqual(r.code, 1); assert.match(r.out, /MATCH [0-8]\d%/);
  // hygiene: default globe, placeholder, raw colour, Inter font — each blocks; kit internals are skipped
  for (const bad of [{ type: 'INSTANCE', name: 'globe', component: 'globe', props: {} }, { type: 'TEXT', name: 't', text: 'Tab Text', font: '72' },
    { type: 'FRAME', name: 'Card', fill: 'RAW' }, { type: 'TEXT', name: 't', text: 'x', font: 'Inter' }]) {
    r = run([...tree, bad]); assert.strictEqual(r.code, 1, JSON.stringify(bad)); assert.match(r.out, /HYGIENE \(1\)/);
    assert.strictEqual(run([...tree, { ...bad, inInst: true }]).code, bad.name === 'globe' ? 1 : 0);   // globe counts anywhere
  }
});

test('v4 crop-logos: one PNG per logo row, crop scaled from frame px to the image', () => {
  const { PNG } = (() => { try { return require('pngjs'); } catch { return {}; } })();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logo-'));
  const img = path.join(dir, 'ref.png');
  // a 2880-wide reference (2× the 1440 frame): python makes it, so the test needs only PIL
  execFileSync('python3', ['-c', `from PIL import Image; Image.new('RGB',(2880,1530),'white').save('${img}')`]);
  const out = execFileSync('python3', [path.join(ROOT, 'build/crop-logos.py'),
    path.join(ROOT, 'knowledge/gold/plans/flight-search-results.plan.json'), img, path.join(dir, 'out')]).toString();
  assert.match(out, /4 logo\(s\) cropped/);
  assert.match(out, /100×96/);                                          // [510,196,50,48] × 2
  assert.strictEqual(fs.readdirSync(path.join(dir, 'out')).length, 4);
});

test('v4 route.js: --min writes a one-line plan; --closest-gold picks the right gold; --map has ASCII + suggestions', () => {
  const { closestGold, asciiMap, suggestions } = require('../build/route.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'min-'));
  fs.copyFileSync(GOLD, path.join(dir, 'x.plan.json'));
  execFileSync('node', [path.join(ROOT, 'build/route.js'), '--plan', path.join(dir, 'x.plan.json'), '--min']);
  const min = fs.readFileSync(path.join(dir, 'x.min.json'), 'utf8');
  assert.ok(!min.includes('\n')); assert.deepStrictEqual(JSON.parse(min), JSON.parse(fs.readFileSync(GOLD, 'utf8')));
  assert.match(closestGold(null, 'Schritt Tickets Buchen Gepäck Ryanair Kiwi')[0].file, /flight-ticket-selection/);
  assert.match(closestGold({ frame: { breakpoint: 'XL 1440', density: 'Compact' } }, 'Спирки Часове Директен Избор')[0].file, /flight-search-results/);
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  assert.match(asciiMap(gold), /A Step 1/); assert.match(asciiMap(gold), /[│─]/);
  assert.ok(suggestions(gold).some(s => /Logos/.test(s)));
});

test('v4 audit on the REAL gold build 270:6722 (dump fixture): 97%, only its real defects listed', () => {
  let out, code = 0;
  try { out = execFileSync('node', [path.join(ROOT, 'build/audit-plan.js'), path.join(ROOT, 'knowledge/gold/plans/flight-search-results.plan.json'),
    path.join(ROOT, 'test/fixtures/tree-gold-270-6722.json')]).toString(); } catch (e) { code = e.status; out = e.stdout.toString(); }
  assert.match(out, /MATCH 97%/);
  assert.match(out, /38,65 €/);                                 // card 2 disclaimer copied from card 1 (37,27 €) — a real defect
  assert.match(out, /"НАЙ-БЪРЗО": raw colour/);                // pink promo text is not a SAP token — hygiene blocks
  assert.strictEqual(code, 1);
  assert.doesNotMatch(out, /Всички|01:00 \+1": font|Logo": raw/);   // kit-internal labels, mixed 72 text, logo backing: no false alarms
});
