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

module.exports = { route, routeImage, routeBox, defsOf };

if (require.main === module) {
  const a = process.argv.slice(2);
  const onlyTrace = a[0] === '--trace' && a.shift();
  let r;
  if (a[0] === '--image') r = routeImage(JSON.parse(fs.readFileSync(path.resolve(a[1]), 'utf8')), a.slice(2).join(' '));
  else r = route(a.join(' '));
  console.log(onlyTrace ? r.trace : JSON.stringify(r, null, 2));
}
