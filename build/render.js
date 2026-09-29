#!/usr/bin/env node
// render.js — a v5 layout tree (or an element plan) → ONE ready use_figma call. No hand-written build code.
//   node build/render.js <tree.json|plan.json> [--out build.js]   self-contained call (runtime + KIT + data)
//   node build/render.js --install [--out install.js]            once per Figma file: store the runtime in the file
//   node build/render.js <tree.json|plan.json> --lean [--out b.js] KIT + data only (~12k chars less); needs --install
// The call returns { nodeId, name, made|rows, WARN } — WARN must be empty — or 'INSTALL FIRST' (lean, runtime missing/old).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const out = flag('--out') ? argv[argv.indexOf('--out') + 1] : null;
const planF = argv.find(a => !a.startsWith('--') && a !== out);
const T = p => fs.readFileSync(path.join(__dirname, 'templates', p), 'utf8');
const RUNTIME = [T('sap-kit.prelude.js'), T('render-tree.js')].join('\n');   // trees only: rows alone never reached 95 %
const VER = crypto.createHash('sha1').update(RUNTIME).digest('hex').slice(0, 10);
const emit = code => {
  if (code.length > 50000) { console.error(`too big for one call: ${code.length} chars (max 50000) — use --lean or split the tree`); process.exit(1); }
  if (out) { fs.writeFileSync(out, code); console.log(`${out}: ${code.length} chars`); } else process.stdout.write(code);
  process.exit(0);
};
if (flag('--install')) emit(`figma.root.setSharedPluginData('sapfiori', 'v5rt', ${JSON.stringify(RUNTIME)});
figma.root.setSharedPluginData('sapfiori', 'v5rt_ver', '${VER}');
return { installed: '${VER}', chars: ${RUNTIME.length} };`);
if (!planF) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
const plan = JSON.parse(fs.readFileSync(planF, 'utf8'));
const kit = execFileSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--plan', planF], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const tree = plan.tree || (plan.c && plan.n ? plan : null);
let data, call;
if (tree) { data = `const TREE = ${JSON.stringify(tree)};`; call = 'return await BUILD_TREE(TREE);'; }
else {
  const keep = (o, ks) => Object.fromEntries(ks.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
  const P = {
    name: plan.name,
    frame: keep(plan.frame || {}, ['w', 'h', 'floorplan', 'name']),
    sections: (plan.sections || []).map(s => keep(s, ['id', 'name', 'box', 'layout'])),
    rows: plan.rows.filter(r => !r.ask).map(r => keep(r, ['section', 'group', 'element', 'kind', 'text', 'style', 'role', 'token',
      'component', 'props', 'icon', 'crop', 'border_role', 'fill_role', 'selected'])),
  };
  for (const s of P.sections) if (s.layout) s.layout = s.layout.slice(0, 12);   // the renderer only reads "row…"
  const R = require('./router-table.json').colour_roles;
  const ROLE = Object.fromEntries(Object.entries(R).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v[0]]));
  data = `const PLAN = ${JSON.stringify(P)};\nconst ROLE = ${JSON.stringify(ROLE)};`; call = 'return await BUILD(PLAN);';
}
// --json: the payload for the SAP Bridge plugin (no model typing): { version, runtime, kit, tree }.
//   The plugin runs  AsyncFunction('KIT','TREE', runtime + '\nreturn await BUILD_TREE(TREE);')(kit, tree).
if (flag('--json')) {
  if (!tree) { console.error('--json works with a layout tree only'); process.exit(1); }
  const j = JSON.stringify({ version: VER, runtime: RUNTIME, kit: JSON.parse(kit.replace(/^const KIT = /, '').replace(/;\s*$/, '')), tree });
  if (out) { fs.writeFileSync(out, j); console.log(`${out}: ${j.length} chars (plugin payload, ${VER})`); } else process.stdout.write(j);
  process.exit(0);
}
if (flag('--lean') && !tree) { console.error('--lean works with a layout tree only'); process.exit(1); }
// --lean: the model types this. Send the tree in the compact wire format (repeated SAP names in one dictionary,
// default keys dropped, a checksum of the plain tree) — the stored runtime decodes it and verifies the checksum.
if (flag('--lean')) emit(`const rt = figma.root.getSharedPluginData('sapfiori', 'v5rt');
if (!rt || figma.root.getSharedPluginData('sapfiori', 'v5rt_ver') !== '${VER}') return 'INSTALL FIRST';
${kit}
const TREE = ${JSON.stringify(require('./tree-codec.js').encode(tree))};
return await new (Object.getPrototypeOf(async () => {}).constructor)('KIT', 'TREE', rt + '\\nreturn await BUILD_TREE(TREE);')(KIT, TREE);`);
emit([T('sap-kit.prelude.js'), kit, data, tree ? T('render-tree.js') : T('render-plan.js'), call].join('\n'));
