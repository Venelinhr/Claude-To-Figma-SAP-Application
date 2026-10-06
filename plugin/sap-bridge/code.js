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
const RUNTIME_VER = 'b97009aedc';
function _createAutoLayout(dir, o) {
  if (typeof figma.createAutoLayout === 'function') return figma.createAutoLayout(dir, o);
  const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.fills = []; f.clipsContent = false; if (o && o.name) f.name = o.name; if (o && o.itemSpacing != null) f.itemSpacing = o.itemSpacing;
  return f;
}
async function RUN_TREE(KIT, TREE) {
function _G(fn){ return function(x){ try { return fn(x); } catch (e) { return false; } }; }   // a lookup inside a broken kit part returns false instead of throwing (Make → Figma, 2026-10-05)
async function _mcSafe(n){ try { return await n.getMainComponentAsync(); } catch (e) { return null; } }
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
// A kit set with "existing errors" in Figma refuses componentProperties / setProperties. Then the kit's own definitions (KIT.d,
// a checksummed export of the real kit) drive the fallback: variants by swapping to the matching child of the set, text by
// writing the bound text layer, booleans by toggling the bound layer, icons by swapping the nested icon instance. No guessing.
function _kitDefs(kitName) {
  const raw = KIT.d && KIT.d[kitName]; if (!raw) return null; const defs = {};
  for (const [k, v] of Object.entries(raw)) {
    const t = v[0], body = v.slice(2);
    if (t === 'V') { const [def, opts] = body.split('|'); defs[k] = { type: 'VARIANT', defaultValue: def, variantOptions: opts.split(',') }; }
    else if (t === 'B') defs[k] = { type: 'BOOLEAN', defaultValue: body === 'true' };
    else if (t === 'T') defs[k] = { type: 'TEXT', defaultValue: body };
    else if (t === 'I') defs[k] = { type: 'INSTANCE_SWAP', defaultValue: body.split(' ')[0] };
    else defs[k] = { type: 'TEXT', defaultValue: body };
  }
  return defs;
}
function _boundLayer(inst, propKey, type) {   // the layer a component property drives (text / boolean / icon)
  const want = type === 'TEXT' ? 'characters' : type === 'BOOLEAN' ? 'visible' : 'mainComponent';
  const base = propKey.split('#')[0];          // a broken set carries a different "#id" per variant — match on the name part
  return inst.findOne(n => { const r = n.componentPropertyReferences; return !!(r && r[want] && (r[want] === propKey || r[want].split('#')[0] === base)); });
}
async function _setViaKit(inst, kitName, props) {
  const defs = _kitDefs(kitName); if (!defs) { WARN.push(`${inst.name}: kit pack has no definitions for "${kitName}" — add it with kit.js pack`); return inst; }
  const byNorm = {}; for (const k of Object.keys(defs)) byNorm[_norm(k)] = k;
  const mc = await inst.getMainComponentAsync(); const set = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  const cur = {}; if (mc) for (const part of mc.name.split(',')) { const [k, v] = part.split('='); if (v !== undefined) cur[k.trim()] = v.trim(); }
  const variants = {};
  for (const [name, val] of Object.entries(props)) {
    const real = defs[name] ? name : byNorm[_norm(name)];
    if (!real) { WARN.push(`${inst.name}: no prop "${name}" in the kit (has: ${Object.keys(defs).map(_norm).join(', ')})`); continue; }
    const d = defs[real];
    if (d.type === 'VARIANT') {
      const v = String(val), hit = d.variantOptions.find(o => o.toLowerCase() === v.toLowerCase());
      if (!hit) { WARN.push(`${inst.name}.${real}: "${v}" not in [${d.variantOptions.join(', ')}]`); continue; }
      variants[real] = hit;
    } else if (d.type === 'TEXT') {
      const t = _boundLayer(inst, real, 'TEXT'); if (!t) { WARN.push(`${inst.name}.${real}: no text layer bound to it`); continue; }
      for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName); t.characters = String(val);
    } else if (d.type === 'BOOLEAN') {
      const l = _boundLayer(inst, real, 'BOOLEAN'); if (!l) { WARN.push(`${inst.name}.${real}: no layer bound to it`); continue; } l.visible = !!val;
    } else if (d.type === 'INSTANCE_SWAP') {
      const key = /^[0-9a-f]{40}$/.test(val) ? val : _k('i', val); if (!key) continue;
      const l = _boundLayer(inst, real, 'INSTANCE_SWAP'); if (!l || l.type !== 'INSTANCE') { WARN.push(`${inst.name}.${real}: no icon instance bound to it`); continue; }
      const c = await _imp('c', key); l.swapComponent(c.type === 'COMPONENT_SET' ? c.defaultVariant : c);
    }
  }
  if (Object.keys(variants).length) {
    if (!set) { WARN.push(`${inst.name}: variant props given but the instance is not from a component set`); return inst; }
    const want = Object.assign({}, cur, variants);
    const target = set.children.find(c => { const m = {}; for (const part of c.name.split(',')) { const [k, v] = part.split('='); if (v !== undefined) m[k.trim()] = v.trim(); }
      return Object.keys(want).every(k => (m[k] || '').toLowerCase() === want[k].toLowerCase()); });
    if (!target) { WARN.push(`${inst.name}: the kit has no variant ${JSON.stringify(want)}`); return inst; }
    inst.swapComponent(target);
  }
  return inst;
}
async function setP(inst, props, kitName) {
  let defs; try { defs = inst.componentProperties; }
  catch (e) { return _setViaKit(inst, kitName || inst.getPluginData('kit') || inst.name, props); }
  const byNorm = {};
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
      try { rest[real] = (await _imp('c', key)).id; } catch (e) { WARN.push(`${inst.name}.${real}: icon "${val}" could not be imported (${String(e.message).slice(0, 50)})`); }
    } else rest[real] = d.type === 'BOOLEAN' ? !!val : String(val);
  }
  if (Object.keys(variants).length) {
    try { inst.setProperties(variants); }
    catch (e) {
      for (const [k, v] of Object.entries(variants)) {
        try { inst.setProperties({ [k]: v }); }
        catch (e2) { WARN.push(`${inst.name}.${k}: setProperties failed for "${v}" — ${e2.message || e2}`); }
      }
    }
  }
  if (Object.keys(rest).length) inst.setProperties(rest);
  return inst;
}
async function I(name, props = {}, layerName) {
  const key = _k('c', name); if (!key) return null;
  let n; try { n = await _imp('c', key); } catch (e) { WARN.push(`kit part "${name}" is not published in the library: skipped`); return null; }
  const inst = (n.type === 'COMPONENT_SET' ? n.defaultVariant : n).createInstance();
  if (layerName) inst.name = layerName;
  try { inst.setPluginData('kit', name); } catch (e) {}   // remembered so a later setP can find KIT.d[name] without a live read
  return setP(inst, props, name);
}
function sub(inst, layerName) { return inst.findOne(_G(n => n.type === 'INSTANCE' && n.name === layerName)); }
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
let _made = 0, _noIco = 0;
async function _icon(name, colour) {
  const key = _k('i', name); if (!key) return null;
  let c; try { c = await _imp('c', key); } catch (e) { WARN.push(`icon "${name}" could not be imported (${String(e.message).slice(0, 50)})`); return null; }
  const inst = (c.type === 'COMPONENT_SET' ? c.defaultVariant : c).createInstance();
  inst.name = name;
  if (colour) for (const v of inst.findAll(_G(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION'))) if (v.fills && v.fills.length) await fill(v, colour);
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
    if (Array.isArray(o.dash) && o.dash.length) { try { node.dashPattern = o.dash; } catch (e) { WARN.push(`${o.n}: dash — ${e.message}`); } }
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
async function _tick() { try { await new Promise(r => setTimeout(r, 150)); } catch (e) { try { await figma.getNodeByIdAsync('0:1'); } catch (e2) {} } }
async function _nav(sn, items) {
  // Figma keeps nested instance nodes valid only inside one synchronous pass, and a nested swap (icon, variant) renews its siblings' ids.
  // So: A = every text / selected / visibility change in ONE sync pass (no await); B = icons, one item at a time with a pause + a fresh find; C = variant swaps last.
  const find = () => sn.findOne(_G(x => x.name === '⿻ Navigation Items'));
  const slot = find(); if (!slot) { WARN.push('Side Navigation: no items slot'); return; }
  const kids0 = slot.children.filter(c => c.type === 'INSTANCE'), plain = []; let base = null;
  for (const c of kids0) { const m = await _mcSafe(c), ok = !!(m && /Type=Navigation Item/.test(m.name)); plain.push(ok); if (!base && ok && Math.round(c.height) <= 34) base = m; }
  const iconId = [];
  for (const d of items) { let id = null; if (d.icon) { const ik = _k('i', d.icon); if (ik) { try { id = (await _imp('c', ik)).id; } catch (e) { WARN.push('nav icon ' + d.icon + ': ' + String(e.message).slice(0, 50)); } } } iconId.push(id); }
  for (const t of sn.findAll(_G(n => n.type === 'TEXT'))) { try { const f = t.fontName; if (f !== figma.mixed) await figma.loadFontAsync(f); } catch (e) {} }
  const nth = i => { const sl = find(); return sl ? sl.children.filter(c => c.type === 'INSTANCE')[i] : null; };
  const done = [];
  for (let i = 0; i < kids0.length; i++) {                                                  // A (no await inside)
    try {
      const it = nth(i); if (!it) continue;
      if (i >= items.length) { it.visible = false; continue; }
      const d = items[i], p = {};
      for (const k of Object.keys(it.componentProperties)) { if (k.startsWith('✏️ Text#')) p[k] = d.text; if (k === 'Selected') p[k] = d.selected ? 'True' : 'False'; if (k === 'Expanded') p[k] = 'True'; }
      it.setProperties(p); done.push(i);
    } catch (e) { WARN.push('nav item ' + i + ': text skipped (' + String(e.message).slice(0, 60) + ')'); }
  }
  try { const foot = sn.findOne(_G(x => x.name === '⿻ Footer')); if (foot) foot.children.forEach(c => { c.visible = false; }); const fr = sn.findOne(_G(x => x.name === 'Footer')); if (fr) fr.visible = false; } catch (e) { WARN.push('nav footer: skipped'); }
  for (const i of done) {                                                                   // B: icons
    if (!iconId[i]) continue;
    for (let at = 0; at < 3; at++) {
      try { await _tick(); const it = nth(i); const k = Object.keys(it.componentProperties).find(x => x.startsWith('Icon#')); if (k) it.setProperties({ [k]: iconId[i] }); break; }
      catch (e) { if (at === 2) WARN.push('nav item ' + i + ': icon skipped (' + String(e.message).slice(0, 50) + ')'); }
    }
  }
  for (const i of done) {                                                                   // C: a group / child sample item becomes a plain item
    if (plain[i] || !base) continue;
    try { await _tick(); const it = nth(i); it.swapComponent(base); await _tick(); const it2 = nth(i), p = {}; for (const k of Object.keys(it2.componentProperties)) { if (k.startsWith('✏️ Text#')) p[k] = items[i].text; if (k === 'Selected') p[k] = items[i].selected ? 'True' : 'False'; if (k === 'Expanded') p[k] = 'True'; } it2.setProperties(p); }
    catch (e) { WARN.push('nav item ' + i + ': swap skipped (' + String(e.message).slice(0, 50) + ')'); }
  }
}
async function _avatar(sb, initials) {
  const av = sb.findOne(_G(x => x.type === 'INSTANCE' && x.name === 'Avatar')); if (!av) { WARN.push('Shell Bar: no avatar'); return; }
  const ik = Object.keys(av.componentProperties).find(k => k.startsWith('✏️ Initials#'));
  try { av.setProperties({ Type: 'Initials', Color: '6', ...(ik ? { [ik]: initials } : {}) }); } catch (e) { WARN.push('avatar: ' + e.message); }
}
async function _seg(n, segs) {                                     // the kit Segmented Button: one slot of segments (text, icon, toggled), sharing the width
  const slot = n.findOne(_G(x => x.type === 'SLOT'));
  if (!slot) { WARN.push('Segmented Button: no segment slot'); return; }
  const parts = slot.children.filter(x => x.visible);
  for (let i = 0; i < segs.length && i < parts.length; i++) {
    const s = segs[i], p = parts[i];
    await setP(p, { Toggled: s.on ? 'True' : 'False' }, 'Segmented Button Singular');
    const t = p.findOne(_G(x => x.type === 'TEXT'));
    if (t && s.t) { for (const g of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(g.fontName); t.characters = s.t; }
    if (s.ic) {
      if (s.t) await setP(p, { 'Icon Left': true }, 'Segmented Button Singular');
      const ik = _k('i', s.ic), si = p.findOne(_G(x => x.type === 'INSTANCE' && x.name === 'Icon'));
      if (ik && si) { try { const ic = await _imp('c', ik); si.swapComponent(ic.type === 'COMPONENT_SET' ? ic.defaultVariant : ic); } catch (e) { WARN.push('segment icon "' + s.ic + '": ' + String(e.message).slice(0, 40)); } }
    }
    try { p.layoutGrow = 1; } catch (e) {}
  }
  try { slot.layoutSizingHorizontal = 'FILL'; } catch (e) { WARN.push('Segmented Button: ' + String(e.message).slice(0, 50)); }
}
async function _dd(n, items, h) {                                  // the kit Drop-Down: its item slot holds 5 options — set text and chosen one, hide the unused, add more when needed
  const slot = n.findOne(_G(x => x.type === 'SLOT'));
  if (!slot) { WARN.push('Drop-Down: no item slot'); return; }
  let its = slot.children.filter(x => x.type === 'INSTANCE');
  while (its.length && its.length < items.length) { try { const c = its[its.length - 1].clone(); slot.appendChild(c); its = slot.children.filter(x => x.type === 'INSTANCE'); } catch (e) { WARN.push('Drop-Down: could not add an option'); break; } }
  for (let i = 0; i < its.length; i++) {
    if (i >= items.length) { its[i].visible = false; continue; }
    try { await setP(its[i], { '✏️ 1st Column': items[i].t, Selected: items[i].on ? 'True' : 'False' }, 'Drop-Down Item'); } catch (e) { WARN.push('Drop-Down option "' + items[i].t + '": ' + String(e.message).slice(0, 50)); }
  }
  if (h) { try { n.resize(n.width, h); } catch (e) {} }
}
async function NODE(o, parent, par) {
  let n;
  if (o.k === 't') {
    n = await T(o.t, o.st, _ok(o.bg) ? o.bg : null, { name: o.n });
    if (o.bg && !_ok(o.bg)) _raw(n, o.bg);
    if (o.ta) n.textAlignHorizontal = { C: 'CENTER', R: 'RIGHT', J: 'JUSTIFIED' }[o.ta];
    if (o.wrap || (o.ta && (o.s || '')[0] === 'X')) { n.textAutoResize = 'HEIGHT'; n.resize(o.w, n.height); }
    if (o.ml) { try { n.textTruncation = 'ENDING'; n.maxLines = o.ml; } catch (e) { WARN.push('max lines: ' + e.message); } }   // Make shows at most ml lines, then "…"   // aligned text keeps its box
  } else if (o.k === 'i') {
    n = await I(o.cp, o.pr || {}, o.n); if (!n) return null;
    if (o.nav) await _nav(n, o.nav);                                 // Side Navigation: the slot's items become the app's items
    if (o.av) await _avatar(n, o.av);                                // Shell Bar: avatar initials
    for (const [layer, iname] of Object.entries(o.ico || {})) {                  // the app's own icon in a nested icon instance
      const ik = _k('i', iname); if (!ik) continue; const si = n.findOne(_G(x => x.type === 'INSTANCE' && x.name === layer));
      if (!si) { _noIco++; continue; }                                                  // this kit status (state None) has no icon slot
      try { const ic = await _imp('c', ik); si.swapComponent(ic.type === 'COMPONENT_SET' ? ic.defaultVariant : ic); } catch (e) { WARN.push(`${o.n}: icon "${iname}" swap skipped (${String(e.message).slice(0, 40)})`); }
    }
    for (const [layer, add] of Object.entries(o.shift || {})) {                  // push an inner container right (room for an icon the kit part has no slot for)
      const fr = n.findOne(_G(x => x.name === layer)); if (fr && 'paddingLeft' in fr) { try { fr.paddingLeft = fr.paddingLeft + add; } catch (e) { WARN.push(`${o.n}: could not shift "${layer}"`); } } else WARN.push(`${o.n}: no layer "${layer}" to shift`);
    }
    for (const nm of (o.hide || [])) { const h = n.findOne(_G(x => x.name === nm)); if (h) h.visible = false; else WARN.push(`${o.n}: no layer "${nm}" to hide`); }   // e.g. the kit's sample tokens
    for (const nm of (o.fade || [])) { const h = n.findOne(_G(x => x.type === 'INSTANCE' && x.name === nm)); if (h) h.opacity = 0; }   // a glyph Make did not draw: its room stays, nothing shows
    for (const nm of (o.fit || [])) { const t = n.findOne(_G(x => x.type === 'TEXT' && x.name === nm)); if (t) { try { t.textAutoResize = 'WIDTH_AND_HEIGHT'; } catch (e) {} } }   // text that must not wrap in a narrow kit part
    if (o.seg) await _seg(n, o.seg);
    if (o.dd) await _dd(n, o.dd, o.h);
    for (const a of (o.add || [])) {                               // text put into a kit slot (e.g. the placeholder of an empty Multi Combobox)
      const slot = n.findOne(_G(x => x.name === a.into));
      if (!slot || !('appendChild' in slot)) { WARN.push(`${o.n}: no slot "${a.into}" for the text`); continue; }
      try { const t = await T(a.t, a.st, _ok(a.bg) ? a.bg : null, { name: a.t.slice(0, 28) }); slot.appendChild(t); } catch (e) { WARN.push(`${o.n}: slot text: ${e.message}`); }
    }
    for (const [nm, pr] of Object.entries(o.sub || {})) {          // properties of a nested instance (e.g. the Input inside a Multi Combobox)
      const si = n.findOne(_G(x => x.type === 'INSTANCE' && x.name === nm));
      if (!si) { WARN.push(`${o.n}: no nested instance "${nm}"`); continue; }
      const defs = si.componentProperties, p = {};
      for (const [k, v] of Object.entries(pr)) { const key = Object.keys(defs).find(d => d === k || d.split('#')[0] === k); if (key) p[key] = v; else WARN.push(`${o.n}/${nm}: no property "${k}"`); }
      try { si.setProperties(p); } catch (e) { WARN.push(`${o.n}/${nm}: ${e.message}`); }
    }
    for (const [nm, ch] of Object.entries(o.tx || {})) {           // text typed inside the instance
      let t;
      if (nm === '@first' || nm === '@last') { const all = n.findAll(_G(x => x.type === 'TEXT' && x.visible)); t = nm === '@first' ? all[0] : all[all.length - 1]; }
      else if (nm === '@lastLabel') { const all = n.findAll(_G(x => x.type === 'TEXT' && x.name === 'Label:')); t = all[all.length - 1]; }
      else t = n.findOne(_G(x => x.type === 'TEXT' && x.name === nm));
      if (!t) { WARN.push(`${o.n}: no inner text "${nm}"`); continue; }
      for (const f of t.characters.length ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName]) await figma.loadFontAsync(f);
      t.characters = String(ch);
    }
  } else if (o.k === 'ic') {
    n = await _icon(o.ic, _ok(o.bg) ? o.bg : null); if (!n) return null;
    n.name = o.n;
    { const M = Math.max(o.w || 0, o.h || 0); if (M && Math.abs(n.width - M) > 0.5) n.rescale(M / n.width); }   // rescale keeps the icon's shape; resize distorts it (longer side: a 12×20 icon box must not shrink a square icon)
  } else if (o.k === 'r') {
    n = o.el ? figma.createEllipse() : figma.createRectangle(); n.name = o.n;
    n.resize(Math.max(0.01, o.w || 1), Math.max(0.01, o.h || 1)); await _paintNode(n, o);
  } else if (o.k === 'v') {
    n = figma.createNodeFromSvg(o.svg); n.name = o.n; n.fills = [];
    const t = o.bg || o.bc;
    for (const v of n.findAll(_G(x => x.type === 'VECTOR'))) { if (_ok(t)) { if (v.fills.length) await fill(v, t); if (v.strokes.length) await stroke(v, t); } else if (t) _raw(v, t); }
  } else {
    n = o.d ? _createAutoLayout(o.d === 'H' ? 'HORIZONTAL' : 'VERTICAL') : figma.createFrame();
    n.name = o.n;
    if (o.d) {
      n.itemSpacing = o.g || 0;
      const p = Array.isArray(o.p) ? o.p : [o.p || 0, o.p || 0, o.p || 0, o.p || 0];
      [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft] = p;
      const a = o.a || 'MM'; n.primaryAxisAlignItems = _AL[a[0]]; n.counterAxisAlignItems = a[1] === 'S' ? 'MIN' : _AL[a[1]];
      n.strokesIncludedInLayout = false;
      if (o.wrapRow) { try { n.layoutWrap = 'WRAP'; n.counterAxisSpacing = o.cg || 0; } catch (e) { WARN.push('wrap: ' + e.message); } }   // Make's flex-wrap row: re-wraps with the frame
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
  if (_noIco) WARN.push(`${_noIco} status(es) have an icon in Make that the kit's plain status (state None) cannot show`);
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
    const p = {}; let cpr = {}; try { cpr = n.componentProperties; } catch (_) { try { cpr = n.variantProperties || {}; for (const k in cpr) cpr[k] = { type: 'VARIANT', value: cpr[k] }; } catch (__) { cpr = {}; } }   // a kit set with errors throws here (2026-10-04) — the dump must not die
    for (const [k, v] of Object.entries(cpr)) if (v.type === 'VARIANT') p[k] = v.value;
    out.push({ ...base, component: s ? s.name : '', props: p, h: Math.round(n.height) });
  } else if ('fills' in n) {
    const fill = await tok(n.fills), stroke = 'strokes' in n ? await tok(n.strokes) : '';
    if (fill || stroke) out.push({ ...base, image: fill === 'IMAGE', fill, stroke });
  }
}
return out;
}
// ── end GENERATED RUNTIME ──

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

// For the Figma Agent: write the runtime, the tools and the gold trees into THIS file once (build/v6pack.js, served at /v6/pack),
// so the Agent types ~400 chars per call. Skipped when the stored version is current. Data only — no code is built here.
let v6CheckedFor = '';
async function installV6(fileKey) {
  if (v6CheckedFor === fileKey) return;
  v6CheckedFor = fileKey;
  const have = figma.root.getSharedPluginData(NS, 'v6_ver') || '';
  const r = await api('/v6/pack?' + qs({ ver: have }));
  if (r.status !== 200 || !r.json || r.json.current || !r.json.ver) return;
  const pk = r.json, names = Object.keys(pk.golds || {});
  const keys = figma.root.getSharedPluginDataKeys(NS);
  for (let i = 0; i < keys.length; i++) if (keys[i].indexOf('gold_') === 0 && names.indexOf(keys[i].slice(5)) < 0) figma.root.setSharedPluginData(NS, keys[i], '');
  figma.root.setSharedPluginData(NS, 'v6rt', pk.rt);
  figma.root.setSharedPluginData(NS, 'v6tools', pk.tools);
  figma.root.setSharedPluginData(NS, 'v6build', pk.build);
  for (let i = 0; i < names.length; i++) figma.root.setSharedPluginData(NS, 'gold_' + names[i], pk.golds[names[i]]);
  figma.root.setSharedPluginData(NS, 'v6_ver', pk.ver);
  figma.notify('Installed for the Figma Agent (' + names.length + ' screens)', { timeout: 4000 });
}

async function treePoll() {
  if (treeBusy) { treePollTimer = later(treePoll, 500); return; }
  if (!token) { treePollTimer = later(treePoll, 3000); return; }
  const fileKey = fileKeyNow('');
  if (!fileKey) { treePollTimer = later(treePoll, 3000); return; }
  try { await installV6(fileKey); } catch (_) {}
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
  if (job.payload && job.payload.rename) {          // a one-line rename (build/rename.js) — the model no longer spends a turn on it
    try { const rn = await figma.getNodeByIdAsync(job.payload.rename.nodeId); if (!rn) throw new Error('no node ' + job.payload.rename.nodeId); rn.name = String(job.payload.rename.name); await post({ ok: true, nodeId: rn.id, renamed: rn.name, WARN: [], ms: Date.now() - t0 }); }
    catch (err) { await post({ ok: false, error: 'rename failed: ' + (err && err.message ? err.message : String(err)), WARN: [], ms: Date.now() - t0 }); }
    return;
  }
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
  // the request also lives in the file, so the Figma Agent chat can pick it up with one word: "go" (skill router step 0)
  try { figma.root.setSharedPluginData(NS, 'mbx_request', JSON.stringify({ text: cleanText, mode: msg.mode === 'agent' ? 'agent' : 'claude', at: Date.now() })); } catch (_) {}
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
    case 'open-log': { const r = await api('/job/open-log', { method: 'POST', body: { jobId: msg.jobId } }); send({ type: 'log-opened', copy: msg.copy !== false, jobId: msg.jobId, text: r.json && r.json.text || '', ok: r.status === 200, error: r.json && r.json.error || (r.status === 0 ? 'bridge not reachable' : '') }); break; }
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
