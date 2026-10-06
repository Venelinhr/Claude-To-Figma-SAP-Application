#!/usr/bin/env node
// plugin-v2/sync-make-engine.js — copies the Make → Figma engine from the Claude project (the source of truth) into a plugin's code.js:
//   · the converter block (make-convert.js + make-map.json + icons-extra.json + slim kit + full packed kit)   between the GENERATED MAKE CONVERTER markers
//   · the Make-only runtime parts (kit Segmented Button, faded glyphs, no-wrap text) inside the engine's BUILD runtime  (idempotent patches)
//   node plugin-v2/sync-make-engine.js [path/to/code.js] [--check]   default: plugin-v2/code.js   (also works on the standalone "Make → Figma" plugin; --check only compares, exit 1 = out of date)
// Source folder: $SAP_APP (default ~/Downloads/Claude-To-Figma-SAP-Application). Afterwards: close and reopen the plugin in Figma.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const APP = process.env.SAP_APP || path.join(require('os').homedir(), 'Downloads', 'Claude-To-Figma-SAP-Application');
const CHECK = process.argv.includes('--check'), F = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(__dirname, 'code.js');
const kitJson = require(path.join(APP, 'knowledge/live/kit.json')), extra = require(path.join(APP, 'knowledge/live/icons-extra.json')).icons || {};
const map = require(path.join(APP, 'build/make-map.json'));
const slim = {
  vars: Object.fromEntries(Object.keys(kitJson.vars).map(k => [k, 1])),
  text: Object.fromEntries(Object.entries(kitJson.text).map(([k, v]) => [k, '||' + String(v).split('|')[2]])),
  icons: Object.fromEntries(Object.keys(kitJson.icons).map(k => [k, 1])),
  components: Object.fromEntries(Object.entries(kitJson.components).map(([k, c]) => [k, { w: c.w, h: c.h, props: c.props }])),
  effects: kitJson.effects,
};
const fullKit = execFileSync(process.execPath, [path.join(APP, 'build/kit.js'), 'pack', '--all'], { cwd: APP, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString().trim().replace(/^const KIT = /, '').replace(/;\s*$/, '');
const convSrc = fs.readFileSync(path.join(APP, 'build/make-convert.js'), 'utf8').split('\n').filter(l => !/^if \(typeof module/.test(l)).join('\n');
const A2 = '// ── GENERATED MAKE CONVERTER (node build/plugin-bundle.js) — do not edit by hand ──\n', Z2 = '// ── end GENERATED MAKE CONVERTER ──\n';
const block2 = A2 + `const MAKE_CONVERT = (function () {\n${convSrc}\nreturn convert;\n})();\nconst MAKE_MAP = ${JSON.stringify(map)};\nconst MAKE_EXTRA = ${JSON.stringify(extra)};\nconst MAKE_KIT = ${JSON.stringify(slim)};\nconst FULL_KIT = ${fullKit};\n` + Z2;
let code = fs.readFileSync(F, 'utf8');
const a = code.indexOf(A2), z = code.indexOf(Z2);
if (a < 0 || z < a) throw new Error('GENERATED MAKE CONVERTER markers not found in ' + F);
code = code.slice(0, a) + block2 + code.slice(z + Z2.length);
// runtime parts: the same text the Claude project's templates/render-tree.js carries (idempotent)
const rt = fs.readFileSync(path.join(APP, 'build/templates/render-tree.js'), 'utf8'), RL = rt.split('\n');
const segFn = rt.slice(rt.indexOf('async function _seg('), rt.indexOf('async function NODE('));
const hi = RL.findIndex(l => l.includes('for (const nm of (o.hide || []))'));
const extraLines = RL.slice(hi + 1, RL.findIndex((l, i) => i > hi && /if \(o\.dd\) await _dd/.test(l)) + 1).join('\n');   // fade, fit, seg, dd
if (!segFn.startsWith('async function _seg(') || !/_dd\(n, o\.dd/.test(extraLines)) throw new Error('runtime parts not found in templates/render-tree.js');
let runs = 0;
const MK = code.indexOf('// <<MAKESA>>'), head = MK >= 0 ? code.slice(0, MK) : '', body = MK >= 0 ? code.slice(MK) : code;
let b2 = body;
{ const s0 = b2.indexOf('async function _seg('), n0 = b2.indexOf('async function NODE(o, parent, par) {');       // drop an older copy of the parts, then insert the current ones
  if (s0 >= 0 && n0 > s0) b2 = b2.slice(0, s0) + b2.slice(n0);
  b2 = b2.split('\n').filter(l => !/for \(const nm of \(o\.(fade|fit) \|\| \[\]\)\)|if \(o\.seg\) await _seg|if \(o\.dd\) await _dd/.test(l)).join('\n'); }
{ const i = b2.indexOf('async function NODE(o, parent, par) {'); if (i < 0) throw new Error('NODE() not found in the engine'); b2 = b2.slice(0, i) + segFn + b2.slice(i); runs++; }
{ const h = b2.indexOf(RL[hi].trim()); if (h < 0) throw new Error('hide line not found'); const e = b2.indexOf('\n', h); b2 = b2.slice(0, e + 1) + extraLines + '\n' + b2.slice(e + 1); runs++; }
if (CHECK) {                                                        // drift guard: exit 1 when the plugin's engine is not what the source would produce
  const same = fs.readFileSync(F, 'utf8') === head + b2;
  console.log(same ? 'engine up to date: ' + F : 'engine OUT OF DATE: ' + F + ' — run: node plugin-v2/sync-make-engine.js'); process.exit(same ? 0 : 1);
}
fs.writeFileSync(F, head + b2);
console.log('synced ' + F + ' — converter block ' + block2.length + ' chars, runtime parts patched: ' + runs);
