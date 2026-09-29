#!/usr/bin/env node
// make-to-figma.js — the Make → Figma bridge. NO model anywhere: probe dump → make2tree → door → (plugin | Figma Agent chat).
//   node build/make-to-figma.js                 listen on localhost:41779; the browser bookmark POSTs a Make app here
//   node build/make-to-figma.js run <dump.json> [--file <fileKey>] [--agent]     one-shot from a saved probe dump
// Delivery: the SAP Bridge plugin open in a Figma file builds the tree itself (build/send.js, ~10 s); with no plugin open, or
// --agent, the build prompt goes to the clipboard — paste it into Figma's Agent chat.
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), { spawnSync } = require('child_process');
const PROJ = path.resolve(__dirname, '..'), PORT = Number(process.env.MAKE_PORT || 41779), BRIDGE = `http://localhost:${process.env.SAP_BRIDGE_PORT || 41778}`;
const node = (args, o = {}) => spawnSync(process.execPath, args, { cwd: PROJ, encoding: 'utf8', maxBuffer: 64 << 20, ...o });
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');

async function health() { try { return await (await fetch(`${BRIDGE}/health`, { signal: AbortSignal.timeout(2500) })).json(); } catch (_) { return null; } }
async function grabImages(job, origin) {                       // logos the Make app shows → PNGs the plugin places on the logo frames
  let imgs = []; try { imgs = JSON.parse(fs.readFileSync(path.join(job, 'images.json'), 'utf8')); } catch (_) {}
  const dir = path.join(job, 'logos'), idx = []; fs.mkdirSync(dir, { recursive: true });
  for (const im of imgs) {
    try {
      const r = await fetch(new URL(im.src, origin), { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(r.status);
      const f = im.element.replace(/[^\w-]+/g, '_') + '.png'; fs.writeFileSync(path.join(dir, f), Buffer.from(await r.arrayBuffer())); idx.push({ file: f, element: im.element });
    } catch (e) { console.log(`  image ${im.src}: ${e.message || e}`); }
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(idx));
  return idx.length;
}
function agentPrompt(job) {
  const tree = JSON.stringify(JSON.parse(fs.readFileSync(path.join(job, 'tree.json'), 'utf8')));
  const p = `Build this screen in the open file with the SAP Web UI Kit library — real component instances, auto layout, text styles and colour variables. No raw hex, no detached components.
Tree keys: n layer name · d H|V auto layout · g gap · p [top,right,bottom,left] padding · a alignment (primary+counter: M start, C center, X end, S space-between) · s sizing per axis, first letter width then height (F fill, H hug, X fixed) · w h size · r radius · bg fill variable · bc/bw stroke variable/weight · k "i" = kit instance {cp component name, pr its properties, tx inner texts by layer name} · k "t" = text {t, st text style, bg colour variable} · k "ic" = kit icon {ic} · c children. Logo frames (names start "Logo") stay empty image frames.
${tree}`;
  fs.writeFileSync(path.join(job, 'agent-prompt.txt'), p);
  try { spawnSync('pbcopy', { input: p, env: { ...process.env, LC_ALL: 'en_US.UTF-8' } }); } catch (_) {}   // without a UTF-8 locale pbcopy garbles € ü ä –
  return p.length;
}
async function pipeline(dump, opt = {}) {
  const job = path.join(PROJ, 'bridge-out', 'make-' + stamp()); fs.mkdirSync(job, { recursive: true });
  fs.writeFileSync(path.join(job, 'make-dump.json'), typeof dump === 'string' ? dump : JSON.stringify(dump));
  const d = typeof dump === 'string' ? JSON.parse(dump) : dump, log = [];
  const say = m => { log.push(m); console.log(m); };
  const t = node(['build/make2tree.js', path.join(job, 'make-dump.json'), path.join(job, 'tree.json')]); say(t.stdout.trim());
  if (t.status) return { ok: false, job, msg: 'make2tree failed: ' + (t.stderr || t.stdout) };
  const dr = node(['build/door.js', path.join(job, 'tree.json')]); say(dr.stdout.split('\n')[0]);
  if (dr.status) return { ok: false, job, msg: 'DOOR rejected the tree:\n' + dr.stdout };
  say(`logos: ${await grabImages(job, d.origin || 'http://localhost/')}`);
  const h = await health(), key = opt.file || (h && h.figma && h.figma.fileKey);
  if (!opt.agent && key) {
    node(['build/mailbox.js', 'ensure']);
    const s = node(['build/send.js', job, '--file', key], { timeout: 240000 }); say(s.stdout.trim().split('\n').slice(-8).join('\n'));
    if (!s.status) return { ok: true, job, via: 'plugin', msg: log.join('\n') };
    say('plugin path failed → agent prompt instead');
  } else if (!opt.agent) say('SAP Bridge plugin not open in a Figma file → agent prompt');
  const n = agentPrompt(job); say(`Figma Agent prompt (${(n / 1024).toFixed(0)} KB) copied to the clipboard — paste it into the Figma Agent chat. File: ${job}/agent-prompt.txt`);
  return { ok: true, job, via: 'agent', msg: log.join('\n') };
}
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
if (argv[0] === 'run') {
  pipeline(fs.readFileSync(argv[1], 'utf8'), { file: opt('--file'), agent: argv.includes('--agent') }).then(r => { console.log(r.ok ? 'DONE via ' + r.via + ' · ' + r.job : r.msg); process.exit(r.ok ? 0 : 1); });
} else {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  http.createServer((req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (req.method !== 'POST' || !req.url.startsWith('/make')) { res.writeHead(404, cors); return res.end('POST /make'); }
    const b = []; req.on('data', c => b.push(c)); req.on('end', async () => {
      try { const r = await pipeline(Buffer.concat(b).toString('utf8')); res.writeHead(200, cors); res.end(r.ok ? `sent via ${r.via}\n${r.msg.split('\n').slice(-3).join('\n')}` : r.msg); }
      catch (e) { res.writeHead(500, cors); res.end(String(e.message || e)); }
    });
  }).listen(PORT, '127.0.0.1', () => console.log(`Make → Figma bridge on http://localhost:${PORT}/make — click the bookmark in the Make preview (build/make-bookmarklet.js)`));
}
