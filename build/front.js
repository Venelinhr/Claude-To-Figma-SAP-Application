#!/usr/bin/env node
// front.js — the FRONT DOOR in one command (fast, cheap: ~2 s, prints ~30 lines instead of 60 KB of JSON).
//   node build/front.js <ref.png> [--job bridge-out/<job>]          image: see.py spec → closest gold tree (by the
//        reference texts it already places) → fits the frame + fixed-size containers to the measured boxes → door
//   node build/front.js "<text request>" [--job bridge-out/<job>]   text: closest gold tree by words → door
// Writes <job>/tree.json (+ see-ref/spec.json), and for v6 <job>/tree.expect.json (measured text positions for layout-sim --expect),
// <job>/assumed.json (the ASSUMED ledger, each entry with its flip key) and <job>/front.json (machine-readable summary run.js reads).
// Claude then edits only what OUT/ASK names.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { door, report } = require('./door.js');
const ROOT = path.resolve(__dirname, '..'), GOLD = path.join(ROOT, 'knowledge/gold/trees'), GOLD_V6 = path.join(ROOT, 'knowledge/gold/v6');   // v6: approved screens built and accepted in Figma (invoice list, support overview, approval timeline …)
const args = process.argv.slice(2), ji = args.indexOf('--job'), input = args[0];
if (!input) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 7).join('\n')); process.exit(2); }
const t0 = Date.now(), isImg = /\.(png|jpe?g|webp)$/i.test(input) && fs.existsSync(input);
const job = ji >= 0 ? args[ji + 1] : path.join('bridge-out', 'job-' + new Date().toISOString().slice(5, 16).replace(/[-:T]/g, ''));
fs.mkdirSync(job, { recursive: true });
const norm = s => String(s).toLowerCase().replace(/[\s.•·,:;|()\-–]+/g, '');
const texts = o => { const out = []; (function w(x) { if (x.t) out.push(x.t); for (const v of Object.values(x.tx || {})) out.push(v);
  for (const [k, v] of Object.entries(x.pr || {})) if (k.startsWith('✏️')) out.push(v); (x.c || []).forEach(w); })(o); return out.map(norm).filter(Boolean); };
const has = (pool, t) => pool.some(h => h.includes(t) || (h.length >= 4 && t.includes(h)));
const golds = [GOLD, GOLD_V6].filter(d => fs.existsSync(d)).flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.tree.json')).map(f => ({ f, dir: d, T: JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) }))).filter(g => g.T && Array.isArray(g.T.c));   // a broken dump (no children) is not a gold tree
let spec = null, want;
if (isImg) {
  const img = path.resolve(input), sd = path.resolve(job, 'see-ref');         // see.py reads best from the image's own folder
  try { execFileSync('python3', [path.join(__dirname, 'see.py'), 'spec', path.basename(img), '--out', sd], { cwd: path.dirname(img), stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { if (!fs.existsSync(path.join(sd, 'spec.json'))) { console.log('FRONT  see.py spec failed: ' + (String(e.stdout || '') + String(e.stderr || '') || e.message).trim().split('\n').slice(-3).join(' | ')); process.exit(2); } }   // exit 1 = spec written, with open questions
  // Make's reading (side panel / main / repeated cards) is an EXTRA reading: the old bottom-up one is kept beside it, run.js keeps the better tree
  try { const sj = fs.readFileSync(path.join(sd, 'spec.json'), 'utf8'); fs.rmSync(path.resolve(job, 'see-ref-noreg'), { recursive: true, force: true });
    if (/"(region|synthetic)":/.test(sj)) execFileSync('python3', [path.join(__dirname, 'see.py'), 'spec', path.basename(img), '--no-regions', '--out', path.resolve(job, 'see-ref-noreg')], { cwd: path.dirname(img), stdio: ['ignore', 'pipe', 'pipe'] }); } catch (_) {}
  spec = JSON.parse(fs.readFileSync(path.join(job, 'see-ref', 'spec.json'), 'utf8'));
  want = []; (function w(x) { if (x.type === 'text') want.push(norm(x.text)); (x.children || []).forEach(w); })({ children: spec.sections });
  want = [...new Set(want.filter(t => t.length >= 2))];
} else want = [...new Set(input.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4))];
for (const g of golds) {
  const pool = isImg ? texts(g.T) : [norm(JSON.stringify(g.T).replace(/"(svg|img)":"[^"]*"/g, '')) + norm(g.f)];
  g.hit = want.filter(t => has(pool, norm(t))).length;
  // a request that names summary / KPI cards needs a layout that HAS a card band (the PO list has none → 4 missing cards, seen 2026-10-02)
  if (!isImg && want.some(w => /^(cards?|kpis?|tiles?|summary)$/.test(w)) && /"n":"Summary Cards"/.test(JSON.stringify(g.T))) g.hit += 8;
}
for (const g of golds) g.out = door(g.T, path.join(g.dir, g.f), null).out.length;   // tie → the one the door lets in
golds.sort((a, b) => b.hit - a.hit || a.out - b.out || Math.abs((a.T.w || 0) - (spec ? spec.frame.w : 1440)) - Math.abs((b.T.w || 0) - (spec ? spec.frame.w : 1440)));
const G = golds[0], T = JSON.parse(JSON.stringify(G.T)), fit = [];
if (spec && T.w && Math.abs(spec.frame.w / T.w - 1) > 0.01) {   // same screen, other width: widths scale, heights follow content
  const sx = spec.frame.w / T.w, X = v => Math.round(v * sx * 10) / 10;
  (function scale(o, alParent) {
    const hug = alParent && (o.s || 'XX')[0] === 'H';                 // hug = follows its content, which keeps its size
    if (!hug && o.k !== 't' && o.k !== 'ic' && !o.img) o.w = X(o.w);
    if (o.xy) o.xy = [X(o.xy[0]), o.xy[1]];
    if (o.d === 'H' && o.g) o.g = X(o.g);
    if (o.p != null && o.d) { const p = Array.isArray(o.p) ? o.p : [o.p, o.p, o.p, o.p]; o.p = [p[0], X(p[1]), p[2], X(p[3])]; }
    (o.c || []).forEach(k => scale(k, !!o.d));
  })(T, false);
  fit.push(`frame ${G.T.w}×${G.T.h} → ${spec.frame.w}×${spec.frame.h} · fixed widths, gaps, side paddings ×${sx.toFixed(3)} · heights follow content`);
  T.h = spec.frame.h;
  const widths = []; (function w(o) { if (!o.k && o.w) widths.push(o.w); (o.c || []).forEach(w); })(T);
  const boxes = []; (function w(x) { if (x.type === 'box') boxes.push(x.box[2]); (x.children || []).forEach(w); })({ children: spec.sections });
  const chk = boxes.map(b => { const n = widths.reduce((a, c) => Math.abs(c - b) < Math.abs(a - b) ? c : a, Infinity); return [b, n, Math.abs(n - b) <= 4]; });
  fit.push(`check: measured boxes ${chk.map(([b, n, ok]) => `${b}→${Math.round(n)} ${ok ? '✓' : '✗'}`).join(' · ')}`);
} else if (spec && T.h !== spec.frame.h) { fit.push(`frame height ${T.h} → ${spec.frame.h}`); T.h = spec.frame.h; }
const out = path.join(job, 'tree.json'); fs.writeFileSync(out, JSON.stringify(T));
// v6: where each text leaf SHOULD land = the measured reference box, centred on the line box (a glyph box is shorter than its line).
// Only texts that occur once in the reference and once in the tree are used, so a wrong match cannot produce a false position error.
if (spec) {
  const EXPECT = {}, specText = {}, seen = {};
  (function w(x) { if (x.type === 'text' && x.box) (specText[norm(x.text)] = specText[norm(x.text)] || []).push(x.box); (x.children || []).forEach(w); })({ children: spec.sections });
  (function w(o) { seen[o.n] = (seen[o.n] || 0) + 1; (o.c || []).forEach(w); })(T);
  (function w(o) {
    const b = o.k === 't' && seen[o.n] === 1 && (specText[norm(o.t)] || []).length === 1 ? specText[norm(o.t)][0] : null;
    if (b) { const h = o.h || b[3]; EXPECT[o.n] = [b[0], Math.round((b[1] + b[3] / 2 - h / 2) * 10) / 10, b[2], h]; }
    (o.c || []).forEach(w);
  })(T);
  fs.writeFileSync(path.join(job, 'tree.expect.json'), JSON.stringify(EXPECT));
}
const r = door(T, out, spec);
const f = spec && spec.frame, full = want.length && G.hit / want.length >= 0.95, gname = G.f.replace('.tree.json', '');
// uncertainty: what an approved gold tree or a proven rule already answers is an ASSUMPTION, not a question
const assumedL = [], asks = [];                       // ledger entries: { id, text, flip } — flip = the /screen flip key that inverts it, or null
for (const a of r.ask) {
  if (/^density:/.test(a)) { const ff = {}; (function w(o) { if (o.pr && o.pr['Form Factor']) ff[o.pr['Form Factor']] = (ff[o.pr['Form Factor']] || 0) + 1; (o.c || []).forEach(w); })(T);
    const d = Object.entries(ff).sort((x, y) => y[1] - x[1])[0];
    assumedL.push({ id: 'density', flip: 'density', text: full && d ? `density ${d[0]} and text styles as the approved gold "${gname}" (the reference is a brand site at ×${f.text_scale})` : 'density SAP Compact, texts step down ×' + (f ? f.text_scale : 0.85) + ' (proven rule, gold 270:6722)' }); }
  else if (/^brand colour/.test(a) && full) assumedL.push({ id: 'brand-' + a.match(/#[0-9a-f]{6}/i)[0].slice(1), flip: null, text: `brand colour ${a.match(/#[0-9a-f]{6}/i)[0]} → the SAP colour roles of the approved gold "${gname}" (CTA = Button Primary, no painted brand colour)` });
  else if (/icon shapes have no SAP icon/.test(a) && full && !r.out.some(([w]) => w === 'missing')) assumedL.push({ id: 'icons', flip: null, text: "icons = the gold tree's SAP icons for the same meanings" });
  else if (/OCR unsure/.test(a)) { const tx = (a.match(/^text "(.+?)"/) || [])[1] || a.slice(0, 30); assumedL.push({ id: 'ocr-' + norm(tx).slice(0, 12), flip: 'text', text: a.replace(/ is not in the tree.*/, ' kept as read') }); }
  else asks.push(a);
}
const assumed = assumedL.map(x => x.text);
const facts = isImg ? [`reference ${f.w}×${f.h} (screenshot at ×2 read as ×1)`, `${want.length} unique texts, ${(() => { let n = 0; (function w(x) { if (x.type === 'icon') n++; (x.children || []).forEach(w); })({ children: spec.sections }); return n; })()} icons`, `page ${f.fill}`, `accent ${f.accent}`]
  : [`${want.length} key words: ${want.join(', ')}`];
fs.writeFileSync(path.join(job, 'assumed.json'), JSON.stringify({ assumed: assumedL, asks }, null, 1));
fs.writeFileSync(path.join(job, 'front.json'), JSON.stringify({ input, isImg, ms: Date.now() - t0, frame: f || null, want: want.length,
  gold: { name: gname, hit: G.hit, full, next: golds[1] ? golds[1].f.replace('.tree.json', '') : null }, fit,
  door: { out: r.out, ask: r.ask, checked: r.checked }, assumed: assumedL, asks }, null, 1));
console.log([
  `1 ANALYZE  ${facts.join(' · ')} · ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  `2 UNSURE   facts above are measured; decided without asking (low impact):`, ...assumed.map(a => `           · ${a}`),
  asks.length ? `           ASK the user (could change the screen):\n${asks.slice(0, 4).map(a => `           ? ${a}`).join('\n')}` : '           nothing to ask — confidence high',
  `3 DECIDE   gold ${gname} — places ${G.hit}/${want.length} ${isImg ? 'reference texts' : 'request words'}` + (golds[1] ? ` (next ${golds[1].f.replace('.tree.json', '')} ${golds[1].hit}/${want.length})` : ''),
  ...(fit.length ? fit.map(x => `           fit ${x}`) : []),
  report({ ...r, ask: [] }).split('\n').map(l => '           ' + l.trim()).join('\n'),
  `4 PROPOSE  ${r.out.length ? `fix each OUT in ${out} (one pass), re-run: node build/door.js ${out}${spec ? ' --ref ' + path.join(job, 'see-ref/spec.json') : ''}` : `node build/tree.js plan ${out}${spec ? ' --ref ' + path.join(job, 'see-ref/spec.json') : ''} → wireframe · L1-L5 · components → "Approve / Reject / Modify?"`}`,
].join('\n'));
process.exit(r.out.length ? 1 : 0);
