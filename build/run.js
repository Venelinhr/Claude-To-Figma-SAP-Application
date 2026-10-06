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
// A plugin job (the bridge sets SAP_BRIDGE_JOB) must never build the unchanged skeleton: it makes a junk frame and costs a whole build (seen 2026-10-02, 35 s + a stray Customer Support frame).
if (flag('--as-is') && process.env.SAP_BRIDGE_JOB) { console.log('STOP  --as-is is not allowed in a plugin job. Write ops.json (set / remove / clone, content only) and run: --resume --spec-json <ops.json>'); process.exit(2); }
const VALUE = ['--file', '--job', '--icons', '--names', '--design-spec', '--colors', '--spec-json', '--allow', '--timeout', '--gold-min'];
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

const T_START = Date.now(), TRACE = [];
const _note = require('./note.js');
process.on('exit', code => { if (code === 64 || code === 2 || (process.env.SAP_BRIDGE_JOB && code === 1)) return;   // 2 = Claude must decide (design / names): the job goes on, the chat shows only what is current   // inside a Claude job a fix-and-retry stop is not the end: Claude goes on, the job end reports
  try { require('./note.js').end(code); } catch (_) {} });   // 64 = a wrong command line: the caller retries, the plugin chat is not told
const say = l => { console.log(l); _note(l); TRACE.push(`${((Date.now() - T_START) / 1000).toFixed(1).padStart(5)} s  ${String(l).replace(/\s+/g, ' ')}`); };   // the whole chat output — kept short on purpose
process.on('exit', () => {                         // trace.md of a Claude Code run: every printed line with its second (the plugin's log icon makes the same file for plugin jobs)
  try { const j = (process.argv.includes('--job') ? process.argv[process.argv.indexOf('--job') + 1] : ''); if (j && TRACE.length) { const f = path.join(PROJ, j, 'trace.md'), old = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : `# Claude Code run ${path.basename(j)}\n`; fs.writeFileSync(f, old + `\n## run.js at ${new Date().toISOString().slice(11, 19)} (seconds since this call started)\n\n` + TRACE.join('\n') + `\n\nexit ${process.exitCode == null ? '?' : process.exitCode} · job total ${global.__ST && global.__ST.started ? Math.round((Date.now() - global.__ST.started) / 1000) + ' s' : '?'} since the request\n`); } } catch (_) {}
});
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
  let imgs = []; (function w(x) { if (x.type === 'image' && (x.crop || x.box)) imgs.push(x.crop || x.box); (x.children || []).forEach(w); })({ children: spec.sections });
  try { imgs = JSON.parse(fs.readFileSync(path.join(job, 'tree.crops.json'), 'utf8')); } catch (_) {}   // spec2tree's own order (it includes the pictures Claude marked "image")
  let named = null;                                   // a DESIGNED tree: every node with "crop" is cut and matched by its own layer name (logos/index.json)
  try { const st0 = JSON.parse(fs.readFileSync(path.join(job, 'run.json'), 'utf8')); if (st0.design) { named = []; const T0 = JSON.parse(fs.readFileSync(path.join(job, 'tree.json'), 'utf8')); (function w(o) { if (Array.isArray(o.crop) && o.crop.length === 4) named.push({ n: o.n, box: o.crop }); (o.c || []).forEach(w); })(T0.tree || T0); } } catch (_) { named = null; }
  if (named) {
    const dir = path.join(job, 'logos'); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    for (const f of fs.readdirSync(job).filter(f => /^logo\d+\.png$/.test(f))) fs.unlinkSync(path.join(job, f));
    if (!named.length) return 0;
    const py2 = 'import cv2,sys,json\nim=cv2.imread(sys.argv[1]);fw=float(sys.argv[2]);f=im.shape[1]/fw\nfor i,b in enumerate(json.loads(sys.argv[4]),1):\n x,y,w,h=[int(round(v*f)) for v in b]\n cv2.imwrite(sys.argv[3]+"/crop%d.png"%i,im[max(0,y):y+h,max(0,x):x+w])\n';
    spawnSync('python3', ['-c', py2, ref, String(spec.frame.w), dir, JSON.stringify(named.map(e => e.box))], { cwd: PROJ });
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(named.map((e, i) => ({ element: e.n, file: `crop${i + 1}.png` }))));
    return named.length;
  }
  for (const f of fs.readdirSync(job).filter(f => /^logo\d+\.png$/.test(f))) fs.unlinkSync(path.join(job, f));   // always fresh: the crops follow the current tree
  if (!imgs.length) return 0;
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

// the numbers of mark.py (ref-marked.png): "5 (16x16 at 1545,214) · 6 …" — what Claude names after ONE look at the marked picture
function numbered(raw, job) {
  let mk; try { mk = JSON.parse(fs.readFileSync(path.join(PROJ, job, 'marks.json'), 'utf8')); } catch (_) { return groupIcons(raw); }
  const out = [];
  for (const m of String(raw).matchAll(/(\d+x\d+) at (\d+),(\d+)/g)) { const ic = mk.icons.find(i => i.box[0] === +m[2] && i.box[1] === +m[3]); if (ic) out.push(`${ic.id} (${m[1]})`); }
  return out.length ? out.join(' · ') : groupIcons(raw);
}
const NAMES_HELP = (job, fileKey) => [
  `NEED  look ONCE at the marked reference: Read ${job}/ref-marked.png (icons = pink numbers, zones = blue letters, texts = green T#, components = orange C#), then ${job}/icons-sheet.png (every icon enlarged). Never open any other picture. Compare every READ line above with the picture — the goal is the reference 1:1.`,
  `NEED  texts: {"T#": "<the exact text in the picture>" | ["<part>","<part>"] (one box holding several texts: split, left to right) | "icon:<kit icon word>" (an icon the OCR read as letters, e.g. "IT", "0", "fo") | "skip" (logo lettering)} — only the T# that are wrong. components: {"C#": "<kit component it really is>" | "text:<string>:<style>" (it is a plain text, e.g. a tab label) | "skip"} — only the wrong ones.`,
  `NEED  Write ${job}/names.json = {"icons":{"<number>":"<kit icon word>"|"text:<string>:<style>"|"skip"},"zones":{"<letter>":"<what the zone is>"},"texts":{…},"components":{…}} — every icon number and zone letter; texts/components only where the READ is wrong. A kit icon word is checked with node build/kit.js i <word> (e.g. search, bell, filter, sort-descending, grid, list, overflow, navigation-down-arrow). "skip" = the box is a piece of text or a logo, not an icon. A zone name is the SAP part it is: Shell Bar, Page Header, Icon Tab Bar, Segmented Button, Search Field, Table, Toolbar, Card …`,
  `NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --names ${job}/names.json`];
// DESIGN lane (2026-10-04): the script MEASURES, Claude DESIGNS — the way the 95 % screens were made (stored layouts written with real kit parts)
const DESIGN_HELP = (job, fileKey) => [
  `NEED  DESIGN 1/3 · look ONCE: Read ${job}/ref-marked.png, ${job}/icons-sheet.png and ${job}/measure.txt (every zone, box, text, icon with its measured box, SAP text style and colour token, at the TRUE screen scale). Never open any other picture, never read the build code, never ask for approval.`,
  `NEED  DESIGN 1c · SAP KIT ALWAYS (user rule): every control, action, status, toggle and glyph in the picture is a SAP Web UI Kit part (Button, Link, Icon Button, Check Box, Radio Button, Switch, Select, Input, Search Field, Segmented Button, Menu Button, Object Status, Message Strip, Range Slider, SAP icons) — plain text only for real text, a box only for a card / panel / strip. READ THE PICTURE, not only the OCR: every word complete (e.g. "Kürzeste Reisedauer", not "Reisedauer"), every STATE as shown (checked, selected, disabled, collapsed), every size from measure.txt; nothing past the frame edge — a long text near the right edge gets a box that ends inside the frame.`,
  `NEED  DESIGN 1b · Read knowledge/gold/design/flight-results.design-spec.json — a passed SAP redesign (few boxes, real kit parts). Copy its style, not its content. Never edit tree.json: when the door says OUT, fix design-spec.json and run the NEXT line again.`,
  `NEED  DESIGN 2/3 · write ONE short file ${job}/design-spec.json — you choose, the script lays out: {"nodes":[ … ]} where every node has the measured "box":[x,y,w,h] copied from measure.txt:`
    + ` {"type":"text","text":"…exact wording from the PICTURE (fix the OCR)…","style":"<SAP text style from measure.txt>","token":"<colour token from measure.txt>","box":[…]}`
    + ` · {"type":"icon","icon":"<kit icon word>","token":"sapContent_IconColor","box":[…]}`
    + ` · {"type":"component","component":"<kit component>","props":{<real props>},"box":[…]} (texts go in props "✏️ Text")`
    + ` · {"type":"image","box":[…]} (a logo / picture the kit has not: cut from the reference)`
    + ` · {"type":"divider","token":"sapList_BorderColor","box":[…]}`
    + ` · {"type":"box","fill":"sapBaseColor","border":"1px sapList_BorderColor","radius":8,"box":[…],"children":[ …nodes inside it… ]} (cards, bars, pills).`
    + ` Decide as a senior SAP product designer: the real kit component for every region (node build/kit.js list · c "<name>" · i <word> · v <regex> · t <regex>); a plain box/text only where the kit has none. Use ONLY props and values kit.js c prints.`,
  `NEED  DESIGN 3/3 · rules the check enforces (learned): props keys without "#id" · booleans true/false · icon values are icon NAMES · Link / Object Status text = prop "✏️ Text" (the script moves it) · Radio Button Selected "True"/"False" · a missing SAP icon: find it in the SAP Web UI Kit library (Figma search_design_system) and add it with node build/kit-icon-add.js <name>=<componentKey> · dark surface: add "dark":true to the box.`,
  `NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --design-spec ${job}/design-spec.json`];
// AUTONAME (2026-10-04): unnamed shapes are named by build/autoname.py (pixels + learned icon memory) — no model stop, nothing dropped.
function autoName(job, J, treeF) {
  if (flag('--ask-icons') || !fs.existsSync(J('marks.json'))) return null;
  const a = spawnSync('python3', ['build/autoname.py', path.join(PROJ, job), '--known', opt('--icons') || ''], { cwd: PROJ, encoding: 'utf8' });
  if (a.status !== 0) return null; say(String(a.stdout).trim().slice(0, 300));
  const z = s2tBest(s2tArgs(job, J, treeF).concat(opt('--names') ? [] : ['--marks', J('marks.json'), '--names', J('names.json')]), J, treeF);
  return (String(z.stdout).match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/) || [])[1] || '';
}
// TWO READINGS (2026-10-05, Make's thinking): spec2tree runs on the region reading (side panel / main / repeated cards) AND on the old
// bottom-up reading; the tree with the better SAP score (build/sap-score.js: free-placed groups, huge paddings, same-built cards, grid)
// is kept. A tie keeps the old reading. So the new reading can only help: on 6 test screens it never made a tree worse.
function s2tBest(args, J, treeF) {
  const z = nodeSync(args), alt = J('see-ref-noreg/spec.json');
  if (z.status !== 0 || !fs.existsSync(alt)) return z;
  const tf2 = treeF.replace(/\.json$/, '.noreg.json');
  const z2 = nodeSync(args.map(a => (a === J('see-ref/spec.json') ? alt : a === treeF ? tf2 : a)));
  if (z2.status !== 0) return z;
  const sc = f => { const r = nodeSync(['build/sap-score.js', f, '--json']); try { return JSON.parse(String(r.stdout)).score; } catch (_) { return -1; } };
  const a = sc(treeF), b = sc(tf2);
  if (a > b) { say(`READING  side panel / main / cards (Make) — SAP score ${a} vs ${b} bottom-up`); return z; }
  for (const x of ['', '.expect', '.crops']) { const f2 = tf2.replace(/\.json$/, x + '.json'), f1 = treeF.replace(/\.json$/, x + '.json'); if (fs.existsSync(f2)) fs.copyFileSync(f2, f1); }
  fs.copyFileSync(J('see-ref/spec.json'), J('see-ref/spec.regions.json')); fs.copyFileSync(alt, J('see-ref/spec.json'));   // the kept reading is also the reference every later check reads
  say(`READING  bottom-up — SAP score ${b} vs ${a} with regions`); return z2;
}
const s2tArgs = (job, J, treeF) => {
  const a = ['build/spec2tree.js', J('see-ref/spec.json'), treeF];
  if (opt('--icons')) a.push('--icons', opt('--icons')); if (opt('--colors')) a.push('--colors', opt('--colors'));
  if (opt('--names') && fs.existsSync(J('marks.json'))) a.push('--marks', J('marks.json'), '--names', path.resolve(PROJ, opt('--names')));
  return a;
};
function names(T) {                                  // what the model may address in a text-lane ops file: every section, every leaf WITH the op that changes it
  const lines = [];                                  //   text leaf [t] → {n:"<name>",t:"…"}     kit instance [tx.Key] → {n:"<name>",tx:{"Key":"…"}}   — "n" is ONLY the quoted name
  for (const sec of T.c || []) {
    const leaves = []; (function w(o) { if (o.k === 't') leaves.push(`"${o.n}" [t]="${short(o.t, 22)}"`); else if (o.k === 'i') for (const [k, v] of Object.entries(o.tx || {})) leaves.push(`"${o.n}" [tx.${k}]="${short(v, 18)}"`); (o.c || []).forEach(w); })(sec);
    lines.push(`  section ${sec.n} → ${leaves.slice(0, 24).join(' | ')}${leaves.length > 24 ? ` … +${leaves.length - 24}` : ''}`);
  }
  lines.push('  FORM  text leaf [t] → {n:"<quoted name>",t:"…"} · kit part [tx.Key] → {n:"<quoted name>",tx:{"Key":"…"}} · a status colour → {n,pr:{Semantic:"Error|Warning|Success|Information|None"}} · "n" is the quoted layer name only — never the section name, never the [..] tag');
  return lines.slice(0, 40);
}

(async () => {
  const t0 = Date.now();
  const resume = flag('--resume') || (!input && !!opt('--job'));
  const fileKey = opt('--file', '');
  if (!input && !resume) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 18).join('\n')); process.exit(64); }
  if (!flag('--dry') && !flag('--ask') && !/^[A-Za-z0-9]{1,128}$/.test(fileKey)) { console.log('usage: --file <figma file key> is required (or use --dry)'); process.exit(64); }
  const jobArg = opt('--job') && !fs.existsSync(path.join(path.resolve(PROJ, opt('--job')), 'run.json')) && fs.existsSync(path.join(PROJ, 'bridge-out', opt('--job'))) ? path.join('bridge-out', opt('--job')) : opt('--job');   // "--job sap-flight-2" = bridge-out/sap-flight-2
  const job = path.relative(PROJ, path.resolve(PROJ, jobArg || path.join('bridge-out', 'job-' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, ''))));
  const J = f => path.join(PROJ, job, f), treeF = J('tree.json'), stF = J('run.json');
  fs.mkdirSync(path.join(PROJ, job), { recursive: true });
  const st = fs.existsSync(stF) ? readJ(stF) : { started: t0, builds: 0, allowRound3: false };
  const elapsed = () => Math.round((Date.now() - st.started) / 1000);
  _note.job(job, st.started); global.__ST = st;
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
      const mk = spawnSync('python3', ['build/mark.py', J('ref.png'), J('see-ref/spec.json'), path.join(PROJ, job)], { cwd: PROJ, encoding: 'utf8' });   // the ONE look: marked picture + icon sheet
      const hasMarks = mk.status === 0 && fs.existsSync(J('marks.json'));
      try { const ph = spawnSync('python3', ['build/photos.py', path.join(PROJ, job), String(spec.frame.w)], { cwd: PROJ, encoding: 'utf8' }); if (ph.status === 0) say(String(ph.stdout).trim().slice(0, 200)); } catch (_) {}   // photos / maps / illustrations are cut 1:1
      if (hasMarks) String(mk.stdout).trim().split('\n').forEach(say);
      const z = s2tBest(s2tArgs(job, J, treeF), J, treeF); let unknown = (String(z.stdout).match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/) || [])[1];
      if (unknown && hasMarks) { const u2 = autoName(job, J, treeF); if (u2 !== null) unknown = u2; }
      front.gold.full = false; fs.writeFileSync(J('front.json'), JSON.stringify(front, null, 1));
      fs.copyFileSync(treeF, J('tree.baseline.json'));
      if (hasMarks && !opt('--names') && !flag('--copy')) {     // the DESIGN lane is the DEFAULT (2026-10-05, user: "this plugin must produce SAP screens"): Claude picks the real kit parts; --copy = the old 1:1 scripted copy
        const me = nodeSync(['build/measure.js', path.join(PROJ, job)]); say(String(me.stdout || me.stderr).trim());
        st.design = true; save(); DESIGN_HELP(job, fileKey).forEach(say); process.exit(2);
      }
      if (hasMarks && !opt('--names') && flag('--look')) { NAMES_HELP(job, fileKey).forEach(say); process.exit(2); }   // names lane: opt-in (--look)
      if (unknown) { say('NEED  name these shapes — NOTHING may be lost: a UI icon → its kit icon (node build/kit.js i <word>) · a logo / flag / badge / picture → image (cut 1:1 from the reference) · text the OCR missed → text:<string>:<style> (e.g. 53x8=text:Багаж:H5/Bold) · a control → comp:<kit part> (e.g. 21x21=comp:Check Box) · skip only for noise under 8 px: ' + groupIcons(unknown)); say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --icons "WxH=name,…"   `); process.exit(2); }
    } else fs.copyFileSync(treeF, J('tree.baseline.json'));
    if (!isImg && flag('--new')) {                     // BRAND NEW screen: no saved layout is cloned — the model writes a fresh tree from the request + the kit
      try { fs.unlinkSync(J('tree.baseline.json')); } catch (_) {}
      st.newScreen = true; save();
      say('NEW   brand-new screen — no saved layout is used. Write ' + job + '/new-tree.json from the REQUEST ALONE: list every part it names (filters, cards, columns, statuses, steps, actions), then design the structure that fits exactly those parts.');
      say('NEW   tree format = auto-layout nodes: n name · d direction · g gap · p padding · a align · s sizing · c children · k t (text: t, st text style, bg colour variable) · k i (kit instance: cp component, pr props) · k ic (icon: ic name). Field NAMES only — read one file in knowledge/gold/v6/ for the format, never copy its content or structure.');
      say('NEW   kit only: node build/kit.js list · c <component> (its real props and states) · v <variable> · t <text style> · i <icon word>. No guessed component, state, boolean or variable. Real business content in the request\'s language, no placeholder text.');
      say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --tree-new ${job}/new-tree.json`);
      process.exit(2);
    }
    if (!isImg && !flag('--as-is')) {                  // text lane: the skeleton carries another screen's content — the model puts the real content on it
      say(`NEED  real content for the skeleton "${front.gold.name}" (${front.gold.hit}/${front.want} request words match). Write ONE ops.json, content only, no geometry. Compact: {filters:[{from?,label,placeholder|value}], cards:[{title,value,caption}], table:{keep:[skeleton column indexes],header:[…],rows:[[cell|{t,d,sem}…]]}} + set:[{n,t|pr|tx}] for the shell bar, page title, table title`);
      require('./content-audit.js').capabilities(readJ(treeF), String(input || '')).forEach(say);
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
  if (resume && spec && (opt('--icons') || opt('--colors') || opt('--names'))) {   // the model named the icons / zones / colour roles: the from-zero tree is written again with them
    const z = s2tBest(s2tArgs(job, J, treeF), J, treeF); let unknown = (String(z.stdout).match(/ICONS with no SAP name yet[^\n]*: ([^\n]+)/) || [])[1];
    if (unknown) { const u2 = autoName(job, J, treeF); if (u2 !== null) unknown = u2; }
    fs.copyFileSync(treeF, J('tree.baseline.json'));
    if (front) { front.gold.full = false; fs.writeFileSync(J('front.json'), JSON.stringify(front, null, 1)); }
    if (unknown) {
      if (opt('--names')) { say('NEED  still unnamed (add them to names.json, same numbers as ref-marked.png): ' + numbered(unknown, job)); say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --names ${job}/names.json`); }
      else { say('NEED  still unnamed: ' + groupIcons(unknown)); say(`NEXT  node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --icons "<all of them, WxH=name,…>"`); }
      process.exit(2);
    }
    say('FROM ZERO tree written with your icons / colours');
  }

  // ── DESIGN lane: the model wrote a SHORT spec (measured boxes + chosen kit parts); the script infers the auto-layout (spec2tree) and applies the learned fixes
  if (opt('--design-spec')) {
    const sf = path.resolve(PROJ, opt('--design-spec')); let ds;
    try { ds = readJ(sf); } catch (e) { say('STOP  design-spec.json is missing or not valid JSON: ' + short(e.message, 120)); process.exit(1); }
    const nodes = Array.isArray(ds) ? ds : (ds.nodes || ds.children || []);
    const base = fs.existsSync(J('see-ref/spec.json')) ? readJ(J('see-ref/spec.json')) : { frame: { w: 1440, h: 900, fill: 'sapBackgroundColor' } };
    const INK = /Text|Title|Active|Foreground|Marker|Link/;   // a text-colour variable is never a fill
    const KNOWN = {}, known = t => { if (!(t in KNOWN)) { const r = spawnSync(NODE, ['build/kit.js', 'v', '^' + t + '$'], { cwd: PROJ, encoding: 'utf8' }); KNOWN[t] = /\/\S/.test(String(r.stdout)); } return KNOWN[t]; };   // a variable the kit really has
    // AUTO-REPAIR (2026-10-06): a model may use a prop or an icon the kit does not have ("Icon Right", "arrow-right"). The kit decides — the build never stops for it.
    const PROPS = {}, propsOf = cp => { if (!(cp in PROPS)) { const r = spawnSync(NODE, ['build/kit.js', 'c', cp], { cwd: PROJ, encoding: 'utf8' }); PROPS[cp] = String(r.stdout).split('\n').slice(1).map(l => (/^\s+"([^"]+)"/.exec(l) || [])[1]).filter(Boolean).map(x => x.replace(/#[\d:]+$/, '')); } return PROPS[cp]; };
    const ICO = {}, iconOf = w => { w = String(w || '').replace(/^sap-icons\//, ''); if (!w) return w; if (!(w in ICO)) { const r = spawnSync(NODE, ['build/kit.js', 'i', w], { cwd: PROJ, encoding: 'utf8' }); const first = String(r.stdout).split('\n')[0].split(/\s+/)[0]; ICO[w] = new RegExp('^' + w.replace(/[^\w-]/g, '') + '\\s', 'm').test(String(r.stdout)) ? w : (first || w); } return ICO[w]; };   // exact name, else the kit's nearest icon
    const repair = n => { if (n.type === 'icon' && n.icon) n.icon = iconOf(n.icon);
      if (n.type === 'component' && n.props) { const ok = propsOf(n.component); if (ok.length) for (const k of Object.keys(n.props)) {
        if (/^Icon (Right|Trailing)$/.test(k) && ok.includes('Icon')) { n.props['Icon Left'] = true; n.props.Icon = n.props[k]; }   // the kit button has one icon slot
        if (!ok.includes(k) && !/^✏️/.test(k)) delete n.props[k]; }   // "✏️ Text" is never dropped: the script moves it into the part's text (Object Status, Link)
        if (n.props.Icon) n.props.Icon = iconOf(n.props.Icon).replace(/^sap-icons\//, ''); }   // a prop value is the plain icon name; resolved AFTER the keys are repaired
      return n; };
    const fixTok = (t, role) => !t || /^RAW/.test(t) || known(t) ? t : role === 'icon' ? 'sapContent_IconColor' : role === 'line' ? 'sapList_BorderColor' : /Positive|Success|Good/.test(t) ? 'sapContent_Selected_ForegroundColor' : /Label|Secondary/.test(t) ? 'sapContent_LabelColor' : 'sapTextColor';   // an invented variable → the nearest real role
    const norm = n => { n = { ...n }; delete n.comment;
      if (n.props) { const pr = {}; for (const [k, v] of Object.entries(n.props)) pr[k.replace(/#[\d:]+$/, '')] = v; n.props = pr;   // "✏️ Text#154638:49" → "✏️ Text": the kit keys without their Figma id
        if (/^(Check Box|Radio Button|Switch)$/.test(n.component) && pr['✏️ Text'] && pr.Label === undefined) pr.Label = true; }   // a control with a text shows its label
      if (n.type === 'box') { if (n.dark) delete n.dark; if (!n.fill || INK.test(n.fill)) { if (n.fill && INK.test(n.fill)) n.border = '2px sapContent_Selected_ForegroundColor'; n.fill = 'sapBaseColor'; } if (!n.border) n.border = 'none'; }   // a dark tile = the selected card
      if (n.token) n.token = fixTok(n.token, n.type === 'icon' ? 'icon' : n.type === 'divider' ? 'line' : 'ink');
      repair(n);
      n.children = (n.children || []).map(norm); if (!n.children.length) delete n.children; return n; };
    // an invisible box (same fill as its parent, no border) is only the screenshot's grouping: drop it, keep its children — rows never get a fixed box that cuts them
    const unwrap = (ns, pf) => ns.flatMap(n => { if (n.type !== 'box') return [n]; const kids = unwrap(n.children || [], n.fill);
      if ((n.border || 'none') === 'none' && (n.fill === pf || !n.fill)) return kids; return [{ ...n, children: kids }]; });
    const spec2 = { frame: base.frame, sections: [{ type: 'stack', box: [0, 0, base.frame.w, base.frame.h], children: unwrap(nodes.map(norm), base.frame.fill || 'sapBackgroundColor') }], ask: [] };
    fs.writeFileSync(J('design-spec.full.json'), JSON.stringify(spec2));
    const z = nodeSync(['build/spec2tree.js', J('design-spec.full.json'), treeF]);
    if (z.status !== 0) { say('STOP  spec2tree failed: ' + short(String(z.stdout || z.stderr).trim().split('\n').slice(-3).join(' | '), 300)); process.exit(1); }
    const T = readJ(treeF), R = T.tree || T, placed = [];
    (function w(o) {
      if (o.k === 'i' && ['Object Status', 'Link'].includes(o.cp) && o.pr && o.pr['✏️ Text']) { o.tx = Object.assign(o.tx || {}, { Text: o.pr['✏️ Text'] }); delete o.pr['✏️ Text']; }
      if (o.k === 'r' && o.w > 120 && o.w > o.h) o.s = 'FX';                              // a long rule flexes in its row
      if (o.k === 't') placed.push(String(o.t)); else if (o.tx) Object.values(o.tx).forEach(v => placed.push(String(v))); else if (o.pr) Object.entries(o.pr).forEach(([k, v]) => { if (k.startsWith('✏️')) placed.push(String(v)); });
      (o.c || []).forEach(w);
    })(R);
    // OCR wording the picture's text replaced (a typo, a lost subscript): a reference text with a close placed text is answered by it
    const sim = (a, b) => { a = a.toLowerCase().replace(/[^a-z0-9]/g, ''); b = b.toLowerCase().replace(/[^a-z0-9]/g, ''); if (!a || !b) return 0; const m = [...Array(a.length + 1)].map((_, i) => [i]); for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return 1 - m[a.length][b.length] / Math.max(a.length, b.length); };
    const refTexts = []; (function w(x) { if (x.type === 'text') refTexts.push(x.text); (x.children || []).forEach(w); })({ children: base.sections || [] });
    const answered = refTexts.filter(t => !placed.some(p => p.includes(t) || t.includes(p)) && placed.some(p => sim(p, t) >= 0.55 || p.toLowerCase().includes(String(t).toLowerCase().slice(0, 8))));
    R.kit = { src: 'spec2tree', icons: 0, texts: answered };   // src: the door counts these corrected OCR wordings as placed
    fs.writeFileSync(treeF, JSON.stringify(T));
    { const sp = nodeSync(['build/sap-spacing.js', treeF]); say(String(sp.stdout || sp.stderr).trim()); }   // SAP Horizon spacing scale on every padding / gap
    try { fs.unlinkSync(J('tree.baseline.json')); } catch (_) {}
    st.newScreen = true; st.design = true; save();
    const t0d = R; if (t0d && typeof t0d.n === 'string' && t0d.n.trim()) { st.title = t0d.n.trim().slice(0, 100); save(); }
    say(`DESIGN spec → tree · ${(R.c || []).length ? 'layout inferred by spec2tree' : 'empty'} · ${answered.length} OCR wordings answered by your corrected texts`);
  }

  // ── brand-new screen (--new … --resume --tree-new <file>): the model's own tree replaces the job tree; there is no baseline to diff against
  if (opt('--tree-new')) {
    const nf = path.resolve(PROJ, opt('--tree-new'));
    let nt; try { nt = readJ(nf); } catch (e) { say('STOP  the new tree is missing or not valid JSON: ' + short(e.message, 120)); process.exit(1); }
    fs.writeFileSync(treeF, JSON.stringify(nt));
    try { fs.unlinkSync(J('tree.baseline.json')); } catch (_) {}
    st.newScreen = true; save();
    const t0n = nt.tree || nt; if (t0n && typeof t0n.n === 'string' && t0n.n.trim()) { st.title = t0n.n.trim().slice(0, 100); save(); }
    if (isImg && fs.existsSync(J('design.expect.json'))) { fs.copyFileSync(J('design.expect.json'), J('tree.expect.json')); st.design = true; save(); }   // positions are checked against the MEASURED boxes
    say(isImg ? 'DESIGN tree loaded — the kit check, the measured positions and the structure are checked next' : 'NEW tree loaded — the door and the layout simulation check it next');
  }

  // ── text lane ops: content only, geometry stays with the scripts
  if (opt('--spec-json')) {
    try { const o0 = readJ(path.resolve(PROJ, opt('--spec-json'))); if (o0 && typeof o0.title === 'string' && o0.title.trim()) { st.title = o0.title.trim().slice(0, 100); save(); } } catch (_) {}   // the frame name the model chose (ops.title) — applied by rename.js after a PASS
    const r = nodeSync(['build/reskin.js', treeF, path.resolve(PROJ, opt('--spec-json')), '--out', treeF]);
    say(short(String(r.stdout).trim().split('\n').slice(-1)[0] || r.stderr, 140));
    if (r.status !== 0) { say(short(String(r.stdout || r.stderr).trim().split('\n').slice(0, 6).join(' | '), 400)); process.exit(1); }
  }

  // ── content audit (text lane): the REQUEST's content must be on the screen, not the skeleton's — leftovers, column counts, one colour per status, one date format;
  //    then the layer names are rewritten from the new content (build/content-audit.js, 0 tokens). Skipped with --as-is (the user says the skeleton already is the screen).
  if (!isImg && !flag('--as-is') && fs.existsSync(J('tree.baseline.json'))) {
    const CA = require('./content-audit.js'), r0 = readJ(treeF), T0 = r0.tree || r0, B0 = readJ(J('tree.baseline.json')), req = String((readJ(stF) || {}).input || '');
    const probs = CA.audit(T0, B0.tree || B0, req).filter(x => !/^NAMES/.test(x));
    if (probs.length) {
      say(`CONTENT ✗ ${probs.length} problem(s) — the screen still carries the old content or is inconsistent (nothing was built)`);
      probs.slice(0, 14).forEach(x => say('  ' + short(x, 190)));
      say(`NEXT  write ops2.json for exactly these lines (set … / remove { n, nth } for the SAME column in the header and in every row), then: node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --spec-json <ops2.json>`);
      process.exit(1);
    }
    const nn = CA.autoname(T0, B0.tree || B0, req);
    if (nn) { fs.writeFileSync(treeF, JSON.stringify(r0)); say(`NAMES ${nn} layers renamed from their new content`); }
  }

  // ── 1. the front door again on every path (a cached or edited tree is never ungated) + the geometry guard
  const raw = readJ(treeF), T = raw.tree || raw;
  const baseF = J('tree.baseline.json');
  // LAYOUT (2026-10-06): the senior-designer auto-layout review on every path. A tree with no baseline (from zero, design lane, a model's
  // own tree) first gets the same intent rules spec2tree uses (SAP steps within 2 px, space-between rows, pinned = FIXED, no empty wrappers).
  { const LA = require('./layout-audit.js');
    if (!fs.existsSync(baseF)) { const nf = LA.normalize(T); if (nf) { fs.writeFileSync(treeF, JSON.stringify(raw)); say(`LAYOUT fixed ${nf} padding / gap / sizing values to the SAP layout rules`); } }
    const la = LA.audit(T); say(LA.line(la).replace(/^LAYOUT/, la.score >= 75 ? 'LAYOUT ✓' : 'LAYOUT ⚠')); }
  const dr = door(T, treeF, spec);
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
  if (fs.existsSync(J('design.expect.json')) && fs.existsSync(J('tree.expect.json')) && !Object.keys(readJ(J('tree.expect.json'))).length) { say('STOP  tree.expect.json was emptied — the position gate cannot be switched off that way. Restore it: cp ' + job + '/design.expect.json ' + job + '/tree.expect.json'); process.exit(2); }
  const expF = J('tree.expect.json'), hasExp = fs.existsSync(expF) && Object.keys(readJ(expF)).length > 0;
  const simA = ['build/layout-sim.js', treeF, '--geometry-out', J('sim.geometry.json')]; if (hasExp) simA.push('--expect', expF, '--ref-scale', String(spec && T.w && Math.abs(spec.frame.w / T.w - 2) < 0.05 ? 2 : 1));
  const s1 = nodeSync(simA), pos = (String(s1.stdout).match(/POSITION\s+(\d+)\/(\d+)[^\n]*= (\d+) %/) || []), ov1 = +(String(s1.stdout).match(/OVERFLOW\s+(\d+)/) || [0, 0])[1];
  const ovs = [0.85, 1.15].map(sc => +(String(nodeSync(['build/layout-sim.js', treeF, '--scale', String(sc)]).stdout).match(/OVERFLOW\s+(\d+)/) || [0, 0])[1]);
  let sim = [];
  try { sim = structure.check(readJ(J('sim.geometry.json')), spec); } catch (_) {}
  const posBad = hasExp && pos[3] && +pos[2] >= 5 && +pos[3] < 95 && fromZero && !st.design,   // the SAP design lane re-spaces on purpose (sap-spacing.js): reference pixel places are advisory there
    ovBad = ov1 > 0 || (explicit && ovs.some(n => n > 0));
  // the simulator has no text wrapping: position is only trusted with enough matched texts and only blocks a from-zero tree
  const posOk = hasExp && pos[3] && +pos[2] >= 5;
  say(`SIM ${posOk ? `position ${pos[3]} % (${pos[1]}/${pos[2]})${fromZero ? '' : ' advisory'}` : 'position —'} · overflow ×1 ${ov1} ×0.85 ${ovs[0]} ×1.15 ${ovs[1]}${explicit ? '' : ' (advisory: legacy tree)'} · STRUCT-SIM ${sim.length} (advisory)`);
  fs.writeFileSync(J('sim.structure.txt'), sim.join('\n'));
  const simBlock = spec ? sim.filter(l => /^(BOX|COLLAPSED)/.test(l)) : sim.filter(l => /^COLLAPSED/.test(l));
  (simBlock.length ? simBlock : fromZero ? sim : []).slice(0, 3).forEach(l => say('  ' + short(l, 170)));
  const structBad = simBlock.length > 0 && !flag('--allow-structure') && !st.design;   // an SAP redesign differs from the reference boxes on purpose
  // SMASH gate (2026-10-04): what lands ON what — text on text, text on a picture, fake controls. Blocks the build; --allow-smash to pass.
  const sm = spawnSync(NODE, ['build/overlap.js', J('sim.geometry.json'), '--advisory'], { cwd: PROJ, encoding: 'utf8' }), smLines = String(sm.stdout).trim().split('\n').filter(l => /^(TEXT|FAKE)/.test(l));
  fs.writeFileSync(J('sim.smash.txt'), smLines.join('\n'));
  const smHard = smLines.filter(l => /^(TEXT\/TEXT|TEXT\/IMAGE|TEXT\/ICON|FAKE)/.test(l)), smashBad = smHard.length > 0 && !flag('--allow-smash');
  say(`SMASH ${smHard.length ? '✗ ' + smHard.length : '✓ 0'}${smLines.length > smHard.length ? ' (+' + (smLines.length - smHard.length) + ' cut-off advisory)' : ''}`);
  if (smHard.length) smHard.slice(0, 3).forEach(l => say('  ' + short(l, 170)));
  if (posBad || ovBad || structBad || smashBad) {
    if (smashBad && !(posBad || ovBad || structBad)) { say('SIM ✗ smashed layout: parts land on each other or plain frames stand in for kit controls — see ' + job + '/sim.smash.txt (to build anyway: --allow-smash)'); say('NEXT  fix the tree / the rules, then --resume'); process.exit(1); }
    say(`SIM ✗ ${structBad ? simBlock.length + ' structure defect(s) the build would have (missing reference box / collapsed frame)' : posBad ? 'position below 95 % (from zero)' : 'a leaf leaves the frame'} — see: node build/layout-sim.js ${job}/tree.json ${hasExp ? '--expect ' + job + '/tree.expect.json' : ''}${structBad ? ' (to build anyway: --allow-structure)' : ''}`);
    say('NEXT  fix the tree (sizing s, not numbers), then --resume'); process.exit(1);
  }
  if (isImg && spec) { const n = cropLogos(path.join(PROJ, job), J('ref.png'), spec); if (n) say(`LOGOS ${n} crops`); }

  // ── 4. --ask: the old approval stop
  if (flag('--ask')) {
    const p = nodeSync(['build/tree.js', 'plan', treeF, ...(spec ? ['--ref', J('see-ref/spec.json')] : [])]);
    st.planShown = true; st.approved = false; save(); fs.writeFileSync(J('plan.txt'), String(p.stdout)); _note.block('Plan — wireframe, layers and SAP parts', String(p.stdout));
    say(String(p.stdout).trimEnd()); say(`STOP  paste the plan above VERBATIM, ask "Approve / Reject / Modify?" — on yes: node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume`); process.exit(5);
  }
  // APPROVAL GATE (2026-10-04): a build never starts before the user saw the plan and said yes. --approved is passed ONLY after that yes.
  if (flag('--approved')) { st.approved = true; save(); }
  if (!st.approved && !flag('--dry') && !(st.builds > 0)) {
    const p = nodeSync(['build/tree.js', 'plan', treeF, ...(spec ? ['--ref', J('see-ref/spec.json')] : [])]);
    st.planShown = true; save(); fs.writeFileSync(J('plan.txt'), String(p.stdout)); _note.block('Plan — wireframe, layers and SAP parts', String(p.stdout));
    say(String(p.stdout).trimEnd()); say(`STOP  not approved yet — show the plan above VERBATIM, ask "Approve / Reject / Modify?" — on yes: node build/run.js --job ${job} --file ${fileKey || '<key>'} --resume --approved`); process.exit(5);
  }
  if (flag('--dry')) { say(`READY (dry run) · ${((Date.now() - t0) / 1000).toFixed(1)} s`); process.exit(0); }

  // ── 5. the build: the fix-round cap is enforced here (1 build + 2 fix rounds), never a claimed number
  if (st.builds >= 3 && !st.allowRound3) { say('STOP  2 fix rounds are used — the DRAFT stays as it is. Report its lines; the user may allow round 3 with /screen fix'); say(`STATUS DRAFT · ${elapsed()} s`); process.exit(6); }
  const h = await health();
  if (!h) { say('BRIDGE down. Options: (1) node build/mailbox.js ensure, then open SAP Bridge in the file (~11 s build) · (2) say "fallback": the screen-builder subagent types the build (5-10 min, ~40-60k tokens, same gates)'); process.exit(3); }
  const sendA = ['build/send.js', job, '--file', fileKey]; if (isImg && fs.existsSync(J('ref.png'))) sendA.push('--ref', J('ref.png')); if (opt('--timeout')) sendA.push('--timeout', opt('--timeout'));
  const b = nodeSync(sendA, { timeout: 330000 });
  if (!/Build failed|build threw|PLUGIN OUT OF DATE|Timed out|did not build/i.test(String(b.stdout || '') + String(b.stderr || ''))) st.builds++;   // a build the plugin never ran is not a fix round
  save();
  String(b.stdout || '').split('\n').filter(Boolean).forEach(l => say(short(l, 170)));
  if (b.status === 3) { say('BRIDGE unusable. Options: (1) node build/mailbox.js ensure and open SAP Bridge in the file · (2) say "fallback" (screen-builder subagent, 5-10 min, ~40-60k tokens)'); process.exit(3); }
  const pass = b.status === 0;
  if (pass && !flag('--no-rename')) {                 // name the frame after its real title (script, ~1 s) — the model does not spend a turn on it
    try {
      const nid = (String(b.stdout || '').match(/node-id=(\d+-\d+)/) || [])[1], raw = readJ(treeF), root = raw.tree || raw;
      const nm = String(st.title || root.n || '').replace(/^DRAFT — /, '').trim();
      if (nid && nm && fileKey) { const rn = nodeSync(['build/rename.js', nid, nm, '--file', fileKey], { timeout: 30000 }); say(short(String(rn.stdout || rn.stderr).trim().split('\n').slice(-1)[0], 140)); }
    } catch (e) { say('RENAME ✗ ' + short(e.message, 100)); }
  }
  say(`STATUS ${pass ? 'PASS' : 'DRAFT'} · build ${st.builds} of 3 · ${elapsed()} s since the request · ${isImg ? 'provenance ' + (fromZero ? 'from zero' : 'gold ' + (front && front.gold.name)) : 'text lane'}`);
  // the plan is shown ONCE per job (user rule 2026-10-03: "why was this plan repeated twice"): printed here at the end, or already shown by --ask
  if (!st.planShown && (pass || st.builds >= 3)) {
    const p = nodeSync(['build/tree.js', 'plan', treeF, ...(spec ? ['--ref', J('see-ref/spec.json')] : [])]);
    fs.writeFileSync(J('plan.txt'), String(p.stdout)); st.planShown = true; save();
    say('PLAN  (the final report — shown once)'); say(String(p.stdout).trimEnd());
  }
  say(pass ? `NEXT  final report: the PLAN above is the whole report, paste it ONCE VERBATIM (it is also in ${job}/plan.txt) and never print or paste it again; then offer /screen gold ${job}`
    : `NEXT  read the FIX/STRUCTURE lines above only, fix ${job}/tree.json (sizing/content; --allow "<node>" only for a node a gates line names), then --resume`);
  process.exit(pass ? 0 : 6);
})().catch(e => { console.log('run.js: ' + ((e && e.stack) || e)); process.exit(1); });
