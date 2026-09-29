// bridge-tree.test.js — v5 "tree jobs": the SAP Bridge plugin builds the tree itself, the model types
// nothing. Starts bridge/server.js on a TEST port with a temp state dir (never the LaunchAgent's 41778),
// runs a FAKE plugin (pair → poll /tree/next → POST /tree/result), and checks the round trip, auth,
// files written, the /tree/wait long-poll timeout, and build/send.js end to end.
// Run: node --test test/bridge-tree.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'bridge', 'server.js');
const PORT = 41799;                 // NOT 41778 — never touch the LaunchAgent bridge
const BASE = `http://localhost:${PORT}`;

let stateDir, tokenFile, pairFile, treeDir, cliToken, child, pluginToken;

function tmp(pfx) { return fs.mkdtempSync(path.join(os.tmpdir(), pfx)); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(route, { method = 'GET', body, token, origin } = {}) {
  const sep = route.includes('?') ? '&' : '?';
  const url = BASE + route + (token !== undefined ? sep + 'token=' + encodeURIComponent(token) : '');
  const init = { method, headers: {}, signal: AbortSignal.timeout(30000) };
  if (origin) init.headers.Origin = origin;
  if (body !== undefined) init.body = JSON.stringify(body);
  const r = await fetch(url, init);
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}
async function health() { try { const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) }); return await r.json(); } catch (_) { return null; } }

test.before(async () => {
  stateDir = tmp('bridge-tree-');
  treeDir = path.join(stateDir, 'tree-jobs');
  tokenFile = path.join(stateDir, '.bridge-token');
  pairFile = path.join(stateDir, '.bridge-pair.json');
  cliToken = 'x'.repeat(48);
  fs.writeFileSync(tokenFile, cliToken);
  child = spawn(process.execPath, [SERVER], {
    cwd: ROOT,
    env: { ...process.env, SAP_BRIDGE_PORT: String(PORT), SAP_BRIDGE_OUT: stateDir,
      SAP_BRIDGE_TREE_DIR: treeDir, SAP_BRIDGE_TOKEN_FILE: tokenFile, SAP_BRIDGE_PAIR: pairFile },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  let up = false;
  for (let i = 0; i < 40; i++) { const h = await health(); if (h && h.app === 'sap-v4-bridge') { up = true; break; } await sleep(150); }
  if (!up) throw new Error('test bridge did not start on port ' + PORT);
  // pair ONCE (trust-on-first-use) — every test reuses this plugin token.
  const r = await api('/pair', { origin: 'null' });
  if (r.status !== 200 || !r.json || !r.json.token) throw new Error('pair failed: ' + r.status + ' ' + JSON.stringify(r.json));
  pluginToken = r.json.token;
});

test.after(async () => {
  if (child) { try { child.kill('SIGKILL'); } catch (_) {} }
  try { fs.rmSync(stateDir, { recursive: true, force: true }); } catch (_) {}
});

function tinyTree() {
  return { n: 'Screen', sz: 'x', w: 200, h: 100, d: 'V', bg: 'sapBackgroundColor',
    c: [{ n: 'Title', k: 't', t: 'Purchase Orders', st: 'H4/Bold', bg: 'sapTitleColor', s: 'HH', w: 120, h: 20 }] };
}
function payloadFor(treeF) {
  const out = execFileSync(process.execPath, ['build/render.js', treeF, '--json'], { cwd: ROOT, maxBuffer: 32 << 20 }).toString();
  return JSON.parse(out);
}
// a synthetic audit dump + geometry that a fake plugin would return (no Figma needed)
function synthAudit() {
  return [{ id: '1:1', type: 'FRAME', name: 'Screen', inInst: false, fill: 'sapBackgroundColor', stroke: '' },
    { id: '1:2', type: 'TEXT', name: 'Title', inInst: false, text: 'Purchase Orders', style: 'H4/Bold', fill: 'sapTitleColor', font: '72' }];
}
function synthGeom() {
  return [['1:1', 'FRAME', 'Screen', 0, 0, 200, 100, 0, '', 'sapBackgroundColor', '', '', 'VERTICAL', '', ''],
    ['1:2', 'TEXT', 'Title', 10, 10, 120, 20, 0, '', '', '', '', '', 'Purchase Orders', '1:1']];
}
// a 1x1 PNG
const PNG1 = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cff0bf1f0005fe02fea735c8420000000049454e44ae426082', 'hex');

test('plugin runtime is compiled into code.js and up to date (Figma plugins cannot run new Function)', () => {
  const r = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'build', 'plugin-bundle.js'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  const code = fs.readFileSync(path.join(ROOT, 'plugin', 'sap-bridge', 'code.js'), 'utf8');
  assert.ok(!/new (Async)?Function\(/.test(code), 'no code built from text');
});

test('auth: no token → 401; CLI token cannot poll /tree/next (plugin only); plugin token cannot POST /tree (CLI only)', async () => {
  assert.strictEqual((await api('/tree', { method: 'POST' })).status, 401);
  assert.strictEqual((await api('/tree/next?fileKey=ABC')).status, 401);
  assert.strictEqual((await api('/tree/result', { method: 'POST' })).status, 401);
  const cliOnNext = await api('/tree/next?fileKey=ABC', { token: cliToken });
  assert.strictEqual(cliOnNext.status, 403, JSON.stringify(cliOnNext.json));
  const plugOnTree = await api('/tree', { method: 'POST', token: pluginToken, body: {} });
  assert.strictEqual(plugOnTree.status, 403, JSON.stringify(plugOnTree.json));
});

test('round trip: CLI queues /tree, fake plugin polls /tree/next and posts /tree/result; files land in <jobDir>/check', async () => {
  const pluginTok = pluginToken;
  const fileKey = 'TESTFILEKEY01';
  const jobDir = tmp('tree-job-');
  const treeF = path.join(jobDir, 'tree.json');
  fs.writeFileSync(treeF, JSON.stringify(tinyTree()));
  const payload = payloadFor(treeF);

  // CLI queues the job
  const q = await api('/tree', { method: 'POST', token: cliToken,
    body: { fileKey, jobDir, name: 'tiny', payload, logos: [{ name: 'Logo', pngBase64: PNG1.toString('base64') }],
      want: { geometry: true, audit: true, pngScale: 2 } } });
  assert.strictEqual(q.status, 200, JSON.stringify(q.json));
  const jobId = q.json.jobId;
  assert.ok(jobId, 'jobId returned');

  // fake plugin: poll /tree/next
  const next = await api('/tree/next?fileKey=' + fileKey, { token: pluginTok });
  assert.strictEqual(next.status, 200);
  assert.strictEqual(next.json.jobId, jobId);
  assert.strictEqual(next.json.fileKey, fileKey);
  assert.ok(next.json.payload && next.json.payload.runtime && next.json.payload.tree, 'payload carried');
  assert.strictEqual(next.json.logos.length, 1);
  assert.strictEqual(next.json.logos[0].name, 'Logo');

  // a second poll returns nothing (job is now running)
  assert.deepStrictEqual((await api('/tree/next?fileKey=' + fileKey, { token: pluginTok })).json, {});

  // fake plugin posts the result
  const rr = await api('/tree/result', { method: 'POST', token: pluginTok,
    body: { jobId, ok: true, nodeId: '1:1', made: 2, WARN: [], ms: 123,
      geometry: synthGeom(), audit: synthAudit(), pngBase64: PNG1.toString('base64') } });
  assert.strictEqual(rr.status, 202, JSON.stringify(rr.json));

  // files written into <jobDir>/check
  const cdir = path.join(jobDir, 'check');
  assert.ok(fs.existsSync(path.join(cdir, 'geometry.json')), 'geometry.json');
  assert.ok(fs.existsSync(path.join(cdir, 'tree.json')), 'tree.json (audit dump)');
  assert.ok(fs.existsSync(path.join(cdir, 'build@2x.png')), 'build@2x.png');
  assert.ok(fs.existsSync(path.join(cdir, 'result.json')), 'result.json');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(cdir, 'tree.json'), 'utf8')), synthAudit());
  assert.ok(fs.readFileSync(path.join(cdir, 'build@2x.png')).equals(PNG1), 'png decoded byte-exact');

  // CLI /tree/wait returns the settled result without the big blobs
  const w = await api('/tree/wait?jobId=' + jobId + '&timeout=5', { token: cliToken });
  assert.strictEqual(w.status, 200);
  assert.strictEqual(w.json.status, 'done');
  assert.strictEqual(w.json.ok, true);
  assert.strictEqual(w.json.nodeId, '1:1');
  assert.ok(!('geometry' in w.json) && !('pngBase64' in w.json), 'no big blobs in the wait reply');

  fs.rmSync(jobDir, { recursive: true, force: true });
});

test('/tree/wait long-poll times out with {status:"pending"} while the job is unbuilt', async () => {
  const fileKey = 'PENDINGKEY01';
  const jobDir = tmp('tree-pending-');
  fs.writeFileSync(path.join(jobDir, 'tree.json'), JSON.stringify(tinyTree()));
  const payload = payloadFor(path.join(jobDir, 'tree.json'));
  const q = await api('/tree', { method: 'POST', token: cliToken, body: { fileKey, jobDir, name: 'p', payload } });
  assert.strictEqual(q.status, 200);
  const t0 = Date.now();
  const w = await api('/tree/wait?jobId=' + q.json.jobId + '&timeout=1', { token: cliToken });
  assert.ok(Date.now() - t0 >= 900, 'held for ~the timeout');
  assert.strictEqual(w.json.status, 'pending');
  fs.rmSync(jobDir, { recursive: true, force: true });
});

test('/tree/result with ok:false settles the job as an error and carries WARN', async () => {
  const token = pluginToken;
  const fileKey = 'ERRKEY000001';
  const jobDir = tmp('tree-err-');
  fs.writeFileSync(path.join(jobDir, 'tree.json'), JSON.stringify(tinyTree()));
  const payload = payloadFor(path.join(jobDir, 'tree.json'));
  const q = await api('/tree', { method: 'POST', token: cliToken, body: { fileKey, jobDir, name: 'e', payload } });
  await api('/tree/next?fileKey=' + fileKey, { token });
  const rr = await api('/tree/result', { method: 'POST', token, body: { jobId: q.json.jobId, ok: false, error: 'INSTALL FIRST', WARN: ['INSTALL FIRST'] } });
  assert.strictEqual(rr.status, 202);
  const w = await api('/tree/wait?jobId=' + q.json.jobId + '&timeout=3', { token: cliToken });
  assert.strictEqual(w.json.status, 'error');
  assert.strictEqual(w.json.ok, false);
  assert.match(w.json.error || '', /INSTALL FIRST/);
  fs.rmSync(jobDir, { recursive: true, force: true });
});

test('send.js end to end: renders the payload, queues it, a fake plugin builds it, then gates run on the returned files', async () => {
  const token = pluginToken;
  const fileKey = 'SENDKEY00001';
  const jobDir = tmp('tree-send-');
  fs.writeFileSync(path.join(jobDir, 'tree.json'), JSON.stringify(tinyTree()));

  // start send.js — it will queue a job then long-poll /tree/wait
  const proc = spawn(process.execPath, ['build/send.js', jobDir, '--file', fileKey, '--timeout', '30'], {
    cwd: ROOT,
    env: { ...process.env, SAP_BRIDGE_PORT: String(PORT), SAP_BRIDGE_TOKEN_FILE: tokenFile },
  });
  let out = ''; proc.stdout.on('data', (d) => { out += d; }); proc.stderr.on('data', (d) => { out += d; });

  // the fake plugin: register the file (heartbeat) then poll /tree/next and post a result
  let jobId = null;
  for (let i = 0; i < 60 && !jobId; i++) {
    // heartbeat so send.js sees figma "here"
    fetch(`${BASE}/inbox?since=0&fileKey=${fileKey}&fileName=Test&token=${token}`, { signal: AbortSignal.timeout(1000) }).catch(() => {});
    const n = await api('/tree/next?fileKey=' + fileKey, { token });
    if (n.status === 200 && n.json && n.json.jobId) { jobId = n.json.jobId; break; }
    await sleep(300);
  }
  assert.ok(jobId, 'the fake plugin picked up send.js\'s job');
  await api('/tree/result', { method: 'POST', token, body: { jobId, ok: true, nodeId: '1:1', made: 2, WARN: [], ms: 50,
    geometry: synthGeom(), audit: synthAudit(), pngBase64: PNG1.toString('base64') } });

  const code = await new Promise((resolve) => proc.on('exit', resolve));
  // send.js prints the node link, a WARN line, a MATCH gate line, and elapsed
  assert.match(out, new RegExp('figma\\.com/design/' + fileKey + '/\\?node-id=1-1'), out);
  assert.match(out, /WARN:/, out);
  assert.match(out, /MATCH /, out);
  assert.match(out, /elapsed \d+ ms/, out);
  assert.ok(fs.existsSync(path.join(jobDir, 'check', 'plan.json')), 'gates plan.json written');
  assert.ok(fs.existsSync(path.join(jobDir, 'check', 'tree.json')), 'audit tree.json written');
  assert.ok(code === 0 || code === 1, 'send.js exits 0 (pass) or 1 (gate not passed), got ' + code);
  fs.rmSync(jobDir, { recursive: true, force: true });
});
