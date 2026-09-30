// sketch.js — the READABLE wireframe and layer tree, drawn from the REAL tree (not a hand sketch, not to scale).
//   sketch(T)    a boxed phone-style wireframe, one line per row, zone letters on the right:   │ ‹   Dream Hotel   ♡ ⇪ │ A  Header · Icon Button ×2
//   layerTree(T) a box-drawing layer tree; repeated siblings fold to "Rating ×3 (text, icon, Object Number, Progress Indicator)"
// Used by tree.js `plan` for screens up to 600 px wide (a phone or a narrow panel). A wide screen has columns side by side, which one stack
// cannot show — tree.js keeps the to-scale grid for those.
'use strict';
const IW = 36;                                                   // text columns inside the box (the box is IW + 4 wide)
const GLYPH = { favorite: '♡', share: '⇪', 'share-arrow': '⇪', 'share-2': '⇪', 'navigation-left-arrow': '‹', 'slim-arrow-left': '‹', 'navigation-right-arrow': '›', 'slim-arrow-right': '›',
  'slim-arrow-down': '↓', 'navigation-down-arrow': '↓', 'slim-arrow-up': '↑', 'navigation-up-arrow': '↑', accept: '✓', decline: '✗',
  'pushpin-on': '•', 'travel-itinerary': '~', search: '?', add: '+', edit: '/', delete: 'x', 'media-forward': '»', 'thumb-up': '+', suitcase: '#', flight: '>', filter: 'v', menu: '=', settings: '*', home: '^' };
// ONLY glyphs that keep the right border straight. Anything a font lacks is drawn by a fallback font with another width and the row jumps (seen in the user's app: ⌖ ⛟ ▓ ░ ◇ …).
const SAFE_GLYPHS = new Set([...'‹›↓↑♡⇪✓✗•»~?+/x#>v=*^<']);
const glyph = n => GLYPH[String(n || '').split('/').pop()] || '*';
const len = s => [...String(s)].length;
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - len(s)));
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' '); return len(s) > n ? [...s].slice(0, Math.max(1, n - 2)).join('') + '..' : s; };
const fit = (s, n) => (len(s) > n ? [...s].slice(0, Math.max(1, n - 2)).join('') + '..' : s);
const center = (s, n) => { s = clip(s, n); const l = Math.floor((n - len(s)) / 2); return ' '.repeat(l) + s + ' '.repeat(n - len(s) - l); };
const isSpacer = o => !o.k && !(o.c || []).length && ((o.s || '')[0] === 'F' || /spacer/i.test(o.n || ''));
const textOf = o => (o.tx && Object.values(o.tx)[0]) || (o.pr && (Object.entries(o.pr).find(([k]) => k.startsWith('✏️ Text') || k === '✏️ Label') || [])[1]) || '';

// ── the wireframe
function sketch(T) {
  const lines = [], count = {}, W = T.w || 390;
  const keyOf = o => o.k === 'i' ? o.cp + '|' + ((o.pr && (o.pr.Semantic || o.pr.Type)) || '') : null;
  (function cnt(o) { const k = keyOf(o); if (k) count[k] = (count[k] || 0) + 1; (o.c || []).forEach(cnt); })(T);
  const nameOf = o => o.cp + (o.pr && (o.pr.Semantic || (o.cp === 'List Item' && o.pr.Type)) && o.pr.Semantic !== 'None' ? ` (${o.pr.Semantic || o.pr.Type})` : '');
  const tagOf = o => o.k === 'i' ? { key: keyOf(o), name: nameOf(o), base: o.cp }
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
    if (o.cp === 'Button') return (o.s || '')[0] === 'F' ? { flex: fw => '[' + center(t, fw - 2) + ']' } : { s: '[' + t + ']' };
    if (o.cp === 'Object Status') return { s: p.Inverted === 'Yes' ? '[' + t + ']' : (p.Semantic === 'Success' ? '✓ ' : p.Semantic === 'Warning' ? '! ' : '') + t };
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
    if (o.d === 'H' && (o.c || []).every(k => k.k || isSpacer(k))) return row(o, avail);
    (o.c || []).forEach(k => block(k, avail));
  };
  const top = (T.c || []).filter(k => !isSpacer(k));
  top.forEach((c, i) => { if (i) lines.push({ sep: true, noSep: /footer/i.test(c.n || '') }); block(c, IW); });
  // zone letters: the first line that shows a component / title / image gets its letter + name (× how many in the whole tree)
  const seen = {}; let li = 0;
  for (const l of lines) {
    if (l.sep) continue;
    const fresh = l.tags.filter(t => !seen[t.key]); fresh.forEach(t => { seen[t.key] = 1; });
    if (fresh.length && li < 26) { const names = [...new Set(fresh.map(t => (fresh.length > 1 && t.base ? t.base : t.name) + (count[t.key] > 1 ? ' ×' + count[t.key] : '')))]; l.note = fit(String.fromCharCode(65 + li++) + '  ' + names.join(' + '), 44); }
  }
  const out = ['┌' + '─'.repeat(IW + 2) + '┐'];
  for (const l of lines) { if (l.sep) { if (!l.noSep) out.push('├' + '─'.repeat(IW + 2) + '┤'); } else out.push('│ ' + pad(fit(l.t, IW), IW) + ' │' + (l.note ? ' ' + l.note : '')); }
  out.push('└' + '─'.repeat(IW + 2) + '┘');
  return out.join('\n');
}

// ── the layer tree
function layerTree(T, maxDepth = 5) {
  const sig = o => [o.k || 'f', o.cp || '', o.d || '', (o.c || []).filter(k => !isSpacer(k)).map(sig).join(',')].join('|');
  const leafNames = o => o.k ? [o.k === 'i' ? o.cp : o.k === 't' ? 'text' : o.k === 'ic' ? 'icon' : 'rect'] : (o.c || []).filter(k => !isSpacer(k)).flatMap(leafNames);
  const prefix = names => { const w = names.map(n => n.split(' ')); let i = 0; while (w.every(x => x[i] && x[i] === w[0][i])) i++; return i ? w[0].slice(0, i).join(' ') : names[0]; };
  const size = o => ({ F: 'FILL', H: 'HUG', X: 'FIXED' }[(o.s || 'X')[0]]);
  const what = (o, root) => o.k === 'i' ? o.cp + (textOf(o) ? ` "${clip(textOf(o), 26)}"` : '')
    : o.k === 't' ? `text "${clip(o.t, 26)}" · ${o.st || ''}` : o.k === 'ic' ? `icon ${o.ic}` : o.k === 'r' ? `rect ${o.w}×${o.h}`
    : `${o.n}${root ? ` ${o.w}×${o.h}` : ''} (${o.d || 'free'}${root ? ', ' + size(o) : ''})`;
  const out = [];
  (function walk(o, pre, last, d, root) {
    out.push((root ? '' : pre + (last ? '└─ ' : '├─ ')) + what(o, root));
    if (!o.c) return;
    const np = root ? '' : pre + (last ? '   ' : '│  ');
    if (d >= maxDepth) { out.push(np + '   … ' + o.c.length + ' inside'); return; }
    const kids = o.c.filter(k => !isSpacer(k)), groups = [];
    for (let i = 0; i < kids.length; i++) { let j = i; while (j + 1 < kids.length && sig(kids[j + 1]) === sig(kids[i])) j++; groups.push(kids.slice(i, j + 1)); i = j; }
    groups.forEach((g, gi) => {
      const isLast = gi === groups.length - 1;
      if (g.length > 1) { const pf = prefix(g.map(x => x.n)), shared = g.every(x => x.n.startsWith(pf)) && pf !== g[0].n; out.push(np + (isLast ? '└─ ' : '├─ ') + `${shared ? pf + ' ×' + g.length : g.map(x => x.n).slice(0, 3).join(' / ')} (${[...new Set(leafNames(g[0]))].join(', ')})`); }
      else walk(g[0], np, isLast, d + 1, false);
    });
  })(T, '', true, 0, true);
  return out.join('\n');
}
module.exports = { sketch, layerTree, SAFE_GLYPHS, GLYPH };
