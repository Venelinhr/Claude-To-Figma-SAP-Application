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
