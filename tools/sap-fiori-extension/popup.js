'use strict';

const nameEl   = document.getElementById('component-name');
const badgeEl  = document.getElementById('status-badge');
const catEl    = document.getElementById('category');
const statusEl = document.getElementById('status');

let extractedDoc  = null;
let extractedSlug = null;

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = type;
}

function applyBadge(status) {
  const s = (status || '').toLowerCase();
  badgeEl.textContent = status || 'Component';
  badgeEl.className = 'badge ' + (s === 'available' ? 'available' : s === 'deprecated' ? 'deprecated' : s === 'experimental' ? 'experimental' : '');
}

// ── Request extraction from content script ────────────────────────────────────
async function requestExtraction() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('No active tab found.', 'err');
    return;
  }

  setStatus('Extracting…');

  chrome.tabs.sendMessage(tab.id, { action: 'extract' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Could not reach content script. Try reloading the page.', 'err');
      return;
    }
    if (!response?.ok) {
      setStatus(response?.error || 'Extraction failed.', 'err');
      return;
    }

    extractedDoc  = response.doc;
    extractedSlug = response.meta?.slug || 'component';

    nameEl.textContent = response.meta?.componentName || tab.title;
    applyBadge(response.meta?.status);
    catEl.textContent  = response.meta?.category || '';
    setStatus(`Ready — ${extractedDoc.length.toLocaleString()} chars`, 'ok');
  });
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────
document.getElementById('btn-copy').addEventListener('click', async () => {
  if (!extractedDoc) {
    setStatus('Click again — extracting first…', '');
    await requestExtraction();
    return;
  }
  try {
    await navigator.clipboard.writeText(extractedDoc);
    setStatus('✅ Copied! Paste into Claude.', 'ok');
  } catch {
    setStatus('Clipboard blocked. Use Download instead.', 'err');
  }
});

// ── Download .md file ─────────────────────────────────────────────────────────
document.getElementById('btn-download').addEventListener('click', async () => {
  if (!extractedDoc) {
    setStatus('Extracting…', '');
    await requestExtraction();
    // Give extraction a moment, then retry download
    setTimeout(() => document.getElementById('btn-download').click(), 800);
    return;
  }
  const blob = new Blob([extractedDoc], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${extractedSlug}.md`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus(`⬇ Downloading ${extractedSlug}.md`, 'ok');
});

// ── Auto-extract on popup open ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', requestExtraction);
