#!/usr/bin/env node
// make2tree.js — a Figma Make (SAPUI5) app, as probed live (build/templates/make-probe.browser.js) → a v5 layout tree.
// Thin CLI over build/make-convert.js (the same converter is compiled into the SAP Bridge plugin).
//   node build/make2tree.js <make-dump.json> <out tree.json> [--name "Screen name"]
// Also writes <out dir>/images.json: [{element, src}] for the logo frames and post.json {nav, shell}.
'use strict';
const fs = require('fs'), path = require('path');
const { convert } = require('./make-convert.js');
const [dumpF, outF, ...rest] = process.argv.slice(2);
if (!outF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
const D = JSON.parse(fs.readFileSync(dumpF, 'utf8'));
const nameArg = rest.includes('--name') ? rest[rest.indexOf('--name') + 1] : null;
const r = convert(D, require('../knowledge/live/kit.json'), require('./make-map.json'), require('../knowledge/live/icons-extra.json').icons || {}, nameArg);
const clean = JSON.stringify(r.tree, null, 1), dir = path.dirname(path.resolve(outF));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(outF, clean);
fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(r.post));
fs.writeFileSync(path.join(dir, 'images.json'), JSON.stringify(r.images, null, 1));
console.log(`make2tree: ${r.controls} controls → ${clean.split('"n"').length - 1} nodes · ${r.images.length} images → ${outF}`);
if (r.warn.length) console.log('WARN\n  ' + r.warn.join('\n  '));
