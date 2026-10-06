// sketch.js — the READABLE wireframe and layer tree, drawn from the REAL tree (not a hand sketch, not to scale).
//   sketch(T)    a boxed phone-style wireframe, one line per row, zone letters on the right:   │ ‹   Dream Hotel   ♡ ⇪ │ A  Header · Icon Button ×2
//   layerTree(T) a box-drawing layer tree; repeated siblings fold to "Rating ×3 (text, icon, Object Number, Progress Indicator)"
// Used by tree.js `plan` for screens up to 600 px wide (a phone or a narrow panel). A wide screen has columns side by side, which one stack
// cannot show — tree.js keeps the to-scale grid for those.
'use strict';
// text columns inside the box (the box is IW + 4 wide): 36 for a phone, 120 for a desktop screen (set in sketch())
const GLYPH = { favorite: '♡', share: '⇪', 'share-arrow': '⇪', 'share-2': '⇪', 'navigation-left-arrow': '‹', 'slim-arrow-left': '‹', 'navigation-right-arrow': '›', 'slim-arrow-right': '›',
  'slim-arrow-down': '↓', 'navigation-down-arrow': '↓', 'slim-arrow-up': '↑', 'navigation-up-arrow': '↑', accept: '✓', pending: '~', overflow: '•', decline: '✗',
  'pushpin-on': '•', 'travel-itinerary': '~', search: '?', add: '+', edit: '/', delete: 'x', 'media-forward': '»', 'thumb-up': '+', suitcase: '#', flight: '>', filter: 'Y', 'sort-descending': '↓', 'sort-ascending': '↑', menu: '=', settings: '*', home: '^' };
// ONLY glyphs that keep the right border straight. Anything a font lacks is drawn by a fallback font with another width and the row jumps (seen in the user's app: ⌖ ⛟ ▓ ░ ◇ …).
const SAFE_GLYPHS = new Set([...'‹›↓↑♡⇪✓✗•»~?+/x#>vY=*^<']);
const glyph = n => GLYPH[String(n || '').split('/').pop()] || '*';
// Every character that reaches the box goes through safe(): anything that a font may draw with another width (emoji, symbols, CJK, zero-width marks)
// becomes '?', so the right border can never jump (user rule 2026-10-01: "always perfect").
const safe = s => [...String(s)].map(ch => {
  const c = ch.codePointAt(0);
  if (c === 0xa0) return ' ';
  if (c === 0xad || (c >= 0x300 && c <= 0x36f) || c === 0x200b || c === 0x200d || (c >= 0xfe00 && c <= 0xfe0f)) return '';
  if (c === 0x2026) return '.';
  if (c === 0x2013 || c === 0x2014 || c === 0x2212) return '-';
  if (c === 0x2018 || c === 0x2019) return "'";
  if (c === 0x201c || c === 0x201d) return '"';
  if (c === 0x20ac) return 'EUR';
  if (c < 0x20) return ' ';
  if (c < 0x7f) return ch;
  if ((c >= 0xa1 && c <= 0x24f) || (c >= 0x370 && c <= 0x52f) || (c >= 0x2500 && c <= 0x257f) || SAFE_GLYPHS.has(ch)) return ch;
  return '?';
}).join('');
const len = s => [...String(s)].length;
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - len(s)));
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' '); return len(s) > n ? [...s].slice(0, Math.max(1, n - 2)).join('') + '..' : s; };
const fit = (s, n) => (len(s) > n ? [...s].slice(0, Math.max(1, n - 2)).join('') + '..' : s);
const center = (s, n) => { s = clip(s, n); const l = Math.floor((n - len(s)) / 2); return ' '.repeat(l) + s + ' '.repeat(n - len(s) - l); };
const isSpacer = o => !o.k && !(o.c || []).length && ((o.s || '')[0] === 'F' || /spacer/i.test(o.n || ''));
const textOf = o => (o.tx && Object.values(o.tx)[0]) || (o.pr && (Object.entries(o.pr).find(([k]) => k.startsWith('✏️ Text') || k === '✏️ Label' || k === '✏️ Currency') || [])[1]) || '';

// ── the wireframe
function sketch(T) {
  const lines = [], count = {}, W = T.w || 390, WIDE = W > 600, IW = WIDE ? 120 : 36;
  const isCard = o => !o.k && o.bc && o.d === 'V' && (o.c || []).length >= 2;
  const keyOf = o => o.k === 'i' ? o.cp + '|' + ((o.pr && (o.pr.Semantic || o.pr.Type)) || '') : isCard(o) ? 'frame|' + String(o.n).split(' ')[0] : null;
  (function cnt(o) { const k = keyOf(o); if (k) count[k] = (count[k] || 0) + 1; (o.c || []).forEach(cnt); })(T);
  const nameOf = o => o.cp + (o.pr && (o.pr.Semantic || (o.cp === 'List Item' && o.pr.Type)) && o.pr.Semantic !== 'None' ? ` (${o.pr.Semantic || o.pr.Type})` : '');
  const tagOf = o => o.k === 'i' ? { key: keyOf(o), name: nameOf(o), base: o.cp }
    : isCard(o) ? { key: keyOf(o), name: String(o.n).split(' ')[0] + ' (frame)' }
    : o.k === 't' && /^(H[1-6]|Main Title)/.test(o.st || '') ? { key: 'title|' + o.n, name: o.n }
    : o.k === 'r' && o.h > 40 && o.w > 100 ? { key: 'img|' + o.n, name: o.n } : null;
  const push = (t, tags) => lines.push({ t, tags: (tags || []).filter(Boolean) });
  const bar = (o, n) => { const px = (o.pr && o.pr['✏️ Progress Bar'] ? len(o.pr['✏️ Progress Bar']) / 39 * 157 : 0.6 * (W - 32)), f = Math.min(n, Math.max(0, Math.round(px / (W - 32) * n))); return '#'.repeat(f) + '-'.repeat(n - f); };
  // one item of a row → { s: text, flex: text that fills the free space, sub: second line, trail: right-hand glyph }
  const item = o => {
    if (o.k === 't') return { s: String(o.t) };
    if (o.k === 'ic') return { s: glyph(o.ic) };
    if (o.k !== 'i') return { s: '' };
    const p = o.pr || {}, t = textOf(o);
    if (o.cp === 'Header') return { flex: fw => (/back/i.test(p.Type || '') ? '‹' : '') + center(t, fw - (/back/i.test(p.Type || '') ? 1 : 0)) };
    if (o.cp === 'Icon Button') return { s: glyph(p.Icon) };
    if (o.cp === 'Select') return { s: '[' + (t || 'Select') + ' v]' };
    if (o.cp === 'Input') return { s: '[' + (p['✏️ Placeholder'] || t || 'Input') + ']' };
    if (/Date/.test(o.cp)) return { s: '[Date range]' };
    if (o.cp === 'Side Navigation') return { s: 'Nav' };
    if (o.cp === 'Object Number') return { s: String(t || '0') };
    if (o.cp === 'Avatar') return { s: '(' + t + ')' };
    if (o.cp === 'Button') return (o.s || '')[0] === 'F' ? { flex: fw => '[' + center(t, fw - 2) + ']' } : { s: '[' + t + ']' };
    if (o.cp === 'Object Status') return { s: p.Inverted === 'Yes' ? '[' + t + ']' : (p.Semantic === 'Success' ? '✓ ' : p.Semantic === 'Warning' ? '! ' : WIDE && p.Semantic === 'Error' ? '✗ ' : WIDE && p.Semantic === 'Information' ? 'i ' : '') + t };
    if (o.cp === 'List Item') return { flex: () => textOf(o) || '', sub: p['✏️ Byline'] && /Byline/.test(p.Type || '') ? p['✏️ Byline'] : '', trail: p['Trailing Icon'] === true || p['Trailing Icon'] === 'true' ? '›' : '' };
    if (o.cp === 'Progress Indicator') return { flex: fw => bar(o, fw) };
    if (/Radio/.test(o.cp)) return { s: (/true/i.test(String(p.Selected)) ? '(o) ' : '( ) ') + t };
    if (/Check Box/.test(o.cp)) return { s: '[ ] ' + t };
    return { s: t || '[' + o.cp + ']' };
  };
  const row = (o, avail) => {
    const left = [], right = [], tags = []; let mid = null, side = 'l';
    for (const k of o.c || []) {
      if (isSpacer(k)) { side = 'r'; continue; }
      const it = item(k); tags.push(tagOf(k));
      if (it.flex && side === 'l' && !mid) { mid = it; side = 'r'; }
      else (side === 'l' && (o.a || '')[0] === 'X' ? right : side === 'l' ? left : right).push(it);
    }
    if (mid && mid.trail) right.unshift({ s: mid.trail });
    const L = left.map(x => x.s).join(' '), R = right.map(x => x.s || (x.flex && x.flex(8))).join(' ');
    const room = Math.max(1, avail - len(L) - len(R)), ind = L ? len(L) + 1 : 0;
    const body = mid ? (L ? L + ' ' : '') + pad(fit(mid.flex(room - (L ? 1 : 0) - 1), room - (L ? 1 : 0) - 1), room - (L ? 1 : 0)) + R : L + ' '.repeat(room) + R;
    push(body, tags); if (mid && mid.sub) push(' '.repeat(ind) + mid.sub, []);
  };
  const block = (o, avail) => {
    if (isSpacer(o)) return;
    if (o.k === 't') return push(clip(o.t, avail), [tagOf(o)]);
    if (o.k === 'ic') return push(glyph(o.ic), []);
    if (o.k === 'i') { const it = item(o); return push(it.flex ? it.flex(avail) : it.s, [tagOf(o)]); }
    if (o.k === 'r') {
      if (o.h <= 4) return push('─'.repeat(avail), []);
      if (o.h > 40 && o.w > 100) { push('┌' + '─'.repeat(avail - 2) + '┐', [tagOf(o)]); push('│' + center('[ ' + String(o.n).toLowerCase() + ' ]', avail - 2) + '│', []); return push('└' + '─'.repeat(avail - 2) + '┘', []); }
      return;
    }
    // timeline row: a rail (marker + line) beside a card → the marker glyph on the card's first line, a bar down the rest
    if (o.d === 'H' && (o.c || [])[0] && /^Rail/i.test(o.c[0].n || '') && o.c[1]) {
      const m = ((o.c[0].c || [])[0]) || {}, mark = m.k === 'ic' ? glyph(m.ic) : 'o', s0 = lines.length;
      block(o.c[1], avail - 4);
      lines.splice(s0).forEach((l, i) => lines.push({ t: (i === 0 ? mark : '│') + '   ' + l.t, tags: l.tags }));
      return;
    }
    // a bordered card → an inner box
    if (o.bc && o.d === 'V' && (o.c || []).length) {
      const s0 = lines.length, w = avail - 4;
      (o.c || []).forEach(k => block(k, w));
      const got = lines.splice(s0);
      push('┌' + '─'.repeat(avail - 2) + '┐', [tagOf(o)]);
      got.forEach(l => lines.push({ t: '│ ' + pad(fit(l.t, w), w) + ' │', tags: l.tags }));
      return push('└' + '─'.repeat(avail - 2) + '┘', []);
    }
    // a row with a stacked (V) group in the middle: avatar (AB) · name over role · action glyph
    if (!WIDE && o.d === 'H' && (o.c || []).some(k => !k.k && k.d === 'V' && !isSpacer(k))) {
      const kids = (o.c || []).filter(k => !isSpacer(k)), vi = kids.findIndex(k => !k.k && k.d === 'V'), v = kids[vi];
      const L = kids.slice(0, vi).map(k => item(k).s).join(' '), R = kids.slice(vi + 1).map(k => item(k).s).join(' ');
      const lw = L ? len(L) + 1 : 0, w = avail - lw - (R ? len(R) + 1 : 0), s0 = lines.length;
      block(v, w);
      const got = lines.splice(s0), tg = kids.filter(k => k !== v).map(tagOf);
      got.forEach((l, i) => lines.push({ t: i === 0 ? (L ? L + ' ' : '') + pad(fit(l.t, w), w) + (R ? ' ' + R : '') : ' '.repeat(lw) + l.t, tags: i === 0 ? tg.concat(l.tags) : l.tags }));
      return;
    }
    // desktop: children side by side (filters, cards, table cells, nav + content), each in a column of its own width
    const kids = (o.c || []).filter(k => !isSpacer(k));
    if (WIDE && o.d === 'H' && kids.length >= 2 && (kids.length >= 3 || kids.some(k => !k.k))) {
      columns(kids, avail);
      if (kids.every(k => k.cp === 'Table Cell' && k.pr && k.pr.Hierarchy === 'Column Header')) push('─'.repeat(avail), []);
      return;
    }
    if (o.d === 'H' && (o.c || []).every(k => k.k || isSpacer(k))) return row(o, avail);
    (o.c || []).forEach((k, i) => {
      if (WIDE && o.d === 'V' && i > 0 && k.bg && (k.c || []).length && !isSpacer(k)) push('─'.repeat(avail), []);   // a band (filter bar, cards, toolbar) starts
      block(k, avail);
    });
  };
  const columns = (kids, avail) => {
    const room = avail - 2 * (kids.length - 1), want = kids.map(k => Math.max(k.w || 40, 20)), tot = want.reduce((a, b) => a + b, 0);
    let ws = want.map(w => Math.max(6, Math.floor(w / tot * room)));
    // columns of different widths (filters, toolbar): give each its natural text width first. Equal-width columns (table cells) keep one shared grid so rows line up.
    if (!want.every(w => w === want[0])) {
      const nat = kids.map(k => { const s0 = lines.length; block(k, room); const g = lines.splice(s0); return Math.min(room, Math.max(6, ...g.map(l => len(safe(l.t).trimEnd())))); });
      if (nat.reduce((a, b) => a + b, 0) <= room) { let extra = room - nat.reduce((a, b) => a + b, 0); ws = nat.map((n, i) => n + Math.floor(extra * want[i] / tot)); }
    }
    let sum = ws.reduce((a, b) => a + b, 0);
    while (sum > room) { const i = ws.indexOf(Math.max(...ws)); if (ws[i] <= 6) break; ws[i]--; sum--; }
    while (sum < room) { const i = ws.indexOf(Math.max(...ws)); ws[i]++; sum++; }
    const cols = kids.map((k, i) => { const s0 = lines.length; block(k, ws[i]); return { got: lines.splice(s0), w: ws[i] }; });
    const n = Math.max(...cols.map(c => c.got.length));
    for (let r = 0; r < n; r++) push(cols.map(c => pad(fit(safe((c.got[r] || { t: '' }).t), c.w), c.w)).join('  '), cols.flatMap(c => (c.got[r] || { tags: [] }).tags));
  };
  const top = (T.c || []).filter(k => !isSpacer(k));
  top.forEach((c, i) => { if (i) lines.push({ sep: true, noSep: /footer/i.test(c.n || '') }); block(c, IW); });
  // zone letters: the first line that shows a component / title / image gets its letter + name (× how many in the whole tree)
  const seen = {}; let li = 0;
  for (const l of lines) {
    if (l.sep) continue;
    const fresh = l.tags.filter((t, i, arr) => !seen[t.key] && arr.findIndex(u => u.key === t.key) === i); fresh.forEach(t => { seen[t.key] = 1; });
    if (fresh.length && li < 26) { const grp = {}; fresh.forEach(t => { const nm = fresh.length > 1 && t.base ? t.base : t.name; grp[nm] = (grp[nm] || 0) + (count[t.key] || 1); });
      const names = Object.entries(grp).map(([nm, c]) => nm + (c > 1 ? ' ×' + c : '')); l.note = fit(String.fromCharCode(65 + li++) + '  ' + names.join(' + '), 46); }
  }
  const out = ['┌' + '─'.repeat(IW + 2) + '┐'];
  for (const l of lines) { if (l.sep) { if (!l.noSep) out.push('├' + '─'.repeat(IW + 2) + '┤'); } else out.push('│ ' + pad(fit(safe(l.t), IW), IW) + ' │' + (l.note ? ' ' + safe(l.note) : '')); }
  out.push('└' + '─'.repeat(IW + 2) + '┘');
  return out.join('\n');
}

// ── the layer tree: every line ends with `← L<level>` (+ the SAP component) — user style 2026-10-01
function layerTree(T, maxDepth = 5) {
  const sig = o => [o.k || 'f', o.cp || '', o.d || '', (o.c || []).filter(k => !isSpacer(k)).map(sig).join(',')].join('|');
  const leafNames = o => o.k ? [o.k === 'i' ? o.cp : o.k === 't' ? 'text' : o.k === 'ic' ? 'icon' : 'rect'] : (o.c || []).filter(k => !isSpacer(k)).flatMap(leafNames);
  const prefix = names => { const w = names.map(n => n.split(' ')); let i = 0; while (w.every(x => x[i] && x[i] === w[0][i])) i++; return i ? w[0].slice(0, i).join(' ') : names[0]; };
  const size = o => ({ F: 'FILL', H: 'HUG', X: 'FIXED' }[(o.s || 'X')[0]]);
  const what = (o, root) => root ? `${o.n} ${o.w}×${o.h} (${o.d || 'free'}, ${size(o)})`
    : o.k === 't' ? `${o.n} "${clip(o.t, 26)}"` : o.k === 'i' ? o.n : o.k === 'ic' ? `${o.n} (icon ${o.ic})` : o.k === 'r' ? `${o.n} (rect ${o.w}×${o.h})` : `${o.n} (${o.d || 'free'})`;
  const props = o => { const e = Object.entries(o.pr || {}).filter(([k, v]) => !k.startsWith('✏️') && typeof v !== 'boolean').map(([k, v]) => k + '=' + v); return e.length ? ', ' + e.join(', ') : ''; };
  const ann = (o, d) => '← L' + Math.min(d + 1, 5) + (o.k === 'i' ? ` (SAP ${o.cp}${props(o)})` : '');
  const rows = [];
  (function walk(o, pre, last, d, root) {
    rows.push({ t: (root ? '' : pre + (last ? '└─ ' : '├─ ')) + what(o, root), a: ann(o, d) });
    if (!o.c) return;
    const np = root ? '' : pre + (last ? '   ' : '│  ');
    if (d >= maxDepth) { rows.push({ t: np + '   … ' + o.c.length + ' inside', a: '' }); return; }
    const kids = o.c.filter(k => !isSpacer(k)), groups = [];
    for (let i = 0; i < kids.length; i++) { let j = i; while (j + 1 < kids.length && sig(kids[j + 1]) === sig(kids[i])) j++; groups.push(kids.slice(i, j + 1)); i = j; }
    groups.forEach((g, gi) => {
      const isLast = gi === groups.length - 1;
      if (g.length > 1) { const pf = prefix(g.map(x => x.n)), shared = g.every(x => x.n.startsWith(pf)) && pf !== g[0].n; rows.push({ t: np + (isLast ? '└─ ' : '├─ ') + `${shared ? pf + ' ×' + g.length : g.map(x => x.n).slice(0, 3).join(' / ')} (${[...new Set(leafNames(g[0]))].join(', ')})`, a: ann(g[0], d + 1) }); }
      else walk(g[0], np, isLast, d + 1, false);
    });
  })(T, '', true, 0, true);
  const col = Math.min(64, Math.max(...rows.map(r => len(r.t))) + 3);
  return rows.map(r => r.a ? (len(r.t) + 2 > col ? r.t + '  ' : pad(r.t, col)) + r.a : r.t).join('\n');
}

// ── the SCENE view for wide screens (user 2026-10-01, with his "good examples": the Purchase-Order and Flight wireframes)
// A real-looking mock in text: bands stacked with a header line (letter, name, colour token, padding), fields as [Label: value] chips, summary cards as boxes side by side,
// the table as a drawn grid with the column header and the sample rows, a side column beside the content. Generated from the REAL tree.
const kidsOf = o => (o.c || []).filter(k => !isSpacer(k));
const sigOf = o => [o.k || 'f', o.cp || '', o.d || '', kidsOf(o).map(sigOf).join(',')].join('|');
const isCardN = o => !o.k && o.bc && o.d === 'V' && kidsOf(o).length >= 2;
const rowsOfN = o => { const k = kidsOf(o); if (k.length < 4 || k.some(isCardN) || !kidsOf(k[k.length - 1]).length) return 0; const last = sigOf(k[k.length - 1]); return k.filter(x => sigOf(x) === last).length >= 3 ? k.length - 1 : 0; };
const leavesOf = o => o.k ? [o] : kidsOf(o).flatMap(leavesOf);
const isFieldN = o => !o.k && o.d === 'V' && kidsOf(o).length === 2 && kidsOf(o)[0].k === 't' && kidsOf(o)[1].k === 'i';
const chipOf = x => {
  const p = x.pr || {}, t = textOf(x);
  if (x.k === 't') return String(x.t);
  if (x.k === 'ic') return glyph(x.ic);
  if (x.k !== 'i') return '';
  if (x.cp === 'Side Navigation') return 'menu';
  if (x.cp === 'Button') return '(' + (t || 'Button') + ')';
  if (x.cp === 'Icon Button') return '[' + glyph(p.Icon) + ']';
  if (x.cp === 'Input') return '[' + (p['✏️ Placeholder'] || t || 'Input') + ']';
  if (x.cp === 'Select') return '[' + (t || 'Select') + ' v]';
  if (/Date/.test(x.cp)) return '[Date range]';
  if (x.cp === 'Object Status') return (p.Semantic === 'Success' ? '✓ ' : p.Semantic === 'Warning' ? '! ' : p.Semantic === 'Error' ? '✗ ' : p.Semantic === 'Information' ? 'i ' : '') + t;
  return t || x.cp;
};
const fieldChip = o => { const [l, c] = kidsOf(o), cc = chipOf(c); return cc[0] === '[' ? '[' + l.t + ': ' + cc.slice(1) : l.t + ' ' + cc; };
const tokensOf = o => { const out = []; (o.c || []).forEach(k => { if (isSpacer(k)) out.push(null); else if (isFieldN(k)) out.push(fieldChip(k)); else if (k.k) out.push(chipOf(k)); else out.push(...tokensOf(k).filter(Boolean)); }); return out; };

function scene(T, W = 132) {
  const zones = []; let nz = 0;
  const letter = () => { const i = nz++; return i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + i % 26); };
  const fix = (s, w) => pad(fit(safe(s), w), w);
  const compsOf = o => { const m = {}; leavesOf(o).filter(x => x.k === 'i').forEach(x => { m[x.cp] = (m[x.cp] || 0) + 1; }); return Object.entries(m).map(([c, k]) => c + (k > 1 ? ' ×' + k : '')).join(', '); };
  const flow = (tokens, w) => {
    const at = tokens.indexOf(null), L = (at < 0 ? tokens : tokens.slice(0, at)).join('  '), R = at < 0 ? '' : tokens.slice(at + 1).join('  ');
    if (len(L) + (R ? 2 : 0) + len(R) <= w) return [fix(L + ' '.repeat(Math.max(0, w - len(L) - len(R))) + R, w)];
    const out = []; let cur = '';
    for (const t of tokens.filter(Boolean)) { if (cur && len(cur) + 2 + len(t) > w) { out.push(cur); cur = t; } else cur = cur ? cur + '  ' + t : t; }
    if (cur) out.push(cur);
    return out.map(l => fix(l, w));
  };
  const table = (o, w) => {
    const k = kidsOf(o), cell = c => leavesOf(c).map(chipOf).filter(Boolean).join(' ');
    const head = kidsOf(k[0]).map(cell), body = k.slice(1).map(r => kidsOf(r).map(cell)), n = head.length;
    const nat = head.map((h, i) => Math.min(24, Math.max(len(safe(h)), ...body.map(r => len(safe(r[i] || ''))))));
    const room = w - (3 * n + 1);
    let cw = nat.slice(), sum = cw.reduce((a, b) => a + b, 0);
    while (sum > room) { const i = cw.indexOf(Math.max(...cw)); if (cw[i] <= 5) break; cw[i]--; sum--; }
    while (sum < room) { cw[sum % n]++; sum++; }
    const rule = (a, m, b) => a + cw.map(c => '─'.repeat(c + 2)).join(m) + b, line = r => '│ ' + cw.map((c, i) => fix(r[i] || '', c)).join(' │ ') + ' │';
    return [rule('┌', '┬', '┐'), line(head), rule('├', '┼', '┤'), ...body.map(line), rule('└', '┴', '┘')].map(l => fix(l, w));
  };
  const cards = (kids, w) => {
    const n = kids.length, cw = Math.floor((w - 2 * (n - 1)) / n), boxes = kids.map(c => {
      const t = leavesOf(c).map(chipOf).filter(Boolean), L = letter(); zones.push({ letter: L, name: c.n, comps: compsOf(c) });
      return ['┌' + '─'.repeat(cw - 2) + '┐', ...t.map((x, i) => '│ ' + fix((i === 0 ? L + '  ' : '') + x, cw - 4) + ' │'), '└' + '─'.repeat(cw - 2) + '┘'];
    });
    const h = Math.max(...boxes.map(b => b.length));
    return Array.from({ length: h }, (_, r) => fix(boxes.map(b => b[r] || ' '.repeat(cw)).join('  '), w));
  };
  const columns = (kids, w) => {
    const room = w - 3 * (kids.length - 1), want = kids.map(k => Math.max(k.w || 40, 20)), tot = want.reduce((a, b) => a + b, 0);
    const cw = want.map(x => Math.max(12, Math.floor(x / tot * room)));
    let sum = cw.reduce((a, b) => a + b, 0);
    while (sum > room) { const i = cw.indexOf(Math.max(...cw)); if (cw[i] <= 12) break; cw[i]--; sum--; }
    while (sum < room) { const i = cw.indexOf(Math.max(...cw)); cw[i]++; sum++; }
    const cols = kids.map((k, i) => band(k, cw[i], true, true));
    const h = Math.max(...cols.map(c => c.length));
    return Array.from({ length: h }, (_, r) => cols.map((c, i) => c[r] || ' '.repeat(cw[i])).join(' │ '));
  };
  const isBand = (c, top) => !c.k ? (c.bg || c.bc || rowsOfN(c)) && !isCardN(c) && c.n : top && c.k === 'i';
  const band = (c, w, top, first) => {
    const mine = isBand(c, top), L = mine ? letter() : '';
    const body = render(c, w);
    if (!mine) return body;
    const name = c.n === 'Side Navigation' ? 'Side Nav' : c.n; zones.splice(zones.findIndex(z => z.letter > L) < 0 ? zones.length : zones.findIndex(z => z.letter > L), 0, { letter: L, name: c.n, comps: compsOf(c) });
    const pd = !c.k && c.p ? 'pad: ' + (c.p[1] || c.p[0]) + 'px' : '', left = L + '  ' + name + (c.bg && !c.k ? '  [' + c.bg + ']' : '');
    return [fix(left + ' '.repeat(Math.max(1, w - len(safe(left)) - len(pd))) + pd, w), ...body];
  };
  const render = (o, w, top) => {
    if (o.k) return [fix(chipOf(o), w)];
    const k = kidsOf(o);
    if (rowsOfN(o)) return table(o, w);
    if (k.length && k.every(isCardN)) return cards(k, w);
    if (o.d === 'H') {
      if (k.length >= 2 && k.some(x => !x.k && !isFieldN(x) && kidsOf(x).some(y => !y.k))) return columns(k, w);
      return flow(tokensOf(o), w);
    }
    const out = [];
    k.forEach((c, i) => { const b = band(c, w, top || false); if (i && (isBand(c, top) || isBand(k[i - 1], top))) out.push('─'.repeat(w)); out.push(...b); });
    return out;
  };
  const lines = render(T, W, true);
  return { text: ['┌' + '─'.repeat(W + 2) + '┐', ...lines.map(l => '│ ' + fix(l, W) + ' │'), '└' + '─'.repeat(W + 2) + '┘'].join('\n'), zones: zones.map(z => ({ ...z, summary: z.comps })) };
}
module.exports = { sketch, scene, layerTree, SAFE_GLYPHS, GLYPH };

// ── CLEAN LAYER TREE (2026-10-05, reference style): wrapper frames (row / cell / column, plain auto-layout with no fill) are folded away,
//    so the tree shows only what a designer would name: sections, cards, kit parts, texts, icons, pictures.  Every line ends `← L<depth>`.
function layerTree2(T, maxDepth = 5) {
  const isWrap = o => !o.k && !o.bg && !o.bc && !o.cp && (/ (row|cell|column)( \d+)?$/i.test(o.n || '') || /^(row|cell|column)( \d+)?$/i.test(o.n || '') || (o.c || []).filter(k => !isSpacer(k)).length === 1);
  const kidsOf2 = o => (o.c || []).filter(k => !isSpacer(k) && !(k.k === 'r' && (k.w <= 3 || k.h <= 3))).flatMap(k => isWrap(k) ? kidsOf2(k) : [k]);
  const clean = n => String(n).replace(/ (row|cell|column)( \d+)?$/i, '').replace(/ \d+$/, '').trim() || n;
  const sig = o => [o.k || 'f', o.cp || '', o.k === 't' ? '' : kidsOf2(o).map(sig).join(',')].join('|');
  const props = o => { const e = Object.entries(o.pr || {}).filter(([k, v]) => !k.startsWith('✏️') && typeof v !== 'boolean').map(([k, v]) => k + '=' + v); return e.length ? ', ' + e.join(', ') : ''; };
  const what = (o, root) => root ? `${o.n}  ${o.w}×${o.h}` : o.k === 't' ? `"${clip(o.t, 30)}"` : o.k === 'i' ? clean(o.n) : o.k === 'ic' ? `icon ${o.ic}` : o.k === 'r' ? `Picture ${o.w}×${o.h}` : clean(o.n) + (o.bg ? `  [${o.bg}]` : '');
  const note = (o, d) => '← L' + Math.min(d + 1, 5) + (o.k === 'i' ? ` (SAP ${o.cp}${props(o)})` : o.k === 't' ? ' (text)' : o.k === 'ic' ? ' (icon)' : o.k === 'r' ? ' (image)' : '');
  const rows = [];
  (function walk(o, pre, last, d, root) {
    rows.push({ t: (root ? '' : pre + (last ? '└── ' : '├── ')) + what(o, root), a: note(o, d) });
    const np = root ? '' : pre + (last ? '    ' : '│   '), kids = kidsOf2(o);
    if (!kids.length) return;
    if (d >= maxDepth - 1) { rows.push({ t: np + '└── … ' + kids.length + ' inside', a: '' }); return; }
    const groups = [];
    for (let i = 0; i < kids.length; i++) { let j = i; while (j + 1 < kids.length && kids[i].k && sig(kids[j + 1]) === sig(kids[i])) j++; groups.push(kids.slice(i, j + 1)); i = j; }
    groups.forEach((g, gi) => {
      const isLast = gi === groups.length - 1;
      if (g.length > 2) rows.push({ t: np + (isLast ? '└── ' : '├── ') + `${g[0].k === 'i' ? clean(g[0].n) : g[0].k === 'ic' ? 'icon' : 'text'} ×${g.length}`, a: note(g[0], d + 1) });
      else g.forEach((x, xi) => walk(x, np, isLast && xi === g.length - 1, d + 1, false));
    });
  })(T, '', true, 0, true);
  const col = Math.min(60, Math.max(...rows.map(r => len(r.t))) + 3);
  return rows.map(r => r.a ? (len(r.t) + 2 > col ? r.t + '  ' : pad(r.t, col)) + r.a : r.t).join('\n');
}
module.exports.layerTree = layerTree2;
