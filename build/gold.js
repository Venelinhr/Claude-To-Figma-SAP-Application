#!/usr/bin/env node
// gold.js — the GOLD FLYWHEEL: an approved screen becomes the next gold tree, so the fast path gets more common.
//   node build/gold.js <job dir> [--name <n>] [--node <figma node id>] [--ms <n>] [--rounds <n>]   promote a measured PASS
//   node build/gold.js --demote <name>                                                            move a gold tree to knowledge/gold/retired/
//   node build/gold.js --from-node <figma link>                                                   how to re-gold a screen edited in Figma
// Admission (a bad gold poisons every later match): gates.js must PASS on <job>/check (measured, never claimed) · the tree passes the
// front door with 0 OUT · layout-sim --sizes reproduces ≥ 90 % of the recorded box sizes · the target name is free (never overwrites).
// Then: tree → knowledge/gold/trees/<name>-<width>.tree.json, the reference → knowledge/gold/refs/, plan cache + run log via gates.record().
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { door } = require('./door.js');
const gates = require('./gates.js');
const ROOT = path.resolve(__dirname, '..'), GOLD = process.env.SAP_GOLD_DIR || path.join(ROOT, 'knowledge/gold'), TREES = path.join(GOLD, 'trees');   // SAP_GOLD_DIR: tests never touch the real library
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const die = (m, c = 1) => { console.log(m); process.exit(c); };

if (argv.includes('--demote')) {
  const n = opt('--demote'), hits = fs.readdirSync(TREES).filter(f => f.endsWith('.tree.json') && (f === n + '.tree.json' || f.startsWith(n + '-')));
  if (hits.length !== 1) die(hits.length ? `"${n}" matches ${hits.length} trees (${hits.join(', ')}) — give the exact name` : `no gold tree named "${n}"`);
  fs.mkdirSync(path.join(GOLD, 'retired'), { recursive: true });
  fs.renameSync(path.join(TREES, hits[0]), path.join(GOLD, 'retired', hits[0]));
  die(`DEMOTED ${hits[0]} → knowledge/gold/retired/ (front.js no longer matches it)`, 0);
}
if (argv.includes('--from-node')) {
  const id = ((opt('--from-node') || '').match(/node-id=([0-9]+[-:][0-9]+)/) || [])[1];
  die(`FROM-NODE ${id ? id.replace('-', ':') : '<node id from the link>'} — the bridge has no dump route, so a screen edited in Figma is re-golded in 3 read-only steps (do them in the screen-builder subagent, its payloads stay out of the chat):
  1. use_figma with build/templates/dump-layout.use_figma.js (ROOT = the node id) → save the returned JSON as bridge-out/<job>/tree.json
  2. use_figma with build/templates/dump-tree.use_figma.js and dump-geometry.use_figma.js → bridge-out/<job>/check/tree.json + geometry.json;  node build/tree.js rows <job>/tree.json > <job>/check/plan.json
  3. node build/gold.js bridge-out/<job> --name <name>      (the same measured admission as any other screen)`, 0);
}

const job = argv.find((a, i) => !a.startsWith('--') && !['--name', '--node', '--ms', '--rounds'].includes(argv[i - 1]));
if (!job) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(64); }
const jd = path.resolve(ROOT, job), chk = path.join(jd, 'check'), treeF = path.join(jd, 'tree.json');
if (!fs.existsSync(treeF)) die(`REFUSED no tree.json in ${job}`);
(async () => {
  const has = f => fs.existsSync(path.join(chk, f));
  const refF = has('ref.png') ? path.join(chk, 'ref.png') : null, specF = has('spec.json') ? path.join(chk, 'spec.json') : null;
  const g = await gates.measure({ plan: path.join(chk, 'plan.json'), jobDir: chk, ref: refF, spec: specF });
  if (!g) die(`REFUSED ${job}/check/plan.json is missing — run the build first (node build/run.js …)`);
  if (!g.pass) die(`REFUSED the gates do not pass (measured now): ${gates.blocksOf(g).join('; ')}`);
  const raw = JSON.parse(fs.readFileSync(treeF, 'utf8')), T = raw.tree || raw;
  const dr = door(T, treeF, specF ? JSON.parse(fs.readFileSync(specF, 'utf8')) : null);
  if (dr.out.length) die(`REFUSED the front door has ${dr.out.length} OUT: ${dr.out.slice(0, 3).map(([w, m]) => w + ': ' + m.slice(0, 90)).join(' | ')}`);
  const sz = spawnSync(process.execPath, [path.join(__dirname, 'layout-sim.js'), treeF, '--sizes'], { encoding: 'utf8' }), m = String(sz.stdout).match(/SIZES\s+(\d+)\/(\d+)/);
  if (m && +m[2] > 0 && +m[1] / +m[2] < 0.9) die(`REFUSED the simulator reproduces only ${m[1]}/${m[2]} recorded box sizes (< 90 %) — the recorded numbers are not trustworthy as a gold`);
  const name = String(opt('--name') || path.basename(jd)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.round(T.w || 0);
  const dest = path.join(TREES, name + '.tree.json');
  if (fs.existsSync(dest)) die(`REFUSED ${name}.tree.json already exists — never overwritten. Retire it first: node build/gold.js --demote ${name}`);
  fs.copyFileSync(treeF, dest);
  if (refF) { fs.mkdirSync(path.join(GOLD, 'refs'), { recursive: true }); fs.copyFileSync(refF, path.join(GOLD, 'refs', name + '.png')); }
  const rec = gates.record({ plan: path.join(chk, 'plan.json'), ref: refF, g, text: name, nodeId: opt('--node') || '?', via: 'gold.js', rounds: Number(opt('--rounds') || 0), ms: Number(opt('--ms') || 0) });
  const n = fs.readdirSync(TREES).filter(f => f.endsWith('.tree.json')).length;
  die(`GOLD ✓ ${name} → knowledge/gold/trees/ (${n} gold trees now)${refF ? ' · reference kept' : ''}${rec ? ' · recorded' : ''} · measured MATCH ${g.match}% EYE ${g.eye == null ? '—' : g.eye + '%'}`, 0);
})();
