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
const { applyOps } = require('./ops.js');   // one definition, shared with the Figma Agent tools stored in the file
const { errs, counts } = applyOps(T, ops);
if (errs.length) { console.log(`RESKIN ✗ ${errs.length} problem(s), nothing written\n` + errs.map(e => '  ' + e).join('\n')); process.exit(1); }
fs.writeFileSync(outF, JSON.stringify(raw.tree ? { ...raw, tree: T } : T));
console.log(`RESKIN ✓ ${counts.set} set · ${counts.remove} removed · ${counts.clone} cloned → ${outF}`);
