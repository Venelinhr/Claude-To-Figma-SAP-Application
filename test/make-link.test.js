// make-link.test.js — Make link → dump (bridge/make-link.js + build/make-fetch.js decide()).
// Unit: the URL allow-list, the job state machine (stubbed fetch — no Chrome), the page decision. Integration: the bridge routes on a TEST
// port (never 41778) with invalid links only, so Chrome is never started.
// Run: node --test test/make-link.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { checkUrl, createMakeJobs } = require('../bridge/make-link.js');
const { decide } = require('../build/make-fetch.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── allow-list ────────────────────────────────────────────────────────────────────────────
test('checkUrl: accepts Make links and published sites', () => {
  assert.deepStrictEqual(checkUrl('https://some-words.figma.site/').kind, 'site');
  assert.deepStrictEqual(checkUrl('https://app-abc123.makeproxy-c.figma.site/').kind, 'site');
  assert.deepStrictEqual(checkUrl('https://www.figma.com/make/4hP9yYYnWLaW3ekr4bnKfW/SAP-Screen-Reference?code-node-id=0-6&p=f&fullscreen=1').kind, 'editor');
  assert.deepStrictEqual(checkUrl('  https://figma.com/make/dLA6SNUZKvke9Reb9Zq8hq  ').kind, 'editor');
});

test('checkUrl: rejects everything else (SSRF guard)', () => {
  for (const bad of ['', 'not a url', 'http://x.figma.site/', 'file:///etc/passwd', 'https://evil.com/?u=x.figma.site', 'https://figma.site.evil.com/',
    'https://evilfigma.site/x.figma.site', 'https://user:pw@x.figma.site/', 'https://x.figma.site:8443/', 'http://127.0.0.1:41778/health',
    'https://www.figma.com/design/L9bomZ4CKDmBGQfGM9C61z/x', 'https://www.figma.com/make/short', 'https://' + 'a'.repeat(2100) + '.figma.site/']) {
    const r = checkUrl(bad);
    assert.strictEqual(r.ok, false, 'should reject: ' + bad.slice(0, 60));
    assert.ok(r.error && typeof r.error === 'string');
  }
});

// ── job state machine ─────────────────────────────────────────────────────────────────────
test('jobs: running → done delivers the dump once finished', async () => {
  let release; const gate = new Promise((r) => { release = r; });
  const jobs = createMakeJobs({ fetchDump: async (url, o) => { o.onStatus('Loading…'); await gate; return '{"controls":[1]}'; } });
  const s = jobs.start('https://x.figma.site/');
  assert.ok(s.id);
  await sleep(10);
  const mid = jobs.get(s.id);
  assert.strictEqual(mid.status, 'running');
  assert.strictEqual(mid.step, 'Loading…');
  assert.strictEqual(mid.dump, undefined);
  release(); await sleep(20);
  const end = jobs.get(s.id);
  assert.strictEqual(end.status, 'done');
  assert.strictEqual(end.dump, '{"controls":[1]}');
});

test('jobs: a failed fetch becomes status error with the message', async () => {
  const jobs = createMakeJobs({ fetchDump: async () => { throw new Error('This link needs a Figma login'); } });
  const s = jobs.start('https://www.figma.com/make/4hP9yYYnWLaW3ekr4bnKfW/x');
  await sleep(20);
  const r = jobs.get(s.id);
  assert.strictEqual(r.status, 'error');
  assert.match(r.error, /login/);
  assert.strictEqual(r.dump, undefined);
});

test('jobs: one at a time (409), then free again', async () => {
  let release; const gate = new Promise((r) => { release = r; });
  const jobs = createMakeJobs({ fetchDump: async () => { await gate; return '{}'; } });
  jobs.start('https://a.figma.site/');
  const b = jobs.start('https://b.figma.site/');
  assert.strictEqual(b.code, 409);
  release(); await sleep(20);
  assert.ok(jobs.start('https://c.figma.site/').id);
});

test('jobs: a bad link is refused before any fetch (400)', () => {
  let called = false;
  const jobs = createMakeJobs({ fetchDump: async () => { called = true; return '{}'; } });
  const r = jobs.start('https://evil.com/');
  assert.strictEqual(r.code, 400);
  assert.strictEqual(called, false);
});

test('jobs: a hung fetch times out; finished jobs are dropped after the TTL', async () => {
  let t = 1000;
  const jobs = createMakeJobs({ timeoutMs: 20, graceMs: 0, ttlMs: 50, now: () => t, fetchDump: () => new Promise(() => {}) });
  const s = jobs.start('https://x.figma.site/');
  await sleep(60);
  assert.strictEqual(jobs.get(s.id).status, 'error');
  assert.match(jobs.get(s.id).error, /Timed out/);
  t += 1000;                                                        // past the TTL
  assert.strictEqual(jobs.get(s.id), null);
});

test('jobs: width is clamped to a sane range', async () => {
  const seen = [];
  const jobs = createMakeJobs({ fetchDump: async (u, o) => { seen.push(o.width); return '{}'; } });
  jobs.start('https://a.figma.site/', { width: 1728 }); await sleep(15);
  jobs.start('https://b.figma.site/', { width: 99999 }); await sleep(15);
  jobs.start('https://c.figma.site/', { width: 'x' }); await sleep(15);
  assert.deepStrictEqual(seen, [1728, 1440, 1440]);
});

// ── what the headless page decision does ─────────────────────────────────────────────────
test('decide(): ready / follow the Make iframe / login / wait', () => {
  assert.strictEqual(decide({ ok: true, host: 'x.figma.site' }, 0, false).act, 'ready');
  const make = { ok: false, host: 'www.figma.com', path: '/make/abc', frame: 'https://app-1.makeproxy-c.figma.site/' };
  assert.deepStrictEqual(decide(make, 1000, false), { act: 'follow', url: 'https://app-1.makeproxy-c.figma.site/' });
  assert.strictEqual(decide(make, 1000, true).act, 'wait');                                     // already followed: keep waiting
  assert.strictEqual(decide({ ok: false, host: 'www.figma.com', path: '/login', frame: '' }, 500, false).act, 'login');
  assert.strictEqual(decide({ ok: false, host: 'www.figma.com', path: '/make/abc', frame: '' }, 5000, false).act, 'wait');
  assert.strictEqual(decide({ ok: false, host: 'www.figma.com', path: '/make/abc', frame: '' }, 16000, false).act, 'login');
  assert.strictEqual(decide({ ok: false, host: 'x.figma.site', path: '/', frame: '' }, 30000, false).act, 'wait');   // a slow app is not a login
  assert.strictEqual(decide(null, 100, false).act, 'wait');
});

// ── bridge routes (invalid links only: Chrome is never started) ──────────────────────────
const ROOT = path.resolve(__dirname, '..');
const PORT = 41797, BASE = `http://localhost:${PORT}`;
let stateDir, child, cliToken;

async function api(route, { method = 'GET', body, token } = {}) {
  const sep = route.includes('?') ? '&' : '?';
  const url = BASE + route + (token !== undefined ? sep + 'token=' + encodeURIComponent(token) : '');
  const init = { method, signal: AbortSignal.timeout(15000) };
  if (body !== undefined) init.body = JSON.stringify(body);
  const r = await fetch(url, init);
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

test.before(async () => {
  stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-link-'));
  cliToken = 'y'.repeat(48);
  fs.writeFileSync(path.join(stateDir, '.bridge-token'), cliToken);
  child = spawn(process.execPath, [path.join(ROOT, 'bridge', 'server.js')], {
    cwd: ROOT,
    env: { ...process.env, SAP_BRIDGE_PORT: String(PORT), SAP_BRIDGE_OUT: stateDir, SAP_BRIDGE_TREE_DIR: path.join(stateDir, 'tree-jobs'),
      SAP_BRIDGE_TOKEN_FILE: path.join(stateDir, '.bridge-token'), SAP_BRIDGE_PAIR: path.join(stateDir, '.bridge-pair.json') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {}); child.stderr.on('data', () => {});
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(1500) }); up = (await r.json()).app === 'sap-v4-bridge'; } catch (_) {} if (!up) await sleep(150); }
  if (!up) throw new Error('test bridge did not start on port ' + PORT);
});

test.after(() => { try { child && child.kill('SIGKILL'); } catch (_) {} try { fs.rmSync(stateDir, { recursive: true, force: true }); } catch (_) {} });

test('bridge: /make/fetch needs a token (401) and refuses bad links (400)', async () => {
  assert.strictEqual((await api('/make/fetch', { method: 'POST', body: { url: 'https://x.figma.site/' } })).status, 401);
  assert.strictEqual((await api('/make/fetch', { method: 'POST', body: { url: 'https://x.figma.site/' }, token: 'nope' })).status, 401);
  const r = await api('/make/fetch', { method: 'POST', body: { url: 'https://evil.com/' }, token: cliToken });
  assert.strictEqual(r.status, 400);
  assert.match(r.json.error, /Make links/);
  assert.strictEqual((await api('/make/fetch', { method: 'POST', body: {}, token: cliToken })).status, 400);
});

test('bridge: /make/job answers 404 for an unknown job and 401 without a token', async () => {
  assert.strictEqual((await api('/make/job?jobId=abc')).status, 401);
  assert.strictEqual((await api('/make/job?jobId=abc', { token: cliToken })).status, 404);
});
