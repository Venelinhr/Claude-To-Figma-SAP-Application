#!/usr/bin/env node
// agent-drive.js — drives the Figma Agent chat in a Chrome that was started with a debug port (CDP, port 9222).
//   node build/agent-drive.js --launch <fileKey>      start Chrome with its own profile and open the file
//   node build/agent-drive.js --status                is Chrome up, is the file tab open, is the Agent busy
//   node build/agent-drive.js --send "<text>" [--file <fileKey>] [--wait <ms>]   new Agent chat, type the text, send it
// Library: const { sendToAgent, status, launch } = require('./agent-drive.js')
// Selectors live in SEL below — if Figma changes its page, change them there only.
const { spawn } = require('node:child_process');
const os = require('node:os'), path = require('node:path');
const PORT = Number(process.env.SAP_CDP_PORT || 9222);
const PROFILE = path.join(os.homedir(), '.sap-bridge', 'chrome-profile');
const SEL = {
  agentsBtn: 'button[aria-label="Agents"]',
  newChat: 'button[aria-label="New chat"]',
  box: '[role=textbox][aria-label="Prompt for AI agent"][contenteditable=true]',
  sendRe: '^(send|submit)', stopRe: '^stop',          // aria-label of the Send / Stop button (case-insensitive)
  makeBox: 'textarea[placeholder="What do you want to make?"]', makeSendRe: '^submit$',   // figma.com/make (seen live 2026-10-03)
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const j = async p => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();

async function tabFor(fileKey) {
  const tabs = (await j('/json')).filter(t => t.type === 'page' && /figma\.com\/(design|file|board)\//.test(t.url));
  return tabs.find(t => !fileKey || t.url.includes(fileKey)) || null;
}
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl); let id = 0; const pend = new Map(), hs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const [ok, no] = pend.get(m.id); pend.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result); } else if (m.method) hs.forEach(h => h(m)); };
  const open = new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('cannot open the Chrome debug socket')); });
  const call = (method, params = {}) => new Promise((ok, no) => { const i = ++id; pend.set(i, [ok, no]); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result.value; };
  return { open, call, ev, on: h => hs.push(h), close: () => ws.close() };
}
const q = s => JSON.stringify(s);
const clickBy = sel => `(()=>{const b=document.querySelector(${q(sel)});if(!b)return false;b.click();return true})()`;
const findBtn = re => `(()=>[...document.querySelectorAll('button')].find(b=>new RegExp(${q(re)},'i').test((b.getAttribute('aria-label')||b.textContent||'').trim())&&!b.disabled))`;

async function status(fileKey) {
  try { await j('/json/version'); } catch (_) { return { chrome: false, tab: false, busy: null }; }
  const t = await tabFor(fileKey); if (!t) return { chrome: true, tab: false, busy: null };
  const c = cdp(t.webSocketDebuggerUrl); await c.open;
  const busy = await c.ev(`!!(${findBtn(SEL.stopRe)})()`); c.close();
  return { chrome: true, tab: true, url: t.url, busy };
}
async function sendToAgent({ fileKey, text, waitReplyMs = 0, threadId: wantThread = null }) {
  if (!text) throw new Error('no text');
  const t = await tabFor(fileKey); if (!t) throw new Error('no Figma tab for this file — run --launch <fileKey> first');
  const c = cdp(t.webSocketDebuggerUrl); await c.open;
  let threadId = wantThread || null, rid = null;                       // the page's own "create chat" call returns meta.thread_id (seen live 2026-10-03)
  c.on(m => {
    if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST' && /\/api\/ai_chat\/threads$/.test(m.params.request.url)) rid = m.params.requestId;
    if (m.method === 'Network.loadingFinished' && rid && m.params.requestId === rid)
      c.call('Network.getResponseBody', { requestId: rid }).then(b => { try { threadId = threadId || JSON.parse(b.body).meta.thread_id; } catch (_) {} }).catch(() => {});
    // second source: when Chrome reuses an empty chat there is no "create chat" call — the chat message itself names its thread
    if (m.method === 'Network.requestWillBeSent' && /\/api\/cortex\/assistant\/chat/.test(m.params.request.url)) {
      const grab = body => { const x = /"thread_?[iI]d"\s*:\s*"([0-9a-f-]{36})"/.exec(String(body || '')); if (x) threadId = threadId || x[1]; };
      grab(m.params.request.postData);
      if (!threadId) c.call('Network.getRequestPostData', { requestId: m.params.requestId }).then(r => grab(r.postData)).catch(() => {});
    }
  });
  const result = async extra => {
    for (let i = 0; i < 24 && !threadId; i++) await sleep(250);
    const k = (t.url.match(/\/design\/([A-Za-z0-9]+)/) || [])[1] || fileKey;
    return { sent: true, ...extra, threadId, threadUrl: threadId && k ? `https://www.figma.com/design/${k}/Untitled?m=auto&agent-thread=${threadId}` : null };
  };
  try {
    await c.call('Network.enable');
    await c.call('Emulation.setFocusEmulationEnabled', { enabled: true });   // the page believes it has focus, so the Chrome window can stay in the background
    for (let i = 0; i < 90; i++) {                       // a freshly opened file needs time before the Agents button exists
      if (await c.ev(`!!(document.querySelector(${q(SEL.agentsBtn)})||document.querySelector(${q(SEL.box)}))`)) break;
      await sleep(500);
    }
    if (wantThread) {                                      // follow-up: open that chat in the same tab (the thread link), do NOT press "New chat"
      const k = (t.url.match(/\/design\/([A-Za-z0-9]+)/) || [])[1] || fileKey;
      await c.call('Page.navigate', { url: `https://www.figma.com/design/${k}/?m=auto&agent-thread=${wantThread}` });
      for (let i = 0; i < 120; i++) { if (await c.ev(`!!document.querySelector(${q(SEL.box)})`)) break; await sleep(500); }
      await sleep(800);
    } else {
      if (!(await c.ev(`!!document.querySelector(${q(SEL.box)})`))) { await c.ev(clickBy(SEL.agentsBtn)); await sleep(800); }
      await c.ev(clickBy(SEL.newChat)); await sleep(600);
    }
    let boxOk = false;                                     // the box can be missing for a moment after a page move: wait, open the Agents panel, try again
    for (let i = 0; i < 30 && !boxOk; i++) {
      boxOk = await c.ev(clickBy(SEL.box));
      if (!boxOk) { if (i % 6 === 3) await c.ev(clickBy(SEL.agentsBtn)); await sleep(500); }
    }
    if (!boxOk) throw new Error('Agent prompt box not found — selectors in SEL need an update');
    await c.ev(`(()=>{const x=document.querySelector(${q(SEL.box)});x.focus();document.execCommand('selectAll');document.execCommand('delete');})()`);   // an old draft in the box must never join the request
    await c.call('Input.insertText', { text });
    await sleep(250);
    const sent = await c.ev(`(()=>{const b=${findBtn(SEL.sendRe)}();if(!b)return false;b.click();return true})()`);
    if (!sent) { for (const type of ['keyDown', 'keyUp']) await c.call('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); }
    if (waitReplyMs > 0) {                                  // done = the Stop button went away after it had appeared
      const end = Date.now() + waitReplyMs; let seen = false;
      while (Date.now() < end) { const busy = await c.ev(`!!(${findBtn(SEL.stopRe)})()`); if (busy) seen = true; else if (seen) return await result({ finished: true }); await sleep(1000); }
      return await result({ finished: false });
    }
    return await result({});
  } finally { c.close(); }
}
// Stop button of the Figma Agent chat (the one in the open chat of the file's tab).
async function stopAgent({ fileKey, wait = false }) {
  const t = await tabFor(fileKey); if (!t) return { stopped: false, why: 'no tab' };
  const c = cdp(t.webSocketDebuggerUrl); await c.open;
  try {
    let hit = false;                                       // wait=true: the Agent was only just started — give its Stop button up to ~8 s to appear
    for (let i = 0; i < (wait ? 16 : 1) && !hit; i++) {
      hit = await c.ev(`(()=>{const b=${findBtn(SEL.stopRe)}();if(!b)return false;b.click();return true})()`);
      if (!hit && wait) await sleep(500);
    }
    return { stopped: !!hit, why: hit ? '' : 'the Agent is not running' };
  } finally { c.close(); }
}
// Make tab: open figma.com/make in a new tab of the debug Chrome, type the prompt, press Submit.
async function sendToMake({ text }) {
  if (!text) throw new Error('no text');
  const up = async () => { try { await j('/json/version'); return true; } catch (_) { return false; } };
  if (!(await up())) { launch(''); for (let i = 0; i < 40 && !(await up()); i++) await sleep(500); }
  if (!(await up())) throw new Error('Chrome did not start');
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?https://www.figma.com/make`, { method: 'PUT' })).json();
  const c = cdp(t.webSocketDebuggerUrl); await c.open;
  try {
    await c.call('Emulation.setFocusEmulationEnabled', { enabled: true });   // Chrome stays in the background; the desktop app shows the result
    let ok = false;
    for (let i = 0; i < 30 && !ok; i++) { ok = await c.ev(`!!document.querySelector(${q(SEL.makeBox)})`); if (!ok) await sleep(500); }
    if (!ok) throw new Error('Make prompt box not found — selectors in SEL need an update');
    await c.ev(`document.querySelector(${q(SEL.makeBox)}).focus()`);
    await c.call('Input.insertText', { text });
    await sleep(300);
    const sent = await c.ev(`(()=>{const b=${findBtn(SEL.makeSendRe)}();if(!b)return false;b.click();return true})()`);
    if (!sent) { for (const type of ['keyDown', 'keyUp']) await c.call('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); }
    let makeUrl = null;                                    // after Submit, Make moves to the new project: /make/<id>/… — that link opens in the desktop app
    for (let i = 0; i < 50 && !makeUrl; i++) {
      const href = await c.ev('location.href');
      if (/^https:\/\/www\.figma\.com\/make\/[A-Za-z0-9]{10,}/.test(href)) makeUrl = href.split('#')[0];
      else await sleep(400);
    }
    return { sent: true, makeUrl };
  } finally { c.close(); }
}
// Make sure a debug Chrome with this file is open: start Chrome if it is down, open the file tab if it is missing.
async function ensure(fileKey) {
  const up = async () => { try { await j('/json/version'); return true; } catch (_) { return false; } };
  if (!(await up())) {
    launch(fileKey);
    for (let i = 0; i < 40 && !(await up()); i++) await sleep(500);
    if (!(await up())) throw new Error('Chrome did not start');
  }
  if (!(await tabFor(fileKey))) {
    await fetch(`http://127.0.0.1:${PORT}/json/new?https://www.figma.com/design/${fileKey}/`, { method: 'PUT' });
    for (let i = 0; i < 60 && !(await tabFor(fileKey)); i++) await sleep(500);
  }
  if (!(await tabFor(fileKey))) throw new Error('the file tab did not open');
  return true;
}
function launch(fileKey) {
  const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const args = [`--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, fileKey ? `https://www.figma.com/design/${fileKey}/` : 'https://www.figma.com/make'];
  // macOS: `open -n -g` starts a NEW Chrome instance in the background (no window jumps to the front, your own Chrome is not touched)
  const p = process.platform === 'darwin' && !process.env.CHROME_BIN
    ? spawn('open', ['-n', '-g', '-a', 'Google Chrome', '--args', ...args], { detached: true, stdio: 'ignore' })
    : spawn(chrome, args, { detached: true, stdio: 'ignore' });
  p.unref(); return { launched: true, port: PORT, profile: PROFILE };
}
module.exports = { sendToAgent, sendToMake, status, stopAgent, launch, ensure, SEL };

if (require.main === module) {
  const a = process.argv.slice(2), opt = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  (async () => {
    if (opt('--launch')) console.log(JSON.stringify(launch(opt('--launch'))));
    else if (a.includes('--status')) console.log(JSON.stringify(await status(opt('--file'))));
    else if (opt('--make')) console.log(JSON.stringify(await sendToMake({ text: opt('--make') })));
    else if (opt('--send')) console.log(JSON.stringify(await sendToAgent({ fileKey: opt('--file'), text: opt('--send'), waitReplyMs: Number(opt('--wait') || 0), threadId: opt('--thread') || null })));
    else { console.log(require('node:fs').readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n')); process.exit(64); }
  })().catch(e => { console.error('ERR ' + e.message); process.exit(1); });
}
