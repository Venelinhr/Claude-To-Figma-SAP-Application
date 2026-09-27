#!/usr/bin/env node
// route.js — Jev typed router for SAP Figma builds. The FIRST step of every request.
//
// WHY: without it the agent reasons its way to mode, floorplan, component and state
// (12-40 s, sometimes wrong: Check Box `Selected` vs the real `Check`). This gives the
// request a TYPE and sends each type to ONE handler — plain word tables, 0 tokens,
// 0 dependencies, no LLM in the hot path (same pattern as the SAP knowledge MCP router,
// SAP-snapshots/jev-router-2026-09-21/router.js).
//
//   node build/route.js "check box off"              → typed JSON + trace line
//   node build/route.js --trace "switch on"          → only the trace line
//   node build/route.js --image ref.json ["words"]   → Gate 0: measure-ref --json → typed zones
//
// Tables: build/router-table.json (the one source). Text rules: build/route-core.js (the
// same code the Figma ROUTE block runs). States resolve against the component's REAL
// options in knowledge/live/kit.json. Unclear word → candidates, never a guess.
const fs = require('fs');
const path = require('path');
const T = require('./router-table.json');
const RC = require('./route-core.js');
const KIT = require('../knowledge/live/kit.json').components;

// real variant options of a kit component: { prop: [options] }
const defsOf = name => {
  const c = KIT[name]; if (!c) return {};
  const d = {};
  for (const [p, v] of Object.entries(c.props)) if (v.startsWith('V:')) d[p] = v.slice(2).split('|')[1].split(',');
  return d;
};

// ── GATE 3: component (longest phrase wins, so "check box" beats "check") ────
const COMP_WORDS = T.gate3_component.rules.flatMap(r => r.words.map(w => ({ w, r })))
  .sort((a, b) => b.w.length - a.w.length);
function components(t) {
  const found = []; let rest = t;
  for (const { w, r } of COMP_WORDS) {
    if (!RC.hit(rest, w)) continue;
    if (!found.find(o => o.name === r.component)) found.push({ name: r.component, key: r.key, word: w });
    rest = RC.cut(rest, w);                    // a word used by a component is not a state word
  }
  const candidates = T.gate3_component.candidates.filter(c => RC.hit(rest, c.word))
    .map(c => ({ word: c.word, options: c.options }));
  return { found, candidates, rest };
}

// ── GATE 4: state keys → real prop/value per component; a plain frame → border ──
function states(rest, comps, frameWord) {
  const keys = RC.stateKeys(rest, T), list = [], ops = [], missing = [];
  for (const k of keys) {
    if (!comps.length) {
      const b = T.gate4_state.frame_keys[k];
      if (b && frameWord) { const s = T.act_route[b]; ops.push({ op: 'stroke', token: s.token, key: s.key, weight: s.weight }); }
      else list.push({ component: null, key: k, prop: '<from selection>', value: k });
      continue;
    }
    for (const c of comps) {
      const r = RC.resolveState(defsOf(c.name), k, T);
      if (r) list.push({ component: c.name, key: k, ...r });
      else missing.push(`${c.name} has no "${k}" state`);
    }
  }
  return { list, ops, missing };
}

// ── GATE 2: floorplan (THINK only) ───────────────────────────────────────────
function floorplan(t) {
  for (const r of T.gate2_floorplan.rules) if (RC.any(t, r.words)) return r.floorplan;
  return T.gate2_floorplan.default;              // null → take it from the image, or ask
}

const dedupe = (a, k) => a.filter((x, i) => a.findIndex(y => k(y) === k(x)) === i);

// ── route(text) → one typed request ──────────────────────────────────────────
function route(text) {
  const parts = RC.clauses(text).map(c => {
    const mode = RC.clauseMode(c, T);
    const comp = components(c);
    const st = states(comp.rest, comp.found, RC.isFrameWord(c));
    // "based on this" is not a state: a THINK clause sets no state and no op
    if (mode === 'THINK') return { text: c.trim(), mode, comp, states: [], ops: [], missing: [] };
    return { text: c.trim(), mode, comp, states: st.list, ops: [...RC.numberOps(c, T), ...st.ops], missing: st.missing };
  });
  const modes = parts.map(p => p.mode).filter(Boolean);
  let mode = modes.includes('THINK') ? (modes.some(m => m !== 'THINK') ? 'SPLIT' : 'THINK')
           : modes.includes('QUICK') ? 'QUICK' : modes.includes('ACT') ? 'ACT' : null;
  const comps = dedupe(parts.flatMap(p => p.comp.found), c => c.name);
  const candidates = dedupe(parts.flatMap(p => p.comp.candidates), c => c.word);
  if (!mode) mode = candidates.length || comps.length ? 'ACT' : T.gate1_mode.default; // "change the box" → ask
  const r = {
    mode,
    floorplan: mode === 'THINK' || mode === 'SPLIT' ? floorplan(RC.norm(text)) : null,
    components: comps,
    states: parts.flatMap(p => p.states),
    ops: parts.flatMap(p => p.ops),
    candidates,
    missing: parts.flatMap(p => p.missing),
    handler: { ACT: 'act-one-call', QUICK: 'quick-runtime-build', THINK: 'think-plan', SPLIT: 'act-now-then-think-plan' }[mode],
  };
  if (mode === 'SPLIT') r.parts = parts.map(p => ({ text: p.text, mode: p.mode || 'ACT' }));
  if (candidates.length && !comps.length) r.handler = 'ask-candidates';
  r.ok = r.handler !== 'ask-candidates' && !r.missing.length;
  r.trace = trace(r);
  if (mode === 'ACT' && r.ok) r.act = actArgs(r);
  return r;
}

// the `A` object for the tiny ACT call (SKILL.md → ACT MODE → CALL); state = a Gate 4 name,
// the saved code resolves it against the node's real options
function actArgs(r) {
  const A = {};
  if (r.states[0]) A.state = r.states[0].key;
  const b = r.ops.find(o => o.op === 'stroke');
  if (b) {
    A.border = b.key === T.act_route.frame_active_border.key ? 'selected' : 'normal';
    A.state = A.state || (A.border === 'selected' ? 'on' : 'off');   // "card selected" = its radio on too
    if (A.border === 'selected') A.exclusive = true;                  // …and the other cards back to normal
  }
  for (const o of r.ops) {
    if (o.op === 'all4') A.pad = o.value;
    if (o.op === 'leftRight') A.side = o.value;
    if (o.op === 'itemSpacing') A.gap = o.value;
  }
  return A;
}

function trace(r) {
  const bits = [r.mode];
  if (r.floorplan) bits.push(r.floorplan);
  else if (r.mode === 'THINK' || r.mode === 'SPLIT') bits.push('floorplan: from image / ask');
  for (const c of r.components)
    bits.push([c.name, ...r.states.filter(s => s.component === c.name).map(s => `${s.prop}=${s.value}`)].join(' · '));
  for (const s of r.states.filter(s => !s.component)) bits.push(`state=${s.key} (resolve on selection)`);
  for (const o of r.ops) bits.push(o.op === 'stroke' ? `border ${o.token} ${o.weight}px` : `${o.op}=${o.value}`);
  if (r.handler === 'ask-candidates')
    bits.push('ask: ' + r.candidates.map(c => `"${c.word}" = ${c.options.join(' | ')}?`).join(' '));
  for (const m of r.missing) bits.push(`⚠ ${m}`);
  return '▸ routed: ' + bits.join(' · ');
}

// ── GATE 0: image (measure-ref.py --json) → typed zones ──────────────────────
const LABELS = [...T.image_labels.rules].sort((a, b) => b.label.length - a.label.length);
function routeBox(b) {
  const rule = LABELS.find(r => (b.guess || '').startsWith(r.label));
  if (!rule) return { zone: b.box, label: b.guess, component: 'unmapped' };
  const [, , w, h] = b.box;
  const s = rule.size.find(s => ('w_max' in s ? w <= s.w_max : 'h_max' in s ? h <= s.h_max : true)) || {};
  const name = s.component || s.else;
  const z = { zone: b.box, label: b.guess, component: name };
  if (KIT[name]) z.key = KIT[name].key;
  if (name === 'candidates') { z.component = 'ask'; z.options = s.options; }
  if (s.state) {
    const r = KIT[name] && RC.resolveState(defsOf(name), s.state, T);
    z.state = r ? { [r.prop]: r.value } : { selected: true };
  }
  if (s.props) z.props = s.props;
  if (s.density) z.density = s.density;
  if (name === 'container') z.border = s.state === 'on' ? T.image_labels.container.selected_border_token
    : (b.edge ? T.image_labels.container.border_token : undefined);
  if (b.pad) z.pad = b.pad.map(n => RC.snap(n, T));
  if (b.component_check) z.density_check = b.component_check;
  return z;
}
function routeImage(m, words) {
  const zones = (m.boxes || []).map(routeBox);
  const read = (m.read || []).join('\n');
  // floorplan: the user's words win; else a small crop → Dialog; repeated rows → List Report
  let fp = words ? floorplan(RC.norm(words)) : null;
  if (!fp) {
    const [W, H] = (m.frame && m.frame.build) || [0, 0];
    fp = W && W < 768 && H < 700 ? 'Dialog' : /\d+ rows/.test(read) && zones.length > 6 ? 'List Report' : null;
  }
  const r = {
    mode: 'THINK', floorplan: fp,
    frame: m.frame ? { build: m.frame.build, breakpoint: m.frame.breakpoint, density: m.frame.density } : null,
    zones,
    unmapped: zones.filter(z => z.component === 'unmapped').map(z => z.label),
    ask: zones.filter(z => z.component === 'ask').map(z => ({ zone: z.zone, options: z.options })),
    colours: (m.colours || []).slice(0, 12),
    handler: 'think-plan',
  };
  const count = {}; for (const z of zones) count[z.component] = (count[z.component] || 0) + 1;
  r.trace = `▸ routed: THINK · ${fp || 'floorplan: ask'} · ${r.frame ? r.frame.breakpoint + ' ' + r.frame.density : ''} · ` +
    Object.entries(count).map(([k, v]) => `${v}× ${k}`).join(', ');
  return r;
}

// ── GATE 0 v2: validate the typed ELEMENT PLAN (build only on ok) ────────────
// The builder lists every element of the reference; each row is checked against the
// real kit (components, props, text styles, icons) and the colour-ROLE table, so no
// quality choice is left to free reasoning. Unknown → error with the fix, never a guess.
const KJ = require('../knowledge/live/kit.json');
const ICONS = new Set([...Object.keys(KJ.icons).map(n => n.split('/').pop()),
  ...Object.keys(require('../knowledge/live/icons-extra.json').icons)]);
const TOKENS = new Set([...Object.keys(KJ.vars).map(n => n.split('/').pop()), T.act_route.frame_active_border.token]);
// nearest TEXT role for a measured hex (only saturated roles: link / success / warning / error)
const hexVal = n => { const v = KJ.vars[Object.keys(KJ.vars).find(k => k.endsWith('/' + n))]; if (!v) return null;
  let x = v.split('|')[2]; for (let d = 0; x && x.startsWith('→') && d < 8; d++) x = (KJ.vars[x.slice(1)] || '').split('|')[2];
  return /^#[0-9a-f]{6}/i.test(x || '') ? x.slice(0, 7) : null; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function nearestRole(hex) {
  let best = null;
  for (const role of ['link', 'success_text', 'warning_text', 'error_text', 'body_text', 'secondary_text'])
    for (const token of T.colour_roles[role]) { const h = hexVal(token); if (!h) continue;
      const d = Math.hypot(...rgb(hex).map((c, k) => c - rgb(h)[k])); if (!best || d < best.d) best = { role, token, d }; }
  return best;
}
function validatePlan(plan) {
  const rows = Array.isArray(plan) ? plan : plan.rows || [];
  const R = T.colour_roles, CR = T.component_roles, IM = T.icon_meanings, errors = [];
  const err = (i, r, msg) => errors.push(`row ${i + 1} [${r.section || '?'} / ${r.element || r.text || r.kind}]: ${msg}`);
  const tokenFor = (i, r, role, token, what) => {
    if (!R[role] || role === '_doc') return err(i, r, `${what} role "${role}" unknown — use one of: ${Object.keys(R).filter(k => k !== '_doc').join(', ')}`);
    if (token && !R[role].includes(token)) err(i, r, `${what} token ${token} is not allowed for role ${role} — use ${R[role].join(' / ')}`);
  };
  const iconMeanings = {}, questions = [];
  // STEP A + B — frame and section map, read like a person: Z pattern (top → down, left → right per band)
  const secs = Array.isArray(plan) ? null : plan.sections;
  if (!Array.isArray(plan)) {
    const f = plan.frame;
    if (!f) errors.push('plan.frame missing — state w, h, breakpoint, density, floorplan first');
    else {
      if (!['Compact', 'Cozy'].includes(f.density)) errors.push(`frame.density "${f.density}" — Compact or Cozy`);
      const fps = T.gate2_floorplan.rules.map(x => x.floorplan);
      if (!fps.includes(f.floorplan)) errors.push(`frame.floorplan "${f.floorplan}" — one of ${fps.join(', ')}`);
    }
    if (!Array.isArray(secs) || !secs.length) errors.push('plan.sections missing — split the reference into sections (A, B, C…) in Z order before listing elements');
    else {
      const ids = secs.map(s => s.id);
      if (new Set(ids).size !== ids.length) errors.push(`section ids must be unique: ${ids.join(', ')}`);
      for (const s of secs) {
        // first SAY what you see, like a person, with positions — then choose SAP parts
        if (!s.describe || s.describe.split(/\s+/).length < 8 || !/\b(left|right|under|after|next|top|below|above|side by side)\b/i.test(s.describe))
          errors.push(`section ${s.id}: describe it first like a person, in reading order, with positions (left / right / under / after / next to)`);
        if (!(Array.isArray(s.box) && s.box.length === 4)) errors.push(`section ${s.id}: box [x,y,w,h] missing`);
        if (!s.layout) errors.push(`section ${s.id}: layout missing (row / column / grid + FILL/HUG/FIXED)`);
        if (!Array.isArray(s.sap) || !s.sap.length) errors.push(`section ${s.id}: list the SAP components it uses`);
        if (s.recipe && !T.patterns[s.recipe]) errors.push(`section ${s.id}: recipe "${s.recipe}" unknown`);
        if (!rows.some(r => r.section === s.id)) errors.push(`section ${s.id} (${s.name}) has no elements — read it again`);
      }
      // Z order: band = sections that overlap vertically; bands top → down, left → right inside a band
      const z = [...secs].filter(s => Array.isArray(s.box)).sort((a, b) => a.box[1] - b.box[1]);
      const bands = [];
      for (const s of z) {
        const b = bands.find(b => b.some(o => s.box[1] < o.box[1] + o.box[3] && o.box[1] < s.box[1] + s.box[3] && Math.abs(s.box[1] - o.box[1]) < 40));
        b ? b.push(s) : bands.push([s]);
      }
      const want = bands.flatMap(b => b.sort((a, c) => a.box[0] - c.box[0])).map(s => s.id);
      if (want.join() !== ids.join()) errors.push(`sections are not in Z order: declared ${ids.join(' → ')}, reading order is ${want.join(' → ')}`);
      rows.forEach((r, i) => { if (!ids.includes(r.section)) err(i, r, `section "${r.section}" is not in the section map (${ids.join(', ')})`); });
    }
  }
  rows.forEach((r, i) => {
    if (r.ask) return questions.push(`${r.section || '?'} / ${r.element}: ${r.ask === true ? 'no SAP match — ask the user' : r.ask}`);
    if (!T.element_plan.kinds.includes(r.kind)) return err(i, r, `kind "${r.kind}" — use ${T.element_plan.kinds.join('|')}`);
    if (r.kind === 'text') {
      if (!KJ.text[r.style]) err(i, r, `text style "${r.style}" not in the kit — see node build/kit.js t`);
      if (!r.role) err(i, r, 'every text needs a colour role (title_text, body_text, secondary_text, link, success_text, warning_text…)');
      else tokenFor(i, r, r.role, r.token, 'text');
    }
    if (r.kind === 'component') {
      if (!KIT[r.component]) return err(i, r, `component "${r.component}" not in the kit — see node build/kit.js list`);
      const d = defsOf(r.component);
      for (const [p, v] of Object.entries(r.props || {}))
        if (d[p] && !d[p].includes(String(v))) err(i, r, `${r.component}.${p}="${v}" — real values: ${d[p].join(', ')}`);
      const cr = r.role && CR[r.role];
      if (cr) {
        if (cr.component !== r.component) err(i, r, `role ${r.role} must be a ${cr.component}, not ${r.component}`);
        for (const [p, v] of Object.entries(cr.props || {})) if ((r.props || {})[p] !== v) err(i, r, `role ${r.role} needs ${p}=${v} (never paint a brand colour)`);
      }
    }
    if (r.kind === 'icon') {
      if (!r.meaning) err(i, r, 'every icon needs a meaning (what it tells the user)');
      const want = r.meaning ? IM[r.meaning] : undefined;
      if (want === null) err(i, r, `SAP has no icon for "${r.meaning}" — ask the user (put it in the plan as a question)`);
      else if (want && r.icon !== want) err(i, r, `meaning "${r.meaning}" uses icon ${want}, not ${r.icon}`);
      if (!ICONS.has(r.icon)) err(i, r, `icon "${r.icon}" not found — see node build/kit.js i <word>`);
      if (r.meaning) (iconMeanings[r.icon] ||= new Set()).add(r.meaning);
      if (r.role) tokenFor(i, r, r.role, r.token, 'icon');
    }
    if (r.kind === 'logo' && !(Array.isArray(r.crop) && r.crop.length === 4 && r.crop.every(n => typeof n === 'number')))
      err(i, r, 'a logo needs crop:[x,y,w,h] in reference px — crop it from the reference image, never a colour block');
    if (r.kind === 'divider') tokenFor(i, r, r.role || 'divider', r.token, 'divider');
    if (r.kind === 'container') {
      if (r.border_role) tokenFor(i, r, r.border_role, r.border_token, 'border');
      if (r.fill_role) tokenFor(i, r, r.fill_role, r.fill_token, 'fill');
      if (r.selected && r.border_role !== 'selected_border') err(i, r, 'a selected card needs border_role selected_border (sapList_SelectionBorderColor)');
    }
    for (const t of [r.token, r.border_token, r.fill_token]) if (t && !TOKENS.has(t)) err(i, r, `token ${t} does not exist in the kit`);
    // wrong ROLE check: the measured reference colour (measure-ref accents) must fit the chosen role
    if (r.ref_hex && r.kind === 'text' && R[r.role]) {
      const near = nearestRole(r.ref_hex);
      if (near && near.role !== r.role && near.d < 90 && !R[r.role].includes(near.token))
        err(i, r, `reference colour ${r.ref_hex} reads as ${near.role} (${near.token}), not ${r.role} — check the role`);
    }
  });
  // one icon per meaning: an icon may serve several meanings only when the table maps them all to it
  for (const [icon, ms] of Object.entries(iconMeanings)) {
    const foreign = [...ms].filter(m => IM[m] !== icon);
    if (ms.size > 1 && foreign.length) errors.push(`icon "${icon}" used for ${[...ms].join(', ')} — one icon per meaning`);
  }
  const count = {}; for (const r of rows) count[r.kind] = (count[r.kind] || 0) + 1;
  const key = r => r.group ? `${r.section} / ${r.group}` : r.section;
  const recipes = [...new Set(rows.map(key))].map(s => {
    const txt = RC.norm(rows.filter(r => key(r) === s).map(r => r.text || r.element || '').join(' '));
    const hit = Object.entries(T.patterns).find(([k, p]) => k !== '_doc' && p.words.filter(w => RC.hit(txt, w)).length >= 2);
    return hit ? `${s} → recipe ${hit[0]}` : null;
  }).filter(Boolean);
  return { ok: !errors.length, rows: rows.length, count, errors, questions, recipes,
    trace: `▸ plan ${errors.length ? 'REJECTED' : 'OK'} · ${rows.length} rows · ` +
      Object.entries(count).map(([k, v]) => `${v} ${k}`).join(', ') + (errors.length ? ` · ${errors.length} errors` : '') +
      (questions.length ? ` · ${questions.length} question(s) for the user` : '') };
}

// ── the SAP proposal: per section, what you see → SAP component · state · style · variable ──
function sapMap(plan) {
  const R = T.colour_roles, out = [];
  if (plan.frame) out.push(`FRAME ${plan.frame.w}×${plan.frame.h} · ${plan.frame.breakpoint} · ${plan.frame.density} · ${plan.frame.floorplan}`);
  for (const s of plan.sections || []) {
    out.push('', `${s.id} — ${s.name}`, `  sees: ${s.describe || '(no description)'}`, `  layout: ${s.layout || '-'}${s.recipe ? ` · recipe ${s.recipe}` : ''}`);
    for (const r of (plan.rows || []).filter(r => r.section === s.id)) {
      const what = (r.group ? r.group + ' · ' : '') + r.element;
      let sap;
      if (r.ask) sap = `? ${r.ask === true ? 'no SAP match — ask' : r.ask}`;
      else if (r.kind === 'text') sap = `Text · style ${r.style} · ${r.token || R[r.role][0]} (${r.role})`;
      else if (r.kind === 'component') sap = `${r.component}${r.props ? ' · ' + Object.entries(r.props).map(([k, v]) => `${k}=${v}`).join(', ') : ''}${r.role ? ` (${r.role})` : ''}`;
      else if (r.kind === 'icon') sap = `SAP icon ${r.icon} (${r.meaning})${r.token ? ' · ' + r.token : ''}`;
      else if (r.kind === 'logo') sap = `image crop [${r.crop}] (SAP has no brand logos)`;
      else if (r.kind === 'divider') sap = `divider · ${r.token || R[r.role || 'divider'][0]}`;
      else sap = `container${r.fill_role ? ` · fill ${r.fill_token || R[r.fill_role][0]}` : ''}${r.border_role ? ` · border ${r.border_token || R[r.border_role][0]}` : ''}${r.selected ? ' · SELECTED' : ''}`;
      out.push(`  ${what.padEnd(34)} → ${sap}`);
    }
  }
  return out.join('\n');
}

module.exports = { route, routeImage, routeBox, defsOf, validatePlan, sapMap };

if (require.main === module) {
  const a = process.argv.slice(2);
  const onlyTrace = a[0] === '--trace' && a.shift();
  let r;
  if (a[0] === '--plan') {
    const pj = JSON.parse(fs.readFileSync(path.resolve(a[1]), 'utf8'));
    r = validatePlan(pj);
    if (a.includes('--map')) console.log(sapMap(pj) + '\n');
    console.log(r.trace);
    for (const e of r.errors) console.log('  ✗ ' + e);
    for (const q of r.questions) console.log('  ? ' + q);
    for (const x of r.recipes) console.log('  ▸ ' + x + '  (knowledge: router-table.json patterns)');
    process.exit(r.ok ? 0 : 1);
  }
  if (a[0] === '--image') r = routeImage(JSON.parse(fs.readFileSync(path.resolve(a[1]), 'utf8')), a.slice(2).join(' '));
  else r = route(a.join(' '));
  console.log(onlyTrace ? r.trace : JSON.stringify(r, null, 2));
}
