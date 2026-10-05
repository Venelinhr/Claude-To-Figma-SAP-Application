#!/usr/bin/env node
// make-fetch.js — open a Make app link in headless Chrome, run the live probe, return the dump. No model, no install
// (Chrome DevTools Protocol over node's built-in WebSocket). Used by bridge/make-link.js (bridge routes POST /make/fetch,
// GET /make/job) and by the CLI:
//   node build/make-fetch.js <url> [out.json] [--width 1440] [--height 900]
// Needs Google Chrome (or Chromium / Edge) on this Mac. Headless Chrome starts with an EMPTY profile: a link that needs a Figma
// login cannot be opened this way (a published *.figma.site link, or an app address that is public, can).
// A figma.com/make/... page shows the app inside a cross-origin iframe (app-<hash>.makeproxy-c.figma.site): when the top page has
// no SAPUI5 runtime but holds such an iframe, this navigates to the iframe address and probes that page instead.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');

const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LOGIN_MSG = 'This link needs a Figma login, and headless Chrome has no login. In Make press Publish (or Share → Publish), then paste the *.figma.site link.';

function probeSource() {
  const kit = require('../knowledge/live/kit.json');
  const names = [...new Set(Object.keys(kit.vars).map(n => n.split('/').pop()))];
  const src = fs.readFileSync(path.join(__dirname, 'templates', 'make-probe.browser.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim().replace(/;\s*$/, '');
  return `(async()=>{window.__MAKE_CFG=${JSON.stringify({ ret: 1, vars: names })};return await ${src}})()`;
}

// what the page looks like right now (runs inside the page)
const PAGE_STATE = `(function(){var s=window.sap,E=s&&s.ui&&s.ui.require&&s.ui.require('sap/ui/core/Element'),ok=!!(E&&E.registry&&E.registry.size>15);
var f=[].slice.call(document.querySelectorAll('iframe')).map(function(x){return x.src}).filter(function(u){return /^https:\\/\\/[^/]*figma\\.site\\//.test(u)});
return{ok:ok,host:location.hostname,path:location.pathname,title:document.title,frame:f[0]||''}})()`;

// Pure: what to do next, given the page state. Unit-tested without Chrome.
function decide(s, elapsedMs, followed) {
  if (s && s.ok) return { act: 'ready' };
  s = s || {};
  const onFigma = /(^|\.)figma\.com$/i.test(s.host || '');
  if (onFigma && /^\/(login|signup|sso|saml)/i.test(s.path || '')) return { act: 'login' };
  if (onFigma && s.frame && !followed) return { act: 'follow', url: s.frame };
  if (onFigma && !s.frame && elapsedMs > 15000) return { act: 'login' };
  return { act: 'wait' };
}

async function fetchMakeDump(url, opt = {}) {
  if (!/^https?:\/\//i.test(url)) throw new Error('That is not a web link (needs http:// or https://).');
  const chrome = CHROMES.find(p => fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome found (looked in /Applications). Install Google Chrome, or use the browser extension.');
  const say = m => { try { opt.onStatus && opt.onStatus(m); } catch (_) {} };
  const T0 = Date.now(), deadline = T0 + (opt.timeoutMs || 75000);
  const W = opt.width || 1440, H = opt.height || 900, port = 9300 + Math.floor(Math.random() * 500);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-fetch-'));
  say('Starting Chrome…');
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${dir}`, `--window-size=${W},${H}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let ws;
  const hardKill = setTimeout(() => { try { proc.kill('SIGKILL'); } catch (_) {} }, (opt.timeoutMs || 75000) + 8000);   // the page can hang inside the probe
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
    ws.onclose = () => { for (const f of pending.values()) f({ error: { message: 'Chrome closed' } }); pending.clear(); };   // a killed Chrome must not leave a call hanging
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
    const go = async u => { const r = await cdp('Page.navigate', { url: u }); if (r.errorText) throw new Error('Could not open the link: ' + r.errorText); };
    say('Opening the link…');
    await go(url);
    // wait until the SAPUI5 runtime has rendered controls (the runtime + theme load from the CDN); follow the app's iframe on a Make page
    let last = null, followed = false, ready = false;
    while (!ready && Date.now() < deadline) {
      await sleep(250);
      let s = null; try { s = await evalJs(PAGE_STATE); } catch (_) {}
      if (s) last = s;
      const d = decide(s, Date.now() - T0, followed);
      if (d.act === 'ready') ready = true;
      else if (d.act === 'login') throw new Error(LOGIN_MSG);
      else if (d.act === 'follow') { followed = true; say('Opening the app inside the Make page…'); await go(d.url); }
    }
    if (!ready) throw new Error('No SAPUI5 controls appeared' + (last ? ` (page "${String(last.title).slice(0, 60)}" on ${last.host})` : '') + '. It may need a login, be a non-SAPUI5 app, or be too slow to load.');
    say('Loading fonts and layout…');
    try { await evalJs('document.fonts.ready.then(function(){return 1})', true); } catch (_) {}
    await sleep(1200);                                                      // let layout settle
    say('Reading the controls…');
    const out = await evalJs(probeSource(), true);
    if (!out || !out.dump) throw new Error('The probe returned nothing.');
    return out.dump;
  } finally {
    clearTimeout(hardKill);
    try { ws && ws.close(); } catch (_) {}
    try { proc.kill('SIGKILL'); } catch (_) {}
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} }, 1500);
  }
}

module.exports = { fetchMakeDump, decide, LOGIN_MSG };

if (require.main === module) {
  const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? Number(a[i + 1]) : undefined; };
  const pos = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1].startsWith('--')));
  if (!pos[0]) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(2); }
  fetchMakeDump(pos[0], { width: opt('--width'), height: opt('--height'), onStatus: m => console.log('  ' + m) }).then(d => {
    const j = JSON.parse(d);
    if (pos[1]) fs.writeFileSync(pos[1], d);
    console.log(`${j.controls.length} controls · ${Math.round(d.length / 1024)} KB · ${Object.keys(j.imageData || {}).length} image(s) · viewport ${j.viewport.join('×')}${pos[1] ? ' → ' + pos[1] : ''}`);
  }).catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
}
