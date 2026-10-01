#!/usr/bin/env node
// run.js — v6 ONE-COMMAND DRIVER: request → every offline gate → build in Figma → gates → one short report.
//   node build/run.js <ref.png | "text request"> --file <figma file key> [--job bridge-out/<job>] [--ask] [--dry]
//   node build/run.js --job bridge-out/<job> --file <key> --resume [--icons "WxH=name,…"] [--colors "#hex=token"]
//                     [--spec-json ops.json] [--allow "name,name"] [--go] [--as-is] [--gold-min 0.95] [--allow-structure]
// BUILD FIRST, REVIEW AFTER: nothing waits for a human between the request and the built DRAFT. The screen is judged at its node
// link (plus the ASSUMED ledger, each line with its flip command); `--ask` restores the old stop before the build.
// At t=0, in parallel: bridge + plugin check ‖ front.js (see.py OCR + gold match + door). Then, sequentially, before any Figma call:
//   door (+ --baseline geometry guard on resume) → layout-sim (position, overflow, ×0.85 ×1.15) → STRUCT-SIM (advisory) → send.js.
// Exit: 0 built and PASS (with --dry: ready to build) · 1 door / sim OUT (fix tree.json, --resume) · 2 the model must decide
//   (icons to name · text content · see.py failed) · 3 bridge down · 4 an ask that would change the screen (user answers, then --go)
//   · 5 --ask stop (plan printed) · 6 built but NOT PASSED (a DRAFT) or the 2-fix-round cap · 64 usage.
// Geometry (w h xy p g) of measured nodes is script-owned: door.js --baseline rejects a model edit of it.
'use strict';
const fs = require('fs'), path = require('path'), { spawn, spawnSync } = require('child_process');
const { door, baselineDiff } = require('./door.js');
const structure = require('./structure.js');

const PROJ = path.resolve(__dirname, '..');
const PORT = Number(process.env.SAP_BRIDGE_PORT || 41778);
const NODE = process.execPath;
const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const VALUE = ['--file', '--job', '--icons', '--colors', '--spec-json', '--allow', '--timeout', '--gold-min'];
const input = argv.find((a, i) => !a.startsWith('--') && !VALUE.includes(argv[i - 1]));

// An ASK from the measured reference is a question about the SCREEN only when the answer changes what is built (floorplan,
// device, screen type). Everything else gets the documented SAP default and appears in the ASSUMED ledger.
const SCREEN_CHANGING = /mobile|tablet|floorplan|odd shape|breakpoint|screen type|which screen|wizard|dialog or|different screen/i;
function classifyAsk(a) {
  if (SCREEN_CHANGING.test(a)) return { blocking: true, default: null };
  if (/brand colour/.test(a)) return { blocking: false, default: 'SAP colour role by usage: CTA → Button Primary · selected / link → sapContent_Selected_ForegroundColor · price / warning → sapField_WarningColor' };
  if (/icon shape|icons?, the tree/.test(a)) return { blocking: false, default: 'logos or kit-internal icons stay as the tree has them; named icons come from the meaning table' };
  if (/density/.test(a)) return { blocking: false, default: 'SAP Compact, texts step down ×0.85' };
  return { blocking: false, default: 'the SAP default for that role (change it with /screen tweak)' };
}
module.exports = { classifyAsk, SCREEN_CHANGING };
if (require.main !== module) return;

const say = l => console.log(l);                  // the whole chat output — kept short on purpose
const short = (s, n = 150) => String(s).replace(/\s+/g, ' ').slice(0, n);
const runNode = args => new Promise(res => {
  let o = ''; const p = spawn(NODE, args, { cwd: PROJ });
  p.stdout.on('data', d => { o += d; }); p.stderr.on('data', d => { o += d; });
  p.on('close', code => res({ code, out: o }));
});
const nodeSync = (args, opts) => spawnSync(NODE, args, { cwd: PROJ, encoding: 'utf8', maxBuffer: 64 << 20, ...(opts || {}) });
const readJ = f => JSON.parse(fs.readFileSync(f, 'utf8'));

async function health() {
  try { const r = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(2500) }); const j = await r.json(); return j && j.app === 'sap-v4-bridge' ? j : null; } catch (_) { return null; }
}
// bridge + plugin, at t=0. `ensure` starts the bridge when it is down (mailbox.js itself never rebinds a foreign port).
async function warm(fileKey) {
  let h = await health();
  if (!h && !process.env.SAP_RUN_NO_ENSURE) { nodeSync(['build/mailbox.js', 'ensure'], { timeout: 15000 }); h = await health(); }
  if (!h) return { up: false };
  return { up: true, plugin: !!(h.figma && fileKey && h.figma.fileKey === fileKey && h.figma.lastSeenSec < 15) };
}

function cropLogos(job, ref, spec) {                // the convention the proven jobs used: JOB/logo1.png … in reading order
  const imgs = []; (function w(x) { if (x.type === 'image' && (x.crop || x.box)) imgs.push(x.crop || x.box); (x.children || []).forEach(w); })({ children: spec.sections });
  if (!imgs.length || fs.existsSync(path.join(job, 'logo1.png'))) return imgs.length;
  const py = 'import cv2,sys,json\nim=cv2.imread(sys.argv[1]);fw=float(sys.argv[2]);f=im.shape[1]/fw\nfor i,b in enumerate(json.loads(sys.argv[4]),1):\n x,y,w,h=[int(round(v*f)) for v in b]\n cv2.imwrite(sys.argv[3]+"/logo%d.png"%i,im[y:y+h,x:x+w])\n';
  spawnSync('python3', ['-c', py, ref, String(spec.frame.w), job, JSON.stringify(imgs)], { cwd: PROJ });
  return imgs.length;
}

// unnamed icons, one entry per SIZE (--icons takes one name per WxH): "17x19 ×8 first at 871,169 #726e73 · …"
function groupIcons(raw) {
  const g = new Map();
  for (const m of String(raw).matchAll(/(\d+x\d+) at (\d+,\d+) (#[0-9a-fA-F]+)/g)) { const e = g.get(m[1]) || { n: 0, at: m[2], c: m[3] }; e.n++; g.set(m[1], e); }
  return `${g.size} sizes — ` + [...g].map(([k, e]) => `${k} ×${e.n} at ${e.at} ${e.c}`).join(' · ') + ' (sizes 1 px apart, e.g. 17x18 / 17x19, are the same icon — name every size anyway)';
}

function names(T) {                                  // what the model may address in a text-lane ops file: sections and their text leaves
  const lines = [];
  for (const s of T.c || []) {
    const leaves = []; (function w(o) { if (o.k === 't') leaves.push(`${o.n}="${short(o.t, 22)}"`); else if (o.k === 'i') for (const [k, v] of Object.entries(o.tx || {})) leaves.push(`${o.n}.${k}="${short(v, 18)}"`); (o.c || []).forEach(w); })(s);
    lines.push(`  ${s.n}: ${leaves.slice(0, 7).join(' | ')}${leaves.length > 7 ? ` … +${leaves.length - 7}` : ''}`);
  }
  return lines.slice(0, 14);
}

(async () => {
  const t0 = Date.now();
  const resume = flag('--resume') || (!input && !!opt('--job'));
  const fileKey = opt('--file', '');
  if (!input && !resume) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 18).join('\n')); process.exit(64); }
  if (!flag('--dry') && !flag('--ask') && !/^[A-Za-z0-9]{1,128}$/.test(fileKey)) { console.log('usage: --file <figma file key> is required (or use --dry)'); process.exit(64); }
  const job = path.relative(PROJ, path.resolve(PROJ, opt('--job') || path.join('bridge-out', 'job-' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, ''))));
  const J = f => path.join(PROJ, job, f), treeF = J('tree.json'), stF = J('run.json');
  fs.mkdirSync(path.join(PROJ, job), { recursive: true });
  const st = fs.existsSync(stF) ? readJ(stF) : { started: t0, builds: 0, allowRound3: false };
  const elapsed = () => Math.round((Date.now() - st.started) / 1000);
  const save = () => fs.writeFileSync(stF, JSON.stringify(st));
  if (flag('--allow-round3')) st.allowRound3 = true;

  // ── 0. t=0: bridge/plugin warm-up and the analysis run in parallel
  const warmP = flag('--dry') || flag('--ask') ? Promise.resolve({ up: null }) : warm(fileKey);
  let spec = null, isImg = false, front = null;
  if (!resume) {
    isImg = /\.(png|jpe?g|webp)$/i.test(input) && fs.existsSync(input);
    if (isImg) try { fs.copyFileSync(input, J('ref.png')); } catch (_) {}
    const fr = await runNode(['build/front.js', input, '--job', job]);
    const w0 = await warmP;
    say(`RUN v6 · ${job} · ${isImg ? 'image' : 'text'}${fileKey ? ' · file ' + fileKey : ''}`);
    if (w0.up === false) say('BRIDGE down — analysis goes on; the build needs it (node build/mailbox.js ensure)');
    else if (w0.up && !w0.plugin) say('BRIDGE up · open SAP Bridge in the file now — analysis goes on, the job queues');
    else if (w0.up) say('BRIDGE up · plugin open');
    if (fr.code === 2 || !fs.existsSync(J('front.json'))) { say('STOP  the analysis failed: ' + short(fr.out.trim().split('\n').slice(-3).join(' | '), 300)); say('NEXT  describe the screen in words instead (text lane), or fix the image path'); process.exit(2); }
    front = readJ(J('front.json'));
    if (isImg && fs.existsSync(J('see-ref/spec.json'))) spec = readJ(J('see-ref/spec.json'));
    st.started = t0; st.input = input; st.kind = isImg ? 'image' : 'text'; st.builds = 0; save();
    const goldMin = Number(opt('--gold-min', 0.95)), covered = front.gold.hit / Math.max(1, front.want);
    // A gold tree that places all the texts can still have another STRUCTURE (card heights, nesting): the first live run (job-09300515) scored
    // EYE 19 % / STRUCTURE 17 that way. So the gold is kept only when its simulated boxes contain every measured reference box (STRUCT-SIM, 0 BOX).
    let boxMiss = [];
    if (isImg && spec && covered >= goldMin) {
      const gf = J('sim.gold.geometry.json'); nodeSync(['build/layout-sim.js', treeF, '--geometry-out', gf]);
      try { boxMiss = structure.check(readJ(gf), spec).filter(l => /^BOX/.test(l)); } catch (_) {}
    }
    const goldOk = covered >= goldMin && !boxMiss.length;
    say(`ANALYZE ${front.want} ${isImg ? 'texts' : 'request words'}${front.frame ? ` · ${front.frame.w}×${front.frame.h}` : ''} · ${(front.ms / 1000).toFixed(1)} s`);
    say(`GOLD ${front.gold.name} places ${front.gold.hit}/${front.want}${isImg ? (goldOk ? ' → adapted' : covered < goldMin ? ` → below ${Math.round(100 * goldMin)} %, building FROM ZERO from the measured spec` : ` → but ${boxMiss.length} reference boxes are missing in its structure (${short(boxMiss[0].replace(/^BOX\s+the reference has a box /, '').replace(/; the build has none there.*/, ''), 40)}…) → building FROM ZERO`) : ''}${front.fit.length && goldOk ? ' · ' + short(front.fit[0], 70) : ''}`);
    if (isImg && !goldOk) {
      const a = ['build/spec2tree.js', J('see-ref/spec.json'), treeF]; if (opt('--icons')) a.push('--icons', opt('--icons')); if (opt('--colors')) a.push('--colors', opt('--colors'));
      const z = nodeSync(a), unknown = (String(z.stdout).match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/) || [])[1];
      front.gold.full = false; fs.writeFileSync(J('front.json'), JSON.stringify(front, null, 1));
      fs.copyFileSync(treeF, J('tree.baseline.json'));
      if (unknown) { say('NEED  name these icons (real kit icons: node build/kit.js i <word>; a shape that is text the OCR missed → text:<string>:<style>, e.g. 53x8=text:Багаж:H5/Bold): ' + groupIcons(unknown)); say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --icons "WxH=name,…"   `); process.exit(2); }
    } else fs.copyFileSync(treeF, J('tree.baseline.json'));
    if (!isImg && !flag('--as-is')) {                  // text lane: the skeleton carries another screen's content — the model puts the real content on it
      say(`NEED  real content for the skeleton "${front.gold.name}" (${front.gold.hit}/${front.want} request words match). Write ops.json: {set:[{n,t|pr|tx}],remove:[n],clone:[{n,times,with:[[{n,t}]]}]} — no geometry`);
      names(readJ(treeF)).forEach(say);
      say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --spec-json <ops.json>   (or --as-is when the skeleton already is the screen)`);
      process.exit(2);
    }
  } else {
    if (!fs.existsSync(treeF)) { console.log(`no tree.json in ${job}`); process.exit(64); }
    isImg = st.kind === 'image'; front = fs.existsSync(J('front.json')) ? readJ(J('front.json')) : null;
    const w0 = await warmP;
    say(`RUN v6 · ${job} · resume · ${elapsed()} s since the request${fileKey ? ' · file ' + fileKey : ''}`);
    if (w0.up === false) say('BRIDGE down — the build needs it (node build/mailbox.js ensure)');
    else if (w0.up && !w0.plugin) say('BRIDGE up · open SAP Bridge in the file now — the job queues');
  }
  if (fs.existsSync(J('see-ref/spec.json')) && !spec) spec = readJ(J('see-ref/spec.json'));
  if (resume && spec && (opt('--icons') || opt('--colors'))) {   // the model named the icons / colour roles: the from-zero tree is written again with them
    const a = ['build/spec2tree.js', J('see-ref/spec.json'), treeF]; if (opt('--icons')) a.push('--icons', opt('--icons')); if (opt('--colors')) a.push('--colors', opt('--colors'));
    const z = nodeSync(a), unknown = (String(z.stdout).match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/) || [])[1];
    fs.copyFileSync(treeF, J('tree.baseline.json'));
    if (front) { front.gold.full = false; fs.writeFileSync(J('front.json'), JSON.stringify(front, null, 1)); }
    if (unknown) { say('NEED  still unnamed: ' + groupIcons(unknown)); say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --icons "<all of them, WxH=name,…>"`); process.exit(2); }
    say('FROM ZERO tree written with your icons / colours');
  }

  // ── text lane ops: content only, geometry stays with the scripts
  if (opt('--spec-json')) {
    const r = nodeSync(['build/reskin.js', treeF, path.resolve(PROJ, opt('--spec-json')), '--out', treeF]);
    say(short(String(r.stdout).trim().split('\n').slice(-1)[0] || r.stderr, 140));
    if (r.status !== 0) { say(short(String(r.stdout || r.stderr).trim().split('\n').slice(0, 6).join(' | '), 400)); process.exit(1); }
  }

  // ── 1. the front door again on every path (a cached or edited tree is never ungated) + the geometry guard
  const raw = readJ(treeF), T = raw.tree || raw;
  const dr = door(T, treeF, spec);
  const baseF = J('tree.baseline.json');
  if (fs.existsSync(baseF)) { const B = readJ(baseF); dr.out.push(...baselineDiff(T, B.tree || B, (opt('--allow') || '').split(',').map(x => x.trim()).filter(Boolean))); }
  const ledger = fs.existsSync(J('assumed.json')) ? readJ(J('assumed.json')) : { assumed: [], asks: [] };
  if (dr.out.length) {
    say(`DOOR ✗ ${dr.out.length} OUT — fix each in ${job}/tree.json in ONE pass (geometry numbers stay as they are)`);
    dr.out.slice(0, 8).forEach(([w, m]) => say(`  OUT ${w}: ${short(m, 200)}`));
    say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume`); process.exit(1);
  }
  say(`DOOR ✓ ALL IN · ${dr.checked} layers`);

  // ── 2. asks: only a screen-changing one stops the run; the rest becomes an assumption with its default
  const defaulted = [], seenAsk = new Set(ledger.asks || []);
  for (const a of [...(ledger.asks || []), ...dr.ask.filter(x => !seenAsk.has(x))]) {
    const c = classifyAsk(a);
    if (c.blocking && !flag('--go')) { say(`STOP  ask the user (it changes the screen): ${short(a, 220)}`); say(`NEXT  after the answer: node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --go`); process.exit(4); }
    if (!c.blocking) defaulted.push({ id: 'ask-' + defaulted.length, text: `${short(a, 90)} → default: ${c.default}`, flip: null });
  }
  const all = [...(ledger.assumed || []).filter(x => !/^ask-\d+$/.test(x.id)), ...defaulted];   // defaulted asks are recomputed every run, never piled up
  if (defaulted.length) fs.writeFileSync(J('assumed.json'), JSON.stringify({ assumed: all, asks: [] }, null, 1));
  if (all.length) say(`ASSUMED ${all.length}: ${all.filter(x => !/^ask-\d+$/.test(x.id)).map(x => x.id).join(' · ')}${defaulted.length ? ` (+${defaulted.length} defaulted asks)` : ''} — ledger ${job}/assumed.json · flip: /screen flip <id> ${job}`);

  // ── 3. layout-sim before Figma: position vs the measured reference, overflow at ×1 ×0.85 ×1.15, STRUCT-SIM on the simulated boxes
  const explicit = T.sz === 'x', fromZero = isImg && !(front && front.gold && front.gold.full);
  const expF = J('tree.expect.json'), hasExp = fs.existsSync(expF) && Object.keys(readJ(expF)).length > 0;
  const simA = ['build/layout-sim.js', treeF, '--geometry-out', J('sim.geometry.json')]; if (hasExp) simA.push('--expect', expF, '--ref-scale', String(spec && T.w && Math.abs(spec.frame.w / T.w - 2) < 0.05 ? 2 : 1));
  const s1 = nodeSync(simA), pos = (String(s1.stdout).match(/POSITION\s+(\d+)\/(\d+)[^\n]*= (\d+) %/) || []), ov1 = +(String(s1.stdout).match(/OVERFLOW\s+(\d+)/) || [0, 0])[1];
  const ovs = [0.85, 1.15].map(sc => +(String(nodeSync(['build/layout-sim.js', treeF, '--scale', String(sc)]).stdout).match(/OVERFLOW\s+(\d+)/) || [0, 0])[1]);
  let sim = [];
  try { sim = structure.check(readJ(J('sim.geometry.json')), spec); } catch (_) {}
  const posBad = hasExp && pos[3] && +pos[2] >= 5 && +pos[3] < 95 && fromZero, ovBad = ov1 > 0 || (explicit && ovs.some(n => n > 0));
  // the simulator has no text wrapping: position is only trusted with enough matched texts and only blocks a from-zero tree
  const posOk = hasExp && pos[3] && +pos[2] >= 5;
  say(`SIM ${posOk ? `position ${pos[3]} % (${pos[1]}/${pos[2]})${fromZero ? '' : ' advisory'}` : 'position —'} · overflow ×1 ${ov1} ×0.85 ${ovs[0]} ×1.15 ${ovs[1]}${explicit ? '' : ' (advisory: legacy tree)'} · STRUCT-SIM ${sim.length} (advisory)`);
  fs.writeFileSync(J('sim.structure.txt'), sim.join('\n'));
  const simBlock = spec ? sim.filter(l => /^(BOX|COLLAPSED)/.test(l)) : sim.filter(l => /^COLLAPSED/.test(l));
  (simBlock.length ? simBlock : fromZero ? sim : []).slice(0, 3).forEach(l => say('  ' + short(l, 170)));
  const structBad = simBlock.length > 0 && !flag('--allow-structure');
  if (posBad || ovBad || structBad) {
    say(`SIM ✗ ${structBad ? simBlock.length + ' structure defect(s) the build would have (missing reference box / collapsed frame)' : posBad ? 'position below 95 % (from zero)' : 'a leaf leaves the frame'} — see: node build/layout-sim.js ${job}/tree.json ${hasExp ? '--expect ' + job + '/tree.expect.json' : ''}${structBad ? ' (to build anyway: --allow-structure)' : ''}`);
    say('NEXT  fix the tree (sizing s, not numbers), then --resume'); process.exit(1);
  }
  if (isImg && spec) { const n = cropLogos(path.join(PROJ, job), J('ref.png'), spec); if (n) say(`LOGOS ${n} crops`); }

  // ── 4. --ask: the old approval stop
  if (flag('--ask')) {
    const p = nodeSync(['build/tree.js', 'plan', treeF, ...(spec ? ['--ref', J('see-ref/spec.json')] : [])]);
    say(String(p.stdout).trimEnd()); say(`STOP  paste the plan above VERBATIM, ask "Approve / Reject / Modify?" — on yes: node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume`); process.exit(5);
  }
  if (flag('--dry')) { say(`READY (dry run) · ${((Date.now() - t0) / 1000).toFixed(1)} s`); process.exit(0); }

  // ── 5. the build: the fix-round cap is enforced here (1 build + 2 fix rounds), never a claimed number
  if (st.builds >= 3 && !st.allowRound3) { say('STOP  2 fix rounds are used — the DRAFT stays as it is. Report its lines; the user may allow round 3 with /screen fix'); say(`STATUS DRAFT · ${elapsed()} s`); process.exit(6); }
  const h = await health();
  if (!h) { say('BRIDGE down. Options: (1) node build/mailbox.js ensure, then open SAP Bridge in the file (~11 s build) · (2) say "fallback": the screen-builder subagent types the build (5-10 min, ~40-60k tokens, same gates)'); process.exit(3); }
  const sendA = ['build/send.js', job, '--file', fileKey]; if (isImg && fs.existsSync(J('ref.png'))) sendA.push('--ref', J('ref.png')); if (opt('--timeout')) sendA.push('--timeout', opt('--timeout'));
  const b = nodeSync(sendA, { timeout: 330000 });
  st.builds++; save();
  String(b.stdout || '').split('\n').filter(Boolean).forEach(l => say(short(l, 170)));
  if (b.status === 3) { say('BRIDGE unusable. Options: (1) node build/mailbox.js ensure and open SAP Bridge in the file · (2) say "fallback" (screen-builder subagent, 5-10 min, ~40-60k tokens)'); process.exit(3); }
  const pass = b.status === 0;
  say(`STATUS ${pass ? 'PASS' : 'DRAFT'} · build ${st.builds} of 3 · ${elapsed()} s since the request · ${isImg ? 'provenance ' + (fromZero ? 'from zero' : 'gold ' + (front && front.gold.name)) : 'text lane'}`);
  say(pass ? `NEXT  final report: node build/tree.js plan ${job}/tree.json${spec ? ' --ref ' + job + '/see-ref/spec.json' : ''} — paste it VERBATIM; then offer /screen gold ${job}`
    : `NEXT  read the FIX/STRUCTURE lines above only, fix ${job}/tree.json (sizing/content; --allow "<node>" only for a node a gates line names), then --resume`);
  process.exit(pass ? 0 : 6);
})().catch(e => { console.log('run.js: ' + ((e && e.stack) || e)); process.exit(1); });
