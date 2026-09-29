#!/usr/bin/env node
// make-fetch.js — open a Make app link in headless Chrome, run the live probe, return the dump. No model, no install
// (Chrome DevTools Protocol over node's built-in WebSocket). Used by bridge/server.js POST /make/fetch and by the CLI:
//   node build/make-fetch.js <url> [out.json] [--width 1440] [--height 900]
// Needs Google Chrome (or Chromium / Edge) on this Mac. A link that needs a Figma login cannot be opened this way.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');

const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function probeSource() {
  const kit = require('../knowledge/live/kit.json');
  const names = [...new Set(Object.keys(kit.vars).map(n => n.split('/').pop()))];
  const src = fs.readFileSync(path.join(__dirname, 'templates', 'make-probe.browser.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim().replace(/;\s*$/, '');
  return `(async()=>{window.__MAKE_CFG=${JSON.stringify({ ret: 1, vars: names })};return await ${src}})()`;
}

async function fetchMakeDump(url, opt = {}) {
  if (!/^https?:\/\//i.test(url)) throw new Error('That is not a web link (needs http:// or https://).');
  const chrome = CHROMES.find(p => fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome found (looked in /Applications). Install Google Chrome or use the bookmark.');
  const W = opt.width || 1440, H = opt.height || 900, port = 9300 + Math.floor(Math.random() * 500);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-fetch-'));
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let ws;
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {                              // wait for the DevTools endpoint
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch (_) {}
    }
    if (!target) throw new Error('Chrome did not start.');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('DevTools connection failed.')); });
    let id = 0; const pending = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    const cdp = (method, params = {}) => new Promise((res, rej) => {
      const i = ++id; pending.set(i, m => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    const evalJs = async (expression, awaitPromise = false) => {
      const r = await cdp('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
      if (r.exceptionDetails) throw new Error('page error: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
      return r.result.value;
    };
    await cdp('Page.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url });
    // wait until the SAPUI5 runtime has rendered controls (up to 40 s: the runtime + theme load from the CDN)
    let ready = false;
    for (let i = 0; i < 160 && !ready; i++) {
      await sleep(250);
      try { ready = await evalJs(`!!(window.sap && sap.ui && sap.ui.require && sap.ui.require('sap/ui/core/Element') && sap.ui.require('sap/ui/core/Element').registry && sap.ui.require('sap/ui/core/Element').registry.size > 15)`); } catch (_) {}
    }
    if (!ready) throw new Error('No SAPUI5 controls appeared on that page (a login page, a non-SAPUI5 app, or it did not load). Open it in a browser and use the bookmark instead.');
    await sleep(1200);                                                      // let fonts / layout settle
    const out = await evalJs(probeSource(), true);
    if (!out || !out.dump) throw new Error('The probe returned nothing.');
    return out.dump;
  } finally {
    try { ws && ws.close(); } catch (_) {}
    try { proc.kill('SIGKILL'); } catch (_) {}
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} }, 1500);
  }
}

module.exports = { fetchMakeDump };

if (require.main === module) {
  const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? Number(a[i + 1]) : undefined; };
  const pos = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1].startsWith('--')));
  if (!pos[0]) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
  fetchMakeDump(pos[0], { width: opt('--width'), height: opt('--height') }).then(d => {
    const j = JSON.parse(d);
    if (pos[1]) fs.writeFileSync(pos[1], d);
    console.log(`${j.controls.length} controls · ${Math.round(d.length / 1024)} KB · ${Object.keys(j.imageData || {}).length} image(s) · viewport ${j.viewport.join('×')}${pos[1] ? ' → ' + pos[1] : ''}`);
  }).catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
}
