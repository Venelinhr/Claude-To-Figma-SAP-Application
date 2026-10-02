#!/usr/bin/env node
// v6pack.js — everything the Figma Agent needs INSIDE a Figma file, so it types ~400 chars per call instead of 12-50k.
//   buildPack() → { ver, rt, tools, golds: { name: '<json string>' }, skipped: [..] }
//     rt     the build runtime (prelude + BUILD_TREE) — same text as build/render.js --install (key v6rt)
//     build  the full kit pack + the prelude helpers { I, T, fill, stroke, space, AL, put, sub, setP, WARN, KIT } for edits and small adds (key v6build)
//     tools  build/ops.js + build/sketch.js + build/templates/v6-tools.js as one function body (key v6tools)
//     golds  every approved layout tree + the kit keys it uses (keys gold_<name>): knowledge/gold/trees + knowledge/gold/v6
//   The bridge serves it at GET /v6/pack (the SAP Bridge plugin writes the keys once per file); `node build/v6pack.js --install-js`
//   prints the same as ONE use_figma call (no plugin needed); `node build/v6pack.js --info` prints sizes.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(p, 'utf8');
const GOLD_DIRS = [path.join(ROOT, 'knowledge', 'gold', 'trees'), path.join(ROOT, 'knowledge', 'gold', 'v6')];
const MAX_ENTRY = 95000;                                   // Figma: one sharedPluginData value ≤ 100 kB

function wrapModule(src) { return `(() => { const module = { exports: {} };\n${src}\nreturn module.exports; })()`; }

let cache = null;
function stamp() {
  return [...GOLD_DIRS.flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).map(f => path.join(d, f)) : []),
    path.join(__dirname, 'ops.js'), path.join(__dirname, 'content-audit.js'), path.join(__dirname, 'sketch.js'), path.join(__dirname, 'templates', 'v6-tools.js'),
    path.join(__dirname, 'templates', 'sap-kit.prelude.js'), path.join(__dirname, 'templates', 'render-tree.js'), path.join(ROOT, 'knowledge', 'live', 'kit.json')]
    .map(f => { try { return f + ':' + fs.statSync(f).mtimeMs; } catch (_) { return f; } }).join('|');
}

function buildPack() {
  const st = stamp();
  if (cache && cache.st === st) return cache.pack;
  const T = p => read(path.join(__dirname, 'templates', p));
  const rt = [T('sap-kit.prelude.js'), T('render-tree.js')].join('\n');
  const fullKit = execFileSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--all'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }).toString().trim();
  const build = fullKit + '\n' + T('sap-kit.prelude.js') + '\nreturn { I, T, fill, stroke, space, AL, put, sub, setP, WARN, KIT };';
  const tools = `const OPSM = ${wrapModule(read(path.join(__dirname, 'ops.js')))};\nconst AUD = ${wrapModule(read(path.join(__dirname, 'content-audit.js')))};\nconst SK = ${wrapModule(read(path.join(__dirname, 'sketch.js')))};\n${T('v6-tools.js')}`;
  const golds = {}, skipped = [];
  for (const dir of GOLD_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.tree.json')).sort()) {
      const file = path.join(dir, f), name = f.replace(/\.tree\.json$/, '');
      try {
        const raw = JSON.parse(read(file)), tree = raw.tree || raw;
        let n = 0; (function c(o) { n++; (o.c || []).forEach(c); })(tree);
        if (n < 5 || !tree.w || !tree.h) { skipped.push(`${name}: only ${n} layers (broken dump)`); continue; }
        try { execFileSync(process.execPath, [path.join(__dirname, 'door.js'), file], { stdio: 'pipe' }); } catch (e) { skipped.push(`${name}: the door says OUT`); continue; }
        const kitSrc = execFileSync(process.execPath, [path.join(__dirname, 'kit.js'), 'pack', '--plan', file], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
        const kit = JSON.parse(kitSrc.replace(/^const KIT = /, '').replace(/;\s*$/, ''));
        const texts = []; (function w(o) { if (o.k === 't') texts.push(String(o.t)); (o.c || []).forEach(w); })(tree);
        const json = JSON.stringify({ title: tree.n, texts: texts.filter((t, i) => texts.indexOf(t) === i).slice(0, 14), kit, tree });
        if (json.length > MAX_ENTRY) { skipped.push(`${name}: ${json.length} chars is over the 100 kB entry limit`); continue; }
        golds[name] = json;
      } catch (e) { skipped.push(`${name}: ${e.message.slice(0, 80)}`); }
    }
  }
  const ver = crypto.createHash('sha1').update(rt + tools + build + Object.keys(golds).map(k => k + golds[k]).join('')).digest('hex').slice(0, 10);
  const pack = { ver, rt, build, tools, golds, skipped };
  cache = { st, pack };
  return pack;
}

// one use_figma call that writes the same keys (for a file where the plugin cannot be used)
function installJs(pack) {
  const keys = { v6rt: pack.rt, v6build: pack.build, v6tools: pack.tools, v6_ver: pack.ver };
  for (const [k, v] of Object.entries(pack.golds)) keys['gold_' + k] = v;
  return `const D = ${JSON.stringify(keys)};
for (const k of figma.root.getSharedPluginDataKeys('sapfiori')) if (k.indexOf('gold_') === 0 && !(k in D)) figma.root.setSharedPluginData('sapfiori', k, '');
for (const k in D) figma.root.setSharedPluginData('sapfiori', k, D[k]);
return { installed: '${pack.ver}', golds: ${JSON.stringify(Object.keys(pack.golds))} };`;
}

module.exports = { buildPack, installJs, MAX_ENTRY };
if (require.main === module) {
  const p = buildPack();
  if (process.argv.includes('--install-js')) process.stdout.write(installJs(p));
  else console.log(`v6 pack ${p.ver}: runtime ${p.rt.length} · build ${p.build.length} · tools ${p.tools.length} · golds ${Object.entries(p.golds).map(([k, v]) => `${k} ${v.length}`).join(' · ')}${p.skipped.length ? '\nskipped: ' + p.skipped.join(' | ') : ''}`);
}
