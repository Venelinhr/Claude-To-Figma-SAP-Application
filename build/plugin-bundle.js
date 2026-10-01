#!/usr/bin/env node
// plugin-bundle.js — compile the v5 build runtime + the two dump scripts INTO plugin/sap-bridge/code.js.
//   node build/plugin-bundle.js           write the generated block (then close + reopen SAP Bridge in Figma)
//   node build/plugin-bundle.js --check   exit 1 when the block is out of date (the tests run this)
// Why: a Figma plugin cannot build code from text (new Function throws "not a function"), so the
// runtime must be real code in the plugin. The bridge then sends data only: { version, kit, tree }.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const T = f => fs.readFileSync(path.join(__dirname, 'templates', f), 'utf8');
const RUNTIME = [T('sap-kit.prelude.js'), T('render-tree.js')].join('\n');          // same text as render.js
const VER = crypto.createHash('sha1').update(RUNTIME).digest('hex').slice(0, 10);   // same version as render.js
const body = f => { const L = T(f).split('\n'); const s = L.findIndex(l => /const ROOT =/.test(l)), e = L.findIndex(l => /return out;/.test(l));
  return L.slice(s + 1, e + 1).join('\n'); };
const A = '// ── GENERATED RUNTIME (node build/plugin-bundle.js) — do not edit by hand ──\n';
const Z = '// ── end GENERATED RUNTIME ──\n';
// figma.createAutoLayout exists in the use_figma tool but not in the plugin API → a plain frame with auto layout.
const SHIM = `function _createAutoLayout(dir, o) {
  if (typeof figma.createAutoLayout === 'function') return figma.createAutoLayout(dir, o);
  const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.fills = []; f.clipsContent = false; if (o && o.name) f.name = o.name; if (o && o.itemSpacing != null) f.itemSpacing = o.itemSpacing;
  return f;
}`;
const RT = RUNTIME.split('figma.createAutoLayout(').join('_createAutoLayout(');
const block = A + `const RUNTIME_VER = '${VER}';
${SHIM}
async function RUN_TREE(KIT, TREE) {
${RT}
return await BUILD_TREE(TREE);
}
async function DUMP_GEOM(ROOT) {
${body('dump-geometry.use_figma.js')}
}
async function DUMP_TREE(ROOT) {
${body('dump-tree.use_figma.js')}
}
` + Z;
const F = path.join(ROOT, 'plugin', 'sap-bridge', 'code.js');
const fileCode = fs.readFileSync(F, 'utf8');
let code = fileCode;

const a = code.indexOf(A), z = code.indexOf(Z);
if (a < 0 || z < a) { console.error(`markers not found in ${F}`); process.exit(2); }
const next = code.slice(0, a) + block + code.slice(z + Z.length);
if (process.argv.includes('--check')) {
  if (next !== fileCode) { console.error(`plugin runtime out of date — run: node build/plugin-bundle.js (runtime ${VER})`); process.exit(1); }
  console.log(`plugin runtime up to date (${VER})`); process.exit(0);
}
fs.writeFileSync(F, next);
console.log(`plugin/sap-bridge/code.js: runtime ${VER} (${block.length} chars) — close and reopen SAP Bridge in Figma`);
