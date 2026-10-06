#!/usr/bin/env node
/*
 * bridge/server.js — SAP Agent v2 localhost bridge.
 *
 * Figma plugins run in a sandbox and CANNOT call Claude (MCP is Claude->Figma only).
 * This bridge is the middleman:
 *
 *   v2 plugin  --HTTP(127.0.0.1)-->  this bridge  --spawn headless claude-->  Claude
 *   Claude  --use_figma (MCP)-->  Figma      (the existing, proven direction)
 *
 * Two-turn flow, ONE live claude child per run (never stdin.end() between turns,
 * never per-turn --resume — a re-init fires SessionStart which WIPES .wireframe-approved):
 *   TURN 1 (/run)     read-only wireframe proposal; bridge writes .claude/.agent-turn1
 *                     sentinel so guard-agent-turn1.sh hard-blocks any use_figma.
 *   TURN 2 (/approve) bridge DELETES the sentinel, then sends the user's LITERAL approval
 *                     words as the 2nd stream-json turn. capture-approvals.sh (a real
 *                     UserPromptSubmit) writes .wireframe-approved from those words, then
 *                     Claude clones+builds beside the original.
 *
 * INVARIANT: this bridge NEVER writes .wireframe-approved / .scratch-approved / .reuse-declared.
 * It only relays the user's keystrokes into a genuine claude turn; the hooks do the writing.
 * (build-v2.sh grep-asserts this file never touches those markers.)
 *
 * Node core only (http, child_process, crypto, fs, path) — no dependencies, no npm install.
 * Verified on claude 2.1.207: stream-json requires --verbose; figma tools need
 * bypassPermissions (acceptEdits blocks them); one held-open stdin = one session_id.
 */
'use strict';

const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// ── Config ───────────────────────────────────────────────────────────────────
const PROJ = path.resolve(__dirname, '..');               // the project dir (cwd for claude)
let PORT = Number(process.env.SAP_BRIDGE_PORT || 41778);   // busy by a foreign process → the next free one up to +9 (the plugin scans 41778–41787); written to .claude/.bridge-port
const PORT_FIXED = !!process.env.SAP_BRIDGE_PORT;
const PORT_FILE = path.join(__dirname, '..', '.claude', '.bridge-port'); // v4 SAP Bridge (plugin/sap-bridge/manifest.json); the old SAP Agent v2 bridge keeps 41777
const HOST = '127.0.0.1';                                  // loopback ONLY — never 0.0.0.0
const TURN1_SENTINEL = path.join(PROJ, '.claude', '.agent-turn1');
const TOKEN_FILE = process.env.SAP_BRIDGE_TOKEN_FILE || path.join(PROJ, '.claude', '.bridge-token');
function loadOrCreateToken() {
  try {
    const t = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (t && t.length >= 32) {
      // SECURITY FIX 2026-07-21: repair perms if the token file is group/other-readable.
      try { fs.chmodSync(TOKEN_FILE, 0o600); } catch (_) {}
      return t;
    }
  } catch (_) {}
  const t = crypto.randomBytes(24).toString('hex');
  // SECURITY FIX 2026-07-21: create dir 0700 + write token 0600 (was default umask → world-readable).
  try { fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 }); } catch (_) {}
  fs.writeFileSync(TOKEN_FILE, t, { encoding: 'utf8', mode: 0o600 });
  return t;
}
const TOKEN = loadOrCreateToken();
const TURN1_TIMEOUT_MS = 300000;  // 5 min to produce a wireframe
const TURN2_TIMEOUT_MS = 600000;  // 10 min to build

// Markers the bridge is FORBIDDEN to write (self-check; also enforced by build-v2.sh grep).
const FORBIDDEN_MARKERS = ['.wireframe-approved', '.scratch-approved', '.reuse-declared'];

// ── Run state (keyed by runId) ────────────────────────────────────────────────
/** @type {Map<string, Run>} */
const runs = new Map();

// SECURITY/RESOURCE FIX 2026-07-21: bound the runs map + per-run event log so a long-lived
// bridge cannot leak memory unboundedly (runs were never deleted; events grew forever).
const MAX_CONCURRENT_RUNS = 8;     // reject new /run past this many live runs
const MAX_EVENTS_PER_RUN = 2000;   // ring-buffer cap on a single run's event log
const RUN_TTL_AFTER_DONE_MS = 60000; // evict a done/error run 60s after it settles (allows final poll/SSE drain)

function liveRunCount() {
  let n = 0;
  for (const r of runs.values()) if (r.phase !== 'done' && r.phase !== 'error') n++;
  return n;
}

function scheduleEviction(run) {
  if (run._evictTimer) return;
  run._evictTimer = setTimeout(() => {
    try { clearInterval(run._ka); } catch (_) {}
    for (const res of run.sseClients) { try { res.end(); } catch (_) {} }
    run.sseClients.clear();
    runs.delete(run.id);
  }, run.ttl || RUN_TTL_AFTER_DONE_MS);
  if (run._evictTimer.unref) run._evictTimer.unref();
}

function newRun() {
  const id = crypto.randomBytes(8).toString('hex');
  const run = {
    id,
    child: null,
    phase: 'starting',          // starting -> awaiting-wireframe -> need-approval -> building -> done|error
    events: [],                 // event log (for SSE replay + /poll fallback)
    sseClients: new Set(),      // active SSE res objects
    stdoutBuf: '',              // partial stream-json line buffer
    turnResultText: '',         // accumulates assistant text for the current turn
    selection: null,
    fileKey: null,
    timer: null,
    childExited: false,
  };
  runs.set(id, run);
  return run;
}

// ── Event emission (append + fan out to SSE + resolve long-polls) ──────────────
function emit(run, type, data) {
  const evt = { seq: run.events.length, type, data: data || {}, at: Date.now() };
  run.events.push(evt);
  // Ring-buffer cap: keep the log bounded on long/chatty runs (seq stays monotonic via .length).
  if (run.events.length > MAX_EVENTS_PER_RUN) {
    run.events.splice(0, run.events.length - MAX_EVENTS_PER_RUN);
  }
  const payload = `event: ${type}\ndata: ${JSON.stringify(evt)}\n\n`;
  for (const res of run.sseClients) {
    try { res.write(payload); } catch (_) { /* client gone */ }
  }
  // wake any long-poll waiters
  if (run._pollWaiters) {
    const waiters = run._pollWaiters; run._pollWaiters = [];
    for (const w of waiters) { try { w(); } catch (_) {} }
  }
  // Terminal phases → schedule cleanup so the run + its buffers are released.
  if (type === 'done' || type === 'error') scheduleEviction(run);
  if (run.kind === 'job') touchJob(run);
}

// ── Claude child lifecycle ─────────────────────────────────────────────────────
function spawnChild(run) {
  const sessionId = crypto.randomUUID();
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--input-format', 'stream-json',
    '--verbose',                              // REQUIRED with stream-json output
    '--session-id', sessionId,
    '--add-dir', PROJ,
    '--permission-mode', 'bypassPermissions', // acceptEdits BLOCKS figma MCP tools; verified
  ];
  const child = spawn('claude', args, {
    cwd: PROJ,                                // so PROJ's hooks fire + markers land in PROJ/.claude
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });
  run.child = child;
  run.childExited = false;
  run.sessionId = sessionId;

  child.stdout.on('data', (buf) => onChildStdout(run, buf));
  child.stderr.on('data', (buf) => {
    const s = buf.toString().trim();
    if (s) emit(run, 'progress', { text: `[stderr] ${s.slice(0, 400)}` });
  });
  child.on('exit', (code) => {
    run.childExited = true;
    if (run.phase !== 'done' && run.phase !== 'need-approval') {
      fail(run, `agent process exited (code ${code}) before completing`);
    }
  });
  child.on('error', (err) => fail(run, `failed to start agent: ${err.message}`));
  return child;
}

// Spawn a new child that RESUMES the session from Turn 1 and immediately sends Turn 2.
// Called by /approve when the original child has already exited (normal for stream-json).
function spawnChildResume(run, turn2Content) {
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--input-format', 'stream-json',
    '--verbose',
    '--resume', run.sessionId,
    '--add-dir', PROJ,
    '--permission-mode', 'bypassPermissions',
  ];
  const child = spawn('claude', args, {
    cwd: PROJ,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, SAP_BRIDGE_TURN2: '1' }, // tells clear-reuse-marker.sh to skip the wipe
  });
  run.child = child;
  run.childExited = false;

  child.stdout.on('data', (buf) => onChildStdout(run, buf));
  child.stderr.on('data', (buf) => {
    const s = buf.toString().trim();
    if (s) emit(run, 'progress', { text: `[stderr] ${s.slice(0, 400)}` });
  });
  child.on('exit', (code) => {
    run.childExited = true;
    if (run.phase !== 'done') {
      fail(run, `agent process exited (code ${code}) during build`);
    }
  });
  child.on('error', (err) => fail(run, `failed to resume agent: ${err.message}`));

  // Send Turn 2 immediately — this is the only turn this resumed process handles.
  const envelope = JSON.stringify({ type: 'user', message: { role: 'user', content: turn2Content } }) + '\n';
  child.stdin.write(envelope);
  child.stdin.end(); // single-turn resumed process — close stdin after sending
  return child;
}

// Parse the child's stream-json stdout line by line.
function onChildStdout(run, buf) {
  run.stdoutBuf += buf.toString();
  let nl;
  while ((nl = run.stdoutBuf.indexOf('\n')) >= 0) {
    const line = run.stdoutBuf.slice(0, nl).trim();
    run.stdoutBuf = run.stdoutBuf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch (_) { continue; }
    if (run.kind === 'job') handleJobMessage(run, msg);
    else handleChildMessage(run, msg);
  }
}

function handleChildMessage(run, msg) {
  // assistant text chunk -> progress (and accumulate for the turn's final text)
  if (msg.type === 'assistant' && msg.message && Array.isArray(msg.message.content)) {
    for (const block of msg.message.content) {
      if (block.type === 'text' && block.text) {
        run.turnResultText += block.text;
        if (run.phase === 'building') emit(run, 'building', {});
        emit(run, 'progress', { text: block.text });
      }
    }
    return;
  }
  // a permission-denied / hook-block tool_result during turn 1 = framing failure
  if (msg.type === 'user' && msg.message && Array.isArray(msg.message.content)) {
    for (const block of msg.message.content) {
      if (block.type === 'tool_result' && block.is_error && run.phase === 'awaiting-wireframe') {
        // Distinguish a real read-only-gate block (guard-agent-turn1.sh forbids use_figma on
        // turn 1) from an ordinary read error (e.g. get_metadata on a node not in the open file).
        // Only the former means the agent tried to BUILD before approval; the latter is benign.
        const errText = Array.isArray(block.content)
          ? block.content.map((c) => c && c.text ? c.text : '').join(' ')
          : (typeof block.content === 'string' ? block.content : '');
        if (/TURN 1 is READ-ONLY|use_figma is forbidden/i.test(errText)) {
          emit(run, 'progress', { text: '[agent] turn-1 tried to build; blocked by the read-only gate (expected — will produce the wireframe as text).' });
        }
        // else: a normal tool error (bad node id, MCP hiccup) — let the agent recover silently.
      }
    }
    return;
  }
  // result = end of a turn
  if (msg.type === 'result') {
    const text = (typeof msg.result === 'string' && msg.result) || run.turnResultText || '';
    run.turnResultText = '';
    if (run.phase === 'awaiting-wireframe') {
      // Turn 1 complete: this is the wireframe.
      run.phase = 'need-approval';
      const clean = text.replace(/\bAGENT_WIREFRAME_READY\b\s*$/,'').trim();
      emit(run, 'wireframe', { text: clean });
      emit(run, 'need-approval', { runId: run.id });
      clearTimeout(run.timer);
    } else if (run.phase === 'building') {
      // Turn 2 complete: parse AGENT_RESULT.
      const m = text.match(/AGENT_RESULT\s+(\{[\s\S]*?\})/);
      if (m) {
        let result;
        try { result = JSON.parse(m[1]); } catch (_) { result = null; }
        if (result && result.nodeId) {
          const fileKey = result.fileKey || run.fileKey || '';
          const nodeHyphen = String(result.nodeId).replace(/:/g, '-');
          const url = fileKey
            ? `https://www.figma.com/design/${fileKey}/SAP-Agent-v2?node-id=${nodeHyphen}`
            : '';
          run.phase = 'done';
          emit(run, 'done', { nodeId: result.nodeId, fileKey, url });
          endChild(run);
          clearTimeout(run.timer);
          return;
        }
      }
      fail(run, 'build finished but no valid AGENT_RESULT was returned');
    }
  }
}

function sendTurn(run, content) {
  const envelope = JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n';
  run.child.stdin.write(envelope);         // NOTE: never .end() between turns — keeps one session
}

function endChild(run) {
  if (run.child && !run.child.killed) {
    try { run.child.stdin.end(); } catch (_) {}
    setTimeout(() => { try { run.child.kill('SIGTERM'); } catch (_) {} }, 1000);
    setTimeout(() => { try { run.child.kill('SIGKILL'); } catch (_) {} }, 4000);
  }
}

function fail(run, message) {
  if (run.phase === 'done' || run.phase === 'error') return;
  run.phase = 'error';
  try { fs.rmSync(TURN1_SENTINEL, { force: true }); } catch (_) {}
  if (run.kind === 'job') { run.result = { jobId: run.id, pass: false, error: message }; writeResult(run); }
  emit(run, 'error', { message });
  endChild(run);
  clearTimeout(run.timer);
}

// ── Framing templates (final, from the verified spec) ──────────────────────────
function frameTurn1(desc, nodeId, nodeName, fileKey) {
  return `[SAP AGENT v2 — TURN 1 of 2 · READ-ONLY WIREFRAME PROPOSAL · DO NOT BUILD]

A screen node is selected in Figma.
  Selected node id:   ${nodeId}
  Selected node name: ${nodeName}
  File key:           ${fileKey || '(unknown — ask the user to paste the file URL)'}

User request (verbatim): ${desc}

Do this IN ORDER, then STOP:
1. READ ONLY. You may call ONLY these tools this turn: get_metadata, get_design_context,
   get_screenshot, get_variable_defs. You MUST NOT call use_figma under any circumstances this
   turn (it is hard-blocked by a hook). Nothing is written to the canvas this turn.
2. Run the pre-build gates as ANALYSIS ONLY: GATE 0 (RULE 26 VDI, sector-by-sector),
   GATE 1 (RULE 28+31 canonical score -> reuse level 1-5, base id, score; the selected node
   ${nodeId} is the default clone base unless a higher-scoring canonical exists),
   GATE 2 (RULE 30 measured width of ${nodeId}).
3. Present as plain text: (a) ASCII wireframe of the PROPOSED new screen, (b) L1-L5 layer tree
   (semantic naming, no decorative chars, no token tags), (c) one-line reuse decision
   "Level <N> · base <id> · score <S>", (d) delta vs the selected screen.
4. HARD STOP. End your message with EXACTLY this line, nothing after it:
   AGENT_WIREFRAME_READY
Obey SYSTEM_PROMPT.md and all RULEs. This turn is Gate 0-3 analysis only.`;
}

function frameTurn2(userApproval, nodeId, fileKey) {
  return `${userApproval}

[SAP AGENT v2 — TURN 2 of 2 · BUILD · CLONE-FIRST · NON-DESTRUCTIVE]

Proceed with the wireframe you proposed above.
1. RECORD the reuse decision yourself (RULE 31, not user-gated):
   echo '{"level":<N>,"score":<S>,"baseCanonical":"${nodeId}","deltaSpec":null}' > .claude/.reuse-declared
2. CLONE-FIRST, NON-DESTRUCTIVE. Never edit the original:
   const src = figma.currentPage.findOne(n => n.id === '${nodeId}');
   const dup = src.clone(); dup.x = src.x + src.width + 120; dup.y = src.y;
   Edit ONLY dup. Level 1-4 build code MUST contain .clone(. Level 5 requires prior scratch consent.
3. Honor every invariant: Horizon Light tokens only, [sapToken]+[typo:role] name tags,
   L1-L5 semantic naming, REAL SAP kit instances only (zero native frames), no raw hex.
4. VALIDATE the new node exists (get_metadata/findOne), then end with EXACTLY one line,
   machine-readable, nothing after it:
   AGENT_RESULT {"nodeId":"<new-node-id>","fileKey":"${fileKey || ''}"}
Obey SYSTEM_PROMPT.md and all RULEs.`;
}

// ── HTTP helpers ────────────────────────────────────────────────────────────────
// CORS: the Figma plugin iframe posts from origin "null" (sandboxed). SECURITY FIX 2026-07-21:
// do NOT reflect "*" (that let any website the user visits call the bridge). Allow only the
// sandbox origin "null". Requests still require the bridge token, so this is defense-in-depth.
const ALLOWED_ORIGIN = 'null';

function send(res, code, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'X-Bridge-Token, Content-Type',
  }, extraHeaders || {}));
  res.end(body);
}

function reqToken(req, url) {
  return req.headers['x-bridge-token'] || url.searchParams.get('token') || '';
}

function readBody(req, limit = 1e6) {
  return new Promise((resolve) => {
    let b = '';
    let over = false;
    req.on('data', (c) => {
      if (over) return;
      b += c;
      if (b.length > limit) { over = true; resolve({ __tooBig: true }); req.destroy(); }
    });
    req.on('end', () => { if (over) return; try { resolve(JSON.parse(b || '{}')); } catch (_) { resolve({}); } });
  });
}

// ── v4: SAP Bridge — plugin ⇄ headless Claude pipeline (contract: bridge/README.md) ──
const os = require('node:os');
const CFG = Object.assign({ model: 'opus', maxFixRounds: 2, timeoutMin: 30, agentWaitMin: 120 },
  (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch (_) { return {}; } })());
const OUT = process.env.SAP_BRIDGE_OUT || path.join(PROJ, 'bridge-out');
const PAIR_FILE = process.env.SAP_BRIDGE_PAIR || path.join(PROJ, '.claude', '.bridge-pair.json');
const CLAUDE_BIN = process.env.SAP_CLAUDE_BIN || 'claude';
const MEMORY_DIR = process.env.SAP_BRIDGE_MEMORY_DIR || path.join(os.homedir(), '.claude', 'projects', PROJ.replace(/[^A-Za-z0-9]/g, '-'), 'memory');
const JOB_TTL_MS = 15 * 60 * 1000;
const LOGOS_WAIT_MS = Number(process.env.SAP_BRIDGE_LOGOS_WAIT || CFG.logosWaitSec || 120) * 1000;   // the plugin needs < 1 s
const NODE_RE = /^I?\d+[:-]\d+(;I?\d+[:-]\d+)*$/;
const KEY_RE = /^[A-Za-z0-9]{1,128}$/;
// Headless Claude gets an allow-list, never bypassPermissions: the request text comes from a plugin.
const ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Glob', 'Grep',
  'Bash(node build/*)', 'Bash(python3 build/*)', 'Bash(git branch --show-current)', 'Bash(shasum *)',
  'Bash(mkdir -p bridge-out/*)', 'Bash(cp *)', 'Bash(ls *)', 'Bash(curl -s -o bridge-out/*)',
  'mcp__figma__use_figma', 'mcp__figma__download_assets', 'mcp__figma__get_screenshot',
  'mcp__figma__get_metadata', 'mcp__figma__search_design_system', 'mcp__figma__whoami',
].join(',');
const mbx = () => require('../build/mailbox.js');

let figmaSeen = null;                         // {fileKey, fileName, lastSeen} — the plugin heartbeat
const inbox = { events: [], nextSeq: 0, _pollWaiters: [] };
const jobIndex = new Map();                    // jobId → summary (outlives run eviction)
const lastJobByFile = new Map();               // fileKey → jobId
let currentJobId = null;

// ── v5: TREE JOBS — the SAP Bridge plugin BUILDS the tree itself (the MODEL TYPES NOTHING) ──
// The CLI (build/send.js) posts a ready payload {version, runtime, kit, tree} (from render.js --json);
// the open+paired plugin polls /tree/next for the current file, runs the payload, dumps geometry + the
// audit tree, exports a PNG, and posts the lot back to /tree/result. The CLI long-polls /tree/wait.
// No use_figma, no model typing — the renderer runs where fetch reaches localhost (the plugin main thread).
// State dir is separate from v4's bridge-out so a test port never touches the LaunchAgent's jobs.
const TREE_DIR = process.env.SAP_BRIDGE_TREE_DIR || path.join(OUT, 'tree-jobs');
const treeJobs = new Map();                     // jobId → tree-job record
let treeSeq = 0;
const TREE_JOB_TTL_MS = 30 * 60 * 1000;         // evict a settled tree job after 30 min
try { fs.mkdirSync(TREE_DIR, { recursive: true }); } catch (_) {}
function treeGc() {
  const now = Date.now();
  for (const [id, j] of treeJobs) if ((j.status === 'done' || j.status === 'error') && now - j.settledAt > TREE_JOB_TTL_MS) treeJobs.delete(id);
}
// The /tree/wait reply: the result without the big blobs (they are already on disk in <jobDir>/check/).
function treeResultLite(j) {
  const r = j.result || {};
  return { jobId: j.id, status: j.status, ok: r.ok !== false && j.status === 'done',
    error: r.error || null, nodeId: r.nodeId || null, made: r.made == null ? null : r.made,
    WARN: Array.isArray(r.WARN) ? r.WARN : [], ms: r.ms == null ? null : r.ms,
    wrote: r.wrote || [], fileKey: j.fileKey };
}
// Write the plugin's payload into <jobDir>/check/ so build/send.js can run the gates on it.
function writeTreeResult(job, b) {
  const wrote = [];
  if (!job.jobDir) return wrote;
  const dir = path.join(job.jobDir, 'check');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  const put = (name, buf) => { try { fs.writeFileSync(path.join(dir, name), buf); wrote.push(name); } catch (_) {} };
  if (b.geometry != null) put('geometry.json', JSON.stringify(b.geometry));
  if (b.audit != null) put('tree.json', JSON.stringify(b.audit));   // dump-tree output = the audit tree
  if (typeof b.pngBase64 === 'string' && b.pngBase64) {
    try { put('build@2x.png', Buffer.from(b.pngBase64, 'base64')); } catch (_) {}
  }
  const summary = { jobId: job.id, ok: b.ok !== false, error: b.error || null, nodeId: b.nodeId || null,
    made: b.made == null ? null : b.made, WARN: Array.isArray(b.WARN) ? b.WARN : [],
    ms: b.ms == null ? null : b.ms, at: new Date().toISOString() };
  put('result.json', JSON.stringify(summary, null, 2));
  job._wrote = wrote;
  return wrote;
}
function settleTreeJob(job, b) {
  job.status = b.ok === false ? 'error' : 'done';
  job.settledAt = Date.now();
  job.result = { ok: b.ok !== false, error: b.error || null, nodeId: b.nodeId || null,
    made: b.made == null ? null : b.made, WARN: Array.isArray(b.WARN) ? b.WARN : [],
    ms: b.ms == null ? null : b.ms, wrote: job._wrote || [] };
  console.log(`[tree ${job.id}] ${job.status}${b.error ? ' · ' + String(b.error).slice(0, 120) : ''} · node ${b.nodeId || '—'}`);
  const w = job._waiters || []; job._waiters = [];
  for (const f of w) { try { f(); } catch (_) {} }
}

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const rel = (p) => path.relative(PROJ, p);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\x00-\x08\x0b-\x1f]/g, ' ').slice(0, n).trim();
function sameStr(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function pairHash() {
  try { return JSON.parse(fs.readFileSync(PAIR_FILE, 'utf8')).sha256 || null; } catch (_) { return null; }
}
function authOf(req, url) {
  const t = reqToken(req, url);
  if (!t) return null;
  if (sameStr(t, TOKEN)) return 'cli';
  const h = pairHash();
  return h && sameStr(sha256(t), h) ? 'plugin' : null;
}
let _branch = { v: null, at: 0 };
function gitBranch() {
  if (Date.now() - _branch.at < 30000) return _branch.v;
  let v = null;
  try { v = execFileSync('git', ['-C', PROJ, 'branch', '--show-current'], { timeout: 3000 }).toString().trim(); } catch (_) {}
  _branch = { v, at: Date.now() };
  return v;
}

function emitInbox(type, data) {
  inbox.events.push({ seq: inbox.nextSeq++, type, data, at: Date.now() });
  if (inbox.events.length > 50) inbox.events.splice(0, inbox.events.length - 50);
  const w = inbox._pollWaiters; inbox._pollWaiters = [];
  for (const f of w) { try { f(); } catch (_) {} }
}
function longPoll(req, res, holder, since) {
  const pending = () => holder.events.filter((e) => e.seq >= since);
  const cursor = () => (holder.nextSeq != null ? holder.nextSeq : holder.events.length);
  if (pending().length) return send(res, 200, { events: pending(), cursor: cursor() });
  let done = false;
  const flush = () => { if (done) return; done = true; clearTimeout(t); send(res, 200, { events: pending(), cursor: cursor() }); };
  const t = setTimeout(() => { holder._pollWaiters = (holder._pollWaiters || []).filter((w) => w !== flush); flush(); }, 25000);
  holder._pollWaiters = holder._pollWaiters || [];
  holder._pollWaiters.push(flush);
  req.on('close', () => { clearTimeout(t); done = true; });
}

function jobSummary(run) {
  return { jobId: run.id, phase: run.phase, mode: run.mode, fileKey: run.fileKey, nodeId: run.nodeId || null,
    stages: run.stages, result: run.result || null, at: run.createdAt };
}
function touchJob(run) {
  jobIndex.set(run.id, jobSummary(run));
  if (run.fileKey) lastJobByFile.set(run.fileKey, run.id);
  if (jobIndex.size > 50) jobIndex.delete(jobIndex.keys().next().value);
}
function writeResult(run) {
  const r = Object.assign({ phase: run.phase, stages: run.stages }, run.result || {});
  try { fs.writeFileSync(path.join(run.jobDir, 'result.json'), JSON.stringify(r, null, 2)); } catch (_) {}
  try { require('./trace.js').write(run.jobDir); } catch (_) {}   // the readable log of this job (trace.md)
  try {
    fs.appendFileSync(path.join(OUT, 'runs.log'), JSON.stringify(Object.assign({ at: new Date().toISOString(),
      jobId: run.id, mode: run.mode, text: String(run.text || '').slice(0, 120) }, run.result || {})) + '\n');
  } catch (_) {}
}
function isBusy() {
  const r = currentJobId && runs.get(currentJobId);
  return !!(r && r.phase !== 'done' && r.phase !== 'error');
}
function newJob({ mode, fileKey, fileName, text, selection, source }) {
  const run = newRun();
  Object.assign(run, { kind: 'job', mode, fileKey, fileName, text, selection, source, stages: [], round: 0,
    createdAt: Date.now(), ttl: JOB_TTL_MS, routeMode: 'THINK', phase: 'running' });
  run.jobDir = path.join(OUT, run.id);
  fs.mkdirSync(run.jobDir, { recursive: true });
  currentJobId = run.id;
  touchJob(run);
  return run;
}
function stage(run, name, text) {
  const st = { name, text: String(text || '').slice(0, 160) };
  run.stages.push(st);
  emit(run, 'stage', st);
}
function fillTpl(name, vars) {
  const s = fs.readFileSync(path.join(__dirname, 'prompts', name), 'utf8');
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])));
}
function inJob(run, p) {
  const abs = path.resolve(PROJ, String(p || ''));
  return abs.startsWith(run.jobDir + path.sep) ? abs : null;
}
function refOf(run) {
  const png = path.join(run.jobDir, 'ref.png');
  return fs.existsSync(png) ? png : run.refPath || null;
}

// A clean env: a bridge started from inside a Claude Code session would otherwise pass that
// session's short-lived login (ANTHROPIC_AUTH_TOKEN, CLAUDE_CODE_*) → "401 Invalid bearer token".
// Headless claude then uses the user's own login, the same as under the LaunchAgent.
const ENV_KEEP = ['HOME', 'USER', 'LOGNAME', 'PATH', 'SHELL', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TMPDIR', 'TERM'];
function childEnv(run) {
  const env = {};
  for (const k of ENV_KEEP) if (process.env[k]) env[k] = process.env[k];
  for (const k of Object.keys(process.env)) if (k.startsWith('SAP_')) env[k] = process.env[k];
  env.SAP_BRIDGE_JOB = run.id;
  // The fact-forcing hook (GateGuard) costs two model turns per job (~10 s) and nobody reads those facts in a headless job. Narrow switches, this child only:
  // routine Bash checks off (destructive-command checks stay ON), and first-touch facts skipped for the job's own folders.
  env.GATEGUARD_BASH_ROUTINE_DISABLED = '1';
  env.GATEGUARD_EXEMPT_GLOBS = 'bridge-out/**,**/bridge-out/**';
  return env;
}

function spawnJob(run, prompt, resume) {
  const args = ['-p', '--output-format', 'stream-json', '--input-format', 'stream-json', '--verbose',
    '--model', CFG.model, '--max-turns', String(CFG.maxTurns || 30), '--add-dir', PROJ, '--allowedTools', ALLOWED_TOOLS];
  if (fs.existsSync(MEMORY_DIR)) args.push('--add-dir', MEMORY_DIR);
  if (resume && run.sessionId) args.push('--resume', run.sessionId);
  else { run.sessionId = crypto.randomUUID(); args.push('--session-id', run.sessionId); }
  const child = spawn(CLAUDE_BIN, args, { cwd: PROJ, stdio: ['pipe', 'pipe', 'pipe'], env: childEnv(run) });
  Object.assign(run, { child, childExited: false, turnResultText: '', stdoutBuf: '', markerSeen: false, phase: 'running' });
  child.stdout.on('data', (buf) => onChildStdout(run, buf));
  child.stderr.on('data', (buf) => {
    const s = buf.toString().trim();
    if (s) console.log(`[job ${run.id}] stderr: ${s.slice(0, 400)}`);
  });
  child.on('exit', (code) => {
    if (run.child !== child) return;              // an earlier step's process; the next step already runs
    run.childExited = true;
    if (!run.markerSeen && run.phase === 'running') fail(run, `Claude stopped (exit ${code}) without a result line`);
  });
  child.on('error', (err) => { if (run.child === child) fail(run, `cannot start Claude (${CLAUDE_BIN}): ${err.message}`); });
  child.stdin.write(JSON.stringify({ type: 'user', message: { role: 'user', content: prompt } }) + '\n');
  child.stdin.end();
  clearTimeout(run.timer);
  run.timer = setTimeout(() => fail(run, `timed out after ${CFG.timeoutMin} min`), CFG.timeoutMin * 60000);
  touchJob(run);
}

const STAGE_RE = /^[`*>\s]*STAGE[`*]*\s+(route|plan|analy[sz]e|execute|logos|check|fix|done)\b[\s:·—-]*(.*)$/i;
function handleJobMessage(run, msg) {
  try { if (run.jobDir) fs.appendFileSync(path.join(run.jobDir, 'transcript.jsonl'), JSON.stringify(Object.assign({ _at: Date.now() }, msg)) + '\n'); } catch (_) {}   // every tool call + output of the job, so a slow run can be read afterwards
  if (msg.type === 'assistant' && msg.message && Array.isArray(msg.message.content)) {
    for (const b of msg.message.content) {
      if (b.type === 'text' && b.text) { run.turnResultText += b.text + '\n'; jobText(run, b.text); }
    }
    return;
  }
  if (msg.type === 'result') {
    const text = run.turnResultText + '\n' + (typeof msg.result === 'string' ? msg.result : '');
    run.turnResultText = '';
    jobTurnEnd(run, text, msg);
  }
}
function jobText(run, text) {
  let last = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(STAGE_RE);
    if (m) {
      const name = m[1].toLowerCase().replace('analyze', 'analyse');
      const txt = m[2].replace(/[`*]+$/, '').trim();
      if (name === 'route') { const mm = txt.match(/\b(ACT|QUICK|THINK|SPLIT)\b/); if (mm) run.routeMode = mm[1]; }
      stage(run, name, txt);
      continue;
    }
    if (!/AGENT_[A-Z_]+/.test(line)) last = line;
  }
  if (last) emit(run, 'progress', { text: last.slice(0, 300) });
}
function marker(text, name) {
  const re = new RegExp('^[`*>\\s]*' + name + '[`*]*\\s+(.+)$', 'gm');
  let m; let found = null;
  while ((m = re.exec(text))) found = m[1].trim().replace(/`+$/, '');
  return found;
}
function markerJson(text, name) {
  const s = marker(text, name);
  if (s == null) return null;
  try { return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); } catch (_) { return null; }
}
function jobTurnEnd(run, text, msg) {
  run.markerSeen = true;
  clearTimeout(run.timer);
  const res = markerJson(text, 'AGENT_RESULT');
  if (res) return finishGated(run, res);
  const ask = marker(text, 'AGENT_ASK');
  if (ask) { run.phase = 'ask'; return emit(run, 'ask', { question: ask.slice(0, 600) }); }
  const ready = markerJson(text, 'AGENT_PLAN_READY');
  if (ready) return planReady(run, ready.plan);
  const built = markerJson(text, 'AGENT_BUILT');
  if (built && NODE_RE.test(String(built.nodeId || ''))) return afterBuilt(run, String(built.nodeId));
  const fix = markerJson(text, 'AGENT_FIX');
  if (fix) return fixReady(run, fix.fixFile);
  // plugin chat (2026-10-04): Claude answers or reports what it did → the plugin shows the text as Claude's reply
  const rep = markerJson(text, 'AGENT_REPLY');
  if (rep && rep.text) return finishJob(run, { mode: 'CHAT', reply: rep.text, nodeId: NODE_RE.test(String(rep.nodeId || '')) ? rep.nodeId : '', pass: true });
  if (run.chat && !(msg && msg.is_error)) {   // a chat turn that forgot the marker: its last words are still the answer
    const said = text.split('\n').filter(l => l.trim() && !/^\s*(STAGE|AGENT_)/.test(l)).join('\n').trim();
    if (said) return finishJob(run, { mode: 'CHAT', reply: said.slice(-3000), pass: true });
  }
  run.markerSeen = false;
  fail(run, msg && msg.is_error
    ? `Claude error: ${String(msg.result || msg.subtype || '').slice(0, 300)}`
    : 'Claude finished without a result line');
}

function planReady(run, planPath) {
  if (run.mode !== 'agent') return fail(run, 'Claude stopped after the plan, but this job is "Claude builds"');
  const abs = inJob(run, planPath);
  if (!abs || !fs.existsSync(abs)) return fail(run, `plan file missing: ${planPath}`);
  let plan;
  try { plan = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (_) { return fail(run, 'the plan is not valid JSON'); }
  run.planPath = abs;
  sendPlanMailbox(run, plan);
}
function sendPlanMailbox(run, plan) {
  let sp;
  try { sp = mbx().splitPlan(plan, run.id); } catch (e) { return fail(run, `cannot split the plan: ${e.message}`); }
  run.phase = 'waiting-agent';
  const data = { jobId: run.id, kind: 'plan', job: sp.job, parts: sp.parts, fix: null };
  stage(run, 'execute', 'waiting for the Figma Agent — type: build plan');
  emit(run, 'mailbox', data);
  if (run.source === 'cli') emitInbox('mailbox', data);
  armAgentWait(run);
  tryDriveAgent(run);
}
// Full bridge: open a new Figma Agent chat in the debug Chrome and type "build plan" (node build/agent-drive.js --launch <fileKey>).
// Without that Chrome the manual card stays: type "build plan" in the Figma Agent yourself.
function tryDriveAgent(run) {
  let drv; try { drv = require('../build/agent-drive.js'); } catch (_) { return; }
  drv.status(run.fileKey).then((st) => {
    if (!st.chrome || !st.tab) return emit(run, 'progress', { text: 'Agent chat not linked (no debug Chrome) — type "build plan" in the Figma Agent' });
    return drv.sendToAgent({ fileKey: run.fileKey, text: 'build plan' })
      .then(() => emit(run, 'progress', { text: 'Opened a new Figma Agent chat and sent "build plan"' }));
  }).catch((e) => emit(run, 'progress', { text: 'Agent chat link failed: ' + String(e.message).slice(0, 120) }));
}
function armAgentWait(run) {
  clearTimeout(run.timer);
  run.timer = setTimeout(() => fail(run, `no build from the Figma Agent in ${CFG.agentWaitMin} min`), CFG.agentWaitMin * 60000);
}
function readLogos(run) {
  const dir = path.join(run.jobDir, 'logos');
  let idx;
  try { idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')); } catch (_) { return []; }
  return (Array.isArray(idx) ? idx : []).filter((e) => e && e.file && e.element).slice(0, 40).map((e) => {
    try {
      const file = path.basename(String(e.file));
      return { element: String(e.element), group: String(e.group || ''), file,
        base64: fs.readFileSync(path.join(dir, file)).toString('base64') };
    } catch (_) { return null; }
  }).filter(Boolean);
}
function afterBuilt(run, nodeId) {
  run.nodeId = nodeId;
  if (run.logosPlaced != null) return startCheck(run);
  const items = readLogos(run);
  if (!items.length) { run.logosPlaced = 0; return startCheck(run); }
  run.phase = 'logos';
  stage(run, 'logos', `placing ${items.length} logo(s)`);
  emit(run, 'logos', { jobId: run.id, nodeId, items });
  clearTimeout(run.timer);
  run.timer = setTimeout(() => { if (run.phase === 'logos') { run.logosPlaced = 0; startCheck(run); } }, LOGOS_WAIT_MS);
}
function startCheck(run) {
  run.round += 1;
  const builder = run.mode === 'agent' ? 'figma-agent' : 'claude';
  const ref = refOf(run);
  const prompt = fillTpl('check.md', {
    jobId: run.id, round: run.round, maxRounds: CFG.maxFixRounds + 1, builder, nodeId: run.nodeId,
    fileKey: run.fileKey, logos: run.logosPlaced ? `${run.logosPlaced} placed` : 'none',
    plan: rel(run.planPath || path.join(run.jobDir, 'plan.json')), ref: ref ? rel(ref) : 'none',
    jobDir: rel(run.jobDir), memoryDir: MEMORY_DIR, routeMode: run.routeMode,
  });
  spawnJob(run, prompt, !!run.sessionId);
}
function fixReady(run, fixFile) {
  if (run.mode !== 'agent') return fail(run, 'the check asked for Figma Agent fixes, but this job is "Claude builds"');
  const abs = inJob(run, fixFile);
  if (!abs || !fs.existsSync(abs)) return fail(run, `fix file missing: ${fixFile}`);
  const fix = mbx().splitFix(fs.readFileSync(abs, 'utf8'), { jobId: run.id, nodeId: run.nodeId, round: run.round });
  run.phase = 'waiting-agent';
  stage(run, 'fix', `${fix.lines.length} fix line(s) — type: apply fixes`);
  const data = { jobId: run.id, kind: 'fix', job: null, parts: null, fix };
  emit(run, 'mailbox', data);
  if (run.source === 'cli') emitInbox('mailbox', data);
  armAgentWait(run);
}
// The bridge runs the gates itself: a headless run once reported "EYE 97" for a build that
// measured EYE 9 % (384:6551). Only numbers printed by audit-plan.js / see.py count.
const gates = require('../build/gates.js');
function measureGates(run) {
  return gates.measure({ plan: run.planPath || path.join(run.jobDir, 'plan.json'), jobDir: run.jobDir, ref: refOf(run),
    auditName: 'audit-bridge.txt', seeName: 'see-bridge' });
}
// Only a MEASURED pass may write the plan cache and the run log (a claimed pass once overwrote a gold plan).
function recordPass(run, g) {
  gates.record({ plan: run.planPath || path.join(run.jobDir, 'plan.json'), ref: refOf(run), g, text: run.text,
    nodeId: run.nodeId, via: `SAP Bridge (${run.mode})`, rounds: run.gateRounds || 0, ms: run.createdAt ? Date.now() - run.createdAt : 0 });
}
function gatePrompt(run, g, blocks) {
  const d = rel(run.jobDir);
  return `[SAP v4 BRIDGE · gate round ${run.gateRounds} of ${CFG.maxFixRounds} — your result was NOT accepted; the bridge ran the gates itself]
Job folder: \`${d}\`
Measured: MATCH ${g.match == null ? '?' : g.match}% · hygiene ${g.hygiene == null ? '?' : g.hygiene} · EYE ${g.eye == null ? '—' : g.eye + '%'} (need MATCH ≥ 90, hygiene 0, EYE ≥ 95 with a reference). Problems: ${blocks.join('; ')}.
Audit lines: ${d}/audit-bridge.txt · eye fix lines with node ids: ${d}/see-bridge/fix.md · look at ${d}/see-bridge/diff-sheet.png.
Fix node \`${run.nodeId}\` with small use_figma calls (prelude runtime; auto-layout rows hug their content — primaryAxisSizingMode and counterAxisSizingMode 'AUTO' — unless the plan gives a size).
Then write fresh files, the bridge measures from them: ${d}/tree.json (dump-tree), ${d}/build@2x.png (download_assets png scale 2, then curl -s -o), ${d}/geometry.json (dump-geometry).
End with the AGENT_RESULT line. Never report a number that a script did not print.`;
}
async function finishGated(run, res) {
  const mode = String(res.mode || run.routeMode || '').toUpperCase();
  if (mode === 'ACT' || mode === 'QUICK' || mode === 'V6' || process.env.SAP_BRIDGE_GATES === 'off') return finishJob(run, res);   // V6: run.js measured the gates itself
  run.phase = 'gating';
  stage(run, 'check', 'the bridge measures MATCH and EYE itself…');
  let g;
  try { g = await measureGates(run); } catch (e) { g = { missing: [`gate error: ${e.message}`], pass: false }; }
  if (!g) return finishJob(run, res);
  const out = Object.assign({}, res, { match: g.match, eye: g.eye, pass: !!g.pass, measured: true,
    claimed: { match: res.match == null ? null : res.match, eye: res.eye == null ? null : res.eye } });
  const txt = `measured MATCH ${g.match == null ? '?' : g.match}% · EYE ${g.eye == null ? '—' : g.eye + '%'} · hygiene ${g.hygiene == null ? '?' : g.hygiene}`;
  if (g.pass) { stage(run, 'done', txt); recordPass(run, g); return finishJob(run, out); }
  const blocks = [];
  if (g.missing.length) blocks.push(`gate files missing: ${g.missing.join(', ')}`);
  if (g.match != null && g.match < 90) blocks.push(`MATCH ${g.match}% < 90`);
  if (g.hygiene) blocks.push(`hygiene ${g.hygiene}`);
  if (g.eye != null && g.eye < 95) blocks.push(`EYE ${g.eye}% < 95`);
  stage(run, 'check', `${txt} — not passed`);
  run.gateRounds = (run.gateRounds || 0) + 1;
  if (run.gateRounds <= CFG.maxFixRounds) {
    if (run.mode === 'agent') {
      const parts = [];
      try { parts.push(fs.readFileSync(path.join(run.jobDir, 'audit-bridge.txt'), 'utf8')); } catch (_) {}
      try { parts.push(fs.readFileSync(path.join(run.jobDir, 'see-bridge', 'fix.md'), 'utf8')); } catch (_) {}
      const f = path.join(run.jobDir, `fix-bridge-${run.gateRounds}.md`);
      fs.writeFileSync(f, parts.join('\n'));
      return fixReady(run, rel(f));
    }
    stage(run, 'fix', `gate round ${run.gateRounds}: ${blocks.join('; ')}`);
    return spawnJob(run, gatePrompt(run, g, blocks), true);
  }
  out.blocks = blocks.concat(Array.isArray(res.blocks) ? res.blocks : []);
  return finishJob(run, out);
}

function finishJob(run, res) {
  const nodeId = String(res.nodeId || run.nodeId || '');
  const url = run.fileKey && nodeId ? `https://www.figma.com/design/${run.fileKey}/?node-id=${nodeId.replace(/:/g, '-')}` : '';
  run.result = { jobId: run.id, nodeId, fileKey: run.fileKey, url, mode: res.mode || run.routeMode,
    match: res.match == null ? null : res.match, eye: res.eye == null ? null : res.eye,
    WARN: Array.isArray(res.WARN) ? res.WARN : [], pass: res.pass !== false,
    blocks: Array.isArray(res.blocks) ? res.blocks : [], measured: !!res.measured, claimed: res.claimed || null,
    reply: res.reply ? String(res.reply).slice(0, 4000) : '' };
  run.phase = 'done';
  clearTimeout(run.timer);
  writeResult(run);
  emit(run, 'done', run.result);
}

// run.js as a child of the bridge (no model). Its own /note lines drive the plugin chat; the bridge job ends when the script ends.
function runScripted(run, args) {
  run.phase = 'running'; touchJob(run);
  const child = spawn(process.execPath, args, { cwd: PROJ, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const log = fs.createWriteStream(path.join(run.jobDir, 'run-out.txt'), { flags: 'a' }); child.stdout.pipe(log); child.stderr.pipe(log);
  child.on('exit', code => {
    run.scriptExit = code;
    // the plan step needs a decision only a model can make (exit 2: unnamed shapes, ops) → Claude finishes it and shows the plan; the user still approves
    const jobArg = args[args.indexOf('--job') + 1];
    if (code === 2 && args.includes('--ask') && !run.helped && jobArg) {
      run.helped = true; run.scripted = false; run.chat = true;
      emitInbox('note', { name: 'analyse', text: 'The scripts need a decision — Claude takes over (names the unknown shapes), then shows the plan.', job: jobArg, total: 0, url: '', block: '' });
      const out = (() => { try { return fs.readFileSync(path.join(run.jobDir, 'run-out.txt'), 'utf8').split('\n').slice(-40).join('\n'); } catch (_) { return ''; } })();
      spawnJob(run, `[SAP BRIDGE — plan step needs a decision · job ${jobArg} · file ${run.fileKey}]
You are Claude Code in this repo. node build/run.js stopped with exit 2 while making the plan. Its last lines (data):
<<<
${out.replace(/>>>|<<</g, '> > >')}
>>>
THIS PLUGIN MAKES SAP SCREENS. The result must be a real SAP Fiori (Horizon) screen built from the SAP Web UI Kit — never a pixel copy of frames and cut-out pictures.
When the NEED lines say DESIGN: act as a senior SAP Fiori product designer. Map EVERY region to the real kit part (node build/kit.js list · c "<name>" · i <word>): a page/side filter → Panel / Check Box / Radio Button / Range Slider / Switch; a call to action → Button (one Emphasized per area, others Default/Transparent); an underlined/blue text action → Link; a status / price tag → Object Status; a heart, info, arrow, bell, filter, sort glyph → its SAP kit ICON (never a cut picture); a result card → a box "fill":"sapTile_Background" or "sapBaseColor" with "border":"1px sapList_BorderColor","radius":12; a tab strip / segmented sort → Segmented Button or Icon Tab Bar; a search → Search Field; a date → Date Picker. Text styles and colour tokens only from measure.txt. "image" ONLY for airline/brand logos, photos and illustrations — never for text, controls or UI glyphs. Keep the reference layout and every text (fix the OCR from the picture).
HARD RULES for the design step: (0) SAP KIT ALWAYS: every control / action / status / glyph is a SAP Web UI Kit part; read every word and every state from the PICTURE (OCR can cut words); sizes from measure.txt; nothing past the frame edge. (1) Read knowledge/gold/design/flight-results.design-spec.json FIRST — it is a passed SAP redesign of a flight-results screen; copy its STYLE (few boxes, real kit parts, props), never its content. (2) Never copy the screenshot's boxes: a box only for a real card, panel or strip; NO box per row, NO box around a single text, NO box standing in for a control. A dark tile = the SELECTED card (fill sapBaseColor, border "2px sapContent_Selected_ForegroundColor", title in sapContent_Selected_ForegroundColor). A dark button = Button Type Primary. (3) Props keys WITHOUT "#id" (write "✏️ Text", "Label", never "✏️ Text#154638:49"); a Check Box / Radio Button / Switch with text needs "Label": true. (4) NEVER edit tree.json or any file except design-spec.json — when the door says OUT, fix design-spec.json and run the --design-spec command again. (5) Fill tokens are background variables (sapBaseColor, sapBackgroundColor, sapGroup_ContentBackground); text tokens sapTextColor / sapContent_LabelColor / sapContent_Selected_ForegroundColor only.
Do exactly what the NEED / NEXT lines ask (name shapes by the rules: UI icon → kit icon via node build/kit.js i <word> · logo/flag/badge/photo → image · missed text → text:<s>:<style> · control → comp:<kit part> · skip only noise < 8 px).
Then run the NEXT command again WITH --ask added (never --approved). Exit 5 = the plan is in the plugin. One plain command per call, no pipes.
Last line, exactly: AGENT_REPLY {"text":"The plan is ready above. Approve, Reject or Modify."}`, false);
      return;
    }
    finishJob(run, { pass: code === 0 || code === 5, mode: 'SCRIPT', scripted: true }); if (run.result) { run.result.scripted = true; run.result.exit = code; }
  });
}

// the separate Make bridge (port 41779) is started / restarted through its own ctl.js
function makeCtl() {
  return [process.env.SAP_MAKE_CTL, path.join(os.homedir(), 'Downloads', 'Figma Make ', 'make-figma', 'ctl.js'), path.join(os.homedir(), 'Downloads', 'Figma Make', 'make-figma', 'ctl.js')].filter(Boolean).find((f) => fs.existsSync(f)) || null;
}
// Returns true when it answered the request (v4 routes, /health, /pair, /poll).
async function handleV4(req, res, url) {
  const p = url.pathname;
  if (p === '/health') {
    const pendingRun = [...runs.values()].find((r) => r.phase === 'need-approval' && r.sessionId);
    send(res, 200, { ok: true, app: 'sap-v4-bridge', version: 1, repo: path.basename(PROJ), branch: gitBranch(),
      model: CFG.model, paired: !!pairHash(), busy: isBusy(),
      figma: figmaSeen ? Object.assign({}, figmaSeen, { lastSeenSec: Math.round((Date.now() - figmaSeen.lastSeen) / 1000) }) : null,
      runs: runs.size, needToken: true, pendingApproval: pendingRun ? { runId: pendingRun.id } : null });
    return true;
  }
  if (p === '/pair') {
    if (req.headers.origin !== 'null') { send(res, 403, { error: 'pairing only from the SAP Bridge Figma plugin' }); return true; }
    if (pairHash()) { send(res, 409, { error: 'already paired' }); return true; }
    const tok = crypto.randomBytes(32).toString('hex');
    try { fs.mkdirSync(path.dirname(PAIR_FILE), { recursive: true, mode: 0o700 }); } catch (_) {}
    fs.writeFileSync(PAIR_FILE, JSON.stringify({ sha256: sha256(tok), pairedAt: new Date().toISOString() }), { mode: 0o600 });
    console.log('[pair] SAP Bridge plugin paired');
    send(res, 200, { token: tok });
    return true;
  }
  const routes = ['/poll', '/inbox', '/job', '/agent/send', '/agent/status', '/agent/stop', '/make/send', '/app/focus', '/answer', '/job/logos-done', '/mbx/done', '/mbx/push',
    '/job/status', '/job/last', '/job/cancel', '/job/open-log', '/note', '/run/approve', '/bridge/restart', '/make/ensure',
    '/tree', '/tree/next', '/tree/result', '/tree/wait', '/v6/pack'];
  if (!routes.includes(p)) return false;
  const who = authOf(req, url);
  if (!who) { send(res, 401, { error: 'bad or missing token' }); return true; }
  const bad = (m) => { send(res, 400, { error: m }); return true; };
  const getJob = (id) => { const r = runs.get(String(id || '')); return r && r.kind === 'job' ? r : null; };

  if (p === '/poll') {
    const run = runs.get(url.searchParams.get('runId'));
    if (!run) { send(res, 404, { error: 'unknown runId' }); return true; }
    longPoll(req, res, run, Number(url.searchParams.get('since') || 0));
    return true;
  }
  if (p === '/inbox') {
    figmaSeen = { fileKey: String(url.searchParams.get('fileKey') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 128),
      fileName: clean(url.searchParams.get('fileName'), 200), lastSeen: Date.now() };
    longPoll(req, res, inbox, Number(url.searchParams.get('since') || 0));
    return true;
  }
  if (p === '/run/approve') {   // the plugin's Approve / Reject buttons under a plan
    const b = await readBody(req, 1e4), job = String(b.job || ''), fileKey = String(b.fileKey || ''), act = b.action === 'reject' ? 'reject' : 'approve';
    if (!/^bridge-out\/[\w.-]+$/.test(job) || !fs.existsSync(path.join(PROJ, job, 'run.json'))) return bad('unknown job');
    if (act === 'reject') { emitInbox('note', { name: 'end', text: 'Rejected — nothing was built. Change the request or the image and send again.', job, total: 0, url: '', block: '' }); send(res, 200, { ok: true }); return true; }
    if (!KEY_RE.test(fileKey)) return bad('no Figma file key');
    if (isBusy()) { send(res, 409, { error: 'busy' }); return true; }
    const run = newJob({ mode: 'claude', fileKey, fileName: '', text: 'approved build ' + job, selection: [], source: who });
    run.scripted = true; runScripted(run, ['build/run.js', '--job', job, '--file', fileKey, '--resume', '--approved', '--allow-structure']);
    send(res, 200, { ok: true, jobId: run.id }); return true;
  }
  if (p === '/note') {   // CLI progress line (run.js) → the plugin shows it as a timeline step (no Claude job needed)
    if (who !== 'cli') { send(res, 403, { error: 'CLI only' }); return true; }
    const b = await readBody(req, 1e5);
    let request = '';   // the end note carries the request → the plugin saves it in the file's history with the frame and the log
    if (b.name === 'end' && /^bridge-out\/[\w.-]+$/.test(String(b.job || ''))) { try { request = String(JSON.parse(fs.readFileSync(path.join(PROJ, String(b.job), 'request.json'), 'utf8')).text || ''); } catch (_) {} }
    emitInbox('note', { name: clean(b.name, 20) || 'analyse', text: clean(b.text, 300), total: Number(b.total) || 0, url: clean(b.url, 300), block: clean(b.block, 24000), job: clean(b.job, 80), request: clean(request, 300) });
    send(res, 200, { ok: true });
    return true;
  }
  if (p === '/make/ensure') {   // the Make tab needs the separate Make bridge (port 41779): start it for the user (node …/make-figma/ctl.js start)
    const ctl = makeCtl();
    if (!ctl) { send(res, 404, { ok: false, error: 'make-figma/ctl.js not found' }); return true; }
    try {
      const out = execFileSync(process.execPath, [ctl, 'start'], { encoding: 'utf8', timeout: 12000 });
      send(res, 200, { ok: true, ctl, out: String(out).trim().slice(0, 200) });
    } catch (e) { send(res, 500, { ok: false, ctl, error: String((e.stderr || e.message || '')).trim().slice(0, 200) }); }
    return true;
  }
  if (p === '/bridge/restart') {   // the plugin's "Restart server": the LaunchAgent restarts the bridge; without one the bridge starts itself again, detached
    send(res, 200, { ok: true, restarting: true });
    setTimeout(() => {
      try {
        const mc = makeCtl(); if (mc) { try { spawn(process.execPath, [mc, 'restart'], { detached: true, stdio: 'ignore' }).unref(); } catch (_) {} }   // restart ALL: the Make bridge too
        const uid = process.getuid ? process.getuid() : 501;
        try { execFileSync('/bin/launchctl', ['kickstart', '-k', `gui/${uid}/com.sap.v4-bridge`], { stdio: 'ignore', timeout: 5000 }); return; } catch (_) {}
        const c = spawn(process.execPath, [__filename], { cwd: PROJ, detached: true, stdio: 'ignore', env: process.env }); c.unref();
      } catch (_) {}
      process.exit(0);
    }, 300);
    return true;
  }
  if (p === '/job/status') {
    const s = jobIndex.get(url.searchParams.get('jobId') || '');
    if (!s) { send(res, 404, { error: 'unknown job' }); return true; }
    send(res, 200, s);
    return true;
  }
  if (p === '/job/last') {
    const id = lastJobByFile.get(url.searchParams.get('fileKey') || '');
    send(res, 200, (id && jobIndex.get(id)) || {});
    return true;
  }
  // v6 Figma Agent pack: runtime + tools + gold trees, written into the Figma file by the plugin (build/v6pack.js). ?ver=<have> → {current:true} when up to date.
  if (p === '/v6/pack') {
    try {
      const pack = require('../build/v6pack.js').buildPack();
      if (url.searchParams.get('ver') === pack.ver) send(res, 200, { current: true, ver: pack.ver });
      else send(res, 200, pack);
    } catch (e) { send(res, 500, { error: 'v6 pack failed: ' + e.message }); }
    return true;
  }
  // v5 tree jobs — GET side (plugin polls /tree/next; CLI long-polls /tree/wait).
  if (p === '/tree/next') {
    if (who !== 'plugin') { send(res, 403, { error: 'plugin only' }); return true; }
    treeGc();
    const fileKey = String(url.searchParams.get('fileKey') || '');
    let picked = null;
    for (const j of treeJobs.values()) {
      if (j.status === 'pending' && (!fileKey || j.fileKey === fileKey)) { if (!picked || j.seq < picked.seq) picked = j; }
    }
    if (!picked) { send(res, 200, {}); return true; }
    picked.status = 'running';
    picked.startedAt = Date.now();
    send(res, 200, { jobId: picked.id, name: picked.name, fileKey: picked.fileKey,
      payload: picked.payload, logos: picked.logos || [], want: picked.want });
    return true;
  }
  if (p === '/tree/wait') {
    if (who !== 'cli') { send(res, 403, { error: 'CLI only' }); return true; }
    const j = treeJobs.get(String(url.searchParams.get('jobId') || ''));
    if (!j) { send(res, 404, { error: 'unknown tree job' }); return true; }
    const timeoutMs = Math.min(300, Math.max(1, Number(url.searchParams.get('timeout') || 120))) * 1000;
    const settled = () => j.status === 'done' || j.status === 'error';
    if (settled()) { send(res, 200, treeResultLite(j)); return true; }
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(t);
      j._waiters = (j._waiters || []).filter((w) => w !== finish);
      send(res, 200, settled() ? treeResultLite(j) : { status: 'pending' }); };
    const t = setTimeout(finish, timeoutMs);
    j._waiters = j._waiters || [];
    j._waiters.push(finish);
    req.on('close', () => { done = true; clearTimeout(t); j._waiters = (j._waiters || []).filter((w) => w !== finish); });
    return true;
  }
  if (req.method !== 'POST') { send(res, 405, { error: 'POST only' }); return true; }

  if (p === '/agent/send') {   // Agent tab: the request goes straight into a NEW Figma Agent chat — no Claude job, the Figma Agent does all the work
    const b = await readBody(req, 1e6);
    const text = clean(b.text, 4000), fileKey = String(b.fileKey || '');
    if (!text) return bad('type a request');
    if (!KEY_RE.test(fileKey)) return bad('no Figma file key — the file must be saved in Figma');
    let drv; try { drv = require('../build/agent-drive.js'); } catch (_) { return bad('build/agent-drive.js is missing'); }
    const prev = agentLock; let release; agentLock = new Promise((r) => { release = r; }); await prev;   // one send at a time: a second request waits for the first
    try { await drv.ensure(fileKey); } catch (e) { release(); send(res, 409, { error: `Could not start the linked Chrome: ${String(e.message).slice(0, 120)}. Run: node build/agent-drive.js --launch ${fileKey}`, launch: fileKey }); return true; }
    const threadId = /^[0-9a-f-]{36}$/.test(String(b.threadId || '')) ? String(b.threadId) : null;   // follow-up: the same chat, not a new one
    try { const r = await drv.sendToAgent({ fileKey, text, threadId }); send(res, 200, { sent: true, threadId: r.threadId || threadId || null, threadUrl: r.threadUrl || null }); }
    catch (e) { send(res, 500, { error: 'Could not type into the Figma Agent chat: ' + String(e.message).slice(0, 160) }); }
    finally { release(); }
    return true;
  }
  if (p === '/agent/status' || p === '/agent/stop') {   // is the Figma Agent still working / press ITS Stop button
    const b = await readBody(req, 1e5), fileKey = String(b.fileKey || '');
    if (!KEY_RE.test(fileKey)) return bad('no Figma file key');
    let drv; try { drv = require('../build/agent-drive.js'); } catch (_) { return bad('build/agent-drive.js is missing'); }
    try {
      if (p === '/agent/status') { const st = await drv.status(fileKey); send(res, 200, { busy: !!st.busy, linked: !!st.tab }); }
      else { const r = await drv.stopAgent({ fileKey, wait: !!b.wait }); send(res, 200, r); }
    } catch (e) { send(res, 500, { error: String(e.message).slice(0, 160) }); }
    return true;
  }
  if (p === '/app/focus') {   // bring the Figma desktop app back to the front (the Make extension had to put Chrome in front to read popups)
    if (process.platform === 'darwin') { try { require('node:child_process').spawn('open', ['-a', 'Figma'], { detached: true, stdio: 'ignore' }).unref(); } catch (_) {} }
    send(res, 200, { ok: true });
    return true;
  }
  if (p === '/make/send') {   // Make tab: open figma.com/make in the debug Chrome and submit the prompt — no Claude job
    const b = await readBody(req, 1e6);
    const text = clean(b.text, 6000);
    if (!text) return bad('type a request');
    let drv; try { drv = require('../build/agent-drive.js'); } catch (_) { return bad('build/agent-drive.js is missing'); }
    try { const r = await drv.sendToMake({ text }); send(res, 200, { sent: true, makeUrl: r.makeUrl || null }); }
    catch (e) { send(res, 409, { error: 'Could not open Figma Make: ' + String(e.message).slice(0, 160) }); }
    return true;
  }
  if (p === '/job') {
    if (isBusy()) { send(res, 409, { error: 'Claude is busy with another job', jobId: currentJobId }); return true; }
    const b = await readBody(req, 22e6);
    if (b.__tooBig) return bad('request too big (image over 15 MB)');
    let text = clean(b.text, 4000).replace(/>>>|<<</g, '> > >');
    const said = text;   // the user's own words, before any context is added
    // a reply in the plugin after a screen job: Claude gets that job (plan, tree, log, frame) and answers in the plugin chat (2-way, 2026-10-04)
    const cj = String(b.contextJob || '');
    if (cj && /^bridge-out\/[\w.-]+$/.test(cj) && fs.existsSync(path.join(PROJ, cj, 'run.json'))) {
      let fr = ''; try { const t = fs.readFileSync(path.join(PROJ, cj, 'trace.md'), 'utf8'); const m = t.match(/https:\/\/www\.figma\.com\/design\/\S+/g); if (m) fr = m[m.length - 1]; } catch (_) {}
      text += `\n\n[CONTEXT — the user's message is about the screen job ${cj}: plan ${cj}/plan.txt · tree ${cj}/tree.json · full log ${cj}/trace.md · reference ${cj}/ref.png${fr ? ' · last frame ' + fr : ''}. A question → answer it in plain words. A change → change ${cj}/tree.json or the rules in build/, show the new plan (node build/run.js --job ${cj} --file <key> --resume --ask), and build only after the user approves (--approved). Reply in the chat in short simple sentences.]`;
    }
    const mode = b.mode === 'agent' ? 'agent' : 'claude';   // 'agent': Claude plans into the file mailbox, the Figma Agent builds it, the bridge checks (SAP Bridge v2 tabs, 2026-10-03)
    const fileKey = String(b.fileKey || '');
    if (!KEY_RE.test(fileKey)) return bad('no Figma file key — the file must be saved in Figma (drafts are fine)');
    const selection = (Array.isArray(b.selection) ? b.selection : []).slice(0, 20)
      .filter((s) => s && NODE_RE.test(String(s.id)))
      .map((s) => ({ id: String(s.id), name: clean(s.name, 200), type: clean(s.type, 40),
        width: Math.round(Number(s.width) || 0), height: Math.round(Number(s.height) || 0) }));
    let img = null;
    if (b.image && b.image.base64) {
      const mime = String(b.image.mime || 'image/png');
      if (!/^image\/(png|jpeg|webp)$/.test(mime)) return bad('the image must be png, jpeg or webp');
      const buf = Buffer.from(String(b.image.base64), 'base64');
      if (!buf.length || buf.length > 15e6) return bad('the image is empty or bigger than 15 MB');
      img = { buf, ext: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime],
        nodeId: NODE_RE.test(String(b.image.nodeId || '')) ? String(b.image.nodeId) : null };
    }
    if (!text && !img) return bad('type a request or add an image');
    const run = newJob({ mode, fileKey, fileName: clean(b.fileName, 200), text, selection, source: who });
    let cache = 'none';
    if (img) {
      run.refPath = path.join(run.jobDir, `ref.${img.ext}`);
      fs.writeFileSync(run.refPath, img.buf);
      const sha = crypto.createHash('sha1').update(img.buf).digest('hex').slice(0, 12);
      const cached = path.join(PROJ, 'knowledge', 'plans-cache', `${sha}.plan.json`);
      if (fs.existsSync(cached)) {
        fs.copyFileSync(cached, path.join(run.jobDir, 'plan.json'));
        cache = `${rel(cached)} (sha ${sha}) — measured and passed for this exact image; already copied to ${rel(run.jobDir)}/plan.json`;
      }
    }
    fs.writeFileSync(path.join(run.jobDir, 'request.json'), JSON.stringify({ text, mode, fileKey, fileName: run.fileName,
      selection, image: img ? { file: path.basename(run.refPath), nodeId: img.nodeId, bytes: img.buf.length } : null,
      at: new Date().toISOString() }, null, 2));
    let routed = '';   // the bridge routes first (0 tokens): the job saves one model turn (~10 s)
    try { const rj = JSON.parse(require('node:child_process').execFileSync(process.execPath, [path.join(PROJ, 'build', 'route.js'), String(text || '').replace(/\s+/g, ' ').slice(0, 600)], { cwd: PROJ, timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
      routed = `${rj.mode || '?'} · ${rj.floorplan || '—'} · ${(rj.components || []).map(c => c.name).join(', ') || '—'}`; } catch (_) {}
    const prompt = fillTpl(mode === 'agent' ? 'job.v4.md' : 'job.md', {   // v6 prompt for "Claude builds"; "Figma Agent builds" keeps the v4 plan→mailbox flow
      jobId: run.id, builder: mode === 'agent' ? 'figma-agent' : 'claude',
      text: text || '(no text — build the screen shown in the reference image)',
      fileKey, fileName: run.fileName, selection: selection.length ? JSON.stringify(selection) : 'none',
      ref: img ? `${rel(run.refPath)} (Figma node ${img.nodeId || '— dropped file, not on the canvas'})` : 'none',
      cache, jobDir: rel(run.jobDir), routed: routed || 'not routed — run node build/route.js yourself',
    });
    // TYPED DECISION (2026-10-04): "approve" / "reject" under a plan runs the same path as the buttons — no model, 0 tokens
    // "run again" / "try again" / "rebuild": rebuild the screen of the attached job — or, with none attached, the newest screen job that has a tree (0 tokens, no guessing)
    if (!img && /^\s*(run|try|build) (it )?again|^\s*rebuild\b|^\s*again\s*[.!]?\s*$/i.test(said)) {
      const last = cj && fs.existsSync(path.join(PROJ, cj, 'tree.json')) ? cj : (() => { try { return fs.readdirSync(path.join(PROJ, 'bridge-out')).map(d => 'bridge-out/' + d)
        .filter(d => fs.existsSync(path.join(PROJ, d, 'tree.json')) && fs.existsSync(path.join(PROJ, d, 'run.json'))).sort((a, b) => fs.statSync(path.join(PROJ, b, 'tree.json')).mtimeMs - fs.statSync(path.join(PROJ, a, 'tree.json')).mtimeMs)[0]; } catch (_) { return null; } })();
      if (last) { run.scripted = true; emit(run, 'progress', { text: 'Building the last screen again: ' + last });
        try { const sf = path.join(PROJ, last, 'run.json'), st = JSON.parse(fs.readFileSync(sf, 'utf8')); st.builds = 0; fs.writeFileSync(sf, JSON.stringify(st)); } catch (_) {}   // a new request = fresh fix rounds
        runScripted(run, ['build/run.js', '--job', last, '--file', fileKey, '--resume', '--approved', '--allow-structure']);
        send(res, 200, { jobId: run.id, scripted: true }); return true; }
    }
    if (!img && cj && /^\s*(approve[d]?|yes|go|ok|build( it)?)\s*[.!]?\s*$/i.test(said)) {
      run.scripted = true; emit(run, 'progress', { text: 'Approved — building the plan in Figma' });
      runScripted(run, ['build/run.js', '--job', cj, '--file', fileKey, '--resume', '--approved', '--allow-structure']);
      send(res, 200, { jobId: run.id, scripted: true }); return true;
    }
    if (!img && cj && /^\s*(reject(ed)?|no|cancel)\s*[.!]?\s*$/i.test(said)) {
      emitInbox('note', { name: 'end', text: 'Rejected — nothing was built. Change the request or the image and send again.', job: cj, total: 0, url: '', block: '' });
      finishJob(run, { mode: 'CHAT', reply: 'Rejected. Nothing was built.', pass: true }); send(res, 200, { jobId: run.id }); return true;
    }
    // CHAT HUB (2026-10-04): text without an image and without a "build a screen" request is a question or an instruction → Claude answers / does it
    // a build = a build verb + a screen noun ("create an invoice approval screen"), not a question that says "build" ("what is in the last build?")
    const question = /\?\s*$/.test(said) || /^\s*(what|why|how|which|who|where|when|is|are|does|do|can|could|show|list|tell|explain)\b/i.test(said);
    const buildAsk = /figma\.site\b|figma\.com\/make\//i.test(said) || /\b(new screen|from (zero|scratch))\b/i.test(said)
      || (!question && !cj && /^\s*(please\s+)?(build|create|design|generate)\b/i.test(said))
      || (!question && /\b(build|create|design|generate|make|draw)\b[^.?!]{0,60}\b(screen|page|app|dashboard|form|list report|worklist|object page|report|ui|mock-?up|wireframe|view)\b/i.test(said));
    if (!img && mode === 'claude' && !buildAsk) {
      run.chat = true;
      const chat = fillTpl('chat.md', { jobId: run.id, text: text, fileKey, fileName: run.fileName, jobDir: rel(run.jobDir), context: cj || 'none',
        selection: selection.length ? JSON.stringify(selection) : 'none' });
      emit(run, 'progress', { text: 'Reading your message…' });
      spawnJob(run, chat, false);
      send(res, 200, { jobId: run.id, chat: true }); return true;
    }
    // FREE PATH (2026-10-04): an image to build goes to the scripts + the plugin — no Claude. run.js shows the plan in the plugin and waits for
    // Approve / Reject / Modify there (/run/approve). Claude starts only for an edit request.
    if (img && mode === 'claude' && !/\b(fix|change|edit|move|rename|delete|remove|tweak|update|recolou?r)\b/i.test(text)) {
      run.scripted = true;
      const png = path.join(run.jobDir, 'ref.png');
      try { if (!/\.png$/.test(run.refPath)) require('node:child_process').execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2])', run.refPath, png], { timeout: 30000 }); }
      catch (e) { return bad('could not read the image: ' + e.message); }
      runScripted(run, ['build/run.js', rel(png), '--file', fileKey, '--job', rel(run.jobDir), '--ask']);
      send(res, 200, { jobId: run.id, scripted: true });
      return true;
    }
    emit(run, 'progress', { text: 'Starting Claude…' });
    spawnJob(run, prompt, false);
    send(res, 200, { jobId: run.id });
    return true;
  }
  if (p === '/mbx/push') {
    if (who !== 'cli') { send(res, 403, { error: 'CLI only' }); return true; }
    if (isBusy()) { send(res, 409, { error: 'Claude is busy with another job', jobId: currentJobId }); return true; }
    const b = await readBody(req, 5e6);
    if (b.__tooBig) return bad('plan too big');
    const plan = b.plan;
    if (!plan || !Array.isArray(plan.rows) || !plan.rows.length) return bad('the plan needs rows');
    let refSrc = null;
    if (b.ref) {
      refSrc = path.resolve(PROJ, String(b.ref));
      if (!refSrc.startsWith(PROJ + path.sep) || !fs.existsSync(refSrc)) return bad('ref must be an image inside the repo');
    }
    const fileKey = KEY_RE.test(String(b.fileKey || '')) ? String(b.fileKey) : (figmaSeen && figmaSeen.fileKey) || '';
    const run = newJob({ mode: 'agent', fileKey, fileName: figmaSeen ? figmaSeen.fileName : '',
      text: '(plan pushed from a Claude Code session)', selection: [], source: 'cli' });
    run.planPath = path.join(run.jobDir, 'plan.json');
    fs.writeFileSync(run.planPath, JSON.stringify(plan, null, 1));
    if (refSrc) {
      run.refPath = path.join(run.jobDir, `ref${path.extname(refSrc) || '.png'}`);
      fs.copyFileSync(refSrc, run.refPath);
      try {
        execFileSync('python3', ['build/crop-logos.py', run.planPath, run.refPath, path.join(run.jobDir, 'logos')],
          { cwd: PROJ, timeout: 30000, stdio: 'ignore' });
      } catch (_) {}
    }
    stage(run, 'plan', `${(plan.sections || []).length} sections · ${plan.rows.length} rows · from Claude Code`);
    sendPlanMailbox(run, plan);
    send(res, 200, { jobId: run.id });
    return true;
  }

  // v5 tree job — queue a ready payload for the plugin to build (CLI only).
  if (p === '/tree') {
    if (who !== 'cli') { send(res, 403, { error: 'CLI only' }); return true; }
    treeGc();
    const b = await readBody(req, 5.2e6);        // payload + logos may reach ~5 MB
    if (b.__tooBig) return bad('tree job too big (over ~5 MB)');
    const fileKey = String(b.fileKey || '');
    if (!KEY_RE.test(fileKey)) return bad('bad or missing fileKey');
    const pl = b.payload;
    const isRename = !!(pl && pl.rename && /^\d+:\d+$/.test(String(pl.rename.nodeId || '')) && String(pl.rename.name || '').trim());   // a one-line rename job (build/rename.js)
    if (!isRename && (!pl || typeof pl.runtime !== 'string' || !pl.runtime || pl.tree == null || pl.kit == null)) {
      return bad('payload must be {version, runtime, kit, tree} from render.js --json');
    }
    const logos = (Array.isArray(b.logos) ? b.logos : []).slice(0, 120)
      .filter((l) => l && l.name && typeof l.pngBase64 === 'string' && l.pngBase64)
      .map((l) => ({ name: clean(l.name, 120), pngBase64: String(l.pngBase64) }));
    const jobDir = b.jobDir ? path.resolve(PROJ, String(b.jobDir)) : null;
    const id = crypto.randomBytes(8).toString('hex');
    const job = { id, seq: treeSeq++, status: 'pending', createdAt: Date.now(), settledAt: 0,
      fileKey, name: clean(b.name, 200) || 'Screen', jobDir,
      payload: isRename ? { rename: { nodeId: String(pl.rename.nodeId), name: clean(pl.rename.name, 120) } } : { version: String(pl.version || ''), runtime: pl.runtime, kit: pl.kit, tree: pl.tree },
      logos, want: Object.assign({ geometry: true, audit: true, pngScale: 2 }, b.want || {}),
      result: null, _waiters: [] };
    treeJobs.set(id, job);
    console.log(`[tree ${id}] queued · file ${fileKey} · ${isRename ? 'rename' : logos.length + ' logo(s) · payload ' + JSON.stringify(pl.tree).length + 'b'}`);
    send(res, 200, { jobId: id });
    return true;
  }
  // v5 tree job — the plugin posts the built result (plugin only). Writes into <jobDir>/check/.
  if (p === '/tree/result') {
    if (who !== 'plugin') { send(res, 403, { error: 'plugin only' }); return true; }
    const b = await readBody(req, 5.2e6);        // decoded PNG base64 may be large
    if (b.__tooBig) return bad('tree result too big (over ~5 MB)');
    const job = treeJobs.get(String(b.jobId || ''));
    if (!job) { send(res, 404, { error: 'unknown tree job' }); return true; }
    writeTreeResult(job, b);
    settleTreeJob(job, b);
    send(res, 202, { ok: true });
    return true;
  }

  if (p === '/job/open-log' && req.method === 'POST') {          // the plugin's log icon: the readable trace of a job (trace.md), returned as text
    const body = await readBody(req), id = String((body && body.jobId) || '').replace(/^bridge-out\//, '');
    if (!/^[A-Za-z0-9][\w.-]{2,63}$/.test(id)) return bad('bad job id');
    const dir = path.join(OUT, id);
    if (!fs.existsSync(dir)) { send(res, 404, { error: 'no log folder for this job (it ran before logging, or was removed)' }); return true; }
    if (!fs.existsSync(path.join(dir, 'transcript.jsonl')) && fs.existsSync(path.join(dir, 'trace.md'))) {   // a script job: run.js wrote the full log itself
      send(res, 200, { ok: true, file: path.relative(PROJ, path.join(dir, 'trace.md')), text: fs.readFileSync(path.join(dir, 'trace.md'), 'utf8') }); return true; }
    try { const f = require('./trace.js').write(dir); send(res, 200, { ok: true, file: path.relative(PROJ, f), text: fs.readFileSync(f, 'utf8') }); }
    catch (e) { send(res, 500, { error: String(e.message || e) }); }
    return true;
  }
  const b = await readBody(req);
  const run = getJob(b.jobId);
  if (!run) { send(res, 404, { error: 'unknown job' }); return true; }
  if (p === '/answer') {
    if (run.phase !== 'ask') { send(res, 409, { error: `not asking (phase ${run.phase})` }); return true; }
    const ans = clean(b.text, 1000).replace(/>>>|<<</g, '> > >');
    if (!ans) return bad('empty answer');
    emit(run, 'progress', { text: 'Answer sent — continuing…' });
    spawnJob(run, `Answer from the user (data):\n<<<\n${ans}\n>>>\nContinue the job from where you stopped. Same rules, same STAGE and AGENT_ markers.`, true);
    send(res, 202, { ok: true });
    return true;
  }
  if (p === '/job/logos-done') {
    if (run.phase !== 'logos') { send(res, 409, { error: `not placing logos (phase ${run.phase})` }); return true; }
    run.logosPlaced = Math.max(0, Math.round(Number(b.placed) || 0));
    stage(run, 'logos', `${run.logosPlaced} logo(s) placed`);
    startCheck(run);
    send(res, 202, { ok: true });
    return true;
  }
  if (p === '/mbx/done') {
    if (run.mode !== 'agent' || run.phase !== 'waiting-agent') { send(res, 409, { error: `not waiting for the Figma Agent (phase ${run.phase})` }); return true; }
    if (!NODE_RE.test(String(b.nodeId || ''))) return bad('bad node id');
    const warn = (Array.isArray(b.WARN) ? b.WARN : []).slice(0, 50).map((w) => clean(w, 200));
    stage(run, 'execute', `built by the Figma Agent · ${b.nodeId} · WARN ${warn.length}`);
    afterBuilt(run, String(b.nodeId));
    send(res, 202, { ok: true });
    return true;
  }
  if (p === '/job/cancel') {
    if (run.child && !run.childExited) { try { run.child.kill('SIGTERM'); } catch (_) {} }
    fail(run, 'cancelled');
    send(res, 202, { ok: true });
    return true;
  }
  return bad('unknown route');
}

// ── Server ────────────────────────────────────────────────────────────────────
let agentLock = Promise.resolve();   // serialises /agent/send
const server = http.createServer(async (req, res) => {
  // Reject non-loopback Host. Plugin iframes have origin "null" — allow it.
  const host = (req.headers.host || '').split(':')[0];
  if (host !== '127.0.0.1' && host !== 'localhost') { res.writeHead(403); return res.end('bad host'); }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  // Handle CORS preflight (Figma sandbox sends OPTIONS before cross-origin POSTs).
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Bridge-Token',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // v4 routes + /health (never returns a token or an absolute path) + /pair + /poll.
  try {
    if (await handleV4(req, res, url)) return;
  } catch (e) {
    console.log(`[v4] ${url.pathname} failed: ${e.message}`);
    if (!res.headersSent) return send(res, 500, { error: 'bridge error' });
    return;
  }

  // NOTE: the /token route was REMOVED (SECURITY FIX 2026-07-21). The token must be configured
  // out-of-band — it is printed only to the operator's terminal at startup. Serving the secret
  // over an unauthenticated HTTP route defeated the entire auth scheme.

  // All other routes require the token (constant-time compare; never log token bytes).
  const incoming = reqToken(req, url);
  let okToken = false;
  try {
    const a = Buffer.from(String(incoming));
    const b = Buffer.from(String(TOKEN));
    okToken = a.length === b.length && require('crypto').timingSafeEqual(a, b);
  } catch (_) { okToken = false; }
  if (!okToken) {
    console.log('[auth] REJECTED: bad or missing token');
    return send(res, 401, { error: 'bad or missing token' });
  }

  // /run — start a run: spawn child, arm turn-1 sentinel, send turn 1.
  if (url.pathname === '/run' && req.method === 'POST') {
    const body = await readBody(req);
    const desc = String(body.text || '').slice(0, 4000);
    const selection = body.selection || null;
    const fileKey = body.fileKey || null;
    if (!desc) return send(res, 400, { error: 'empty description' });
    if (!selection || !selection.id) return send(res, 400, { error: 'no selected node' });
    // SECURITY FIX 2026-07-21: validate caller-controlled params before they flow into prompt
    // templates / clone snippets. Figma node ids are "<num>:<num>" (or hyphen form); file keys
    // are alphanumeric. Reject anything else rather than interpolate untrusted strings.
    if (!/^[0-9]+[:-][0-9]+$/.test(String(selection.id))) {
      return send(res, 400, { error: 'invalid node id format' });
    }
    if (fileKey && !/^[A-Za-z0-9]+$/.test(String(fileKey))) {
      return send(res, 400, { error: 'invalid file key format' });
    }
    // Bound concurrent runs so a caller cannot spawn unbounded claude children.
    if (liveRunCount() >= MAX_CONCURRENT_RUNS) {
      return send(res, 429, { error: 'too many concurrent runs; try again shortly' });
    }
    // Sanitize the node name (used in the prompt) — strip control chars, length-bound.
    if (selection.name != null) {
      selection.name = String(selection.name).replace(/[\x00-\x1f]/g, ' ').slice(0, 200);
    }

    const run = newRun();
    run.selection = selection; run.fileKey = fileKey;

    // Arm the read-only gate for turn 1 (guard-agent-turn1.sh hard-blocks use_figma while present).
    try { fs.mkdirSync(path.dirname(TURN1_SENTINEL), { recursive: true }); } catch (_) {}
    fs.writeFileSync(TURN1_SENTINEL, run.id);

    spawnChild(run);
    run.phase = 'awaiting-wireframe';
    run.timer = setTimeout(() => fail(run, 'timed out producing a wireframe'), TURN1_TIMEOUT_MS);
    sendTurn(run, frameTurn1(desc, selection.id, selection.name || '(unnamed)', fileKey));

    return send(res, 200, { runId: run.id, streamUrl: `/stream?runId=${run.id}&token=${TOKEN}` });
  }

  // /approve — send turn 2 (build). Requires the run to be at need-approval.
  if (url.pathname === '/approve' && req.method === 'POST') {
    const body = await readBody(req);
    const run = runs.get(body.runId);
    if (!run) return send(res, 404, { error: 'unknown runId' });
    if (run.phase !== 'need-approval') return send(res, 409, { error: `not awaiting approval (phase=${run.phase})` });
    if (!run.sessionId) return send(res, 409, { error: 'no session id — cannot resume' });

    const approval = String(body.text || 'approve — build it beside the original').slice(0, 500);
    // Disarm the read-only gate BEFORE the build turn so use_figma is allowed again.
    try { fs.rmSync(TURN1_SENTINEL, { force: true }); } catch (_) {}
    run.phase = 'building';
    run.timer = setTimeout(() => fail(run, 'timed out building the screen'), TURN2_TIMEOUT_MS);
    const turn2Content = frameTurn2(approval, run.selection.id, run.fileKey);
    if (!run.childExited && run.child && !run.child.killed) {
      // Child still alive (rare): send via existing stdin.
      sendTurn(run, turn2Content);
    } else {
      // Normal case: child exited after Turn 1. Resume session with a new process.
      // SessionStart hook wipes .wireframe-approved + .reuse-declared — re-write them
      // immediately after spawning so the resumed child sees them already in place.
      emit(run, 'progress', { text: '[bridge] resuming session for Turn 2…' });
      // Restore gate markers via helper script (bridge source must not reference marker names
      // in writeFileSync — the startup self-check would trip). The helper writes them.
      const restoreScript = path.join(PROJ, '.claude', 'hooks', 'restore-turn2-markers.sh');
      // SECURITY FIX 2026-07-21: use execFileSync (args array, NO shell) so restoreScript/PROJ/rd
      // are passed as literal argv — removes all shell-interpolation/injection risk. Bounded by a
      // timeout + maxBuffer so a hung helper cannot freeze the event loop indefinitely.
      const EXEC_OPTS = { timeout: 5000, maxBuffer: 1 << 20 };
      try {
        const rd = fs.readFileSync(path.join(PROJ, '.claude', '.reuse-declared'), 'utf8').trim();
        execFileSync('bash', [restoreScript, PROJ, rd], EXEC_OPTS);
      } catch (_) {
        try { execFileSync('bash', [restoreScript, PROJ], EXEC_OPTS); } catch (_2) {}
      }
      spawnChildResume(run, turn2Content);
    }
    return send(res, 202, { ok: true });
  }

  // /stream — SSE. Replays past events then streams live.
  if (url.pathname === '/stream') {
    const run = runs.get(url.searchParams.get('runId'));
    if (!run) return send(res, 404, { error: 'unknown runId' });
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    });
    for (const evt of run.events) res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
    run.sseClients.add(res);
    const ka = setInterval(() => { try { res.write(': keepalive\n\n'); } catch (_) {} }, 15000);
    run._ka = ka;
    req.on('close', () => { clearInterval(ka); run.sseClients.delete(res); });
    return;
  }

  return send(res, 404, { error: 'not found' });
});

// ── Boot ────────────────────────────────────────────────────────────────────────
// Self-check: refuse to run if this file could ever write a forbidden marker (defense in depth).
const selfSrc = fs.readFileSync(__filename, 'utf8');
for (const m of FORBIDDEN_MARKERS) {
  // allow the marker names to appear in comments/strings, but not as a writeFileSync target
  const bad = new RegExp(`writeFileSync\\([^)]*${m.replace('.', '\\.')}`);
  if (bad.test(selfSrc)) {
    console.error(`FATAL: bridge must never write ${m}. Aborting.`);
    process.exit(1);
  }
}

try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {}
let portTry = 0;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && !PORT_FIXED && portTry < 9) {   // our own bridge already runs there → done; a foreign process → the next port
    const probe = http.get({ host: HOST, port: PORT, path: '/health', timeout: 1500 }, (r) => {
      let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => {
        let own = false; try { own = JSON.parse(b).app === 'sap-v4-bridge'; } catch (_) {}
        if (own) { console.log(`SAP Bridge already runs on port ${PORT}.`); process.exit(0); }
        PORT++; portTry++; server.listen(PORT, HOST);
      });
    });
    probe.on('error', () => { PORT++; portTry++; server.listen(PORT, HOST); });
    probe.on('timeout', () => probe.destroy());
    return;
  }
  console.error(e.code === 'EADDRINUSE'
    ? `Port ${PORT} is in use — another bridge runs. Stop it, then: node build/mailbox.js ensure`
    : `bridge error: ${e.message}`);
  process.exit(1);
});
if (require.main === module) {
  server.on('listening', () => { try { fs.writeFileSync(PORT_FILE, String(PORT)); } catch (_) {} });
  server.listen(PORT, HOST, () => {
    console.log(`[${new Date().toISOString()}] SAP Bridge v4 on http://localhost:${PORT} · repo ${path.basename(PROJ)} · model ${CFG.model}`);
    console.log('  Figma: open the SAP Bridge plugin — it connects by itself. CLI token: .claude/.bridge-token');
  });
}
module.exports = { server, handleV4 };
