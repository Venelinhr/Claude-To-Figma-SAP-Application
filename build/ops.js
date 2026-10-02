// ops.js — the content-only edit language for a layout tree: set / remove / clone. NO geometry. One definition, two users:
// build/reskin.js (Node, the text lane) and the Figma Agent tools stored in the file (build/templates/v6-tools.js embeds this source).
// Pure function, no require — it must run inside Figma too.
//   applyOps(tree, ops) → { errs, counts }   mutates `tree`; when errs is not empty the caller must NOT use the tree.
// ops = { set:    [{ n, nth?, t?, pr?, tx?, st?, bg? }]                       text of a text leaf · props / inner texts of a kit instance · text style · colour variable
//         (set also takes `name`: the new layer name — use it so layers never keep the old screen's words)
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
  for (const e of ops.set || []) applySet(T, e, 'set');
  for (const r of ops.remove || []) {
    const n = typeof r === 'string' ? r : r.n, o = find(T, n, r.nth), p = o && o !== T && parentOf(T, o);
    if (!p) { errs.push(`remove: no removable layer named "${n}"`); continue; }
    p.c.splice(p.c.indexOf(o), 1); counts.remove++;
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
      p.c.splice(++at, 0, copy); counts.clone++;
    }
  }
  return { errs, counts };
}
module.exports = { applyOps, FORBIDDEN };
