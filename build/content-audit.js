// content-audit.js — a text-lane build must carry the REQUEST's content, not the skeleton's. Runs before the Figma build (0 tokens).
//   audit(tree, baselineTree, requestText) → [problem lines]
//   1. LEFTOVER   a text of the skeleton that is still in the tree and is not in the request (Case Number, CS-10482, Escalated …)
//   2. COLUMNS    a table header row and its data rows must have the same number of cells (a removed column goes from the header AND every row)
//   3. NAMES      a layer name that still carries a word of the old screen's content (Filter Customer, Card Unassigned, Deadline cell)
//   4. STATUS     the same status label must always have the same colour (Open = Information in every row)
//   5. DATES      the values of one column that look like dates must share ONE format (05 Oct 2026 and 2024-09-15 never mix)
// autoname() rewrites stale layer names from the new content. Found 2026-10-02: a plugin build had 7 headers over 8-cell rows and old support statuses ("Escalated") under the Status header.
'use strict';
const EXEMPT = new Set(['adapt filters', 'go', 'search', 'all', 'e.g. dec 31, 2023', 'e.g. dec 31 2023']);
const GENERIC = new Set(['report', 'overview', 'list', 'page', 'table', 'area', 'search', 'header', 'title', 'label', 'caption', 'number', 'input', 'select', 'button', 'cell', 'filter', 'card', 'bar', 'content', 'body', 'icon', 'text', 'last', 'with', 'from', 'this', 'that']);
const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

function texts(tree) {
  const out = new Map();                                   // normalized text → first layer name that holds it
  (function walk(o) {
    const add = v => { if (typeof v === 'string' && norm(v).length >= 4 && !EXEMPT.has(norm(v))) if (!out.has(norm(v))) out.set(norm(v), o.n); };
    if (o.k === 't') add(o.t);
    if (o.k === 'i') { Object.values(o.tx || {}).forEach(add); Object.entries(o.pr || {}).forEach(([k, v]) => { if (k.startsWith('✏️')) add(v); }); }
    (o.c || []).forEach(walk);
  })(tree);
  return out;
}

function audit(tree, baseline, request) {
  const problems = [], req = norm(request || '');
  const base = texts(baseline), now = texts(tree);
  for (const [t, layer] of now) if (base.has(t) && !req.includes(t) && !/^[\d\s.,:\/-]+$/.test(t)) problems.push(`LEFTOVER "${t}" in "${layer}" — a word of the old screen; the request does not contain it`);
  // NAMES: words that live in the skeleton's CONTENT and are not in the request must not survive in layer names
  const words = t => String(t).toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length >= 4 && !GENERIC.has(w));
  const contentWords = new Set([...base.keys()].flatMap(words));
  const seenName = new Set();
  const holds = (o, w) => { let f = false; (function g(x) { if (f) return; const t = x.k === 't' ? x.t : x.k === 'i' ? [...Object.values(x.tx || {}), ...Object.entries(x.pr || {}).filter(([k]) => k.startsWith('✏️')).map(([, v]) => v)].join(' ') : ''; if (String(t).toLowerCase().includes(w)) f = true; (x.c || []).forEach(g); })(o); return f; };
  (function nm(o) { for (const w of words(o.n || '')) if (contentWords.has(w) && !req.includes(w) && !holds(o, w) && !seenName.has(o.n)) { seenName.add(o.n); problems.push(`NAMES layer "${o.n}" still carries "${w}" from the old screen — rename it (set … name)`); } (o.c || []).forEach(nm); })(tree);
  // LENGTH: a text far longer than the skeleton's text in the same layer overflows its slot (a 32-char link where 16 fitted → clipped by the frame)
  const lens = new Map(); const key = (n, k) => String(n).replace(/\s*\d+$/, '') + '|' + (k || '');
  (function bl(o) { if (o.k === 't') lens.set(key(o.n), Math.max(lens.get(key(o.n)) || 0, String(o.t).length)); if (o.k === 'i') for (const [k, v] of Object.entries(o.tx || {})) lens.set(key(o.n, k), Math.max(lens.get(key(o.n, k)) || 0, String(v).length)); (o.c || []).forEach(bl); })(baseline);
  (function ln(o, inRow) {
    const row = inRow || /^(Row|Header Row)/i.test(o.n || '');
    const chk = (txt, k) => { const b = lens.get(key(o.n, k)); if (!row && b >= 6 && String(txt).length > Math.max(b * 1.6, b + 10)) problems.push(`LENGTH "${txt}" in "${o.n}" has ${String(txt).length} chars; the layout holds about ${Math.round(Math.max(b * 1.6, b + 10))} — shorten it`); };
    if (o.k === 't') chk(o.t); if (o.k === 'i') for (const [k, v] of Object.entries(o.tx || {})) chk(v, k);
    (o.c || []).forEach(c => ln(c, row));
  })(tree, false);
  // COVERAGE: an amount or a "by <Name>" in the request must be visible somewhere on the screen
  const allT = []; (function g(o) { if (o.k === 't') allT.push(o.t); if (o.k === 'i') { Object.values(o.tx || {}).forEach(v => allT.push(v)); Object.entries(o.pr || {}).forEach(([k, v]) => { if (k.startsWith('✏️') && typeof v === 'string') allT.push(v); }); } (o.c || []).forEach(g); })(tree);
  const hay = norm(allT.join(' | '));
  for (const m of String(request || '').matchAll(/\b(\d[\d.,]*\d)\s?(?:EUR|USD|GBP|BGN|CHF|€|\$)/g)) if (!hay.includes(m[1].toLowerCase())) problems.push(`COVERAGE the request says "${m[0]}" but no text on the screen shows it — put it in the title or summary line`);
  for (const m of String(request || '').matchAll(/\bby ([A-ZÀ-Ž][\p{L}'-]+ [A-ZÀ-Ž][\p{L}'-]+)/gu)) if (!hay.includes(m[1].toLowerCase())) problems.push(`COVERAGE the request names "${m[1]}" but no text on the screen shows it — put it in the title or summary line`);
  // STATUS: one label, one colour
  const sem = {};
  (function st(o) { if (o.k === 'i' && o.cp === 'Object Status' && o.tx && o.tx.Text) { const k = norm(o.tx.Text), v = (o.pr && o.pr.Semantic) || 'None'; if (sem[k] && sem[k] !== v) problems.push(`STATUS "${o.tx.Text}" is ${sem[k]} in one row and ${v} in another — one label, one colour`); else sem[k] = v; } (o.c || []).forEach(st); })(tree);
  // DATES: per column, one format
  const shape = v => String(v).replace(/\d/g, '9').replace(/[A-Za-z]+/g, 'a');
  const isDate = v => /\b(19|20)\d\d\b/.test(v) && /\d/.test(v) && (/[-/.]/.test(v) || /[A-Za-z]{3}/.test(v));
  (function cols(o) {
    const kids = (o.c || []).filter(k => !k.abs), rows = kids.filter(k => /^Row/i.test(k.n || ''));
    if (rows.length > 1) {
      const n = Math.max(...rows.map(r => (r.c || []).length));
      for (let i = 0; i < n; i++) {
        const vals = rows.map(r => { const c = (r.c || [])[i]; if (!c) return null; const all = []; (function g(x) { if (x.k === 't') all.push(x.t); if (x.k === 'i') { Object.values(x.tx || {}).forEach(v => all.push(v)); Object.entries(x.pr || {}).forEach(([k, v]) => { if (k.startsWith('✏️') && typeof v === 'string') all.push(v); }); } (x.c || []).forEach(g); })(c); return all.find(isDate) || null; }).filter(Boolean);
        if (vals.length > 1 && new Set(vals.map(shape)).size > 1) problems.push(`DATES column ${i + 1} mixes date formats (${[...new Set(vals)].slice(0, 3).join(' | ')}) — use one format`);
      }
    }
    (o.c || []).forEach(cols);
  })(tree);
  (function walk(o) {
    const kids = (o.c || []).filter(k => !k.abs);
    const head = kids.find(k => /^Header Row/i.test(k.n || ''));
    if (head) {
      const n = (head.c || []).length;
      for (const r of kids.filter(k => /^Row/i.test(k.n || ''))) if ((r.c || []).length !== n) problems.push(`COLUMNS "${r.n}" has ${(r.c || []).length} cells but the header row has ${n} — remove the same column from the header AND every row`);
    }
    (o.c || []).forEach(walk);
  })(tree);
  return problems;
}

// ── autoname: layer names that still carry the old screen's words are renamed from their NEW content (0 tokens, deterministic)
//   'Customer label' (text Supplier) → 'Supplier label' · 'Filter Customer' → 'Filter Supplier' · 'Card Unassigned' → 'Card Open Purchase Orders'
//   'Header Case Number' → 'Header PO Number' · a row cell is named after its column header ('Subject' → 'Material')
function autoname(tree, baseline, request) {
  const req = norm(request || ''), base = texts(baseline);
  const wordsOf = t => String(t).toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length >= 4 && !GENERIC.has(w));
  const contentWords = new Set([...base.keys()].flatMap(wordsOf));
  const staleWord = w => contentWords.has(w.toLowerCase()) && !req.includes(w.toLowerCase());
  const holdsW = (o, w) => { let f = false; (function g(x) { if (f) return; const t = x.k === 't' ? x.t : x.k === 'i' ? [...Object.values(x.tx || {}), ...Object.entries(x.pr || {}).filter(([k]) => k.startsWith('✏️')).map(([, v]) => v)].join(' ') : ''; if (String(t).toLowerCase().includes(w)) f = true; (x.c || []).forEach(g); })(o); return f; };
  const staleIn = o => wordsOf(o.n || '').some(w => staleWord(w) && !holdsW(o, w));
  const stale = n => wordsOf(n || '').some(staleWord);
  const clip = (x, n = 28) => { x = String(x).replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 2).trim() + '..' : x; };
  const mainText = o => o.k === 't' ? o.t : o.k === 'i' ? ((o.tx && Object.values(o.tx).find(v => typeof v === 'string' && v)) || (o.pr && (o.pr['✏️ Text'] || o.pr['✏️ Currency'] || o.pr['✏️ Placeholder'])) || '') : '';
  const firstText = o => { let f = ''; (function w(x) { if (f) return; const t = mainText(x); if (t) { f = String(t); return; } (x.c || []).forEach(w); })(o); return f; };
  let renamed = 0; const set = (o, n) => { if (n && o.n !== n) { o.n = n; renamed++; } };
  const suffixOf = n => (String(n).match(/\s(label|title|caption|number|input|select|text|button)$/i) || [])[1];
  (function walk(o, top) {
    const kids = o.c || [], head = kids.find(k => /^Header Row/i.test(k.n || ''));
    if (head) {
      const H = (head.c || []).map(c => mainText(c) || firstText(c));
      for (const r of kids.filter(k => /^Row/i.test(k.n || ''))) {
        (r.c || []).forEach((c, i) => { if (!H[i]) return; if (i === 0 && c.k === 'i') set(c, clip(H[i], 14) + ' ' + clip(mainText(c), 16)); else set(c, c.k !== 'i' && !/^$/.test(c.n || '') && c.c ? clip(H[i], 20) + ' cell' : clip(H[i], 24)); });
        set(r, 'Row ' + clip(firstText(r), 20));   // rows and cells are always named after the header and the first value
      }
    }
    if (!top && staleIn(o)) {
      if (o.k === 't') { const sf = suffixOf(o.n); set(o, clip(o.t) + (sf ? ' ' + sf : '')); }
      else if (o.k === 'i') { const sf = suffixOf(o.n); set(o, /^Header /.test(o.n) ? 'Header ' + clip(mainText(o)) : (clip(mainText(o) || o.cp) + (sf && sf.toLowerCase() !== 'text' ? ' ' + sf : ''))); }
      else if (o.c) { const prefix = String(o.n).split(' ').filter(w => !staleWord(w)).join(' '); const lab = firstText(o); if (lab) set(o, (prefix ? prefix + ' ' : '') + clip(lab)); }
    }
    kids.forEach(c => walk(c, false));
  })(tree, true);
  if (staleIn(tree)) { const pt = (function f(o) { return o.n === 'Page title' ? o.t : (o.c || []).map(f).find(Boolean); })(tree); const suf = String(tree.n).includes(' — ') ? ' — ' + tree.n.split(' — ').slice(1).join(' — ') : ''; if (pt) set(tree, clip(pt, 40) + suf); }
  return renamed;
}

// ── capabilities: what the compact ops can do on THIS skeleton (exact layer names, columns and their kind) — printed in the NEED block so the model writes valid ops the first time
function capabilities(tree) {
  const find = (re, o = tree) => { let f = null; (function w(x) { if (!f && re.test(x.n || '')) f = x; (x.c || []).forEach(w); })(o); return f; };
  const out = [], shell = find(/^Shell Bar$/), pt = find(/^Page title$/), tt = find(/^Table title$/i);
  const sets = [shell && `shell bar title: {n:"${shell.n}",tx:{Text:"…"}}`, pt && `page title: {n:"${pt.n}",t:"…"}`, tt && `table title: {n:"${tt.n}",t:"…"}`].filter(Boolean);
  if (sets.length) out.push('LAYOUT set → ' + sets.join(' · '));
  const stepStack = (function f(o) { const k = (o.c || []).filter(x => /^Step \d+$/.test(x.n || '')); if (k.length >= 2 && k.some(x => find(/^Selected bar$/, x))) return o; for (const c of o.c || []) { const r = f(c); if (r) return r; } return null; })(tree);
  if (stepStack) out.push('LAYOUT steps → ONE op for the whole timeline: steps:[{name,role,status,state:"done|current|todo",initials?,sem?}] in order — the script clones the right look (done = check marker, current = pending marker + selected bar, todo = empty circle), sets the texts and grows the frame. Exactly ONE step is "current" (the one under review). Never use clone/with for steps. Keep status short ("Approved: Nov 3").');
  // repeating groups (steps, cards, rows with a number suffix): the clone form, with the real inner names of the last group
  const seen = new Set();
  (function rep(o) {
    const g = {}; (o.c || []).forEach(k => { const m = String(k.n || '').match(/^(.*?)\s*(\d+)?$/); if (k.c && m && m[1] && !/^(Row|Header Row)/.test(k.n)) (g[m[1]] = g[m[1]] || []).push(k); });
    for (const [base, ks] of Object.entries(g)) if (ks.length >= 3 && !seen.has(o.n + base) && !(stepStack && stepStack === o)) {
      seen.add(o.n + base); const last = ks[ks.length - 1], leaves = [];
      (function lv(x) { if (x.k === 't') leaves.push(`{n:"${x.n}",t:"…"}`); else if (x.k === 'i') for (const k2 of Object.keys(x.tx || {})) leaves.push(`{n:"${x.n}",tx:{"${k2}":"…"}}`); (x.c || []).forEach(lv); })(last);
      out.push(`LAYOUT repeat → "${o.n}" has ${ks.length} "${base}" groups (${ks.map(k => k.n).join(', ')}). Need more? clone:[{n:"${last.n}",times:K,with:[[${leaves.slice(0, 6).join(',')}${leaves.length > 6 ? ',…' : ''}] per copy]}] — "with" uses the ORIGINAL names of "${last.n}". Need fewer? remove:["${last.n}"]. Frame and stack heights grow by themselves.`);
    }
    (o.c || []).forEach(rep);
  })(tree);
  const bar = find(/^Filter Bar$/), fl = bar ? bar.c.filter(k => /^Filter /.test(k.n) && !/^Filter (spacer|Actions)/.test(k.n)) : [];
  if (find(/^Table Area$/) || fl.length) out.push(fl.length ? `LAYOUT filters → ${fl.length} skeleton filters (from 0..${fl.length - 1}; "from" is a NUMBER); ${fl.map((f, i) => `${i}=${(((f.c || []).find(x => x.k === 'i') || {}).cp || '?')}`).join(' ')}` : 'LAYOUT filters → none in this layout (do not use "filters")');
  const band = find(/^Summary Cards$/), cards = band ? band.c.filter(k => /^Card /.test(k.n)) : [];
  if (find(/^Table Area$/) || cards.length) out.push(cards.length ? `LAYOUT cards → ${cards.length} skeleton cards` : 'LAYOUT cards → none in this layout (do NOT use "cards"; put KPIs in the title or add none)');
  const area = find(/^Table Area$/) || tree, head = find(/^Header Row/, area), row = (area.c || []).find(k => /^Row/i.test(k.n || ''));
  if (head && row) out.push('LAYOUT table → columns (keep index: header | cell kind): ' + head.c.map((h, i) => { const c = row.c[i], inst = c && (c.k === 'i' ? c : (function f(o) { let g = null; (function w(x) { if (!g && x !== c && x.k === 'i') g = x; (x.c || []).forEach(w); })(o); return g; })(c)), pr = (inst && inst.pr) || {}; const kind = !inst ? '?' : inst.cp === 'Object Status' ? 'status → {t,sem}' : '✏️ By Text Description' in pr ? 'LINK → {t,d} (d = 2nd line, required)' : 'text'; return `${i}: ${(h.tx && h.tx.Text) || '?'} | ${kind}`; }).join(' ; '));
  out.push('LAYOUT hints → numbers and codes you write (1000, 2000) are fine; every word of the old screen must go. One ops.json, all compact ops together, resume ONCE.');
  return out;
}
module.exports = { audit, texts, autoname, capabilities };
