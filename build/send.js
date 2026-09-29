#!/usr/bin/env node
// send.js — v5 one-command BUILD + CHECK with NO model typing.
//   node build/send.js <JOB dir> --file <fileKey> [--ref ref.png] [--timeout <sec>]
// The MODEL TYPES NOTHING: this renders the payload (render.js --json), queues it on the bridge
// (POST /tree), and the open+paired SAP Bridge plugin builds the tree in Figma itself, dumps
// geometry + the audit tree, exports a PNG, and posts it back. The bridge writes those into
// JOB/check/; this then runs the gates exactly like step 3 of .claude/agents/screen-builder.md.
//
// Needs: the bridge up (node build/mailbox.js ensure) and the SAP Bridge plugin OPEN in that file.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJ = path.resolve(__dirname, '..');
const PORT = Number(process.env.SAP_BRIDGE_PORT || 41778);
const BASE = `http://localhost:${PORT}`;
const TOKEN_FILE = process.env.SAP_BRIDGE_TOKEN_FILE || path.join(PROJ, '.claude', '.bridge-token');
const KEY_RE = /^[A-Za-z0-9]{1,128}$/;

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const jobDirArg = argv.find((a) => !a.startsWith('--') && a !== opt('--file') && a !== opt('--ref') && a !== opt('--timeout'));

function die(msg, code = 1) { console.error(msg); process.exit(code); }
function readToken() { try { return fs.readFileSync(TOKEN_FILE, 'utf8').trim() || null; } catch (_) { return null; } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(route, body, timeoutMs) {
  const token = readToken();
  if (!token) throw new Error('NO_TOKEN');
  const sep = route.includes('?') ? '&' : '?';
  const url = `${BASE}${route}${sep}token=${encodeURIComponent(token)}`;
  const init = body === undefined ? { signal: AbortSignal.timeout(timeoutMs || 8000) }
    : { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs || 20000) };
  const r = await fetch(url, init);
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}
async function health() {
  try { const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2500) }); return await r.json(); } catch (_) { return null; }
}
function node(args) { return execFileSync(process.execPath, args, { cwd: PROJ, maxBuffer: 32 << 20 }).toString(); }

// Collect logo crops: prefer JOB/logos/index.json (element names, matched by the plugin's namedLike);
// else JOB/logo*.png → frame names Logo, Logo 2, …; else JOB/logos/*.png by basename.
function collectLogos(jobDir) {
  const out = [];
  const idxFile = path.join(jobDir, 'logos', 'index.json');
  if (fs.existsSync(idxFile)) {
    let idx = [];
    try { idx = JSON.parse(fs.readFileSync(idxFile, 'utf8')); } catch (_) {}
    for (const e of (Array.isArray(idx) ? idx : [])) {
      if (!e || !e.file || !e.element) continue;
      const f = path.join(jobDir, 'logos', path.basename(String(e.file)));
      if (fs.existsSync(f)) out.push({ name: String(e.element), pngBase64: fs.readFileSync(f).toString('base64') });
    }
    if (out.length) return out.slice(0, 40);
  }
  const top = fs.readdirSync(jobDir).filter((f) => /^logo.*\.png$/i.test(f)).sort();
  top.forEach((f, i) => out.push({ name: i === 0 ? 'Logo' : `Logo ${i + 1}`, pngBase64: fs.readFileSync(path.join(jobDir, f)).toString('base64') }));
  if (out.length) return out.slice(0, 40);
  const logosDir = path.join(jobDir, 'logos');
  if (fs.existsSync(logosDir)) {
    for (const f of fs.readdirSync(logosDir).filter((x) => /\.png$/i.test(x)).sort()) {
      out.push({ name: path.basename(f, path.extname(f)), pngBase64: fs.readFileSync(path.join(logosDir, f)).toString('base64') });
    }
  }
  return out.slice(0, 40);
}

async function main() {
  if (!jobDirArg) die('usage: node build/send.js <JOB dir> --file <fileKey> [--ref ref.png] [--timeout <sec>]', 2);
  const jobDir = path.resolve(PROJ, jobDirArg);
  if (!fs.existsSync(jobDir)) die(`JOB dir not found: ${jobDir}`, 2);
  const fileKey = String(opt('--file') || '');
  if (!KEY_RE.test(fileKey)) die('a valid --file <fileKey> is required', 2);
  const treeF = path.join(jobDir, 'tree.json');
  if (!fs.existsSync(treeF)) die(`no tree.json in the JOB dir: ${treeF}`, 2);
  let ref = opt('--ref');
  if (ref) { ref = path.resolve(PROJ, ref); if (!fs.existsSync(ref)) die(`--ref not found: ${ref}`, 2); }
  else { const rp = path.join(jobDir, 'ref.png'); if (fs.existsSync(rp)) ref = rp; }
  const timeoutSec = Math.min(300, Math.max(10, Number(opt('--timeout') || 180)));

  // bridge up?
  const h = await health();
  if (!h || h.app !== 'sap-v4-bridge') die('The bridge is not running. Start it: node build/mailbox.js ensure', 3);
  if (!readToken()) die('No CLI token (.claude/.bridge-token). Start the bridge: node build/mailbox.js ensure', 3);

  // 1. render the payload from the tree (no model typing) → JOB/job.json
  const jobJson = path.join(jobDir, 'job.json');
  try { node(['build/render.js', treeF, '--json', '--out', jobJson]); }
  catch (e) { die(`render.js failed: ${String(e.stderr || e.message || e).slice(0, 300)}`, 1); }
  const payload = JSON.parse(fs.readFileSync(jobJson, 'utf8'));

  // 2. logos
  const logos = collectLogos(jobDir);

  // 3. queue the tree job
  let q;
  try { q = await api('/tree', { fileKey, jobDir, name: path.basename(jobDir), payload, logos,
    want: { geometry: true, audit: true, pngScale: 2 } }); }
  catch (e) { die(e.message === 'NO_TOKEN' ? 'No CLI token — run: node build/mailbox.js ensure' : `cannot reach the bridge: ${e.message}`, 3); }
  if (q.status !== 200 || !q.json || !q.json.jobId) die(`queue failed (${q.status}): ${(q.json && q.json.error) || ''}`, 1);
  const jobId = q.json.jobId;

  // 4. the plugin must be OPEN in this file — the bridge's heartbeat tells us it is connected.
  const hh = await health();
  const figmaHere = hh && hh.figma && hh.figma.fileKey === fileKey && hh.figma.lastSeenSec < 15;
  if (!figmaHere) {
    // give it a moment; the plugin polls /tree/next every ~1 s once open.
    let seen = false;
    for (let i = 0; i < 10; i++) { const s = await api(`/tree/wait?jobId=${jobId}&timeout=1`); if (s.json && (s.json.status === 'done' || s.json.status === 'error' || s.json.ok != null && s.json.status !== 'pending')) { seen = true; break; }
      const hn = await health(); if (hn && hn.figma && hn.figma.fileKey === fileKey && hn.figma.lastSeenSec < 15) { seen = true; break; } await sleep(1000); }
    if (!seen) console.error('note: the SAP Bridge plugin does not seem open in this file — open SAP Bridge in the file. Still waiting…');
  }

  // 5. wait for the plugin to build + post the result
  const t0 = Date.now();
  let res = null;
  const end = Date.now() + timeoutSec * 1000;
  while (Date.now() < end) {
    let w;
    try { w = await api(`/tree/wait?jobId=${jobId}&timeout=20`, undefined, 25000); } catch (_) { await sleep(1000); continue; }
    if (w.status === 200 && w.json && w.json.status && w.json.status !== 'pending') { res = w.json; break; }
  }
  if (!res) die(`Timed out after ${timeoutSec}s waiting for the plugin to build. Is SAP Bridge open in the file?`, 1);

  const elapsedMs = Date.now() - t0;
  const nodeId = res.nodeId || '';
  const link = nodeId ? `https://www.figma.com/design/${fileKey}/?node-id=${String(nodeId).replace(/:/g, '-')}` : '(no node)';
  const WARN = Array.isArray(res.WARN) ? res.WARN : [];

  if (res.status === 'error' || res.ok === false) {
    console.log(link);
    console.log(`WARN: ${WARN.length ? WARN.join(' · ') : '—'}`);
    console.log(`BUILD FAILED: ${res.error || 'unknown'}`);
    console.log(`elapsed ${elapsedMs} ms`);
    process.exit(1);
  }

  // 6. gates — exactly like step 3 of the screen-builder agent
  const checkDir = path.join(jobDir, 'check');
  fs.mkdirSync(checkDir, { recursive: true });
  if (ref) { try { fs.copyFileSync(ref, path.join(checkDir, 'ref.png')); } catch (_) {} }
  const specSrc = path.join(jobDir, 'see-ref', 'spec.json');
  if (fs.existsSync(specSrc)) { try { fs.copyFileSync(specSrc, path.join(checkDir, 'spec.json')); } catch (_) {} }
  const planF = path.join(checkDir, 'plan.json');
  try { fs.writeFileSync(planF, node(['build/tree.js', 'rows', treeF])); }
  catch (e) { die(`tree.js rows failed: ${String(e.stderr || e.message || e).slice(0, 300)}`, 1); }

  const gArgs = ['build/gates.js', planF, checkDir];
  const checkRef = path.join(checkDir, 'ref.png');
  if (fs.existsSync(checkRef)) gArgs.push('--ref', checkRef);
  let gatesOut = '';
  try { gatesOut = node(gArgs); } catch (e) { gatesOut = String(e.stdout || '') + String(e.stderr || ''); }

  // 7. print ≤ 8 lines
  const lines = gatesOut.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  const gateLine = lines.find((l) => /^MATCH /.test(l)) || '(no gate line)';
  const structLines = lines.filter((l) => /^\s*(BOX|COLLAPSED|OVERLAP|OUTSIDE|FRAME|HIDDEN) /.test(l)).slice(0, 3);
  let diff = [];
  try {
    const dj = JSON.parse(fs.readFileSync(path.join(checkDir, 'see-out', 'diff.json'), 'utf8'));
    diff = (Array.isArray(dj) ? dj : (dj.lines || dj.diffs || []))
      .map((d) => (typeof d === 'string' ? d : (d.text || JSON.stringify(d))))
      .filter((s) => !/SAP LOOK|brand→SAP|\(brand->SAP\)|EXTRA/.test(s)).slice(0, 5);
  } catch (_) {}

  console.log(link);
  console.log(`WARN: ${WARN.length ? WARN.join(' · ') : '—'}`);
  console.log(gateLine);
  for (const s of structLines) console.log('  ' + s.trim().slice(0, 150));
  for (const s of diff) console.log('  diff: ' + String(s).slice(0, 150));
  console.log(`elapsed ${elapsedMs} ms`);
  const passed = /(^|\s)PASS\b/.test(gatesOut) && !/NOT PASSED/.test(gatesOut);
  process.exit(passed ? 0 : 1);
}

main().catch((e) => die(e && e.message ? e.message : String(e), 1));
