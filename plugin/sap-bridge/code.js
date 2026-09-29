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
let jobStartedAt = null;
let watchJobId = null;
let lastDoneAt = 0;
let pollTimer = null;
let lastRequest = { text: '', mode: '' };
const handledMailbox = new Set();

// ── v5 tree jobs: the plugin BUILDS the tree itself (the model types nothing) ──
// The CLI (build/send.js) queues a ready payload {version, runtime, kit, tree}; we poll /tree/next
// for the current file, run the payload, place logos, dump geometry + the audit tree, export a PNG,
// and POST it all to /tree/result. No use_figma, no model typing.
let treePollTimer = null;
let treeBusy = false;
// ── GENERATED RUNTIME (node build/plugin-bundle.js) — do not edit by hand ──
const RUNTIME_VER = '03a8a0c66b';
function _createAutoLayout(dir, o) {
  if (typeof figma.createAutoLayout === 'function') return figma.createAutoLayout(dir, o);
  const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.fills = []; f.clipsContent = false; if (o && o.name) f.name = o.name; if (o && o.itemSpacing != null) f.itemSpacing = o.itemSpacing;
  return f;
}
async function RUN_TREE(KIT, TREE) {
// ── SAP KIT RUNTIME v3 — paste once at the top of every build use_figma call ──
// Needs: const KIT = {...}  (generate with: node build/kit.js pack <names...>)
// API:  await I('Button', {Type:'Primary', Text:'Save', 'Icon Left':true, Icon:'add'})  → instance
//       await T('Hello', 'Header/H3', 'sapTitleColor')   → text node, SAP text style + colour variable bound
//       await fill(node, 'sapBackgroundColor') · await stroke(node, 'sapList_BorderColor', {b:1})
//       await space(frame, {p:'sapContent_Space_M', gap:8}) — numbers or FLOAT variable names
//       AL('VERTICAL', {name, gap, p:[t,r,b,l]}) → auto-layout frame · put(parent, child, 'FILL'|'HUG')
//       sub(inst, 'Layer name') → nested instance (to set its props with setP)
// Every unknown prop / value / key is pushed to WARN — return WARN from the build. Never silent.
const WARN = [], _cache = {};
const _norm = s => s.replace(/#.*$/, '').replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();
async function _imp(kind, key) {
  const id = kind + key; if (_cache[id]) return _cache[id];
  let r;
  if (kind === 'c') { try { r = await figma.importComponentSetByKeyAsync(key); } catch (e) { r = await figma.importComponentByKeyAsync(key); } }
  else if (kind === 'v') r = await figma.variables.importVariableByKeyAsync(key);
  else if (kind === 's') r = await figma.importStyleByKeyAsync(key);
  return (_cache[id] = r);
}
function _k(group, name) { const k = KIT[group] && KIT[group][name]; if (!k) WARN.push(`KIT.${group} has no "${name}" — add it with kit.js pack`); return k; }
async function setP(inst, props) {
  const defs = inst.componentProperties, byNorm = {};
  for (const k of Object.keys(defs)) byNorm[_norm(k)] = k;
  const variants = {}, rest = {};
  for (const [name, val] of Object.entries(props)) {
    const real = defs[name] ? name : byNorm[_norm(name)];
    if (!real) { WARN.push(`${inst.name}: no prop "${name}" (has: ${Object.keys(defs).map(_norm).join(', ')})`); continue; }
    const d = defs[real];
    if (d.type === 'VARIANT') {
      const mc = await inst.getMainComponentAsync();   // async: plugins with documentAccess dynamic-page forbid .mainComponent
      const opts = mc && mc.parent && mc.parent.type === 'COMPONENT_SET'
        ? mc.parent.componentPropertyDefinitions[real].variantOptions : [];
      const v = String(val), hit = opts.find(o => o.toLowerCase() === v.toLowerCase());
      if (!hit) { WARN.push(`${inst.name}.${real}: "${v}" not in [${opts.join(', ')}]`); continue; }
      variants[real] = hit;
    } else if (d.type === 'INSTANCE_SWAP') {
      const key = /^[0-9a-f]{40}$/.test(val) ? val : _k('i', val); if (!key) continue;
      rest[real] = (await _imp('c', key)).id;
    } else rest[real] = d.type === 'BOOLEAN' ? !!val : String(val);
  }
  if (Object.keys(variants).length) inst.setProperties(variants);   // variants first: they can reset other props
  if (Object.keys(rest).length) inst.setProperties(rest);
  return inst;
}
async function I(name, props = {}, layerName) {
  const key = _k('c', name); if (!key) return null;
  const n = await _imp('c', key);
  const inst = (n.type === 'COMPONENT_SET' ? n.defaultVariant : n).createInstance();
  if (layerName) inst.name = layerName;
  return setP(inst, props);
}
function sub(inst, layerName) { return inst.findOne(n => n.type === 'INSTANCE' && n.name === layerName); }
async function _paint(varName) { const key = _k('v', varName); if (!key) return null;
  const v = await _imp('v', key); return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v); }
async function fill(node, varName) { const p = await _paint(varName); if (p) node.fills = [p]; return node; }
async function stroke(node, varName, w = { a: 1 }) {
  const p = await _paint(varName); if (!p) return node; node.strokes = [p]; node.strokeAlign = 'INSIDE';
  if (w.a) node.strokeWeight = w.a; else Object.assign(node, { strokeTopWeight: w.t || 0, strokeRightWeight: w.r || 0, strokeBottomWeight: w.b || 0, strokeLeftWeight: w.l || 0 });
  return node; }
async function _num(node, field, val) {
  if (typeof val === 'number') { node[field] = val; return; }
  const key = _k('v', val); if (key) node.setBoundVariable(field, await _imp('v', key));
}
async function space(f, o) {
  if (o.p !== undefined) { const p = Array.isArray(o.p) ? o.p : [o.p, o.p, o.p, o.p];
    for (const [i, s] of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].entries()) await _num(f, s, p[i]); }
  if (o.gap !== undefined) await _num(f, 'itemSpacing', o.gap);
  if (o.r !== undefined) for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) await _num(f, c, o.r);
  return f; }
function AL(dir, o = {}) {
  const f = _createAutoLayout(dir, { name: o.name || 'Container', itemSpacing: typeof o.gap === 'number' ? o.gap : 0 });
  f.fills = []; f.strokesIncludedInLayout = false;   // border must not push content in
  f.primaryAxisSizingMode = f.counterAxisSizingMode = 'AUTO';   // hug, not the 100 px default
  if (Array.isArray(o.p)) [f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft] = o.p;
  else if (typeof o.p === 'number') f.paddingTop = f.paddingRight = f.paddingBottom = f.paddingLeft = o.p;
  if (o.align) f.counterAxisAlignItems = o.align; if (o.justify) f.primaryAxisAlignItems = o.justify;
  return f; }
function put(parent, child, h = 'FILL', v) { if (!child) return child; parent.appendChild(child);
  if (h) child.layoutSizingHorizontal = h; if (v) child.layoutSizingVertical = v; return child; }
async function T(chars, styleName, colorVar, o = {}) {
  const t = figma.createText(); const key = _k('t', styleName);
  if (key) { const s = await _imp('s', key); await figma.loadFontAsync(s.fontName); await t.setTextStyleIdAsync(s.id); }
  else await figma.loadFontAsync(t.fontName);
  t.characters = String(chars); t.name = o.name || String(chars).slice(0, 40);
  if (colorVar) await fill(t, colorVar);
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize = 'HEIGHT'; }
  return t; }
// ── end SAP KIT RUNTIME ──

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
    n = o.d ? _createAutoLayout(o.d === 'H' ? 'HORIZONTAL' : 'VERTICAL') : figma.createFrame();
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

return await BUILD_TREE(TREE);
}
async function DUMP_GEOM(ROOT) {
const root = await figma.getNodeByIdAsync(ROOT);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
const R = root.absoluteBoundingBox;
const hex = p => p && p.type === 'SOLID' ? '#' + [p.color.r, p.color.g, p.color.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : (p ? p.type : '');
const vis = a => Array.isArray(a) ? a.filter(p => p.visible !== false) : [];
const deep = n => { for (let p = n.parent; p && p !== root; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const out = [];
for (const n of [root, ...root.findAll(n => n.visible)]) {
  if (deep(n) || !n.absoluteBoundingBox) continue;
  const b = n.absoluteBoundingBox, f = vis(n.fills), s = vis(n.strokes);
  let kind = '';                                  // an instance of a component SET = a UI control (look + size fixed by SAP); a single component = an icon
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); kind = m && m.parent && m.parent.type === 'COMPONENT_SET' ? 'control:' + m.parent.name : 'icon:' + (m ? m.name : ''); }
  out.push([n.id, n.type, n.name.slice(0, 30), Math.round(b.x - R.x), Math.round(b.y - R.y), Math.round(b.width), Math.round(b.height),
    typeof n.cornerRadius === 'number' ? n.cornerRadius : 'mix', s.length ? `${typeof n.strokeWeight === "number" ? n.strokeWeight : "mix"} ${hex(s[0])}` : '', f.length ? hex(f[0]) : '',
    n.layoutMode && n.layoutMode !== 'NONE' ? [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') : '',
    n.layoutMode && n.layoutMode !== 'NONE' ? n.itemSpacing : '', n.layoutMode || '', n.type === 'TEXT' ? n.characters.slice(0, 60) : kind, n.parent ? n.parent.id : '']);   // last column = parent id (structure.js)
}
return out;
}
async function DUMP_TREE(ROOT) {
const root = await figma.getNodeByIdAsync(ROOT);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent; await figma.setCurrentPageAsync(pg);
const tok = async ps => { if (!Array.isArray(ps) || !ps[0] || ps[0].visible === false) return ''; const id = ps[0].boundVariables && ps[0].boundVariables.color && ps[0].boundVariables.color.id;
  if (!id) return ps[0].type === 'IMAGE' ? 'IMAGE' : 'RAW'; const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name.split('/').pop() : ''; };
const inInst = n => { for (let p = n.parent; p && p !== root.parent; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const out = [];
for (const n of [root, ...root.findAll(() => true)]) {
  if (n.visible === false) continue;
  const ii = inInst(n);
  // kit internals: keep only text (presence check) and inner icon instances (icon check) —
  // frames/vectors/rects inside instances pushed real screens past the 20 KB reply cap
  if (ii && n.type !== 'TEXT' && n.type !== 'INSTANCE') continue;
  const base = { id: n.id, type: n.type, name: n.name, inInst: ii };
  if (n.type === 'TEXT') {
    if (ii) { out.push({ ...base, text: n.characters }); continue; }
    const st = typeof n.textStyleId === 'string' && n.textStyleId ? await figma.getStyleByIdAsync(n.textStyleId) : null;
    out.push({ ...base, text: n.characters, style: st ? st.name : '', fill: await tok(n.fills),
      font: n.fontName === figma.mixed ? [...new Set(n.getStyledTextSegments(['fontName']).map(g => g.fontName.family))].join('+') : n.fontName.family });
  } else if (n.type === 'INSTANCE') {
    const m = await n.getMainComponentAsync(), s = m && m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
    const p = {}; for (const [k, v] of Object.entries(n.componentProperties)) if (v.type === 'VARIANT') p[k] = v.value;
    out.push({ ...base, component: s ? s.name : '', props: p, h: Math.round(n.height) });
  } else if ('fills' in n) {
    const fill = await tok(n.fills), stroke = 'strokes' in n ? await tok(n.strokes) : '';
    if (fill || stroke) out.push({ ...base, image: fill === 'IMAGE', fill, stroke });
  }
}
return out;
}
// ── end GENERATED RUNTIME ──
// ── GENERATED MAKE CONVERTER (node build/plugin-bundle.js) — do not edit by hand ──
const MAKE_CONVERT = (function () {
// make-convert.js — PURE converter: a probed SAPUI5 Make app (build/templates/make-probe.browser.js) → a v5 layout tree.
// No fs / path / require: the same text runs in node (build/make2tree.js) and inside the SAP Bridge plugin (build/plugin-bundle.js).
// Deterministic, table-driven, NO model: UI5 controls become SAP Web UI Kit instances (props from the control's real state),
// flex layout becomes auto layout (gap / padding / FILL·HUG·FIXED from the live boxes), colours and text styles become SAP
// variables and styles by value match.
//   convert(D, KIT, MAP, EXTRA, name) → { tree, images: [{element, src}], post: {nav, shell}, warn: [string] }
function convert(D, KIT, MAP, EXTRA, nameArg) {
  const NAV = [], SHELL = {}, WARN = [], IMAGES = [], R = v => Math.round(v * 10) / 10, R5 = v => Math.round(v * 2) / 2;

  // ── control index ────────────────────────────────────────────────────────────────────────
  const by = {}, lay = {}, kids = {};
  D.controls.forEach(c => { by[c.id] = c; });
  D.controls.forEach(c => { if (c.cls === 'sap.m.FlexItemData' && by[c.parent]) lay[c.parent] = c.st; });
  const skip = new Set(MAP.skip_cls);
  const vparent = c => { let p = c.parent; while (p && by[p] && skip.has(by[p].cls)) p = by[p].parent; return p; };
  const off = c => c.box[0] > D.viewport[0] - 1 || c.box[0] + c.box[2] < 1 || /HiddenElement|InvisibleText/.test((c.css || []).join(' '));   // overflow clones sit far outside the page
  D.controls.forEach(c => { if (!skip.has(c.cls) && !off(c)) (kids[vparent(c)] = kids[vparent(c)] || []).push(c); });
  const ch = c => (kids[c.id] || []).filter(k => !(c.cls === 'sap.f.DynamicPageHeader' && MAP.skip_in_dynamic_header.includes(k.cls)));
  const grow = c => parseFloat((lay[c.id] || {}).grow) || 0;
  const px = v => { const m = /^(\d+(\.\d+)?)(px|rem)$/.exec(v || ''); return m ? parseFloat(m[1]) * (m[3] === 'rem' ? 16 : 1) : null; };

  // ── colours → SAP variables by VALUE and ROLE ────────────────────────────────────────────
  const KV = new Set(Object.keys(KIT.vars).map(n => n.split('/').pop()));
  const hexOf = v => { v = String(v || '').trim().toLowerCase(); let m = /^#([0-9a-f]{6})$/.exec(v); if (m) return '#' + m[1];
    m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v); if (m) return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    m = /^rgba?\(([^)]+)\)/.exec(v); if (m) { const p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < 1) return null; return '#' + p.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); } return null; };
  const VAL = {};
  for (const [n, v] of Object.entries(D.vars || {})) { if (!KV.has(n)) continue; const h = hexOf(v); if (h) (VAL[h] = VAL[h] || []).push(n); }
  const ROLE = { fill: /Background|BaseColor|ShellColor/, border: /Border|Separator|Selected/, ink: /(Color|Text)$/ };
  const PREF = { fill: MAP.fill_pref, border: MAP.border_pref, ink: MAP.ink_pref };
  const roleOk = (role, n) => ROLE[role].test(n) && (role !== 'ink' || !/Background|Border/.test(n));
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function tok(hex, role) {
    if (!hex) return undefined;
    if (role === 'ink' && hex === '#000000') hex = '#131e29';          // a control with no colour set inherits browser black; SAP's default ink is #131e29
    const c = (VAL[hex] || []).filter(n => roleOk(role, n));
    for (const p of PREF[role]) if (c.includes(p)) return p;
    if (c.length) return c[0];
    let best = null, bd = 1e9;
    for (const [h2, names] of Object.entries(VAL)) { const n = names.find(x => roleOk(role, x)); if (!n) continue; const a = rgb(hex), b = rgb(h2), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (d < bd) { bd = d; best = n; } }
    if (best && bd < 40) return best;
    WARN.push(`no SAP ${role} token for ${hex}`); return 'RAW#' + hex.slice(1);
  }

  // ── text style by size + weight ──────────────────────────────────────────────────────────
  const TS = Object.entries(KIT.text).map(([n, v]) => ({ n, size: parseFloat(String(v).split('|')[2]), bold: /Bold|Semibold/.test(n) })).filter(t => !isNaN(t.size) && /^(H\d|SmallText|MediumText|LargeText)\//.test(t.n));
  function style(c) {
    const t = c.tx || {}, fs = Math.round(t.fs || 14), bold = /Bold|Black/.test(t.ff || '') || t.fw >= 600;
    const pool = TS.filter(x => c.cls === 'sap.m.Title' ? /^H\d/.test(x.n) : /Text\//.test(x.n));
    let cand = pool.filter(x => x.size === fs && x.bold === bold);
    if (!cand.length) cand = pool.filter(x => x.size === fs);
    if (!cand.length) cand = pool.slice().sort((a, b) => Math.abs(a.size - fs) - Math.abs(b.size - fs)).filter(x => x.bold === bold);
    return (cand[0] || pool[0]).n;
  }
  const ICONS = new Set([...Object.keys(KIT.icons).map(k => k.split('/').pop()), ...Object.keys(EXTRA)]);
  function icon(src) {
    const raw = String(src || '').replace('sap-icon://', ''), n = MAP.icon_alias[raw] || raw;
    if (!ICONS.has(n)) { WARN.push(`icon "${raw}" is not in the SAP kit`); return null; }
    return n;
  }

  // ── node makers ──────────────────────────────────────────────────────────────────────────
  const CONTAINERS = new Set(['sap.f.DynamicPage', 'sap.f.DynamicPageTitle', 'sap.f.DynamicPageHeader', 'sap.tnt.ToolPage', 'sap.tnt.NavigationList', 'sap.m.IconTabHeader', 'sap.m.ScrollContainer', 'sap.m.Page', 'sap.m.Panel', 'sap.m.List', 'sap.m.OverflowToolbar', 'sap.m.Toolbar', 'sap.ui.layout.VerticalLayout', 'sap.ui.layout.HorizontalLayout']);
  const box = c => c.box.slice();
  const inst = (c, cp, pr, label, tx) => ({ _src: c.id, _b: cp === 'Switch' && KIT.components[cp] ? [c.box[0], c.box[1] + (c.box[3] - KIT.components[cp].h) / 2, KIT.components[cp].w, KIT.components[cp].h] : box(c), _k: 'inst', _grow: grow(c), _w: px(c.props.width), n: label || cp, k: 'i', cp, pr, w: (cp === 'Switch' || cp === 'Icon Button') && KIT.components[cp] ? KIT.components[cp].w : R(c.box[2]), h: (KIT.components[cp] && KIT.components[cp].h && cp !== 'Shell Bar' && cp !== 'Tab' && cp !== 'Navigation Item') ? KIT.components[cp].h : R(c.box[3]), _intr: (KIT.components[cp] || {}).h, ...(tx ? { tx } : {}) });
  function text(c, t) {
    const tx = c.tx || {}, fs = tx.fs || 14, wrap = c.box[3] > fs * 1.9;
    return { _src: c.id, _b: box(c), _k: 'text', _grow: grow(c), _wrap: wrap, _lineFix: !wrap, n: String(t).slice(0, 28), k: 't', t: String(t), w: R(c.box[2]), h: R(c.box[3]), st: style(c), bg: tok(hexOf(tx.fg), 'ink'), ...(wrap ? { wrap: 1 } : {}), ...(c.props.textAlign === 'Center' ? { ta: 'C' } : {}) };
  }
  function iconNode(name, c, w) { return name ? { _src: c.id, _b: box(c), _k: 'icon', _grow: 0, n: 'Icon ' + name, k: 'ic', ic: name, bg: tok(hexOf((c.tx || {}).fg || c.st.fg), 'ink'), w } : null; }
  const nameOf = c => c.css.includes('flyDateTile') ? 'Fare Tile' : c.css.includes('flyFlightRow') ? 'Flight Row' : c.css.includes('flyCardContent') ? 'Card Content'
    : { 'sap.m.VBox': 'Column', 'sap.m.HBox': 'Row', 'sap.m.FlexBox': 'Row', 'sap.f.DynamicPage': 'Dynamic Page', 'sap.f.DynamicPageTitle': 'Page Title', 'sap.f.DynamicPageHeader': 'Page Header', 'sap.f.Card': 'Card' }[c.cls] || c.cls.split('.').pop();

  function conv(c) { const n = conv0(c); if (n && typeof n === 'object' && !n._src) n._src = c.id; return n; }   // _src = the Make control a node came from (make-verify.js traces it)
  function conv0(c) {
    const p = c.props;
    switch (c.cls) {
      case 'sap.tnt.ToolHeader': return shell(c);
      case 'sap.tnt.SideNavigation': return sidenav(c);
      case 'sap.m.IconTabBar': return tabs(c);
      case 'sap.m.Button': case 'sap.m.ToggleButton': {
        const type = MAP.button_type[p.type || 'Default'] || 'Secondary', ic = p.icon ? icon(p.icon) : null;
        return p.text ? inst(c, 'Button', { Type: type, 'Form Factor': 'Compact', '✏️ Text': p.text, ...(ic ? { 'Icon Left': true, Icon: ic } : {}) }, 'Button ' + p.text)
          : inst(c, 'Icon Button', { Type: type === 'Primary' ? 'Primary' : type === 'Tertiary' ? 'Tertiary' : 'Secondary', 'Form Factor': 'Compact', ...(ic ? { Icon: ic } : {}) }, 'Icon Button ' + (ic || ''));
      }
      case 'sap.m.Input': return inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || '' }, 'Input ' + (p.value || '').slice(0, 24));
      case 'sap.m.MultiComboBox': return inst(c, 'Multi Combobox', { 'Form Factor': 'Compact', 'Drop-Down': 'False' }, 'Multi Combobox ' + (p.placeholder || ''), { 'Input Text': p.placeholder || '' });
      case 'sap.m.DateRangeSelection': case 'sap.m.DatePicker': return inst(c, 'Date (Range) Picker', { 'Form Factor': 'Compact', Calendar: false }, 'Date Picker ' + (p.placeholder || ''), { 'Input Text': p.placeholder || p.value || '' });
      case 'sap.m.SearchField': return inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || p.placeholder || '' }, 'Search ' + (p.placeholder || ''));
      case 'sap.m.CheckBox': return inst(c, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': p.text || '', Check: p.selected ? 'Checked' : 'Unchecked' }, 'Check Box ' + (p.text || ''));
      case 'sap.m.Switch': return inst(c, 'Switch', { 'Form Factor': 'Compact', Checked: p.state ? 'True' : 'False' }, 'Switch');
      case 'sap.m.Select': return inst(c, 'Select', { 'Form Factor': 'Compact' }, 'Select ' + (c.selText || ''), { 'Input Text': c.selText || '' });
      case 'sap.m.Link': return inst(c, 'Link', { Type: 'Regular', 'Icon Position': 'N/A', '✏️ Text': p.text || '' }, 'Link ' + (p.text || ''));
      case 'sap.m.Label': return inst(c, 'Label', { '✏️ Label': p.text || '' }, 'Label ' + (p.text || ''));
      case 'sap.m.ObjectNumber': return inst(c, 'Object Number', { Type: p.emphasized === false ? 'Regular' : 'Emphasized', Semantic: p.state && p.state !== 'None' ? p.state : 'None' }, 'Object Number ' + p.number, { '956.00 EUR': [p.number, p.unit].filter(Boolean).join(' ') });
      case 'sap.m.Avatar': {
        if (p.initials) return inst(c, 'Avatar', { Type: 'Initials', Size: p.displaySize || 'S', Color: MAP.avatar_color[p.backgroundColor] || '6', '✏️ Initials': p.initials }, 'Avatar ' + p.initials);
        const g = iconNode(icon(p.src), c, 24); return { _b: box(c), _k: 'frame', _grow: 0, n: 'Icon Tile', d: 'H', a: 'CC', w: R(c.box[2]), h: R(c.box[3]), c: g ? [{ ...g, s: 'XX', w: 24, h: 24 }] : [] };
      }
      case 'sap.m.Text': return text(c, p.text || '');
      case 'sap.m.Title': return text(c, p.text || '');
      case 'sap.ui.core.Icon': return iconNode(icon(p.src), c, px(p.size) || (parseFloat(p.size) * 16) || c.box[3]);
      case 'sap.m.Image': {
        const el = 'Logo ' + String(p.src || 'image').split('/').pop().replace(/\.[a-z]+$/, '').replace(/^(airline-)/, '');
        IMAGES.push({ element: el, src: p.src }); return { _b: box(c), _k: 'img', _grow: 0, n: el, w: R(c.box[2]), h: R(c.box[3]) };
      }
      case 'sap.f.cards.Header': return cardHeader(c);
      case 'sap.f.Card': return frame(c, 'Card', { border: true });
      case 'sap.m.VBox': case 'sap.m.HBox': case 'sap.m.FlexBox':
        if (!ch(c).length && grow(c) > 0) return { _b: box(c), _k: 'spacer', _grow: grow(c) };
        return frame(c, nameOf(c));
      case 'sap.ui.core.HTML': return htmlNode(c);
      case 'sap.m.Panel': {                                    // UI5 paints a Panel's white on its inner content area, not on the panel element the probe reads
        const n = frame(c, 'Panel'); if (!n.bg) n.bg = tok('#ffffff', 'fill'); return n;
      }
      case 'sap.f.DynamicPageTitle': {
        const all = ch(c), tb = all.find(k => k.cls === 'sap.m.OverflowToolbar');
        if (!tb) return frame(c, nameOf(c));
        const inTb = k => k !== tb && k.box[0] >= tb.box[0] - 1 && k.box[0] + k.box[2] <= tb.box[0] + tb.box[2] + 1 && k.box[1] >= tb.box[1] - 1 && k.box[1] + k.box[3] <= tb.box[1] + tb.box[3] + 1;
        const inside = all.filter(inTb), rest = all.filter(k => k !== tb && !inTb(k));
        const tbNode = layout({ _b: box(tb), _k: 'frame', _grow: 1, n: 'Actions', d: 'H' }, inside.map(conv).filter(Boolean), { V: false, st: { ai: 'center', jc: 'flex-end' }, flex: true });
        const node = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Page Title', d: 'H' }; if (c.st.bg) node.bg = tok(hexOf(c.st.bg), 'fill');
        return layout(node, [...rest.map(conv).filter(Boolean), tbNode], { V: false, st: { ai: 'center', jc: 'flex-start', pad: c.st.pad }, flex: true });
      }
      case 'sap.m.GenericTile': return tile(c);
      case 'sap.m.NumericContent': return numeric(c);
      case 'sap.m.ObjectStatus': {
        const t = text(c, p.text || '');                       // the kit has no positive/negative TEXT variable: state colour needs a kit Object Number, so the text stays sapTextColor
        if (p.state && p.state !== 'None') WARN.push(`Object Status "${p.text}" state ${p.state}: colour not available as a text variable — plain text colour`);
        return t;
      }
      case 'sap.ui.layout.DynamicSideContent': {              // side column (fixed) beside the main content (takes the free width)
        const kids = ch(c).map(conv).filter(Boolean);
        if (kids.length > 1) { kids[0]._w = kids[0]._b[2]; kids[kids.length - 1]._grow = 1; }
        return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Side Content Layout', d: 'H' }, kids, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
      }
      case 'sap.m.CustomListItem': {                           // its content row spans the whole item
        const kids = ch(c).map(conv).filter(Boolean); kids.forEach(k => { k._grow = 1; });
        const n = { _b: box(c), _k: 'frame', _grow: 0, n: 'List Item', d: 'H' }; if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
        return layout(n, kids, { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true });
      }
      default:
        if (!CONTAINERS.has(c.cls)) WARN.push(`control ${c.cls} is not mapped to a SAP kit component — plain frame`);
        return frame(c, nameOf(c));
    }
  }
  // ── composites ───────────────────────────────────────────────────────────────────────────
  function numeric(c) {                                       // NumericContent: big value + scale, drawn as one text in the H-style that matches its size
    const t = [c.props.value, c.props.scale].filter(Boolean).join(' ');
    if (!t) return null;
    const n = text({ ...c, cls: 'sap.m.Title', props: {}, tx: { ...(c.tx || {}), fg: '#131e29' } }, t);   // state colour (Good/Error) has no text variable in the kit
    if (c.props.valueColor && c.props.valueColor !== 'Neutral') WARN.push(`Numeric "${t}" ${c.props.valueColor}: colour not available as a text variable — plain text colour`);
    return n;
  }
  function tile(c) {                                          // GenericTile: card with header text + numeric value
    const title = ch(c).find(k => k.cls === 'sap.m.Text'), tc = ch(c).find(k => k.cls === 'sap.m.TileContent'), nc = tc && ch(tc).find(k => k.cls === 'sap.m.NumericContent');
    const kids = [title && text(title, title.props.text || ''), nc && numeric(nc)].filter(Boolean), st = c.st;
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Fare Tile', d: 'V', _sized: true, s: 'XX' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (st.br) n.r = Math.round(st.br);
    if (st.sh) n.fxk = KIT.effects['Shadow/sapContent_Shadow1'];
    return layout(n, kids, { V: true, st: {}, flex: false });
  }
  // ── raw HTML (sap.ui.core.HTML): UI5 gives only the markup string — read its text, flex direction, gap, padding, weight, size ─────
  const cssOf = st => { const o = {}; String(st || '').split(';').forEach(x => { const k = x.indexOf(':'); if (k > 0) o[x.slice(0, k).trim().toLowerCase()] = x.slice(k + 1).trim(); }); return o; };
  const cssPx = v => { if (!v) return null; const m = /^(-?[\d.]+)(px|rem)?$/.exec(v.trim()); if (m) return parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1); if (/sapFontSizeSmall/.test(v)) return 12; if (/sapFontSize/.test(v)) return 14; return null; };
  const cssPad = v => { const a = String(v || '0').trim().split(/\s+/).map(cssPx); const [t, r = t, b = t, l = r] = a; return [t, r, b, l].map(x => Math.round(x || 0)); };
  function htmlTree(src) {
    const root = { kids: [] }, stack = [root], re = /<(\/?)(div|span)([^>]*)>|([^<]+)/gi; let m;
    while ((m = re.exec(src))) {
      if (m[4] !== undefined) { const t = m[4].replace(/\s+/g, ' ').trim(); if (t) stack[stack.length - 1].kids.push({ text: t }); }
      else if (m[1]) { if (stack.length > 1) stack.pop(); }
      else { const el = { tag: m[2].toLowerCase(), css: cssOf((/style="([^"]*)"/.exec(m[3]) || [])[1]), kids: [] }; stack[stack.length - 1].kids.push(el); stack.push(el); }
    }
    return root;
  }
  function htmlText(el, inh) {
    const css = { ...inh, ...el.css }, t = el.kids.map(k => k.text !== undefined ? k.text : (k.css && /50%/.test(k.css['border-radius'] || '') ? '' : htmlText(k, css))).join(' ').replace(/\s+/g, ' ').trim();
    return t;
  }
  function htmlNode(c) {
    const src = String(c.props.content || ''), tree = htmlTree(src), tops = tree.kids.filter(k => k.tag);
    const box0 = { _b: box(c), _k: 'frame', _grow: grow(c), _sized: true };
    const inkFor = (css, hexFb) => { const v = /var\(--(\w+)/.exec(css.color || ''); if (v && KV.has(v[1]) && !/Background|Border/.test(v[1])) return v[1]; const h = hexOf(css.color) || hexOf(hexFb); const t = h ? tok(h, 'ink') : 'sapTextColor'; return /^RAW/.test(t) ? 'sapTextColor' : /Focus|Marker/.test(t) ? 'sapLinkColor' : t; };
    const leaf = (el, inh) => {
      const css = { ...inh, ...el.css }, t = htmlText(el, inh); if (!t) return null;
      const fs = Math.round(cssPx(css['font-size']) || 14), bold = /^(6|7|8|9)00$|bold/.test(css['font-weight'] || '');
      return { _k: 'text', n: t.slice(0, 28), k: 't', t, st: style({ cls: 'sap.m.Text', tx: { fs, fw: bold ? 700 : 400, ff: bold ? '72-Bold' : '72' } }), bg: inkFor(css, '#131e29'), w: Math.max(8, Math.round(t.length * fs * 0.56)), h: Math.round(fs * 1.4), s: 'HH' };
    };
    const build = (el, inh, top) => {
      const css = { ...inh, ...el.css }, sub = el.kids.filter(k => k.tag), own = el.css;
      if (!sub.length) return leaf(el, inh);
      const row = /flex/.test(own.display || '') && !/column/.test(own['flex-direction'] || '');
      const parts = el.kids.map(k => k.text !== undefined ? leaf({ css: {}, kids: [k] }, css) : (/50%/.test(k.css['border-radius'] || '') ? null : build(k, { 'font-size': css['font-size'], 'font-weight': css['font-weight'], color: css.color }, false))).filter(Boolean);
      if (!parts.length) return null;
      if (parts.length === 1 && !top) return parts[0];
      const gap = Math.round(cssPx((own.gap || '').split(' ')[0]) || (!row ? cssPx((sub[0].css || {})['margin-bottom']) || 0 : 0));
      const n = { _k: 'frame', n: top ? 'HTML' : (row ? 'Row' : 'Column'), d: row ? 'H' : 'V', a: row ? 'MC' : 'MM', c: parts, s: 'HH', w: parts.reduce((a, k) => a + (k.w || 0), 0), h: Math.max(...parts.map(k => k.h || 0)) };
      if (gap) n.g = gap;
      if (el.css.padding) { const pd = cssPad(el.css.padding); if (pd.some(x => x)) n.p = pd; }
      return n;
    };
    if (tops.length === 1 && htmlText(tops[0], {}) && (tops[0].kids.some(k => k.tag) || true)) {
      const n = build(tops[0], {}, true);
      if (n) {
        Object.assign(n, box0, { w: R(c.box[2]), h: R(c.box[3]), s: c.box[2] > 120 ? 'FX' : 'HX' });
        if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
        if (c.st.bw > 0) { n.bc = 'sapList_BorderColor'; n.bw = 1; } if (c.st.br) n.r = Math.round(c.st.br);
        const bl = /(\d+(?:\.\d+)?)px\s+solid\s+(#[0-9a-f]{3,8})/i.exec(tops[0].css['border-left'] || '');     // accent bar on the left edge
        if (bl) { const t = tok(hexOf(bl[2]), 'border'); if (t && !/^RAW/.test(t)) { n.bc = t; n.bw = [0, 0, 0, Math.round(parseFloat(bl[1]))]; } }
        if (n.d === 'V') n.a = 'MM';
        return n;
      }
    }
    // no readable text: a fixed-size frame that keeps the box (divider line, coloured bar)
    const thin = c.box[2] <= 2 || c.box[3] <= 2, n = { ...box0, n: thin ? 'Divider' : 'HTML', d: 'V', w: R(c.box[2]), h: R(c.box[3]), s: c.box[2] > 120 ? 'FX' : 'XX' };
    if (c.st.bg) n.bg = tok(hexOf(c.st.bg), thin ? 'border' : 'fill'); return n;
  }
  function shell(c) {
    const htmlTitle = ch(c).filter(k => k.cls === 'sap.ui.core.HTML').map(k => htmlText(htmlTree(String(k.props.content || '')), {})).find(Boolean);
    const title = (ch(c).find(k => k.cls === 'sap.m.Title') || { props: {} }).props.text || htmlTitle || '';
    const menu = ch(c).some(k => k.cls === 'sap.m.Button' && /menu/.test(k.props.icon || ''));
    Object.assign(SHELL, { title, initials: ((ch(c).find(k => k.cls === 'sap.m.Avatar') || { props: {} }).props.initials) || '' });
    return Object.assign(inst(c, 'Shell Bar', { ...(menu ? { Hamburger: 'True' } : {}), 'Shell Search': ch(c).some(k => k.cls === 'sap.m.SearchField'), Help: false, Overflow: false }, 'Shell Bar', { Text: title }), { av: SHELL.initials });
  }
  function sidenav(c) {
    const list = ch(c).find(k => k.cls === 'sap.tnt.NavigationList') || c, items = ch(list).filter(k => k.cls === 'sap.tnt.NavigationListItem');
    const n = inst(c, 'Side Navigation', { Type: 'Expanded', 'Form Factor': 'Compact' }, 'Side Navigation');
    n.nav = items.map((it, i) => ({ text: it.props.text || '', icon: icon(it.props.icon), selected: !!(it.props.selected || (it.aria && it.aria.sel === 'true')) || (i === 0 && !items.some(k => k.props.selected)) }));
    NAV.push(...items.map((it, i) => ({ text: it.props.text || '', icon: icon(it.props.icon), selected: !!(it.props.selected || (it.aria && it.aria.sel === 'true')) || (i === 0 && !items.some(k => k.props.selected)) })));
    return n;
  }
  function tabs(c) {
    const hdr = D.controls.find(k => k.cls === 'sap.m.IconTabHeader' && k.parent === c.id) || { props: {}, st: c.st }, sk = hdr.props.selectedKey;
    const nodes = ch(c).filter(k => k.cls === 'sap.m.IconTabFilter').map(t => ({ ...inst(t, 'Tab', { Type: 'Inline', 'Interaction State': t.props.key === sk ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': t.props.text || '' }, 'Tab ' + t.props.text), _w: null }));
    const content = ch(c).filter(k => k.cls !== 'sap.m.IconTabFilter' && k.cls !== 'sap.m.IconTabHeader' && k.cls !== 'sap.m.IconTabFilterExpandButtonBadge');
    const hdrNode = layout({ _b: (hdr.box && c.box[3] - hdr.box[3] > 8 ? hdr.box : box(c)).slice(), _k: 'frame', n: 'Icon Tab Bar', d: 'H', bg: tok(hexOf((hdr.st && hdr.st.bg) || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
    if (hdrNode.p && hdrNode.p[1] > 200) hdrNode.p[1] = 0;          // tabs sit at the start; the free width to the right is not padding
    if (!content.length) return hdrNode;                          // a tab bar that also holds the tab content (cards, lists…): headers on top, content below
    return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Icon Tab Bar', d: 'V' }, [hdrNode, ...content.map(conv).filter(Boolean)], { V: true, st: {}, flex: false });
  }
  function cardHeader(c) {
    const av = ch(c).find(k => k.cls === 'sap.m.Avatar'), tx = ch(c).find(k => k.cls === 'sap.m.Text'), out = [];
    if (av) out.push(conv(av)); if (tx) out.push(text(tx, tx.props.text || ''));
    return layout({ _b: box(c), _k: 'frame', n: 'Card Header', d: 'H' }, out.filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
  }
  function frame(c, name, o = {}) {
    const st = c.st, flex = /flex/.test(st.display), V = flex ? /column/.test(st.dir) : true;
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), _w: /px$/.test(c.props.width || '') ? px(c.props.width) : null, _wfill: c.props.width === '100%', n: name, d: V ? 'V' : 'H' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (o.border || st.bw > 0) { n.bc = tok(hexOf(st.bc), 'border') || 'sapTile_BorderColor'; n.bw = st.bw > 0 ? st.bw : 1; }
    if (st.br) n.r = Math.round(st.br);
    if (c.cls === 'sap.f.Card' && st.sh) { n.fxk = KIT.effects['Shadow/sapContent_Shadow1']; delete n.bc; delete n.bw; }   // Make draws a card with a shadow, not a border
    const kids = ch(c).map(conv).filter(Boolean);
    const lineGroups = list => { const lines = []; let bottom = -1e9; for (const k of list) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } } return lines; };
    if (!flex && kids.length > 1) {                                        // not flexbox (table / grid / float / inline flow): read the direction from where the children really are
      const lines = lineGroups(kids);
      if (lines.length === 1) {                                            // side by side → a row; a row that spans the container shares its width (grid columns)
        const total = kids.reduce((a, k) => a + k._b[2], 0), spans = total > 0.6 * c.box[2];
        if (spans) kids.forEach(k => { if (k._k === 'frame' && !k._w && !k._grow) k._grow = 1; });
        n.d = 'H'; return layout(n, kids, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
      }
      if (lines.some(l => l.length > 1)) {                                 // several lines → a column of line rows
        n.d = 'V';
        return layout(n, lines.map(ln => ln.length === 1 ? ln[0] : layout({ _b: union(ln), _k: 'frame', n: 'Row', d: 'H' }, ln, { V: false, st: { ai: 'flex-start' }, flex: true })), { V: true, st: {}, flex: false });
      }
    }
    if (flex && !V && /wrap/.test(st.wrap) && kids.length > 1) {          // a wrapped row that broke into several lines → a column of line rows
      const lines = []; let bottom = -1e9;
      for (const k of kids) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } }
      if (lines.length > 1) {
        n.d = 'V';
        const rows = lines.map(ln => {
          if (ln.length === 1) return ln[0];
          const row = layout({ _b: union(ln), _k: 'frame', n: 'Row', d: 'H' }, ln, { V: false, st: { ai: 'flex-start' }, flex: true });
          if (!row.c.some(k => /^F/.test(k.s || ''))) row.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // one part of the row must flex
          return row;
        });
        return layout(n, rows, { V: true, st: {}, flex: false });
      }
    }
    const out = layout(n, kids, { V, st, flex });
    if (flex && !V && /wrap/.test(st.wrap) && out.c.some(k => k.n === 'Fare Tile') && !out.c.some(k => /^F/.test(k.s || '')))
      out.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // a row of fixed tiles needs one flexible part
    return out;
  }

  // ── auto layout: order, gap, padding, alignment, sizing letters ──────────────────────────
  const union = ks => { const x0 = Math.min(...ks.map(k => k._b[0])), y0 = Math.min(...ks.map(k => k._b[1])), x1 = Math.max(...ks.map(k => k._b[0] + k._b[2])), y1 = Math.max(...ks.map(k => k._b[1] + k._b[3])); return [x0, y0, x1 - x0, y1 - y0]; };
  function layout(node, list, o) {
    const V = o.V, b = node._b, st = o.st || {}, flex = o.flex;
    const ai = flex ? st.ai || '' : '', jc = flex ? st.jc || '' : '';
    const counter = /center/.test(ai) ? 'C' : /end/.test(ai) ? 'X' : 'M';
    let primary = /space-between/.test(jc) ? 'S' : /center/.test(jc) ? 'C' : /end/.test(jc) ? 'X' : 'M';
    let ks = list.slice();
    if (ks.some(k => k._k === 'spacer')) {                    // flexible spacers → space-between over the groups between them
      const segs = [[]]; for (const k of ks) { if (k._k === 'spacer') segs.push([]); else segs[segs.length - 1].push(k); }
      ks = segs.filter(s => s.length).map((s, i) => s.length === 1 ? s[0] : layout({ _b: union(s), _k: 'frame', n: i === 0 ? 'Leading Content' : 'Trailing Content', d: V ? 'V' : 'H' }, s, { V, st: { ai: 'center' }, flex: true }));
      (ks.length >= 3 ? ks.slice(1, -1) : ks.slice(0, 1)).forEach(k => { k._flexSeg = true; });   // the part between the spacers takes the free space
    }
    const mi = V ? 1 : 0, me = V ? 3 : 2, ci = V ? 0 : 1, ce = V ? 2 : 3;
    const gs = []; for (let i = 1; i < ks.length; i++) gs.push(ks[i]._b[mi] - (ks[i - 1]._b[mi] + ks[i - 1]._b[me]));
    const gap = primary === 'S' || !gs.length ? 0 : Math.max(0, R(Math.min(...gs)));
    if (primary !== 'S') ks = ks.map((k, i) => { const e = i > 0 ? gs[i - 1] - gap : 0; return e > 0.6 ? lead(k, e, V) : k; });
    let p = [0, 0, 0, 0];
    if (ks.length) {
      const f = ks[0]._b, l = ks[ks.length - 1]._b, ms = f[mi] - b[mi], mEnd = b[mi] + b[me] - (l[mi] + l[me]);
      const cs = Math.min(...ks.map(k => k._b[ci])) - b[ci], cEnd = b[ci] + b[ce] - Math.max(...ks.map(k => k._b[ci] + k._b[ce]));
      const css = st.pad || [0, 0, 0, 0], useMain = primary === 'M' || primary === 'S';
      const mS = useMain ? Math.max(0, R5(ms)) : 0, mE = useMain ? Math.max(0, R5(mEnd)) : 0;
      const sym = Math.max(0, R5(Math.min(cs, cEnd))), cS = counter === 'M' ? Math.max(0, R5(cs)) : counter === 'C' ? sym : (V ? css[3] : css[0]), cE = counter === 'M' ? Math.max(0, R5(cEnd)) : counter === 'C' ? sym : (V ? css[1] : css[2]);
      p = V ? [mS, cE, mE, cS] : [cS, mE, cE, mS];
    }
    ks = ks.map(k => crossOffset(k, node, p, V, counter));
    const inner = [b[2] - p[1] - p[3], b[3] - p[0] - p[2]];
    if (ks.some(k => k._k === 'inst' && k._intr && k._intr < k._b[3] - 1)) node._fixH = true;
    if (!V && ks.length) {                                   // the last column of a row that reaches the row's end and holds wrapping text takes the free width
      const l = ks[ks.length - 1], endGap = b[0] + b[2] - p[1] - (l._b[0] + l._b[2]);
      if (l._k === 'frame' && !l._grow && !l._w && Math.abs(endGap) < 1.5 && (l.c || []).some(x => x._k === 'text' && x._wrap)) l._grow = 1;
    }
    ks.forEach(k => { if (!k._sized) k.s = letters(k, V, inner, counter); });
    Object.assign(node, { w: R(b[2]), h: R(b[3]), ...(gap ? { g: gap } : {}), ...(p.some(x => x) ? { p } : {}), a: primary + counter, c: ks });
    return node;
  }
  const lead = (k, e, V) => ({ _b: [k._b[0] - (V ? 0 : e), k._b[1] - (V ? e : 0), k._b[2] + (V ? 0 : e), k._b[3] + (V ? e : 0)], _k: 'frame', _grow: k._grow, n: 'Item', d: V ? 'V' : 'H', p: V ? [R5(e), 0, 0, 0] : [0, 0, 0, R5(e)], a: 'MM', w: R(k._b[2] + (V ? 0 : e)), h: R(k._b[3] + (V ? e : 0)), c: [Object.assign(k, { s: (() => { const L = letters(k, V, [k._b[2], k._b[3]], 'M'); return V ? L[0] + (L[1] === 'X' ? 'X' : 'H') : (L[0] === 'X' ? 'X' : 'H') + L[1]; })() })], _wrapped: true, _lead: true });
  function crossOffset(k, parent, p, V, counter) {        // a child that starts inside the parent's padding box keeps its start/end offsets
    if (counter === 'M' && k._lead) {                       // a gap wrapper already exists: fold the side offsets into its padding
      const bb = parent._b, cj = V ? 0 : 1, cw = V ? 2 : 3, st0 = bb[cj] + (V ? p[3] : p[0]), en0 = bb[cj] + bb[cw] - (V ? p[1] : p[2]);
      const o1 = k._b[cj] - st0, r1 = en0 - (k._b[cj] + k._b[cw]);
      if (o1 > 0.6) { const e1 = R5(o1), r2 = r1 > 0.6 ? R5(r1) : 0; if (V) { k.p[3] += e1; k.p[1] += r2; k._b = [k._b[0] - e1, k._b[1], k._b[2] + e1 + r2, k._b[3]]; k.w = R(k._b[2]); } else { k.p[0] += e1; k.p[2] += r2; k._b = [k._b[0], k._b[1] - e1, k._b[2], k._b[3] + e1 + r2]; k.h = R(k._b[3]); } }
      return k;
    }
    if (counter !== 'M' || k._wrapped) return k;
    const b = parent._b, ci = V ? 0 : 1, ce = V ? 2 : 3, start = b[ci] + (V ? p[3] : p[0]), end = b[ci] + b[ce] - (V ? p[1] : p[2]);
    const off = k._b[ci] - start, right = end - (k._b[ci] + k._b[ce]); if (off <= 0.6) return k;
    const e = R5(off), r = right > 0.6 ? R5(right) : 0, ext = k._b[ce] + e + r;
    const nb = V ? [k._b[0] - e, k._b[1], ext, k._b[3]] : [k._b[0], k._b[1] - e, k._b[2], ext];
    k.s = letters(k, V, [k._b[2], k._b[3]], 'M'); k._sized = true;
    return { _b: nb, _k: 'frame', _grow: k._grow, n: 'Item', d: V ? 'V' : 'H', p: V ? [0, r, 0, e] : [e, 0, r, 0], a: 'MM', w: R(nb[2]), h: R(nb[3]), c: [k], _wrapped: true };
  }
  function letters(k, V, inner, counter) {
    const L = [];
    for (const i of [0, 1]) {
      if (i === 0 && k._wfill) { L.push('F'); continue; }          // width 100% in Make = fills the parent
      const main = (V ? 1 : 0) === i, ext = k._b[i === 0 ? 2 : 3], spans = Math.abs(ext - inner[i]) <= 1.5, g = k._grow > 0;
      let l;
      if (k.cp === 'Switch' || k.cp === 'Icon Button' || k.n === 'Icon Tile') l = 'X';
      else if (k._flexSeg && main) l = 'F';
      else if (k._k === 'text') l = i === 1 ? (k._lineFix ? 'X' : 'H') : k._wrap ? ((main && g) || (!main && spans) ? 'F' : 'X') : 'H';
      else if (k._k === 'inst' || k._k === 'icon' || k._k === 'img') l = i === 1 ? 'X' : (i === 0 && k._w ? 'X' : ((main && g) || (!main && spans) ? 'F' : 'X'));
      else if (i === 0 && k._w) l = 'X';
      else if (i === 1 && k._fixH) l = 'X';
      else l = main ? (g ? 'F' : 'H') : (spans && (i === 0 || counter === 'M') ? 'F' : 'H');
      L.push(l);
    }
    return L.join('');
  }

  // ── root: ToolPage → Shell Bar + [Side Navigation | Dynamic Page] ────────────────────────
  // the probe can name a wrong root (a hidden text at 0,0): use the ToolPage, else the largest control without a parent
  const root = (by[D.root] && by[D.root].cls === 'sap.tnt.ToolPage' && by[D.root]) || D.controls.find(c => c.cls === 'sap.tnt.ToolPage') ||
    D.controls.filter(c => !by[c.parent]).sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3])[0] || by[D.root], rk = ch(root), find = cls => rk.find(k => k.cls === cls);
  const header = find('sap.tnt.ToolHeader'), side = find('sap.tnt.SideNavigation'), page = find('sap.f.DynamicPage');
  if (root.cls !== 'sap.tnt.ToolPage' || !header || !page) WARN.push('root is not a ToolPage(header, page) — generic layout used');
  const W = D.viewport[0], H = D.viewport[1], hh = header ? header.box[3] : 0;
  const body = layout({ _b: [0, hh, W, H - hh], _k: 'frame', n: 'Body', d: 'H' }, [side && conv(side), page && conv(page)].filter(Boolean), { V: false, st: {}, flex: false });
  const rootNode = layout({ _b: [0, 0, W, H], _k: 'frame', n: nameArg || D.title || 'Make screen', d: 'V', bg: tok(hexOf(root.st.bg), 'fill') || 'sapBackgroundColor', clip: 1 }, [header && conv(header), body].filter(Boolean), { V: true, st: {}, flex: false });
  rootNode.sz = 'x'; delete rootNode.s; body.s = 'FF';
  if (rootNode.c[0] && rootNode.c[0].cp === 'Shell Bar') rootNode.c[0].s = 'FX';
  const sn = body.c.find(k => k.n === 'Side Navigation'); if (sn) { sn.s = 'XF'; sn.w = 256; }
  if (page) body.c[body.c.length - 1].s = 'FF';
  // trace: for every node that came from a Make control, its index path in the tree and the Make box it must land on (build/make-verify.js)
  const TRACE = [];
  (function walk(n, path) { if (n._src) TRACE.push({ p: path, id: n._src, b: n._b, k: n._k, ta: n.ta }); (n.c || []).forEach((k, i) => walk(k, path.concat(i))); })(rootNode, []);
  const tree = JSON.parse(JSON.stringify(rootNode, (k, v) => (k[0] === '_' || v === undefined) ? undefined : v));
  return { tree, images: IMAGES, post: { nav: NAV, shell: SHELL }, warn: [...new Set(WARN)], controls: D.controls.length, trace: TRACE };
}

return convert;
})();
const MAKE_MAP = {"_doc":"UI5 control -> SAP Web UI Kit mapping data for build/make2tree.js. Logic lives in make2tree.js; names here are checked against knowledge/live/kit.json by build/door.js.","skip_cls":["sap.m.FlexItemData","sap.m.IconTabFilterExpandButtonBadge","sap.m.IconTabHeader","sap.m.ToolbarSpacer"],"skip_in_dynamic_header":["sap.m.Button","sap.m.ToggleButton"],"icon_alias":{"menu2":"menu","flight":"flight","customer":"group","map":"globe","appointment":"calendar","employee":"group","person-placeholder":"group","pushpin-off":"flag"},"button_type":{"Emphasized":"Primary","Default":"Secondary","Transparent":"Tertiary","Accept":"Accept","Reject":"Reject","Attention":"Attention","Ghost":"Secondary","Neutral":"Secondary","Up":"Secondary","Back":"Tertiary"},"avatar_color":{"Accent1":"1","Accent2":"2","Accent3":"3","Accent4":"4","Accent5":"5","Accent6":"6","Accent7":"7","Accent8":"8","Accent9":"9","Accent10":"10","Transparent":"Transparent","Placeholder":"Placeholder"},"fill_pref":["sapBackgroundColor","sapBaseColor","sapShell_Background","sapList_Background","sapTile_Background","sapPageHeader_Background","sapGroup_ContentBackground","sapObjectHeader_Background","sapList_SelectionBackgroundColor"],"border_pref":["sapList_BorderColor","sapTile_BorderColor","sapGroup_ContentBorderColor","sapPageHeader_BorderColor","sapContent_Selected_ForegroundColor","sapSelectedColor"],"ink_pref":["sapTextColor","sapContent_LabelColor","sapLinkColor","sapPositiveTextColor","sapNegativeTextColor","sapCriticalTextColor","sapTitleColor","sapContent_IconColor","sapContent_NonInteractiveIconColor"]};
const MAKE_EXTRA = {"suitcase":{"key":"aab233a77becbdfc986a734c5451f5b976638855","desc":"travel, suitcase, business trip, possessions"},"meal":{"key":"52c9186b136b0ff70196b57dd6cf5f0e17e848bf","desc":"meal, knife and fork, dinner, lunch"},"share-arrow":{"key":"f186ab5dabe94fbbf9b8427f9fd41edddf104e2c","desc":"share, reshare, distribute, arrow (SAP 'share')"},"share-2":{"key":"3e32bfc37d0c6c148ea9919015d02a7acf91d58c","desc":"share, distribute, share with connections"},"tag":{"key":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","desc":"tag, label, marker, indicator"},"flight":{"key":"65ca2deb9dd0c4f7734d2269e7958fbe62b4a462","desc":"plane, trip, travel, flight"},"paper-plane":{"key":"1af59a706bee8811d9439901ec3d4f54f118185a","desc":"send, paper plane"},"receipt":{"key":"28664297b6ba462b297b4487f2fa5884d53a3a08","desc":"bill, receipt, proof of sale"},"travel-expense":{"key":"00af06f46dafee9ba85ce133c4ce34d449eaee25","desc":"plane + money: trip expense, fee"},"travel-itinerary":{"key":"303136e86aedf4da03db63f869e9a9262c9a89d7","desc":"itinerary, schedule, flight, drive"},"pushpin-on":{"key":"a103a0ee9c45c6b54d5f799e82b1842236f2c79e","desc":"pin, pinned, keep on top (read live from gold 270:6722)"},"direction-arrows":{"key":"d8df6bd3e7657212a65f733f39878d4e0a37cc2e","desc":"two-way arrows, range handle (read live from gold 270:6722)"},"media-forward":{"key":"b200c671f28c62c7e4ead976aa02b5875f77d5fa","desc":"forward, media, fast — SAP has no lightning bolt: use for \"fastest\""},"thumb-up":{"key":"5302ae09353d82f5221906eb454886085d60b9c3","desc":"thumbs, up, like, recommended, best"}};
const MAKE_KIT = {"vars":{"Accent/sapAccentBackgroundColor1":1,"Accent/sapAccentBackgroundColor10":1,"Accent/sapAccentBackgroundColor2":1,"Accent/sapAccentColor1":1,"Accent/sapAccentColor5":1,"Application/sapBackgroundColor":1,"Application/sapPageFooter_Background":1,"Application/sapPageFooter_BorderColor":1,"Application/sapPageHeader_Background":1,"Application/sapPageHeader_BorderColor":1,"Container/Spacing/Large":1,"Container/Spacing/Medium":1,"Container/Spacing/Small":1,"Container/Spacing/Tiny":1,"Container/Spacing/Zero":1,"Container/Spacing/sapContent_Gap":1,"Container/Spacing/sapContent_Margin_Small":1,"Container/Spacing/sapContent_Padding_L":1,"Container/Spacing/sapContent_Padding_M":1,"Container/Spacing/sapContent_Padding_S":1,"Container/Spacing/sapContent_Padding_XL":1,"Container/Spacing/sapContent_Space_L":1,"Container/Spacing/sapContent_Space_M":1,"Container/Spacing/sapContent_Space_S":1,"Container/Spacing/sapContent_Space_Tiny":1,"Container/Spacing/sapContent_Space_XL":1,"Container/Spacing/sapShell_Gap_L":1,"Container/Spacing/sapShell_Gap_M":1,"Container/Spacing/sapShell_Gap_S":1,"Container/Spacing/sapShell_GroupGap_L":1,"Container/Spacing/sapShell_GroupGap_M":1,"Container/Spacing/sapShell_GroupGap_S":1,"Container/Spacing/sapShell_Space_L":1,"Container/Spacing/sapShell_Space_M":1,"Container/Spacing/sapShell_Space_S":1,"Container/sapBlockLayer_Background":1,"Container/sapBlockLayer_Opacity":1,"Container/sapContent_DisabledOpacity":1,"Container/sapElement_BorderCornerRadius":1,"Container/sapElement_Compact_Height":1,"Container/sapElement_Height":1,"Container/sapGroup_BorderCornerRadius":1,"Container/sapGroup_ContentAlternatingBackground":1,"Container/sapGroup_ContentBackground":1,"Container/sapGroup_ContentBorderColor":1,"Container/sapGroup_TitleBackground":1,"Container/sapGroup_TitleBorderColor":1,"Container/sapGroup_TitleTextColor":1,"Container/sapPopover_BorderCornerRadius":1,"Focus/sapContent_ContrastFocusColor":1,"Focus/sapContent_FocusColor":1,"Focus/sapContent_FocusWidth":1,"Font/Family/sapFontFamily":1,"Font/Size/sapFontHeader1Size":1,"Font/Size/sapFontHeader2Size":1,"Font/Size/sapFontHeader3Size":1,"Font/Size/sapFontHeader4Size":1,"Font/Size/sapFontHeader5Size":1,"Font/Size/sapFontHeader6Size":1,"Font/Size/sapFontLargeSize":1,"Font/Size/sapFontSize":1,"Font/Size/sapFontSmallSize":1,"Font/Weight/sapFontBoldFamily":1,"Font/Weight/sapFontFamily":1,"Font/Weight/sapFontHeaderFamily":1,"Font/Weight/sapFontSemiboldFamily":1,"Icon/sapContent_IconColor":1,"Icon/sapContent_IconHeight":1,"Icon/sapContent_NonInteractiveIconColor":1,"Indication/sapIndicationColor_1_Background":1,"Indication/sapIndicationColor_1_TextColor":1,"Indication/sapIndicationColor_4_Background":1,"Indication/sapIndicationColor_5_Background":1,"Input/Invalid/sapField_InvalidColor":1,"Input/Readonly/sapField_ReadOnly_Background":1,"Input/Standard/sapField_Active_BorderColor":1,"Input/Standard/sapField_Background":1,"Input/Standard/sapField_BorderColor":1,"Input/Standard/sapField_Focus_BorderColor":1,"Input/Standard/sapField_Hover_BorderColor":1,"Input/Standard/sapField_PlaceholderTextColor":1,"Input/Standard/sapField_RequiredColor":1,"Input/Standard/sapField_TextColor":1,"Input/Success/sapField_SuccessColor":1,"Input/Warning/sapField_WarningColor":1,"Input/sapField_BorderCornerRadius":1,"Interaction/sapActiveColor":1,"Interaction/sapContent_Selected_Background":1,"Interaction/sapContent_Selected_TextColor":1,"Interaction/sapHoverColor":1,"Interaction/sapSelectedColor":1,"Link/sapLinkColor":1,"List/sapList_Active_Background":1,"List/sapList_AlternatingBackground":1,"List/sapList_Background":1,"List/sapList_BorderColor":1,"List/sapList_FooterBackground":1,"List/sapList_GroupHeaderBackground":1,"List/sapList_GroupHeaderBorderColor":1,"List/sapList_HeaderBackground":1,"List/sapList_HeaderBorderColor":1,"List/sapList_HeaderTextColor":1,"Text/TextShadow_Spread_2-4":1,"Text/TextShadow_X_1":1,"Text/TextShadow_X_2":1,"Text/TextShadow_X_3":1,"Text/TextShadow_X_4":1,"Text/TextShadow_Y_1":1,"Text/TextShadow_Y_2":1,"Text/TextShadow_Y_3":1,"Text/TextShadow_Y_4":1,"Text/sapContent_ContrastTextColor":1,"Text/sapContent_ContrastTextShadowColor":1,"Text/sapContent_DisabledTextColor":1,"Text/sapContent_ForegroundTextColor":1,"Text/sapContent_LabelColor":1,"Text/sapContent_MarkerTextColor":1,"Text/sapContent_TextShadowColor":1,"Text/sapContent_TextShadowColor_2-4":1,"Text/sapTextColor":1,"Text/sapTitleColor":1,"Tile/sapTile_Active_Background":1,"Tile/sapTile_Active_ContentBackground":1,"Tile/sapTile_Background":1,"Tile/sapTile_BorderColor":1,"Tile/sapTile_BorderCornerRadius":1,"Tile/sapTile_Hover_Background":1,"Tile/sapTile_Hover_ContentBackground":1,"Tile/sapTile_IconColor":1,"Tile/sapTile_Interactive_BorderColor":1,"Tile/sapTile_OverlayBackground":1,"Tile/sapTile_OverlayForegroundColor":1,"Tile/sapTile_SeparatorColor":1,"Tile/sapTile_TextColor":1,"Tile/sapTile_TitleTextColor":1,"Toolbar/sapInfobar_Active_Background":1,"Toolbar/sapInfobar_Background":1,"Toolbar/sapInfobar_Hover_Background":1,"Toolbar/sapInfobar_NonInteractive_Background":1,"Toolbar/sapInfobar_TextColor":1,"Toolbar/sapToolbar_Background":1,"Toolbar/sapToolbar_SeparatorColor":1},"text":{"SmallText/LHAuto/Regular":"||12","SmallText/LHAuto/Bold":"||12","MediumText/LHAuto/Regular":"||14","MediumText/LHAuto/Bold":"||14","MediumText/LHAuto/Semibold":"||14","LargeText/LHAuto/Regular":"||16","LargeText/LHAuto/Bold":"||16","LargeText/LHAuto/Semibold":"||16","H6/Regular":"||14","H6/Bold":"||14","H5/Regular":"||16","H5/Bold":"||16","H4/Regular":"||20","H4/Bold":"||20","H3/Regular":"||24","H3/Bold":"||24","H2/Regular":"||32","H2/Bold":"||32","H1/Regular":"||48","H1/Bold":"||48","Main Header/sapObjectHeader_Title_FontSize":"||24","Title of Components/sapGroup_TitleFontSize":"||16","Button/Emphasized/sapButton_Emphasized_FontWeight":"||14","Tab/SmallTabText":"||12","Tab/MediumTabText":"||14"},"icons":{"accept":1,"activate":1,"add":1,"attachment":1,"bell":1,"calendar":1,"collapse":1,"complete":1,"copy":1,"decline":1,"delete":1,"document":1,"download":1,"duplicate":1,"edit":1,"error":1,"excel-attachment":1,"exit-full-screen":1,"expand":1,"favorite":1,"filter":1,"flag":1,"folder":1,"full-screen":1,"globe":1,"grid":1,"group":1,"home":1,"in-progress":1,"information":1,"less":1,"list":1,"menu":1,"multi-select":1,"multiselect-all":1,"navigation-down-arrow":1,"navigation-left-arrow":1,"navigation-right-arrow":1,"navigation-up-arrow":1,"overflow":1,"pdf-attachment":1,"pending":1,"print":1,"question-mark":1,"refresh":1,"search":1,"settings":1,"share":1,"slim-arrow-down":1,"slim-arrow-left":1,"slim-arrow-right":1,"slim-arrow-up":1,"sort":1,"sort-ascending":1,"sort-descending":1,"sys-cancel":1,"sys-enter-2":1,"sys-help":1,"table-view":1,"upload":1,"warning":1},"components":{"Avatar Badge":{"w":28,"h":28},"Avatar Group":{"w":520,"h":112},"Avatar":{"w":112,"h":112},"Footer":{"w":320,"h":40},"Header":{"w":320,"h":40},"Breadcrumb":{"w":255,"h":16},"Busy Indicator Dot":{"w":4,"h":4},"Busy Indicator":{"w":24,"h":8},"Animated Busy Indicator":{"w":28,"h":8},"Button Badge":{"w":24,"h":16},"Segmented Button":{"w":228,"h":26},"Segmented Button Singular":{"w":57,"h":26},"Icon Split Button":{"w":64,"h":26},"Split Button":{"w":93,"h":26},"Icon Menu Button":{"w":54,"h":26},"Menu Button":{"w":83,"h":26},"Icon Button":{"w":32,"h":26},"Button":{"w":61,"h":26},"Legend":{"w":120,"h":336},"Mixed Calendar Button":{"w":66,"h":36},"Calendar Date Types":{"w":32,"h":32},"Legend Item":{"w":43,"h":24},"Two-Month Calendar":{"w":544,"h":272},"Calendar":{"w":272,"h":272},"Banner":{"w":1407,"h":335},"Card Timestamp and Counter":{"w":80,"h":26},"Card Badge":{"w":37,"h":16},"Card Footer":{"w":320,"h":54},"Card Numeric Header":{"w":294,"h":76},"Card Extended Header":{"w":320,"h":62},"Card Main Header":{"w":320,"h":80},"Card Media Block":{"w":320,"h":170},"Card":{"w":320,"h":112},"Page Indicator Dots":{"w":16,"h":8},"On Content Page Indicator":{"w":248,"h":56},"Page Indicator":{"w":322,"h":56},"Carousel":{"w":322,"h":321},"Check Box":{"w":16,"h":16},"Swatch":{"w":20,"h":20},"Color Palette":{"w":156,"h":183},"Color Picker Color Mode Panel":{"w":258,"h":48},"Color Picker Comparison Color Fields":{"w":53,"h":26},"Color Picker Slider":{"w":258,"h":20},"Color Picker":{"w":290,"h":458},"Date (Range) Picker":{"w":272,"h":26},"Date Time Dropdown":{"w":585,"h":378},"Date Time Picker":{"w":251,"h":26},"Dialog Block Layer":{"w":98,"h":98},"Dialog":{"w":478,"h":216},"Drop-Down Value Message Item":{"w":251,"h":34},"Drop-Down Item":{"w":251,"h":32},"Drop-Down Base":{"w":251,"h":160},"Drop-Down":{"w":251,"h":160},"Expand / Collapse and Pin Buttons":{"w":56,"h":24},"Dynamic Page Header":{"w":1440,"h":286},"File Uploader":{"w":280,"h":26},"Form Item":{"w":288,"h":32},"Form":{"w":603,"h":246},"Homepage Hero Banner":{"w":1344,"h":100},"Illustrated Message":{"w":682,"h":416},"Input Button":{"w":32,"h":26},"Input Message Popover":{"w":227,"h":34},"Input":{"w":280,"h":26},"Label":{"w":38,"h":16},"Link":{"w":42,"h":16},"Selector":{"w":16,"h":16},"List Attachment":{"w":71,"h":16},"List Thumbnail":{"w":48,"h":48},"List Item":{"w":400,"h":32},"List":{"w":400,"h":460},"Trailing Container":{"w":24,"h":32},"Menu List Item":{"w":206,"h":32},"Menu":{"w":144,"h":128},"Message Strip Icon Button":{"w":32,"h":26},"Message Strip":{"w":596,"h":32},"Multi Combobox":{"w":280,"h":26},"Multi Input":{"w":280,"h":26},"Notifications Status Indicator":{"w":16,"h":16},"Notification List Item":{"w":428,"h":96},"Notification Banner":{"w":450,"h":264},"Notifications Growing Item":{"w":400,"h":44},"Notifications":{"w":400,"h":620},"Object Attribute":{"w":135,"h":16},"Object Identifier":{"w":122,"h":18},"Object Number":{"w":75,"h":16},"Object Status":{"w":91,"h":16},"Panel":{"w":1007,"h":223},"Popover":{"w":248,"h":248},"Product Icon":{"w":48,"h":48},"Product Switch Element":{"w":180,"h":118},"Product Switch":{"w":588,"h":402},"Progress Indicator":{"w":256,"h":32},"Radio Button":{"w":16,"h":16},"Rating Indicator Single":{"w":24,"h":24},"Rating Indicator":{"w":132,"h":24},"Scrollbar":{"w":12,"h":113},"Select":{"w":251,"h":26},"Settings":{"w":960,"h":680},"Shell Search Selector":{"w":69,"h":28},"Shell Search Button":{"w":28,"h":28},"Shell Search":{"w":400,"h":36},"Branding Button":{"w":212,"h":36},"Shell Button":{"w":36,"h":36},"Shell Bar":{"w":1440,"h":52},"Navigation Item":{"w":48,"h":32},"Side Navigation":{"w":64,"h":773},"Tooltip and Input":{"w":30,"h":16},"Range Slider Handle":{"w":36,"h":32},"Range Slider":{"w":256,"h":20},"Slider Handle":{"w":36,"h":32},"Slider":{"w":256,"h":20},"Step Input":{"w":152,"h":26},"Switch":{"w":32,"h":20},"Icon Tab Bar":{"w":420,"h":44},"Tab Bar Overflow":{"w":72,"h":24},"Tab":{"w":62,"h":44},"Table Highlight":{"w":6,"h":32},"Table Cell":{"w":200,"h":32},"Table":{"w":1150,"h":556},"Tag":{"w":44,"h":22},"Text":{"w":80,"h":16},"Text Area":{"w":280,"h":100},"Tick Mark":{"w":4,"h":5},"Number Selector":{"w":32,"h":32},"Clock-face":{"w":264,"h":264},"Hours and Minutes Output":{"w":176,"h":26},"Time Dropdown":{"w":296,"h":378},"Time Picker":{"w":251,"h":26},"Toast":{"w":207,"h":48},"Tooltip":{"w":87,"h":24},"Tree Item Base":{"w":400,"h":32},"Tree Item":{"w":400,"h":32},"Tree":{"w":400,"h":128},"Token":{"w":65,"h":20},"Overflow Link and Typing ":{"w":44,"h":16},"Tokenizer":{"w":280,"h":26},"Toolbar Items":{"w":1,"h":24},"Toolbar":{"w":320,"h":32},"Tool Header":{"w":420,"h":52},"Header Content Area":{"w":299,"h":64},"User Menu Custom Menu List Item":{"w":299,"h":52},"User Menu Custom List Item":{"w":299,"h":72},"User Menu Custom List ":{"w":299,"h":144},"User Menu":{"w":320,"h":692},"AI Split Menu Button":{"w":115,"h":26},"AI Menu Button":{"w":105,"h":26},"AI Button":{"w":83,"h":26},"AI Prompt Input":{"w":322,"h":48},"AI Rich Text Editor":{"w":575,"h":148},"AI Text Area":{"w":340,"h":100},"AI Input":{"w":280,"h":26},"Wizard Page Header":{"w":834,"h":100},".base/Wizard Step":{"w":256,"h":32}},"effects":{"Shadow/sapContent_Shadow0":"bd311caba939c537982b570d88bfb083a92f3059","Shadow/sapContent_Shadow1":"7c9e3bfd99c8094827e767565fa142748c6709cb","Shadow/sapContent_Shadow2":"dba7ee99ed9c5e9ab723243b2ab863147b7f7498","Shadow/sapContent_Shadow3":"b4fb062cb996947c38b2363457e930ef71cd3445","Shadow/Lite/sapContent_Lite_Shadow":"c04e756cdc4fa5b892f0a77de8359cc75b3d84fa","Container/sapContent_HeaderShadow":"f9e5cd4c6b7aec669e6c5be38ff121d5ece4440d","Interaction/sapContent_Interaction_Shadow":"f81cac072e82763892e6c9b8815529b050d41e14","Interaction/sapContent_Selected_Shadow":"6f6ea08535de967e2e11a88e7a3d91b82d9b6059","Semantic/Shadow/sapContent_Negative_Shadow":"9d999143cc90de7f367c83aa81bbf238354f70e2","Semantic/Shadow/sapContent_Positive_Shadow":"49cf40541f1e7603189e397e5e826f7ceac4ed86","Input/Standard/sapField_Shadow":"298ab46fb5d195fee834ebc63e95667d95dd04df","Input/Invalid/sapField_InvalidShadow":"91401056cd5aaefe15f9756fc5f809f16b5de4c9"}};
const FULL_KIT = {"c":{"Avatar Badge":"51e6293e8c85efccecd24db4e06563cf91135cb1","Avatar Group":"6a0aaf6146d77af3f51fbfa3fefa879ea25bc167","Avatar":"71a3389ecbd47822b3184700766e30963fc2f220","Footer":"e563bc3291a07a5eb4d97b2083355cc54023c377","Header":"d4560b56c7b5aa9476e6b23bfaf869166b7fff47","Breadcrumb":"5743166bac11fdf110a54fd7d85436fed186d3b2","Busy Indicator Dot":"f5778faa7a1014cd3f64b56ae554927c9386fc96","Busy Indicator":"e328630d6c564d1f312256254e0543d41bacbb84","Animated Busy Indicator":"0ab83b6053ab4cc53135dd1cc72ac37ed0c0b984","Button Badge":"3e1f709f433a935f42e51361f06f4382fcc87eed","Segmented Button":"308476a5285b5a132241dc1c118d09ecf8d82273","Segmented Button Singular":"48543fa02ef1fb57b829cd3feb92b21f618e693a","Icon Split Button":"9afdf08f8ae226b175d0a3be79f24454d4b12928","Split Button":"8aba512152f89d81e9c9b804d8da3114b1a83a93","Icon Menu Button":"c455c46ed2cea345c534193c1598e5459aaadd11","Menu Button":"1d667088d93c355c2bd9bafac57147286206e799","Icon Button":"c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63","Button":"91805fa199b1fd247d76a9c08bbe0982b49065c4","Legend":"f63dd9489c7cec0c2af11da655c58e86cee54771","Mixed Calendar Button":"13d82218f6ea8486c962a686688bd883854e9a5e","Calendar Date Types":"f1bc2531da1359d378b30d7e77aed0871860fcd6","Legend Item":"17121720df001ce4519e88e0be53a87f8a8d5ade","Two-Month Calendar":"ad5ce462d34460d73eda13cd7ea3e2677fc27048","Calendar":"16743cba69c57792417e8f6b51d347cc29bd2d95","Banner":"64034a60b543539b407e8534b05454add9a49baf","Card Timestamp and Counter":"139b8dd3708af7c5e33d40a0b8f197fd77c1bf55","Card Badge":"faba12964cad31f90762107683e4de4076d80c15","Card Footer":"b8c16272d1c8537bb36d78e61ffd6b989e6ed894","Card Numeric Header":"682fda15b32742e9cc2aea47e702edda484f8872","Card Extended Header":"afb650e10ee7351cf96c6d23760327363878613c","Card Main Header":"d20f393387802cbd209a35144b63cb141071d425","Card Media Block":"0e527d14fcf51a06dbf14c007f665cbe120761b9","Card":"76fbadb97db272943b14aff18ee5809d0360795f","Page Indicator Dots":"af2036b3b2522c651423b627b9131bbb77ed31f1","On Content Page Indicator":"3d231b180bc3714fb77579ff247ac80034930afe","Page Indicator":"3e63ec191515e58a2d415d116859ffb258200212","Carousel":"bf174ffb841e4b27947d0be558656bb80238fe0d","Check Box":"23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071","Swatch":"3b2b7f89d4e9d4d56052ca032a3960f4e6aeebc9","Color Palette":"069afa265e88bd027cd6116017c671ed31298293","Color Picker Color Mode Panel":"e919349b1d24b93b604545642264832be781b51c","Color Picker Comparison Color Fields":"ded942d4b81f74b8c71ad35b2f4993e819cae7d1","Color Picker Slider":"8add25e353e79555009489541ac15ffef58e6dc3","Color Picker":"da4ac5fe23880bbdefabbf0059891eb289b5a52a","Date (Range) Picker":"ad1f84e6293671f80ff8dd174b1da0cbacf0fa48","Date Time Dropdown":"535a20585281f1d3fd2aa056260a6986d883f9e8","Date Time Picker":"377d76d309f4e5ee7e12132eba0df4e29686a4f7","Dialog Block Layer":"a6c01d24758bcd4c5f5369f875237c3f6e632113","Dialog":"5b965b1eda133ac521b42fa20b201e9491f4bf83","Drop-Down Value Message Item":"4716ba278a5c3d09e874f85c43370e6b9f3186c5","Drop-Down Item":"8ae33d5baeedff3874688177de1f23bd966d1002","Drop-Down Base":"20f94133bdeced52335c202e20200c79d3e766ea","Drop-Down":"d74d4ae8eb549d3cc54b7d345e3b17f90c543817","Expand / Collapse and Pin Buttons":"459b2167d1ce63b2dc1c7da01676aa3f29c49fa2","Dynamic Page Header":"dc90c8dbf7714f165ed79357e9ba6ade5b3701ae","File Uploader":"b7532a6da2cb7677348b5d4bbb81952c9224e984","Form Item":"1ddf647c238f6e94a75b886bc1fcf2e45d74a547","Form":"6603eb3ebde2c1c763f2ae450df2cbb799ba640d","Homepage Hero Banner":"6b540d39a63d837e652b82675136e991ebdd0192","Illustrated Message":"eba579505df21536654910797f94b3784248807b","Input Button":"cde8a0d2581cbe7561c99a10457123bfe8fe42f2","Input Message Popover":"1acdc092cfb399b0c33d1d6484c77ae58fe75242","Input":"0f4366cb3065919e8f3deb0462f1a5a3633d6b50","Label":"b38ac753648ad298c1e2dd02d71417566dd6095c","Link":"2e67b5399e9f05950c6f6ea6f244a1a9736c8a56","Selector":"1e995040306b20c0eb707ceb613737b8971b4365","List Attachment":"e394409638f79174366eb586a41a1214986e68ee","List Thumbnail":"d28077bc628b705c17445b910ca36f707a22dfb5","List Item":"f7bc6526a9f16608747a4141800146ebd3f4e835","List":"4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25","Trailing Container":"09d417201eba5efb296df84af4c1f848bc8d7b80","Menu List Item":"689013924aedb868b8d65be6f249643d45e00a44","Menu":"ba51eb54cba79d6795057e5df5ff853d361ee799","Message Strip Icon Button":"32538ec27bd700ea577639cb301f64ae3a29078f","Message Strip":"f0e77f8888796e35c0e791ddc0b38535eda6ec31","Multi Combobox":"cc0631141a7083096632c6161ee15448ced39ec3","Multi Input":"1dac6b2be28e60c6ff7a5752182d97f5033d3fc8","Notifications Status Indicator":"4e94f59dfaccfbb6edbb9d6d0fc56d2fbbcea245","Notification List Item":"6fe89ae5f6a512bebad2f9737ed134bccac1faed","Notification Banner":"aa8ef403a7c765acf86d2e6fc887a6cb496a3371","Notifications Growing Item":"b64369bba447338dfcf54f408d43c6fd6ee211f1","Notifications":"af1b29be8db435ed790d87721cff4d7efe2217bd","Object Attribute":"080ead216322befe153704bf8f11373158fea34a","Object Identifier":"8e1e45c5a89b540f6ec53542279c7711d4020d81","Object Number":"7b67d22ed19f246b708dc4664808a45f314a7414","Object Status":"748d609ead5d4a246d7cd7c144b94b518c467e58","Panel":"4d19c2a24896033fe5b04bcc5dfdf43e9626283d","Popover":"5f472d6482ed33c9967694fa411c675e3b214d39","Product Icon":"2dd0b7bceffa99417d7b589aba9de70fd09c2fd3","Product Switch Element":"17c7a3c13577e6e0018d65c09d948b07d701df85","Product Switch":"22a7c83b19c183e92577ec43dd01eaa188739cd9","Progress Indicator":"c355f86d77c4e5a8aa2366b83179896f7d172462","Radio Button":"9308f27ef27fbb28bc7d167c52494aa41a21610f","Rating Indicator Single":"35cf292c745706e23a621d794dc5e346b2bacfbb","Rating Indicator":"4e75dd8968be7061ba703e3f5fb4364b558acb04","Scrollbar":"ccf83f17bfdbce52e81e61d775c4eed5d41b2258","Select":"5ce369ff7fb0cce28984eec8dd9973ccde82facb","Settings":"a337e8f637533682b7a0a8082f6db074c5082c81","Shell Search Selector":"638666324a5f4e850f73c23a15cd8124a51920f5","Shell Search Button":"4316105b082691ee1014f2a152deca35112f49e0","Shell Search":"e60b0ec134635c92ca558125083fe11242997e98","Branding Button":"7d9a2765e4d5fd5d9dc841551d138311b9d7a31b","Shell Button":"33fc31d716608f54280c869ad21323f1863b4005","Shell Bar":"169cfd74c0be329c56b4c79b9404c978ff10cb60","Navigation Item":"9d0734a384e9b67475e7b5a357e8c32070a7c2ca","Side Navigation":"d680af6d72f9421fe3f8712bf0ce171308963d3a","Tooltip and Input":"7b831cad640b9d64456b24cca552e4972481024e","Range Slider Handle":"1b9c916117bc532ef17d023a5c7926ad2cabe354","Range Slider":"34d973fcb4c85d6517c8e5c3079e2b40d14d0fe8","Slider Handle":"9eb5d2a4acefa98a5db1b746d8cbfaf1e06417a9","Slider":"ee3b9995f1484c6d008bbac9dba2bd8a0026c160","Step Input":"69f0f7acf68766ac89890d0c119f64bfd50e693a","Switch":"c63509f642cdabbeb8c1878dd125ee006481631c","Icon Tab Bar":"4aafcbf55528c439876b314d155438884b614722","Tab Bar Overflow":"7daa9b988442efaf07553e8f4fe1fa4e8a550c41","Tab":"6cce9469ce9de689ee610fc7125b500c0b4421e7","Table Highlight":"1ce451bc0b726c4cf17cb15977b320253d543ba4","Table Cell":"e717737e98a40a8619e315ca1b4b04646b93b541","Table":"03ea321822c4e99c27de4d9c2524bdec9c6e0972","Tag":"9b55bf702befd73b2e28f800ee4d0033bc0e0e95","Text":"56363ecadd65adb509e4549882737234ad652c2d","Text Area":"bee4738dd5e5856a3b88eae341b47376a3269d87","Tick Mark":"1954dda5aedface7f38494643d3e8d509fe8bafa","Number Selector":"5becd6374a0e90c19de672d2d817e5cd4d0257e9","Clock-face":"09d8873989d113dde702987f86566691dd2928d9","Hours and Minutes Output":"f057e33d74714c78f5981d01d8a5c955dd350644","Time Dropdown":"046b2b86296a9a57168423671d3ea23833b27b7a","Time Picker":"f07044ee64f4abfc857543051806986d49a54b68","Toast":"bbe4c3f7114a2eb4286844102f42c909bf0798eb","Tooltip":"c25ea83976e21fc523313aa335bfcea33518ce93","Tree Item Base":"e857ab95d74c1c163f29a414fcc9b13979332b5c","Tree Item":"5142305385e26387daddd9af7b58a7da66a9f8fd","Tree":"93fca87e34305e0a8e036acdd51e7cdc870d4e0d","Token":"5664972429518d07040a3cadfa2d5a28cf19b8a7","Overflow Link and Typing ":"0f71952fc797e565f455596a4e4caa44c8318608","Tokenizer":"da76d0413ed1f1f40d6f23e7732c9aca0b17ef5b","Toolbar Items":"ad45e5bf267d83ee320902263db8887f71e97026","Toolbar":"58a258bf5813e59cec4dfc684c8cdb2a6ca6721f","Tool Header":"73a0370a9342211081a4ace445d10ab064963624","Header Content Area":"4e2ec14ff0a8c2c9e6f4f30c1a4c1d5efa1992cc","User Menu Custom Menu List Item":"8fbd44e86371a90c9626aea06768b5ed4d01238f","User Menu Custom List Item":"6aff6013fa7332879703327b27f73a71040a849a","User Menu Custom List ":"2d77f84813eb0bc44b359df7b554d1966449aa1c","User Menu":"c9bbc83c501d55048df4f68df50d920a9e85002c","AI Split Menu Button":"3eedca60790fbfc4a87e2cc2aaf9a7774c68b6ca","AI Menu Button":"af7726506b902ae0a80daa2950f890d6b4c275c6","AI Button":"6d9a69eec5a716375ccd5e7272c6193dbe8718ce","AI Prompt Input":"73c83eecc6edcaf572bca3c411b7345a5d398b3c","AI Rich Text Editor":"259171690780bc94b6900bc4975d6bb81d5a089f","AI Text Area":"b5bb525824429489a2f6e5657e91240a605014a8","AI Input":"0098668d77c18b019e726dc9cce843cee360c4d5","Wizard Page Header":"a429e211527af646003af9a89158ec22ca7723bb",".base/Wizard Step":"2c23606836ea876f6f6cf1409da1bf33d2679e70","calendar":"16743cba69c57792417e8f6b51d347cc29bd2d95","list":"4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25","menu":"ba51eb54cba79d6795057e5df5ff853d361ee799","settings":"a337e8f637533682b7a0a8082f6db074c5082c81","tag":"9b55bf702befd73b2e28f800ee4d0033bc0e0e95"},"v":{"sapAccentBackgroundColor1":"4f38e4e254f06a8e5b714729c44f2541ae35efd0","sapAccentBackgroundColor10":"1cf3b6b0ba70c27e66091e352c3d252949e24888","sapAccentBackgroundColor2":"27a462d00b0b3eb33afdb29ba6fc46f5b97e7228","sapAccentColor1":"cec6f9db3ea89eeed293182290efb4d20fabf934","sapAccentColor5":"81a54d7e32a7cc20e46c16c6d9dc2bb5e989b807","sapBackgroundColor":"81733e831b5776ab41555848ba944bb507889e2d","sapPageFooter_Background":"ba80056f64acffed65b30b6bb488e55da1aefd96","sapPageFooter_BorderColor":"6e6b94ae4a9e355f0d6ed876653500c09e56ab24","sapPageHeader_Background":"785b58702030aaa462f21258aebe3df455814247","sapPageHeader_BorderColor":"21c67fd74c5aae8d6089324935624b78f4d01f53","Large":"1d6002e8c937db08d285793b4af27f6847ed8653","Medium":"25cb9a824eb65606fed7afe8aec8793167a87e70","Small":"aa939aa0f04d64acb40ec8c25a9e18f5989d9003","Tiny":"7463b174fdc9f0f63d0f5888f086f07df67d8d71","Zero":"baeba50dd92e446b071462d7df9824068148a8c5","sapContent_Gap":"e13feb360360600976e2b980832f4e5131821e9d","sapContent_Margin_Small":"0d1eaabac638eb5455c8de7f924b13d22ae975f1","sapContent_Padding_L":"25e358b6740c6c2659ddfa2a8413bd8600d47119","sapContent_Padding_M":"4904a4a39e6f0c43c422f4509ac7a4c3230776d2","sapContent_Padding_S":"a89930ba5dacbf7cafb5b2002ca27255be974370","sapContent_Padding_XL":"14420ce8473e8865e9ad07c2346b521d58ba2da6","sapContent_Space_L":"25ccf296a47af9b428894349bcf56202185a783e","sapContent_Space_M":"f9b07cbc6ecf463080950c13f069aa919ed11c18","sapContent_Space_S":"cd3b448a40523c58ad0b3d88377acb01d35e753f","sapContent_Space_Tiny":"8f664f1dd17bf6b0368e5e1241413b7f7b3edfae","sapContent_Space_XL":"54819f861bc9579f8c5547b8fb8d31bfdcac2600","sapShell_Gap_L":"948d6e7a409276b4a1cbdf4b7e8fa87c148a8b33","sapShell_Gap_M":"cf15e218bfb20dfdfd2e2f63247f848601eb6392","sapShell_Gap_S":"9baf85b3c50c86dc5df3b534434bde04f08f3e15","sapShell_GroupGap_L":"5cfa132673fb01e44840803fcc3025c332beff83","sapShell_GroupGap_M":"78ef9f65070682754cb7bf9d4a1a7624004901c3","sapShell_GroupGap_S":"1667a343e380f63b045fd03628570429ab0cd440","sapShell_Space_L":"043e89deb6fd023192f51c4594b6e36be740a47d","sapShell_Space_M":"958daf06534cb24f2119fa3c40ae617aa851b72b","sapShell_Space_S":"912f4236ac5f59917cc38603f8dbcc45491522da","sapBlockLayer_Background":"ca3f3cd9eeba47921f68c16604d851ee1cd95d58","sapBlockLayer_Opacity":"88112a6fe7067e9e608e24738e2cfc01374b183e","sapContent_DisabledOpacity":"294a3988ccd6ccf38f84faa2848b160fbb9b7817","sapElement_BorderCornerRadius":"51920a49f517e59a725aef06da2e27402b308d2d","sapElement_Compact_Height":"83494c88316e689d0fc816698baa949e62fac8e1","sapElement_Height":"57f3078e8d16ec697d3594ee081da6e4148e96e8","sapGroup_BorderCornerRadius":"fe7b0eb1c7766795ead331ab5f1dc5288c06ef2b","sapGroup_ContentAlternatingBackground":"a71dc2bbc7bab078b2024e826372e7a9feb69c3f","sapGroup_ContentBackground":"9241156149fbd73b84220edc1552f41766e05462","sapGroup_ContentBorderColor":"5de48ec733aa0a6b5d5d37a01b8920a0566855bc","sapGroup_TitleBackground":"2c183decef4e3c0667f3b8417bd51df5ed852900","sapGroup_TitleBorderColor":"ab19f783d3c7d511a1aeb60a8037d7d7053627e6","sapGroup_TitleTextColor":"839b08c616ce94207f0d11ba98629b4ec5a699a5","sapPopover_BorderCornerRadius":"af8ee18fe7b06151373c85becdb04d8100d0e6be","sapContent_ContrastFocusColor":"aa2bb94a5c45362019aa6fb4510f42053864a1e3","sapContent_FocusColor":"681400c569373a015f0ebf9506002e676c86624f","sapContent_FocusWidth":"31038ae0a748296e6d1f182b3e58f58fa5633b74","sapFontFamily":"ebb43085572cbe8cedcca3ffce3ce11140eeb11b","sapFontHeader1Size":"eb2f4a4dcc1f987ec55fb1a1b26f58c0dee9df99","sapFontHeader2Size":"eac03d6cbf2cc9d8768cb9ef761e3b346260a1e5","sapFontHeader3Size":"8d18f87a651ca62f7a40b50bdc7221921cf89b11","sapFontHeader4Size":"b4f7244e9d31f7c578ae5f6f43c5ff8ba26ebcf7","sapFontHeader5Size":"aa3c553814652d416947185110707484a00f7df7","sapFontHeader6Size":"f8ad6187c1168f1a7a71f8606d7d1fd6fbe6a802","sapFontLargeSize":"8359ea872ffe9aef35122b77f9bf85976224555c","sapFontSize":"68b1dec9bae15a57b03467a599e8d80bd2e41595","sapFontSmallSize":"70635f7f1bedf427734d0f25574825341351cabb","sapFontBoldFamily":"00b1b8f1937cea28653fca783170388b7856494e","sapFontHeaderFamily":"2424ce60f43cff4d6fbcef28dd986e3f69b8bef1","sapFontSemiboldFamily":"f3a3e2887e0b08a55f83f4815e232fe669e9c03a","sapContent_IconColor":"0d4308d590acc26827e9c4f395c2c45328a1c34c","sapContent_IconHeight":"7814f1d08d5904e0fd452fd621c6f9b620f920ff","sapContent_NonInteractiveIconColor":"b3d5d5aa8f0952b749c2bb4c2943b6c779f95037","sapIndicationColor_1_Background":"15bb84eecb78fab78a03bbb3bff03324830bb3bc","sapIndicationColor_1_TextColor":"578725afa889618c30af3d72700ba2a76447a0ba","sapIndicationColor_4_Background":"0879955552353ffd83d6d875ac0c2a46023cec41","sapIndicationColor_5_Background":"4a65733f151e9270043a3584fae0ef6e56153124","sapField_InvalidColor":"d382e744b764e39ee4e4feb7cbe755d26431dcb1","sapField_ReadOnly_Background":"461f625887f361b6b08c1c4da3014a08967233bf","sapField_Active_BorderColor":"c5d7321d595a79aec7e39277fcebe2e4265c3fb5","sapField_Background":"4f3c388fba24c3bd4a3d42db01d26115037439bf","sapField_BorderColor":"1378b9f583e24df50c0d9f05657cbb463d88c0ef","sapField_Focus_BorderColor":"5b2d5c321a2b09e88983407271de0ccef29164b6","sapField_Hover_BorderColor":"a20c4226c13af83a09a6fcb3f199f3d74ca7a4f2","sapField_PlaceholderTextColor":"b83a7b7711f1705c7717a83b6eb5c915298201e8","sapField_RequiredColor":"b7a01201f8bc6aeb5ea52cce58e48a893bdbe330","sapField_TextColor":"f47d9a5fb2352380105aad4d7dd488cd69796bd4","sapField_SuccessColor":"d58c45eb345a8f440d318289ecfc617c190fc150","sapField_WarningColor":"4cfd933a8462a2fd0951a539a5eea61382a0dc9b","sapField_BorderCornerRadius":"586695746b86e9136bb58013e35e3d3415a7750c","sapActiveColor":"8280fcbaf014930076ff69cc352ce47246d4829c","sapContent_Selected_Background":"c4197dc89ee7d7af698b14d7fa024629a73aa8c9","sapContent_Selected_TextColor":"01a216d0a7af3f20588a7df6a8749ef82104dc5f","sapHoverColor":"afb93d0012679bca0fec71402890041811ef1319","sapSelectedColor":"32c75c9ce3af50d318fe8d64d43dea19d795b8a1","sapLinkColor":"d3df28203fe7452c7ed42bad054ac10fe75d7751","sapList_Active_Background":"ac32a3321cdda456cd35e366ba3d5e5a6fca290e","sapList_AlternatingBackground":"3c6185e8efc5a72f14f7a6b2e75e38f5417df641","sapList_Background":"f4736a188daa008f7fecaf74339db52f6e0633c6","sapList_BorderColor":"ae5e040923e301aea32233ae118cc187149588b0","sapList_FooterBackground":"0f0eecbb1eb25fc94ad7773094b431bef974045d","sapList_GroupHeaderBackground":"0b291c529f06bb08ef0da88e107a32592eb1dcee","sapList_GroupHeaderBorderColor":"7540c39944057193db6dd63bb9824b3827ad3ac8","sapList_HeaderBackground":"2aafdd22976ab57e7fec1b2e20b7a02e4623891a","sapList_HeaderBorderColor":"d357ef8c9a456fd4a6cebaa85f0bef0d022106d7","sapList_HeaderTextColor":"f38113d8b4d764cb71e17f8c9934ac1146971515","TextShadow_Spread_2-4":"b9f1c6329ff8f1cd5caae2fb3dd41211705f571f","TextShadow_X_1":"048eda37df325cbeb951b26879055ff4a694e66f","TextShadow_X_2":"6d239b96184514d5cce442fb1008841c6feda067","TextShadow_X_3":"d33f3ff09670e335fa31238527bd6bc612f2e4d5","TextShadow_X_4":"0c70c48d5f6748ee6ad35b04697131ec538fe0fb","TextShadow_Y_1":"999f12a3c7a319a54eaebde3898212ae835c71c4","TextShadow_Y_2":"1162f4d156bd727873bcdd05dcd4927c52c75552","TextShadow_Y_3":"dbead97975045671427d2ec861eb00e5251c5a23","TextShadow_Y_4":"d194435564c2c89aa48be1931f343df921d89b70","sapContent_ContrastTextColor":"2a97516c281ab984b0707ce9f6503cae19ff4681","sapContent_ContrastTextShadowColor":"eecc9cc7439f5be7ba9f68b05372600e9e3ed1aa","sapContent_DisabledTextColor":"978f7b1203509e95cff62356d685ec6fbc76057f","sapContent_ForegroundTextColor":"c4c6c5775339bebeb4773d60ea38becaf9506fe1","sapContent_LabelColor":"5ae0b6ed14efc54a6d4b6a58d9a4978ed3754768","sapContent_MarkerTextColor":"ddd3eda71d97ec48770a2f437dbd4420db84671f","sapContent_TextShadowColor":"ec63843cddf3c3d5a3c8bba0c674f7ae6fe1f5b4","sapContent_TextShadowColor_2-4":"721ec6bc4cdfe00f5fda22c2d14c5ced19e6d764","sapTextColor":"ddcb06d470abeacc7195a4bd4908b969ac8bad6c","sapTitleColor":"bd9f5a76eda064e2e8d67d100f7bb30164584627","sapTile_Active_Background":"2a4c3598bfbbe201bdf20d80857f23c910578f67","sapTile_Active_ContentBackground":"71752530ad5874328ca6661fe3c98b16548826e4","sapTile_Background":"f62cb39cc3db4d778050b7dc1b8ea6440b0600eb","sapTile_BorderColor":"688a34122010130302ee5fc273f7775c1b76cd4b","sapTile_BorderCornerRadius":"52269b3d7d0ae94cd44448e9eafe226d36a5e234","sapTile_Hover_Background":"7af7c501f9bcf47ef024317c0d1a04dd42221806","sapTile_Hover_ContentBackground":"597ff31ec967e127ff21fbaeee5787ea8ede8892","sapTile_IconColor":"256ed636e8ca79bb9a45794c35714bdc14004cdb","sapTile_Interactive_BorderColor":"ddd1a290acd6ba8290af6a662c08a757db4cb259","sapTile_OverlayBackground":"e085ac8611634eb1493d0951b4d5cf1c25ec1c98","sapTile_OverlayForegroundColor":"98530a457ac003af44a66dd4121b7c69ebfc3ae6","sapTile_SeparatorColor":"ba00bfa7d1ad5e1acbd64871295bfbaa2196b1d1","sapTile_TextColor":"d3ed22a06048779cfc729399b89444d9061c2a30","sapTile_TitleTextColor":"844ada6a81afc15a59959d4febddf974ea314728","sapInfobar_Active_Background":"42583d7fe219cf18ea91db881ff0ce49781c501e","sapInfobar_Background":"78757f7588e9d72d065e025f9040041d7739f1e3","sapInfobar_Hover_Background":"bad94383f0badb952f5918f7a5f28eb8e4e57bf4","sapInfobar_NonInteractive_Background":"031e7885451cb31830728f31d4112b6062ebd53f","sapInfobar_TextColor":"101817f1233f9c54c3ee6deb1233d71d4b2d63dd","sapToolbar_Background":"3f4ee47ba627559ae088ffa30ad5d1b19977cf80","sapToolbar_SeparatorColor":"4e8656d1c44d98c23f72040b3b5bd964f3e404dc","sapBaseColor":"53977e207776cc051f5bc312eadd9140ab3842cb","sapWarningColor":"2b9aa2b38d0039e1d1119ba2eaa6226383f7e3b3","sapErrorColor":"f80fb25da691a72796a20df06d830d01bb25d2a8","sapErrorBackground":"f87afb0f0bd68badc30f9022a3db1e4788881a7a","sapButton_BorderColor":"2bb33c0108c90f38df37796205f9c25de044863f","sapContent_Selected_ForegroundColor":"35cc8f15a553c16824b64083f51191cd74323574","sapSlider_Selected_Background":"28ebf748b5d0cd3e9064c5a8c1c0ab50d7b41f3b"},"t":{"SmallText/LHAuto/Regular":"3630ff040c7662da157c94f39ca000434866af79","SmallText/LHAuto/Bold":"4635f9147cd7445edfd6c5095e0269a74b31d93d","MediumText/LHAuto/Regular":"a55fdfa6995034dee7c5758e479e7f554c457291","MediumText/LHAuto/Bold":"405de2565edf459a754f1e72823e3f4d7c8cbb3b","MediumText/LHAuto/Semibold":"3553f1189bb16147c10ce434ef5b1a8d653c43d0","LargeText/LHAuto/Regular":"fcd48b218e51130a9fd37d5ac590587c0b86b556","LargeText/LHAuto/Bold":"8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061","LargeText/LHAuto/Semibold":"4445cf9c84f3d09a0f3b769f9ad27c48ff52477d","H6/Regular":"2706d29e211e900ae2831f2e1782aa02233555cd","H6/Bold":"d076995c96c2552ea0c19cd14dcb1834d4c84fe6","H5/Regular":"eafe040ca349722d64228570677c0341f52e8ebf","H5/Bold":"863b2131b6f92b86dc8686f13eea357bb4116db6","H4/Regular":"d0b1f77b2a0568fde04c93e710740a3c6fca111d","H4/Bold":"7263cb9889e84c192d1ebf77a45cfbc8c13ca5d0","H3/Regular":"bd2a177700d59ac26c6166f23c8ff6ffd4ec7b76","H3/Bold":"5d1b2c6e9490b3a52c85a7c6f9fd570afc9255fc","H2/Regular":"a94f193afe0c483d05dc2d297aaaf0f6ff877cee","H2/Bold":"961807887b96e0d73c98a34255ecc988d94294e0","H1/Regular":"8a97738f48f5b42dc9a2f26b652fd559fc5299a7","H1/Bold":"26e7e8b9dd2d907743575a15d50dc4f30c5b4101","Main Header/sapObjectHeader_Title_FontSize":"934edaa27548354de070cea35d64f6a81fbe897e","Title of Components/sapGroup_TitleFontSize":"f8fa671943cf116fa67c767f32d3e05a294eda2c","Button/Emphasized/sapButton_Emphasized_FontWeight":"aa4523ff3fc9a9ca2f6b6e431af776c2910d4ee5","Tab/SmallTabText":"e31b6391a2bb2b5383b5fdc37717543518e093f4","Tab/MediumTabText":"41f7cf8c1d0eefe64655d2e3285fdc6434a4b180"},"i":{"Calendar":"6365647fcb348a4979f65cfdec1bc0de735f4727","List":"e252bd6c8d373895ca1d18d7ba0aa17a3359248c","Menu":"d1b0ae52b7eccede2007395df08f6699527b9805","Settings":"3003ec879ac335662007e3a73639fb3f2bb181b6","Tag":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","accept":"44c041ea1ba7e4fb7af49664054038dfbb136ef3","activate":"f03276bc71193caa97829c4e627330349fa926cd","add":"d6727620b32189e038a3bebbe10ad02b66859f47","attachment":"1d66e134705d423228338a44aa7fa7803fd229fb","bell":"ec29b0acc023373343199ca501f7b4d5a89dd900","calendar":"6365647fcb348a4979f65cfdec1bc0de735f4727","collapse":"f5499dbd43fc40ed8e0ca59efec44e946731f426","complete":"192ed65c61e566eb4b0a51a6cb3d0e819683bc0e","copy":"5e1f1ea1d98637e1fb8a029cf9f072d085dd4066","decline":"80086d2e8969c07e7c885e6ee9244005bfc3864d","delete":"6da9bfb78bb57cc96d015531ac16e201423d8558","document":"47593f4f8e7f752e8bb05c6489c2ce610eb012c6","download":"bb79aa01b7f84d032f21891b43a88eaa7024d7e8","duplicate":"e00e7dd4e0a044f0e50b8b3de008654d74c2f56b","edit":"b346b05bc52f9d648ead280cfbd17baacea391f2","error":"e498c375d64182cd15c40a6544499d26fead88ae","excel-attachment":"85256e974ce0c7329fe98f36a2d32b25683ef660","exit-full-screen":"0d8205430605010f858b71cdc5c76967462f5e05","expand":"27718128e9c71492ee87d6e62e66acdf1dc40d03","favorite":"777c69fdeaa2648545eacf6b329e1aa1e9c54a9d","filter":"4a36aefd3adb9dcfb512d16c39fd498445aed452","flag":"06d4ed866ff161c20b062ad167001b7b96d06af9","folder":"b4138c37ac961f4683a13edb0c9b07aba856e825","full-screen":"8b7f0a993478cced7b0589aef55af29fd773d1e5","globe":"ff1de89f036f7aef09afe2d157fc3bd9206cee7f","grid":"08fc0d537befd77bd9c8fcb72bca88271bdacb72","group":"361026d73858fabff3db3e9bdea5a18681beccc2","home":"ddf4537c2f792179f11f64cae869cd1241e5ec7e","in-progress":"5fd4dff1dfbcddfa3c72d89ef8044e6f6d0f2f5c","information":"a46fdc47795362da045a36eb5e7a320266efd3fe","less":"956413a5409ff97501e8b589518dc28dabab6881","list":"e252bd6c8d373895ca1d18d7ba0aa17a3359248c","menu":"d1b0ae52b7eccede2007395df08f6699527b9805","multi-select":"c431b4ea53e201aa56428ac81bfba9971d2b0341","multiselect-all":"3c33da3d50dd450e78e912c9917f8cf6a5de921f","navigation-down-arrow":"40534f62cdce550850addd3a7dcfa843d3c68e0c","navigation-left-arrow":"7d0b0daf12983834a2a7e851baa1979d4f0bb5ec","navigation-right-arrow":"a27a77b93ec918313801f9983a112e871c1c8066","navigation-up-arrow":"174e2bdd2765be0c1ccb1eeb30cde1c7b1a35577","overflow":"6a0c2f0be4be541cc17870a7a633b19e3cb2d1df","pdf-attachment":"4098a29c1f0fcfe59ba860407457458125f38221","pending":"6afbe3d51f8ce5874572d5a30a89aaf2f5494f16","print":"f86b13dfaa2e9e4fe0eca98fb186c16ed3e3cbd1","question-mark":"70170cac2c7c3c842f40c688a260fcd2b06723b6","refresh":"572b74d0e27df61e1145a637dd8a6945634a3a16","search":"f3837f5ce4099717f6925b3be2bfddabb212baeb","settings":"3003ec879ac335662007e3a73639fb3f2bb181b6","share":"2e68a41e3257e50d7da7d1a35338e293e8c43242","slim-arrow-down":"d206a924630cb08c1b62f4c2ddef383b8142e519","slim-arrow-left":"6727ead97eeafcaf11454bbb2bc826a536917456","slim-arrow-right":"3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d","slim-arrow-up":"f852031802bbe5bebd03387c3c54c58e4367bba0","sort":"8d18dc73bb269e91c1b52ba25c63f2b93f48693e","sort-ascending":"b366220d5ccb011ec48a357a38b853448d79627e","sort-descending":"18cbbdf3dc5d1d29fbd624e562d87b36b9c356ae","sys-cancel":"88da429c0adbb2007ed50360ac0b42861945bffc","sys-enter-2":"a69b0f2584613dc61fbeac927db00f6b576a10eb","sys-help":"5f97e4c30c2c894169078dd8fbda7686fd852160","table-view":"34f6afb184086b152de9f138125ff90c6be40250","upload":"2fa7494c9f95873ede5d0d8df730ff0a247e7dc4","warning":"cc7b1d6291f9f1828ab3c851b33bcc50da64d8c2","suitcase":"aab233a77becbdfc986a734c5451f5b976638855","meal":"52c9186b136b0ff70196b57dd6cf5f0e17e848bf","share-arrow":"f186ab5dabe94fbbf9b8427f9fd41edddf104e2c","share-2":"3e32bfc37d0c6c148ea9919015d02a7acf91d58c","tag":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","flight":"65ca2deb9dd0c4f7734d2269e7958fbe62b4a462","paper-plane":"1af59a706bee8811d9439901ec3d4f54f118185a","receipt":"28664297b6ba462b297b4487f2fa5884d53a3a08","travel-expense":"00af06f46dafee9ba85ce133c4ce34d449eaee25","travel-itinerary":"303136e86aedf4da03db63f869e9a9262c9a89d7","pushpin-on":"a103a0ee9c45c6b54d5f799e82b1842236f2c79e","direction-arrows":"d8df6bd3e7657212a65f733f39878d4e0a37cc2e","media-forward":"b200c671f28c62c7e4ead976aa02b5875f77d5fa","thumb-up":"5302ae09353d82f5221906eb454886085d60b9c3"}};
// ── end GENERATED MAKE CONVERTER ──

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
figma.showUI(__html__, { width: 340, height: 240, themeColors: true });
figma.root.setRelaunchData({ open: 'Build SAP screens with Claude' });

(async function init() {
  token = (await figma.clientStorage.getAsync('sapBridgeToken')) || null;
  lastJobId = figma.root.getPluginData('lastJobId') || null;
  jobStartedAt = Number(figma.root.getPluginData('lastJobStartedAt')) || null;
  sendSelection();
  sendHistory(true);
  healthCheck();
  setInterval(healthCheck, 3000);
  inboxPoll();
  setInterval(checkMbxDone, 2000);
  treePoll();
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

// ─── v5 tree jobs: poll /tree/next, build here, POST /tree/result ────────────
function treeStatus(text) { send({ type: 'tree-status', text: text }); }

async function treePoll() {
  if (treeBusy) { treePollTimer = later(treePoll, 500); return; }
  if (!token) { treePollTimer = later(treePoll, 3000); return; }
  const fileKey = fileKeyNow('');
  if (!fileKey) { treePollTimer = later(treePoll, 3000); return; }
  const r = await api('/tree/next?' + qs({ fileKey: fileKey }));
  if (r.status === 200 && r.json && r.json.jobId) {
    treeBusy = true;
    try { await runTreeJob(r.json); } catch (_) {}
    treeBusy = false;
    treePollTimer = later(treePoll, 200);
    return;
  }
  if (r.status === 401) { await doPair(); }
  treePollTimer = later(treePoll, r.status === 200 ? 1000 : 3000);   // idle poll every ~1 s when connected
}

// Figma plugins cannot build code from text (new Function / AsyncFunction throw "not a function"), so the
// build runtime is compiled INTO this file by build/plugin-bundle.js. The payload carries data only (kit + tree).
// Returns { nodeId, name, made, WARN } or a string ('PLUGIN OUT OF DATE' | 'PAYLOAD CORRUPTED').
async function treeBuild(payload) {
  if (payload.version && payload.version !== RUNTIME_VER)
    return 'PLUGIN OUT OF DATE (plugin ' + RUNTIME_VER + ', payload ' + payload.version + ') — run node build/plugin-bundle.js, then close and reopen SAP Bridge';
  return await RUN_TREE(payload.kit, payload.tree);
}

async function placeTreeLogos(rootId, logos) {
  if (!logos || !logos.length) return 0;
  let placed = 0;
  try {
    const root = await figma.getNodeByIdAsync(rootId);
    if (!root || !('findAll' in root)) return 0;
    const used = new Set();
    for (let i = 0; i < logos.length; i++) {
      const it = logos[i];
      const all = root.findAll(function (n) { return 'fills' in n && namedLike(n, it.name); });
      const pick = all.find(function (n) { return !used.has(n.id); });
      if (!pick) continue;
      try {
        pick.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(it.pngBase64)).hash, scaleMode: 'FILL' }];
        used.add(pick.id);
        placed++;
      } catch (_) {}
    }
  } catch (_) {}
  return placed;
}

async function runTreeJob(job) {
  const t0 = Date.now();
  const post = function (body) { return api('/tree/result', { method: 'POST', body: Object.assign({ jobId: job.jobId || job.id }, body) }); };
  treeStatus('Building ' + (job.name || 'screen') + '…');
  let built;
  try {
    built = await treeBuild(job.payload);
  } catch (err) {
    const why = (err && err.message ? err.message : String(err)) + (err && err.stack ? ' @ ' + String(err.stack).split('\n').slice(0, 3).join(' | ') : '');
    treeStatus('Build failed: ' + why);
    await post({ ok: false, error: 'build threw: ' + why, ms: Date.now() - t0 });
    return;
  }
  if (typeof built === 'string') {                 // 'INSTALL FIRST' | 'PAYLOAD CORRUPTED'
    treeStatus('Build error: ' + built);
    await post({ ok: false, error: built, WARN: [built], ms: Date.now() - t0 });
    return;
  }
  const nodeId = built && built.nodeId;
  const WARN = (built && Array.isArray(built.WARN)) ? built.WARN : [];
  if (!nodeId) {
    await post({ ok: false, error: 'the build returned no nodeId', WARN: WARN, ms: Date.now() - t0 });
    return;
  }
  // logos
  const want = job.want || {};
  let placed = 0;
  if (job.logos && job.logos.length) { treeStatus('Placing logos…'); placed = await placeTreeLogos(nodeId, job.logos); }
  // dumps + export (each guarded — a failed dump must not lose the whole result)
  let geometry = null, audit = null, pngBase64 = null;
  try { treeStatus('Dumping geometry…'); geometry = await DUMP_GEOM(nodeId); } catch (e) { WARN.push('geometry dump failed: ' + (e && e.message ? e.message : e)); }
  try { treeStatus('Dumping tree…'); audit = await DUMP_TREE(nodeId); } catch (e) { WARN.push('tree dump failed: ' + (e && e.message ? e.message : e)); }
  if (want.pngScale) {
    try {
      treeStatus('Exporting PNG…');
      const node = await figma.getNodeByIdAsync(nodeId);
      if (node && 'exportAsync' in node) {
        const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: Number(want.pngScale) || 2 } });
        pngBase64 = figma.base64Encode(bytes);
      }
    } catch (e) { WARN.push('png export failed: ' + (e && e.message ? e.message : e)); }
  }
  treeStatus('Sending result…');
  const r = await post({ ok: true, nodeId: nodeId, made: built.made, WARN: WARN, ms: Date.now() - t0,
    geometry: geometry, audit: audit, pngBase64: pngBase64 });
  if (r.status >= 400) treeStatus('Bridge rejected the result (' + r.status + ').');
  else treeStatus('Done · ' + nodeId + (placed ? ' · ' + placed + ' logo(s)' : ''));
  try { await showNode(nodeId); } catch (_) {}
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
  jobStartedAt = Date.now();
  figma.root.setPluginData('lastJobId', lastJobId);
  figma.root.setPluginData('lastRequest', JSON.stringify(lastRequest));
  figma.root.setPluginData('lastJobStartedAt', String(jobStartedAt));
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
  const elapsedMs = jobStartedAt ? (Date.now() - jobStartedAt) : null;
  const entry = { jobId: d.jobId || lastJobId, at: Date.now(), name: node ? node.name : (d.name || 'Screen'), nodeId: d.nodeId || null,
    match: d.match == null ? null : d.match, eye: d.eye == null ? null : d.eye, pass: d.pass !== false,
    mode: req.mode || '', request: String(req.text || '').slice(0, 140), blocks: d.blocks || [], elapsedMs: elapsedMs };
  const items = readHistory().filter(function (h) { return h.jobId !== entry.jobId; });
  items.unshift(entry);
  figma.root.setPluginData(HISTORY_KEY, JSON.stringify(items.slice(0, 30)));
  jobStartedAt = null;
  figma.root.setPluginData('lastJobStartedAt', '');
  send({ type: 'done', data: Object.assign({}, d, { name: entry.name, request: entry.request, mode: entry.mode, at: entry.at, elapsedMs: elapsedMs }) });
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

// ─── Make → SAP: a pasted probe dump becomes a SAP frame, all inside the plugin (no bridge, no node, no model) ───
function makeSay(text, extra) { send(Object.assign({ type: 'make-status', text: text }, extra || {})); }
async function makeBuild(json) {
  if (treeBusy) { makeSay('Busy — wait for the running build.'); return; }
  treeBusy = true;
  const t0 = Date.now();
  try {
    let dump;
    try { dump = JSON.parse(json); } catch (e) { makeSay('That is not a Make dump (not JSON).', { ok: false }); return; }
    if (!dump || !Array.isArray(dump.controls) || !dump.controls.length) { makeSay('No UI5 controls in this paste. Click the bookmark on the running Make app first.', { ok: false }); return; }
    if (/,Ç¨|√º|√§|√∂|,Äì|¬∑/.test(json)) { makeSay('This paste is garbled (€, ü, ä, – show as ,Ç¨ √º √§ ,Äì): the text was copied with the wrong encoding. Click the Make bookmark again and paste; do not copy through a terminal.', { ok: false }); return; }
    makeSay('Converting ' + dump.controls.length + ' controls…');
    const conv = MAKE_CONVERT(dump, MAKE_KIT, MAKE_MAP, MAKE_EXTRA, dump.title || 'Make screen');
    makeSay('Building ' + conv.controls + ' controls as SAP kit components…');
    const built = await RUN_TREE(FULL_KIT, conv.tree);
    if (typeof built === 'string') { makeSay('Build error: ' + built, { ok: false }); return; }
    const warn = conv.warn.concat(Array.isArray(built.WARN) ? built.WARN : []);
    let placed = 0;
    const data = dump.imageData || {};
    const logos = conv.images.filter(function (im) { return data[im.src]; }).map(function (im) { return { name: im.element, pngBase64: String(data[im.src]).replace(/^data:[^,]*,/, '') }; });
    if (logos.length) { makeSay('Placing ' + logos.length + ' image(s)…'); placed = await placeTreeLogos(built.nodeId, logos); }
    try { await showNode(built.nodeId); } catch (_) {}
    makeSay('Done in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s · ' + built.made + ' layers' + (placed ? ' · ' + placed + ' image(s)' : ''),
      { ok: true, nodeId: built.nodeId, made: built.made, warn: warn, ms: Date.now() - t0 });
  } catch (err) {
    makeSay('Build failed: ' + (err && err.message ? err.message : String(err)), { ok: false });
  } finally {
    treeBusy = false;
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
    case 'make-dump': await makeBuild(msg.json); break;
    case 'show-node': if (msg.nodeId) await showNode(msg.nodeId); break;
    case 'resize':
      figma.ui.resize(340, Math.max(240, Math.min(760, Math.round(msg.height))));
      break;
    case 'unpair':
      send({ type: 'error', message: 'Nothing to do: SAP Bridge pairs once and reconnects by itself. Only to connect a different Figma (another computer), ask Claude: node build/mailbox.js unpair' });
      break;
    default: break;
  }
};
