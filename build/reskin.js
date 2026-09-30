#!/usr/bin/env node
// reskin.js — the TEXT LANE: put real business content on a gold skeleton with a tiny op list. Geometry is not in the language.
//   node build/reskin.js <tree.json> <ops.json> [--out <tree.json>]
// ops = { set:    [{ n, nth?, t?, pr?, tx?, st?, bg? }]                       text of a text leaf · props / inner texts of a kit instance · text style · colour variable
//         remove: ["name" | { n, nth? }]                                       drop a node (a filter, a column)
//         clone:  [{ n, nth?, times, with?: [[{ n, t|pr|tx|st|bg }, …], …] }] copies of a node after it (a filter field, a table row); with[i] = the ops for copy i }
// n = the layer name in the tree (run.js prints them). w h xy p g d a s r abs are refused: the model may not write geometry,
// which is exactly the channel a headless rebuild from prose used to score EYE 9-13 %. Copies get unique layer names ("Row 2", "Row 3"…).
const fs = require('fs');
const [treeF, opsF, ...rest] = process.argv.slice(2);
if (!opsF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(2); }
const oi = rest.indexOf('--out'), outF = oi >= 0 ? rest[oi + 1] : treeF;
const raw = JSON.parse(fs.readFileSync(treeF, 'utf8')), T = raw.tree || raw, ops = JSON.parse(fs.readFileSync(opsF, 'utf8'));
const FORBIDDEN = ['w', 'h', 'xy', 'p', 'g', 'd', 'a', 's', 'r', 'abs', 'c', 'k', 'cp', 'sz'];
const errs = [], counts = { set: 0, remove: 0, clone: 0 };
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
if (errs.length) { console.log(`RESKIN ✗ ${errs.length} problem(s), nothing written\n` + errs.map(e => '  ' + e).join('\n')); process.exit(1); }
fs.writeFileSync(outF, JSON.stringify(raw.tree ? { ...raw, tree: T } : T));
console.log(`RESKIN ✓ ${counts.set} set · ${counts.remove} removed · ${counts.clone} cloned → ${outF}`);
