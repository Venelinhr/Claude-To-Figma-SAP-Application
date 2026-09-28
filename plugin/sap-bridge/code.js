// SAP Bridge v4 — plugin main thread. Contract: bridge/README.md (Protocol v1).
// documentAccess is dynamic-page → only async node APIs.

const BASE = 'http://localhost:41778';
const NS = 'sapfiori';
let token = null;
let everConnected = false;
let inboxCursor = 0;
let pollCursor = 0;
let followingJobId = null;
let lastJobId = null;
let watchJobId = null;
let lastDoneAt = 0;
let pollTimer = null;
let lastRequest = { text: '', mode: '' };
const handledMailbox = new Set();

// ─── helpers ───────────────────────────────────────────────────────────────
function qs(params) {
  return Object.keys(params)
    .filter(function (k) { return params[k] !== undefined && params[k] !== null; })
    .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
}

// Figma sandbox rules: host localhost, token in the query, no headers, body = JSON string.
async function api(path, opts) {
  const method = (opts && opts.method) || 'GET';
  const sep = path.indexOf('?') >= 0 ? '&' : '?';
  const url = BASE + path + (token ? sep + 'token=' + encodeURIComponent(token) : '');
  const init = { method: method };
  if (opts && opts.body !== undefined) init.body = JSON.stringify(opts.body);
  try {
    const resp = await fetch(url, init);
    let json = null;
    try { json = await resp.json(); } catch (_) {}
    return { status: resp.status, json: json };
  } catch (err) {
    return { status: 0, json: null };
  }
}

function send(msg) { figma.ui.postMessage(msg); }
function later(fn, ms) { return setTimeout(fn, ms); }

function fileKeyNow(text) {
  let key = figma.fileKey || figma.root.getPluginData('fileKey') || '';
  const m = String(text || '').match(/figma\.com\/(?:design|file|proto|board)\/([A-Za-z0-9]{10,})/);
  if (m) { key = m[1]; figma.root.setPluginData('fileKey', key); }
  return key;
}

async function showNode(nodeId) {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) return null;
    let page = node.parent;
    while (page && page.type !== 'PAGE') page = page.parent;
    if (page && page !== figma.currentPage) await figma.setCurrentPageAsync(page);
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
    return node;
  } catch (_) { return null; }
}

// ─── start ─────────────────────────────────────────────────────────────────
figma.showUI(__html__, { width: 340, height: 560, themeColors: true });
figma.root.setRelaunchData({ open: 'Build SAP screens with Claude' });

(async function init() {
  token = (await figma.clientStorage.getAsync('sapBridgeToken')) || null;
  lastJobId = figma.root.getPluginData('lastJobId') || null;
  sendSelection();
  sendHistory(true);
  healthCheck();
  setInterval(healthCheck, 3000);
  inboxPoll();
  setInterval(checkMbxDone, 2000);
})();

// ─── find Claude, pair by itself ───────────────────────────────────────────
async function healthCheck() {
  const r = await api('/health');
  if (r.status === 0) { send({ type: 'status', value: 'looking' }); return; }
  const j = r.json;
  if (!j || j.app !== 'sap-v4-bridge') { send({ type: 'status', value: 'wrong-bridge' }); return; }
  if (!token) { await doPair(); if (!token) return; }
  send({ type: 'status', value: 'connected', repo: j.repo, branch: j.branch, model: j.model, busy: j.busy });
  if (!everConnected) { everConnected = true; reopenLastJob(); }
}

async function doPair() {
  token = null;
  const r = await api('/pair');
  if (r.status === 200 && r.json && r.json.token) {
    token = r.json.token;
    await figma.clientStorage.setAsync('sapBridgeToken', token);
  } else if (r.status === 409) {
    send({ type: 'status', value: 'pair-locked' });
  } else {
    send({ type: 'status', value: 'looking' });
  }
}

// ─── inbox: plans pushed from a Claude Code session; also the heartbeat ────
async function inboxPoll() {
  if (!token) { later(inboxPoll, 3000); return; }
  const r = await api('/inbox?' + qs({ since: inboxCursor, fileKey: fileKeyNow(''), fileName: figma.root.name }));
  if (r.status === 200 && r.json) {
    if (typeof r.json.cursor === 'number') inboxCursor = r.json.cursor;
    const events = r.json.events || [];
    for (let i = 0; i < events.length; i++) {
      const d = events[i].data || {};
      if (events[i].type === 'mailbox' && d.jobId && d.jobId !== followingJobId) {
        lastJobId = d.jobId;
        figma.root.setPluginData('lastJobId', d.jobId);
        send({ type: 'job-resumed', jobId: d.jobId });
        startPollLoop(d.jobId);                 // the job's own events replay the mailbox write
      }
    }
    later(inboxPoll, 100);
    return;
  }
  if (r.status === 401) { await doPair(); }
  later(inboxPoll, 3000);
}

// ─── selection ─────────────────────────────────────────────────────────────
function imageFill(n) {
  try {
    const fills = n.fills;
    if (!Array.isArray(fills)) return null;
    for (let i = 0; i < fills.length; i++) {
      if (fills[i].type === 'IMAGE' && fills[i].visible !== false && fills[i].imageHash) return fills[i];
    }
  } catch (_) {}
  return null;
}
function nodeInfo(n) {
  return { id: n.id, name: n.name, type: n.type, width: Math.round(n.width || 0), height: Math.round(n.height || 0), isImage: !!imageFill(n) };
}
function sendSelection() { send({ type: 'selection', nodes: figma.currentPage.selection.map(nodeInfo) }); }
figma.on('selectionchange', sendSelection);

// ─── Go ────────────────────────────────────────────────────────────────────
async function postJob(msg) {
  const text = String(msg.text || '');
  const fileKey = fileKeyNow(text);
  const cleanText = text.replace(/https?:\/\/\S*figma\.com\/\S+/g, '').trim();
  if (!fileKey) {
    send({ type: 'error', message: "Figma did not give this file's key. Paste the file link once (Share → Copy link) into the box and press Go." });
    return;
  }
  const sel = figma.currentPage.selection;
  let image = null;
  let imageNode = null;
  if (msg.imageBase64) {
    image = { base64: msg.imageBase64, mime: msg.imageMime || 'image/png', nodeId: null };
  } else {
    for (let i = 0; i < sel.length; i++) {
      const f = imageFill(sel[i]);
      if (!f) continue;
      try {
        const img = figma.getImageByHash(f.imageHash);
        const bytes = img ? await img.getBytesAsync() : null;
        if (bytes) {
          const mime = bytes[0] === 0xFF && bytes[1] === 0xD8 ? 'image/jpeg' : 'image/png';
          image = { base64: figma.base64Encode(bytes), mime: mime, nodeId: sel[i].id };
          imageNode = sel[i];
        }
      } catch (_) {}
      break;
    }
  }
  if (!cleanText && !image) {
    send({ type: 'error', message: 'File link saved. Now type your request (or select an image) and press Go.' });
    return;
  }
  const selection = sel.filter(function (n) { return n !== imageNode; }).map(nodeInfo);
  const r = await api('/job', { method: 'POST', body: {
    fileKey: fileKey, fileName: figma.root.name, text: cleanText, selection: selection, image: image, mode: msg.mode || 'claude',
  } });
  if (r.status === 401) { await doPair(); send({ type: 'error', message: 'Paired again with Claude — press Go once more.' }); return; }
  if (r.status === 409) { send({ type: 'error', message: 'Claude is busy with another job. Wait, or press Cancel on it.' }); return; }
  if (r.status !== 200 || !r.json || !r.json.jobId) {
    send({ type: 'error', message: (r.json && r.json.error) || (r.status === 0 ? 'Claude is not reachable.' : 'Could not start (' + r.status + ').') });
    return;
  }
  lastJobId = r.json.jobId;
  lastRequest = { text: cleanText || (image ? 'Reference image' : ''), mode: msg.mode || 'claude' };
  figma.root.setPluginData('lastJobId', lastJobId);
  figma.root.setPluginData('lastRequest', JSON.stringify(lastRequest));
  send({ type: 'job-started', jobId: lastJobId });
  startPollLoop(lastJobId);
}

// ─── follow one job ────────────────────────────────────────────────────────
function startPollLoop(jobId) {
  clearTimeout(pollTimer);
  followingJobId = jobId;
  pollCursor = 0;
  pollOnce(jobId);
}

async function pollOnce(jobId) {
  if (jobId !== followingJobId) return;
  if (!token) { pollTimer = later(function () { pollOnce(jobId); }, 3000); return; }
  const r = await api('/poll?' + qs({ runId: jobId, since: pollCursor }));
  if (jobId !== followingJobId) return;
  if (r.status === 200 && r.json) {
    if (typeof r.json.cursor === 'number') pollCursor = r.json.cursor;
    const events = r.json.events || [];
    let finished = false;
    for (let i = 0; i < events.length; i++) {
      await handleEvent(events[i]);
      if (events[i].type === 'done' || events[i].type === 'error') finished = true;
    }
    if (finished) { followingJobId = null; return; }
    pollTimer = later(function () { pollOnce(jobId); }, 100);
    return;
  }
  if (r.status === 404) {
    followingJobId = null;
    send({ type: 'error', message: 'Claude restarted and this job is gone. Press Go again.' });
    return;
  }
  if (r.status === 401) await doPair();
  pollTimer = later(function () { pollOnce(jobId); }, 3000);
}

async function handleEvent(ev) {
  if (!ev || !ev.type) return;
  const d = ev.data || {};
  switch (ev.type) {
    case 'stage': send({ type: 'stage', name: d.name, text: d.text }); break;
    case 'progress': send({ type: 'progress', text: d.text }); break;
    case 'ask': send({ type: 'ask', question: d.question, jobId: followingJobId || lastJobId }); break;
    case 'mailbox': await handleMailbox(d); break;
    case 'logos': await handleLogos(d); break;
    case 'done': await handleDone(d); break;
    case 'error': send({ type: 'error', message: d.message || 'The job stopped.' }); break;
    default: break;
  }
}

// ─── Figma Agent mailbox (shared plugin data on the file) ──────────────────
function currentDoneAt() {
  try { return JSON.parse(figma.root.getSharedPluginData(NS, 'mbx_done') || '{}').at || 0; } catch (_) { return 0; }
}

async function handleMailbox(d) {
  const key = d.jobId + ':' + d.kind + ':' + (d.fix ? d.fix.round : 0);
  if (handledMailbox.has(key)) return;
  handledMailbox.add(key);
  if (d.kind === 'plan') {
    const keys = figma.root.getSharedPluginDataKeys(NS);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('mbx_part_') === 0 || keys[i] === 'mbx_fix' || keys[i] === 'mbx_done') {
        figma.root.setSharedPluginData(NS, keys[i], '');
      }
    }
    const parts = d.parts || [];
    for (let i = 0; i < parts.length; i++) {
      figma.root.setSharedPluginData(NS, 'mbx_part_' + parts[i].id, JSON.stringify(parts[i]));
    }
    const job = Object.assign({}, d.job || {}, { jobId: d.jobId, kind: 'plan', parts: parts.map(function (p) { return p.id; }) });
    figma.root.setSharedPluginData(NS, 'mbx_job', JSON.stringify(job));
    lastDoneAt = 0;
    figma.notify("Plan ready — type 'build plan' in the Figma Agent", { timeout: 10000 });
  } else if (d.kind === 'fix') {
    figma.root.setSharedPluginData(NS, 'mbx_fix', JSON.stringify(d.fix || {}));
    lastDoneAt = currentDoneAt();
    figma.notify("Fixes ready — type 'apply fixes' in the Figma Agent", { timeout: 10000 });
  }
  watchJobId = d.jobId;
  send({ type: 'mailbox', kind: d.kind, jobId: d.jobId });
}

async function checkMbxDone() {
  if (!watchJobId || !token) return;
  let d;
  try { d = JSON.parse(figma.root.getSharedPluginData(NS, 'mbx_done') || 'null'); } catch (_) { return; }
  if (!d || d.jobId !== watchJobId || !(d.at > lastDoneAt)) return;
  const r = await api('/mbx/done', { method: 'POST', body: { jobId: d.jobId, nodeId: String(d.nodeId || ''), WARN: d.WARN || [] } });
  if (r.status === 0) return;                           // retry on the next tick
  lastDoneAt = d.at;
  watchJobId = null;
  if (r.status >= 400) send({ type: 'error', message: (r.json && r.json.error) || 'Claude did not accept the build.' });
}

// ─── logos: fill the frames named after the plan element ───────────────────
// A build may name the frame "Wizz logo leg1" or "Card 2 / Leg 1 · Wizz logo leg1";
// the same element can repeat per card, so the row's group picks the right one.
function namedLike(n, el) {
  const a = n.name.toLowerCase();
  const b = el.toLowerCase();
  return a === b || a.endsWith(' · ' + b) || a.endsWith('/' + b) || a.endsWith(' ' + b);
}
function inGroup(n, group) {
  if (!group) return true;
  if (n.name.indexOf(group) >= 0) return true;
  const parts = group.split('/').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  const chain = [];
  for (let p = n.parent; p; p = p.parent) chain.push(p.name.toLowerCase());
  return parts.every(function (part) { return chain.some(function (c) { return c.indexOf(part) >= 0; }); });
}
async function handleLogos(d) {
  let placed = 0;
  try {
    const root = await figma.getNodeByIdAsync(d.nodeId);
    if (root && 'findAll' in root) {
      const used = new Set();
      (d.items || []).forEach(function (it) {
        const all = root.findAll(function (n) { return 'fills' in n && namedLike(n, it.element); });
        const inG = all.filter(function (n) { return inGroup(n, it.group); });
        const pick = (inG.length ? inG : all).find(function (n) { return !used.has(n.id); });
        if (!pick) return;
        try {
          pick.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(it.base64)).hash, scaleMode: 'FILL' }];
          used.add(pick.id);
          placed++;
        } catch (_) {}
      });
    }
  } catch (_) {}
  await api('/job/logos-done', { method: 'POST', body: { jobId: d.jobId, placed: placed } });
  send({ type: 'logos-placed', placed: placed });
}

// Work history lives in the file (shared plugin data would be readable by other plugins; plugin data is ours).
const HISTORY_KEY = 'sapBridgeHistory';
function readHistory() {
  try { const h = JSON.parse(figma.root.getPluginData(HISTORY_KEY) || '[]'); return Array.isArray(h) ? h : []; } catch (_) { return []; }
}
function sendHistory(showLatest) { send({ type: 'history', items: readHistory(), showLatest: !!showLatest }); }

async function handleDone(d) {
  const node = d.nodeId ? await showNode(d.nodeId) : null;
  if (node) { try { node.setRelaunchData({ open: 'Build SAP screens with Claude' }); } catch (_) {} }
  let req = lastRequest;
  try { if (!req.text) req = JSON.parse(figma.root.getPluginData('lastRequest') || '{}'); } catch (_) {}
  const entry = { jobId: d.jobId || lastJobId, at: Date.now(), name: node ? node.name : (d.name || 'Screen'), nodeId: d.nodeId || null,
    match: d.match == null ? null : d.match, eye: d.eye == null ? null : d.eye, pass: d.pass !== false,
    mode: req.mode || '', request: String(req.text || '').slice(0, 140), blocks: d.blocks || [] };
  const items = readHistory().filter(function (h) { return h.jobId !== entry.jobId; });
  items.unshift(entry);
  figma.root.setPluginData(HISTORY_KEY, JSON.stringify(items.slice(0, 30)));
  send({ type: 'done', data: Object.assign({}, d, { name: entry.name, request: entry.request, mode: entry.mode, at: entry.at }) });
  sendHistory(false);
}

// ─── reopen: follow a job that is still running for this file ──────────────
async function reopenLastJob() {
  if (!token || followingJobId) return;
  const r = await api('/job/last?' + qs({ fileKey: fileKeyNow('') }));
  const j = r.json;
  if (r.status !== 200 || !j || !j.jobId) return;
  if (j.phase !== 'done' && j.phase !== 'error') {
    lastJobId = j.jobId;
    send({ type: 'job-resumed', jobId: j.jobId });
    startPollLoop(j.jobId);
  }
}

// ─── UI messages ───────────────────────────────────────────────────────────
figma.ui.onmessage = async function (msg) {
  switch (msg.type) {
    case 'go': await postJob(msg); break;
    case 'cancel':
      if (followingJobId || lastJobId) {
        const r = await api('/job/cancel', { method: 'POST', body: { jobId: followingJobId || lastJobId } });
        if (r.status >= 400 || r.status === 0) send({ type: 'cancelled' });
      } else {
        send({ type: 'cancelled' });
      }
      break;
    case 'answer':
      await api('/answer', { method: 'POST', body: { jobId: msg.jobId || followingJobId || lastJobId, text: msg.text } });
      break;
    case 'reopen': await reopenLastJob(); break;
    case 'show-node': if (msg.nodeId) await showNode(msg.nodeId); break;
    case 'unpair':
      send({ type: 'error', message: 'Nothing to do: SAP Bridge pairs once and reconnects by itself. Only to connect a different Figma (another computer), ask Claude: node build/mailbox.js unpair' });
      break;
    default: break;
  }
};
