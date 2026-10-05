'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFileSync, spawn } = require('child_process');

const PROJ    = path.resolve(__dirname, '..');
const PORT    = Number(process.env.SAP_BRIDGE_PORT || (() => { try { return require('node:fs').readFileSync(require('node:path').join(__dirname, '..', '.claude', '.bridge-port'), 'utf8').trim(); } catch (_) { return 41778; } })());
const BASE    = `http://localhost:${PORT}`;
const PART_MAX = 7800; // bytes; >= this triggers a new chunk

// ─── Figma mailbox helpers ───────────────────────────────────────────────────

/**
 * splitPlan(plan, jobId) → { job, parts }
 *
 * job   = mbx_job payload   (write to figma.root shared plugin data)
 * parts = array of mbx_part_<id> payloads
 *
 * Invariant: parts[].rows concatenated in order === plan.rows (same objects,
 * same order). Every part JSON is < PART_MAX bytes.
 */
function splitPlan(plan, jobId) {
  const sections = plan.sections || [];
  const allRows  = plan.rows     || [];

  // Index rows by section id
  const rowsBySection = Object.create(null);
  const otherRows     = [];
  const sectionIds    = new Set(sections.map(s => s.id));

  for (const row of allRows) {
    if (row.section && sectionIds.has(row.section)) {
      (rowsBySection[row.section] = rowsBySection[row.section] || []).push(row);
    } else {
      otherRows.push(row);
    }
  }

  const parts    = [];
  const partIds  = [];

  function flush(id, sectionObj, rows) {
    const part = { id, section: sectionObj, rows };
    parts.push(part);
    partIds.push(id);
  }

  const bytes = (o) => Buffer.byteLength(JSON.stringify(o), 'utf8');

  // Rows per section; a section that does not fit one part becomes A.1, A.2, … (section only in .1)
  for (const sec of sections) {
    const rows     = rowsBySection[sec.id] || [];
    const secStrip = { id: sec.id, name: sec.name, describe: sec.describe,
                       box: sec.box, layout: sec.layout, sap: sec.sap, recipe: sec.recipe };
    const chunks = [];
    let cur = [];
    for (const row of rows) {
      const next = cur.concat([row]);
      const head = chunks.length === 0 ? secStrip : null;
      if (cur.length && bytes({ id: `${sec.id}.00`, section: head, rows: next }) >= PART_MAX) {
        chunks.push(cur);
        cur = [row];
      } else {
        cur = next;
      }
      const alone = { id: `${sec.id}.00`, section: chunks.length === 0 ? secStrip : null, rows: cur };
      if (cur.length === 1 && bytes(alone) >= PART_MAX) {
        throw new Error(`section ${sec.id}: one row (${row.element || '?'}) does not fit a ${PART_MAX}-byte part`);
      }
    }
    if (cur.length || !chunks.length) chunks.push(cur);
    chunks.forEach((c, i) => flush(chunks.length === 1 ? sec.id : `${sec.id}.${i + 1}`, i === 0 ? secStrip : null, c));
  }

  // Rows with no matching section go to _other
  if (otherRows.length) {
    flush('_other', null, otherRows);
  }

  // Collect logo elements from rows
  const logos = allRows
    .filter(r => r.kind === 'logo' && r.crop)
    .map(r => r.element)
    .filter(Boolean);

  const job = {
    jobId,
    kind  : 'plan',
    name  : plan._doc ? String(plan._doc).slice(0, 120)
          : `${(plan.frame && plan.frame.floorplan) || 'Screen'} ${(plan.frame && plan.frame.w) || '?'}×${(plan.frame && plan.frame.h) || '?'}`,
    frame : plan.frame || null,
    parts : partIds,
    logos,
    at    : Date.now(),
  };

  return { job, parts };
}

/**
 * splitFix(fixText, { jobId, nodeId, round }) → mbx_fix payload
 */
function splitFix(fixText, { jobId, nodeId, round }) {
  const lines = String(fixText)
    .split('\n')
    .map(l => l.trim().replace(/^[-*]\s+/, ''))
    .filter(Boolean)
    .slice(0, 200);
  return { jobId, nodeId, round, lines };
}

module.exports = { splitPlan, splitFix };

// ─── CLI ─────────────────────────────────────────────────────────────────────
const LABEL = 'com.sap.v4-bridge';
const PLIST = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);
const TOKEN_FILE = path.join(PROJ, '.claude', '.bridge-token');
const PAIR_FILE = path.join(PROJ, '.claude', '.bridge-pair.json');
const OUT = path.join(PROJ, 'bridge-out');
const LOG = path.join(OUT, 'bridge.log');
const AGENT_LOG = path.join(os.homedir(), 'Library', 'Logs', 'sap-v4-bridge.log');   // launchd opens this file itself: ~/Downloads is privacy-protected (exit 78, 2026-10-04)
const SERVER = path.join(PROJ, 'bridge', 'server.js');
const USAGE = `node build/mailbox.js <command>
  install                     always-on bridge (macOS LaunchAgent ${LABEL}), starts at login
  uninstall                   remove the LaunchAgent
  ensure                      start the bridge if it is down
  restart [--force]           stop the running bridge, start it again (after a bridge update); refuses while a build runs
  status                      bridge + Figma connection
  unpair                      let the SAP Bridge plugin pair again
  push <plan.json> [--ref <image>] [--file-key <key>]   plan → Figma Agent mailbox
  wait <jobId> [--timeout <sec>]                        block until the job ends`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => process.getuid();
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const readToken = () => { try { return fs.readFileSync(TOKEN_FILE, 'utf8').trim() || null; } catch (_) { return null; } };
const opt = (args, name, dflt) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };

async function health() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2500) });
    return await r.json();
  } catch (_) { return null; }
}
async function api(route, body) {
  const token = readToken();
  if (!token) throw new Error('no CLI token yet (.claude/.bridge-token) — run: node build/mailbox.js ensure');
  const sep = route.includes('?') ? '&' : '?';
  const r = await fetch(`${BASE}${route}${sep}token=${encodeURIComponent(token)}`, body === undefined
    ? { signal: AbortSignal.timeout(8000) }
    : { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}
async function waitHealthy(sec) {
  for (let i = 0; i < sec * 2; i++) {
    const h = await health();
    if (h && h.app === 'sap-v4-bridge') return h;
    await sleep(500);
  }
  return null;
}
function launchctl(...a) {
  return execFileSync('/bin/launchctl', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}
function which(bin) {
  try { return execFileSync('/usr/bin/which', [bin], { encoding: 'utf8' }).trim() || null; } catch (_) { return null; }
}
function listenerPid() {
  try { return execFileSync('/usr/sbin/lsof', ['-ti', `tcp:${PORT}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).trim().split('\n')[0] || null; } catch (_) { return null; }
}
function tail(file, n) {
  try { return fs.readFileSync(file, 'utf8').trim().split('\n').slice(-n).join('\n'); } catch (_) { return '(no log)'; }
}

const COMMANDS = {
  async install() {
    fs.mkdirSync(OUT, { recursive: true });
    fs.mkdirSync(path.dirname(PLIST), { recursive: true });
    const h = await health();
    if (h && h.app !== 'sap-v4-bridge') {
      console.error(`Port ${PORT} is used by another bridge (pid ${listenerPid() || '?'}). Stop it, then run install again.`);
      process.exit(3);
    }
    if (h && !fs.existsSync(PLIST)) {
      const pid = listenerPid();
      if (pid) { console.log(`Stopping the hand-started bridge (pid ${pid}); the LaunchAgent takes over.`); try { process.kill(Number(pid), 'SIGTERM'); } catch (_) {} await sleep(800); }
    }
    const claude = which('claude');
    const env = { PATH: `${path.dirname(process.execPath)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: os.homedir() };
    if (claude) env.SAP_CLAUDE_BIN = claude;
    const envXml = Object.entries(env).map(([k, v]) => `    <key>${xml(k)}</key><string>${xml(v)}</string>`).join('\n');
    fs.writeFileSync(PLIST, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(process.execPath)}</string>
    <string>${xml(SERVER)}</string>
  </array>
  <key>WorkingDirectory</key><string>${xml(PROJ)}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${xml(AGENT_LOG)}</string>
  <key>StandardErrorPath</key><string>${xml(AGENT_LOG)}</string>
  <key>EnvironmentVariables</key>
  <dict>
${envXml}
  </dict>
</dict>
</plist>
`);
    try { launchctl('bootout', `gui/${uid()}/${LABEL}`); } catch (_) {}
    await sleep(500);
    launchctl('bootstrap', `gui/${uid()}`, PLIST);
    const ok = await waitHealthy(10);
    if (!ok) { console.error(`The bridge did not start. Last log lines:\n${tail(LOG, 15)}`); process.exit(1); }
    console.log(`Bridge installed · always on · http://localhost:${PORT} · branch ${ok.branch} · claude ${claude || 'NOT FOUND on PATH'}`);
  },

  async uninstall() {
    try { launchctl('bootout', `gui/${uid()}/${LABEL}`); } catch (_) {}
    try { fs.unlinkSync(PLIST); } catch (_) {}
    console.log(`LaunchAgent ${LABEL} removed.`);
  },

  async ensure() {
    const h = await health();
    if (h && h.app === 'sap-v4-bridge') { console.log('Bridge running.'); return; }
    if (h) {
      console.error(`Port ${PORT} is used by another bridge (pid ${listenerPid() || '?'}). Stop it, then run: node build/mailbox.js ensure`);
      process.exit(3);
    }
    fs.mkdirSync(OUT, { recursive: true });
    if (fs.existsSync(PLIST)) {
      try { launchctl('kickstart', '-k', `gui/${uid()}/${LABEL}`); } catch (_) { try { launchctl('bootstrap', `gui/${uid()}`, PLIST); } catch (_) {} }
    } else {
      const fd = fs.openSync(LOG, 'a');
      spawn(process.execPath, [SERVER], { cwd: PROJ, detached: true, stdio: ['ignore', fd, fd] }).unref();
    }
    const ok = await waitHealthy(10);
    if (!ok) { console.error(`The bridge did not start. Last log lines:\n${tail(LOG, 15)}`); process.exit(3); }
    console.log('Bridge started.');
  },

  async restart(...args) {
    const h = await health();
    if (h && h.app !== 'sap-v4-bridge') { console.error(`Port ${PORT} is used by another program, not the SAP bridge. Not touching it.`); process.exit(3); }
    if (h && h.busy && !args.includes('--force')) { console.error('The bridge is running a job. Wait for it, or run: node build/mailbox.js restart --force'); process.exit(3); }
    if (h) {
      const pid = listenerPid();
      if (pid) { try { process.kill(Number(pid), 'SIGTERM'); } catch (_) {} }
      for (let i = 0; i < 24 && (await health()); i++) await sleep(250);
      if (await health()) { console.error('The bridge did not stop. Stop it by hand, then run: node build/mailbox.js ensure'); process.exit(3); }
      console.log('Bridge stopped.');
    }
    await COMMANDS.ensure();
  },

  async status() {
    const h = await health();
    const agent =fs.existsSync(PLIST) ? 'yes' : 'no';
    if (!h) { console.log(`bridge:      not running (LaunchAgent installed: ${agent})`); process.exit(3); }
    if (h.app !== 'sap-v4-bridge') { console.log(`bridge:      port ${PORT} is used by another bridge`); process.exit(3); }
    console.log(`bridge:      running · branch ${h.branch} · model ${h.model} · ${h.busy ? 'busy' : 'idle'} · LaunchAgent ${agent}`);
    console.log(`paired:      ${h.paired ? 'yes' : 'no — open SAP Bridge in Figma, it pairs by itself'}`);
    console.log(h.figma && h.figma.lastSeenSec < 60
      ? `figma:       connected · ${h.figma.fileName || h.figma.fileKey} · seen ${h.figma.lastSeenSec}s ago`
      : 'figma:       not connected — open SAP Bridge in Figma');
  },

  async unpair() {
    try { fs.unlinkSync(PAIR_FILE); } catch (_) {}
    console.log('Unpaired. Open SAP Bridge in Figma; it pairs by itself.');
  },

  async push(file, ...rest) {
    if (!file) { console.error(USAGE); process.exit(2); }
    const plan = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
    let ref = opt(rest, '--ref', null);
    if (ref) {
      let abs = path.resolve(ref);
      if (!fs.existsSync(abs)) { console.error(`--ref not found: ${ref}`); process.exit(2); }
      if (path.relative(PROJ, abs).startsWith('..')) {            // e.g. the scratchpad → copy into the repo
        const dest = path.join(OUT, 'refs', `${Date.now()}-${path.basename(abs)}`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(abs, dest);
        abs = dest;
      }
      ref = path.relative(PROJ, abs);
    }
    await COMMANDS.ensure();
    const { status, json } = await api('/mbx/push', { plan, ref, fileKey: opt(rest, '--file-key', undefined) });
    if (status !== 200) { console.error(`push failed (${status}): ${json.error || ''}`); process.exit(1); }
    const h = await health();
    console.log(h && h.figma && h.figma.lastSeenSec < 60
      ? `Plan sent to ${h.figma.fileName || h.figma.fileKey}. In Figma, type in the Figma Agent: build plan`
      : 'Plan queued. Open SAP Bridge in Figma — it picks the plan up, then type in the Figma Agent: build plan');
    console.log(`jobId: ${json.jobId}`);
  },

  async wait(jobId, ...rest) {
    if (!jobId) { console.error(USAGE); process.exit(2); }
    const end = Date.now() + Number(opt(rest, '--timeout', 1800)) * 1000;
    let lastOk = Date.now();
    let shown = 0;
    while (Date.now() < end) {
      let s = null;
      try { const r = await api(`/job/status?jobId=${encodeURIComponent(jobId)}`); if (r.status === 200) s = r.json; } catch (_) {}
      if (s) {
        lastOk = Date.now();
        for (const st of (s.stages || []).slice(shown)) console.log(`▸ ${st.name}  ${st.text}`);
        shown = (s.stages || []).length;
        if (s.phase === 'done' || s.phase === 'error') {
          console.log(JSON.stringify(s.result, null, 2));
          process.exit(s.result && s.result.pass === true ? 0 : 1);
        }
      } else if (Date.now() - lastOk > 60000) {
        console.error('The bridge is unreachable for 60 s.'); process.exit(3);
      }
      await sleep(3000);
    }
    console.error('Timed out.');
    process.exit(1);
  },
};

if (require.main === module) {
  const [, , cmd, ...args] = process.argv;
  if (!COMMANDS[cmd]) { console.error(USAGE); process.exit(2); }
  COMMANDS[cmd](...args).catch((e) => { console.error(e.message || String(e)); process.exit(1); });
}
