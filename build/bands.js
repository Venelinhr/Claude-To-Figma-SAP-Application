// readable wireframe for wide screens: every leaf placed by the layout pass, grouped into horizontal bands, top to bottom
function bands(T, all) {
  const R = Math.round, cut = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const txt = o => (o.tx && Object.values(o.tx)[0]) || (o.pr && (Object.entries(o.pr).find(([k]) => /Text|Label|Title|Placeholder/.test(k) && typeof o.pr[k] === 'string') || [])[1]) || '';
  const leaves = all.filter(o => (o.k === 't' || o.k === 'ic' || o.k === 'i' || (o.k === 'r' && o.h > 40 && o.w > 40)) && o._w > 0 && o._h > 0);
  const lab = o => o.k === 't' ? cut(o.t, 40) : o.k === 'ic' ? '⟨' + String(o.ic).split('/').pop() + '⟩' : o.k === 'r' ? '[image ' + R(o._w) + '×' + R(o._h) + ']' : '[' + o.cp + (txt(o) ? ' "' + cut(txt(o), 28) + '"' : '') + ']';
  const zones = all.filter(o => !o.k && o._d >= 1 && o._d <= 4 && o._w * o._h >= 0.02 * T.w * T.h && (o.bc || o.bg) && !/ cell$/.test(o.n));
  const zoneOf = (cx, cy) => zones.filter(z => cx >= z._x && cx <= z._x + z._w && cy >= z._y && cy <= z._y + z._h).sort((a, b) => a._w * a._h - b._w * b._h)[0];
  const cy = o => o._y + o._h / 2, bs = [];
  for (const o of leaves.slice().sort((a, b) => cy(a) - cy(b))) {
    const b = bs[bs.length - 1];
    if (b && Math.abs(cy(o) - b.cy) <= Math.max(10, b.h * 0.6)) { b.items.push(o); b.cy = b.items.reduce((s, i) => s + cy(i), 0) / b.items.length; b.h = Math.max(b.h, o._h); }
    else bs.push({ items: [o], cy: cy(o), h: o._h });
  }
  const out = []; let last = null;
  for (const b of bs) {
    const it = b.items.sort((a, c) => a._x - c._x), x0 = Math.min(...it.map(i => i._x)), x1 = Math.max(...it.map(i => i._x + i._w));
    const z = zoneOf((x0 + x1) / 2, b.cy), zn = z ? z.n : 'Screen';
    if (zn !== last) { out.push(`── ${cut(zn, 60)} ${'─'.repeat(Math.max(2, 70 - Math.min(60, zn.length)))}`); last = zn; }
    let s = '', px = null; for (const i of it) { s += (px != null && i._x - px > 140 ? '   ···   ' : px != null ? '  ' : '') + lab(i); px = i._x + i._w; }
    out.push(`  y${String(R(b.cy)).padStart(4)} │ ${s}`);
  }
  return out.join('\n');
}
module.exports = { bands };

// TRUE-POSITION MAP (2026-10-05): the screen drawn to scale on a character grid — boxes where the cards/panels are, text where it is.
function map(T, all, COLS = Math.min(220, Math.max(100, Math.round(T.w / 6.5)))) {
  const R = Math.round, sx = COLS / T.w, RH = 17, rows = Math.max(8, Math.ceil(T.h / RH)) + 1;
  const g = Array.from({ length: rows }, () => Array(COLS).fill(' ')), own = Array.from({ length: rows }, () => Array(COLS).fill(0));
  const put = (r, c, ch, z) => { if (r >= 0 && r < rows && c >= 0 && c < COLS) { g[r][c] = ch; own[r][c] = z || 0; } };
  const cut = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return n <= 0 ? '' : s.length > n ? (n > 1 ? s.slice(0, n - 1) + '…' : '…') : s; };
  const geo = o => ({ c0: R(o._x * sx), c1: Math.min(COLS - 1, R((o._x + o._w) * sx) - 1), r0: Math.floor(o._y / RH), r1: Math.min(rows - 1, Math.max(Math.floor(o._y / RH), Math.floor((o._y + o._h) / RH) - 1)) });
  const boxes = all.filter(o => !o.k && o._w > 0 && o._h >= 36 && o._w >= 70 && (o.bc || o.bg) && o._d >= 1 && !/ cell$| row( \d+)?$/.test(o.n) && o._w * o._h < 0.8 * T.w * T.h)
    .sort((a, b) => b._w * b._h - a._w * a._h);
  boxes.forEach((o, i) => {
    const { c0, c1, r0, r1 } = geo(o); if (c1 - c0 < 4 || r1 - r0 < 1) return;
    for (let c = c0; c <= c1; c++) { put(r0, c, '─', 1); put(r1, c, '─', 1); }
    for (let r = r0; r <= r1; r++) { put(r, c0, '│', 1); put(r, c1, '│', 1); }
    put(r0, c0, '┌', 1); put(r0, c1, '┐', 1); put(r1, c0, '└', 1); put(r1, c1, '┘', 1);
    const nm0 = o.n.replace(/^Card\s*/, '').replace(/ (column|stack)( \d+)?$/, '').replace(/ \d+$/, ''), nm = ' ' + cut((nm0 && !/^(row|column|cell|stack)$/i.test(nm0)) ? nm0 : 'Panel', c1 - c0 - 3) + ' ';
    if (nm.length < c1 - c0) for (let k = 0; k < nm.length; k++) put(r0, c0 + 2 + k, nm[k], 1);
  });
  const big = boxes.filter(o => o._w >= 0.25 * T.w && o._x > 0.15 * T.w).sort((a, b) => a._x - b._x)[0];
  if (big) { const side = all.filter(o => o.k && o._x + o._w <= big._x + 2 && o._w > 0 && o._h > 0), pc0 = Math.max(0, R(Math.min(...side.map(o => o._x)) * sx) - 2), pc1 = R(big._x * sx) - 3;
    if (side.length >= 4 && pc1 - pc0 > 8) { const pr0 = Math.max(0, Math.floor(Math.min(...side.map(o => o._y)) / RH) - 1), pr1 = Math.min(rows - 1, Math.floor(Math.max(...side.map(o => o._y + o._h)) / RH) + 1);
      for (let c = pc0; c <= pc1; c++) { put(pr0, c, '─', 1); put(pr1, c, '─', 1); } for (let r = pr0; r <= pr1; r++) { put(r, pc0, '│', 1); put(r, pc1, '│', 1); } put(pr0, pc0, '┌', 1); put(pr0, pc1, '┐', 1); put(pr1, pc0, '└', 1); put(pr1, pc1, '┘', 1); ' Filters '.split('').forEach((ch, k) => put(pr0, pc0 + 2 + k, ch, 1)); } }
  const leaves = all.filter(o => (o.k === 't' || o.k === 'ic' || o.k === 'i' || (o.k === 'r' && o._h > 40 && o._w > 40)) && o._w > 0 && o._h > 0).sort((a, b) => a._y - b._y || a._x - b._x);
  const txt = o => (o.tx && Object.values(o.tx)[0]) || '';
  const items = [];
  for (const o of leaves) {
    const c0 = R(o._x * sx);
    if (o.k === 'r') { const { c1, r0, r1 } = geo(o); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) if (!own[rr][c]) put(rr, c, '░', 2); const L = '[image]'; for (let k = 0; k < L.length && c0 + 1 + k < c1; k++) put(Math.floor((r0 + r1) / 2), c0 + 1 + k, L[k], 3); continue; }
    const lab = o.k === 't' ? o.t : o.k === 'ic' ? '•' : '[' + (txt(o) ? cut(txt(o), 18) : o.cp) + ']';
    let r = Math.min(rows - 1, Math.floor((o._y + o._h / 2) / RH));
    if (own[r][c0] === 1 || own[r][Math.min(COLS - 1, c0 + 1)] === 1) r = !(own[Math.min(rows - 1, r + 1)][c0] === 1) ? Math.min(rows - 1, r + 1) : Math.max(0, r - 1);   // never write on a box line
    items.push({ r, c0, lab: String(lab).replace(/\s+/g, ' ').trim(), want: Math.max(R(o._w * sx), 3), ic: o.k === 'ic' });
  }
  items.sort((a, b) => a.r - b.r || a.c0 - b.c0);
  items.forEach((it, i) => {
    let next = COLS; for (let k = i + 1; k < items.length && items[k].r === it.r; k++) if (items[k].c0 > it.c0) { next = items[k].c0; break; }
    let edge = next; for (let c = it.c0 + 1; c < next; c++) if (own[it.r][c] === 1) { edge = c; break; }       // stop at a box wall
    const room = Math.max(it.ic ? 1 : 3, edge - it.c0 - 1), s = cut(it.lab, Math.max(room, 1));
    for (let k = 0; k < s.length; k++) put(it.r, it.c0 + k, s[k], 3);
  });
  const lines = g.map(r => r.join('').replace(/\s+$/, '')); while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.join('\n');
}
module.exports.map = map;
