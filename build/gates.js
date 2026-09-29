#!/usr/bin/env node
// gates.js — the one end gate. Claude reports only what this prints.
//   node build/gates.js <plan.json> <jobDir> [--ref ref.png] [--record "<request>" --node <id> [--via <how>] [--rounds n] [--ms n]]
// Reads <jobDir>/tree.json (dump-tree), <jobDir>/build@2x.png + geometry.json (with a reference).
// Writes <jobDir>/audit.txt and <jobDir>/see-out/ (diff-sheet.png, fix.md).
// Pass = MATCH ≥ 90 %, hygiene 0, STRUCTURE 0 (build/structure.js: boxes, nesting, collapsed, hidden, overlapping), and with a
// reference EYE ≥ 95 %. MATCH cannot see where things are; a low EYE is never 'a known limitation'. Exit 0 = pass, 1 = not, 2 = usage.
// --record: only on a measured pass — plan → knowledge/plans-cache/<sha>.plan.json, one line → run log.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const PROJ = path.resolve(__dirname, '..');
const MEMORY_DIR = process.env.SAP_BRIDGE_MEMORY_DIR || path.join(os.homedir(), '.claude', 'projects', PROJ.replace(/[^A-Za-z0-9]/g, '-'), 'memory');

function sh(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: PROJ, timeout: 240000, maxBuffer: 16 << 20 }, (err, stdout, stderr) =>
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, out: String(stdout || '') + String(stderr || '') }));
  });
}

// { plan, jobDir, ref?, auditName?, seeName? } → { match, hygiene, eye, missing[], pass }
async function measure({ plan, jobDir, ref, spec, auditName = 'audit.txt', seeName = 'see-out' }) {
  if (!plan || !fs.existsSync(plan)) return null;
  const tree = path.join(jobDir, 'tree.json');
  const shot = path.join(jobDir, 'build@2x.png');
  const geom = path.join(jobDir, 'geometry.json');
  const g = { match: null, hygiene: null, eye: null, structure: null, structureLines: [], missing: [] };
  if (fs.existsSync(tree)) {
    const a = await sh(process.execPath, [path.join('build', 'audit-plan.js'), plan, tree]);
    fs.writeFileSync(path.join(jobDir, auditName), a.out);
    const m = a.out.match(/MATCH\s+(\d+)%/); if (m) g.match = Number(m[1]);
    const h = a.out.match(/HYGIENE\s*\((\d+)\)/); if (h) g.hygiene = Number(h[1]);
  } else g.missing.push('tree.json');
  if (ref) {
    if (fs.existsSync(shot)) {
      const args = [path.join('build', 'see.py'), 'diff', ref, shot, '--out', path.join(jobDir, seeName)];
      if (fs.existsSync(geom)) args.push('--tree', geom);
      const e = await sh('python3', args);
      const m = e.out.match(/EYE MATCH\s+(\d+)%/); if (m) g.eye = Number(m[1]); else g.missing.push('eye result');
    } else g.missing.push('build@2x.png');
  }
  if (fs.existsSync(geom)) {                                       // where things are (MATCH is blind to it)
    const sp = spec || [path.join(jobDir, 'spec.json'), path.join(jobDir, 'see-ref', 'spec.json'), path.join(jobDir, '..', 'see-ref', 'spec.json')].find(f => fs.existsSync(f));
    try { g.structureLines = require('./structure.js').check(JSON.parse(fs.readFileSync(geom, 'utf8')), ref && sp ? JSON.parse(fs.readFileSync(sp, 'utf8')) : null); g.structure = g.structureLines.length; }
    catch (e) { g.missing.push('geometry.json unreadable'); }
  } else if (ref) g.missing.push('geometry.json');
  g.pass = !g.missing.length && g.match >= 90 && g.hygiene === 0 && !g.structure && (!ref || g.eye >= 95);
  return g;
}

function blocksOf(g) {
  const b = [];
  if (g.missing.length) b.push(`gate files missing: ${g.missing.join(', ')}`);
  if (g.match != null && g.match < 90) b.push(`MATCH ${g.match}% < 90`);
  if (g.hygiene) b.push(`hygiene ${g.hygiene}`);
  if (g.structure) b.push(`structure ${g.structure}`);
  if (g.eye != null && g.eye < 95) b.push(`EYE ${g.eye}% < 95`);
  return b;
}

// Only a MEASURED pass may write the plan cache and the run log (a claimed pass once overwrote a gold plan).
function record({ plan, ref, g, text, nodeId, via, rounds, ms }) {
  if (!g || !g.pass) return false;
  try {
    if (ref && fs.existsSync(plan)) {
      const sha = crypto.createHash('sha1').update(fs.readFileSync(ref)).digest('hex').slice(0, 12);
      const dest = path.join(PROJ, 'knowledge', 'plans-cache', `${sha}.plan.json`);
      if (!fs.existsSync(dest)) fs.copyFileSync(plan, dest);
    }
  } catch (_) {}
  try {
    const time = ms ? ` · ${Math.floor(ms / 60000)}m ${Math.round(ms / 1000) % 60}s` : '';
    const line = `- ${new Date().toISOString().slice(0, 10)} · "${String(text || '').slice(0, 60)}" → ${nodeId} · via ${via} · measured MATCH ${g.match}% · EYE ${g.eye == null ? '—' : g.eye + '%'} · gate rounds ${rounds || 0}${time} · PASS\n`;
    const logf = path.join(MEMORY_DIR, 'v4-run-log.md');
    const cur = fs.existsSync(logf) ? fs.readFileSync(logf, 'utf8') : '';
    const at = cur.lastIndexOf('\nRelated:');
    fs.writeFileSync(logf, at >= 0 ? cur.slice(0, at + 1) + line + cur.slice(at + 1) : cur + line);
  } catch (_) {}
  return true;
}

module.exports = { measure, record, blocksOf };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const [plan, jobDir] = argv;
  if (!plan || !jobDir || plan.startsWith('--')) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 7).join('\n'));
    process.exit(2);
  }
  const ref = opt('--ref');
  (async () => {
    const g = await measure({ plan, jobDir, ref });
    if (!g) { console.log(`plan not found: ${plan}`); process.exit(2); }
    const pc = (v) => (v == null ? '—' : v + '%');
    console.log(`MATCH ${pc(g.match)} · HYGIENE ${g.hygiene == null ? '?' : g.hygiene} · STRUCTURE ${g.structure == null ? '?' : g.structure} · EYE ${ref ? pc(g.eye) : '— (no reference)'}`);
    for (const l of g.structureLines.slice(0, 8)) console.log('  ' + l);
    console.log(`lines: ${path.join(jobDir, 'audit.txt')}${ref ? ` · ${path.join(jobDir, 'see-out', 'fix.md')} · ${path.join(jobDir, 'see-out', 'diff-sheet.png')}` : ''}`);
    if (ref && g.eye != null && g.eye < 95) {                      // never dismissed: the fix list is read, line by line
      try { const f = fs.readFileSync(path.join(jobDir, 'see-out', 'fix.md'), 'utf8').split('\n').filter(l => /^\s*\d+ |^- /.test(l) && !/SAP LOOK|brand→SAP|EXTRA/.test(l)); if (f.length) console.log('FIX LINES (read them — a low EYE is not "a known limitation"):\n' + f.slice(0, 8).map(l => '  ' + l.trim().slice(0, 150)).join('\n')); } catch (_) {}
    }
    const b = blocksOf(g);
    console.log(g.pass ? 'PASS' : `NOT PASSED — ${b.join('; ')}`);
    if (argv.includes('--record')) {
      const ok = record({ plan, ref, g, text: opt('--record'), nodeId: opt('--node') || '?', via: opt('--via') || '/screen',
        rounds: Number(opt('--rounds') || 0), ms: Number(opt('--ms') || 0) });
      console.log(ok ? 'recorded: plan cache + run log' : 'not recorded (only a measured pass is recorded)');
    }
    process.exit(g.pass ? 0 : 1);
  })();
}
