// ops.js — the content-only edit language for a layout tree: set / remove / clone. NO geometry. One definition, two users:
// build/reskin.js (Node, the text lane) and the Figma Agent tools stored in the file (build/templates/v6-tools.js embeds this source).
// Pure function, no require — it must run inside Figma too.
//   applyOps(tree, ops) → { errs, counts }   mutates `tree`; when errs is not empty the caller must NOT use the tree.
// ops = { set:    [{ n, nth?, t?, pr?, tx?, st?, bg? }]                       text of a text leaf · props / inner texts of a kit instance · text style · colour variable
//         (set also takes `name`: the new layer name — use it so layers never keep the old screen's words)
//         filters:[{ from?, label, placeholder? | value? }]   the filter bar: one entry per filter you want, in order; from = the skeleton filter it is based on (default: next one)
//         cards:  [{ title, value, caption }]                   the summary cards: one entry per card (extra skeleton cards are dropped, missing ones cloned)
//         table:  { keep:[0,1,3…], header:[…], rows:[[ cell, … ], …] }   keep = the skeleton columns that stay (0-based); header/rows follow that order;
//                 cell = "text" | { t, d?, sem? }  (d = the 2nd line of a link cell · sem = Error|Warning|Success|Information|None for a status cell); rows = rows you want
//         steps:  [{ name, role, status, state?: done|current|todo, initials?, sem? }]   a timeline: one entry per approver, in order; the script picks the right marker / selected bar per state
//         remove: ["name" | { n, nth? }]                                       drop a node (a filter, a column)
//         clone:  [{ n, nth?, times, with?: [[{ n, t|pr|tx|st|bg }, …], …] }] copies of a node after it (a filter field, a table row); with[i] = the ops for copy i }
'use strict';
const FORBIDDEN = ['w', 'h', 'xy', 'p', 'g', 'd', 'a', 's', 'r', 'abs', 'c', 'k', 'cp', 'sz'];

function applyOps(T, ops) {
  const errs = [], counts = { set: 0, remove: 0, clone: 0 };
  ops = ops || {};
  const find = (root, n, nth = 1) => { const m = []; (function w(o) { if (o.n === n) m.push(o); (o.c || []).forEach(w); })(root); return m[nth - 1] || null; };
  const parentOf = (root, node) => { let f = null; (function w(o) { if ((o.c || []).includes(node)) f = o; (o.c || []).forEach(w); })(root); return f; };
  const clean = e => { const bad = Object.keys(e).filter(k => FORBIDDEN.includes(k)); if (bad.length) errs.push(`"${e.n}": ${bad.join(', ')} is geometry / structure — not allowed in ops (content only)`); return !bad.length; };
  function applySet(root, e, where) {
    if (!e || !e.n) { errs.push(`${where}: an op without n`); return; }
    if (!clean(e)) return;
    const o = find(root, e.n, e.nth);
    if (!o) { errs.push(`${where}: no layer named "${e.n}"${e.nth ? ' #' + e.nth : ''}`); return; }
    if (e.t != null) { if (o.k !== 't') errs.push(`"${e.n}" is not a text leaf — use tx / pr for a kit instance`); else o.t = String(e.t); }
    if (e.pr) { if (o.k !== 'i') errs.push(`"${e.n}" is not a kit instance — pr needs one`); else o.pr = { ...(o.pr || {}), ...e.pr }; }
    if (e.tx) { if (o.k !== 'i') errs.push(`"${e.n}" is not a kit instance — tx needs one`); else o.tx = { ...(o.tx || {}), ...e.tx }; }
    if (e.st != null) { if (o.k !== 't') errs.push(`"${e.n}": st (text style) needs a text leaf`); else o.st = e.st; }
    if (e.bg != null) o.bg = e.bg;
    if (e.name != null) o.n = String(e.name);   // rename the layer (keeps layer names true to the content)
    counts.set++;
  }
  // ── compact content ops: the model writes the CONTENT only; columns, cell counts and clones are made here, so header and rows can never disagree
  const findName = (root, re) => { let f = null; (function w(o) { if (!f && re.test(o.n || '')) f = o; (o.c || []).forEach(w); })(root); return f; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const fitCount = (parent, kids, n, what) => {                     // keep n children of `kids` in `parent` (drop from the end / clone the last)
    if (!kids.length) { errs.push(`${what}: nothing to copy`); return []; }
    let cur = kids.slice();
    while (cur.length > n) { const d = cur.pop(); reflow(d, parent, -1); parent.c.splice(parent.c.indexOf(d), 1); }
    while (cur.length < n) { const src = cur[cur.length - 1], c = clone(src); parent.c.splice(parent.c.indexOf(src) + 1, 0, c); cur.push(c); reflow(src, parent, 1); }
    cur.forEach((c, i) => { (function rn(x) { x.n = String(x.n).replace(/ \d+$/, '') + (i ? ' ' + (i + 1) : ''); (x.c || []).forEach(rn); })(c); });
    return cur;
  };
  // ── reflow: a copy added to (or a node removed from) a vertical stack changes the height of every ancestor — the SCRIPT grows them (the model never writes geometry).
  //    `gh` records the growth so the door's geometry guard accepts exactly that change and nothing else.
  const reflow = (node, parent, sign) => {
    if (!parent || parent.d !== 'V' || !(node.h > 0)) return;
    const delta = sign * (node.h + (typeof parent.g === 'number' ? parent.g : 0));
    let cur = parent;
    while (cur) { if (typeof cur.h === 'number') { cur.h = Math.max(0, cur.h + delta); cur.gh = (cur.gh || 0) + delta; } cur = parentOf(T, cur); }
  };
  const SEM = ['Error', 'Warning', 'Success', 'Information', 'None'];
  const setCell = (cell, v, where) => {
    const val = (v && typeof v === 'object') ? v : { t: v };
    if (val.t == null) { errs.push(`${where}: a cell without text`); return; }
    const inst = cell.k === 'i' ? cell : findName(cell, /^$/) || (function f(o) { let g = null; (function w(x) { if (!g && x !== cell && x.k === 'i') g = x; (x.c || []).forEach(w); })(o); return g; })(cell);
    if (!inst) { errs.push(`${where}: cell "${cell.n}" has no kit part to put text in`); return; }
    if (inst.cp === 'Object Status') {
      inst.tx = { ...(inst.tx || {}), Text: String(val.t) };
      if (val.sem != null) { if (!SEM.includes(val.sem)) { errs.push(`${where}: sem "${val.sem}" is not one of ${SEM.join('/')}`); return; } inst.pr = { ...(inst.pr || {}), Semantic: val.sem }; }
    } else if (inst.cp === 'Table Cell') {
      const pr = { ...(inst.pr || {}) };
      if ('✏️ Currency' in pr) pr['✏️ Currency'] = String(val.t); else pr['✏️ Text'] = String(val.t);
      if ('✏️ By Text Description' in pr) { if (val.d == null) { errs.push(`${where}: "${val.t}" is a link cell — it needs d (the second line)`); return; } pr['✏️ By Text Description'] = String(val.d); }
      inst.pr = pr;
    } else { errs.push(`${where}: cell part ${inst.cp} is not a table cell or status`); return; }
    if (val.sem != null && inst.cp === 'Table Cell') errs.push(`${where}: sem is for status cells only`);
    counts.set++;
  };
  if (ops.steps) {                                   // timeline: the SCRIPT clones the right look per state (done = check marker, current = pending marker + selected bar, todo = empty circle)
    const isStep = x => /^Step \d+$/.test(x.n || '');
    const stack = (function f(o) { const k = (o.c || []).filter(isStep); if (k.length >= 2 && k.some(x => findName(x, /^Selected bar$/))) return o; for (const c of o.c || []) { const r = f(c); if (r) return r; } return null; })(T);
    if (!stack) errs.push('steps: this layout has no Step groups with a current-step look');
    else {
      const kids = stack.c.filter(isStep), kind = x => findName(x, /^Selected bar$/) ? 'current' : (((findName(x, /^Marker \d+$/) || {}).c || []).length ? 'done' : 'todo');
      const tpl = {}; kids.forEach(x => { const k = kind(x); if (!tpl[k]) tpl[k] = clone(x); });
      const at = stack.c.indexOf(kids[0]), DEF = { done: 'Success', current: 'Information', todo: 'None' };
      kids.forEach(x => reflow(x, stack, -1)); stack.c = stack.c.filter(x => !kids.includes(x));
      ops.steps.forEach((st, i) => {
        const state = st.state || 'done', where = `steps[${i}]`;
        if (!tpl[state]) { errs.push(`${where}: state "${state}" is not one of ${Object.keys(tpl).join('/')}`); return; }
        if (st.name == null || st.role == null || st.status == null) { errs.push(`${where}: needs name, role and status`); return; }
        if (st.sem != null && !SEM.includes(st.sem)) { errs.push(`${where}: sem "${st.sem}" is not one of ${SEM.join('/')}`); return; }
        const c = clone(tpl[state]); c.gen = 1;   // script-made: the door's geometry guard does not compare it with the skeleton
        (function rn(x) { if (/\d+$/.test(x.n || '')) x.n = String(x.n).replace(/\d+$/, String(i + 1)); (x.c || []).forEach(rn); })(c);
        const av = findName(c, /^Avatar \d+$/), nm = findName(c, /^Approver name/), ro = findName(c, /^Approver role/), sp = findName(c, /^Step status/);
        const ini = st.initials || String(st.name).split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
        if (av) av.tx = { ...(av.tx || {}), Initials: ini }; if (nm) nm.tx = { ...(nm.tx || {}), Text: String(st.name) }; if (ro) ro.t = String(st.role);
        if (sp) { sp.tx = { ...(sp.tx || {}), Text: String(st.status) }; sp.pr = { ...(sp.pr || {}), Semantic: st.sem || DEF[state] }; }
        stack.c.splice(at + i, 0, c); reflow(c, stack, 1); counts.set++;
      });
    }
  }
  if (ops.table) {
    const t = ops.table, area = findName(T, /^Table Area$/) || T, head = findName(area, /^Header Row/), rows = (area.c || []).filter(k => /^Row/i.test(k.n || ''));
    if (!head || !rows.length) errs.push('table: this layout has no Header Row / Row layers');
    else if (!Array.isArray(t.keep) || !Array.isArray(t.header) || !Array.isArray(t.rows) || t.keep.length !== t.header.length) errs.push('table: needs keep[] and header[] of the same length, and rows[][]');
    else {
      const n = head.c.length;
      if (t.keep.some(i => !Number.isInteger(i) || i < 0 || i >= n)) errs.push(`table: keep has an index outside 0..${n - 1}`);
      else {
        const pick = r => { r.c = t.keep.map(i => r.c[i]); };
        pick(head); rows.forEach(pick);
        head.c.forEach((c, i) => { if (c.k === 'i') c.tx = { ...(c.tx || {}), Text: String(t.header[i]) }; });
        const now = fitCount(area, rows, t.rows.length, 'table rows');
        now.forEach((r, ri) => { const vals = t.rows[ri]; if (!Array.isArray(vals) || vals.length !== t.keep.length) { errs.push(`table: row ${ri + 1} needs ${t.keep.length} cells`); return; } r.c.forEach((c, ci) => setCell(c, vals[ci], `table row ${ri + 1} col ${ci + 1}`)); });
      }
    }
  }
  if (ops.filters) {
    const bar = findName(T, /^Filter Bar$/), fl = bar ? bar.c.filter(k => /^Filter /.test(k.n) && !/^Filter (spacer|Actions)/.test(k.n)) : [];
    if (!fl.length) errs.push('filters: this layout has no filter fields');
    else {
      const src = fl.map(clone), at = bar.c.indexOf(fl[0]);
      bar.c = bar.c.filter(k => !fl.includes(k));
      ops.filters.forEach((f, i) => {
        const from = f.from == null ? Math.min(i, src.length - 1) : f.from, base = src[from];
        if (!base) { errs.push(`filters: from ${from} does not exist (0..${src.length - 1})`); return; }
        const c = clone(base); bar.c.splice(at + i, 0, c);
        const lab = (c.c || []).find(x => x.k === 't'), ctl = (c.c || []).find(x => x.k === 'i');
        if (lab) lab.t = String(f.label); else errs.push(`filters: "${f.label}" has no label layer`);
        if (ctl) { if (ctl.cp === 'Input') ctl.pr = { ...(ctl.pr || {}), '✏️ Placeholder': String(f.placeholder != null ? f.placeholder : 'Search ' + String(f.label).toLowerCase()) }; else if (ctl.cp === 'Select') ctl.tx = { ...(ctl.tx || {}), 'Input Text': String(f.value != null ? f.value : 'All') }; }
        c.n = 'Filter ' + f.label;
      });
      counts.set += ops.filters.length;
    }
  }
  if (ops.cards) {
    const band = findName(T, /^Summary Cards$/), cards = band ? band.c.filter(k => /^Card /.test(k.n)) : [];
    if (!cards.length) errs.push('cards: this layout has no summary cards');
    else {
      const now = fitCount(band, cards, ops.cards.length, 'cards');
      now.forEach((c, i) => { const v = ops.cards[i], ts = (c.c || []).filter(x => x.k === 't'), num = (c.c || []).find(x => x.k === 'i');
        if (ts[0]) ts[0].t = String(v.title); if (ts.length > 1) ts[ts.length - 1].t = String(v.caption != null ? v.caption : '');
        if (num) num.tx = { ...(num.tx || {}), [Object.keys(num.tx || {})[0] || 'Text']: String(v.value) };
        c.n = 'Card ' + v.title; counts.set++; });
    }
  }
  for (const e of ops.set || []) applySet(T, e, 'set');
  for (const r of ops.remove || []) {
    const n = typeof r === 'string' ? r : r.n, o = find(T, n, r.nth), p = o && o !== T && parentOf(T, o);
    if (!p) { errs.push(`remove: no removable layer named "${n}"`); continue; }
    reflow(o, p, -1); p.c.splice(p.c.indexOf(o), 1); counts.remove++;
  }
  for (const c of ops.clone || []) {
    const o = find(T, c.n, c.nth), p = o && o !== T && parentOf(T, o), times = Number(c.times || 1);
    if (!p) { errs.push(`clone: no cloneable layer named "${c.n}"`); continue; }
    if (!(times >= 1 && times <= 40)) { errs.push(`clone "${c.n}": times must be 1-40`); continue; }
    let at = p.c.indexOf(o);
    for (let i = 1; i <= times; i++) {
      const copy = JSON.parse(JSON.stringify(o));
      for (const e of (c.with || [])[i - 1] || []) applySet(copy, e, `clone ${c.n} #${i}`);   // by the ORIGINAL names, before they are made unique
      (function rename(x) { x.n = `${x.n} ${i + 1}`; (x.c || []).forEach(rename); })(copy);
      p.c.splice(++at, 0, copy); counts.clone++; reflow(o, p, 1);
    }
  }
  return { errs, counts };
}
module.exports = { applyOps, FORBIDDEN };
