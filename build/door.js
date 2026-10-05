#!/usr/bin/env node
// door.js — the FRONT DOOR (face control). Nothing gets into the plan the user approves unless it is right:
// real kit component, real prop names, allowed state values, no kit placeholder text or default icon on show,
// colour variables by role (text ink · fill · border), no fake components, explicit sizing, and — with a reference —
// the reference size and every reference text placed. OUT = rejected (fix the tree), ASK = the user decides.
//   node build/door.js <tree.json> [--ref see-ref/spec.json]      exit 1 when anything is OUT
//   node build/door.js <tree.json> --baseline <tree.baseline.json> [--allow "name,name"]
//        v6 geometry guard: the numbers of a MEASURED node (w h xy p g) are script-owned. The model may fix names, texts, props and
//        sizing (s), never those numbers — a model rebuilding layout from prose is what scored EYE 9-13 % headless. New nodes are free.
//        --allow re-opens exactly the named nodes (a gates BOX/POSITION line that names them).
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const kit = require('./kit-live.js');
const ICONS = new Set([...Object.keys(kit.icons).map(k => k.split('/').pop()), ...Object.keys(require('../knowledge/live/icons-extra.json').icons)]);
const PLACEHOLDER = /^(placeholder|typed text|text|label|description|product identifier|title|subtitle|value|lorem.*|with text|button|header|option ?\d*|item ?\d*|list item|input text)$/i;
// a text field that shows only for some Type values (the kit hides it otherwise)
const SHOWN_WHEN = { 'Table Cell': { '✏️ Text': ['Text', 'Link', 'Highlight', 'Object Identifier - Bold', 'Object Identifier - Link'],
  '✏️ Currency': ['Currency'], '✏️ By Text Description': ['Object Identifier - Bold', 'Object Identifier - Link'] } };
const DEFAULT_ON_PLACEHOLDER = { 'List Item': { Attachment: 'Attachment' } };   // component → { switch: text it shows }
const isRole = (t, want) => cat(t) === want || /_ForegroundColor$|Selected/.test(t);   // a selection bar may use the foreground colour
const cat = t => /Border|Separator/.test(t) ? 'border' : /Background|BaseColor|ShellColor|AccentColor\d|_Hover|_Active/.test(t) ? 'fill' : 'ink';
const norm = s => String(s).toLowerCase().replace(/[\s.•·,:;|()\-–]+/g, '');

function door(T, file, ref) {
  const out = [], ask = [], all = [], par = new Map();          // parents kept aside: the tree stays plain JSON
  (function walk(o, parent) { par.set(o, parent); all.push(o); (o.c || []).forEach(k => walk(k, o)); })(T, null);
  const O = (what, msg) => out.push([what, msg]);
  // 1. every kit name (component, text style, variable, icon) exists — kit.js is the one lookup
  const k = spawnSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--plan', file], { encoding: 'utf8' });
  for (const l of String(k.stderr || '').split('\n').filter(l => /NOT FOUND/.test(l))) O('kit name', l.replace(/^\/\/ /, '').replace(/ —.*/, ' — not in the SAP kit'));
  for (const o of all) {
    const at = `"${o.n}"`;
    if (o.k === 'i' && kit.components[o.cp]) {                 // 2. component: prop names + state values + what shows
      const defs = Object.fromEntries(Object.entries(kit.components[o.cp].props).map(([n, v]) => [n.replace(/#.*$/, ''), v]));
      const eff = n => (o.pr && n in o.pr) ? String(o.pr[n]) : (defs[n] || '').replace(/^[A-Z]:/, '').split(/[| ]/)[0];
      for (const [n, v] of Object.entries(o.pr || {})) {
        const d = defs[n];
        if (!d) { O('component', `${at} <${o.cp}> has no prop "${n}" — props: ${Object.keys(defs).filter(x => !x.startsWith('✏️')).join(', ')}`); continue; }
        if (d.startsWith('V:')) { const ok = d.split('|')[1].split(','); if (!ok.includes(String(v))) O('state', `${at} <${o.cp}> ${n}=${v} — allowed: ${ok.join(', ')}`); }
        if (d.startsWith('B:') && typeof v !== 'boolean' && !/^(true|false)$/i.test(String(v))) O('state', `${at} <${o.cp}> ${n}=${v} — must be true or false`);
        if (d.startsWith('I:') && !ICONS.has(String(v))) O('icon', `${at} <${o.cp}> ${n}=${v} — not a SAP icon (node build/kit.js i <word>)`);
      }
      const hidden = Object.keys(defs).some(n => defs[n].startsWith('B:') && /label|text/i.test(n) && /^false$/i.test(eff(n)));
      const when = SHOWN_WHEN[o.cp] || {};
      const shown = Object.keys(defs).filter(n => defs[n].startsWith('T:') && !(o.tx && Object.keys(o.tx).length) && (!when[n] || when[n].includes(eff('Type'))));
      for (const n of shown) if (!hidden && PLACEHOLDER.test(eff(n).trim())) O('placeholder', `${at} <${o.cp}> shows the kit default "${eff(n)}" — set ${n} to real content`);
      for (const [n, v] of Object.entries(o.tx || {})) if (PLACEHOLDER.test(String(v).trim())) O('placeholder', `${at} <${o.cp}> inner text "${n}" = "${v}" — real content`);
      // a switch that is ON by default and draws kit placeholder content the tree never fills (the first hotel build showed a stray "Attachment")
      for (const [n, label] of Object.entries(DEFAULT_ON_PLACEHOLDER[o.cp] || {})) if (defs[n] && /^true$/i.test(eff(n))) O('placeholder', `${at} <${o.cp}> shows the kit default "${label}" — set ${n}=false (or fill it)`);
      const iconOn = Object.keys(defs).some(n => defs[n].startsWith('B:') && /^icon/i.test(n) && /^true$/i.test(eff(n)));
      const iconOnly = !Object.keys(defs).some(n => defs[n].startsWith('B:') && /^icon/i.test(n));
      if ((iconOn || iconOnly) && Object.keys(defs).some(n => defs[n].startsWith('I:') && /^icon$/i.test(n)) && /^(globe|information)$/.test(eff('Icon')))
        O('icon', `${at} <${o.cp}> shows the default "${eff('Icon')}" icon — pick the icon for the meaning (router-table icon_meanings)`);
    }
    if (o.k === 't') {                                           // 3. text: real content, a text colour
      if (PLACEHOLDER.test(String(o.t).trim())) O('placeholder', `${at} text "${o.t}" — real content`);
      if (typeof o.bg === 'string' && !o.bg.startsWith('RAW') && !isRole(o.bg, 'ink')) O('colour role', `${at} text painted with ${o.bg} (a ${cat(o.bg)} variable) — use a text colour (sapTextColor, sapContent_LabelColor, sapTitleColor…)`);
    }
    if (o.k === 'ic' && typeof o.bg === 'string' && !o.bg.startsWith('RAW') && !isRole(o.bg, 'ink')) O('colour role', `${at} icon painted with ${o.bg} (a ${cat(o.bg)} variable) — use sapContent_IconColor or a text colour`);
    if (!o.k || o.k === 'r') {                                   // 4. frames + rectangles: fill = background, stroke = border
      const thin = o.k === 'r' && (o.w <= 2 || o.h <= 2);
      if (typeof o.bg === 'string' && !o.bg.startsWith('RAW') && cat(o.bg) === 'ink' && !isRole(o.bg, 'fill') && !thin && !/^Shell Bar/.test(o.n) && !o.dark) O('colour role', `${at} fill ${o.bg} is a text colour — use a background variable`);
      if (typeof o.bg === 'string' && thin && cat(o.bg) === 'ink' && !isRole(o.bg, 'border')) O('colour role', `${at} divider ${o.bg} is a text colour — use a border variable (sapList_BorderColor…)`);
      if (typeof o.bc === 'string' && !o.bc.startsWith('RAW') && !isRole(o.bc, 'border')) O('colour role', `${at} border ${o.bc} is a ${cat(o.bc)} variable — use a border variable (sapList_BorderColor…)`);
    }
    for (const t of [o.bg, o.bc]) if (typeof t === 'string' && t.startsWith('RAW')) O('raw colour', `${at}: raw colour ${t.slice(3)} — use a SAP variable (node build/kit.js hex '${t.slice(3)}')`);
    if (o.k === 't' && !o.st) O('text style', `${at}: text "${String(o.t).slice(0, 20)}" has no SAP text style`);
    if (!o.k && /^(frame|group|rectangle|auto layout)\s*\d*$/i.test(o.n)) O('layer name', `${at}: generic layer name — name it after what it is`);
    if (!o.k && /(^|\s)(button|input|select|check ?box|radio( button)?|switch|slider|tag|chip|badge|toggle|dropdown|search field)$/i.test(o.n)
      && !(function has(x) { return (x.c || []).some(c => c.k === 'i' || has(c)); })(o))
      O('fake component', `${at} is a frame drawn like a ${o.n.split(' ').pop()} — use the real kit component (node build/kit.js list ${o.n.split(' ').pop()})`);
    if (T.sz === 'x' && par.get(o) && par.get(o).d && !o.abs && !/^[XFH]{2}$/.test(o.s || '')) O('sizing', `${at} has no sizing decision — set s (F fill · H hug · X fixed), e.g. "FH"`);
    // 6. RESPONSIVE: the screen must resize. Width follows the parent (FILL) or the content (HUG); a fixed width
    //    is allowed only for small parts (≤ 120), or one fixed side column next to a FILL sibling. No free placement.
    const p = par.get(o);
    if (T.sz === 'x' && p && !o.abs) {
      const W = (o.s || 'XX')[0], big = o.w > 120;
      if (!p.d && !o.k) O('responsive', `${at} sits in a frame without auto-layout (free-placed) — it will not resize; put it in an auto-layout row/column`);
      else if (p.d === 'V' && W === 'X' && big && o.k !== 'i') O('responsive', `${at} has a fixed width ${o.w} in a column — set width to FILL (F) so it follows the screen`);
      else if (p.d === 'V' && W === 'X' && o.k === 't' && o.wrap) O('responsive', `${at} is wrapping text with a fixed width — set width to FILL`);
      else if (p.d === 'H' && W === 'X' && big && o.k !== 'i' && !(p.c || []).some(x => x !== o && !x.abs && (x.s || '')[0] === 'F') && (p.s || '')[0] !== 'H')
        O('responsive', `${at} has a fixed width ${o.w} and no sibling in the row is FILL — one part of the row must flex`);
    }
  }
  if (T.sz === 'x' && T.d === 'H' && !(T.c || []).some(x => !x.abs && (x.s || '')[0] === 'F'))
    O('responsive', `root "${T.n}" is a row and no child is FILL — nothing flexes when the screen is resized`);
  if (ref) {                                                     // 5. against the reference
    const f = ref.frame;
    const k = [1, 2].find(m => Math.abs(T.w * m - f.w) <= 2 * m && Math.abs(T.h * m - f.h) <= 2 * m);   // the reference is a 1× image, or a 2× export of the frame (the gates export the build at 2×)
    if (!k) O('frame size', `frame ${T.w}×${T.h} — the reference is ${f.w}×${f.h}: build at the reference size, or at exactly half of it for a 2× export (EYE compares the 2× export 1:1)`);
    const have = [...(T.kit && T.kit.src === 'spec2tree' && T.kit.texts || [])].concat(all.flatMap(o => [o.t, ...Object.values(o.tx || {}), ...Object.entries(o.pr || {}).filter(([n]) => n.startsWith('✏️')).map(([, v]) => v)])
      .filter(x => x != null)).map(norm).filter(Boolean);
    const unsure = new Set((ref.ask || []).map(a => (a.match(/^text "(.+?)": OCR unsure/) || [])[1]).filter(Boolean));
    const texts = [], icons = [];
    (function w(x) { if (x.type === 'text') texts.push(x.text); if (x.type === 'icon') icons.push(x.meaning || x.icon); (x.children || []).forEach(w); })({ children: ref.sections });
    for (const t of [...new Set(texts)]) {
      const n = norm(t); if (n.length < 2) continue;
      if (!have.some(h => h.includes(n) || (h.length >= 4 && n.includes(h))))
        (unsure.has(t) ? ask : out).push(unsure.has(t) ? `reference text "${t}" (OCR unsure) is not in the tree — is it real?` : ['missing', `reference text "${t}" is not placed anywhere in the tree`]);
    }
    const built = (T.kit && T.kit.src === 'spec2tree' && T.kit.icons || 0) + all.filter(o => o.k === 'ic').length + all.filter(o => o.k === 'i' && o.pr && o.pr.Icon).length;
    if (built < icons.length / 2) O('missing', `reference shows ${icons.length} icons, the tree places ${built} — place the SAP icon for each meaning (${[...new Set(icons)].slice(0, 8).join(', ')})`);
    else if (built < icons.length) ask.push(`reference shows ${icons.length} icons, the tree places ${built} — the rest: logos or kit-internal icons? (${[...new Set(icons)].slice(0, 8).join(', ')})`);
    const shapes = (ref.ask || []).filter(a => /^icon shape #/.test(a)).map(a => a.match(/ (\d+×\d+)/)[1]);
    if (shapes.length) ask.push(`${shapes.length} icon shapes have no SAP icon yet (${shapes.join(', ')}) — pick each from router-table icon_meanings, or a logo crop`);
    for (const a of ref.ask || []) if (!/OCR unsure|^icon shape #/.test(a)) ask.push(a);
  }
  const seen = new Set();
  return { out: out.filter(([w, m]) => !seen.has(m) && seen.add(m)), ask: [...new Set(ask)], checked: all.length };
}
function report(r) {
  const head = r.out.length ? `DOOR  ✗ ${r.out.length} OUT · ${r.checked} layers checked — fix the tree, then run it again` : `DOOR  ✓ ALL IN · ${r.checked} layers checked — show the plan`;
  return [head, ...r.out.map(([w, m]) => ` OUT  ${w.padEnd(15)}${m}`), ...r.ask.map(a => ` ASK  ${a}`)].join('\n');
}
// v6 geometry guard — compare a tree with its baseline (the tree exactly as the scripts wrote it: gold fit or spec2tree).
const GEO = ['w', 'h', 'xy', 'p', 'g'];
const geo = (o, f) => { const v = o[f]; if (v == null) return 'null'; if (f === 'p') return JSON.stringify(Array.isArray(v) ? v : [v, v, v, v]); return JSON.stringify(v); };
function keyed(T) {                                             // name-path key → node; repeated names get #n
  const m = new Map(), cnt = {}, base = {};
  (function walk(o, pre) { const k0 = pre + '/' + o.n; cnt[k0] = (cnt[k0] || 0) + 1; base[k0] = cnt[k0]; m.set(cnt[k0] > 1 ? k0 + '#' + cnt[k0] : k0, o); (o.c || []).forEach(c => walk(c, k0 + (cnt[k0] > 1 ? '#' + cnt[k0] : ''))); })(T, '');
  return { m, base };
}
function baselineDiff(T, B, allow = []) {
  const cur = keyed(T), old = keyed(B), out = [];
  const gen = new Set(); (function g(o, on) { if (o.gen) on = true; if (on) gen.add(o); (o.c || []).forEach(c => g(c, on)); })(T, false);   // nodes the SCRIPT made (a step group cloned from a state template)
  for (const [k, o] of cur.m) {
    const b = old.m.get(k); if (!b || allow.includes(o.n) || gen.has(o)) continue;
    const k0 = k.replace(/#\d+$/, '');                          // repeated siblings: only compare when the same number of them exist on both sides (an insert shifts the #n)
    if (cur.base[k0] !== old.base[k0]) continue;
    for (const f of GEO) if (geo(o, f) !== geo(b, f) && !(f === 'h' && o.gh && Number(o.h) === Number(b.h) + Number(o.gh)))   // gh = the height the SCRIPT added when a copy was cloned into a stack
      out.push(['geometry', `"${o.n}" ${f} ${geo(b, f)}→${geo(o, f)} — the numbers of a measured node are script-owned: fix sizing (s) or content instead; if a gates BOX/POSITION line names this exact node, run again with --allow "${o.n}"`]);
  }
  return out;
}
module.exports = { door, report, baselineDiff };
if (require.main === module) {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
  const i = rest.indexOf('--ref'), bi = rest.indexOf('--baseline'), ai = rest.indexOf('--allow'), raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const r = door(raw.tree || raw, file, i >= 0 ? JSON.parse(fs.readFileSync(rest[i + 1], 'utf8')) : null);
  if (bi >= 0) { const B = JSON.parse(fs.readFileSync(rest[bi + 1], 'utf8')); r.out.push(...baselineDiff(raw.tree || raw, B.tree || B, ai >= 0 ? rest[ai + 1].split(',').map(x => x.trim()) : [])); }
  console.log(report(r)); process.exit(r.out.length ? 1 : 0);
}
