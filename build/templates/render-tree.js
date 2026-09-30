// ── TREE RENDERER — after the prelude + const KIT + const TREE ──
// A v5 layout tree (see dump-layout.use_figma.js) → the screen 1:1: same frames, gaps, paddings, sizes,
// SAP instances + props, text styles, colour variables, layer names. Returns { nodeId, WARN, made }.
const _AL = { M: 'MIN', C: 'CENTER', X: 'MAX', S: 'SPACE_BETWEEN' };
const _ok = t => typeof t === 'string' && !t.startsWith('RAW');
let _made = 0;
async function _icon(name, colour) {
  const key = _k('i', name); if (!key) return null;
  const c = await _imp('c', key);
  const inst = (c.type === 'COMPONENT_SET' ? c.defaultVariant : c).createInstance();
  inst.name = name;
  if (colour) for (const v of inst.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION')) if (v.fills && v.fills.length) await fill(v, colour);
  return inst;
}
function _raw(node, t, stroke) {                         // an unbound colour: keep it visible, report it
  const h = t.slice(4), c = { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
  node[stroke ? 'strokes' : 'fills'] = [{ type: 'SOLID', color: c }];
  WARN.push(`${node.name}: raw colour ${t.slice(3)} — bind a SAP token`);
}
async function _paintNode(node, o) {
  if (o.img) { try { node.fills = [{ type: 'IMAGE', imageHash: o.img, scaleMode: 'FILL' }]; } catch (e) { node.fills = []; WARN.push(`${o.n}: image not in this file — upload the logo crop`); } }
  else if (_ok(o.bg)) await fill(node, o.bg); else if (o.bg) _raw(node, o.bg); else if ('fills' in node) node.fills = [];
  if (o.bc) {
    if (_ok(o.bc)) await stroke(node, o.bc, Array.isArray(o.bw) ? { t: o.bw[0], r: o.bw[1], b: o.bw[2], l: o.bw[3] } : { a: o.bw || 1 });
    else _raw(node, o.bc, true);
    node.strokeAlign = 'INSIDE';
  }
  if (o.r && 'cornerRadius' in node) node.cornerRadius = o.r;
  if (o.fxk) { try { const es = await _imp('s', o.fxk); await node.setEffectStyleIdAsync(es.id); } catch (e) { WARN.push(`${o.n}: shadow style — ${e.message}`); } }
}
// sizing letter per axis: X fixed, H hug, F fill. Old trees wrote F for fixed too → fill only when it spans the parent's free space.
let _EXPLICIT = false;                                  // tree.sz === 'x': F always means FILL
function _axis(o, par, i) {
  const L = (o.s || 'XX')[i];
  if (L !== 'F') return L === 'H' ? 'HUG' : 'FIXED';
  if (_EXPLICIT) return 'FILL';
  if (!par || !par.d) return 'FIXED';
  const p = Array.isArray(par.p) ? par.p : [par.p || 0, par.p || 0, par.p || 0, par.p || 0];
  const along = (par.d === 'H') === (i === 0), dim = i === 0 ? 'w' : 'h';
  if (!along) { const free = i === 0 ? par.w - p[1] - p[3] : par.h - p[0] - p[2]; return Math.abs(o[dim] - free) <= 1 ? 'FILL' : 'FIXED'; }
  const kids = (par.c || []).filter(k => !k.abs);
  const used = kids.reduce((s, k) => s + k[dim], 0) + (par.g || 0) * Math.max(0, kids.length - 1) + (i === 0 ? p[1] + p[3] : p[0] + p[2]);
  return Math.abs(used - par[dim]) <= 1 && kids.filter(k => (k.s || '')[i] === 'F').length === 1 ? 'FILL' : 'FIXED';
}
function _size(n, o, par) {
  if (!par || !par.d || o.abs) return;
  for (const i of [0, 1]) {
    const key = i === 0 ? 'layoutSizingHorizontal' : 'layoutSizingVertical';
    let m = _axis(o, par, i);
    try { n[key] = m; } catch (e) { try { n[key] = m = 'FIXED'; } catch (_) {} }
    // a FIXED instance keeps its default size unless told (Select button stayed 67 wide instead of 145)
    const want = i === 0 ? o.w : o.h, have = i === 0 ? n.width : n.height;
    if (m === 'FIXED' && want && Math.abs(have - want) > 0.5 && (n.type !== 'TEXT' || o.wrap))
      try { n.resize(i === 0 ? want : n.width, i === 0 ? n.height : want); } catch (_) {}
  }
}
async function _nav(sn, items) {
  const slot = sn.findOne(x => x.name === '⿻ Navigation Items'); if (!slot) { WARN.push('Side Navigation: no items slot'); return; }
  const all = slot.children.filter(c => c.type === 'INSTANCE'), plain = [];
  for (const c of all) { const m = await c.getMainComponentAsync(); if (m && /Type=Navigation Item/.test(m.name) && Math.round(c.height) <= 34) plain.push(c); }
  const base = plain[0] ? await plain[0].getMainComponentAsync() : null;
  for (let i = 0; i < all.length; i++) {
    const it = all[i];
    if (i >= items.length) { it.visible = false; continue; }
    if (base && !/Type=Navigation Item/.test((await it.getMainComponentAsync()).name)) it.swapComponent(base);
    const d = items[i], keys = Object.keys(it.componentProperties), p = {};
    for (const k of keys) { if (k.startsWith('✏️ Text#')) p[k] = d.text; if (k === 'Selected') p[k] = d.selected ? 'True' : 'False'; if (k === 'Expanded') p[k] = 'True'; if (k.startsWith('Icon#') && d.icon) { const ik = _k('i', d.icon); if (ik) p[k] = (await _imp('c', ik)).id; } }
    try { it.setProperties(p); } catch (e) { WARN.push('nav item ' + i + ': ' + e.message); }
  }
  const foot = sn.findOne(x => x.name === '⿻ Footer'); if (foot) foot.children.forEach(c => { c.visible = false; });
  const fr = sn.findOne(x => x.name === 'Footer'); if (fr) fr.visible = false;
}
async function _avatar(sb, initials) {
  const av = sb.findOne(x => x.type === 'INSTANCE' && x.name === 'Avatar'); if (!av) { WARN.push('Shell Bar: no avatar'); return; }
  const ik = Object.keys(av.componentProperties).find(k => k.startsWith('✏️ Initials#'));
  try { av.setProperties({ Type: 'Initials', Color: '6', ...(ik ? { [ik]: initials } : {}) }); } catch (e) { WARN.push('avatar: ' + e.message); }
}
async function NODE(o, parent, par) {
  let n;
  if (o.k === 't') {
    n = await T(o.t, o.st, _ok(o.bg) ? o.bg : null, { name: o.n });
    if (o.bg && !_ok(o.bg)) _raw(n, o.bg);
    if (o.ta) n.textAlignHorizontal = { C: 'CENTER', R: 'RIGHT', J: 'JUSTIFIED' }[o.ta];
    if (o.wrap || (o.ta && (o.s || '')[0] === 'X')) { n.textAutoResize = 'HEIGHT'; n.resize(o.w, n.height); }   // aligned text keeps its box
  } else if (o.k === 'i') {
    n = await I(o.cp, o.pr || {}, o.n); if (!n) return null;
    if (o.nav) await _nav(n, o.nav);                                 // Side Navigation: the slot's items become the app's items
    if (o.av) await _avatar(n, o.av);                                // Shell Bar: avatar initials
    for (const nm of (o.hide || [])) { const h = n.findOne(x => x.name === nm); if (h) h.visible = false; else WARN.push(`${o.n}: no layer "${nm}" to hide`); }   // e.g. the kit's sample tokens
    for (const a of (o.add || [])) {                               // text put into a kit slot (e.g. the placeholder of an empty Multi Combobox)
      const slot = n.findOne(x => x.name === a.into);
      if (!slot || !('appendChild' in slot)) { WARN.push(`${o.n}: no slot "${a.into}" for the text`); continue; }
      try { const t = await T(a.t, a.st, _ok(a.bg) ? a.bg : null, { name: a.t.slice(0, 28) }); slot.appendChild(t); } catch (e) { WARN.push(`${o.n}: slot text: ${e.message}`); }
    }
    for (const [nm, pr] of Object.entries(o.sub || {})) {          // properties of a nested instance (e.g. the Input inside a Multi Combobox)
      const si = n.findOne(x => x.type === 'INSTANCE' && x.name === nm);
      if (!si) { WARN.push(`${o.n}: no nested instance "${nm}"`); continue; }
      const defs = si.componentProperties, p = {};
      for (const [k, v] of Object.entries(pr)) { const key = Object.keys(defs).find(d => d === k || d.split('#')[0] === k); if (key) p[key] = v; else WARN.push(`${o.n}/${nm}: no property "${k}"`); }
      try { si.setProperties(p); } catch (e) { WARN.push(`${o.n}/${nm}: ${e.message}`); }
    }
    for (const [nm, ch] of Object.entries(o.tx || {})) {           // text typed inside the instance
      const t = n.findOne(x => x.type === 'TEXT' && x.name === nm);
      if (!t) { WARN.push(`${o.n}: no inner text "${nm}"`); continue; }
      for (const f of t.characters.length ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName]) await figma.loadFontAsync(f);
      t.characters = String(ch);
    }
  } else if (o.k === 'ic') {
    n = await _icon(o.ic, _ok(o.bg) ? o.bg : null); if (!n) return null;
    n.name = o.n;
    if (o.w && Math.abs(n.width - o.w) > 0.5) n.rescale(o.w / n.width);   // rescale keeps the icon's shape; resize distorts it
  } else if (o.k === 'r') {
    n = o.el ? figma.createEllipse() : figma.createRectangle(); n.name = o.n;
    n.resize(Math.max(0.01, o.w || 1), Math.max(0.01, o.h || 1)); await _paintNode(n, o);
  } else if (o.k === 'v') {
    n = figma.createNodeFromSvg(o.svg); n.name = o.n; n.fills = [];
    const t = o.bg || o.bc;
    for (const v of n.findAll(x => x.type === 'VECTOR')) { if (_ok(t)) { if (v.fills.length) await fill(v, t); if (v.strokes.length) await stroke(v, t); } else if (t) _raw(v, t); }
  } else {
    n = o.d ? figma.createAutoLayout(o.d === 'H' ? 'HORIZONTAL' : 'VERTICAL') : figma.createFrame();
    n.name = o.n;
    if (o.d) {
      n.itemSpacing = o.g || 0;
      const p = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
      [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft] = p;
      const a = o.a || 'MM'; n.primaryAxisAlignItems = _AL[a[0]]; n.counterAxisAlignItems = a[1] === 'S' ? 'MIN' : _AL[a[1]];
      n.strokesIncludedInLayout = false;
    }
    n.resize(Math.max(0.01, o.w || 1), Math.max(0.01, o.h || 1));
    await _paintNode(n, o);
    n.clipsContent = !!o.clip;
  }
  _made++;
  if (parent) {
    parent.appendChild(n);
    if (o.abs && par && par.d) n.layoutPositioning = 'ABSOLUTE';
    // an SVG's box can be bigger than the vector's (a 0-high line exports 6 high) → centre it on the vector's box
    if (o.xy) { n.x = o.xy[0] + (o.k === 'v' ? (o.w - n.width) / 2 : 0); n.y = o.xy[1] + (o.k === 'v' ? (o.h - n.height) / 2 : 0); }
    _size(n, o, par);
    if (par && !par.d && o.k === 'i' && (o.s || '')[0] === 'X' && Math.abs(n.width - o.w) > 0.5) try { n.resize(o.w, n.height); } catch (_) {}   // free-placed: fixed width too
  }
  if (o.c && !o.k) for (const ch of o.c) await NODE(ch, n, o);
  return n;
}
// ── COMPACT WIRE FORMAT (build/tree-codec.js RUNTIME_SRC — keep in sync; the gates test guards it) ──
const _DKEYS = ["cp","st","bg","bc","ic"];
function _fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0;}return h.toString(16).padStart(8,'0');}
function _decode(env){
  const D=env.d;
  const dec=o=>{const r={};for(const k in o){const v=o[k];if(k==='c')continue;r[k]=(_DKEYS.indexOf(k)>=0&&typeof v==='number')?D[v]:v;}if(o.c)r.c=o.c.map(dec);return r;};
  return dec(env.t);
}
// ── end compact wire format ──
async function BUILD_TREE(tr) {
  if (tr && tr.$c) { const plain = _decode(tr); if (_fnv(JSON.stringify(plain)) !== tr.k) return 'PAYLOAD CORRUPTED'; tr = plain; }
  _EXPLICIT = tr.sz === 'x';
  const root = await NODE(tr, null, null);
  let maxX = 0; for (const k of figma.currentPage.children) if (k !== root) maxX = Math.max(maxX, k.x + k.width);
  root.x = maxX + 200; root.y = 0;
  figma.currentPage.selection = [root]; figma.viewport.scrollAndZoomIntoView([root]);
  return { nodeId: root.id, name: root.name, made: _made, WARN };
}
// ── end TREE RENDERER ──
