#!/usr/bin/env node
/**
 * expand-tree-dump.js — turn a COMPACT use_figma tree dump into the node shape verify-invariants.js reads.
 *
 * Why: a full-shape dump of a 1440px List Report is ~90 KB of JSON that has to travel through the
 * agent's context twice (tool result → Write). The compact form is one array per node:
 *   [id, name, type, visible, layoutMode, childCount, mainComponentKey, fontFamily, fontSize,
 *    width, absX, absY, absW, absH, layoutSizingHorizontal, clipsContent, parentId, fills, strokes]
 * where fills/strokes are "hex|boundVariableId;hex|bound;…" (empty string = none), and nodes INSIDE
 * kit instances are omitted (the instance itself is the leaf) — they are kit internals, not build output.
 *
 * Usage: node build/expand-tree-dump.js <compact.json> <out-tree.json> [--based-on <canonical-id>]
 *   compact.json = a flat array of rows, or an array of {from, rows} slices from several use_figma calls.
 */
const fs = require('fs');
const argv = process.argv.slice(2);
const bi = argv.indexOf('--based-on'); const basedOn = bi >= 0 ? argv[bi + 1] : null; if (bi >= 0) argv.splice(bi, 2);
const [inp, out] = argv;
if (!inp || !out) { console.error('usage: node build/expand-tree-dump.js <compact.json> <out-tree.json> [--based-on <canonical-id>]'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(inp, 'utf8'));
// accept either a flat array of rows, or an array of slice objects {from, rows} (multi-call dumps)
const rows = Array.isArray(raw) && raw.length && !Array.isArray(raw[0]) && raw[0].rows ? raw.slice().sort((a, b) => a.from - b.from).flatMap(s => s.rows) : raw;
const paints = (s) => !s ? [] : s.split(';').filter(Boolean).map(p => { const [hex, bound] = p.split('|'); return { type: 'SOLID', hex: hex || null, boundVariable: bound || null, overridden: false }; });
const nodes = rows.map(r => ({
  id: r[0], name: r[1], type: r[2], visible: r[3], layoutMode: r[4] || null, childCount: r[5],
  mainComponentKey: r[6] || null, fontFamily: r[7] || null, fontSize: r[8] || null,
  width: r[9], absoluteBoundingBox: { x: r[10], y: r[11], width: r[12], height: r[13] },
  layoutSizingHorizontal: r[14] || null, clipsContent: !!r[15], parentId: r[16] || null,
  overriddenFills: false, overriddenStrokes: false, fills: paints(r[17]), strokes: paints(r[18])
}));
// INV 4 provenance: the builder (which controls this dump) states which canonical the root was cloned from
if (basedOn && nodes.length) nodes[0].basedOnCanonical = basedOn;
fs.writeFileSync(out, JSON.stringify(nodes));
console.log(`expanded ${nodes.length} nodes → ${out}`);
