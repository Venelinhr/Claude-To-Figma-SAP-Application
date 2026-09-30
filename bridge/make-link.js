'use strict';
/*
 * bridge/make-link.js — Make link → probe dump, for the SAP Bridge plugin. NO model anywhere.
 *   plugin  POST /make/fetch {url}      → { jobId }
 *   plugin  GET  /make/job?jobId=…      → { status: running|done|error, step, ms, error?, dump? }
 * The plugin cannot open the app itself (its sandbox may call only this bridge), so the bridge opens the link in headless
 * Chrome (build/make-fetch.js), runs the live probe and hands the dump text back. The plugin converts and builds it with the
 * same code as a pasted dump (makeBuild). Node core only.
 *
 * Only Figma Make addresses are accepted (SSRF guard): https, no credentials, no port, host *.figma.site or figma.com/make/….
 */
const crypto = require('node:crypto');
const { fetchMakeDump } = require('../build/make-fetch.js');

const SITE_HOST = /^(?:[a-z0-9-]+\.)*figma\.site$/i;
const MAKE_PATH = /^\/make\/[A-Za-z0-9]{10,}(?:\/|$)/;

// Pure. { ok, url, kind: 'site' | 'editor' } or { ok:false, error }.
function checkUrl(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s || s.length > 2000) return { ok: false, error: 'Paste a Figma Make link.' };
  let u; try { u = new URL(s); } catch (_) { return { ok: false, error: 'That is not a web link.' }; }
  if (u.protocol !== 'https:') return { ok: false, error: 'Only https links are accepted.' };
  if (u.username || u.password || u.port) return { ok: false, error: 'That link has a login or a port in it. Paste the plain Make link.' };
  const h = u.hostname.toLowerCase();
  if (SITE_HOST.test(h)) return { ok: true, url: u.href, kind: 'site' };
  if (h === 'figma.com' || h === 'www.figma.com') {
    if (MAKE_PATH.test(u.pathname)) return { ok: true, url: u.href, kind: 'editor' };
    return { ok: false, error: 'That Figma link is not a Make link (it needs figma.com/make/…).' };
  }
  return { ok: false, error: 'Only Figma Make links are accepted (figma.com/make/… or a *.figma.site link).' };
}

function createMakeJobs(opt = {}) {
  const fetchDump = opt.fetchDump || fetchMakeDump;
  const timeoutMs = opt.timeoutMs || 90000, ttlMs = opt.ttlMs || 15 * 60 * 1000, now = opt.now || Date.now;
  const graceMs = opt.graceMs == null ? 5000 : opt.graceMs;      // the fetch stops itself at timeoutMs; this only catches a fetch that hangs
  const jobs = new Map();
  let running = null;

  function gc() { for (const [id, j] of jobs) if (j.status !== 'running' && now() - j.at > ttlMs) jobs.delete(id); }

  function start(rawUrl, o = {}) {
    gc();
    const c = checkUrl(rawUrl);
    if (!c.ok) return { error: c.error, code: 400 };
    if (running) return { error: 'Another Make link is being read. Wait for it to finish.', code: 409 };
    const w = Number(o.width), width = Number.isInteger(w) && w >= 800 && w <= 2560 ? w : 1440;
    const id = crypto.randomBytes(6).toString('hex');
    const job = { id, url: c.url, kind: c.kind, status: 'running', step: 'Starting…', at: now(), ms: 0, dump: null, error: null };
    jobs.set(id, job); running = id;
    let timer;
    const limit = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('Timed out after ' + Math.round(timeoutMs / 1000) + ' s.')), timeoutMs + graceMs); });
    Promise.race([Promise.resolve().then(() => fetchDump(c.url, { width, timeoutMs, onStatus: (m) => { job.step = String(m); } })), limit])
      .then((d) => { job.status = 'done'; job.dump = String(d); job.step = 'Done'; })
      .catch((e) => { job.status = 'error'; job.error = String((e && e.message) || e); })
      .finally(() => { clearTimeout(timer); job.ms = now() - job.at; if (running === id) running = null; });
    return { id };
  }

  function get(id) {
    gc();
    const j = jobs.get(String(id || ''));
    if (!j) return null;
    const out = { status: j.status, step: j.step, kind: j.kind, ms: j.status === 'running' ? now() - j.at : j.ms };
    if (j.status === 'error') out.error = j.error;
    if (j.status === 'done') out.dump = j.dump;
    return out;
  }

  return { start, get, _jobs: jobs };
}

module.exports = { checkUrl, createMakeJobs };
