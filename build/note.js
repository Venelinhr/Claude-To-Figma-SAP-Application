// note.js — progress of run.js → the bridge (/note) → the SAP Bridge plugin chat. Silent on any failure; never blocks a run.
// One run = one chat turn: "RUN v6 …" opens it, every line is a step, the plan is shown as a block, end() closes it with the TOTAL time of the job
// (all resumes together) and one clear final message.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const PROJ = path.join(__dirname, '..');
const STAGE = [[/^(ANALYZE|GOLD|MARKS|PHOTOS|AUTONAME|READ|FROM ZERO|RUN )/, 'analyse'], [/^(DOOR|ASSUMED|SIM|SMASH|PLAN|NEED|ASK|STOP|OUT)/, 'plan'], [/^(LOGOS|https:|BRIDGE|BUILD|elapsed)/, 'execute'], [/^(MATCH|STATUS|STRUCT|HYGIENE|diff|BOX|FIX|NEXT|TEXT|FAKE)/, 'check']];
const S = { url: '', gate: '', status: '', job: '', started: 0, why: '', did: [], comps: '' };   // did / comps: what the run REALLY did, for the final message
function post(body) {
  try {
    const tf = process.env.SAP_BRIDGE_TOKEN_FILE || path.join(PROJ, '.claude', '.bridge-token'); const token = fs.readFileSync(tf, 'utf8').trim();
    spawnSync('curl', ['-s', '-m', '2', '-X', 'POST', '-H', 'content-type: application/json', '--data-binary', '@-',
      `http://localhost:${process.env.SAP_BRIDGE_PORT || (() => { try { return fs.readFileSync(path.join(PROJ, '.claude', '.bridge-port'), 'utf8').trim(); } catch (_) { return 41778; } })()}/note?token=${encodeURIComponent(token)}`], { input: JSON.stringify(body), timeout: 2500, stdio: ['pipe', 'ignore', 'ignore'] });
  } catch (_) {}
}
function note(line) {
  try {
    const text = String(line).replace(/\s+/g, ' ').trim().slice(0, 280); if (!text || /^(READ|NEED|NEXT) /.test(text) || /^NEXT\b/.test(text) || /^STOP .*(VERBATIM|Approve \/ Reject)/.test(text)) return;   // NEED / NEXT are instructions for Claude, never for the user's chat
    const u = text.match(/https:\/\/www\.figma\.com\/design\/\S+/); if (u) S.url = u[0];
    if (/^MATCH /.test(text)) S.gate = text; if (/^STATUS /.test(text)) S.status = text; if (/^(SIM ✗|DOOR ✗|STOP|NEED)/.test(text) && !S.why) S.why = text;
    if (/^(DESIGN spec|SAP SPACING|DOOR ✓|SMASH ✓|FROM ZERO|GOLD .*adapted)/.test(text)) S.did.push(text.replace(/^DESIGN spec → tree · /, 'SAP design: ').replace(/layout inferred by spec2tree · /, '').replace(/ · page edge [^·]*$/, '').replace(/^SAP SPACING /, 'SAP spacing: ').replace(/^DOOR ✓ ALL IN · /, 'kit check passed · ').replace(/^SMASH ✓ 0/, 'no overlaps'));
    const hit = STAGE.find(([re]) => re.test(text));
    post({ name: hit ? hit[1] : 'analyse', text, job: S.job });
  } catch (_) {}
}
module.exports = note;
module.exports.job = (job, started) => { S.job = job || ''; S.started = started || 0; };
module.exports.block = (title, body) => { const m = /^Components\s+(.+)$/m.exec(String(body || '')); if (m) S.comps = m[1].trim(); return _block(title, body); };
const _block = (title, body) => post({ name: 'plan', text: title, block: String(body || '').slice(0, 24000), job: S.job });
// a change made directly in Figma: ends the turn with "Done — change: …" (the plugin adds a history row with the frame link and keeps the older rows)
module.exports.endChange = (text, url) => post({ name: 'end', text: 'Done — change: ' + String(text).slice(0, 240), total: S.started ? Date.now() - S.started : 0, url: url || '', job: S.job, block: '' });
module.exports.end = code => {
  let total = S.started ? Date.now() - S.started : 0;
  if (total > 3600000) total = Math.round(process.uptime() * 1000);   // a job resumed hours later: show this run's time, not the time since the first request
  if (!S.comps && S.job) try {                                                   // a resumed run has no plan block: count the kit parts in the job's tree
    const T = JSON.parse(fs.readFileSync(path.join(PROJ, S.job, 'tree.json'), 'utf8')), c = {};
    (function w(o) { if (o.k === 'i') c[o.cp] = (c[o.cp] || 0) + 1; (o.c || []).forEach(w); })(T.tree || T);
    S.comps = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + (v > 1 ? ' ×' + v : '')).join(' · ');
  } catch (_) {}
  const what = () => (S.comps ? '\nSAP parts: ' + S.comps + '.' : '') + (S.did.length ? '\nWhat I did: ' + [...new Set(S.did)].join(' · ') + '.' : '');
  const msg = code === 0 ? `Done. The screen is in Figma${S.gate ? ' — ' + S.gate : ''}.${what()}`
    : code === 5 ? 'The plan is ready (above). Nothing is built yet — Approve, Reject or Modify.'
    : code === 6 ? `Built in Figma (draft).${what()}${/EYE (\d+)/.test(S.gate) ? '\nLooks ' + /EYE (\d+)/.exec(S.gate)[1] + ' % like your picture — lower is expected: it is redrawn with SAP parts and SAP spacing, not copied.' : ''}`
    : code === 2 ? `Waiting for a decision: ${S.why || 'see Claude Code'}`
    : code === 3 ? 'The bridge or the plugin was not reachable.'
    : `Stopped: ${S.why || 'exit ' + code}`;
  post({ name: 'end', text: msg, total, url: S.url, job: S.job, block: '' });
};
