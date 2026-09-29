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
// ── second block: the Make converter, its tables and the FULL packed KIT — the plugin converts a pasted Make dump on its own ──
const kitJson = require('../knowledge/live/kit.json'), extraJson = require('../knowledge/live/icons-extra.json').icons || {};
const slim = {                                            // only what convert() reads from kit.json
  vars: Object.fromEntries(Object.keys(kitJson.vars).map(k => [k, 1])),
  text: Object.fromEntries(Object.entries(kitJson.text).map(([k, v]) => [k, '||' + String(v).split('|')[2]])),
  icons: Object.fromEntries(Object.keys(kitJson.icons).map(k => [k, 1])),
  components: Object.fromEntries(Object.entries(kitJson.components).map(([k, c]) => [k, { w: c.w, h: c.h }])),
  effects: kitJson.effects,
};
const fullKit = require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--all'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().replace(/^const KIT = /, '').replace(/;\s*$/, '');
const convSrc = fs.readFileSync(path.join(__dirname, 'make-convert.js'), 'utf8').split('\n').filter(l => !/^if \(typeof module/.test(l)).join('\n');
const A2 = '// ── GENERATED MAKE CONVERTER (node build/plugin-bundle.js) — do not edit by hand ──\n';
const Z2 = '// ── end GENERATED MAKE CONVERTER ──\n';
const block2 = A2 + `const MAKE_CONVERT = (function () {
${convSrc}
return convert;
})();
const MAKE_MAP = ${JSON.stringify(require('./make-map.json'))};
const MAKE_EXTRA = ${JSON.stringify(extraJson)};
const MAKE_KIT = ${JSON.stringify(slim)};
const FULL_KIT = ${fullKit};
` + Z2;
const F = path.join(ROOT, 'plugin', 'sap-bridge', 'code.js');
const fileCode = fs.readFileSync(F, 'utf8');
let code = fileCode;
if (code.indexOf(A2) < 0) { const zz = code.indexOf(Z); code = code.slice(0, zz + Z.length) + block2 + code.slice(zz + Z.length); }   // first run: insert after the runtime block
{ const a2 = code.indexOf(A2), z2 = code.indexOf(Z2); code = code.slice(0, a2) + block2 + code.slice(z2 + Z2.length); }

const a = code.indexOf(A), z = code.indexOf(Z);
if (a < 0 || z < a) { console.error(`markers not found in ${F}`); process.exit(2); }
const next = code.slice(0, a) + block + code.slice(z + Z.length);
if (process.argv.includes('--check')) {
  if (next !== fileCode) { console.error(`plugin runtime out of date — run: node build/plugin-bundle.js (runtime ${VER})`); process.exit(1); }
  console.log(`plugin runtime up to date (${VER})`); process.exit(0);
}
fs.writeFileSync(F, next);
console.log(`plugin/sap-bridge/code.js: runtime ${VER} + Make converter compiled in (${block.length + block2.length} chars) — close and reopen SAP Bridge in Figma`);
