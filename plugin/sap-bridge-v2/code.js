// SAP Bridge v4 — plugin main thread. Contract: bridge/README.md (Protocol v1).
const SAP_AGENT_RULES = 'Build this as a real SAP Fiori screen (SAP Horizon theme, light, Compact density, desktop). Use ONLY instances of the SAP Web UI Kit components that are in this file\'s libraries (Shell Bar, Side Navigation, Dynamic Page / Page Header, Filter Bar, Panel, Table, List, Card, Button — one Emphasized per area —, Link, Input, Select, Search Field, Date Picker, Check Box, Radio Button, Switch, Range Slider, Segmented Button, Icon Tab Bar, Object Status, Message Strip, SAP icons). Bind every colour to the SAP variables (sap*), every text to the SAP text styles (72 font). Auto-layout everywhere, real content, no plain rectangles that imitate a control, no screenshots or cut images except logos and photos.\n\nRequest: ';
// documentAccess is dynamic-page → only async node APIs.

let BASE = 'http://localhost:41778';   // the bridge may run on a later port (41778–41788): healthCheck finds it by itself
const BRIDGE_PORTS = [41778, 41780, 41781, 41782, 41783, 41784, 41785, 41786, 41787, 41788];   // 41779 is the Make bridge
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

// ── error log (a small ring buffer: nothing fails silently, the UI can show the last errors) ──
const ERRLOG = [];
const BUILDLOG = [];   // the Make status lines of the last builds
function E(where, e) {
  try {
    const w = String(where || ''), m = String((e && e.message) || e).slice(0, 160), last = ERRLOG[ERRLOG.length - 1];
    if (last && last.where === w && last.msg === m) { last.t = Date.now(); return; }   // the same error again: one row
    ERRLOG.push({ t: Date.now(), where: w, msg: m });
    if (ERRLOG.length > 80) ERRLOG.shift();
  } catch (_) {}
}
// one fetch with a time limit. It never throws: {status, json}; status 0 = no answer (timeout: true when too slow)
async function fetchT(url, init, ms, quiet) {
  let timer = null, timedOut = false;
  const run = (async function () {
    const resp = await fetch(url, init || {});
    let json = null;
    try { json = await resp.json(); } catch (e) { /* the answer has no JSON body */ }
    return { status: resp.status, json: json };
  })();
  const limit = new Promise(function (res) { timer = setTimeout(function () { timedOut = true; res({ status: 0, json: null, timeout: true }); }, ms || 12000); });
  try { return await Promise.race([run, limit]); }
  catch (e) { if (!quiet) E('fetch', e); return { status: 0, json: null }; }
  finally { clearTimeout(timer); if (timedOut) run.catch(function () {}); }
}
let bridgePaths = null;   // {root, makeCtl, makeDir, makePair} from the SAP bridge /health (absent on an old bridge)
function makeCtlText(verb) {
  const c = bridgePaths && bridgePaths.makeCtl;
  return c ? 'Run in Terminal: node "' + c + '" ' + verb : 'In the "Figma Make" folder run: node make-figma/ctl.js ' + verb;
}
function makePairText() {
  const p = bridgePaths && bridgePaths.makePair;
  return p ? 'rm "' + p + '"' : 'delete the file make-figma/.pair.json in the "Figma Make" folder';
}
let healthTimer = null, healthTicking = false, mbxTimer = null, mbxTicking = false, fastHealthUntil = 0, sapUp = false, sapBusy = false;

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
  const r = await fetchT(url, init, (opts && opts.timeout) || 12000, true);
  if (r.timeout) E('api timeout ' + path.split('?')[0], 'no answer in time');
  return { status: r.status, json: r.json };
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
figma.showUI(__html__, { width: 400, height: 280, themeColors: true });
figma.root.setRelaunchData({ open: 'Build SAP screens with Claude' });

(async function init() {
  token = (await figma.clientStorage.getAsync('sapBridgeToken')) || null;
  lastJobId = figma.root.getPluginData('lastJobId') || null;
  jobStartedAt = Number(figma.root.getPluginData('lastJobStartedAt')) || null;
  sendSelection();
  sendHistory(true);
  try { bridgePaths = JSON.parse((await figma.clientStorage.getAsync('sapBridgePaths')) || 'null'); } catch (e) { E('init', e); }
  healthTick();
  inboxPoll();
  mbxTick();
  treePoll();
})();

// ─── find Claude, pair by itself ───────────────────────────────────────────
// ask every port of the range in parallel; the first answer of an SAP Bridge wins (each probe is cut after 800 ms)
async function scanBridge() {
  const probe = async p => {
    try {
      const resp = await Promise.race([fetch('http://localhost:' + p + '/health'), new Promise((_, no) => setTimeout(() => no(new Error('t')), 800))]);
      const j = await resp.json(); return j && j.app === 'sap-v4-bridge' ? p : 0;
    } catch (_) { return 0; }
  };
  const hits = (await Promise.all(BRIDGE_PORTS.map(probe))).filter(Boolean);
  return hits[0] || 0;
}
async function restartBridge() {   // the popover's "Restart server": the bridge restarts itself (launchctl / detached)
  const r = await api('/bridge/restart', { method: 'POST', body: {} });
  send({ type: 'bridge-restart', ok: r.status === 200 });
  setTimeout(function () { BASE = 'http://localhost:41778'; healthCheck(); }, 2500);
}
async function sapProbe() {
  let r = await api('/health', { timeout: 4000 });
  if (r.status === 0) {                                  // not on this port: look on the others, remember the one that answers
    const p = await scanBridge();
    if (p) { BASE = 'http://localhost:' + p; r = await api('/health', { timeout: 4000 }); }
  }
  return r;
}
function rememberPaths(p) {
  try {
    if (!p || typeof p !== 'object' || JSON.stringify(p) === JSON.stringify(bridgePaths)) return;
    bridgePaths = p;
    figma.clientStorage.setAsync('sapBridgePaths', JSON.stringify(p));
  } catch (e) { E('rememberPaths', e); }
}
async function healthCheck() {
  const r = await sapProbe();
  if (r.status !== 0) globalThis.__sapBridgeBase = BASE;   // the Make helpers talk to the SAP bridge too
  if (r.status === 0) { sapUp = false; send({ type: 'status', value: 'looking' }); return; }
  const j = r.json;
  if (!j || j.app !== 'sap-v4-bridge') { sapUp = false; send({ type: 'status', value: 'wrong-bridge' }); return; }
  if (j.paths) rememberPaths(j.paths);
  sapBusy = !!j.busy;
  if (!token) { await doPair(); if (!token) { sapUp = false; return; } }
  sapUp = true;
  send({ type: 'status', value: 'connected', repo: j.repo, branch: j.branch, model: j.model, busy: j.busy, port: Number(BASE.split(':').pop()) });
  if (!everConnected) { everConnected = true; reopenLastJob(); }
}
// the checks run fast (3 s) while it matters: not connected, a job / build is running, or the info popover is open; else slow (10 s)
function makeBusyNow() { try { return !!MAKESA.busy(); } catch (_) { return false; } }   // MAKESA may not exist yet (first tick)
function healthDelay() {
  return (!sapUp || sapBusy || followingJobId || watchJobId || treeBusy || makeBusyNow() || Date.now() < fastHealthUntil) ? 3000 : 10000;
}
async function healthTick() {
  if (healthTicking) return;
  healthTicking = true; clearTimeout(healthTimer);
  try { await healthCheck(); } catch (e) { E('healthTick', e); }
  healthTicking = false;
  healthTimer = setTimeout(healthTick, healthDelay());
}
function kickHealth() { fastHealthUntil = Date.now() + 30000; clearTimeout(healthTimer); healthTick(); }
async function mbxTick() {
  if (mbxTicking) return;
  mbxTicking = true; clearTimeout(mbxTimer);
  try { await checkMbxDone(); } catch (e) { E('mbxTick', e); }
  mbxTicking = false;
  mbxTimer = setTimeout(mbxTick, watchJobId ? 2000 : 8000);
}
function kickMbx() { clearTimeout(mbxTimer); mbxTick(); }

// ── health report for the info popover ──
function verNum(v) { const a = String(v || '').split('.').map(Number); return (a[0] || 0) * 1e6 + (a[1] || 0) * 1e3 + (a[2] || 0); }
async function buildHealthReport() {
  const items = [];
  try {
    const r = await sapProbe(), j = r.json;
    if (r.status === 0) items.push({ id: 'bridge', label: 'SAP bridge', state: 'bad', detail: 'No answer on ports 41778–41788.', fix: { id: 'restart-bridge', label: 'Restart' } });
    else if (!j || j.app !== 'sap-v4-bridge') items.push({ id: 'bridge', label: 'SAP bridge', state: 'warn', detail: 'Another program answers on port ' + BASE.split(':').pop() + (j && j.app ? ' (' + j.app + ')' : '') + '.' });
    else items.push({ id: 'bridge', label: 'SAP bridge', state: 'ok', detail: 'Port ' + BASE.split(':').pop() + (j.model ? ' · ' + j.model : '') + (j.branch ? ' · ' + j.branch : '') });
  } catch (e) { E('healthReport bridge', e); items.push({ id: 'bridge', label: 'SAP bridge', state: 'bad', detail: 'The check failed.', fix: { id: 'restart-bridge', label: 'Restart' } }); }
  let ms = { state: 'down' };
  try { ms = await MAKESA.status(); } catch (e) { E('healthReport make', e); }
  if (ms.state === 'down') items.push({ id: 'make-bridge', label: 'Make bridge', state: 'bad', detail: 'Not running.', fix: { id: 'start-make-bridge', label: 'Start' } });
  else if (ms.state === 'other') items.push({ id: 'make-bridge', label: 'Make bridge', state: 'warn', detail: 'Port 41779 is used by another program (' + ms.what + ').' });
  else if (ms.other) {
    const pp = bridgePaths && bridgePaths.makePair;
    const it = { id: 'make-bridge', label: 'Make bridge', state: 'warn', detail: 'Paired with another plugin. ' + (pp ? 'Free it once.' : 'Free it once: ' + makePairText() + '.') };
    if (pp) it.fix = { id: 'copy-cmd', label: 'Copy command', cmd: 'rm "' + pp + '"' };
    items.push(it);
  }
  else if (!ms.paired) items.push({ id: 'make-bridge', label: 'Make bridge', state: 'warn', detail: 'Port ' + ms.port + ' · not paired yet. It pairs when you send a link.' });
  else items.push({ id: 'make-bridge', label: 'Make bridge', state: 'ok', detail: 'Port ' + ms.port + ' · paired' });
  if (ms.state !== 'up') items.push({ id: 'extension', label: 'Chrome extension', state: 'off', detail: 'Needs the Make bridge.' });
  else if (!ms.ext) items.push({ id: 'extension', label: 'Chrome extension', state: 'bad', detail: 'Open Chrome and reload "Make → SAP"' });
  else if (!ms.extVersion || verNum(ms.extVersion) < verNum('2.11.0')) items.push({ id: 'extension', label: 'Chrome extension', state: 'warn', detail: (ms.extVersion ? 'Version ' + ms.extVersion + '. ' : 'Old version. ') + 'Reload it in chrome://extensions' });
  else items.push({ id: 'extension', label: 'Chrome extension', state: 'ok', detail: 'Version ' + ms.extVersion });
  let key = ''; try { key = fileKeyNow(''); } catch (e) { E('healthReport file', e); }
  items.push({ id: 'file', label: 'Figma file', state: key ? 'ok' : 'warn', detail: String(figma.root.name || '') + (key ? '' : ' · no file key') });
  let inf = null; try { inf = MAKESA.info(); } catch (e) { E('healthReport engine', e); }
  items.push({ id: 'engine', label: 'Make engine', state: 'ok', detail: inf ? 'Runtime ' + inf.runtimeVer + ' · converter ' + inf.convKB + ' KB' : 'Loaded' });
  return items;
}
async function sendHealthReport() {
  try { send({ type: 'health-report', items: await buildHealthReport() }); } catch (e) { E('sendHealthReport', e); }
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
    const firstPoll = inboxCursor === 0;
    if (typeof r.json.cursor === 'number') inboxCursor = r.json.cursor;
    const events = r.json.events || [];
    // first poll after the plugin opens = a replay of old notes: show only a run that is still going; finished ones stay in the history (no chat dust)
    let lastRun = -1, runDone = false;
    for (let i = 0; i < events.length; i++) { const dd = events[i].data || {}; if (events[i].type === 'note') { if (/^RUN /.test(dd.text || '')) { lastRun = i; runDone = false; } if (dd.name === 'end') runDone = true; } }
    for (let i = 0; i < events.length; i++) {
      const d = events[i].data || {};
      if (firstPoll && events[i].type === 'note' && (i < lastRun || runDone || lastRun < 0)) { if (d.name === 'end' && d.url) await saveScriptHistory(d); continue; }
      if (events[i].type === 'note') { send({ type: 'note', name: d.name || 'analyse', text: d.text || '', total: d.total || 0, url: d.url || '', block: d.block || '', job: d.job || '' }); if (d.name === 'end' && d.url) await saveScriptHistory(d); continue; }   // a run.js step (scripted build) → the same timeline a Claude job shows
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
  const r = await api('/v6/pack?' + qs({ ver: have }), { timeout: 60000 });
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
  try { await installV6(fileKey); } catch (_) { E('treePoll', _); }
  const r = await api('/tree/next?' + qs({ fileKey: fileKey }), { timeout: 20000 });
  if (r.status === 200 && r.json && r.json.jobId) {
    treeBusy = true;
    // a build that never settles must not block every later build (2026-10-03: the loop stayed busy forever, later jobs timed out)
    try { await Promise.race([runTreeJob(r.json), new Promise(function (ok) { setTimeout(ok, 170000); })]); } catch (_) { E('treePoll', _); }
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
      } catch (_) { E('placeTreeLogos', _); }
    }
  } catch (_) { E('placeTreeLogos', _); }
  return placed;
}

async function runTreeJob(job) {
  const t0 = Date.now();
  const post = function (body) { return api('/tree/result', { method: 'POST', timeout: 60000, body: Object.assign({ jobId: job.jobId || job.id }, body) }); };
  if (job.payload && job.payload.rename) {          // a one-line rename (build/rename.js) — the model no longer spends a turn on it
    try { const rn = await figma.getNodeByIdAsync(job.payload.rename.nodeId); if (!rn) throw new Error('no node ' + job.payload.rename.nodeId); rn.name = String(job.payload.rename.name); await post({ ok: true, nodeId: rn.id, renamed: rn.name, WARN: [], ms: Date.now() - t0 }); }
    catch (err) { await post({ ok: false, error: 'rename failed: ' + (err && err.message ? err.message : String(err)), WARN: [], ms: Date.now() - t0 }); }
    return;
  }
  const cnt = function (n) { let k = 1; if (n && Array.isArray(n.c)) for (const c of n.c) k += cnt(c); return k; };
  let layers = 0; try { layers = cnt(job.payload && job.payload.tree); } catch (_) { E('runTreeJob', _); }
  treeStatus('Reading the plan · ' + layers + ' layers, ' + (job.logos && job.logos.length ? job.logos.length + ' logos' : 'no logos'));
  treeStatus('Building ' + (job.name || 'screen') + ' from SAP kit parts…');
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
  treeStatus('Built · ' + layers + ' layers in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (WARN.length ? ' · ' + WARN.length + ' note(s)' : ''));
  WARN.slice(0, 4).forEach(function (w) { treeStatus('Note · ' + String(w).slice(0, 140)); });
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
  try { await showNode(nodeId); } catch (_) { E('runTreeJob', _); }
}

// ─── selection ─────────────────────────────────────────────────────────────
function imageFill(n) {
  try {
    const fills = n.fills;
    if (!Array.isArray(fills)) return null;
    for (let i = 0; i < fills.length; i++) {
      if (fills[i].type === 'IMAGE' && fills[i].visible !== false && fills[i].imageHash) return fills[i];
    }
  } catch (_) { E('imageFill', _); }
  return null;
}
function nodeInfo(n) {
  return { id: n.id, name: n.name, type: n.type, width: Math.round(n.width || 0), height: Math.round(n.height || 0), isImage: !!imageFill(n) };
}
function sendSelection() { send({ type: 'selection', nodes: figma.currentPage.selection.map(nodeInfo) }); }
figma.on('selectionchange', sendSelection);

// ─── Go ────────────────────────────────────────────────────────────────────
// ─── Figma Agent hand-off: follow the Agent while it works, and press ITS Stop button ───────────
let agentPoll = null, agentFk = '';
function stopAgentPoll() { if (agentPoll) { clearInterval(agentPoll); agentPoll = null; } }
function startAgentPoll(fk) {
  stopAgentPoll(); agentFk = fk; let seen = false, idle = 0, busyCall = false;
  agentPoll = setInterval(async () => {
    if (busyCall) return; busyCall = true;
    try {
      const r = await api('/agent/status', { method: 'POST', body: { fileKey: fk } });
      if (r.status !== 200 || !r.json) return;
      if (r.json.busy) { seen = true; idle = 0; }
      else { idle++; if (seen || idle > 12) { stopAgentPoll(); send({ type: 'agent-finished' }); } }
    } finally { busyCall = false; }
  }, 2000);
}
async function postJob(msg) {
  const text = String(msg.text || '');
  const fileKey = fileKeyNow(text);
  const cleanText = text.replace(/https?:\/\/\S*figma\.com\/(?:design|file|proto|board)\/\S+/g, '').trim();
  if (!fileKey) {
    send({ type: 'error', message: "Figma did not give this file's key. Paste the file link once (Share → Copy link) into the box and press Go." });
    return;
  }
  // the request also lives in the file, so the Figma Agent chat can pick it up with one word: "go" (skill router step 0)
  try { figma.root.setSharedPluginData(NS, 'mbx_request', JSON.stringify({ text: cleanText, mode: msg.mode === 'agent' ? 'agent' : 'claude', at: Date.now() })); } catch (_) { E('postJob', _); }
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
      } catch (_) { E('postJob', _); }
      break;
    }
  }
  if (!cleanText && !image) {
    send({ type: 'error', message: 'File link saved. Now type your request (or select an image) and press Go.' });
    return;
  }
  const selection = sel.filter(function (n) { return n !== imageNode; }).map(nodeInfo);
  const r = await api('/job', { method: 'POST', timeout: 30000, body: {
    fileKey: fileKey, fileName: figma.root.name, text: cleanText, selection: selection, image: image, mode: msg.mode || 'claude', contextJob: String(msg.contextJob || ''),
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
  kickMbx();
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
        } catch (_) { E('handleLogos', _); }
      });
    }
  } catch (_) { E('handleLogos', _); }
  await api('/job/logos-done', { method: 'POST', body: { jobId: d.jobId, placed: placed } });
  send({ type: 'logos-placed', placed: placed });
}

// Work history lives in the file (shared plugin data would be readable by other plugins; plugin data is ours).
const HISTORY_KEY = 'sapBridgeHistory';
function readHistory() {
  try { const h = JSON.parse(figma.root.getPluginData(HISTORY_KEY) || '[]'); return Array.isArray(h) ? h : []; } catch (_) { return []; }
}
// a scripted build (run.js) has no Claude "done": its end note carries the frame link, the request and the job folder → one history row,
// so the clock list opens the frame and copies that job's full log (2026-10-04)
async function saveScriptHistory(d) {
  const m = /node-id=([0-9]+)-([0-9]+)/.exec(String(d.url || '')); if (!m) return;
  const nodeId = m[1] + ':' + m[2];
  let name = 'Screen'; try { const n = await figma.getNodeByIdAsync(nodeId); if (n) name = n.name; } catch (_) { E('saveScriptHistory', _); }
  const isChange = /^Done — change:/.test(String(d.text || ''));   // a change made directly in Figma: its own row, the older rows of this frame stay
  const entry = { jobId: String(d.job || ''), at: Date.now(), name: isChange ? 'Change · ' + name : name, nodeId: nodeId, match: null, eye: null, pass: /^Done/.test(String(d.text || '')),
    mode: 'script', request: isChange ? String(d.text).replace(/^Done — change:\s*/, '').slice(0, 140) : String(d.request || lastRequest.text || '(image)').slice(0, 140), blocks: [], elapsedMs: Number(d.total) || null };
  // the inbox replays old notes when the plugin opens: the same change / build is never stored twice (it keeps its first time)
  const old = readHistory().filter(function (h) { return isChange ? (h.jobId === entry.jobId && h.request === entry.request && /^Change · /.test(h.name || '')) : (h.nodeId === nodeId && !/^Change · /.test(h.name || '')); })[0];
  if (old) { return; }
  const items = isChange ? readHistory() : readHistory().filter(function (h) { return h.nodeId !== nodeId || /^Change · /.test(h.name || ''); });
  items.unshift(entry);
  figma.root.setPluginData(HISTORY_KEY, JSON.stringify(items.slice(0, 30)));
  sendHistory(false);
}
// the frame is renamed after the build (rename.js) — so the history shows the frame's CURRENT name, not the name it had at "done"
async function sendHistory(showLatest) {
  const items = readHistory();
  for (const h of items) {
    if (!h.nodeId) continue;
    if (/^Change · /.test(h.name || '')) continue; try { const n = await figma.getNodeByIdAsync(h.nodeId); if (n && n.name && !/^(Screen|DRAFT)/i.test(n.name)) h.name = n.name; } catch (_) { E('sendHistory', _); }
  }
  send({ type: 'history', items: items, showLatest: !!showLatest });
}

async function handleDone(d) {
  if (d.mode === 'CHAT') { if (d.nodeId) await showNode(d.nodeId); jobStartedAt = null; send({ type: 'done', data: d }); return; }   // a chat answer: show the text, no history row
  const node = d.nodeId ? await showNode(d.nodeId) : null;
  if (node) { try { node.setRelaunchData({ open: 'Build SAP screens with Claude' }); } catch (_) { E('handleDone', _); } }
  let req = lastRequest;
  try { if (!req.text) req = JSON.parse(figma.root.getPluginData('lastRequest') || '{}'); } catch (_) { E('handleDone', _); }
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
    case 'restart-bridge': await restartBridge(); break;
    case 'cancel':
      if (followingJobId || lastJobId) {
        const r = await api('/job/cancel', { method: 'POST', body: { jobId: followingJobId || lastJobId } });
        send({ type: 'cancelled' });   // always end the turn on screen: a job that was already over sends no cancel event of its own (the plugin then hung on "working")
      } else {
        send({ type: 'cancelled' });
      }
      break;
    case 'answer':
      await api('/answer', { method: 'POST', body: { jobId: msg.jobId || followingJobId || lastJobId, text: msg.text } });
      break;
    case 'reopen': await reopenLastJob(); break;
    case 'store-get': { const v = await figma.clientStorage.getAsync('sapV2:' + msg.key); send({ type: 'store', key: msg.key, value: v === undefined ? null : v }); break; }
    case 'store-set': await figma.clientStorage.setAsync('sapV2:' + msg.key, msg.value); break;
    case 'agent-send': {   // a NEW Agent chat starts with the SAP rules (the plugin makes SAP screens only); a follow-up in the same chat does not repeat them   // Agent tab: the bridge opens a new Figma Agent chat and types the request there — no Claude job
      const at = String(msg.text || ''), fk = fileKeyNow(at);
      if (!fk) { send({ type: 'agent-sent', ok: false, error: "Figma did not give this file's key. Paste the file link once (Share → Copy link) and send again." }); break; }
      const tid = /^[0-9a-f-]{36}$/.test(String(msg.threadId || '')) ? String(msg.threadId) : null;   // follow-up → the same Agent chat
      const r = await api('/agent/send', { method: 'POST', timeout: 90000, body: { fileKey: fk, text: (tid ? '' : SAP_AGENT_RULES) + (at.replace(/https?:\/\/\S*figma\.com\/(?:design|file|proto|board)\/\S+/g, '').trim() || at), threadId: tid } });
      if (r.status === 401) { await doPair(); send({ type: 'agent-sent', ok: false, error: 'Paired again with the bridge — press send once more.' }); break; }
      const tu = r.json && r.json.threadUrl;
      if (r.status === 200) startAgentPoll(fk);
      const newThread = r.json && r.json.threadId && r.json.threadId !== tid;
      if (r.status === 200 && tu && newThread && /^https:\/\/www\.figma\.com\/design\/[A-Za-z0-9]+\/[^?]*\?m=auto&agent-thread=[0-9a-f-]{36}$/.test(tu)) figma.openExternal(tu);   // only a NEW chat is opened in the desktop app
      send({ type: 'agent-sent', ok: r.status === 200, threadUrl: tu || null, threadId: (r.json && r.json.threadId) || tid || null, error: (r.json && r.json.error) || (r.status === 0 ? 'The bridge is not reachable.' : ''), launch: r.json && r.json.launch });
      break;
    }
    case 'agent-stop': {   // Stop pressed while the Figma Agent works: press the Agent's own Stop button in its chat
      stopAgentPoll();
      const fk2 = agentFk || fileKeyNow('');
      const r = fk2 ? await api('/agent/stop', { method: 'POST', timeout: 60000, body: { fileKey: fk2, wait: !!msg.wait } }) : { status: 0 };
      send({ type: 'agent-stopped', ok: !!(r.json && r.json.stopped) });
      break;
    }
    case 'make-link': await MAKESA.link(String(msg.url || '')); break;
    case 'make-bridge-start': await MAKESA.link(String(msg.url || '')); break;   // the chat button: msaReady starts the Make bridge, then the conversion goes on
    case 'health-get': kickHealth(); await sendHealthReport(); break;
    case 'health-fix': {
      const fid = String(msg.id || '');
      if (fid === 'restart-bridge') await restartBridge();
      else if (fid === 'start-make-bridge') { const up = await MAKESA.ensure(); if (!up) send({ type: 'toast', text: 'The Make bridge did not start. Start it in Terminal.', ok: false }); }
      else if (fid === 'rescan') await healthCheck();
      later(sendHealthReport, 2500);
      break;
    }
    case 'log-get':
      send({ type: 'log-data', errors: ERRLOG.slice(-40).map(function (x) { return new Date(x.t).toISOString().slice(11, 19) + ' ' + x.where + ': ' + x.msg; }), builds: BUILDLOG.slice(-20) });
      break;
    case 'make-fix': await MAKESA.fix(String(msg.frameId || '')); break;
    case 'make-resync': await MAKESA.resync(msg); break;
    case 'focus-figma': await api('/app/focus', { method: 'POST', body: {} }); break;   // back to the Figma desktop app after the extension read the app in Chrome   // Make link → the standalone Make engine (extension reads the app incl. popups and screens, the plugin builds every frame)
    case 'make-send': {   // Make tab: the bridge opens figma.com/make and submits the prompt there
      const r = await api('/make/send', { method: 'POST', timeout: 90000, body: { text: String(msg.text || '') } });
      if (r.status === 401) { await doPair(); send({ type: 'make-sent', ok: false, error: 'Paired again with the bridge — press send once more.' }); break; }
      const mu = r.json && r.json.makeUrl;
      if (r.status === 200 && mu && /^https:\/\/www\.figma\.com\/make\/[A-Za-z0-9]{10,}/.test(mu)) figma.openExternal(mu);   // the new Make project opens in the desktop app by itself
      send({ type: 'make-sent', ok: r.status === 200, makeUrl: mu || null, error: (r.json && r.json.error) || (r.status === 0 ? 'The bridge is not reachable.' : '') });
      break;
    }
    case 'plan-action': {   // Approve / Reject under a plan → the bridge builds it with the scripts (no Claude), or ends the job
      const r = await api('/run/approve', { method: 'POST', body: { job: String(msg.job || ''), fileKey: fileKeyNow(''), action: msg.action === 'reject' ? 'reject' : 'approve' } });
      if (r.status !== 200) send({ type: 'error', message: (r.json && r.json.error) || 'The bridge did not take the answer.' });
      break;
    }
    case 'history-clear': { try { figma.root.setPluginData(HISTORY_KEY, '[]'); } catch (e) { E('history-clear', e); } await sendHistory(false); send({ type: 'toast', text: 'History cleared' }); break; }   // the user pressed "Clear history"
    case 'open-url': if (/^https:\/\/(www\.)?figma\.com\//.test(String(msg.url || ''))) figma.openExternal(msg.url); break;
    case 'open-log': { const r = await api('/job/open-log', { method: 'POST', timeout: 30000, body: { jobId: msg.jobId } }); send({ type: 'log-opened', copy: msg.copy !== false, jobId: msg.jobId, text: r.json && r.json.text || '', ok: r.status === 200, error: r.json && r.json.error || (r.status === 0 ? 'bridge not reachable' : '') }); break; }
    case 'show-node': if (msg.nodeId) { const sn = await showNode(msg.nodeId); if (!sn) send({ type: 'toast', text: 'That frame is not in this file any more (deleted or moved to another file).', ok: false }); } break;
    case 'resize':
      figma.ui.resize(
        Math.max(400, Math.min(1100, Math.round(msg.width || 400))),   // never narrower than the default 400; the user can only widen it (drag the corner to the right)
        Math.max(200, Math.min(msg.manual ? 1200 : 860, Math.round(msg.height)))
      );
      break;
    case 'unpair':
      send({ type: 'error', message: 'Nothing to do: SAP Bridge pairs once and reconnects by itself. Only to connect a different Figma (another computer), ask Claude: node build/mailbox.js unpair' });
      break;
    default: break;
  }
};

// <<MAKESA>> generated by plugin-v2/build-make.js — do not edit by hand
const MAKESA = (function () {
let BASE = 'http://localhost:41779';   // the Make bridge may run on a later port: makeFind() looks for it
const MAKE_PORTS = [41779, 41789, 41790, 41791, 41792, 41793, 41794, 41795];
let lastMakeLink = '', lastAudit = null, resyncCtx = null;
const lastBuildIds = new Map();   // main frame id -> [main frame id + its popup / screen frame ids]
let token = null;
let treeBusy = false;
// ── GENERATED RUNTIME (node build/plugin-bundle.js) — do not edit by hand ──
const RUNTIME_VER = 'f06074e468';
function _createAutoLayout(dir, o) {
  if (typeof figma.createAutoLayout === 'function') return figma.createAutoLayout(dir, o);
  const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.fills = []; f.clipsContent = false; if (o && o.name) f.name = o.name; if (o && o.itemSpacing != null) f.itemSpacing = o.itemSpacing;
  return f;
}
async function RUN_TREE(KIT, TREE) {
function _G(fn){ return function(x){ try { return fn(x); } catch (e) { return false; } }; }
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
async function _setViaKitCore(inst, kitName, props) {
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
    let target = null, bestScore = -1;                                      // exact match first; else the nearest variant that has every REQUESTED value (e.g. Initials + colour 6 when the current colour 'Image' does not exist for Initials)
    for (const c of set.children) { const m = {}; for (const part of c.name.split(',')) { const [k, v] = part.split('='); if (v !== undefined) m[k.trim()] = v.trim(); }
      if (!Object.keys(variants).every(k => (m[k] || '').toLowerCase() === String(variants[k]).toLowerCase())) continue;
      const sc = Object.keys(want).filter(k => (m[k] || '').toLowerCase() === String(want[k]).toLowerCase()).length; if (sc > bestScore) { bestScore = sc; target = c; } }
    if (!target) { WARN.push(`${inst.name}: the kit has no variant ${JSON.stringify(want)}`); return inst; }
    inst.swapComponent(target);
  }
  return inst;
}
async function _setPRaw(inst, props, kitName) {
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
  try { inst.setPluginData('kit', name); } catch (e) {}   // remembered so a later setP can find KIT.d[name] without a live read
  return setP(inst, props, name);
}
async function setP(inst, props, kitName) {
  try { return await _setPRaw(inst, props, kitName); }
  catch (e) { if (!/existing errors|componentPropert/i.test(String(e && e.message))) throw e;
    return _setViaKit(inst, kitName || inst.getPluginData('kit') || inst.name, props); }
}
async function _setViaKit(inst, kitName, props) {
  const defs = _kitDefs(kitName);
  if (defs) { const byNorm = {}; for (const k of Object.keys(defs)) byNorm[_norm(k)] = k; const vs = {}; let typed = false;
    for (const [n, v] of Object.entries(props)) { const real = defs[n] ? n : byNorm[_norm(n)]; if (!real) continue; if (defs[real].type === 'VARIANT') vs[real] = v; if (/typed text/i.test(real) && v) typed = true; }
    if (typed && defs.Content && defs.Content.type === 'VARIANT' && !vs.Content && defs.Content.variantOptions.includes('Typed Text')) vs.Content = 'Typed Text';
    if (Object.keys(vs).length) await _setViaKitCore(inst, kitName, vs); props = Object.assign({}, props, vs); }
  return _setViaKitCore(inst, kitName, props);
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

async function _mcSafe(n){ try { return await n.getMainComponentAsync(); } catch (e) { return null; } }
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
  const done = [], broken = [];
  for (let i = 0; i < kids0.length; i++) {                                                  // A (no await inside)
    try {
      const it = nth(i); if (!it) continue;
      if (i >= items.length) { it.visible = false; continue; }
      const d = items[i], p = {};
      for (const k of Object.keys(it.componentProperties)) { if (k.startsWith('✏️ Text#')) p[k] = d.text; if (k === 'Selected') p[k] = d.selected ? 'True' : 'False'; if (k === 'Expanded') p[k] = 'True'; }
      it.setProperties(p); done.push(i);
    } catch (e) { if (/existing errors/i.test(String(e.message))) broken.push(i); else WARN.push('nav item ' + i + ': text skipped (' + String(e.message).slice(0, 60) + ')'); }
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
  for (const i of broken) { try { await _tick(); await _navFix(nth(i), items[i], iconId[i]); } catch (e) { WARN.push('nav item ' + i + ': ' + String(e.message).slice(0, 60)); } }   // broken set
}
async function _navFix(it, d, iconNodeId) {          // a broken Navigation Item set: variant by name, text and icon through their bound layers
  if (!it) return; const mc = await it.getMainComponentAsync(), set = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  if (set) { const parse = nm => { const m = {}; for (const p of nm.split(',')) { const [k, v] = p.split('='); if (v !== undefined) m[k.trim()] = v.trim(); } return m; };
    const want = Object.assign(parse(mc.name), { Selected: d.selected ? 'True' : 'False' }); if ('Expanded' in want) want.Expanded = 'True';
    const tg = set.children.find(c => { const m = parse(c.name); return Object.keys(want).every(k => !(k in m) || m[k].toLowerCase() === String(want[k]).toLowerCase()); });
    if (tg && tg.id !== mc.id) { it.swapComponent(tg); await _tick(); } }
  const t = _boundLayer(it, '✏️ Text', 'TEXT'); if (t) { for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName); t.characters = String(d.text || ''); }
  if (iconNodeId) { const l = _boundLayer(it, 'Icon', 'INSTANCE_SWAP'), c = await figma.getNodeByIdAsync(iconNodeId); if (l && l.type === 'INSTANCE' && c) l.swapComponent(c.type === 'COMPONENT_SET' ? c.defaultVariant : c); }
}
async function _avatar(sb, initials) {
  const av = sb.findOne(_G(x => x.type === 'INSTANCE' && x.name === 'Avatar')); if (!av) { WARN.push('Shell Bar: no avatar'); return; }
  let ik; try { ik = Object.keys(av.componentProperties).find(k => k.startsWith('✏️ Initials#')); } catch (e2) { ik = null; }
  try { av.setProperties({ Type: 'Initials', Color: '6', ...(ik ? { [ik]: initials } : {}) }); }
  catch (e) { if (/existing errors/i.test(String(e.message))) { try { await _setViaKit(av, 'Avatar', { Type: 'Initials', Color: '6', Initials: initials }); } catch (e3) { WARN.push('avatar: ' + e3.message); } } else WARN.push('avatar: ' + e.message); }
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
      let defs; try { defs = si.componentProperties; } catch (e1) { await _setViaKit(si, nm, pr); continue; }   // broken kit set (Input / Button): set it from the kit definitions
        const p = {};
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
    if (o.w && Math.abs(n.width - o.w) > 0.5) n.rescale(o.w / n.width);   // rescale keeps the icon's shape; resize distorts it
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
// ── React / UI5 Web Components apps (kind:'dom'): turn the DOM dump into the same shape as a SAPUI5 control dump, then use the same converter ──
// A DOM node (i, p, t, r, cs, at, tx, wc, sel, svg, img) becomes a pseudo UI5 control: ui5-* tags → the matching sap.m.* control (so the kit-part
// mapping, layout, icons, popups and the self-check all work unchanged); divs/spans → VBox/HBox/Text with their measured boxes and CSS.
function domToUi5(DM) {
  const nodes = DM.nodes || [], px = v => parseFloat(v) || 0, VW = (DM.viewport || [1440, 900]);
  const hex = c => { const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/.exec(String(c || '')); if (!m) return ''; const a = m[4] !== undefined ? parseFloat(m[4]) : 1; if (a < 0.05) return '';
    return '#' + [m[1], m[2], m[3]].map(x => Math.round(a < 1 ? parseFloat(x) * a + 255 * (1 - a) : parseFloat(x)).toString(16).padStart(2, '0')).join(''); };      // a translucent colour is shown as it looks on white
  const gradHex = bgi => { const m = String(bgi || '').match(/rgba?\([^)]+\)|#[0-9a-f]{6}/gi); if (!m || !/gradient/.test(bgi)) return ''; const a = hex(m[0]), b = hex(m[m.length - 1]); if (!a || !b) return a || b || ''; const v = [1, 3, 5].map(i => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2)); return '#' + v.map(x => x.toString(16).padStart(2, '0')).join(''); };
  const bgOf = n => hex((n.cs || {}).bg) || gradHex((n.cs || {}).bgi);
  const kids = {}; nodes.forEach(n => { (kids[n.p] = kids[n.p] || []).push(n); });
  const icn = v => { const x = String(v || '').replace(/^sap-icon:\/\//, ''); return x ? 'sap-icon://' + x : ''; };
  const has = (at, k) => !!at && Object.prototype.hasOwnProperty.call(at, k) && at[k] !== 'false';
  const STATE = { Positive: 'Success', Negative: 'Error', Critical: 'Warning', Information: 'Information', Neutral: 'None', Set1: 'None', Set2: 'None' };
  const BTN = { Emphasized: 'Emphasized', Default: 'Default', Transparent: 'Transparent', Positive: 'Accept', Negative: 'Reject', Attention: 'Attention' };
  const controls = [], emitted = {}, consumed = new Set();
  const under = i => { const out = [], st = (kids[i] || []).slice(); while (st.length) { const k = st.shift(); out.push(k); (kids[k.i] || []).forEach(x => st.push(x)); } return out.sort((a, b) => a.i - b.i); };
  const deepText = n => { const t = []; if (n.tx) t.push(n.tx); under(n.i).forEach(k => { if (k.tx) t.push(k.tx); else if (/^ui5-(tag|badge|label|text|title|link|button)$/.test(k.t) && k.wc) t.push(k.wc); }); return t.join(' ').replace(/\s+/g, ' ').trim(); };
  const iconOf = n => { const k = under(n.i).find(x => x.t === 'ui5-icon'); return k && k.at ? icn(k.at.name || k.at.icon) : ''; };
  const radius = n => { const c = n.cs || {}, r = String(c.rad || '0'); if (/%/.test(r)) return Math.min(n.r[2], n.r[3]) * px(r) / 100; return Math.min(px(r), Math.min(n.r[2], n.r[3]) / 2); };
  const stOf = n => { const c = n.cs || {}, fl = /flex/.test(c.d || ''), g = String(c.gap || '').split(/\s+/).map(px);
    return { display: fl ? 'flex' : (c.d || 'block'), dir: c.fd || 'row', wrap: c.wrap || 'nowrap', ai: c.ai || 'normal', jc: c.jc || 'normal', gap: (g[1] !== undefined ? g[1] : g[0] || 0) + 'px/' + (g[0] || 0) + 'px',
      pad: c.pad || [0, 0, 0, 0], mar: [0, 0, 0, 0], bg: bgOf(n), fg: hex(c.color), fs: px(c.fs) || 14, fw: String(c.fw || '400'), ta: c.ta || 'left',
      bw: (c.bw || [0])[0] || 0, bc: hex((c.bc || [])[0]) || '#000000', br: radius(n), sh: c.sh || '', grow: String(c.fg || '0'), shrink: '1' }; };
  const txOf = n => { const c = n.cs || {}; return { fs: px(c.fs) || 14, fw: parseInt(c.fw, 10) || 400, fg: hex(c.color) || '#131e29', ff: c.ff || '72', lh: px(c.lh) || 0 }; };
  const sides = n => { const c = n.cs || {}, bw = c.bw || [0, 0, 0, 0]; return bw.some(Boolean) ? { bwa: bw.slice(), bca: (c.bc || []).map(hex) } : {}; };
  const parentId = n => { let p = n.p; while (p >= 0 && !emitted[p]) p = (nodes[p] || { p: -1 }).p; return p >= 0 ? '__d' + p : null; };
  const push = (n, cls, props, extra) => { const o = Object.assign({ id: '__d' + n.i, cls, parent: parentId(n), props: props || {}, css: [], box: n.r.slice(), st: stOf(n), tx: txOf(n), aria: {}, i: controls.length }, sides(n), extra || {});
    if (n.cs && n.cs.pos === 'absolute') o.absPos = true; controls.push(o); emitted[n.i] = true; return o; };
  const child = (o, suffix, cls, props, box, n) => { controls.push({ id: o.id + suffix, cls, parent: o.id, props, css: [], box, st: stOf(n), tx: txOf(n), aria: {}, i: controls.length }); };
  const textLike = n => { const t = n.t; return /^h[1-6]$/.test(t) ? 'sap.m.Title' : t === 'label' ? 'sap.m.Label' : (t === 'a' || (n.at && n.at.role === 'link')) ? 'sap.m.Link' : 'sap.m.Text'; };
  const dark = h => { if (!h) return false; const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) < 140; };
  const textBox = (n, t) => { const c = n.cs || {}, fs = px(c.fs) || 14, w = Math.min(n.r[2], Math.ceil(String(t).length * fs * 0.56)), h = px(c.lh) || Math.round(fs * 1.4), pad = c.pad || [0, 0, 0, 0];
    const centre = /center/.test(c.jc || '') || c.ta === 'center', mid = /center/.test(c.ai || '') || /flex/.test(c.d || '') && /center/.test(c.ai || '');
    return [n.r[0] + (centre ? Math.max(0, (n.r[2] - w) / 2) : pad[3]), n.r[1] + (mid || n.r[3] < h * 2.2 ? Math.max(0, (n.r[3] - h) / 2) : pad[0]), w, h]; };
  nodes.forEach(n => {
    if (consumed.has(n.i) || !n.r || (n.r[2] < 0.5 && n.r[3] < 0.5)) return;
    const at = n.at || {}, t = n.t, txt = n.wc || n.tx || '', c = n.cs || {}, role = at.role || '';
    if (c.pos === 'fixed' && n.r[2] >= VW[0] * 0.9 && n.r[3] >= VW[1] * 0.9 && !role) return;                 // a dimming backdrop
    let o = null;
    switch (t) {
      case 'thead': case 'tbody': case 'tfoot': case 'colgroup': case 'col': return;
      case 'tr': if ((kids[n.i] || []).some(k => k.t === 'th')) return; o = push(n, 'sap.m.ColumnListItem', { type: 'Inactive' }); return;
      case 'th': { o = push(n, 'sap.m.Column', {}); const tt = deepText(n); if (tt) child(o, 't', 'sap.m.Text', { text: tt }, textBox(n, tt), n); under(n.i).forEach(k => consumed.add(k.i)); return; }
      case 'table': o = push(n, 'sap.m.Table', {}); return;
      case 'button': case 'ui5-button': case 'ui5-toggle-button': {
        const ic = t === 'button' ? iconOf(n) : at.icon ? icn(at.icon) : '', tt = t === 'button' ? deepText(n) : txt;
        if (t === 'button' && !tt && !ic && !under(n.i).some(k => k.t === 'svg')) break;
        o = push(n, t === 'ui5-toggle-button' ? 'sap.m.ToggleButton' : 'sap.m.Button', Object.assign({ type: t === 'button' ? (bgOf(n) && dark(bgOf(n)) ? 'Emphasized' : (bgOf(n) || (c.bw || []).some(Boolean)) ? 'Default' : 'Transparent') : (BTN[at.design] || 'Default') }, tt ? { text: tt } : {}, ic ? { icon: ic } : t === 'button' && !tt ? { icon: 'sap-icon://overflow' } : {}));
        if (t === 'button') under(n.i).forEach(k => consumed.add(k.i)); o.parent = parentId(n); return;
      }
      case 'ui5-input': case 'ui5-multi-input': o = push(n, 'sap.m.Input', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'input': { const ty = at.type || 'text';
        if (ty === 'checkbox') o = push(n, 'sap.m.CheckBox', Object.assign({ text: at['aria-label'] || '' }, has(at, 'checked') ? { selected: true } : {}));
        else if (ty === 'radio') o = push(n, 'sap.m.RadioButton', Object.assign({ text: at['aria-label'] || '' }, has(at, 'checked') ? { selected: true } : {}));
        else if (ty !== 'hidden') o = push(n, 'sap.m.Input', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {}));
        break; }
      case 'textarea': o = push(n, 'sap.m.TextArea', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'select': o = push(n, 'sap.m.Select', {}, { selText: n.sel || at.value || '' }); under(n.i).forEach(k => consumed.add(k.i)); break;
      case 'ui5-search': o = push(n, 'sap.m.SearchField', at.placeholder ? { placeholder: at.placeholder } : {}); break;
      case 'ui5-textarea': o = push(n, 'sap.m.TextArea', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-select': case 'ui5-combobox': o = push(n, 'sap.m.Select', {}, { selText: n.sel || at.value || '' }); break;
      case 'ui5-multi-combobox': o = push(n, 'sap.m.MultiComboBox', at.placeholder ? { placeholder: at.placeholder } : {}); break;
      case 'ui5-date-picker': case 'ui5-datetime-picker': o = push(n, 'sap.m.DatePicker', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-daterange-picker': o = push(n, 'sap.m.DateRangeSelection', Object.assign({}, at.value ? { value: at.value } : {}, at.placeholder ? { placeholder: at.placeholder } : {})); break;
      case 'ui5-time-picker': o = push(n, 'sap.m.TimePicker', at.value ? { value: at.value } : {}); break;
      case 'ui5-checkbox': o = push(n, 'sap.m.CheckBox', Object.assign({ text: at.text || txt }, has(at, 'checked') ? { selected: true } : {})); break;
      case 'ui5-radio-button': o = push(n, 'sap.m.RadioButton', Object.assign({ text: at.text || txt }, has(at, 'checked') ? { selected: true } : {})); break;
      case 'ui5-switch': o = push(n, 'sap.m.Switch', has(at, 'checked') ? { state: true } : {}); break;
      case 'ui5-tag': case 'ui5-badge': case 'ui5-object-status': o = push(n, 'sap.m.ObjectStatus', Object.assign({ text: txt, state: STATE[at.design || at.state] || 'None', inverted: t !== 'ui5-object-status' }, at.icon ? { icon: icn(at.icon) } : {})); break;
      case 'ui5-title': o = push(n, 'sap.m.Title', { text: txt }); break;
      case 'ui5-label': o = push(n, 'sap.m.Label', { text: txt }); break;
      case 'ui5-text': o = push(n, 'sap.m.Text', { text: txt }); break;
      case 'ui5-link': o = push(n, 'sap.m.Link', { text: txt }); break;
      case 'ui5-icon': { const nm = icn(at.name || at.icon); o = push(n, 'sap.ui.core.Icon', nm ? { src: nm } : {}); break; }
      case 'ui5-avatar': o = push(n, 'sap.m.Avatar', Object.assign({}, at.initials ? { initials: at.initials } : {}, at.icon ? { src: icn(at.icon) } : {}, at.size ? { displaySize: at.size } : {})); break;
      case 'ui5-progress-indicator': o = push(n, 'sap.m.ProgressIndicator', { displayValue: (at['display-value'] || (at.value ? at.value + '%' : '')), state: STATE[at['value-state']] || 'None', showValue: true }); break;
      case 'ui5-busy-indicator': o = push(n, 'sap.m.BusyIndicator', at.text ? { text: at.text } : {}); break;
      case 'ui5-message-strip': o = push(n, 'sap.m.MessageStrip', { text: txt, type: STATE[at.design] || 'Information' }); break;
      case 'ui5-step-input': o = push(n, 'sap.m.StepInput', { value: at.value || '0' }); break;
      case 'ui5-slider': o = push(n, 'sap.m.Slider', { value: at.value || '0', min: at.min || '0', max: at.max || '100' }); break;
      case 'ui5-rating-indicator': o = push(n, 'sap.m.RatingIndicator', has(at, 'readonly') ? { editable: false } : {}); break;
      case 'ui5-card': o = push(n, 'sap.f.Card', {}); break;
      case 'ui5-li': case 'ui5-li-custom': o = push(n, 'sap.m.StandardListItem', Object.assign({ title: txt.replace(at.description || '\u0000', '').trim() || txt }, at.description ? { description: at.description } : {}, at.icon ? { icon: icn(at.icon) } : {})); break;
      case 'ui5-li-group-header': o = push(n, 'sap.m.GroupHeaderListItem', { title: txt }); break;
      case 'ui5-list': o = push(n, 'sap.m.List', {}); break;
      case 'ui5-tabcontainer': {
        o = push(n, 'sap.m.IconTabBar', {});
        const tabs = (kids[n.i] || []).filter(k => k.t === 'ui5-tab'), sel = tabs.find(k => has(k.at, 'selected')) || tabs[0], hr = n.r.slice(); hr[3] = Math.min(n.r[3], 48);
        child(o, 'h', 'sap.m.IconTabHeader', { selectedKey: sel ? '__d' + sel.i : '' }, hr, n); break; }
      case 'ui5-tab': {
        const pn = nodes[n.p], tabs = pn ? (kids[pn.i] || []).filter(k => k.t === 'ui5-tab') : [], idx = tabs.indexOf(n), per = pn ? Math.min(pn.r[2] / Math.max(1, tabs.length), 120) : 100;
        o = push(n, 'sap.m.IconTabFilter', Object.assign({ text: at.text || '', key: '__d' + n.i }, at.icon ? { icon: icn(at.icon) } : {}), { box: pn ? [pn.r[0] + idx * per, pn.r[1], per, Math.min(pn.r[3], 48)] : n.r.slice() }); break; }
      case 'ui5-shellbar': {
        o = push(n, 'sap.tnt.ToolHeader', {});
        if (at['primary-title']) child(o, 't', 'sap.m.Title', { text: at['primary-title'] }, [n.r[0] + 64, n.r[1] + 12, 200, 28], n);
        if (has(at, 'show-search') || (kids[n.i] || []).some(k => /search/.test(k.t))) child(o, 's', 'sap.m.SearchField', {}, [n.r[0] + n.r[2] - 300, n.r[1] + 10, 220, 32], n);
        break; }
      case 'ui5-dialog': case 'ui5-popover': case 'ui5-responsive-popover': {
        if (!has(at, 'open')) return;
        o = push(n, t === 'ui5-dialog' ? 'sap.m.Dialog' : 'sap.m.Popover', at['header-text'] ? { title: at['header-text'] } : {}, { hid: '1', parent: 'sap-ui-static' });
        if (at['header-text']) { child(o, 'b', 'sap.m.Bar', {}, [n.r[0], n.r[1], n.r[2], 52], n); controls.push({ id: o.id + 'bt', cls: 'sap.m.Title', parent: o.id + 'b', props: { text: at['header-text'] }, css: [], box: [n.r[0] + 16, n.r[1] + 14, Math.max(80, n.r[2] - 32), 24], st: stOf(n), tx: Object.assign(txOf(n), { fs: 16, fw: 700 }), aria: {}, i: controls.length }); }
        return; }
      case 'img': { const src = n.img || ''; o = push(n, 'sap.m.Image', { src }); if (src.startsWith('data:')) (DM.__img = DM.__img || {})[src] = src; break; }
      case 'svg': if (n.svg) o = push(n, 'x.Svg', { svg: n.svg }); else o = push(n, 'sap.ui.core.Icon', { src: 'sap-icon://hint' }); break;
      default: break;
    }
    if (!o) {
      if (role === 'dialog' || role === 'alertdialog' || role === 'menu' || role === 'listbox' || role === 'tooltip') { o = push(n, role === 'dialog' || role === 'alertdialog' ? 'sap.m.Dialog' : 'sap.m.Popover', {}, { hid: '1', parent: 'sap-ui-static' }); return; }
      if (role === 'switch') { o = push(n, 'sap.m.Switch', at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { state: true } : {}); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'checkbox') { o = push(n, 'sap.m.CheckBox', Object.assign({ text: deepText(n) }, at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { selected: true } : {})); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'radio') { const sib = (kids[n.p] || []).find(k => k !== n && (k.t === 'label' || k.tx)); o = push(n, 'sap.m.RadioButton', Object.assign({ text: sib ? deepText(sib) : '' }, at['aria-checked'] === 'true' || at['data-state'] === 'checked' ? { selected: true } : {})); under(n.i).forEach(k => consumed.add(k.i)); if (sib) { consumed.add(sib.i); under(sib.i).forEach(k => consumed.add(k.i)); } return; }
      if (role === 'tablist') { o = push(n, 'sap.m.IconTabBar', {}); const tb = (kids[n.i] || []).filter(k => k.at && k.at.role === 'tab'), sel = tb.find(k => k.at['aria-selected'] === 'true' || k.at['data-state'] === 'active') || tb[0];
        child(o, 'h', 'sap.m.IconTabHeader', { selectedKey: sel ? '__d' + sel.i : '' }, n.r.slice(), n); return; }
      if (role === 'tab') { o = push(n, 'sap.m.IconTabFilter', { text: deepText(n), key: '__d' + n.i }); under(n.i).forEach(k => consumed.add(k.i)); return; }
      if (role === 'button' && (deepText(n) || iconOf(n) || under(n.i).some(k => k.t === 'svg'))) {
        const tt = deepText(n), ic = iconOf(n);
        o = push(n, 'sap.m.Button', Object.assign({ type: bgOf(n) && dark(bgOf(n)) ? 'Emphasized' : (bgOf(n) || (c.bw || []).some(Boolean)) ? 'Default' : 'Transparent' }, tt ? { text: tt } : {}, ic ? { icon: ic } : !tt ? { icon: 'sap-icon://overflow' } : {}));
        under(n.i).forEach(k => consumed.add(k.i)); return; }
    }
    if (o) { o.parent = o.hid ? 'sap-ui-static' : parentId(n); return; }
    // a plain element (div, span, p, section, li, td …) or a container web component
    const hasKids = (kids[n.i] || []).length > 0, visual = !!(bgOf(n) || c.sh || (c.bw || []).some(Boolean));
    if (n.tx && !hasKids && !/^ui5-/.test(t) && !visual) { o = push(n, textLike(n), { text: n.tx }); return; }
    if (!hasKids && !n.tx && !visual) return;
    o = push(n, /flex/.test(c.d || '') && c.fd !== 'column' ? 'sap.m.HBox' : 'sap.m.VBox', {});
    if (n.tx) { const tb = textBox(n, n.tx), line = (kids[n.i] || []).filter(k => k.r && Math.abs(k.r[1] - n.r[1] - ((n.cs || {}).pad || [0])[0]) < (px((n.cs || {}).fs) || 14));
      if (line.length) tb[0] = Math.max(tb[0], Math.max(...line.map(k => k.r[0] + k.r[2])) + 4);                  // plain text that follows an inline child starts after it
      child(o, 't', textLike(n), { text: n.tx }, tb, n); }
  });
  controls.forEach((x, i) => { x.i = i; });
  { const byId = {}, flex = []; controls.forEach(x => { byId[x.id] = x; });                      // CSS widths in React apps are fractions of the parent (w-full, flex-1): give the converter the signal a SAPUI5 app gives (width 100% / flex-grow)
    controls.forEach(x => { const p = byId[x.parent]; if (!p || x.absPos || !/^sap\.(m\.(VBox|HBox)|f\.Card)$/.test(x.cls) || !/^sap\.(m\.(VBox|HBox)|f\.Card)$/.test(p.cls)) return;
      const pad = p.st.pad || [0, 0, 0, 0], inL = p.box[0] + pad[3], inR = p.box[0] + p.box[2] - pad[1], row = p.cls === 'sap.m.HBox';
      if (!row && Math.abs(x.box[2] - (inR - inL)) <= 1.5 && x.box[2] > 24) x.props.width = '100%';
      if (row && Math.abs(x.box[0] + x.box[2] - inR) <= 1.5 && x.box[0] > inL + 1 && x.box[2] > 40) flex.push({ id: x.id + 'fd', cls: 'sap.m.FlexItemData', parent: x.id, props: {}, css: [], box: [x.box[0], x.box[1], 0, 0], st: Object.assign({}, x.st, { grow: '1' }), tx: x.tx, aria: {}, i: 0 }); });
    flex.forEach(k => controls.push(k)); }
  const root = controls.find(x => !x.parent) || controls[0];
  const pg = DM.page || VW;
  return { origin: DM.url || '', title: DM.title || 'Make screen', ui5: 'webcomponents', theme: DM.theme || '', compact: true, viewport: [Math.max(VW[0], pg[0] || 0), Math.max(VW[1], pg[1] || 0)], root: root ? root.id : '', n: controls.length, controls, vars: DM.vars || {}, imageData: DM.__img || {}, explore: DM.explore };
}
function convert(D, KIT, MAP, EXTRA, nameArg) {
  if (D && D.kind === 'dom' && Array.isArray(D.nodes)) D = domToUi5(D);                 // React / web-component app: same pipeline from here
  D = Object.assign({}, D, { controls: D.controls.map(c => Object.assign({}, c)) });   // this converter re-parents a few controls: never touch the caller's dump
  { const AL = MAP.class_alias || {}; D.controls.forEach(k => { if (AL[k.cls]) { k.cls0 = k.cls; k.cls = AL[k.cls]; } }); }   // OverflowToolbarButton → Button, ShellBar → ToolHeader, ObjectPage → DynamicPage, ui.table → m.Table …
  {                                                                                   // a SimpleForm's fields hang on the Form (FormContainer / FormElement have no DOM): lay them out in its Grid
    const LAY = /^sap\.ui\.layout\.(form\.(Form|SimpleForm|ResponsiveGridLayout)|Grid)$/, byId = new Map(D.controls.map(k => [k.id, k]));
    D.controls.filter(k => k.cls === 'sap.ui.layout.Grid').forEach(g => { let f = byId.get(g.parent); if (f && f.cls === 'sap.ui.layout.form.ResponsiveGridLayout') f = byId.get(f.parent);
      if (f && f.cls === 'sap.ui.layout.form.Form') D.controls.forEach(k => { if (k.parent === f.id && !LAY.test(k.cls)) k.parent = g.id; }); });
  }
  const NAV = [], SHELL = {}, WARN = [], IMAGES = [], R = v => Math.round(v * 10) / 10, R5 = v => Math.round(v * 2) / 2;

  // ── control index ────────────────────────────────────────────────────────────────────────
  const by = {}, lay = {}, kids = {};
  D.controls.forEach(c => { by[c.id] = c; });
  {                                                                                                         // a Dialog's buttons are its own aggregation; the footer toolbar is drawn under them → put them into it
    const oc = c => /^sap\.m\.(Dialog|Popover|ResponsivePopover|ActionSheet)$/.test(c.cls), kidsOf = {};
    D.controls.forEach(c => { (kidsOf[c.parent] = kidsOf[c.parent] || []).push(c); });
    D.controls.filter(c => /^sap\.m\.(AssociativeOverflowToolbar|OverflowToolbar|Toolbar|Bar)$/.test(c.cls) && c.box[2] > 40 && !(kidsOf[c.id] || []).some(k => k.cls !== 'sap.m.FlexItemData')).forEach(t => {
      const owner = by[t.parent] && oc(by[t.parent]) ? by[t.parent] : (() => { let p = by[t.parent], n = 0; while (p && n++ < 8 && !oc(p)) p = by[p.parent]; return p && oc(p) ? p : null; })();
      if (!owner) return;
      (kidsOf[owner.id] || []).filter(k => k !== t && /^sap\.m\.(Button|ToggleButton|MenuButton|Select|SearchField|ToolbarSpacer)$/.test(k.cls) && k.box[2] > 0 && k.box[0] >= t.box[0] - 2 && k.box[0] + k.box[2] <= t.box[0] + t.box[2] + 2 && k.box[1] >= t.box[1] - 2 && k.box[1] + k.box[3] <= t.box[1] + t.box[3] + 2)
        .forEach(k => { k.parent = t.id; });
    });
  }
  D.controls.forEach(c => { if (c.cls === 'sap.m.FlexItemData' && by[c.parent]) lay[c.parent] = c.st; });
  const skip = new Set(MAP.skip_cls);
  const vparent = c => { let p = c.parent; while (p && by[p] && skip.has(by[p].cls)) p = by[p].parent; return p; };
  // a control the user cannot see in Make: hidden by CSS (probe: hid), far outside the page (OverflowToolbar clones, off-screen measuring copies), or an invisible-text helper
  // Overlays (Dialog, Popover, Menu, Action Sheet…) live in the static area, outside the page tree, and are position:fixed (the probe flags them hidden).
  // An OPEN one (it has a real box) becomes its own frame next to the screen; its controls count as visible.
  const OVR = /^sap\.m\.(Dialog|Popover|ResponsivePopover|ActionSheet|Menu)$|^sap\.ui\.unified\.Menu$/;
  const ovs0 = D.controls.filter(c => OVR.test(c.cls) && c.box[2] >= 100 && c.box[3] >= 60);
  const isUnder = (c, a) => { for (let p = by[c.parent], n = 0; p && n++ < 20; p = by[p.parent]) if (p === a) return true; return false; };
  const ovs = ovs0.filter(o => !ovs0.some(a => a !== o && isUnder(o, a) && Math.abs(a.box[0] - o.box[0]) <= 2 && Math.abs(a.box[1] - o.box[1]) <= 2 && Math.abs(a.box[2] - o.box[2]) <= 2)), ovIds = new Set(ovs.map(o => o.id));   // ResponsivePopover → its inner Popover: one frame
  const inOv = c => { for (let p = c, n = 0; p && n++ < 40; p = by[p.parent]) if (ovIds.has(p.id)) return true; return false; };
  // a Table that scrolls sideways: its right-hand columns and their cells are clipped (the probe says hidden) and lie beyond the viewport, but they are real content
  const inTable = c => { for (let p = c, n = 0; p && n++ < 8; p = by[p.parent]) { if (p.cls === 'sap.m.Column' || p.cls === 'sap.m.ColumnListItem') { const t = by[p.parent]; return !!(t && (t.cls === 'sap.m.Table' || t.cls === 'sap.m.ColumnListItem')) || p !== c; } } return false; };
  const scrolled = c => c.box[2] > 0 && c.box[3] > 0 && inTable(c) && !/Toolbar|Bar$/.test(c.cls);
  const off = c => (c.hid === 1 && !inOv(c) && !scrolled(c)) || (c.box[0] > D.viewport[0] - 1 && !scrolled(c)) || c.box[0] + c.box[2] < 1 || /HiddenElement|InvisibleText/.test((c.css || []).join(' '));
  D.controls.forEach(c => { if (!skip.has(c.cls) && !off(c)) (kids[vparent(c)] = kids[vparent(c)] || []).push(c); });
  const ch = c => (kids[c.id] || []).filter(k => !k.absPos && !(c.cls === 'sap.f.DynamicPageHeader' && MAP.skip_in_dynamic_header.includes(k.cls)));
  const grow = c => parseFloat((lay[c.id] || {}).grow) || 0;
  const px = v => { const m = /^(\d+(\.\d+)?)(px|rem)$/.exec(v || ''); return m ? parseFloat(m[1]) * (m[3] === 'rem' ? 16 : 1) : null; };

  // ── colours → SAP variables by VALUE and ROLE ────────────────────────────────────────────
  const KV = new Set(Object.keys(KIT.vars).map(n => n.split('/').pop()));
  const hexOf = v => { v = String(v || '').trim().toLowerCase(); let m = /^#([0-9a-f]{6})$/.exec(v); if (m) return '#' + m[1];
    m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v); if (m) return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
    m = /^rgba?\(([^)]+)\)/.exec(v); if (m) { const p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < 1) return null; return '#' + p.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join(''); } return null; };
  const VAL = {};
  for (const [n, v] of Object.entries(D.vars || {})) { if (!KV.has(n)) continue; const h = hexOf(v); if (h) (VAL[h] = VAL[h] || []).push(n); }
  if (Object.keys(D.vars || {}).length < 20) for (const [vp, v] of Object.entries(KIT.vars)) { const n = vp.split('/').pop(), h = hexOf(String(v).split('|')[2]); if (h && !(VAL[h] || []).includes(n)) (VAL[h] = VAL[h] || []).push(n); }   // an app that gives no CSS variables (React / web components): the kit's own Horizon values
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
    if (best && bd < 140) { WARN.push(`colour ${hex} has no exact SAP ${role} token — used the nearest: ${best}`); return best; }
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
    if (ICONS.has(n)) return n;
    // not in the kit: never leave a gap — put the closest kit icon (a real icon instance, easy to swap) and say so
    const toks = n.split('-').filter(t => t.length > 2), list = [...ICONS];
    let best = null, sc = 0; for (const k of list) { const kt = k.split('-'); const s = toks.filter(t => kt.includes(t)).length * 10 - Math.abs(kt.length - toks.length); if (s > sc) { sc = s; best = k; } }
    const sub = best || (/(error|fail|cancel|decline|reject)/.test(n) ? 'error' : /(warn|alert|attention|late)/.test(n) ? 'alert' : /(success|accept|done|complete)/.test(n) ? 'accept' : /(add|create|new)/.test(n) ? 'add' : /(edit|change)/.test(n) ? 'edit' : /(delete|remove)/.test(n) ? 'delete' : /(user|person|people|employee|customer)/.test(n) ? 'group' : /(document|file|text)/.test(n) ? 'document' : 'hint');
    WARN.push(`icon "${raw}" is not in the SAP kit — placed "${sub}" (a kit icon: swap it if needed)`); return ICONS.has(sub) ? sub : null;
  }

  // ── node makers ──────────────────────────────────────────────────────────────────────────
  const CONTAINERS = new Set(['sap.f.DynamicPage', 'sap.f.DynamicPageTitle', 'sap.f.DynamicPageHeader', 'sap.tnt.ToolPage', 'sap.tnt.NavigationList', 'sap.m.IconTabHeader', 'sap.m.ScrollContainer', 'sap.m.Page', 'sap.m.Panel', 'sap.m.List', 'sap.m.OverflowToolbar', 'sap.m.Toolbar', 'sap.ui.layout.VerticalLayout', 'sap.ui.layout.HorizontalLayout', 'sap.ui.layout.Grid', 'sap.m.ObjectIdentifier']);   // layout containers: their children are placed by the measured boxes (frame())
  const WIDGET = /(ComboBox|MultiInput|Input|TextArea|Picker|Selection|StepInput|Slider|RangeSlider|RatingIndicator|ProgressIndicator|Tokenizer|Token)$/;   // input-like widgets whose children are internals, not content
  const box = c => c.box.slice();
  const inst = (c, cp, pr, label, tx) => ({ _src: c.id, _b: cp === 'Switch' && KIT.components[cp] ? [c.box[0], c.box[1] + (c.box[3] - KIT.components[cp].h) / 2, KIT.components[cp].w, KIT.components[cp].h] : box(c), _k: 'inst', _grow: grow(c), _w: px(c.props.width), n: label || cp, k: 'i', cp, pr, w: (cp === 'Switch' || cp === 'Icon Button') && KIT.components[cp] ? KIT.components[cp].w : R(c.box[2]), h: (KIT.components[cp] && KIT.components[cp].h && cp !== 'Shell Bar' && cp !== 'Tab' && cp !== 'Navigation Item' && cp !== 'Object Status' && cp !== 'Text Area' && cp !== 'Message Strip' && cp !== 'Drop-Down') ? KIT.components[cp].h : R(c.box[3]), _intr: (KIT.components[cp] || {}).h, ...(tx ? { tx } : {}) });
  // the app's own icon on a status: the kit status keeps its icon as a nested instance, so the plugin swaps it (the user can swap it again)
  const withIco = (n, src) => { const ic = src ? icon(src) : null; if (ic) n.ico = { Icon: ic }; return n; };
  // a DatePicker keeps an ISO value and shows it with its displayFormat (dd MMM yyyy …)
  function fmtDate(v, f) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || '')); if (!m) return String(v || '');
    const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], y = +m[1], mo = +m[2], d = +m[3];
    return String(f || 'MMM d, y').replace(/yyyy|yy|y|MMMM|MMM|MM|M|dd|d/g, t => ({ yyyy: y, yy: String(y).slice(2), y, MMMM: MN[mo - 1], MMM: MN[mo - 1].slice(0, 3), MM: String(mo).padStart(2, '0'), M: mo, dd: String(d).padStart(2, '0'), d }[t]));
  }
  function text(c, t) {
    { const tx0 = c.tx || {}, fs0 = tx0.fs || 14;                     // UI5 sets a Bar's middle width late: a title that fits the bar many times over is one line
      if (c.box[3] > fs0 * 1.9 && /^sap\.m\.(Title|Text)$/.test(c.cls || '')) { let p = D.controls.find(k => k.id === c.parent), n = 0; while (p && p.cls !== 'sap.m.Bar' && n++ < 6) p = D.controls.find(k => k.id === p.parent);
        if (p && p.cls === 'sap.m.Bar' && String(t).length * fs0 * 0.62 < p.box[2] - 64) c = Object.assign({}, c, { box: [c.box[0], c.box[1], Math.ceil(String(t).length * fs0 * 0.62) + 8, Math.round(fs0 * 1.45)] }); } }
    const tx = c.tx || {}, fs = tx.fs || 14, wrap = c.box[3] > fs * 1.9;
    // Lines Make really shows: the control's own maxLines, else what fits its measured box (line-clamp / fixed height). Figma then
    // truncates with "…" at that many lines instead of letting the extra lines run out of the row and get clipped.
    const lh = tx.lh || fs * 1.4, mx = Number(c.props.maxLines), ml = wrap ? (mx > 0 ? mx : Math.max(2, Math.round(c.box[3] / lh))) : 0;
    return { _src: c.id, _b: box(c), _k: 'text', _grow: grow(c), _wrap: wrap, _lineFix: !wrap, n: String(t).slice(0, 28), k: 't', t: String(t), w: R(c.box[2]), h: R(c.box[3]), st: style(c), bg: tok(hexOf(tx.fg), 'ink'), ...(wrap ? { wrap: 1, ml } : {}), ...(c.props.textAlign === 'Center' ? { ta: 'C' } : {}) };
  }
  function iconNode(name, c, w) { return name ? { _src: c.id, _b: box(c), _k: 'icon', _grow: 0, n: 'Icon ' + name, k: 'ic', ic: name, bg: tok(hexOf((c.tx || {}).fg || c.st.fg), 'ink'), w } : null; }
  const nameOf = c => c.css.includes('flyDateTile') ? 'Fare Tile' : c.css.includes('flyFlightRow') ? 'Flight Row' : c.css.includes('flyCardContent') ? 'Card Content'
    : { 'sap.m.VBox': 'Column', 'sap.m.HBox': 'Row', 'sap.m.FlexBox': 'Row', 'sap.f.DynamicPage': 'Dynamic Page', 'sap.f.DynamicPageTitle': 'Page Title', 'sap.f.DynamicPageHeader': 'Page Header', 'sap.f.Card': 'Card' }[c.cls] || c.cls.split('.').pop();

  function conv(c) {
    const n = conv0(c); if (n && typeof n === 'object' && !n._src) n._src = c.id;
    const ab = (kids[c.id] || []).filter(k => k.absPos);                                   // absolutely positioned children (connector lines, badges on a corner): free placement inside their parent
    if (n && n.c && ab.length) ab.forEach(k => { const m = conv(k); if (m) { m.abs = 1; m.xy = [R(k.box[0] - c.box[0]), R(k.box[1] - c.box[1])]; n.c.push(m); } });
    return n;
  }   // _src = the Make control a node came from (make-verify.js traces it)
  function selectDrop(c) {                                     // a Select / ComboBox drop-down (a Popover holding only a Select list): the kit's own Drop-Down part — popover frame + one item per option
    if (c.props.showHeader === true) return null;
    const deep = (n, f) => { for (const k of kids[n.id] || []) { if (f(k)) return k; const r = deep(k, f); if (r) return r; } return null; };
    const sl = deep(c, k => k.cls === 'sap.m.SelectList'), its = sl ? (kids[sl.id] || []).filter(k => /^sap\.ui\.core\.(Item|ListItem)$/.test(k.cls) && k.box[2] > 0).sort((a, b) => a.box[1] - b.box[1]) : [];
    if (!its.length || its.length > 12) return null;
    const n = inst(c, 'Drop-Down', { 'Form Factor': 'Compact' }, 'Drop-Down ' + (its.find(k => k.props.text) || { props: {} }).props.text);
    n.h = R(c.box[3]); n.dd = its.map(k => ({ t: k.props.text || '', on: sl.props.selectedKey != null && k.props.key === sl.props.selectedKey })); return n;
  }
  function conv0(c) {
    const p = c.props;
    if (/^sap\.m\.(Popover|ResponsivePopover)$/.test(c.cls)) { const dd = selectDrop(c); if (dd) return dd; }
    switch (c.cls) {
      case 'sap.tnt.ToolHeader': return shell(c);
      case 'sap.tnt.SideNavigation': return sidenav(c);
      case 'sap.m.IconTabBar': return tabs(c);
      case 'sap.m.Button': case 'sap.m.ToggleButton': {
        const inBar = /sapMBarChild/.test((c.aria && c.aria.cls) || ''), plain = (!p.type || p.type === 'Default') && inBar && c.st.bw === 0 && !c.st.bg;     // a toolbar / header button (sapMBarChild) is flat; a free-standing Default button IS bordered (the probe reads the outer element, UI5 paints the border on the inner one)
        const type = plain ? 'Tertiary' : (MAP.button_type[p.type || 'Default'] || 'Secondary');
        const blank = !!p.icon && (kids[c.id] || []).some(k => k.cls === 'sap.ui.core.Icon' && !/SAP-icons/i.test((k.tx || {}).ff || 'SAP-icons'));   // Make shows no glyph (the name is not in the SAP icon font) but keeps its room
        const ic = p.icon ? (blank ? (['info', 'accept', 'hint'].find(n => ICONS.has(n)) || [...ICONS][0]) : icon(p.icon)) : null, btn = (n) => { if (blank) n.fade = ['Icon']; return n; };
        return btn(p.text ? inst(c, 'Button', { Type: type, 'Form Factor': 'Compact', '✏️ Text': p.text, ...(ic ? { 'Icon Left': true, Icon: ic } : {}) }, 'Button ' + p.text)
          : inst(c, 'Icon Button', { Type: type === 'Primary' ? 'Primary' : type === 'Tertiary' ? 'Tertiary' : 'Secondary', 'Form Factor': 'Compact', ...(p.enabled === false ? { 'Interaction State': 'Disabled' } : {}), ...(ic ? { Icon: ic } : {}) }, 'Icon Button ' + (ic || '')));
      }
      case 'sap.m.Input': return !p.value && p.placeholder ? inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Placeholder', '✏️ Placeholder': p.placeholder }, 'Input ' + p.placeholder.slice(0, 24)) : inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || '' }, 'Input ' + (p.value || '').slice(0, 24));
      case 'sap.m.MultiComboBox': {                            // nothing selected: hide the kit's sample tokens, show the placeholder in the nested Input
        const n = inst(c, 'Multi Combobox', { 'Form Factor': 'Compact', 'Drop-Down': 'False' }, 'Multi Combobox ' + (p.placeholder || ''));
        n.hide = ['1st Token', '2nd Token', 'Overflow Link / Typing'];                       // the kit's sample tokens
        if (p.placeholder) n.add = [{ into: '⿻ Tokens Compact', t: p.placeholder, st: 'MediumText/LHAuto/Regular', bg: 'sapField_PlaceholderTextColor' }];   // the kit has no placeholder layer: text goes into the tokens slot
        return n;
      }
      case 'sap.m.DateRangeSelection': case 'sap.m.DatePicker': return inst(c, 'Date (Range) Picker', { 'Form Factor': 'Compact', Calendar: false }, 'Date Picker ' + (p.placeholder || ''), { 'Input Text': fmtDate(p.value, p.displayFormat) || p.placeholder || '' });
      case 'sap.m.SearchField': return inst(c, 'Input', { 'Form Factor': 'Compact', Content: 'Typed Text', '✏️ Typed Text': p.value || p.placeholder || '' }, 'Search ' + (p.placeholder || ''));
      case 'sap.m.CheckBox': return inst(c, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': p.text || '', Check: p.selected ? 'Checked' : 'Unchecked' }, 'Check Box ' + (p.text || ''));
      case 'sap.m.Switch': return inst(c, 'Switch', { 'Form Factor': 'Compact', Checked: p.state ? 'True' : 'False' }, 'Switch');
      case 'sap.m.Select': return inst(c, 'Select', { 'Form Factor': 'Compact' }, 'Select ' + (c.selText || ''), { 'Input Text': c.selText || '' });
      case 'sap.m.Link': return inst(c, 'Link', { Type: 'Regular', 'Icon Position': 'N/A', '✏️ Text': p.text || '' }, 'Link ' + (p.text || ''));
      case 'sap.m.Label': return inst(c, 'Label', { '✏️ Label': p.text || '' }, 'Label ' + (p.text || ''));
      case 'sap.m.ObjectNumber': return inst(c, 'Object Number', { Type: p.emphasized === false ? 'Regular' : 'Emphasized', Semantic: p.state && p.state !== 'None' ? p.state : 'None' }, 'Object Number ' + p.number, { '956.00 EUR': [p.number, p.unit].filter(Boolean).join(' ') });
      case 'sap.m.Avatar': {
        if (p.initials) return inst(c, 'Avatar', { Type: 'Initials', Size: p.displaySize || 'S', Color: MAP.avatar_color[p.backgroundColor] || '6', '✏️ Initials': p.initials }, 'Avatar ' + p.initials);
        const sz = { 24: 'XS', 32: 'S', 48: 'M', 64: 'L', 112: 'XL' }[Math.round(c.box[2])];
        if (sz && /^sap-icon:\/\//.test(p.src || '') && p.backgroundColor !== 'Transparent') { const n = inst(c, 'Avatar', { Type: 'Icon', Size: sz, Color: MAP.avatar_color[p.backgroundColor] || '6' }, 'Avatar'); n.w = n.h = R(c.box[2]); n.s = 'XX'; return n; }
        const g = iconNode(icon(p.src), c, 24); return { _b: box(c), _k: 'frame', _grow: 0, n: 'Icon Tile', d: 'H', a: 'CC', w: R(c.box[2]), h: R(c.box[3]), c: g ? [{ ...g, s: 'XX', w: 24, h: 24 }] : [] };
      }
      case 'sap.m.Text': return text(c, p.text || '');
      case 'sap.m.FeedListItem': {                                   // comment / message row: avatar + [sender link + message, info · time]
        const k0 = ch(c), av = k0.find(k => k.cls === 'sap.m.Avatar'), lk = k0.find(k => k.cls === 'sap.m.Link');
        if (!lk || !p.text) return frame(c, 'FeedListItem');
        const x2 = lk.box[0] + lk.box[2] + 4, w2 = Math.max(80, c.box[0] + c.box[2] - x2 - 16), fs = 14, lh = 19.6, x = lk.box[0];
        const lines = Math.max(1, Math.ceil(String(p.text).length * 7.2 / w2)), meta = [p.info, p.timestamp].filter(Boolean).join(' · ');
        const ms = Object.assign({}, c, { id: c.id + '-t', box: [x2, lk.box[1], w2, lines * lh], props: {}, tx: { fs, fw: 400, fg: '#131e29', ff: '72', lh } });
        const mt = Object.assign({}, c, { id: c.id + '-m', box: [x, lk.box[1] + lines * lh + 8, c.box[0] + c.box[2] - x - 16, 16], props: {}, tx: { fs: 12, fw: 400, fg: '#556b82', ff: '72', lh: 16 } });
        const line = layout({ _b: [x, lk.box[1], c.box[0] + c.box[2] - x - 16, lines * lh], _k: 'frame', n: 'Message', d: 'H' }, [conv(lk), text(ms, p.text)], { V: false, st: { ai: 'flex-start' }, flex: true });
        const col = layout({ _b: [x, lk.box[1], c.box[0] + c.box[2] - x - 16, lines * lh + 8 + (meta ? 16 : 0)], _k: 'frame', n: 'Column', d: 'V' }, [line, meta ? text(mt, meta) : null].filter(Boolean), { V: true, st: {}, flex: false });
        const sib = D.controls.filter(k => k.parent === c.parent && k.cls === c.cls), last = c.box[1] >= Math.max(...sib.map(k => k.box[1]));
        const row = layout({ _b: box(c), _k: 'frame', n: 'FeedListItem', d: 'H', bg: 'sapList_Background' }, [av && conv(av), col].filter(Boolean), { V: false, st: { ai: 'flex-start' }, flex: true });
        if (!last) { row.bc = 'sapList_BorderColor'; row.bw = [0, 0, 1, 0]; }
        return row;
      }
      case 'sap.ui.unified.Calendar': return inst(c, 'Calendar', { 'Form Factor': 'Compact', 'Week Numbers': false }, 'Calendar');
      case 'sap.m.ObjectAttribute': return text(c, (p.title ? p.title + ': ' : '') + (p.text || ''));
      case 'sap.m.ObjectHeader': {                                   // title is a property of the header; attributes / statuses are its children
        const extraT = p.title ? [text(Object.assign({}, c, { id: c.id + '-title', box: [c.box[0] + 16, c.box[1] + 16, Math.max(80, c.box[2] - 32), 24], props: {}, tx: { fs: 20, fw: 700, fg: '#131e29', ff: '72-Bold', lh: 24 } }), p.title)] : [];
        return frame(c, 'ObjectHeader', { geo: true, extra: extraT });
      }
      case 'sap.m.TextArea': return inst(c, 'Text Area', { 'Form Factor': 'Compact', Content: p.value ? 'Typed Text' : 'Placeholder', '✏️ Placeholder': p.placeholder || '', '✏️ Typed Text': p.value || '' }, 'Text Area ' + (p.placeholder || p.value || '').slice(0, 24));
      case 'sap.m.FeedInput': {                                      // reply box: text area + send button
        const k0 = ch(c), ta = k0.find(k => k.cls === 'sap.m.TextArea'), bt = k0.find(k => k.cls === 'sap.m.Button');
        if (!ta) return frame(c, 'FeedInput');
        const tn = conv(ta), bn = bt && conv(bt); if (tn) { tn._grow = 1; if (bt && bt.box[0] > ta.box[0]) tn._b = [ta.box[0], ta.box[1], bt.box[0] - ta.box[0] - 8, ta.box[3]]; }   // Make lets the send button sit on the text area's right padding
        return layout({ _b: box(c), _k: 'frame', n: 'FeedInput', d: 'H' }, [tn, bn].filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
      }
      case 'sap.m.GroupHeaderListItem': {                            // "Sort Order" / "Sort By" band of a list
        const t = Object.assign({}, c, { id: c.id + '-t', box: [c.box[0] + 16, c.box[1] + (c.box[3] - 18) / 2, Math.max(40, c.box[2] - 32), 18], props: {}, tx: { fs: 14, fw: 700, fg: '#131e29', ff: '72-Bold', lh: 18 } });
        return layout({ _b: box(c), _k: 'frame', n: 'Group Header', d: 'H', bg: 'sapList_GroupHeaderBackground', bc: 'sapList_GroupHeaderBorderColor', bw: [0, 0, 1, 0] }, [text(t, p.title || '')], { V: false, st: { ai: 'center' }, flex: true });
      }
      case 'sap.m.StandardListItem': {                               // list row: radio / check box + title (+ description)
        const k0 = ch(c), rb = k0.find(k => k.cls === 'sap.m.RadioButton'), cb = k0.find(k => k.cls === 'sap.m.CheckBox'), ttl = p.title || '';
        let lead;
        if (rb) lead = inst(rb, 'Radio Button', { 'Form Factor': 'Compact', Label: true, '✏️ Text': ttl, Selected: (p.selected || rb.props.selected) ? 'True' : 'False' }, 'Radio Button ' + ttl);
        else if (cb) lead = inst(cb, 'Check Box', { 'Form Factor': 'Compact', Label: true, '✏️ Text': ttl, Check: (p.selected || cb.props.selected) ? 'Checked' : 'Unchecked' }, 'Check Box ' + ttl);
        else if (ttl) lead = text(Object.assign({}, c, { id: c.id + '-t', box: [c.box[0] + 16, c.box[1] + (c.box[3] - 18) / 2, Math.max(40, c.box[2] - 32), 18], props: {}, tx: { fs: 14, fw: 400, fg: '#131e29', ff: '72', lh: 18 } }), ttl);
        if (!lead && !rb && !cb || (!rb && !cb && (p.description || p.icon))) {              // kit List Item: Byline (title + description) with the leading icon
          const ic = p.icon ? icon(p.icon) : null, byl = !!p.description;
          const li = inst(c, 'List Item', Object.assign({ Type: byl ? 'Byline' : 'Single Line', 'Form Factor': 'Compact', Separator: true, Attachment: false, '✏️ Text': ttl }, byl ? { '✏️ Byline': p.description } : { 'Icon / Selector': !!ic, 'Leading Icon': !!ic }, !byl && ic ? { 'Leading Icon Swap': ic } : {}), 'List Item ' + ttl.slice(0, 24));
          li.h = R(c.box[3]); li._intr = li.h; li.s = 'FX';
          if (!(byl && ic)) return li;
          // the kit's Byline row has no icon slot: a real icon instance sits at Make's place (absolute), the text container is pushed right by the icon's width
          const ib = (ch(c).find(k => k.cls === 'sap.ui.core.Icon') || { box: [c.box[0] + 4, c.box[1] + (c.box[3] - 32) / 2, 44, 32] }).box, ix = ib[0] - c.box[0] + (ib[2] - 16) / 2, iy = ib[1] - c.box[1] + (ib[3] - 16) / 2;
          li.shift = { 'Text Container': R(ib[0] - c.box[0] + ib[2] - 16) };
          const icn = { _src: c.id + '-ic', _b: [c.box[0] + ix, c.box[1] + iy, 16, 16], _k: 'icon', _grow: 0, n: 'Icon ' + ic, k: 'ic', ic, bg: tok('#556b82', 'ink'), w: 16, abs: 1, xy: [R(ix), R(iy)] };
          return { _src: c.id, _b: box(c), _k: 'frame', _grow: grow(c), n: 'List Item ' + ttl.slice(0, 24), d: 'V', w: R(c.box[2]), h: R(c.box[3]), s: 'FX', c: [li, icn] };
        }
        if (!lead) return frame(c, 'List Item');
        lead._b = [c.box[0] + 8, c.box[1] + (c.box[3] - (lead.h || 16)) / 2, lead.w || c.box[2] - 16, lead.h || 16];
        return layout({ _b: box(c), _k: 'frame', n: 'List Item ' + ttl.slice(0, 24), d: 'H', bg: 'sapList_Background', bc: 'sapList_BorderColor', bw: [0, 0, 1, 0] }, [lead], { V: false, st: { ai: 'center' }, flex: true });
      }
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
      case 'x.Svg': { const fg = hexOf((c.tx || {}).fg || c.st.fg); return { _src: c.id, _b: box(c), _k: 'vec', _grow: 0, n: 'Icon', k: 'v', svg: String(p.svg), w: R(c.box[2]), h: R(c.box[3]), bg: tok(fg || '#556b82', 'ink'), s: 'XX' }; }
      case 'sap.ui.core.HTML': return htmlNode(c);
      case 'sap.m.Panel': {                                    // UI5 paints a Panel's white on its inner content area, not on the panel element the probe reads
        const n = frame(c, 'Panel'); if (!n.bg) n.bg = tok('#ffffff', 'fill'); return n;
      }
      case 'sap.m.ToolbarSpacer': return { _b: box(c), _k: 'spacer', _grow: 1 };                // a toolbar's flexible gap
      case 'sap.m.Table': return table(c);
      case 'sap.f.DynamicPageTitle': {
        const all = ch(c), tb = all.find(k => k.cls === 'sap.m.OverflowToolbar');
        if (!tb) return frame(c, nameOf(c), { geo: true });                          // the actions toolbar is not on screen: heading and buttons are placed by their boxes (the CSS says 'column')
        const inTb = k => k !== tb && k.box[0] >= tb.box[0] - 1 && k.box[0] + k.box[2] <= tb.box[0] + tb.box[2] + 1 && k.box[1] >= tb.box[1] - 1 && k.box[1] + k.box[3] <= tb.box[1] + tb.box[3] + 1;
        const real = k => k.cls !== 'sap.m.ToolbarSpacer', inside = all.filter(inTb).filter(real), rest = all.filter(k => k !== tb && !inTb(k)).filter(real);
        const tbNode = layout({ _b: box(tb), _k: 'frame', _grow: 1, n: 'Actions', d: 'H' }, inside.map(conv).filter(Boolean), { V: false, st: { ai: 'center', jc: 'flex-end' }, flex: true });
        const node = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Page Title', d: 'H' }; if (c.st.bg) node.bg = tok(hexOf(c.st.bg), 'fill');
        const left = rest.map(conv).filter(Boolean), lead = left.length > 1 ? layout({ _b: union(left), _k: 'frame', n: 'Title Content', d: 'H' }, left, { V: false, st: { ai: 'center' }, flex: true }) : left[0];
        // heading on the left, actions on the right: the title row spreads them (space-between), the actions part takes the free width — no fixed gap that would break when the page resizes
        return layout(node, [lead, tbNode].filter(Boolean), { V: false, st: { ai: 'center', jc: 'space-between', pad: c.st.pad }, flex: true });
      }
      case 'sap.m.GenericTile': return tile(c);
      case 'sap.m.NumericContent': return numeric(c);
      case 'sap.m.ObjectStatus': {
        const sem = { None: 'None', Success: 'Success', Warning: 'Warning', Error: 'Error', Information: 'Information' }[p.state || 'None'] || 'None';   // the kit component carries the state colour (and the badge when Inverted)
        if (p.title && c.box[2] > 40) {                              // "Priority: ● Critical" — the kit status has no title: a muted label in front of it
          const tw = Math.min(Math.round(p.title.length * 6.3) + 6, Math.round(c.box[2] * 0.6));
          const tn = text(Object.assign({}, c, { id: c.id + '-title', box: [c.box[0], c.box[1], tw, c.box[3]], props: {}, tx: Object.assign({}, c.tx, { fw: 400, fg: '#556b82', ff: '72' }) }), p.title + ':');
          const ic1 = sem === 'None' && p.icon ? icon(p.icon) : null;                       // a status without a state has no icon slot: a real icon in front of the text
          const sn = ic1 ? layout({ _b: [c.box[0] + tw, c.box[1], c.box[2] - tw, c.box[3]], _k: 'frame', n: 'Object Status ' + (p.text || ''), d: 'H' }, [iconNode(ic1, Object.assign({}, c, { box: [c.box[0] + tw, c.box[1], 16, c.box[3]] }), 16), inst(Object.assign({}, c, { box: [c.box[0] + tw + 20, c.box[1], c.box[2] - tw - 20, c.box[3]] }), 'Object Status', { Semantic: 'None', Inverted: 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' })], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true })
            : withIco(inst(Object.assign({}, c, { box: [c.box[0] + tw, c.box[1], c.box[2] - tw, c.box[3]] }), 'Object Status', { Semantic: sem, Inverted: p.inverted === true ? 'Yes' : 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' }), p.icon);
          if (ic1) { sn.g = 4; sn.a = 'MC'; sn.s = 'HH'; }
          sn.s = 'XX'; const rw = layout({ _b: box(c), _k: 'frame', n: 'Object Status ' + p.title, d: 'H' }, [tn, sn], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true }); rw.g = 4; rw.a = 'MC'; return rw;   // label and badge: vertically centred, a 4 px gap
        }
        { const ic0 = sem === 'None' && p.icon ? icon(p.icon) : null;                        // the kit status without a state has no icon slot: a real icon (swappable) in front of the text
          if (ic0 && c.box[2] > 24) {
            const icn = iconNode(ic0, Object.assign({}, c, { box: [c.box[0], c.box[1], 16, c.box[3]] }), 16);
            const sn = inst(Object.assign({}, c, { box: [c.box[0] + 20, c.box[1], c.box[2] - 20, c.box[3]] }), 'Object Status', { Semantic: 'None', Inverted: 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' });
            const rw = layout({ _b: box(c), _k: 'frame', n: 'Object Status ' + (p.text || ''), d: 'H' }, [icn, sn], { V: false, st: { ai: 'center', jc: 'flex-start' }, flex: true }); rw.g = 4; rw.a = 'MC'; return rw;
          } }
        const os = withIco(inst(c, 'Object Status', { Semantic: sem, Inverted: p.inverted === true ? 'Yes' : 'No' }, 'Object Status ' + (p.text || ''), { Text: p.text || '' }), p.icon);
        if (!p.icon && sem !== 'None') { os.hide = ['Icon Container']; os.fit = ['Text']; }
        return os;
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
      case 'sap.m.SegmentedButton': {                          // kit: one Segmented Button Singular per segment (the selected one is Toggled)
        // one segment per position: UI5 renders each SegmentedButtonItem AND its own inner Button ("__item5" + "__item5-button") at the same box —
        // both were converted, so every segment came out twice ("Cheapest | Cheapest", 2026-10-05). The item wins; a lone Button stays.
        const items = ch(c).filter(k => /^sap\.m\.(Button|ToggleButton|SegmentedButtonItem)$/.test(k.cls)).sort((a, b) => a.box[0] - b.box[0] || (a.cls === 'sap.m.SegmentedButtonItem' ? -1 : 1))
          .filter((k, i, arr) => !arr.slice(0, i).some(o => Math.abs(o.box[0] - k.box[0]) < 2 && Math.abs(o.box[2] - k.box[2]) < 2));
        if (!items.length) return frame(c, 'Segmented Button');
        const segs = items.map(k => ({ t: k.props.text || '', ic: k.props.icon ? icon(k.props.icon) : null, on: /SegBBtnSel|ToggleBtnPressed|Pressed/.test((k.aria && k.aria.cls) || '') }));
        if (segs.length > 5) { const nodes = items.map((k, i) => inst(k, 'Segmented Button Singular', Object.assign({ 'Form Factor': 'Compact', Type: segs[i].t ? 'Text' : 'Icon', Toggled: segs[i].on ? 'True' : 'False' }, segs[i].t ? { '✏️ Text': segs[i].t } : {}, segs[i].ic ? (segs[i].t ? { 'Icon Left': true, Icon: segs[i].ic } : { Icon: segs[i].ic }) : {}), 'Segment ' + (segs[i].t || segs[i].ic || ''))); return layout({ _b: box(c), _k: 'frame', n: 'Segmented Button', d: 'H' }, nodes, { V: false, st: {}, flex: false }); }   // the kit part holds at most 5
        const sb = inst(Object.assign({}, c, { box: [c.box[0], c.box[1], c.box[2], c.box[3]] }), 'Segmented Button', { 'Form Factor': 'Compact', Type: segs.some(s => s.t) ? 'Text' : 'Icon', '3rd Button': segs.length >= 3, '4th Button': segs.length >= 4, '5th Button': segs.length >= 5 }, 'Segmented Button');
        sb.seg = segs; sb._w = null;
        return layout({ _b: box(c), _k: 'frame', n: 'Segmented Button Row', d: 'H' }, [sb], { V: false, st: {}, flex: false });
      }
      case 'sap.uxap.AnchorBar': {                             // Object Page: the section buttons are Inline tabs of the kit tab bar
        const bts = ch(c).filter(k => /^sap\.m\.(Button|ToggleButton|MenuButton)$/.test(k.cls) && k.props.text).sort((a, b) => a.box[0] - b.box[0]);
        if (!bts.length) return frame(c, 'Anchor Bar');
        const si = Math.max(0, bts.findIndex(k => /Selected/.test((k.aria && k.aria.cls) || '')));
        const nodes = bts.map((k, i) => ({ ...inst(k, 'Tab', { Type: 'Inline', 'Interaction State': i === si ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': k.props.text }, 'Tab ' + k.props.text), _w: null }));
        return layout({ _b: box(c), _k: 'frame', n: 'Anchor Bar', d: 'H', bg: tok(hexOf(c.st.bg || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
      }
      default: {
        const row = MAP.controls && MAP.controls[c.cls], kc = row && KIT.components[row.comp];
        if (row && kc) {                                         // data-driven: make-map.json "controls"
          const pr = {}, kp = new Set(Object.keys(kc.props || {}).map(k => k.replace(/#.*$/, '')));
          if (kp.has('Form Factor')) pr['Form Factor'] = 'Compact';
          for (const [k, spec] of Object.entries(row.props || {})) {
            if (typeof spec === 'string') { pr[k] = spec.slice(1); continue; }
            let v = c.props[spec.from];
            if (spec.icon) { const ic = icon(v); if (ic) pr[k] = ic; continue; }
            if (spec.pct) { const mn = Number(c.props[spec.pct[0]] ?? 0), mx = Number(c.props[spec.pct[1]] ?? 100), q = Math.round(((Number(v ?? mn) - mn) / ((mx - mn) || 1)) * 4) * 25; const lo = spec.clamp ? spec.clamp[0] : 0, hi = spec.clamp ? spec.clamp[1] : 100; pr[k] = Math.max(lo, Math.min(hi, q)) + '%'; continue; }
            if (v === undefined || v === null || v === '') { if (spec.def === undefined) continue; v = spec.def; }
            else if (spec.map) v = spec.map[String(v)] !== undefined ? spec.map[String(v)] : (spec.def !== undefined ? spec.def : v);
            if (spec.not) v = !v;
            if (spec.bool) v = !!v && v !== 'false';
            if (spec.boolStr) v = (v === true || v === 'true' || v === 'True') ? 'True' : 'False';
            pr[k] = v;
          }
          const tx = {}; for (const [layer, from] of Object.entries(row.tx || {})) { const v = c.props[from]; if (v !== undefined && v !== '') tx[layer] = String(v); }
          return inst(c, row.comp, pr, row.comp + ' ' + String(c.props.text || c.props.value || c.props.title || '').slice(0, 24), Object.keys(tx).length ? tx : undefined);
        }
        if (!CONTAINERS.has(c.cls) && WIDGET.test(c.cls)) {      // an unmapped input-like widget: its inner parts (arrow icon, tokenizer, clear button) are not layout — keep only its box, never its innards
          WARN.push(`control ${c.cls} is not mapped to a SAP kit component — empty frame of its size (its inner parts are not converted)`);
          const n = { _src: c.id, _b: box(c), _k: 'frame', _sized: true, _grow: grow(c), n: nameOf(c), d: 'H', w: R(c.box[2]), h: R(c.box[3]), s: c.props.width === '100%' ? 'FX' : 'XX', c: [] };
          if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
          if (c.st.bw > 0) { n.bc = tok(hexOf(c.st.bc), 'border') || 'sapField_BorderColor'; n.bw = c.st.bw; }
          if (c.st.br) n.r = Math.round(c.st.br);
          return n;
        }
        if (!CONTAINERS.has(c.cls) && !(MAP.containers_ok || []).includes(c.cls) && !ch(c).length && (c.props.text || c.props.title || c.props.value) && !WIDGET.test(c.cls)) {      // a control this converter has never seen, with its own text: show the text, never an empty frame
          WARN.push(`control ${c.cls} is not mapped to a SAP kit component — its text is shown as plain text`);
          return text(c, String(c.props.text || c.props.title || c.props.value));
        }
        if (!CONTAINERS.has(c.cls) && !(MAP.containers_ok || []).includes(c.cls)) WARN.push(`control ${c.cls} is not mapped to a SAP kit component — plain frame`);
        return frame(c, nameOf(c));
      }
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
    if (st.sh) { const bl = Math.max(...(String(st.sh).match(/(\d+(?:\.\d+)?)px/g) || ['0px']).map(parseFloat).slice(0, 4)); n.fxk = KIT.effects[bl > 4 ? 'Shadow/sapContent_Shadow1' : 'Shadow/sapContent_Shadow0'] || KIT.effects['Shadow/sapContent_Shadow1']; }
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
      else { const el = { tag: m[2].toLowerCase(), css: cssOf((/style="([^"]*)"/.exec(m[3]) || [])[1]), cls: (/class="([^"]*)"/.exec(m[3]) || [])[1] || '', kids: [] }; stack[stack.length - 1].kids.push(el); stack.push(el); }
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
      const css = { ...inh, ...el.css }, sub = el.kids.filter(k => k.tag), own = top && c.st.display === 'flex' ? { display: 'flex', 'flex-direction': c.st.dir === 'column' ? 'column' : 'row', gap: String(c.st.gap || '').split('/')[0], ...el.css } : el.css;
      if (!top && /line|track/i.test(el.cls || '')) {                                // "fsLine": a rule left and right of its label
        const lf = leaf(el, inh), rule = () => ({ _k: 'frame', n: 'Line', d: 'V', s: 'FX', w: 10, h: 1, bg: tok('#d9d9d9', 'border') });
        if (lf) return { _k: 'frame', n: 'Line', d: 'H', a: 'MC', g: 8, c: [rule(), lf, rule()], s: 'FH', w: lf.w + 28, h: lf.h };
      }
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
    return Object.assign(inst(c, 'Shell Bar', { ...(menu ? { Hamburger: 'True' } : {}), 'Shell Search': ch(c).some(k => k.cls === 'sap.m.SearchField'), Help: false, Overflow: false }, 'Shell Bar', Object.assign({ Text: title }, (ch(c).find(k => k.cls === 'sap.m.SearchField') || { props: {} }).props.placeholder ? { Placeholder: ch(c).find(k => k.cls === 'sap.m.SearchField').props.placeholder } : {})), { av: SHELL.initials });
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
    const filters = ch(c).filter(k => k.cls === 'sap.m.IconTabFilter'), withIcon = filters.length > 0 && filters.every(t => t.props.icon && icon(t.props.icon) && t.box[3] >= 56);   // icon over the label (tall filter); a flat tab keeps the plain kit tab
    const nodes = filters.map(t => {
      const act = t.props.key === sk, tName = 'Tab ' + t.props.text;
      if (!withIcon) return { ...inst(t, 'Tab', { Type: 'Inline', 'Interaction State': act ? 'Regular Active' : 'Regular Inactive', 'Menu Arrow': false, '✏️ Text': t.props.text || '' }, tName), _w: null };
      const ib = inst(Object.assign({}, t, { box: [t.box[0], t.box[1], 38, 38] }), 'Tab', { Type: 'Icon Only', 'Form Factor': 'Compact', 'Interaction State': act ? 'Regular Active' : 'Regular Inactive', 'Icon': icon(t.props.icon), 'Item Count': !!t.props.count, 'Item Count Text': String(t.props.count || '') }, 'Tab icon ' + t.props.text);   // Make: circle icon over the label (the kit's Process and Filter tab is side by side)
      if (!t.props.text) { ib.w = R(t.box[2]); ib.h = R(t.box[3]); return ib; }                       // icon-only tab: the kit part as it is (its own selection bar)
      if (act) ib.hide = ['Selection Bar'];                                                                   // the kit's bar sits under the icon: Make draws it under the label
      const lb = text(Object.assign({}, t, { id: t.id + '-lbl', box: [t.box[0], t.box[1] + 40, t.box[2], 18], props: {}, tx: Object.assign({}, t.tx, { fs: 14, fw: 700, fg: act ? '#0064d9' : '#1d2d3e', ff: '72-Bold', lh: 18 }) }), t.props.text || '');
      Object.assign(lb, { s: 'FH', wrap: 1, ml: 1, ta: 'C' });                        // Make cuts a long label at the tab width with "…"
      const bar = { _src: t.id + '-bar', _b: [t.box[0], t.box[1] + 62, t.box[2], 3], _k: 'frame', _grow: 0, n: 'Selection Bar', d: 'V', w: R(t.box[2]), h: 3, s: 'XX', c: [], ...(act ? { bg: tok('#0064d9', 'border') } : {}) };
      const tf = layout({ _b: box(t), _k: 'frame', n: tName, d: 'V' }, [ib, lb, bar], { V: true, st: {}, flex: false });
      tf.a = 'MC'; tf.s = 'XH'; tf.w = R(t.box[2]);
      tf.c.forEach(k => { if (k.k === 't') { k.s = 'XX'; k.w = R(t.box[2]); k.h = 18; k.ml = 1; k.wrap = 1; } });   // fixed width: a long label is cut with "…"
      return tf;
    });
    const OWN = k => k.cls !== 'sap.m.IconTabFilter' && k.cls !== 'sap.m.IconTabHeader' && k.cls !== 'sap.m.IconTabFilterExpandButtonBadge' && !(withIcon && k.cls === 'sap.ui.core.Icon');
    const selF = filters.find(t => t.props.key === sk) || filters[0];
    const content = ch(c).filter(OWN).concat(selF ? ch(selF).filter(OWN) : []);   // the content of the selected tab sits under its filter
    const hdrNode = layout({ _b: (hdr.box && c.box[3] - hdr.box[3] > 8 ? hdr.box : box(c)).slice(), _k: 'frame', n: 'Icon Tab Bar', d: 'H', bg: tok(hexOf((hdr.st && hdr.st.bg) || '#ffffff'), 'fill'), bc: tok('#d9d9d9', 'border'), bw: [0, 0, 1, 0] }, nodes, { V: false, st: c.st, flex: false });
    if (hdrNode.p && hdrNode.p[1] > 200) hdrNode.p[1] = 0;          // tabs sit at the start; the free width to the right is not padding
    if (!content.length) return hdrNode;                          // a tab bar that also holds the tab content (cards, lists…): headers on top, content below
    const body = content.map(k => { const n = conv(k); if (!n || k.cls !== 'sap.m.List') return n;                         // Make: a list in a tab sits on the grey content area, with the cards inset
      const top = Math.max(k.box[1] - 16, hdr.box ? hdr.box[1] + hdr.box[3] : k.box[1] - 16); return layout({ _b: [c.box[0], top, c.box[2], k.box[1] + k.box[3] + 16 - top], _k: 'frame', n: 'Tab Content', d: 'V', bg: 'sapBackgroundColor' }, [n], { V: true, st: {}, flex: false }); }).filter(Boolean);
    return layout({ _b: box(c), _k: 'frame', _grow: grow(c), n: 'Icon Tab Bar', d: 'V' }, [hdrNode, ...body], { V: true, st: {}, flex: false });
  }
  // ── sap.m.Table: a real <table> (display table / table-row / table-cell), so the controls' boxes say nothing about rows and columns by themselves.
  // The Column controls (the header cells) give the x-range of every column; each ColumnListItem is one row; a cell control belongs to the column its centre sits in.
  // Every row becomes an auto-layout row whose cells have the column widths (the column without a width flexes), so header and rows line up and the table resizes.
  function table(c) {
    const all = ch(c), cols = all.filter(k => k.cls === 'sap.m.Column').sort((a, b) => a.box[0] - b.box[0]);
    const items = all.filter(k => k.cls === 'sap.m.ColumnListItem').sort((a, b) => a.box[1] - b.box[1]);
    if (!cols.length) return frame(c, 'Table');
    const rest = all.filter(k => !cols.includes(k) && !items.includes(k)), TX = c.box[0], TW = c.box[2], right = TX + TW, lastC = cols[cols.length - 1];
    const segs = cols.map(k => ({ k, x: k.box[0], w: k.box[2], hA: k.props.hAlign }));
    if (segs[0].x - TX > 1.5) segs.unshift({ x: TX, w: segs[0].x - TX });                                   // leading cell (selection box)
    if (right - (lastC.box[0] + lastC.box[2]) > 1.5) segs.push({ x: lastC.box[0] + lastC.box[2], w: right - (lastC.box[0] + lastC.box[2]) });   // trailing cell (navigation arrow)
    let flex = segs.filter(s => s.k && !px(s.k.props.width));
    if (!flex.length) flex = [segs.filter(s => s.k).sort((a, b) => b.w - a.w)[0]];
    else if (flex.length > 1 && flex.length === segs.filter(s => s.k).length) flex = [flex.slice().sort((a, b) => b.w - a.w)[0]];   // all auto: fill-sharing would ignore Make's widths (cells with content cannot shrink) → fixed widths, one flexible
    flex.forEach(s => { s.flex = true; });
    segs.forEach(s => { s.ox = s.x; s.ow = s.w; });                                                          // Make's own column geometry: cell contents keep their offsets from it
    {                                                                                                          // Make lets a wide table scroll sideways; a Figma table must fit its width → the flexible column gives way first, then the others shrink in proportion
      let over = Math.max(...segs.map(s => s.ox + s.ow)) - right;
      if (over > 1.5) {
        const minOf = s => (s.flex ? 120 : 64), slack = segs.reduce((q, s) => q + Math.max(0, s.w - minOf(s)), 0);   // every column gives up a share of what it has above its minimum
        if (slack > 0) { const f = Math.min(1, over / slack); segs.forEach(s => { s.w -= Math.max(0, s.w - minOf(s)) * f; }); over -= Math.min(over, slack); }
        if (over > 1.5) { const tot = segs.reduce((q, s) => q + s.w, 0), f = Math.max(0.3, (tot - over) / tot); segs.forEach(s => { s.w = Math.max(40, s.w * f); }); }
        let x = TX; segs.forEach(s => { s.x = x; s.w = R5(s.w); x += s.w; });
      }
    }
    const segOf = k => { const m = k.box[0] + k.box[2] / 2; let j = segs.findIndex(s => m >= s.ox - 0.5 && m <= s.ox + s.ow + 0.5); if (j < 0) j = m < segs[0].ox ? 0 : segs.length - 1; return j; };
    const cell = (s, list, y, h) => {                                                                        // one cell: the control(s) of that column in that row, placed by their real offsets
      const nodes = list.map(conv).filter(Boolean), n = { _b: [s.x, y, s.w, h], _k: 'frame', _sized: true, n: 'Cell', d: 'H', a: 'MC', w: R(s.w), h: R(h), s: (s.flex ? 'F' : 'X') + 'F', c: [] };
      if (!nodes.length) return n;
      const b = union(nodes), l = Math.max(0, R5(b[0] - s.ox)), r = Math.max(0, R5(s.ox + s.ow - (b[0] + b[2]))), top = b[1] - y, bot = y + h - (b[1] + b[3]);
      const endAl = s.hA === 'End' || s.hA === 'Right' || (!s.k && r + 1.5 < l);                           // the column's hAlign decides; a leading / trailing cell has none, there the offsets decide
      const pt = Math.abs(top - bot) <= 2 ? 0 : Math.max(0, R5(top)), pb = Math.abs(top - bot) <= 2 ? 0 : Math.max(0, R5(bot));
      const k = nodes.length === 1 ? nodes[0] : layout({ _b: b, _k: 'frame', n: 'Column', d: 'V' }, nodes, { V: true, st: {}, flex: false });
      k.s = letters(k, false, [s.w - (endAl ? r : l), h - pt - pb], 'C');
      if (s.flex && k._k === 'frame' && !/^F/.test(k.s) && k._b[2] >= s.w - l - r - 1.5 && !k._w) k.s = 'F' + k.s[1];   // a control that spans a flexible column flexes with it
      const pr = endAl ? r : (/^F/.test(k.s) ? r : 0);                                                      // free space right of a hugging control is not padding; a control that fills the cell keeps the cell's own right padding
      Object.assign(n, { a: (endAl ? 'X' : 'M') + (pt || pb ? 'M' : 'C'), c: [k], ...(pt || pb || l || pr ? { p: [pt, pr, pb, endAl ? 0 : l] } : {}) });
      return n;
    };
    const rowOf = (src, name, y, h, cells) => {
      const n = { _src: src.id, _b: [TX, y, TW, h], _k: 'frame', _sized: true, _fixH: true, n: name, d: 'H', a: 'MC', w: R(TW), h: R(h), s: 'FX', c: cells, bc: 'sapList_BorderColor', bw: [0, 0, 1, 0] };
      if (src.st.bg) n.bg = tok(hexOf(src.st.bg), 'fill');
      return n;
    };
    const parts = rest.map(k => ({ y: k.box[1], n: conv(k) }));
    const hy = Math.min(...cols.map(k => k.box[1])), hh = Math.max(...cols.map(k => k.box[3]));
    parts.push({ y: hy, n: rowOf(cols[0], 'Header Row', hy, hh, segs.map(s => cell(s, s.k ? ch(s.k) : [], hy, hh))) });
    items.forEach(it => { const per = segs.map(() => []); ch(it).forEach(k => per[segOf(k)].push(k)); parts.push({ y: it.box[1], n: rowOf(it, 'Row', it.box[1], it.box[3], segs.map((s, i) => cell(s, per[i], it.box[1], it.box[3]))) }); });
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), n: 'Table', d: 'V' }; if (c.st.bg) n.bg = tok(hexOf(c.st.bg), 'fill');
    return layout(n, parts.filter(p => p.n).sort((a, b) => a.y - b.y).map(p => p.n), { V: true, st: {}, flex: false });
  }
  function cardHeader(c) {
    const av = ch(c).find(k => k.cls === 'sap.m.Avatar'), tx = ch(c).find(k => k.cls === 'sap.m.Text'), out = [];
    if (av) out.push(conv(av)); if (tx) out.push(text(tx, tx.props.text || ''));
    return layout({ _b: box(c), _k: 'frame', n: 'Card Header', d: 'H' }, out.filter(Boolean), { V: false, st: { ai: 'center' }, flex: true });
  }
  function frame(c, name, o = {}) {
    const st = c.st, flex = !o.geo && /flex/.test(st.display), V = flex ? /column/.test(st.dir) : true;      // o.geo: ignore the CSS, read the layout from the boxes
    const n = { _b: box(c), _k: 'frame', _grow: grow(c), _w: /px$/.test(c.props.width || '') ? px(c.props.width) : null, _wfill: c.props.width === '100%', n: name, d: V ? 'V' : 'H' };
    if (st.bg) n.bg = tok(hexOf(st.bg), 'fill');
    if (c.bwa && c.bwa.some(Boolean)) { const si = c.bwa.findIndex(Boolean); n.bc = tok(hexOf((c.bca || [])[si] || st.bc), 'border') || 'sapTile_BorderColor'; n.bw = c.bwa.every(x => x === c.bwa[0]) ? c.bwa[0] : c.bwa.slice(); }
    else if (o.border || st.bw > 0) { n.bc = tok(hexOf(st.bc), 'border') || 'sapTile_BorderColor'; n.bw = st.bw > 0 ? st.bw : 1; }
    if (st.br) n.r = Math.round(st.br);
    if (st.sh) {                                                           // Make draws a card / popup with a shadow: the kit shadow of the same size
      const bl = Math.max(...(String(st.sh).match(/(\d+(?:\.\d+)?)px/g) || ['0px']).map(parseFloat).slice(0, 4)), nm = bl >= 40 ? 'Shadow/sapContent_Shadow3' : bl >= 12 ? 'Shadow/sapContent_Shadow2' : bl > 4 ? 'Shadow/sapContent_Shadow1' : 'Shadow/sapContent_Shadow0';   // Make's faint card shadow (blur ≤ 4 px) = SAP Shadow0, not the heavier Shadow1 (2026-10-05)
      n.fxk = KIT.effects[nm] || KIT.effects['Shadow/sapContent_Shadow1']; if (c.cls === 'sap.f.Card') { delete n.bc; delete n.bw; }
    }
    let kids = ch(c).map(conv).filter(Boolean);
    if (o.extra && o.extra.length) kids = kids.concat(o.extra).sort((a, b) => a._b[1] - b._b[1] || a._b[0] - b._b[0]);   // controls the frame draws itself (e.g. a header's title)
    const lineGroups = list => { const lines = []; let bottom = -1e9; for (const k of list) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } } return lines; };
    // NOT flexbox (Grid, floats, inline flow, table parts, plain divs): the CSS says nothing about the direction, so read it from where the children really are.
    // One line of children → a row (a row that spans the container shares its width, like grid columns); several lines → a column of line rows.
    const rowOfLine = (ln, name, whole) => {
      const u = whole || union(ln), spans = u[2] > 0.6 * c.box[2] && ln.reduce((a, k) => a + k._b[2], 0) > 0.6 * c.box[2];
      if (spans) ln.forEach(k => { if (k._k === 'frame' && !k._w && !k._grow) k._grow = 1; });
      else ln.forEach(k => { if (k._wfill) { k._wfill = false; k._w = k._b[2]; } });                     // a narrow line keeps the width it has in Make
      const gaps = ln.slice(1).map((k, i) => k._b[0] - (ln[i]._b[0] + ln[i]._b[2])), big = gaps.length ? gaps.indexOf(Math.max(...gaps)) : -1;
      if (big >= 0 && gaps[big] > 48 && gaps[big] > 0.25 * c.box[2] && gaps[big] > 4 * Math.max(8, ...gaps.filter((g, i) => i !== big)))      // one huge gap between two groups = a flexible space (heading left, actions right)
        ln = [...ln.slice(0, big + 1), { _k: 'spacer', _grow: 1, _b: [ln[big]._b[0] + ln[big]._b[2], u[1], gaps[big], u[3]] }, ...ln.slice(big + 1)];
      const row = layout(whole ? Object.assign(n, { d: 'H' }) : { _b: u, _k: 'frame', n: name, d: 'H' }, ln, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
      if (row.a[0] !== 'S' && !row.c.some(k => /^F/.test(k.s || ''))) row.c.push({ _k: 'frame', n: 'Spacer', d: 'H', w: 1, h: 1, s: 'FH', _sized: true });   // one part of a row must flex
      return row;
    };
    if (!flex && kids.length > 1) {
      const lines = lineGroups(kids);
      if (lines.length === 1) return rowOfLine(kids, 'Row', box(c));
      if (lines.some(l => l.length > 1)) { n.d = 'V'; return layout(n, lines.map(ln => ln.length === 1 ? ln[0] : rowOfLine(ln, 'Row')), { V: true, st: {}, flex: false }); }
    }
    if (flex && !V && /wrap/.test(st.wrap) && kids.length > 1) {          // a wrapped row that broke into several lines → a column of line rows
      const lines = []; let bottom = -1e9;
      for (const k of kids) { if (!lines.length || k._b[1] >= bottom - 1) { lines.push([k]); bottom = k._b[1] + k._b[3]; } else { lines[lines.length - 1].push(k); bottom = Math.max(bottom, k._b[1] + k._b[3]); } }
      // Make wraps these items itself. When every item has its own width (no flex-grow), keep ONE row and let Figma wrap it (auto layout
      // "wrap"): it then re-wraps when the frame gets narrower or wider, like the browser does. Line rows would freeze today's breaks.
      if (lines.length > 1 && !kids.some(k => k._grow) && Math.max(...kids.map(k => k._b[2])) <= 0.4 * Math.max(...lines.map(ln => Math.max(...ln.map(k => k._b[0] + k._b[2])) - Math.min(...ln.map(k => k._b[0]))))) {
        const rowGap = Math.max(0, R5(lines[1].reduce((m, k) => Math.min(m, k._b[1]), 1e9) - lines[0].reduce((m, k) => Math.max(m, k._b[1] + k._b[3]), -1e9)));
        const l0 = lines[0], colGap = l0.length > 1 ? Math.max(0, R5(l0[1]._b[0] - l0[0]._b[0] - l0[0]._b[2])) : 16, top = Math.min(...l0.map(k => k._b[1]));
        const ob = new Map(kids.map(k => [k, k._b])), onb = n._b; let x = kids[0]._b[0]; const flat = [];
        lines.forEach(ln => { const t = Math.min(...ln.map(k => k._b[1])); ln.forEach(k => { const b = k._b.slice(); b[0] = x; b[1] = top + (b[1] - t); k._b = b; x += b[2] + colGap; flat.push(k); }); });
        const one = layout(Object.assign(n, { d: 'H', _b: [kids[0]._b[0], top, x - colGap - kids[0]._b[0], Math.max(...flat.map(k => k._b[1] + k._b[3])) - top] }), flat, { V: false, st: { ai: 'flex-start', jc: 'flex-start' }, flex: true });
        ob.forEach((b, k) => { k._b = b; }); one._b = onb; one.h = R(onb[3]);                  // the trace must compare with the REAL Make boxes
        one.wrapRow = 1; one.cg = rowGap; one.s = 'FH';                                  // a wrap row spans its parent and hugs its lines (a fixed height made line 2 overlap line 1)
        one.c.forEach(k => { if (k.s && k.s[1] === 'F') k.s = k.s[0] + 'H'; });
        one.c = one.c.filter(k => !(k.n === 'Spacer' && k.w === 1));
        return one;
      }
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
    let counter = /center/.test(ai) ? 'C' : /end/.test(ai) ? 'X' : 'M';
    let primary = /space-between/.test(jc) ? 'S' : /center/.test(jc) ? 'C' : /end/.test(jc) ? 'X' : 'M';
    let ks = list.slice();
    if (ks.some(k => k._k === 'spacer')) {                    // flexible spacers (a toolbar's ToolbarSpacer, flex-grow filler, a big gap between two groups) → real FILL spacer frames between the groups
      const segs = [[]], gapBox = [null]; for (const k of ks) { if (k._k === 'spacer') { segs.push([]); gapBox.push(k._b); } else segs[segs.length - 1].push(k); }
      const parts = segs.map((sg, i) => ({ sg, gb: gapBox[i] })).filter(x => x.sg.length);
      ks = []; parts.forEach((x, i) => {
        if (i > 0) ks.push({ _b: x.gb, _k: 'frame', _sized: true, n: 'Spacer', d: V ? 'V' : 'H', w: 1, h: 1, s: V ? 'HF' : 'FH' });   // one spacer = start | end, two = the middle part centred — equal shares of the free space, exactly like flex-grow
        ks.push(x.sg.length === 1 ? x.sg[0] : layout({ _b: union(x.sg), _k: 'frame', n: i === 0 ? 'Leading Content' : 'Trailing Content', d: V ? 'V' : 'H' }, x.sg, { V, st: { ai: 'center' }, flex: true }));
      });
      ks = ks.filter((k, i) => !(k.n === 'Spacer' && (i === 0 || i === ks.length - 1)));   // a spacer at the very start or end only pushes: keep it out unless it is the only flexible part
      if (!ks.some(k => k.n === 'Spacer')) { const lsp = list[0]._k === 'spacer', tsp = list[list.length - 1]._k === 'spacer'; primary = lsp && tsp ? 'C' : lsp ? 'X' : primary; }   // only outer spacers: centred / pushed to the end
    }
    const mi = V ? 1 : 0, me = V ? 3 : 2, ci = V ? 0 : 1, ce = V ? 2 : 3;
    // safety net: auto layout puts the children one after another along the main axis. If they overlap along that axis in Make (side by side while the frame stacks them,
    // absolute positioning), the frame will NOT match Make — say so, so it is caught before pasting (build/make-verify.js measures how far off)
    for (let i = 1; i < ks.length; i++) if (ks[i]._b[mi] < ks[i - 1]._b[mi] + ks[i - 1]._b[me] - 2 ) { WARN.push(`layout: children of "${node.n}" overlap along the ${V ? 'vertical' : 'horizontal'} axis in Make (${ks[i - 1].n} | ${ks[i].n}) but the frame places them one after another — will not match`); break; }
    const gs = []; for (let i = 1; i < ks.length; i++) gs.push(ks[i]._b[mi] - (ks[i - 1]._b[mi] + ks[i - 1]._b[me]));
    const gap = primary === 'S' || !gs.length ? 0 : Math.max(0, R(Math.min(...gs)));
    if (primary !== 'S') ks = ks.map((k, i) => { const e = i > 0 ? gs[i - 1] - gap : 0; return e > 0.6 ? lead(k, e, V) : k; });
    let p = [0, 0, 0, 0];
    // the MEASURED boxes win over the CSS alignment: a flex-end row whose children all sit at its top (the row is taller than them) put the
    // search fields 8 px too low (2026-10-05). Only when every child shares one edge and the CSS edge is not shared.
    if (ks.length && counter !== 'M') {
      const st0 = ks.map(k => k._b[ci] - b[ci]), en0 = ks.map(k => b[ci] + b[ce] - (k._b[ci] + k._b[ce]));
      const same = v => Math.max(...v) - Math.min(...v) <= 1;
      const cssOk = counter === 'X' ? same(en0) && Math.min(...en0) <= 1.5 : same(ks.map((k, i) => st0[i] - en0[i]));
      if (!cssOk && same(st0)) counter = 'M';
    }
    if (ks.length) {
      const f = ks[0]._b, l = ks[ks.length - 1]._b, ms = f[mi] - b[mi], mEnd = b[mi] + b[me] - (l[mi] + l[me]);
      const cs = Math.min(...ks.map(k => k._b[ci])) - b[ci], cEnd = b[ci] + b[ce] - Math.max(...ks.map(k => k._b[ci] + k._b[ce]));
      const css = st.pad || [0, 0, 0, 0], useMain = primary === 'M' || primary === 'S';
      const mS = useMain ? Math.max(0, R5(ms)) : 0, mE = useMain ? Math.max(0, R5(mEnd)) : 0;
      const sym = Math.max(0, R5(Math.min(cs, cEnd))), cS = counter === 'M' ? Math.max(0, R5(cs)) : counter === 'C' ? sym : (V ? css[3] : css[0]), cE = counter === 'M' ? Math.max(0, R5(cEnd)) : counter === 'C' ? sym : Math.max(V ? css[1] : css[2], Math.max(0, R5(cEnd)));   // end-aligned: the MEASURED end space (a child's flex margin is not CSS padding: the search fields sat 8 px low)
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
      else if (k.cp === 'Object Status') l = 'X';                                                  // follows Make's size exactly (width x height of the control)
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
  const isTP = root.cls === 'sap.tnt.ToolPage', header = isTP ? find('sap.tnt.ToolHeader') : null, side = isTP ? find('sap.tnt.SideNavigation') : null;
  // the main content: a DynamicPage, else whatever else the ToolPage holds beside header and side navigation (a ScrollContainer, a Page, a NavContainer…).
  // Only a DynamicPage was accepted: an app with its page in a ScrollContainer lost ALL its content (Create SAP Integration: 309 controls → 4 nodes, 2026-10-05)
  let page = isTP ? (find('sap.f.DynamicPage') || rk.find(k => k !== header && k !== side && k.box && k.box[2] > 0 && k.box[3] > 0 && !/^sap\.tnt\.(ToolHeader|SideNavigation)$/.test(k.cls)) || null) : null;
  if (root.cls !== 'sap.tnt.ToolPage' || !header || !page) WARN.push('root is not a ToolPage(header, page) — generic layout used');
  const W = D.viewport[0], hh = header ? header.box[3] : 0;
  // a scrolling app: its content is taller than the window. The Figma frame takes the FULL content height, or the part below the fold is cut off
  const deepBottom = c => ch(c).reduce((m, k) => Math.max(m, deepBottom(k)), c.box ? c.box[1] + c.box[3] : 0);
  const H = Math.max(D.viewport[1], page ? Math.ceil(deepBottom(page)) : 0);
  if (page && H > D.viewport[1]) { page = Object.assign({}, page, { box: [page.box[0], page.box[1], page.box[2], H - page.box[1]] }); WARN.push('The app scrolls: the frame is ' + H + ' px high (window ' + D.viewport[1] + ' px) so nothing below the fold is cut off'); }
  const generic = root.cls !== 'sap.tnt.ToolPage' || (!header && !page && !side);                       // an app without the ToolPage shell (a Grid, a VBox, a Page …): convert the root itself, never drop it
  const body = layout({ _b: [0, hh, W, H - hh], _k: 'frame', n: 'Body', d: 'H' }, generic ? [conv(root)].filter(Boolean) : [side && conv(side), page && conv(page)].filter(Boolean), { V: false, st: {}, flex: false });
  const rootNode = layout({ _b: [0, 0, W, H], _k: 'frame', n: nameArg || D.title || 'Make screen', d: 'V', bg: tok(hexOf(root.st.bg), 'fill') || 'sapBackgroundColor', clip: 1 }, [header && conv(header), body].filter(Boolean), { V: true, st: {}, flex: false });
  rootNode.sz = 'x'; delete rootNode.s; body.s = 'FF';
  if (generic && body.c && body.c[0]) body.c[0].s = 'FF';                               // a page without the ToolPage shell: its root fills the screen
  if (rootNode.c[0] && rootNode.c[0].cp === 'Shell Bar') rootNode.c[0].s = 'FX';
  const sn = body.c.find(k => k.n === 'Side Navigation'); if (sn) { sn.s = 'XF'; sn.w = 256; }
  if (page) body.c[body.c.length - 1].s = 'FF';
  // trace: for every node that came from a Make control, its index path in the tree and the Make box it must land on (build/make-verify.js)
  // a wrapping row spans its parent (FILL width) so Figma can wrap it to the frame's width
  const wrPass = (function wr(n, par) { if (n.wrapRow && par && par.d === 'V') { const pp = Array.isArray(par.p) ? par.p : [par.p || 0, par.p || 0, par.p || 0, par.p || 0]; n.w = R(par.w - pp[1] - pp[3]); n.s = 'FH'; } (n.c || []).forEach(k => wr(k, n)); }); wrPass(rootNode, null);
  // HUG parent + FILL child on the same axis has no definite width (Figma shrinks the child to its minimum: a 100%-wide field collapsed to its
  // label). Make gave that parent a definite width, so it keeps it: FIXED at the Make width.
  const hfPass = (function hf(n, par) {
    (n.c || []).forEach(k => hf(k, n));
    if (!n.d || !n.s || n === rootNode) return;
    [0].forEach(i => {                                        // width only: a hugging row keeps growing in height with its content
      if (n.s[i] !== 'H') return;
      const fills = (n.c || []).some(k => (k.s || '')[i] === 'F' && !k.abs);
      if (fills && (i === 0 ? n.w : n.h) > 0) n.s = n.s.slice(0, i) + 'X' + n.s.slice(i + 1);
    });
  }); hfPass(rootNode, null);
  // EXACT SIZE (2026-10-05, "1:1 with the Make app"): a converted frame keeps the size Make measured instead of hugging its kit parts. Hugging made a 26 px
  // title row 22.5 px (everything below moved up) and grew a 217 px field to its overflowing 256 px input (every later field moved right).
  const PIN = (typeof process !== 'undefined' && process.env && process.env.MAKE_PIN) || 'hug';
  const pinPass = (function pin(n, top) {
    if (PIN !== 'off' && !top && n._k === 'frame' && n._b && n.s && !n.wrapRow && n.n !== 'Spacer' && !['Body', 'Side Navigation', 'Shell Bar'].includes(n.n)) {
      const raw = n._src && by[n._src] && by[n._src].cls === 'sap.ui.core.HTML';   // raw HTML (a route line ✈──●) has no flex size of its own: it keeps Make's box, it never stretches
      [0, 1].forEach(i => { const L = n.s[i]; if (L === 'H' || (raw && L === 'F') || (PIN === 'all' && L !== 'F')) { if (i === 0) n.w = R(n._b[2]); else n.h = R(n._b[3]); n.s = n.s.slice(0, i) + 'X' + n.s.slice(i + 1); } });
    }
    (n.c || []).forEach(k => pin(k, false));
  }); pinPass(rootNode, true);
  const TRACE = [];
  (function walk(n, at) { if (n._src) TRACE.push({ p: at, id: n._src, b: n._b, k: n._k, ta: n.ta }); (n.c || []).forEach((k, i) => walk(k, at.concat(i))); })(rootNode, []);
  const clean = (k, v) => (k[0] === '_' || v === undefined) ? undefined : v;
  const extra = ovs.map(o => {
    if (/^sap\.m\.(Popover|ResponsivePopover)$/.test(o.cls)) { const dd = selectDrop(o); if (dd) { dd.n = 'Popover'; dd.s = 'XX'; dd.w = R(o.box[2]); dd.h = R(o.box[3]); return { name: 'Popover', box: o.box.slice(), tree: JSON.parse(JSON.stringify(dd, clean)) }; } }
    const t = String(o.props.title || '').trim(), n = frame(o, o.cls.split('.').pop(), { geo: true });
    n.n = o.cls.split('.').pop() + (t ? ' — ' + t.slice(0, 40) : ''); n.sz = 'x'; delete n.s; n.clip = 1; n.r = /Dialog/.test(o.cls) ? 16 : 8;
    if (!n.bg) n.bg = tok('#ffffff', 'fill') || 'sapGroup_ContentBackground';
    const sh = KIT.effects && (KIT.effects['Shadow/sapContent_Shadow3'] || KIT.effects['Shadow/sapContent_Shadow1']); if (sh) n.fxk = sh;
    if (/Dialog/.test(o.cls) && n.c && n.c.length) {
      if (n.c[0].n === 'Bar') { n.c[0].bc = 'sapGroup_ContentBorderColor'; n.c[0].bw = [0, 0, 1, 0]; n.c[0].r = 0; }
      (function tb(x) { if (/Toolbar$/.test(x.n || '') && x.bc) x.bw = [1, 0, 0, 0]; (x.c || []).forEach(tb); })(n);   // the footer toolbar draws only its top line
    }
    n.w = R(o.box[2]); n.h = R(o.box[3]); wrPass(n, null); hfPass(n, null); pinPass(n, true);
    return { name: n.n, box: o.box.slice(), tree: JSON.parse(JSON.stringify(n, clean)) };
  });
  const tree = JSON.parse(JSON.stringify(rootNode, (k, v) => (k[0] === '_' || v === undefined) ? undefined : v));
  // ── self-check: every text and icon the app shows must be in the Figma tree (a new app may use controls this converter has never seen) ──
  const AUDIT = { lostTexts: [], lostIcons: [], unknown: {} };
  {
    const blob = JSON.stringify([tree].concat(extra.map(x => x.tree))).replace(/\\u[0-9a-f]{4}/gi, ' ');
    const norm = t => String(t).replace(/\s+/g, ' ').trim(), has = t => blob.includes(JSON.stringify(norm(t)).slice(1, -1));
    const TXTP = ['text', 'title', 'description', 'subtitle', 'info', 'number', 'intro', 'label', 'placeholder', 'value', 'unit', 'scale', 'infoState'];
    const seenT = new Set(), seenI = new Set();
    D.controls.forEach(c => {
      if (c.hid && !extra.length) { /* hidden overlays are only built when open */ }
      if (!c.box || c.box[2] < 1 || c.box[3] < 1 || c.box[0] < -500 || c.box[1] < -500) return;   // off-screen (screen-reader only) texts are not on the screen
      if (!/^sap\.(m\.(Dialog|Popover|ResponsivePopover)|ui\.core\.Icon)$/.test(c.cls) && /Dialog|Popover/.test(c.cls)) return;
      for (const k of TXTP) { const v = c.props[k]; if (typeof v !== 'string' || !v.trim() || v.length > 200 || /^\d{4}-\d\d-\d\d$/.test(v) || (k === 'value' && !/Text|Title|Label|Link|Object|Numeric|Status|Input|Select|Picker|Combo/.test(c.cls))) continue; const t = norm(v); if (!seenT.has(t) && !has(t)) { seenT.add(t); AUDIT.lostTexts.push(t + '  [' + c.cls.split('.').pop() + '.' + k + ']'); } }
      for (const k of ['icon', 'src', 'activeIcon']) { const v = c.props[k]; if (typeof v === 'string' && v.startsWith('sap-icon://') && !seenI.has(v)) { seenI.add(v); const n = v.slice(11), a2 = MAP.icon_alias[n] || n; if (!ICONS.has(a2) && !blob.includes('"ic":"') ) AUDIT.lostIcons.push(n); } }
    });
    AUDIT.lostTexts.slice(0, 12).forEach(t => WARN.push('text from Make NOT in the Figma frame: "' + t + '"'));
    if (AUDIT.lostTexts.length > 12) WARN.push('… and ' + (AUDIT.lostTexts.length - 12) + ' more texts missing');
  }
  return { tree, extra, images: IMAGES, post: { nav: NAV, shell: SHELL }, warn: [...new Set(WARN)], controls: D.controls.length, trace: TRACE, audit: AUDIT };
}

return convert;
})();
const MAKE_MAP = {"_doc":"UI5 control -> SAP Web UI Kit mapping data for build/make2tree.js. Logic lives in make2tree.js; names here are checked against knowledge/live/kit.json by build/door.js.","skip_cls":["sap.m.FlexItemData","sap.m.IconTabFilterExpandButtonBadge","sap.m.IconTabHeader"],"skip_in_dynamic_header":["sap.m.Button","sap.m.ToggleButton"],"icon_alias":{"menu2":"menu","flight":"flight","customer":"group","map":"globe","appointment":"calendar","employee":"group","arrow-top":"navigation-up-arrow","arrow-bottom":"navigation-down-arrow","person-placeholder":"group","pushpin-off":"flag"},"button_type":{"Emphasized":"Primary","Default":"Secondary","Transparent":"Tertiary","Accept":"Accept","Reject":"Reject","Attention":"Attention","Ghost":"Secondary","Neutral":"Secondary","Up":"Secondary","Back":"Tertiary"},"avatar_color":{"Accent1":"1","Accent2":"2","Accent3":"3","Accent4":"4","Accent5":"5","Accent6":"6","Accent7":"7","Accent8":"8","Accent9":"9","Accent10":"10","Transparent":"Transparent","Placeholder":"Placeholder"},"fill_pref":["sapBackgroundColor","sapBaseColor","sapShell_Background","sapList_Background","sapTile_Background","sapPageHeader_Background","sapGroup_ContentBackground","sapObjectHeader_Background","sapList_SelectionBackgroundColor"],"border_pref":["sapList_BorderColor","sapTile_BorderColor","sapGroup_ContentBorderColor","sapPageHeader_BorderColor","sapContent_Selected_ForegroundColor","sapSelectedColor"],"ink_pref":["sapTextColor","sapContent_LabelColor","sapLinkColor","sapPositiveTextColor","sapNegativeTextColor","sapCriticalTextColor","sapTitleColor","sapContent_IconColor","sapContent_NonInteractiveIconColor"],"controls":{"_doc":"Data-driven UI5 control → SAP kit part. props: kit property → spec. spec = \"=literal\" | {from: ui5 property, map: {value: kitValue}, def: kitValue, bool: true (boolean property), boolStr: true (True/False string), not: true, icon: true (kit icon of the ui5 icon), pct:[min,max] (value as 0/25/50/75/100 %)}. tx: inner text layer → ui5 property ('@first' = first visible text, '@last' = last). Every comp / property / value is checked against kit.json by test/make2tree.test.js.","sap.m.MessageStrip":{"comp":"Message Strip","props":{"Value State":{"from":"type","map":{"Information":"Information","Success":"Positive","Warning":"Critical","Error":"Negative","None":"Information"},"def":"Information"},"Icon":{"from":"showIcon","boolStr":true,"def":"True"},"Close Button":{"from":"showCloseButton","bool":true,"def":false}},"tx":{"@first":"text"}},"sap.m.ProgressIndicator":{"comp":"Progress Indicator","props":{"Value State":{"from":"state","map":{"None":"None","Error":"Negative","Warning":"Critical","Success":"Positive","Information":"Information"},"def":"None"},"Text":{"from":"showValue","bool":true,"def":true},"Text Value":{"from":"displayValue"}}},"sap.m.BusyIndicator":{"comp":"Busy Indicator","props":{"Text":{"from":"text","bool":true,"def":false},"Text Value":{"from":"text"}}},"sap.m.RatingIndicator":{"comp":"Rating Indicator","props":{"Interaction State":{"from":"editable","map":{"false":"Read Only","true":"Regular"},"def":"Regular"}}},"sap.m.Slider":{"comp":"Slider","props":{"Value":{"from":"value","pct":["min","max"]}}},"sap.m.StepInput":{"comp":"Step Input","props":{"Value":{"from":"value"}}},"sap.m.RadioButton":{"comp":"Radio Button","props":{"Label":{"from":"text","bool":true,"def":false},"✏️ Text":{"from":"text"},"Selected":{"from":"selected","boolStr":true,"def":"False"}}},"sap.m.SplitButton":{"comp":"Split Button","props":{"Type":{"from":"type","map":{"Emphasized":"Primary","Default":"Secondary","Transparent":"Tertiary","Accept":"Accept","Reject":"Reject","Attention":"Attention","Ghost":"Secondary","Neutral":"Secondary"},"def":"Secondary"}},"tx":{"@first":"text"}},"sap.m.MenuButton":{"comp":"Menu Button","props":{"Type":{"from":"type","map":{"Emphasized":"Primary","Default":"Secondary","Transparent":"Tertiary","Accept":"Accept","Reject":"Reject","Attention":"Attention","Ghost":"Secondary","Neutral":"Secondary"},"def":"Secondary"},"Text":{"from":"text"},"Icon Left":{"from":"icon","bool":true,"def":false},"Icon":{"from":"icon","icon":true}}},"sap.m.Token":{"comp":"Token","props":{"Text":{"from":"text"}}},"sap.m.MultiInput":{"comp":"Multi Input","props":{}},"sap.m.ComboBox":{"comp":"Select","props":{"Drop-Down":"=False"},"tx":{"Input Text":"value"}},"sap.m.TimePicker":{"comp":"Time Picker","props":{"Dropdown":"=False"},"tx":{"@first":"value"}},"sap.m.DateTimePicker":{"comp":"Date Time Picker","props":{"Dropdown":"=False"},"tx":{"@first":"value"}},"sap.m.Breadcrumbs":{"comp":"Breadcrumb","props":{"Current Item":{"from":"currentLocationText"}}},"sap.m.IllustratedMessage":{"comp":"Illustrated Message","props":{"Title":{"from":"title"},"Description":{"from":"description"}}},"sap.m.NotificationListItem":{"comp":"Notification List Item","props":{"Type":"=Notification List Item","Title":{"from":"title"},"Description":{"from":"description"},"Read":{"from":"unread","map":{"true":"False","false":"True"},"def":"False"}}},"sap.tnt.InfoLabel":{"comp":"Tag","props":{"Text":{"from":"text"}}},"sap.m.ColorPalette":{"comp":"Color Palette","props":{}},"sap.ui.unified.ColorPicker":{"comp":"Color Picker","props":{}},"sap.ui.unified.FileUploader":{"comp":"File Uploader","props":{}},"sap.m.Carousel":{"comp":"Carousel","props":{}},"sap.f.AvatarGroup":{"comp":"Avatar Group","props":{}},"sap.m.StandardTreeItem":{"comp":"Tree Item","props":{"Levels":{"from":"level","map":{"0":"1","1":"2","2":"3","3":"4-6","4":"4-6","5":"4-6","6":"7+","7":"7+","8":"7+","9":"7+"},"def":"1"}},"tx":{"@first":"title"}},"sap.ui.unified.MenuItem":{"comp":"Menu List Item","props":{"Text":{"from":"text"},"Leading Icon":{"from":"icon","bool":true,"def":false},"Icon":{"from":"icon","icon":true},"Interaction State":{"from":"enabled","map":{"false":"Disabled","true":"Regular"},"def":"Regular"}}},"sap.m.MenuItem":{"comp":"Menu List Item","props":{"Text":{"from":"text"},"Leading Icon":{"from":"icon","bool":true,"def":false},"Icon":{"from":"icon","icon":true},"Interaction State":{"from":"enabled","map":{"false":"Disabled","true":"Regular"},"def":"Regular"}}},"sap.m.NotificationListGroup":{"comp":"Notification List Item","props":{"Type":"=Group Header","Group Name":{"from":"title"}}},"sap.m.ActionListItem":{"comp":"List Item","props":{"Type":"=Single Line","Text":{"from":"text"}}},"sap.m.Tokenizer":{"comp":"Tokenizer","props":{}},"sap.m.RangeSlider":{"comp":"Range Slider","props":{"Left Value":{"from":"value","pct":["min","max"],"clamp":[0,75]},"Right Value":{"from":"value2","pct":["min","max"],"clamp":[25,100]}}}},"containers_ok":["sap.f.FlexibleColumnLayout","sap.f.cards.NumericHeader","sap.f.cards.NumericIndicators","sap.m.AssociativeOverflowToolbar","sap.m.Bar","sap.m.CustomTreeItem","sap.m.Dialog","sap.m.DisplayListItem","sap.m.FlexItemData","sap.m.InputListItem","sap.m.List","sap.m.ListItemBase","sap.m.Menu","sap.m.NavContainer","sap.m.ObjectListItem","sap.m.OverflowToolbar","sap.m.Page","sap.m.Popover","sap.m.RadioButtonGroup","sap.m.ResponsivePopover","sap.m.ScrollContainer","sap.m.SegmentedButton","sap.m.SegmentedButtonItem","sap.m.SplitApp","sap.m.Toolbar","sap.m.ToolbarSeparator","sap.m.Tree","sap.m.Wizard","sap.m.WizardProgressNavigator","sap.m.WizardStep","sap.ui.core.HTML","sap.ui.layout.Grid","sap.ui.layout.form.Form","sap.ui.layout.form.ResponsiveGridLayout","sap.ui.layout.form.SimpleForm","sap.ui.unified.CalendarLegend","sap.ui.unified.CalendarLegendItem","sap.ui.unified.Menu","sap.uxap.BlockBase","sap.uxap.ObjectPageGridLayout","sap.uxap.ObjectPageHeader","sap.uxap.ObjectPageHeaderActionButton","sap.uxap.ObjectPageHeaderContent","sap.uxap.ObjectPageLayout","sap.uxap.ObjectPageSection","sap.uxap.ObjectPageSubSection"],"class_alias":{"sap.m.OverflowToolbarButton":"sap.m.Button","sap.m.OverflowToolbarToggleButton":"sap.m.ToggleButton","sap.m.OverflowToolbarMenuButton":"sap.m.MenuButton","sap.f.ShellBar":"sap.tnt.ToolHeader","sap.uxap.ObjectPageLayout":"sap.f.DynamicPage","sap.uxap.ObjectPageDynamicHeaderTitle":"sap.f.DynamicPageTitle","sap.uxap.ObjectPageDynamicHeaderContent":"sap.f.DynamicPageHeader","sap.ui.table.Table":"sap.m.Table","sap.ui.table.TreeTable":"sap.m.Table","sap.ui.table.AnalyticalTable":"sap.m.Table","sap.ui.table.Column":"sap.m.Column","sap.ui.table.Row":"sap.m.ColumnListItem"}};
const MAKE_EXTRA = {"suitcase":{"key":"aab233a77becbdfc986a734c5451f5b976638855","desc":"travel, suitcase, business trip, possessions"},"meal":{"key":"52c9186b136b0ff70196b57dd6cf5f0e17e848bf","desc":"meal, knife and fork, dinner, lunch"},"share-arrow":{"key":"f186ab5dabe94fbbf9b8427f9fd41edddf104e2c","desc":"share, reshare, distribute, arrow (SAP 'share')"},"share-2":{"key":"3e32bfc37d0c6c148ea9919015d02a7acf91d58c","desc":"share, distribute, share with connections"},"tag":{"key":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","desc":"tag, label, marker, indicator"},"flight":{"key":"65ca2deb9dd0c4f7734d2269e7958fbe62b4a462","desc":"plane, trip, travel, flight"},"paper-plane":{"key":"1af59a706bee8811d9439901ec3d4f54f118185a","desc":"send, paper plane"},"receipt":{"key":"28664297b6ba462b297b4487f2fa5884d53a3a08","desc":"bill, receipt, proof of sale"},"travel-expense":{"key":"00af06f46dafee9ba85ce133c4ce34d449eaee25","desc":"plane + money: trip expense, fee"},"travel-itinerary":{"key":"303136e86aedf4da03db63f869e9a9262c9a89d7","desc":"itinerary, schedule, flight, drive"},"pushpin-on":{"key":"a103a0ee9c45c6b54d5f799e82b1842236f2c79e","desc":"pin, pinned, keep on top (read live from gold 270:6722)"},"direction-arrows":{"key":"d8df6bd3e7657212a65f733f39878d4e0a37cc2e","desc":"two-way arrows, range handle (read live from gold 270:6722)"},"media-forward":{"key":"b200c671f28c62c7e4ead976aa02b5875f77d5fa","desc":"forward, media, fast — SAP has no lightning bolt: use for \"fastest\""},"thumb-up":{"key":"5302ae09353d82f5221906eb454886085d60b9c3","desc":"thumbs, up, like, recommended, best"},"inbox":{"key":"9ddc5a9cd14cd52a3cfc7a86b041303ff9aca96e","desc":"SAP Web UI Kit"},"bar-chart":{"key":"2c24c77886a783a4f95986436419ba2b331611a8","desc":"SAP Web UI Kit"},"user-settings":{"key":"dd2dfca44f388923176e6ac85731ee96fcd8c570","desc":"SAP Web UI Kit"},"history":{"key":"02fb2cf833be737a93b92e670159c09f6562bd4b","desc":"SAP Web UI Kit"},"map":{"key":"142bea39000b39f3f14b9f9ea34cac9bcb8f4da5","desc":"SAP Web UI Kit"},"picture":{"key":"ba4d9c2dc6ac8ae7068f73fd0275c27c7e1da16b","desc":"SAP Web UI Kit"},"discussion":{"key":"b3b8fc4eccad2d1605aa51935e8e0f813f539bc0","desc":"SAP Web UI Kit"},"appointment-2":{"key":"59c77280f7ba5dd27c9be54197f4a3c1a6089084","desc":"SAP Web UI Kit"},"table-column":{"key":"2a5fe3d3226a52e6487e5ae9ddc9243c7b98000a","desc":"SAP Web UI Kit"},"da-2":{"key":"21a4718c212b7e95d6eb148e713b166bf293f429","desc":"SAP Web UI Kit"},"da":{"key":"ec91cd8cffe34196832a9c98f6b1b67daafa53df","desc":"SAP Web UI Kit"},"down":{"key":"492d6984967c9fc11f324539a4c104a45aaae643","desc":"SAP Web UI Kit"},"light-mode":{"key":"386a631748671bd2d67980283c192324893e1edb","desc":"SAP Web UI Kit"},"dark-mode":{"key":"2860e4ba75f7e4c01c9736fc4217587bc6d932a1","desc":"SAP Web UI Kit"},"microphone":{"key":"51e04da7cb207eef304ad796b0094135b266eae6","desc":"SAP Web UI Kit"},"weather-proofing":{"key":"41e042279edb356ba15a499a2284f613cec0e438","desc":"SAP Web UI Kit"},"ai":{"key":"90f321fb2e05adcd1322d1b98872293ae2f06882","desc":"SAP Web UI Kit"}};
const MAKE_KIT = {"vars":{"Accent/sapAccentBackgroundColor1":1,"Accent/sapAccentBackgroundColor10":1,"Accent/sapAccentBackgroundColor2":1,"Accent/sapAccentColor1":1,"Accent/sapAccentColor5":1,"Application/sapBackgroundColor":1,"Application/sapPageFooter_Background":1,"Application/sapPageFooter_BorderColor":1,"Application/sapPageHeader_Background":1,"Application/sapPageHeader_BorderColor":1,"Container/Spacing/Large":1,"Container/Spacing/Medium":1,"Container/Spacing/Small":1,"Container/Spacing/Tiny":1,"Container/Spacing/Zero":1,"Container/Spacing/sapContent_Gap":1,"Container/Spacing/sapContent_Margin_Small":1,"Container/Spacing/sapContent_Padding_L":1,"Container/Spacing/sapContent_Padding_M":1,"Container/Spacing/sapContent_Padding_S":1,"Container/Spacing/sapContent_Padding_XL":1,"Container/Spacing/sapContent_Space_L":1,"Container/Spacing/sapContent_Space_M":1,"Container/Spacing/sapContent_Space_S":1,"Container/Spacing/sapContent_Space_Tiny":1,"Container/Spacing/sapContent_Space_XL":1,"Container/Spacing/sapShell_Gap_L":1,"Container/Spacing/sapShell_Gap_M":1,"Container/Spacing/sapShell_Gap_S":1,"Container/Spacing/sapShell_GroupGap_L":1,"Container/Spacing/sapShell_GroupGap_M":1,"Container/Spacing/sapShell_GroupGap_S":1,"Container/Spacing/sapShell_Space_L":1,"Container/Spacing/sapShell_Space_M":1,"Container/Spacing/sapShell_Space_S":1,"Container/sapBlockLayer_Background":1,"Container/sapBlockLayer_Opacity":1,"Container/sapContent_DisabledOpacity":1,"Container/sapElement_BorderCornerRadius":1,"Container/sapElement_Compact_Height":1,"Container/sapElement_Height":1,"Container/sapGroup_BorderCornerRadius":1,"Container/sapGroup_ContentAlternatingBackground":1,"Container/sapGroup_ContentBackground":1,"Container/sapGroup_ContentBorderColor":1,"Container/sapGroup_TitleBackground":1,"Container/sapGroup_TitleBorderColor":1,"Container/sapGroup_TitleTextColor":1,"Container/sapPopover_BorderCornerRadius":1,"Focus/sapContent_ContrastFocusColor":1,"Focus/sapContent_FocusColor":1,"Focus/sapContent_FocusWidth":1,"Font/Family/sapFontFamily":1,"Font/Size/sapFontHeader1Size":1,"Font/Size/sapFontHeader2Size":1,"Font/Size/sapFontHeader3Size":1,"Font/Size/sapFontHeader4Size":1,"Font/Size/sapFontHeader5Size":1,"Font/Size/sapFontHeader6Size":1,"Font/Size/sapFontLargeSize":1,"Font/Size/sapFontSize":1,"Font/Size/sapFontSmallSize":1,"Font/Weight/sapFontBoldFamily":1,"Font/Weight/sapFontFamily":1,"Font/Weight/sapFontHeaderFamily":1,"Font/Weight/sapFontSemiboldFamily":1,"Icon/sapContent_IconColor":1,"Icon/sapContent_IconHeight":1,"Icon/sapContent_NonInteractiveIconColor":1,"Indication/sapIndicationColor_1_Background":1,"Indication/sapIndicationColor_1_TextColor":1,"Indication/sapIndicationColor_4_Background":1,"Indication/sapIndicationColor_5_Background":1,"Input/Invalid/sapField_InvalidColor":1,"Input/Readonly/sapField_ReadOnly_Background":1,"Input/Standard/sapField_Active_BorderColor":1,"Input/Standard/sapField_Background":1,"Input/Standard/sapField_BorderColor":1,"Input/Standard/sapField_Focus_BorderColor":1,"Input/Standard/sapField_Hover_BorderColor":1,"Input/Standard/sapField_PlaceholderTextColor":1,"Input/Standard/sapField_RequiredColor":1,"Input/Standard/sapField_TextColor":1,"Input/Success/sapField_SuccessColor":1,"Input/Warning/sapField_WarningColor":1,"Input/sapField_BorderCornerRadius":1,"Interaction/sapActiveColor":1,"Interaction/sapContent_Selected_Background":1,"Interaction/sapContent_Selected_TextColor":1,"Interaction/sapHoverColor":1,"Interaction/sapSelectedColor":1,"Link/sapLinkColor":1,"List/sapList_Active_Background":1,"List/sapList_AlternatingBackground":1,"List/sapList_Background":1,"List/sapList_BorderColor":1,"List/sapList_FooterBackground":1,"List/sapList_GroupHeaderBackground":1,"List/sapList_GroupHeaderBorderColor":1,"List/sapList_HeaderBackground":1,"List/sapList_HeaderBorderColor":1,"List/sapList_HeaderTextColor":1,"Text/TextShadow_Spread_2-4":1,"Text/TextShadow_X_1":1,"Text/TextShadow_X_2":1,"Text/TextShadow_X_3":1,"Text/TextShadow_X_4":1,"Text/TextShadow_Y_1":1,"Text/TextShadow_Y_2":1,"Text/TextShadow_Y_3":1,"Text/TextShadow_Y_4":1,"Text/sapContent_ContrastTextColor":1,"Text/sapContent_ContrastTextShadowColor":1,"Text/sapContent_DisabledTextColor":1,"Text/sapContent_ForegroundTextColor":1,"Text/sapContent_LabelColor":1,"Text/sapContent_MarkerTextColor":1,"Text/sapContent_TextShadowColor":1,"Text/sapContent_TextShadowColor_2-4":1,"Text/sapTextColor":1,"Text/sapTitleColor":1,"Tile/sapTile_Active_Background":1,"Tile/sapTile_Active_ContentBackground":1,"Tile/sapTile_Background":1,"Tile/sapTile_BorderColor":1,"Tile/sapTile_BorderCornerRadius":1,"Tile/sapTile_Hover_Background":1,"Tile/sapTile_Hover_ContentBackground":1,"Tile/sapTile_IconColor":1,"Tile/sapTile_Interactive_BorderColor":1,"Tile/sapTile_OverlayBackground":1,"Tile/sapTile_OverlayForegroundColor":1,"Tile/sapTile_SeparatorColor":1,"Tile/sapTile_TextColor":1,"Tile/sapTile_TitleTextColor":1,"Toolbar/sapInfobar_Active_Background":1,"Toolbar/sapInfobar_Background":1,"Toolbar/sapInfobar_Hover_Background":1,"Toolbar/sapInfobar_NonInteractive_Background":1,"Toolbar/sapInfobar_TextColor":1,"Toolbar/sapToolbar_Background":1,"Toolbar/sapToolbar_SeparatorColor":1},"text":{"SmallText/LHAuto/Regular":"||12","SmallText/LHAuto/Bold":"||12","MediumText/LHAuto/Regular":"||14","MediumText/LHAuto/Bold":"||14","MediumText/LHAuto/Semibold":"||14","LargeText/LHAuto/Regular":"||16","LargeText/LHAuto/Bold":"||16","LargeText/LHAuto/Semibold":"||16","H6/Regular":"||14","H6/Bold":"||14","H5/Regular":"||16","H5/Bold":"||16","H4/Regular":"||20","H4/Bold":"||20","H3/Regular":"||24","H3/Bold":"||24","H2/Regular":"||32","H2/Bold":"||32","H1/Regular":"||48","H1/Bold":"||48","Main Header/sapObjectHeader_Title_FontSize":"||24","Title of Components/sapGroup_TitleFontSize":"||16","Button/Emphasized/sapButton_Emphasized_FontWeight":"||14","Tab/SmallTabText":"||12","Tab/MediumTabText":"||14"},"icons":{"accept":1,"activate":1,"add":1,"attachment":1,"bell":1,"calendar":1,"collapse":1,"complete":1,"copy":1,"decline":1,"delete":1,"document":1,"download":1,"duplicate":1,"edit":1,"error":1,"excel-attachment":1,"exit-full-screen":1,"expand":1,"favorite":1,"filter":1,"flag":1,"folder":1,"full-screen":1,"globe":1,"grid":1,"group":1,"home":1,"in-progress":1,"information":1,"less":1,"list":1,"menu":1,"multi-select":1,"multiselect-all":1,"navigation-down-arrow":1,"navigation-left-arrow":1,"navigation-right-arrow":1,"navigation-up-arrow":1,"overflow":1,"pdf-attachment":1,"pending":1,"print":1,"question-mark":1,"refresh":1,"search":1,"settings":1,"share":1,"slim-arrow-down":1,"slim-arrow-left":1,"slim-arrow-right":1,"slim-arrow-up":1,"sort":1,"sort-ascending":1,"sort-descending":1,"sys-cancel":1,"sys-enter-2":1,"sys-help":1,"table-view":1,"upload":1,"warning":1},"components":{"Avatar Badge":{"w":28,"h":28,"props":{"Size":"V:XL and Bigger|XL and Bigger,L,M and Smaller","Value State":"V:None|None,Positive,Critical,Negative,Information","Color":"V:None|Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,None"}},"Avatar Group":{"w":520,"h":112,"props":{"Overflow Button#100499:0":"B:false","Type":"V:Group|Group,Individual","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Size":"V:XL|XS,S,M,L,XL"}},"Avatar":{"w":112,"h":112,"props":{"Badge#98694:0":"B:false","Optional Border#98694:211":"B:false","Person Icon#112262:148":"I:15f9f2047731a76b001f89d9362236e158402db3 person-placeholder","Object Icon#114257:7":"I:6b2655212b50d8dbf5d9ace87a1c7186942a28d5 product","✏️ Initials#143938:0":"T:SD","Type":"V:Image|Image,Icon,Initials","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Content":"V:Person|Person,Object","Size":"V:XL|XS,S,M,L,XL","Color":"V:Image|Image,1,2,3,4,5,6,7,8,9,10,Transparent,Tile,Placeholder"}},"Footer":{"w":320,"h":40,"props":{"2nd Action#146241:0":"B:true","3rd Action#146241:5":"B:false","4th Action#146241:10":"B:false","1st Action#337405:0":"B:true","⿻ Actions Compact#427958:0":"S","⿻ Actions Cozy#427958:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Footer|Footer,Floating Footer"}},"Header":{"w":320,"h":40,"props":{"Action#182392:0":"B:false","Subheader#184355:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Title|Title,Title with back button,Error,Warning,Success,Information,Confirmation"}},"Breadcrumb":{"w":255,"h":16,"props":{"7th Child Item#153806:6":"B:false","3rd Child Item#153806:7":"B:false","5th Child Item#153806:8":"B:false","4th Child Item#153806:10":"B:false","6th Child Item#153806:11":"B:false","2nd Child item#153806:12":"B:false","1st Child Item#153814:0":"B:true","✏️ Current Item#153814:3":"T:Current item","⿻ Breadcrumbs#425845:0":"S","Overflow":"V:False|False,True","Popover":"V:False|False,True"}},"Busy Indicator Dot":{"w":4,"h":4,"props":{"Size":"V:XXS|XXS,XS,S,M,L,XL,XXL"}},"Busy Indicator":{"w":24,"h":8,"props":{"Text#146239:0":"B:false","✏️ Text Value#146239:4":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"}},"Animated Busy Indicator":{"w":28,"h":8,"props":{"Text#397886:0":"B:false","✏️ Text Value#397886:8":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"}},"Button Badge":{"w":24,"h":16,"props":{"✏️ Number#473631:0":"T:72","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Counter Badge|Attention Badge,Counter Badge"}},"Segmented Button":{"w":228,"h":26,"props":{"3rd Button#167915:5":"B:true","4th Button#167915:10":"B:true","5th Button#167915:15":"B:false","⿻ Text Segments Compact#425845:10":"S","⿻ Icon Segments Compact#425845:15":"S","⿻ Icon Segments Cozy#427418:0":"S","⿻ Text Segments Cozy#427418:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Text,Icon"}},"Segmented Button Singular":{"w":57,"h":26,"props":{"Icon#112262:123":"I:396436a4e244a78ea435d973b9ff1512652d46c5 heating-cooling","Icon Left#114173:291":"B:false","✏️ Text#145508:644":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Icon,Text","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True"}},"Icon Split Button":{"w":64,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"}},"Split Button":{"w":93,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"}},"Icon Menu Button":{"w":54,"h":26,"props":{"Icon#112262:49":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"}},"Menu Button":{"w":83,"h":26,"props":{"Icon Left#112572:0":"B:false","Icon#112572:97":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:546":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"}},"Icon Button":{"w":32,"h":26,"props":{"Attention Badge#112533:390":"B:false","Icon#112533:584":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"}},"Button":{"w":61,"h":26,"props":{"Icon Left#112533:293":"B:false","Icon#112533:487":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:461":"T:Button","Attention Badge#269292:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"}},"Legend":{"w":120,"h":336,"props":{}},"Mixed Calendar Button":{"w":66,"h":36,"props":{"✏️ 1st Line#379904:24":"T:Rabi’ I","✏️ 2nd Line#379904:36":"T:Sep - Oct","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|True,False"}},"Calendar Date Types":{"w":32,"h":32,"props":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled","Day":"V:Work Day|Work Day,Non-Working Day,Week Day,Week Number,Adjacent Month's Day","Today":"V:False|False,True","Selected":"V:False|False,True","Range":"V:False|False,True","Accent":"V:False|False,True","Mixed Calendar Date":"V:False|False,True"}},"Legend Item":{"w":43,"h":24,"props":{"Text#242137:0":"T:Day","Day Type":"V:Today|Today,Selected,Work Day,Non-Work Day,Special Day 1,Special Day 2,Special Day 3,Special Day 4,Special Day 5,Special Day 6,Special Day 7,Special Day 8,Special Day 9,Special Day 10,Special Day 11,Special Day 12,Special Day 13,Special Day 14,Special Day 15,Special Day 16,Special Day 17,Special Day 18,Special Day 19,Special Day 20"}},"Two-Month Calendar":{"w":544,"h":272,"props":{"Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Layout":"V:Horizontal|Horizontal,Vertical"}},"Calendar":{"w":272,"h":272,"props":{"Week Numbers#379380:0":"B:true","Week Header#477740:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Mixed Calendar":"V:False|False,True"}},"Banner":{"w":1407,"h":335,"props":{"✏️ Title#221827:0":"T:This is your banner title","✏️ Text#221827:3":"T:Here you can insert any additional information that may be relevant to the context. This section serves as a placeholder for content that can provide more in-depth explanations, supplementary data, or any other pertinent details that the reader might need.","Type":"V:Text Block with Image|Text Block with Image,Text Container on Image,Text on Colorful Background"}},"Card Timestamp and Counter":{"w":80,"h":26,"props":{"✏️ Timestamp Text#320283:0":"T:2hrs ago","Icon Button#320283:1":"B:true","✏️ Counter Text#320306:3":"T:6 of 12","Type":"V:Timestamp|Counter,Timestamp"}},"Card Badge":{"w":37,"h":16,"props":{"Text#229927:2":"B:true","✏️ Text#229927:3":"T:New","With Icon#229927:4":"B:false","Icon#232335:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","Color":"V:Default|Default,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"}},"Card Footer":{"w":320,"h":54,"props":{"3rd Action#207890:15":"B:false","2nd Action#207890:17":"B:false","Form Factor":"V:Compact|Compact,Cozy"}},"Card Numeric Header":{"w":294,"h":76,"props":{"2nd Indicator#208598:2":"B:true","Label#208598:3":"B:true","Micro Chart#241442:0":"B:false","1st Indicator#304002:0":"B:true"}},"Card Extended Header":{"w":320,"h":62,"props":{"2nd Tag#207847:2":"B:false","Rating Indicator#207847:6":"B:true","Link#207847:8":"B:true","3rd Tag#207847:10":"B:false","2nd Row#209363:9":"B:true","3rd Row#300122:0":"B:false","1st Row#302504:0":"B:true","1st Tag#307702:3":"B:true","Timestamp#332737:0":"B:true","⿻  3rd Row#422655:9":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Card Main Header":{"w":320,"h":80,"props":{"Avatar#103789:0":"B:true","Subtitle#103789:4":"B:true","Counter#103789:8":"B:true","Action#208598:5":"B:false","Trailing Area#209363:4":"B:true","✏️ Title#218182:0":"T:Alain Chevalier","✏️ Subtitle#218182:5":"T:Sales Executive","Timestamp#307080:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active"}},"Card Media Block":{"w":320,"h":170,"props":{"✏️ Text#209363:0":"T:Incoming \nApplications","Type":"V:Image|Image,Image with Padding,Title"}},"Card":{"w":320,"h":112,"props":{"Slot#114257:0":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Extended Header#205668:9":"B:false","Numeric Header#205668:16":"B:false","Content#205668:23":"B:true","Footer#205668:30":"B:false","Media Block#207890:18":"B:false","1st Badge#208835:6":"B:false","Main Header#210374:0":"B:true","2nd Badge#229944:5":"B:false","Content/Footer Space#319730:0":"B:true","Header#322738:0":"B:true","⿻  Content#422655:0":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover","▶️ Interactive Header":"V:False|True,False"}},"Page Indicator Dots":{"w":16,"h":8,"props":{"Selected":"V:True|True,False"}},"On Content Page Indicator":{"w":248,"h":56,"props":{"✏️  Text#236170:0":"T:1 of 9","Type":"V:Dots|Dots,Numbers,Hidden"}},"Page Indicator":{"w":322,"h":56,"props":{"✏️  Text#236170:4":"T:1 of 9","Type":"V:Dots|Dots,Numbers"}},"Carousel":{"w":322,"h":321,"props":{"Multiple Items#355313:0":"B:false","Indicator Bar#360874:0":"B:true","Indicator Buttons#360874:7":"B:true","⿻  Multiple Items#422655:12":"S","Indicator Position":"V:Bottom|Bottom,Top","Buttons Position":"V:On Bar|On Bar,On Image","On Content":"V:False|False,True"}},"Check Box":{"w":16,"h":16,"props":{"Label#125545:8":"B:false","✏️ Text#154638:49":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only,Display Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Check":"V:Unchecked|Unchecked,Checked,Tristate"}},"Swatch":{"w":20,"h":20,"props":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover / Pressed / Selected","Color":"V:Gold|Gold,Light Coral,Deep Pink,Medium Violet Red,Medium Slate Blue,Cornflower Blue,Light Sea Green,Olive Drab,Royal Blue,Light Cyan,White,Light Gray,Dark Gray,Dim Gray,Black,Transparent"}},"Color Palette":{"w":156,"h":183,"props":{"Form Factor":"V:Compact|Compact,Cozy"}},"Color Picker Color Mode Panel":{"w":258,"h":48,"props":{"Color Mode":"V:HSLA|HSLA,RGB","Form Factor":"V:Compact|Compact,Cozy"}},"Color Picker Comparison Color Fields":{"w":53,"h":26,"props":{"Opacity 100%#313616:6":"B:true","Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red"}},"Color Picker Slider":{"w":258,"h":20,"props":{"Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red","Percentage":"V:30%|30%,100%"}},"Color Picker":{"w":290,"h":458,"props":{"Default Mode#315367:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Gradient Field":"V:Blue Hue|Blue Hue,Red Hue"}},"Date (Range) Picker":{"w":272,"h":26,"props":{"Calendar#165202:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Type":"V:One-Month|One-Month,Two-Month","Orientation":"V:N/A|N/A,Horizontal,Vertical"}},"Date Time Dropdown":{"w":585,"h":378,"props":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Date and Time|Date and Time,Date,Time"}},"Date Time Picker":{"w":251,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|False,True"}},"Dialog Block Layer":{"w":98,"h":98,"props":{}},"Dialog":{"w":478,"h":216,"props":{"Slot#114549:3":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Resize Handle#153790:0":"B:false","⿻  Content#422655:19":"S","Form Factor":"V:Compact|Compact,Cozy","Scrollable Content":"V:False|False,True"}},"Drop-Down Value Message Item":{"w":251,"h":34,"props":{"Type":"V:Negative|Negative,Critical,Positive,Information"}},"Drop-Down Item":{"w":251,"h":32,"props":{"Check Box#181512:0":"B:false","✏️ 1st Column#181512:279":"T:Option text","✏️ 2nd Column#181512:293":"T:2nd Column","Separator#181522:307":"B:false","Show 2nd Column#181557:321":"B:false","Delete Button#212713:0":"B:false","⿻ Content Compact#471778:195":"S","⿻ Content Cozy#471778:223":"S","Form Factor":"V:Compact|Cozy,Compact,N/A","Type":"V:Single Line|Single Line,Group Header","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"}},"Drop-Down Base":{"w":251,"h":160,"props":{"Show Value Message#190333:0":"B:false","⿻ Drop-Down Items Compact#427954:7":"S","⿻ Drop-Down Items Cozy#427954:10":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Drop-Down":{"w":251,"h":160,"props":{"Form Factor":"V:Compact|Compact,Cozy"}},"Expand / Collapse and Pin Buttons":{"w":56,"h":24,"props":{"Header Behaviour":"V:Expanded|Collapsed,Expanded","Pin Button":"V:True|True,False"}},"Dynamic Page Header":{"w":1440,"h":286,"props":{"Expand and Pin Buttons#416566:0":"B:true","⿻ Content#416566:6":"S","⿻ Header Area#416566:9":"S","Header Shadow#416566:18":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:XL and XXL|S,M,L,XL and XXL","Interaction State":"V:Regular|Regular,Hover","Collapsed":"V:False|True,False"}},"File Uploader":{"w":280,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Text":"V:Placeholder|Placeholder,Uploaded File"}},"Form Item":{"w":288,"h":32,"props":{"✏️ Form Header Text#237212:0":"T:Form Header","✏️ Group Header Text#237212:24":"T:Group Header","Required Label#466778:0":"B:false","Type":"V:Input|Input,Tokenizer,Text Area,Check Box,Group Header,Form Header","Form Factor":"V:Compact|Compact,Cozy,N/A","Mode":"V:Edit Mode|Edit Mode,Display Mode,N/A","Orientation":"V:4:8 Horizontal|4:8 Horizontal,4:7:1 Horizontal,Vertical,N/A","Two Input Controls":"V:No|No,Yes"}},"Form":{"w":603,"h":246,"props":{"Type":"V:4:8 Horizontal with groups|4:8 Horizontal with groups,4:7:1 Horizontal,Vertical with groups,Vertical","Form Factor":"V:Compact|Compact,Cozy","Display Mode":"V:False|False,True"}},"Homepage Hero Banner":{"w":1344,"h":100,"props":{"⿻ Action Area#440899:0":"S","⿻ Content Area#440899:2":"S","✏️ Date#441217:0":"T:Thursday, November 5, 2025","✏️ Salutation#441217:2":"T:Hello, Henry","Action Area#441217:4":"B:false","Content Area#441217:7":"B:false","Size":"V:XL Full-width|XS,S,M,L,XL Letterbox,XL Full-width","Form Factor":"V:Compact|Compact,Cozy","Variation":"V:False|True,False"}},"Illustrated Message":{"w":682,"h":416,"props":{"✏️ Title#99555:0":"T:Let's get some results","✏️ Description#99555:17":"T:Start by providing your search criteria.","Illustration L#129986:0":"I:3e6dd1ef07f30539422119902a38147c87f9622a Before Search/Size=L","Illustration M#129986:9":"I:cc40cf665805bb22b83e74f3161d0c6e48ff9655 Before Search/Size=M","Illustration S#129986:18":"I:9acff3f046e634485e3808e62d418f7194eec8ef Before Search/Size=S","Illustration XS#129986:27":"I:8c85d2c6d6c767092f209374a0471abc6a21b44e Before Search/Size=XS","3rd Button#177911:52":"B:false","2nd Button#177911:61":"B:false","1st Button#177911:79":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:Large (L)|Extra Small (XS),Small (S),Medium (M),Large (L)"}},"Input Button":{"w":32,"h":26,"props":{"Icon#148177:0":"I:80086d2e8969c07e7c885e6ee9244005bfc3864d decline","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information"}},"Input Message Popover":{"w":227,"h":34,"props":{"✏️ Text#148609:0":"T:Message text giving further context.","Value State":"V:Negative|Negative,Critical,Positive,Information"}},"Input":{"w":280,"h":26,"props":{"Trailing Action#144344:0":"B:false","2nd Action#144344:3":"B:false","✏️ Placeholder#145437:156":"T:Placeholder","✏️ Typed Text#145437:221":"T:Typed Text","Message Popover#154602:0":"B:false","Description Text#267637:0":"B:false","✏️ Description Text#267656:0":"T:Description Text","⿻ Content Compact#471773:0":"S","⿻ Content Cozy#471778:130":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Read Only,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information","Content":"V:Placeholder|Placeholder,Typed Text"}},"Label":{"w":38,"h":16,"props":{"Required#104646:0":"B:false","✏️ Label#237212:48":"T:Label:","Type":"V:Regular|Regular"}},"Link":{"w":42,"h":16,"props":{"✏️ Text#142188:0":"T:Link","Icon#283747:121":"I:e58e7884f9b11181af59a8bb7cd4c2106d5327e9 inspect","Type":"V:Icon Link|Regular,Emphasized,Subtle,Icon Link","Interaction State":"V:Regular|Regular,Hover,Visited,Down,Disabled","Icon Position":"V:Right|Right,Left,N/A"}},"Selector":{"w":16,"h":16,"props":{"Form Factor":"V:Compact|Compact,Cozy","Selector Type":"V:Check Box|Check Box,Radio Button","Selected":"V:Unselected|Selected,Tristate,Unselected"}},"List Attachment":{"w":71,"h":16,"props":{"Text#155542:4":"T:Attachment","Type":"V:Attachment|Attachment,Object Status"}},"List Thumbnail":{"w":48,"h":48,"props":{"Icon#155542:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Thumbnail":"V:Avatar|Avatar,Icon"}},"List Item":{"w":400,"h":32,"props":{"Separator#123475:0":"B:true","Icon / Selector#147034:0":"B:false","Navigation Indicator#147034:36":"B:false","Leading Icon#147034:54":"B:true","Selector#147034:72":"B:false","Item Counter#147034:108":"B:false","Trailing Icon#147034:144":"B:false","Leading Icon Swap#152431:18":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","2nd Button#152451:36":"B:false","✏️ Counter Value#152451:54":"T:12345","1st Button#152462:72":"B:false","✏️ Text#152462:90":"T:List Item","✏️ Byline#152704:108":"T:Byline","Attachment#152767:146":"B:true","Thumbnail#152767:165":"B:false","✏️ Group Name#152767:195":"T:Group Header","✏️ Footer Text#152767:225":"T:List Footer","Trailing Icon Swap#155542:7":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Object Status#155958:0":"B:false","✏️ Growing Text#155999:31":"T:More","⿻ Content#415971:0":"S","Content Container#415971:27":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Single Line|List Header,Group Header,Single Line,Byline,Growing List Item,Footer","Interaction State":"V:Regular|Regular,Hover,Down,N/A","Selected":"V:False|True,False"}},"List":{"w":400,"h":460,"props":{"⿻ List Items Compact#427968:0":"S","⿻ List Items Cozy#427968:3":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Trailing Container":{"w":24,"h":32,"props":{"✏️ Shortcut#161491:0":"T:Ctrl+3","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Arrow|Shortcut,Arrow,Checkmark"}},"Menu List Item":{"w":206,"h":32,"props":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:false","Trailing Space#147034:144":"B:false","✏️ Text#152462:90":"T:Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"}},"Menu":{"w":144,"h":128,"props":{"⿻ Menu List Items Cozy#427954:13":"S","⿻ Menu List Items Compact#427954:16":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Message Strip Icon Button":{"w":32,"h":26,"props":{"Interaction  State":"V:Regular|Regular,Hover,Down","Type":"V:Indication 1 to 10|Indication 1 to 10,Indication 1b to 10b"}},"Message Strip":{"w":596,"h":32,"props":{"Close Button#102938:0":"B:true","Value State":"V:Information|Information,Positive,Critical,Negative,Indication Color","Icon":"V:True|True,False","Color":"V:None|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"}},"Multi Combobox":{"w":280,"h":26,"props":{"\"Show all\" Footer#212884:27":"B:false","Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|True,False"}},"Multi Input":{"w":280,"h":26,"props":{"Drop-Down#209617:14":"B:false","\"Show all\" Footer#212884:17":"B:false","Form Factor":"V:Compact|Compact,Cozy","Display Only":"V:False|False,True"}},"Notifications Status Indicator":{"w":16,"h":16,"props":{"Type":"V:Positive|Positive,Negative,Critical,Information,Neutral"}},"Notification List Item":{"w":428,"h":96,"props":{"Status Indicator#274252:3":"B:false","More#274252:6":"B:true","Importance Tag#274252:14":"B:false","Description#274252:17":"B:true","✏️ Title#274309:0":"T:Notification Title","✏️ Description#274309:5":"T:Description of notification topic","✏️ Group Name#276270:0":"T:Today","Arrow#288437:14":"I:d206a924630cb08c1b62f4c2ddef383b8142e519 slim-arrow-down","Form Factor":"V:Compact|N/A,Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Type":"V:Notification List Item|Group Header,Notification List Item","Read":"V:False|False,True"}},"Notification Banner":{"w":450,"h":264,"props":{"2nd List Item#274329:0":"B:true","3rd List Item#274329:3":"B:false","4th List Item#274329:6":"B:false","5th List Item#274329:9":"B:false","6th List Item#274329:12":"B:false","7th List Item#274329:15":"B:false","8th List Item#274329:18":"B:false","9th List Item#274329:21":"B:false","10th List Item#274329:24":"B:false","⿻ Content#415687:0":"S","Size":"V:S|S,M / L"}},"Notifications Growing Item":{"w":400,"h":44,"props":{"Interaction State":"V:Regular|Regular,Hover,Down","Busy Indicator":"V:False|True,False"}},"Notifications":{"w":400,"h":620,"props":{"Message Strip#274252:26":"B:false","1st Growing Notifications#274252:29":"B:false","2nd Growing Notifications#413974:0":"B:false","Toolbar Sorting#414088:0":"B:false","⿻ Content#414766:10":"S","Size":"V:S|S,M / L","Scrollbar":"V:False|False,True"}},"Object Attribute":{"w":135,"h":16,"props":{"Type":"V:Regular|Regular,Active"}},"Object Identifier":{"w":122,"h":18,"props":{"Hover":"V:No|No,Yes","Link":"V:No|No,Yes","Emphasis":"V:No|No,Yes"}},"Object Number":{"w":75,"h":16,"props":{"Type":"V:Regular|Regular,Emphasized,Large,Inverted","Semantic":"V:Error|None,Information,Success,Warning,Error"}},"Object Status":{"w":91,"h":16,"props":{"Semantic":"V:Information|None,Information,Success,Warning,Error","Inverted":"V:No|No,Yes","Large Design":"V:No|No,Yes"}},"Panel":{"w":1007,"h":223,"props":{"Slot#114200:7":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","✏️ Title#145524:0":"T:Panel Title","4th Action#146223:7":"B:false","3rd Action#146223:14":"B:false","2nd Action#146223:21":"B:false","1st Action#146223:28":"B:false","⿻  Content#422655:24":"S","Form Factor":"V:Compact|Compact,Cozy","Fixed":"V:False|False,True","Collapsed":"V:False|False,True"}},"Popover":{"w":248,"h":248,"props":{"Header#153771:0":"B:false","Footer#153771:14":"B:false","Resize Handle#230738:94":"B:false","⿻ Content#422659:91":"S","Scrollbar#460647:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Arrow":"V:False|False,True","Arrow Position":"V:None|None,↖ Top Left,↑ Top Center,↗ Top Right,↗ Right Top,→ Right Center,↘ Right Bottom,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,↙ Left Bottom,← Left Center,↖ Left Top","Resize Handle Position":"V:↖ Top Left|↖ Top Left,↗ Top Right,↘ Bottom Right,↙ Bottom Left"}},"Product Icon":{"w":48,"h":48,"props":{"Icon#458135:0":"I:bcda1a5cba51eed5db5c05ffc5c429660ff80899 bus-public-transport","Type":"V:Product Switch Icon|Product Switch Icon,Icon","Size":"V:Large|Small,Large"}},"Product Switch Element":{"w":180,"h":118,"props":{"✏️ Title#452468:0":"T:Title","✏️ Subtitle#452468:11":"T:Subtitle","Size":"V:Large|Small,Large","Interaction State":"V:Regular|Regular,Hover,Pressed,Selected,Selected Hover"}},"Product Switch":{"w":588,"h":402,"props":{"⿻ Large Elements#454469:10":"S","⿻ Small Elements#454469:15":"S","Size":"V:Large|Small,Large","Scrollbar":"V:False|True,False"}},"Progress Indicator":{"w":256,"h":32,"props":{"Text#103111:0":"B:true","✏️ Text Value#141830:0":"T:60%","✏️ Progress Bar#142242:0":"T:write/delete to move the progress value","Value State":"V:None|None,Information,Positive,Critical,Negative","Interaction State":"V:Regular|Disabled,Regular"}},"Radio Button":{"w":16,"h":16,"props":{"Label#125545:8":"B:false","✏️ Text#154638:0":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Selected":"V:False|False,True"}},"Rating Indicator Single":{"w":24,"h":24,"props":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Hover,Read-Only,Regular","Selected":"V:False|False,True"}},"Rating Indicator":{"w":132,"h":24,"props":{"Label#104633:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Read Only,Disabled"}},"Scrollbar":{"w":12,"h":113,"props":{"Interaction State":"V:Regular|Regular,Hover"}},"Select":{"w":251,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|False,True"}},"Settings":{"w":960,"h":680,"props":{"Resize Handle#289298:0":"B:false","List Scrollbar#292448:0":"B:false","Content Scrollbar#292448:3":"B:false","⿻ Content#422659:22":"S","Unique Identifier#480620:11":"B:false","1st User Details#480620:22":"B:false","2nd User Details#480620:33":"B:false","Manage Account Button#480620:44":"B:false","⿻ Additional Settings#480620:55":"S","Add Additional Settings#480620:66":"B:false","Region#480711:77":"B:true","Date Format#480711:88":"B:true","Time Format#480711:99":"B:true","Time Zone#480711:110":"B:true","Currency#480711:121":"B:true","Number Format#480711:132":"B:true","Add Content#481377:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Default|Default,User Account,Appearance,Language and Region,Notifications"}},"Shell Search Selector":{"w":69,"h":28,"props":{"✏️ Text#415778:0":"T:All","Interaction State":"V:Regular|Regular,Hover,Hover on Icon,Active","Advanced Filtering":"V:False|True,False"}},"Shell Search Button":{"w":28,"h":28,"props":{"Interaction State":"V:Regular|Regular,Hover,Active,While Typing"}},"Shell Search":{"w":400,"h":36,"props":{"Interaction State":"V:Regular|Regular,Hover,Active,Searched,While Typing","Expanded":"V:True|False,True","Selector":"V:False|False,True"}},"Branding Button":{"w":212,"h":36,"props":{"Product Identifier#285341:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Active"}},"Shell Button":{"w":36,"h":36,"props":{"Interaction State":"V:Regular|Regular,Hover,Active,Toggled"}},"Shell Bar":{"w":1440,"h":52,"props":{"Back Button#104186:9":"B:false","1st Extra Action#230178:0":"B:false","2nd Extra Action#230178:12":"B:false","Extra Right Area#285220:3":"B:false","Extra Left Area#285220:9":"B:false","Joule#285220:15":"B:false","Feedback#285220:21":"B:false","Product Switch#285220:27":"B:false","Overflow#285285:0":"B:true","Notification#285285:11":"B:true","Help#285285:22":"B:true","Walk me#285750:0":"B:false","Support#285750:11":"B:false","Shell Search#328265:0":"B:true","⿻   Extra Left Area#422659:0":"S","⿻ Extra Right Area#422659:11":"S","Size":"V:XL|S,M,L,XL,XXL","Hamburger":"V:False|False,True"}},"Navigation Item":{"w":48,"h":32,"props":{"Navigation Indicator / External Link#283218:12":"B:true","Navigation Indicator / External Link Icon#283293:50":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Two Click-Area#283293:112":"B:false","✏️ Text#283293:137":"T:Nav Item","Icon#328810:0":"I:ddf4537c2f792179f11f64cae869cd1241e5ec7e home","External Link#406893:0":"B:false","Tag#469827:7":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Navigation Item|Navigation Item,Child Item,Navigation Group,Quick Create","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Pressed Hover,Pressed Active","Selected":"V:False|True,False","Expanded":"V:False|True,False","Long Tag":"V:False|False,True"}},"Side Navigation":{"w":64,"h":773,"props":{"Scrollbar#283293:201":"B:false","Arrow#325625:0":"B:true","⿻ Navigation Items#415662:0":"S","⿻ Footer#415679:7":"S","⿻ Navigation Items Collapsed#415950:0":"S","⿻ Footer Collapsed#415950:7":"S","Search#469823:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Collapsed|Collapsed,Expanded,Floating"}},"Tooltip and Input":{"w":30,"h":16,"props":{"✏️ Value#237327:1":"T:65","Tooltip / Input":"V:Tooltip|Tooltip,Input","Form Factor":"V:Compact|Compact,Cozy"}},"Range Slider Handle":{"w":36,"h":32,"props":{"Tooltip / Input#104968:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"}},"Range Slider":{"w":256,"h":20,"props":{"Tick Marks#104968:7":"B:false","Labels#299312:21":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Disabled,Regular","Left Value":"V:0%|0%,25%,50%,75%","Right Value":"V:25%|25%,50%,75%,100%"}},"Slider Handle":{"w":36,"h":32,"props":{"Tooltip / Input#104968:30":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"}},"Slider":{"w":256,"h":20,"props":{"Tick Marks#104968:25":"B:false","Labels#299312:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Disabled","Value":"V:0%|0%,25%,50%,75%,100%"}},"Step Input":{"w":152,"h":26,"props":{"✏️ Value#148178:0":"T:50","Message Popover#154602:65":"B:false","✏️ Description Text#469803:0":"T:Description Text","Description Text#469803:35":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|None,Negative,Critical,Positive,Information"}},"Switch":{"w":32,"h":20,"props":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Non-Semantic|Non-Semantic,Semantic","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Checked":"V:True|True,False"}},"Icon Tab Bar":{"w":420,"h":44,"props":{"Overflow#103133:0":"B:true","⿻ Tabs Inline, Non Semantic#425676:0":"S","⿻ Tabs Inline, Semantic#426727:0":"S","⿻ Tabs Shell Navigation, Non Semantic#426727:46":"S","⿻ Tabs Icon Only, Non Semantic, Compact#426736:0":"S","⿻ Tabs Icon Only, Semantic, Compact#426736:46":"S","⿻ Tabs Process, Non Semantic, Compact#426762:92":"S","⿻ Tabs Process, Semantic, Compact#426762:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Compact#426762:184":"S","⿻ Tabs Filter Tabs, Semantic, Compact#426762:230":"S","⿻ Tabs Icon Only, Non Semantic, Cozy#426848:0":"S","⿻ Tabs Icon Only, Semantic, Cozy#426848:46":"S","⿻ Tabs Process, Non Semantic, Cozy#426848:92":"S","⿻ Tabs Process, Semantic, Cozy#426848:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Cozy#426848:184":"S","⿻ Tabs Filter Tabs, Semantic, Cozy#426848:230":"S","Form Factor":"V:N/A|Cozy,Compact,N/A","Type":"V:Inline Mode|Inline Mode,Icon Only,Process Tabs,Shell Navigation,Filter Tabs","Semantic":"V:No|No,Yes","Size":"V:S|S,M and L,XL"}},"Tab Bar Overflow":{"w":72,"h":24,"props":{"Type":"V:'More' Text|'More' Text,Count","Interaction State":"V:Regular|Regular,Hover,Down"}},"Tab":{"w":62,"h":44,"props":{"Badge#101559:0":"B:false","Item Count#101799:0":"B:false","Menu Arrow#101979:0":"B:true","Icon#112262:750":"I:361026d73858fabff3db3e9bdea5a18681beccc2 group","✏️ Text#183920:0":"T:Tab Text","✏️ Additional Text#183920:77":"T:53 of 123","✏️ Counter#183920:154":"T:123","✏️ Label#183920:231":"T:Products","Item Count Text#183920:308":"T:3","Separator#183922:0":"B:false","Arrow#183922:77":"B:false","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Inline|Inline,Icon Only,Shell Navigation,Process and Filter,Filter Total","Interaction State":"V:Regular Active|Regular Active,Regular Inactive,Hover on Arrow (Active),Hover (Inactive),Hover on Text (Inactive),Hover on Arrow (Inactive)","Value State":"V:Non Semantic|Non Semantic,None,Positive,Critical,Negative"}},"Table Highlight":{"w":6,"h":32,"props":{"Value State":"V:Information|Information,Error,Warning,Success,None"}},"Table Cell":{"w":200,"h":32,"props":{"1st Column#188248:0":"B:false","✏️ Text#190298:0":"T:Text","Button Type – Compact#190298:59":"I:f6246d2947c0a3cc1560cc40ce9ed6bd789d8416 Icon Button/Form Factor=Compact, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Compact#191065:0":"I:4ccc8a9d82c4094267a43b82c45c4b4564dbced3 Input/Form Factor=Compact, Interaction State=Regular, Value State=None, Content=Placeholder","✏️ Currency#191125:0":"T:EUR","Button Type – Cozy#192997:0":"I:00a3434ed7a0e9830ce0eeae8aac9bafed7b00b2 Icon Button/Form Factor=Cozy, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Cozy#192997:175":"I:7c27077d7736b75f9d0724e3fb4512bda7bd46f0 Input/Form Factor=Cozy, Interaction State=Regular, Value State=None, Content=Placeholder","Icon#200078:0":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","✏️ By Text Description#239124:0":"T:Description","Collapse / Expand#242161:0":"B:false","⿻ Content Compact#471778:237":"S","⿻ Content Cozy#471778:463":"S","Form Factor":"V:Compact|Compact,Cozy","Hierarchy":"V:Cell|Cell,Column Header,Group Header","Type":"V:Text|Text,Check Box,Icon,Link,Tag,Button,Input,Currency,Rating Indicator,Highlight,Object Identifier - Bold,Object Identifier - Link,Empty","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Alignment":"V:Left|Left,Right"}},"Table":{"w":1150,"h":556,"props":{"Highlight#200542:0":"B:false","⿻ Columns Compact#426001:0":"S","⿻ Rows Compact#426001:5":"S","⿻ Columns Cozy#426001:10":"S","⿻ Rows Cozy#426001:15":"S","Form Factor":"V:Compact|Compact,Cozy","Structure":"V:Columns|Columns,Rows"}},"Tag":{"w":44,"h":22,"props":{"Left Icon#188702:0":"B:false","Icon#189116:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","⿻ Content#473512:0":"S","✏️ Text#474619:0":"T:Tag","Interaction State":"V:Regular|Regular,Hover,Down","Value State":"V:Information|Information,Positive,Critical,Negative,None,Indication Colors","Color":"V:Semantic|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b,Semantic","Large Design":"V:No|No,Yes","Icon Only":"V:False|False,True"}},"Text":{"w":80,"h":16,"props":{"✏️ Text#223176:0":"T:Lorem ipsum","Selected":"V:False|True,False"}},"Text Area":{"w":280,"h":100,"props":{"Scroll Bar#147859:1":"B:false","✏️ Placeholder#147861:0":"T:Write your message here.","✏️ Typed Text#147861:3":"T:Typed text","Counter#165575:0":"B:false","Message Popover#165575:1":"B:false","✏️ Counter Text#165575:2":"T:180 characters left","✏️ Text#165588:0":"T:180 characters left","Form Factor":"V:Compact|Compact,Cozy","Content":"V:Placeholder|Placeholder,Typed Text","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|Negative,Information,Positive,Critical,None"}},"Tick Mark":{"w":4,"h":5,"props":{"Selected#193792:0":"B:false","Size":"V:Large|Large,Small"}},"Number Selector":{"w":32,"h":32,"props":{"✏️ Number#195120:2":"T:3","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected"}},"Clock-face":{"w":264,"h":264,"props":{"Form Factor":"V:Compact|Cozy,Compact","Type":"V:12 hours|12 hours,24 hours,Minutes,Seconds"}},"Hours and Minutes Output":{"w":176,"h":26,"props":{"Seconds#194107:0":"B:false","AM/PM 12 hours view#194107:3":"B:true","Current Time#194199:6":"B:false","Form Factor":"V:Compact|Compact,Cozy"}},"Time Dropdown":{"w":296,"h":378,"props":{"Form Factor":"V:Compact|Compact,Cozy"}},"Time Picker":{"w":251,"h":26,"props":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|True,False"}},"Toast":{"w":207,"h":48,"props":{"✏️ Text#142680:0":"T:2 sales orders were deleted.","Type":"V:Regular|Regular"}},"Tooltip":{"w":87,"h":24,"props":{"✏️ Text#466725:9":"T:Save (Ctrl+S)","Arrow Position":"V:↑ Top Center|↑ Top Center,↗ Top Right,→ Right Center,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,← Left Center,↖ Top Left"}},"Tree Item Base":{"w":400,"h":32,"props":{"✏️ Text#182211:63":"T:Level","Icon#184583:159":"I:40534f62cdce550850addd3a7dcfa843d3c68e0c navigation-down-arrow","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Selected":"V:False|False,True","Level 1":"V:True|False,True","Last Child":"V:False|False,True"}},"Tree Item":{"w":400,"h":32,"props":{"Level 10#186218:93":"B:true","Level 9#186218:124":"B:true","Level 8#186218:155":"B:true","Level 5#186218:186":"B:true","Level 6#186218:217":"B:true","Form Factor":"V:Compact|Compact,Cozy","Levels":"V:1|1,2,3,4-6,7+","Selection":"V:None|None,Independent,Dependent"}},"Tree":{"w":400,"h":128,"props":{"⿻ Tree Items Compact#425685:3":"S","⿻ Tree Items Cozy#427338:0":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Token":{"w":65,"h":20,"props":{"✏️ Text#154228:0":"T:Token","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected,Selected Hover,Read Only"}},"Overflow Link and Typing ":{"w":44,"h":16,"props":{"✏️ Typed Text#202050:14":"T:Typing","Type":"V:Overflow Link|Overflow Link,Typing"}},"Tokenizer":{"w":280,"h":26,"props":{"Overflow Link / Typing#202017:10":"B:false","Overflow Link#202050:3":"B:false","⿻ Tokens Compact#425873:0":"S","⿻ Tokens Cozy#425873:7":"S","⿻ Tokens Multiline Compact#425882:0":"S","⿻ Tokens Multiline Cozy#425882:7":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Single Line|Single Line,Multiline","Input":"V:False|False,True"}},"Toolbar Items":{"w":1,"h":24,"props":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Separator|Separator,Spacer (set to fill)"}},"Toolbar":{"w":320,"h":32,"props":{"Title#186167:0":"B:false","3rd Action#186464:3":"B:true","1st Action#186482:6":"B:true","2nd Action#186482:9":"B:true","✏️ Title Text#186490:0":"T:Toolbar Title","Input#186514:12":"B:false","Segmented Button#186514:15":"B:false","4th Action#186601:9":"B:false","5th Action#186601:18":"B:false","6th Action#186601:21":"B:false","7th Action#186601:24":"B:false","8th Action#186601:27":"B:false","9th Action#186601:30":"B:false","10th Action#186601:33":"B:false","11th Action#186601:36":"B:false","12th Action#186601:39":"B:false","13th Action#186601:42":"B:false","⿻ Actions Compact#425685:6":"S","⿻ Left Area#425685:12":"S","⿻ Actions Cozy#427338:3":"S","Form Factor":"V:Compact|Compact,Cozy"}},"Tool Header":{"w":420,"h":52,"props":{"Form Factor":"V:Compact|Compact,Cozy"}},"Header Content Area":{"w":299,"h":64,"props":{"⿻ Content#454728:0":"S"}},"User Menu Custom Menu List Item":{"w":299,"h":52,"props":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:true","Trailing Space#147034:144":"B:true","✏️ Menu List Item#152462:90":"T:User Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Sub-menu Item#451233:0":"B:true","✏️ Sub-menu Item#451233:7":"T:Sub-menu Item","Sub-menu#452355:0":"B:false","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"}},"User Menu Custom List Item":{"w":299,"h":72,"props":{"✏️ 2nd Subline#285480:1":"T:Second Subline","✏️ 1st Subline#285480:2":"T:First Subline","✏️ User Name#285480:3":"T:User Name","Separator#285480:4":"B:true","Active User#285480:6":"B:true","Avatar#285835:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|True,False"}},"User Menu Custom List ":{"w":299,"h":144,"props":{"⿻ User Menu Custom List Items#427954:6":"S"}},"User Menu":{"w":320,"h":692,"props":{"✏️ User Name#282907:0":"T:Alex Morgan","✏️ 1st Subline#282907:3":"T:alex.morgan@example.com","✏️ 2nd Subline#282907:6":"T:Delivery Manager","Action Button#330471:0":"B:true","✏️ 3rd Subline#422064:0":"T:Primary Employment","⿻ Custom Menu List Items Cozy#427954:0":"S","⿻ Custom Menu List Items Compact#427954:3":"S","Form Factor":"V:Compact|Compact,Cozy","Header Content Area":"V:False|True,False"}},"AI Split Menu Button":{"w":115,"h":26,"props":{}},"AI Menu Button":{"w":105,"h":26,"props":{}},"AI Button":{"w":83,"h":26,"props":{}},"AI Prompt Input":{"w":322,"h":48,"props":{}},"AI Rich Text Editor":{"w":575,"h":148,"props":{}},"AI Text Area":{"w":340,"h":100,"props":{}},"AI Input":{"w":280,"h":26,"props":{}},"Wizard Page Header":{"w":834,"h":100,"props":{"Size":"V:XL 1440px|XL 1440px,L 1024px,M 834px,Dialog Wizard,Review Header"}},".base/Wizard Step":{"w":256,"h":32,"props":{"State":"V:Current|Future,Current,Complete","Final Step":"V:False|False,True"}}},"effects":{"Shadow/sapContent_Shadow0":"bd311caba939c537982b570d88bfb083a92f3059","Shadow/sapContent_Shadow1":"7c9e3bfd99c8094827e767565fa142748c6709cb","Shadow/sapContent_Shadow2":"dba7ee99ed9c5e9ab723243b2ab863147b7f7498","Shadow/sapContent_Shadow3":"b4fb062cb996947c38b2363457e930ef71cd3445","Shadow/Lite/sapContent_Lite_Shadow":"c04e756cdc4fa5b892f0a77de8359cc75b3d84fa","Container/sapContent_HeaderShadow":"f9e5cd4c6b7aec669e6c5be38ff121d5ece4440d","Interaction/sapContent_Interaction_Shadow":"f81cac072e82763892e6c9b8815529b050d41e14","Interaction/sapContent_Selected_Shadow":"6f6ea08535de967e2e11a88e7a3d91b82d9b6059","Semantic/Shadow/sapContent_Negative_Shadow":"9d999143cc90de7f367c83aa81bbf238354f70e2","Semantic/Shadow/sapContent_Positive_Shadow":"49cf40541f1e7603189e397e5e826f7ceac4ed86","Input/Standard/sapField_Shadow":"298ab46fb5d195fee834ebc63e95667d95dd04df","Input/Invalid/sapField_InvalidShadow":"91401056cd5aaefe15f9756fc5f809f16b5de4c9"}};
const FULL_KIT = {"c":{"Avatar Badge":"51e6293e8c85efccecd24db4e06563cf91135cb1","Avatar Group":"6a0aaf6146d77af3f51fbfa3fefa879ea25bc167","Avatar":"71a3389ecbd47822b3184700766e30963fc2f220","Footer":"e563bc3291a07a5eb4d97b2083355cc54023c377","Header":"d4560b56c7b5aa9476e6b23bfaf869166b7fff47","Breadcrumb":"5743166bac11fdf110a54fd7d85436fed186d3b2","Busy Indicator Dot":"f5778faa7a1014cd3f64b56ae554927c9386fc96","Busy Indicator":"e328630d6c564d1f312256254e0543d41bacbb84","Animated Busy Indicator":"0ab83b6053ab4cc53135dd1cc72ac37ed0c0b984","Button Badge":"3e1f709f433a935f42e51361f06f4382fcc87eed","Segmented Button":"308476a5285b5a132241dc1c118d09ecf8d82273","Segmented Button Singular":"48543fa02ef1fb57b829cd3feb92b21f618e693a","Icon Split Button":"9afdf08f8ae226b175d0a3be79f24454d4b12928","Split Button":"8aba512152f89d81e9c9b804d8da3114b1a83a93","Icon Menu Button":"c455c46ed2cea345c534193c1598e5459aaadd11","Menu Button":"1d667088d93c355c2bd9bafac57147286206e799","Icon Button":"c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63","Button":"91805fa199b1fd247d76a9c08bbe0982b49065c4","Legend":"f63dd9489c7cec0c2af11da655c58e86cee54771","Mixed Calendar Button":"13d82218f6ea8486c962a686688bd883854e9a5e","Calendar Date Types":"f1bc2531da1359d378b30d7e77aed0871860fcd6","Legend Item":"17121720df001ce4519e88e0be53a87f8a8d5ade","Two-Month Calendar":"ad5ce462d34460d73eda13cd7ea3e2677fc27048","Calendar":"16743cba69c57792417e8f6b51d347cc29bd2d95","Banner":"64034a60b543539b407e8534b05454add9a49baf","Card Timestamp and Counter":"139b8dd3708af7c5e33d40a0b8f197fd77c1bf55","Card Badge":"faba12964cad31f90762107683e4de4076d80c15","Card Footer":"b8c16272d1c8537bb36d78e61ffd6b989e6ed894","Card Numeric Header":"682fda15b32742e9cc2aea47e702edda484f8872","Card Extended Header":"afb650e10ee7351cf96c6d23760327363878613c","Card Main Header":"d20f393387802cbd209a35144b63cb141071d425","Card Media Block":"0e527d14fcf51a06dbf14c007f665cbe120761b9","Card":"76fbadb97db272943b14aff18ee5809d0360795f","Page Indicator Dots":"af2036b3b2522c651423b627b9131bbb77ed31f1","On Content Page Indicator":"3d231b180bc3714fb77579ff247ac80034930afe","Page Indicator":"3e63ec191515e58a2d415d116859ffb258200212","Carousel":"bf174ffb841e4b27947d0be558656bb80238fe0d","Check Box":"23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071","Swatch":"3b2b7f89d4e9d4d56052ca032a3960f4e6aeebc9","Color Palette":"069afa265e88bd027cd6116017c671ed31298293","Color Picker Color Mode Panel":"e919349b1d24b93b604545642264832be781b51c","Color Picker Comparison Color Fields":"ded942d4b81f74b8c71ad35b2f4993e819cae7d1","Color Picker Slider":"8add25e353e79555009489541ac15ffef58e6dc3","Color Picker":"da4ac5fe23880bbdefabbf0059891eb289b5a52a","Date (Range) Picker":"ad1f84e6293671f80ff8dd174b1da0cbacf0fa48","Date Time Dropdown":"535a20585281f1d3fd2aa056260a6986d883f9e8","Date Time Picker":"377d76d309f4e5ee7e12132eba0df4e29686a4f7","Dialog Block Layer":"a6c01d24758bcd4c5f5369f875237c3f6e632113","Dialog":"5b965b1eda133ac521b42fa20b201e9491f4bf83","Drop-Down Value Message Item":"4716ba278a5c3d09e874f85c43370e6b9f3186c5","Drop-Down Item":"8ae33d5baeedff3874688177de1f23bd966d1002","Drop-Down Base":"20f94133bdeced52335c202e20200c79d3e766ea","Drop-Down":"d74d4ae8eb549d3cc54b7d345e3b17f90c543817","Expand / Collapse and Pin Buttons":"459b2167d1ce63b2dc1c7da01676aa3f29c49fa2","Dynamic Page Header":"dc90c8dbf7714f165ed79357e9ba6ade5b3701ae","File Uploader":"b7532a6da2cb7677348b5d4bbb81952c9224e984","Form Item":"1ddf647c238f6e94a75b886bc1fcf2e45d74a547","Form":"6603eb3ebde2c1c763f2ae450df2cbb799ba640d","Homepage Hero Banner":"6b540d39a63d837e652b82675136e991ebdd0192","Illustrated Message":"eba579505df21536654910797f94b3784248807b","Input Button":"cde8a0d2581cbe7561c99a10457123bfe8fe42f2","Input Message Popover":"1acdc092cfb399b0c33d1d6484c77ae58fe75242","Input":"0f4366cb3065919e8f3deb0462f1a5a3633d6b50","Label":"b38ac753648ad298c1e2dd02d71417566dd6095c","Link":"2e67b5399e9f05950c6f6ea6f244a1a9736c8a56","Selector":"1e995040306b20c0eb707ceb613737b8971b4365","List Attachment":"e394409638f79174366eb586a41a1214986e68ee","List Thumbnail":"d28077bc628b705c17445b910ca36f707a22dfb5","List Item":"f7bc6526a9f16608747a4141800146ebd3f4e835","List":"4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25","Trailing Container":"09d417201eba5efb296df84af4c1f848bc8d7b80","Menu List Item":"689013924aedb868b8d65be6f249643d45e00a44","Menu":"ba51eb54cba79d6795057e5df5ff853d361ee799","Message Strip Icon Button":"32538ec27bd700ea577639cb301f64ae3a29078f","Message Strip":"f0e77f8888796e35c0e791ddc0b38535eda6ec31","Multi Combobox":"cc0631141a7083096632c6161ee15448ced39ec3","Multi Input":"1dac6b2be28e60c6ff7a5752182d97f5033d3fc8","Notifications Status Indicator":"4e94f59dfaccfbb6edbb9d6d0fc56d2fbbcea245","Notification List Item":"6fe89ae5f6a512bebad2f9737ed134bccac1faed","Notification Banner":"aa8ef403a7c765acf86d2e6fc887a6cb496a3371","Notifications Growing Item":"b64369bba447338dfcf54f408d43c6fd6ee211f1","Notifications":"af1b29be8db435ed790d87721cff4d7efe2217bd","Object Attribute":"080ead216322befe153704bf8f11373158fea34a","Object Identifier":"8e1e45c5a89b540f6ec53542279c7711d4020d81","Object Number":"7b67d22ed19f246b708dc4664808a45f314a7414","Object Status":"748d609ead5d4a246d7cd7c144b94b518c467e58","Panel":"4d19c2a24896033fe5b04bcc5dfdf43e9626283d","Popover":"5f472d6482ed33c9967694fa411c675e3b214d39","Product Icon":"2dd0b7bceffa99417d7b589aba9de70fd09c2fd3","Product Switch Element":"17c7a3c13577e6e0018d65c09d948b07d701df85","Product Switch":"22a7c83b19c183e92577ec43dd01eaa188739cd9","Progress Indicator":"c355f86d77c4e5a8aa2366b83179896f7d172462","Radio Button":"9308f27ef27fbb28bc7d167c52494aa41a21610f","Rating Indicator Single":"35cf292c745706e23a621d794dc5e346b2bacfbb","Rating Indicator":"4e75dd8968be7061ba703e3f5fb4364b558acb04","Scrollbar":"ccf83f17bfdbce52e81e61d775c4eed5d41b2258","Select":"5ce369ff7fb0cce28984eec8dd9973ccde82facb","Settings":"a337e8f637533682b7a0a8082f6db074c5082c81","Shell Search Selector":"638666324a5f4e850f73c23a15cd8124a51920f5","Shell Search Button":"4316105b082691ee1014f2a152deca35112f49e0","Shell Search":"e60b0ec134635c92ca558125083fe11242997e98","Branding Button":"7d9a2765e4d5fd5d9dc841551d138311b9d7a31b","Shell Button":"33fc31d716608f54280c869ad21323f1863b4005","Shell Bar":"169cfd74c0be329c56b4c79b9404c978ff10cb60","Navigation Item":"9d0734a384e9b67475e7b5a357e8c32070a7c2ca","Side Navigation":"d680af6d72f9421fe3f8712bf0ce171308963d3a","Tooltip and Input":"7b831cad640b9d64456b24cca552e4972481024e","Range Slider Handle":"1b9c916117bc532ef17d023a5c7926ad2cabe354","Range Slider":"34d973fcb4c85d6517c8e5c3079e2b40d14d0fe8","Slider Handle":"9eb5d2a4acefa98a5db1b746d8cbfaf1e06417a9","Slider":"ee3b9995f1484c6d008bbac9dba2bd8a0026c160","Step Input":"69f0f7acf68766ac89890d0c119f64bfd50e693a","Switch":"c63509f642cdabbeb8c1878dd125ee006481631c","Icon Tab Bar":"4aafcbf55528c439876b314d155438884b614722","Tab Bar Overflow":"7daa9b988442efaf07553e8f4fe1fa4e8a550c41","Tab":"6cce9469ce9de689ee610fc7125b500c0b4421e7","Table Highlight":"1ce451bc0b726c4cf17cb15977b320253d543ba4","Table Cell":"e717737e98a40a8619e315ca1b4b04646b93b541","Table":"03ea321822c4e99c27de4d9c2524bdec9c6e0972","Tag":"9b55bf702befd73b2e28f800ee4d0033bc0e0e95","Text":"56363ecadd65adb509e4549882737234ad652c2d","Text Area":"bee4738dd5e5856a3b88eae341b47376a3269d87","Tick Mark":"1954dda5aedface7f38494643d3e8d509fe8bafa","Number Selector":"5becd6374a0e90c19de672d2d817e5cd4d0257e9","Clock-face":"09d8873989d113dde702987f86566691dd2928d9","Hours and Minutes Output":"f057e33d74714c78f5981d01d8a5c955dd350644","Time Dropdown":"046b2b86296a9a57168423671d3ea23833b27b7a","Time Picker":"f07044ee64f4abfc857543051806986d49a54b68","Toast":"bbe4c3f7114a2eb4286844102f42c909bf0798eb","Tooltip":"c25ea83976e21fc523313aa335bfcea33518ce93","Tree Item Base":"e857ab95d74c1c163f29a414fcc9b13979332b5c","Tree Item":"5142305385e26387daddd9af7b58a7da66a9f8fd","Tree":"93fca87e34305e0a8e036acdd51e7cdc870d4e0d","Token":"5664972429518d07040a3cadfa2d5a28cf19b8a7","Overflow Link and Typing ":"0f71952fc797e565f455596a4e4caa44c8318608","Tokenizer":"da76d0413ed1f1f40d6f23e7732c9aca0b17ef5b","Toolbar Items":"ad45e5bf267d83ee320902263db8887f71e97026","Toolbar":"58a258bf5813e59cec4dfc684c8cdb2a6ca6721f","Tool Header":"73a0370a9342211081a4ace445d10ab064963624","Header Content Area":"4e2ec14ff0a8c2c9e6f4f30c1a4c1d5efa1992cc","User Menu Custom Menu List Item":"8fbd44e86371a90c9626aea06768b5ed4d01238f","User Menu Custom List Item":"6aff6013fa7332879703327b27f73a71040a849a","User Menu Custom List ":"2d77f84813eb0bc44b359df7b554d1966449aa1c","User Menu":"c9bbc83c501d55048df4f68df50d920a9e85002c","AI Split Menu Button":"3eedca60790fbfc4a87e2cc2aaf9a7774c68b6ca","AI Menu Button":"af7726506b902ae0a80daa2950f890d6b4c275c6","AI Button":"6d9a69eec5a716375ccd5e7272c6193dbe8718ce","AI Prompt Input":"73c83eecc6edcaf572bca3c411b7345a5d398b3c","AI Rich Text Editor":"259171690780bc94b6900bc4975d6bb81d5a089f","AI Text Area":"b5bb525824429489a2f6e5657e91240a605014a8","AI Input":"0098668d77c18b019e726dc9cce843cee360c4d5","Wizard Page Header":"a429e211527af646003af9a89158ec22ca7723bb",".base/Wizard Step":"2c23606836ea876f6f6cf1409da1bf33d2679e70","calendar":"16743cba69c57792417e8f6b51d347cc29bd2d95","list":"4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25","menu":"ba51eb54cba79d6795057e5df5ff853d361ee799","settings":"a337e8f637533682b7a0a8082f6db074c5082c81","tag":"9b55bf702befd73b2e28f800ee4d0033bc0e0e95"},"v":{"sapAccentBackgroundColor1":"4f38e4e254f06a8e5b714729c44f2541ae35efd0","sapAccentBackgroundColor10":"1cf3b6b0ba70c27e66091e352c3d252949e24888","sapAccentBackgroundColor2":"27a462d00b0b3eb33afdb29ba6fc46f5b97e7228","sapAccentColor1":"cec6f9db3ea89eeed293182290efb4d20fabf934","sapAccentColor5":"81a54d7e32a7cc20e46c16c6d9dc2bb5e989b807","sapBackgroundColor":"81733e831b5776ab41555848ba944bb507889e2d","sapPageFooter_Background":"ba80056f64acffed65b30b6bb488e55da1aefd96","sapPageFooter_BorderColor":"6e6b94ae4a9e355f0d6ed876653500c09e56ab24","sapPageHeader_Background":"785b58702030aaa462f21258aebe3df455814247","sapPageHeader_BorderColor":"21c67fd74c5aae8d6089324935624b78f4d01f53","Large":"1d6002e8c937db08d285793b4af27f6847ed8653","Medium":"25cb9a824eb65606fed7afe8aec8793167a87e70","Small":"aa939aa0f04d64acb40ec8c25a9e18f5989d9003","Tiny":"7463b174fdc9f0f63d0f5888f086f07df67d8d71","Zero":"baeba50dd92e446b071462d7df9824068148a8c5","sapContent_Gap":"e13feb360360600976e2b980832f4e5131821e9d","sapContent_Margin_Small":"0d1eaabac638eb5455c8de7f924b13d22ae975f1","sapContent_Padding_L":"25e358b6740c6c2659ddfa2a8413bd8600d47119","sapContent_Padding_M":"4904a4a39e6f0c43c422f4509ac7a4c3230776d2","sapContent_Padding_S":"a89930ba5dacbf7cafb5b2002ca27255be974370","sapContent_Padding_XL":"14420ce8473e8865e9ad07c2346b521d58ba2da6","sapContent_Space_L":"25ccf296a47af9b428894349bcf56202185a783e","sapContent_Space_M":"f9b07cbc6ecf463080950c13f069aa919ed11c18","sapContent_Space_S":"cd3b448a40523c58ad0b3d88377acb01d35e753f","sapContent_Space_Tiny":"8f664f1dd17bf6b0368e5e1241413b7f7b3edfae","sapContent_Space_XL":"54819f861bc9579f8c5547b8fb8d31bfdcac2600","sapShell_Gap_L":"948d6e7a409276b4a1cbdf4b7e8fa87c148a8b33","sapShell_Gap_M":"cf15e218bfb20dfdfd2e2f63247f848601eb6392","sapShell_Gap_S":"9baf85b3c50c86dc5df3b534434bde04f08f3e15","sapShell_GroupGap_L":"5cfa132673fb01e44840803fcc3025c332beff83","sapShell_GroupGap_M":"78ef9f65070682754cb7bf9d4a1a7624004901c3","sapShell_GroupGap_S":"1667a343e380f63b045fd03628570429ab0cd440","sapShell_Space_L":"043e89deb6fd023192f51c4594b6e36be740a47d","sapShell_Space_M":"958daf06534cb24f2119fa3c40ae617aa851b72b","sapShell_Space_S":"912f4236ac5f59917cc38603f8dbcc45491522da","sapBlockLayer_Background":"ca3f3cd9eeba47921f68c16604d851ee1cd95d58","sapBlockLayer_Opacity":"88112a6fe7067e9e608e24738e2cfc01374b183e","sapContent_DisabledOpacity":"294a3988ccd6ccf38f84faa2848b160fbb9b7817","sapElement_BorderCornerRadius":"51920a49f517e59a725aef06da2e27402b308d2d","sapElement_Compact_Height":"83494c88316e689d0fc816698baa949e62fac8e1","sapElement_Height":"57f3078e8d16ec697d3594ee081da6e4148e96e8","sapGroup_BorderCornerRadius":"fe7b0eb1c7766795ead331ab5f1dc5288c06ef2b","sapGroup_ContentAlternatingBackground":"a71dc2bbc7bab078b2024e826372e7a9feb69c3f","sapGroup_ContentBackground":"9241156149fbd73b84220edc1552f41766e05462","sapGroup_ContentBorderColor":"5de48ec733aa0a6b5d5d37a01b8920a0566855bc","sapGroup_TitleBackground":"2c183decef4e3c0667f3b8417bd51df5ed852900","sapGroup_TitleBorderColor":"ab19f783d3c7d511a1aeb60a8037d7d7053627e6","sapGroup_TitleTextColor":"839b08c616ce94207f0d11ba98629b4ec5a699a5","sapPopover_BorderCornerRadius":"af8ee18fe7b06151373c85becdb04d8100d0e6be","sapContent_ContrastFocusColor":"aa2bb94a5c45362019aa6fb4510f42053864a1e3","sapContent_FocusColor":"681400c569373a015f0ebf9506002e676c86624f","sapContent_FocusWidth":"31038ae0a748296e6d1f182b3e58f58fa5633b74","sapFontFamily":"ebb43085572cbe8cedcca3ffce3ce11140eeb11b","sapFontHeader1Size":"eb2f4a4dcc1f987ec55fb1a1b26f58c0dee9df99","sapFontHeader2Size":"eac03d6cbf2cc9d8768cb9ef761e3b346260a1e5","sapFontHeader3Size":"8d18f87a651ca62f7a40b50bdc7221921cf89b11","sapFontHeader4Size":"b4f7244e9d31f7c578ae5f6f43c5ff8ba26ebcf7","sapFontHeader5Size":"aa3c553814652d416947185110707484a00f7df7","sapFontHeader6Size":"f8ad6187c1168f1a7a71f8606d7d1fd6fbe6a802","sapFontLargeSize":"8359ea872ffe9aef35122b77f9bf85976224555c","sapFontSize":"68b1dec9bae15a57b03467a599e8d80bd2e41595","sapFontSmallSize":"70635f7f1bedf427734d0f25574825341351cabb","sapFontBoldFamily":"00b1b8f1937cea28653fca783170388b7856494e","sapFontHeaderFamily":"2424ce60f43cff4d6fbcef28dd986e3f69b8bef1","sapFontSemiboldFamily":"f3a3e2887e0b08a55f83f4815e232fe669e9c03a","sapContent_IconColor":"0d4308d590acc26827e9c4f395c2c45328a1c34c","sapContent_IconHeight":"7814f1d08d5904e0fd452fd621c6f9b620f920ff","sapContent_NonInteractiveIconColor":"b3d5d5aa8f0952b749c2bb4c2943b6c779f95037","sapIndicationColor_1_Background":"15bb84eecb78fab78a03bbb3bff03324830bb3bc","sapIndicationColor_1_TextColor":"578725afa889618c30af3d72700ba2a76447a0ba","sapIndicationColor_4_Background":"0879955552353ffd83d6d875ac0c2a46023cec41","sapIndicationColor_5_Background":"4a65733f151e9270043a3584fae0ef6e56153124","sapField_InvalidColor":"d382e744b764e39ee4e4feb7cbe755d26431dcb1","sapField_ReadOnly_Background":"461f625887f361b6b08c1c4da3014a08967233bf","sapField_Active_BorderColor":"c5d7321d595a79aec7e39277fcebe2e4265c3fb5","sapField_Background":"4f3c388fba24c3bd4a3d42db01d26115037439bf","sapField_BorderColor":"1378b9f583e24df50c0d9f05657cbb463d88c0ef","sapField_Focus_BorderColor":"5b2d5c321a2b09e88983407271de0ccef29164b6","sapField_Hover_BorderColor":"a20c4226c13af83a09a6fcb3f199f3d74ca7a4f2","sapField_PlaceholderTextColor":"b83a7b7711f1705c7717a83b6eb5c915298201e8","sapField_RequiredColor":"b7a01201f8bc6aeb5ea52cce58e48a893bdbe330","sapField_TextColor":"f47d9a5fb2352380105aad4d7dd488cd69796bd4","sapField_SuccessColor":"d58c45eb345a8f440d318289ecfc617c190fc150","sapField_WarningColor":"4cfd933a8462a2fd0951a539a5eea61382a0dc9b","sapField_BorderCornerRadius":"586695746b86e9136bb58013e35e3d3415a7750c","sapActiveColor":"8280fcbaf014930076ff69cc352ce47246d4829c","sapContent_Selected_Background":"c4197dc89ee7d7af698b14d7fa024629a73aa8c9","sapContent_Selected_TextColor":"01a216d0a7af3f20588a7df6a8749ef82104dc5f","sapHoverColor":"afb93d0012679bca0fec71402890041811ef1319","sapSelectedColor":"32c75c9ce3af50d318fe8d64d43dea19d795b8a1","sapLinkColor":"d3df28203fe7452c7ed42bad054ac10fe75d7751","sapList_Active_Background":"ac32a3321cdda456cd35e366ba3d5e5a6fca290e","sapList_AlternatingBackground":"3c6185e8efc5a72f14f7a6b2e75e38f5417df641","sapList_Background":"f4736a188daa008f7fecaf74339db52f6e0633c6","sapList_BorderColor":"ae5e040923e301aea32233ae118cc187149588b0","sapList_FooterBackground":"0f0eecbb1eb25fc94ad7773094b431bef974045d","sapList_GroupHeaderBackground":"0b291c529f06bb08ef0da88e107a32592eb1dcee","sapList_GroupHeaderBorderColor":"7540c39944057193db6dd63bb9824b3827ad3ac8","sapList_HeaderBackground":"2aafdd22976ab57e7fec1b2e20b7a02e4623891a","sapList_HeaderBorderColor":"d357ef8c9a456fd4a6cebaa85f0bef0d022106d7","sapList_HeaderTextColor":"f38113d8b4d764cb71e17f8c9934ac1146971515","TextShadow_Spread_2-4":"b9f1c6329ff8f1cd5caae2fb3dd41211705f571f","TextShadow_X_1":"048eda37df325cbeb951b26879055ff4a694e66f","TextShadow_X_2":"6d239b96184514d5cce442fb1008841c6feda067","TextShadow_X_3":"d33f3ff09670e335fa31238527bd6bc612f2e4d5","TextShadow_X_4":"0c70c48d5f6748ee6ad35b04697131ec538fe0fb","TextShadow_Y_1":"999f12a3c7a319a54eaebde3898212ae835c71c4","TextShadow_Y_2":"1162f4d156bd727873bcdd05dcd4927c52c75552","TextShadow_Y_3":"dbead97975045671427d2ec861eb00e5251c5a23","TextShadow_Y_4":"d194435564c2c89aa48be1931f343df921d89b70","sapContent_ContrastTextColor":"2a97516c281ab984b0707ce9f6503cae19ff4681","sapContent_ContrastTextShadowColor":"eecc9cc7439f5be7ba9f68b05372600e9e3ed1aa","sapContent_DisabledTextColor":"978f7b1203509e95cff62356d685ec6fbc76057f","sapContent_ForegroundTextColor":"c4c6c5775339bebeb4773d60ea38becaf9506fe1","sapContent_LabelColor":"5ae0b6ed14efc54a6d4b6a58d9a4978ed3754768","sapContent_MarkerTextColor":"ddd3eda71d97ec48770a2f437dbd4420db84671f","sapContent_TextShadowColor":"ec63843cddf3c3d5a3c8bba0c674f7ae6fe1f5b4","sapContent_TextShadowColor_2-4":"721ec6bc4cdfe00f5fda22c2d14c5ced19e6d764","sapTextColor":"ddcb06d470abeacc7195a4bd4908b969ac8bad6c","sapTitleColor":"bd9f5a76eda064e2e8d67d100f7bb30164584627","sapTile_Active_Background":"2a4c3598bfbbe201bdf20d80857f23c910578f67","sapTile_Active_ContentBackground":"71752530ad5874328ca6661fe3c98b16548826e4","sapTile_Background":"f62cb39cc3db4d778050b7dc1b8ea6440b0600eb","sapTile_BorderColor":"688a34122010130302ee5fc273f7775c1b76cd4b","sapTile_BorderCornerRadius":"52269b3d7d0ae94cd44448e9eafe226d36a5e234","sapTile_Hover_Background":"7af7c501f9bcf47ef024317c0d1a04dd42221806","sapTile_Hover_ContentBackground":"597ff31ec967e127ff21fbaeee5787ea8ede8892","sapTile_IconColor":"256ed636e8ca79bb9a45794c35714bdc14004cdb","sapTile_Interactive_BorderColor":"ddd1a290acd6ba8290af6a662c08a757db4cb259","sapTile_OverlayBackground":"e085ac8611634eb1493d0951b4d5cf1c25ec1c98","sapTile_OverlayForegroundColor":"98530a457ac003af44a66dd4121b7c69ebfc3ae6","sapTile_SeparatorColor":"ba00bfa7d1ad5e1acbd64871295bfbaa2196b1d1","sapTile_TextColor":"d3ed22a06048779cfc729399b89444d9061c2a30","sapTile_TitleTextColor":"844ada6a81afc15a59959d4febddf974ea314728","sapInfobar_Active_Background":"42583d7fe219cf18ea91db881ff0ce49781c501e","sapInfobar_Background":"78757f7588e9d72d065e025f9040041d7739f1e3","sapInfobar_Hover_Background":"bad94383f0badb952f5918f7a5f28eb8e4e57bf4","sapInfobar_NonInteractive_Background":"031e7885451cb31830728f31d4112b6062ebd53f","sapInfobar_TextColor":"101817f1233f9c54c3ee6deb1233d71d4b2d63dd","sapToolbar_Background":"3f4ee47ba627559ae088ffa30ad5d1b19977cf80","sapToolbar_SeparatorColor":"4e8656d1c44d98c23f72040b3b5bd964f3e404dc","sapBaseColor":"53977e207776cc051f5bc312eadd9140ab3842cb","sapWarningColor":"2b9aa2b38d0039e1d1119ba2eaa6226383f7e3b3","sapErrorColor":"f80fb25da691a72796a20df06d830d01bb25d2a8","sapErrorBackground":"f87afb0f0bd68badc30f9022a3db1e4788881a7a","sapButton_BorderColor":"2bb33c0108c90f38df37796205f9c25de044863f","sapContent_Selected_ForegroundColor":"35cc8f15a553c16824b64083f51191cd74323574","sapSlider_Selected_Background":"28ebf748b5d0cd3e9064c5a8c1c0ab50d7b41f3b"},"t":{"SmallText/LHAuto/Regular":"3630ff040c7662da157c94f39ca000434866af79","SmallText/LHAuto/Bold":"4635f9147cd7445edfd6c5095e0269a74b31d93d","MediumText/LHAuto/Regular":"a55fdfa6995034dee7c5758e479e7f554c457291","MediumText/LHAuto/Bold":"405de2565edf459a754f1e72823e3f4d7c8cbb3b","MediumText/LHAuto/Semibold":"3553f1189bb16147c10ce434ef5b1a8d653c43d0","LargeText/LHAuto/Regular":"fcd48b218e51130a9fd37d5ac590587c0b86b556","LargeText/LHAuto/Bold":"8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061","LargeText/LHAuto/Semibold":"4445cf9c84f3d09a0f3b769f9ad27c48ff52477d","H6/Regular":"2706d29e211e900ae2831f2e1782aa02233555cd","H6/Bold":"d076995c96c2552ea0c19cd14dcb1834d4c84fe6","H5/Regular":"eafe040ca349722d64228570677c0341f52e8ebf","H5/Bold":"863b2131b6f92b86dc8686f13eea357bb4116db6","H4/Regular":"d0b1f77b2a0568fde04c93e710740a3c6fca111d","H4/Bold":"7263cb9889e84c192d1ebf77a45cfbc8c13ca5d0","H3/Regular":"bd2a177700d59ac26c6166f23c8ff6ffd4ec7b76","H3/Bold":"5d1b2c6e9490b3a52c85a7c6f9fd570afc9255fc","H2/Regular":"a94f193afe0c483d05dc2d297aaaf0f6ff877cee","H2/Bold":"961807887b96e0d73c98a34255ecc988d94294e0","H1/Regular":"8a97738f48f5b42dc9a2f26b652fd559fc5299a7","H1/Bold":"26e7e8b9dd2d907743575a15d50dc4f30c5b4101","Main Header/sapObjectHeader_Title_FontSize":"934edaa27548354de070cea35d64f6a81fbe897e","Title of Components/sapGroup_TitleFontSize":"f8fa671943cf116fa67c767f32d3e05a294eda2c","Button/Emphasized/sapButton_Emphasized_FontWeight":"aa4523ff3fc9a9ca2f6b6e431af776c2910d4ee5","Tab/SmallTabText":"e31b6391a2bb2b5383b5fdc37717543518e093f4","Tab/MediumTabText":"41f7cf8c1d0eefe64655d2e3285fdc6434a4b180"},"i":{"Calendar":"6365647fcb348a4979f65cfdec1bc0de735f4727","List":"e252bd6c8d373895ca1d18d7ba0aa17a3359248c","Menu":"d1b0ae52b7eccede2007395df08f6699527b9805","Settings":"3003ec879ac335662007e3a73639fb3f2bb181b6","Tag":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","accept":"44c041ea1ba7e4fb7af49664054038dfbb136ef3","activate":"f03276bc71193caa97829c4e627330349fa926cd","add":"d6727620b32189e038a3bebbe10ad02b66859f47","attachment":"1d66e134705d423228338a44aa7fa7803fd229fb","bell":"ec29b0acc023373343199ca501f7b4d5a89dd900","calendar":"6365647fcb348a4979f65cfdec1bc0de735f4727","collapse":"f5499dbd43fc40ed8e0ca59efec44e946731f426","complete":"192ed65c61e566eb4b0a51a6cb3d0e819683bc0e","copy":"5e1f1ea1d98637e1fb8a029cf9f072d085dd4066","decline":"80086d2e8969c07e7c885e6ee9244005bfc3864d","delete":"6da9bfb78bb57cc96d015531ac16e201423d8558","document":"47593f4f8e7f752e8bb05c6489c2ce610eb012c6","download":"bb79aa01b7f84d032f21891b43a88eaa7024d7e8","duplicate":"e00e7dd4e0a044f0e50b8b3de008654d74c2f56b","edit":"b346b05bc52f9d648ead280cfbd17baacea391f2","error":"e498c375d64182cd15c40a6544499d26fead88ae","excel-attachment":"85256e974ce0c7329fe98f36a2d32b25683ef660","exit-full-screen":"0d8205430605010f858b71cdc5c76967462f5e05","expand":"27718128e9c71492ee87d6e62e66acdf1dc40d03","favorite":"777c69fdeaa2648545eacf6b329e1aa1e9c54a9d","filter":"4a36aefd3adb9dcfb512d16c39fd498445aed452","flag":"06d4ed866ff161c20b062ad167001b7b96d06af9","folder":"b4138c37ac961f4683a13edb0c9b07aba856e825","full-screen":"8b7f0a993478cced7b0589aef55af29fd773d1e5","globe":"ff1de89f036f7aef09afe2d157fc3bd9206cee7f","grid":"08fc0d537befd77bd9c8fcb72bca88271bdacb72","group":"361026d73858fabff3db3e9bdea5a18681beccc2","home":"ddf4537c2f792179f11f64cae869cd1241e5ec7e","in-progress":"5fd4dff1dfbcddfa3c72d89ef8044e6f6d0f2f5c","information":"a46fdc47795362da045a36eb5e7a320266efd3fe","less":"956413a5409ff97501e8b589518dc28dabab6881","list":"e252bd6c8d373895ca1d18d7ba0aa17a3359248c","menu":"d1b0ae52b7eccede2007395df08f6699527b9805","multi-select":"c431b4ea53e201aa56428ac81bfba9971d2b0341","multiselect-all":"3c33da3d50dd450e78e912c9917f8cf6a5de921f","navigation-down-arrow":"40534f62cdce550850addd3a7dcfa843d3c68e0c","navigation-left-arrow":"7d0b0daf12983834a2a7e851baa1979d4f0bb5ec","navigation-right-arrow":"a27a77b93ec918313801f9983a112e871c1c8066","navigation-up-arrow":"174e2bdd2765be0c1ccb1eeb30cde1c7b1a35577","overflow":"6a0c2f0be4be541cc17870a7a633b19e3cb2d1df","pdf-attachment":"4098a29c1f0fcfe59ba860407457458125f38221","pending":"6afbe3d51f8ce5874572d5a30a89aaf2f5494f16","print":"f86b13dfaa2e9e4fe0eca98fb186c16ed3e3cbd1","question-mark":"70170cac2c7c3c842f40c688a260fcd2b06723b6","refresh":"572b74d0e27df61e1145a637dd8a6945634a3a16","search":"f3837f5ce4099717f6925b3be2bfddabb212baeb","settings":"3003ec879ac335662007e3a73639fb3f2bb181b6","share":"2e68a41e3257e50d7da7d1a35338e293e8c43242","slim-arrow-down":"d206a924630cb08c1b62f4c2ddef383b8142e519","slim-arrow-left":"6727ead97eeafcaf11454bbb2bc826a536917456","slim-arrow-right":"3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d","slim-arrow-up":"f852031802bbe5bebd03387c3c54c58e4367bba0","sort":"8d18dc73bb269e91c1b52ba25c63f2b93f48693e","sort-ascending":"b366220d5ccb011ec48a357a38b853448d79627e","sort-descending":"18cbbdf3dc5d1d29fbd624e562d87b36b9c356ae","sys-cancel":"88da429c0adbb2007ed50360ac0b42861945bffc","sys-enter-2":"a69b0f2584613dc61fbeac927db00f6b576a10eb","sys-help":"5f97e4c30c2c894169078dd8fbda7686fd852160","table-view":"34f6afb184086b152de9f138125ff90c6be40250","upload":"2fa7494c9f95873ede5d0d8df730ff0a247e7dc4","warning":"cc7b1d6291f9f1828ab3c851b33bcc50da64d8c2","suitcase":"aab233a77becbdfc986a734c5451f5b976638855","meal":"52c9186b136b0ff70196b57dd6cf5f0e17e848bf","share-arrow":"f186ab5dabe94fbbf9b8427f9fd41edddf104e2c","share-2":"3e32bfc37d0c6c148ea9919015d02a7acf91d58c","tag":"af4ff91cd6e44b9c54a1560aa2bef561c8d8b0c9","flight":"65ca2deb9dd0c4f7734d2269e7958fbe62b4a462","paper-plane":"1af59a706bee8811d9439901ec3d4f54f118185a","receipt":"28664297b6ba462b297b4487f2fa5884d53a3a08","travel-expense":"00af06f46dafee9ba85ce133c4ce34d449eaee25","travel-itinerary":"303136e86aedf4da03db63f869e9a9262c9a89d7","pushpin-on":"a103a0ee9c45c6b54d5f799e82b1842236f2c79e","direction-arrows":"d8df6bd3e7657212a65f733f39878d4e0a37cc2e","media-forward":"b200c671f28c62c7e4ead976aa02b5875f77d5fa","thumb-up":"5302ae09353d82f5221906eb454886085d60b9c3","inbox":"9ddc5a9cd14cd52a3cfc7a86b041303ff9aca96e","bar-chart":"2c24c77886a783a4f95986436419ba2b331611a8","user-settings":"dd2dfca44f388923176e6ac85731ee96fcd8c570","history":"02fb2cf833be737a93b92e670159c09f6562bd4b","map":"142bea39000b39f3f14b9f9ea34cac9bcb8f4da5","picture":"ba4d9c2dc6ac8ae7068f73fd0275c27c7e1da16b","discussion":"b3b8fc4eccad2d1605aa51935e8e0f813f539bc0","appointment-2":"59c77280f7ba5dd27c9be54197f4a3c1a6089084","table-column":"2a5fe3d3226a52e6487e5ae9ddc9243c7b98000a","da-2":"21a4718c212b7e95d6eb148e713b166bf293f429","da":"ec91cd8cffe34196832a9c98f6b1b67daafa53df","down":"492d6984967c9fc11f324539a4c104a45aaae643","light-mode":"386a631748671bd2d67980283c192324893e1edb","dark-mode":"2860e4ba75f7e4c01c9736fc4217587bc6d932a1","microphone":"51e04da7cb207eef304ad796b0094135b266eae6","weather-proofing":"41e042279edb356ba15a499a2284f613cec0e438","ai":"90f321fb2e05adcd1322d1b98872293ae2f06882"},"d":{"Avatar Badge":{"Size":"V:XL and Bigger|XL and Bigger,L,M and Smaller","Value State":"V:None|None,Positive,Critical,Negative,Information","Color":"V:None|Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,None"},"Avatar Group":{"Overflow Button#100499:0":"B:false","Type":"V:Group|Group,Individual","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Size":"V:XL|XS,S,M,L,XL"},"Avatar":{"Badge#98694:0":"B:false","Optional Border#98694:211":"B:false","Person Icon#112262:148":"I:15f9f2047731a76b001f89d9362236e158402db3 person-placeholder","Object Icon#114257:7":"I:6b2655212b50d8dbf5d9ace87a1c7186942a28d5 product","✏️ Initials#143938:0":"T:SD","Type":"V:Image|Image,Icon,Initials","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Content":"V:Person|Person,Object","Size":"V:XL|XS,S,M,L,XL","Color":"V:Image|Image,1,2,3,4,5,6,7,8,9,10,Transparent,Tile,Placeholder"},"Footer":{"2nd Action#146241:0":"B:true","3rd Action#146241:5":"B:false","4th Action#146241:10":"B:false","1st Action#337405:0":"B:true","⿻ Actions Compact#427958:0":"S","⿻ Actions Cozy#427958:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Footer|Footer,Floating Footer"},"Header":{"Action#182392:0":"B:false","Subheader#184355:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Title|Title,Title with back button,Error,Warning,Success,Information,Confirmation"},"Breadcrumb":{"7th Child Item#153806:6":"B:false","3rd Child Item#153806:7":"B:false","5th Child Item#153806:8":"B:false","4th Child Item#153806:10":"B:false","6th Child Item#153806:11":"B:false","2nd Child item#153806:12":"B:false","1st Child Item#153814:0":"B:true","✏️ Current Item#153814:3":"T:Current item","⿻ Breadcrumbs#425845:0":"S","Overflow":"V:False|False,True","Popover":"V:False|False,True"},"Busy Indicator Dot":{"Size":"V:XXS|XXS,XS,S,M,L,XL,XXL"},"Busy Indicator":{"Text#146239:0":"B:false","✏️ Text Value#146239:4":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"},"Animated Busy Indicator":{"Text#397886:0":"B:false","✏️ Text Value#397886:8":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"},"Button Badge":{"✏️ Number#473631:0":"T:72","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Counter Badge|Attention Badge,Counter Badge"},"Segmented Button":{"3rd Button#167915:5":"B:true","4th Button#167915:10":"B:true","5th Button#167915:15":"B:false","⿻ Text Segments Compact#425845:10":"S","⿻ Icon Segments Compact#425845:15":"S","⿻ Icon Segments Cozy#427418:0":"S","⿻ Text Segments Cozy#427418:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Text,Icon"},"Segmented Button Singular":{"Icon#112262:123":"I:396436a4e244a78ea435d973b9ff1512652d46c5 heating-cooling","Icon Left#114173:291":"B:false","✏️ Text#145508:644":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Icon,Text","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True"},"Icon Split Button":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Split Button":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Icon Menu Button":{"Icon#112262:49":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Menu Button":{"Icon Left#112572:0":"B:false","Icon#112572:97":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:546":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Icon Button":{"Attention Badge#112533:390":"B:false","Icon#112533:584":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"},"Button":{"Icon Left#112533:293":"B:false","Icon#112533:487":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:461":"T:Button","Attention Badge#269292:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"},"Legend":{},"Mixed Calendar Button":{"✏️ 1st Line#379904:24":"T:Rabi’ I","✏️ 2nd Line#379904:36":"T:Sep - Oct","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|True,False"},"Calendar Date Types":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled","Day":"V:Work Day|Work Day,Non-Working Day,Week Day,Week Number,Adjacent Month's Day","Today":"V:False|False,True","Selected":"V:False|False,True","Range":"V:False|False,True","Accent":"V:False|False,True","Mixed Calendar Date":"V:False|False,True"},"Legend Item":{"Text#242137:0":"T:Day","Day Type":"V:Today|Today,Selected,Work Day,Non-Work Day,Special Day 1,Special Day 2,Special Day 3,Special Day 4,Special Day 5,Special Day 6,Special Day 7,Special Day 8,Special Day 9,Special Day 10,Special Day 11,Special Day 12,Special Day 13,Special Day 14,Special Day 15,Special Day 16,Special Day 17,Special Day 18,Special Day 19,Special Day 20"},"Two-Month Calendar":{"Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Layout":"V:Horizontal|Horizontal,Vertical"},"Calendar":{"Week Numbers#379380:0":"B:true","Week Header#477740:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Mixed Calendar":"V:False|False,True"},"Banner":{"✏️ Title#221827:0":"T:This is your banner title","✏️ Text#221827:3":"T:Here you can insert any additional information that may be relevant to the context. This section serves as a placeholder for content that can provide more in-depth explanations, supplementary data, or any other pertinent details that the reader might need.","Type":"V:Text Block with Image|Text Block with Image,Text Container on Image,Text on Colorful Background"},"Card Timestamp and Counter":{"✏️ Timestamp Text#320283:0":"T:2hrs ago","Icon Button#320283:1":"B:true","✏️ Counter Text#320306:3":"T:6 of 12","Type":"V:Timestamp|Counter,Timestamp"},"Card Badge":{"Text#229927:2":"B:true","✏️ Text#229927:3":"T:New","With Icon#229927:4":"B:false","Icon#232335:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","Color":"V:Default|Default,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"},"Card Footer":{"3rd Action#207890:15":"B:false","2nd Action#207890:17":"B:false","Form Factor":"V:Compact|Compact,Cozy"},"Card Numeric Header":{"2nd Indicator#208598:2":"B:true","Label#208598:3":"B:true","Micro Chart#241442:0":"B:false","1st Indicator#304002:0":"B:true"},"Card Extended Header":{"2nd Tag#207847:2":"B:false","Rating Indicator#207847:6":"B:true","Link#207847:8":"B:true","3rd Tag#207847:10":"B:false","2nd Row#209363:9":"B:true","3rd Row#300122:0":"B:false","1st Row#302504:0":"B:true","1st Tag#307702:3":"B:true","Timestamp#332737:0":"B:true","⿻  3rd Row#422655:9":"S","Form Factor":"V:Compact|Compact,Cozy"},"Card Main Header":{"Avatar#103789:0":"B:true","Subtitle#103789:4":"B:true","Counter#103789:8":"B:true","Action#208598:5":"B:false","Trailing Area#209363:4":"B:true","✏️ Title#218182:0":"T:Alain Chevalier","✏️ Subtitle#218182:5":"T:Sales Executive","Timestamp#307080:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active"},"Card Media Block":{"✏️ Text#209363:0":"T:Incoming \nApplications","Type":"V:Image|Image,Image with Padding,Title"},"Card":{"Slot#114257:0":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Extended Header#205668:9":"B:false","Numeric Header#205668:16":"B:false","Content#205668:23":"B:true","Footer#205668:30":"B:false","Media Block#207890:18":"B:false","1st Badge#208835:6":"B:false","Main Header#210374:0":"B:true","2nd Badge#229944:5":"B:false","Content/Footer Space#319730:0":"B:true","Header#322738:0":"B:true","⿻  Content#422655:0":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover","▶️ Interactive Header":"V:False|True,False"},"Page Indicator Dots":{"Selected":"V:True|True,False"},"On Content Page Indicator":{"✏️  Text#236170:0":"T:1 of 9","Type":"V:Dots|Dots,Numbers,Hidden"},"Page Indicator":{"✏️  Text#236170:4":"T:1 of 9","Type":"V:Dots|Dots,Numbers"},"Carousel":{"Multiple Items#355313:0":"B:false","Indicator Bar#360874:0":"B:true","Indicator Buttons#360874:7":"B:true","⿻  Multiple Items#422655:12":"S","Indicator Position":"V:Bottom|Bottom,Top","Buttons Position":"V:On Bar|On Bar,On Image","On Content":"V:False|False,True"},"Check Box":{"Label#125545:8":"B:false","✏️ Text#154638:49":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only,Display Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Check":"V:Unchecked|Unchecked,Checked,Tristate"},"Swatch":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover / Pressed / Selected","Color":"V:Gold|Gold,Light Coral,Deep Pink,Medium Violet Red,Medium Slate Blue,Cornflower Blue,Light Sea Green,Olive Drab,Royal Blue,Light Cyan,White,Light Gray,Dark Gray,Dim Gray,Black,Transparent"},"Color Palette":{"Form Factor":"V:Compact|Compact,Cozy"},"Color Picker Color Mode Panel":{"Color Mode":"V:HSLA|HSLA,RGB","Form Factor":"V:Compact|Compact,Cozy"},"Color Picker Comparison Color Fields":{"Opacity 100%#313616:6":"B:true","Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red"},"Color Picker Slider":{"Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red","Percentage":"V:30%|30%,100%"},"Color Picker":{"Default Mode#315367:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Gradient Field":"V:Blue Hue|Blue Hue,Red Hue"},"Date (Range) Picker":{"Calendar#165202:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Type":"V:One-Month|One-Month,Two-Month","Orientation":"V:N/A|N/A,Horizontal,Vertical"},"Date Time Dropdown":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Date and Time|Date and Time,Date,Time"},"Date Time Picker":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|False,True"},"Dialog Block Layer":{},"Dialog":{"Slot#114549:3":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Resize Handle#153790:0":"B:false","⿻  Content#422655:19":"S","Form Factor":"V:Compact|Compact,Cozy","Scrollable Content":"V:False|False,True"},"Drop-Down Value Message Item":{"Type":"V:Negative|Negative,Critical,Positive,Information"},"Drop-Down Item":{"Check Box#181512:0":"B:false","✏️ 1st Column#181512:279":"T:Option text","✏️ 2nd Column#181512:293":"T:2nd Column","Separator#181522:307":"B:false","Show 2nd Column#181557:321":"B:false","Delete Button#212713:0":"B:false","⿻ Content Compact#471778:195":"S","⿻ Content Cozy#471778:223":"S","Form Factor":"V:Compact|Cozy,Compact,N/A","Type":"V:Single Line|Single Line,Group Header","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"Drop-Down Base":{"Show Value Message#190333:0":"B:false","⿻ Drop-Down Items Compact#427954:7":"S","⿻ Drop-Down Items Cozy#427954:10":"S","Form Factor":"V:Compact|Compact,Cozy"},"Drop-Down":{"Form Factor":"V:Compact|Compact,Cozy"},"Expand / Collapse and Pin Buttons":{"Header Behaviour":"V:Expanded|Collapsed,Expanded","Pin Button":"V:True|True,False"},"Dynamic Page Header":{"Expand and Pin Buttons#416566:0":"B:true","⿻ Content#416566:6":"S","⿻ Header Area#416566:9":"S","Header Shadow#416566:18":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:XL and XXL|S,M,L,XL and XXL","Interaction State":"V:Regular|Regular,Hover","Collapsed":"V:False|True,False"},"File Uploader":{"Form Factor":"V:Compact|Compact,Cozy","Text":"V:Placeholder|Placeholder,Uploaded File"},"Form Item":{"✏️ Form Header Text#237212:0":"T:Form Header","✏️ Group Header Text#237212:24":"T:Group Header","Required Label#466778:0":"B:false","Type":"V:Input|Input,Tokenizer,Text Area,Check Box,Group Header,Form Header","Form Factor":"V:Compact|Compact,Cozy,N/A","Mode":"V:Edit Mode|Edit Mode,Display Mode,N/A","Orientation":"V:4:8 Horizontal|4:8 Horizontal,4:7:1 Horizontal,Vertical,N/A","Two Input Controls":"V:No|No,Yes"},"Form":{"Type":"V:4:8 Horizontal with groups|4:8 Horizontal with groups,4:7:1 Horizontal,Vertical with groups,Vertical","Form Factor":"V:Compact|Compact,Cozy","Display Mode":"V:False|False,True"},"Homepage Hero Banner":{"⿻ Action Area#440899:0":"S","⿻ Content Area#440899:2":"S","✏️ Date#441217:0":"T:Thursday, November 5, 2025","✏️ Salutation#441217:2":"T:Hello, Henry","Action Area#441217:4":"B:false","Content Area#441217:7":"B:false","Size":"V:XL Full-width|XS,S,M,L,XL Letterbox,XL Full-width","Form Factor":"V:Compact|Compact,Cozy","Variation":"V:False|True,False"},"Illustrated Message":{"✏️ Title#99555:0":"T:Let's get some results","✏️ Description#99555:17":"T:Start by providing your search criteria.","Illustration L#129986:0":"I:3e6dd1ef07f30539422119902a38147c87f9622a Before Search/Size=L","Illustration M#129986:9":"I:cc40cf665805bb22b83e74f3161d0c6e48ff9655 Before Search/Size=M","Illustration S#129986:18":"I:9acff3f046e634485e3808e62d418f7194eec8ef Before Search/Size=S","Illustration XS#129986:27":"I:8c85d2c6d6c767092f209374a0471abc6a21b44e Before Search/Size=XS","3rd Button#177911:52":"B:false","2nd Button#177911:61":"B:false","1st Button#177911:79":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:Large (L)|Extra Small (XS),Small (S),Medium (M),Large (L)"},"Input Button":{"Icon#148177:0":"I:80086d2e8969c07e7c885e6ee9244005bfc3864d decline","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information"},"Input Message Popover":{"✏️ Text#148609:0":"T:Message text giving further context.","Value State":"V:Negative|Negative,Critical,Positive,Information"},"Input":{"Trailing Action#144344:0":"B:false","2nd Action#144344:3":"B:false","✏️ Placeholder#145437:156":"T:Placeholder","✏️ Typed Text#145437:221":"T:Typed Text","Message Popover#154602:0":"B:false","Description Text#267637:0":"B:false","✏️ Description Text#267656:0":"T:Description Text","⿻ Content Compact#471773:0":"S","⿻ Content Cozy#471778:130":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Read Only,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information","Content":"V:Placeholder|Placeholder,Typed Text"},"Label":{"Required#104646:0":"B:false","✏️ Label#237212:48":"T:Label:","Type":"V:Regular|Regular"},"Link":{"✏️ Text#142188:0":"T:Link","Icon#283747:121":"I:e58e7884f9b11181af59a8bb7cd4c2106d5327e9 inspect","Type":"V:Icon Link|Regular,Emphasized,Subtle,Icon Link","Interaction State":"V:Regular|Regular,Hover,Visited,Down,Disabled","Icon Position":"V:Right|Right,Left,N/A"},"Selector":{"Form Factor":"V:Compact|Compact,Cozy","Selector Type":"V:Check Box|Check Box,Radio Button","Selected":"V:Unselected|Selected,Tristate,Unselected"},"List Attachment":{"Text#155542:4":"T:Attachment","Type":"V:Attachment|Attachment,Object Status"},"List Thumbnail":{"Icon#155542:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Thumbnail":"V:Avatar|Avatar,Icon"},"List Item":{"Separator#123475:0":"B:true","Icon / Selector#147034:0":"B:false","Navigation Indicator#147034:36":"B:false","Leading Icon#147034:54":"B:true","Selector#147034:72":"B:false","Item Counter#147034:108":"B:false","Trailing Icon#147034:144":"B:false","Leading Icon Swap#152431:18":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","2nd Button#152451:36":"B:false","✏️ Counter Value#152451:54":"T:12345","1st Button#152462:72":"B:false","✏️ Text#152462:90":"T:List Item","✏️ Byline#152704:108":"T:Byline","Attachment#152767:146":"B:true","Thumbnail#152767:165":"B:false","✏️ Group Name#152767:195":"T:Group Header","✏️ Footer Text#152767:225":"T:List Footer","Trailing Icon Swap#155542:7":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Object Status#155958:0":"B:false","✏️ Growing Text#155999:31":"T:More","⿻ Content#415971:0":"S","Content Container#415971:27":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Single Line|List Header,Group Header,Single Line,Byline,Growing List Item,Footer","Interaction State":"V:Regular|Regular,Hover,Down,N/A","Selected":"V:False|True,False"},"List":{"⿻ List Items Compact#427968:0":"S","⿻ List Items Cozy#427968:3":"S","Form Factor":"V:Compact|Compact,Cozy"},"Trailing Container":{"✏️ Shortcut#161491:0":"T:Ctrl+3","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Arrow|Shortcut,Arrow,Checkmark"},"Menu List Item":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:false","Trailing Space#147034:144":"B:false","✏️ Text#152462:90":"T:Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"Menu":{"⿻ Menu List Items Cozy#427954:13":"S","⿻ Menu List Items Compact#427954:16":"S","Form Factor":"V:Compact|Compact,Cozy"},"Message Strip Icon Button":{"Interaction  State":"V:Regular|Regular,Hover,Down","Type":"V:Indication 1 to 10|Indication 1 to 10,Indication 1b to 10b"},"Message Strip":{"Close Button#102938:0":"B:true","Value State":"V:Information|Information,Positive,Critical,Negative,Indication Color","Icon":"V:True|True,False","Color":"V:None|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"},"Multi Combobox":{"\"Show all\" Footer#212884:27":"B:false","Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|True,False"},"Multi Input":{"Drop-Down#209617:14":"B:false","\"Show all\" Footer#212884:17":"B:false","Form Factor":"V:Compact|Compact,Cozy","Display Only":"V:False|False,True"},"Notifications Status Indicator":{"Type":"V:Positive|Positive,Negative,Critical,Information,Neutral"},"Notification List Item":{"Status Indicator#274252:3":"B:false","More#274252:6":"B:true","Importance Tag#274252:14":"B:false","Description#274252:17":"B:true","✏️ Title#274309:0":"T:Notification Title","✏️ Description#274309:5":"T:Description of notification topic","✏️ Group Name#276270:0":"T:Today","Arrow#288437:14":"I:d206a924630cb08c1b62f4c2ddef383b8142e519 slim-arrow-down","Form Factor":"V:Compact|N/A,Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Type":"V:Notification List Item|Group Header,Notification List Item","Read":"V:False|False,True"},"Notification Banner":{"2nd List Item#274329:0":"B:true","3rd List Item#274329:3":"B:false","4th List Item#274329:6":"B:false","5th List Item#274329:9":"B:false","6th List Item#274329:12":"B:false","7th List Item#274329:15":"B:false","8th List Item#274329:18":"B:false","9th List Item#274329:21":"B:false","10th List Item#274329:24":"B:false","⿻ Content#415687:0":"S","Size":"V:S|S,M / L"},"Notifications Growing Item":{"Interaction State":"V:Regular|Regular,Hover,Down","Busy Indicator":"V:False|True,False"},"Notifications":{"Message Strip#274252:26":"B:false","1st Growing Notifications#274252:29":"B:false","2nd Growing Notifications#413974:0":"B:false","Toolbar Sorting#414088:0":"B:false","⿻ Content#414766:10":"S","Size":"V:S|S,M / L","Scrollbar":"V:False|False,True"},"Object Attribute":{"Type":"V:Regular|Regular,Active"},"Object Identifier":{"Hover":"V:No|No,Yes","Link":"V:No|No,Yes","Emphasis":"V:No|No,Yes"},"Object Number":{"Type":"V:Regular|Regular,Emphasized,Large,Inverted","Semantic":"V:Error|None,Information,Success,Warning,Error"},"Object Status":{"Semantic":"V:Information|None,Information,Success,Warning,Error","Inverted":"V:No|No,Yes","Large Design":"V:No|No,Yes"},"Panel":{"Slot#114200:7":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","✏️ Title#145524:0":"T:Panel Title","4th Action#146223:7":"B:false","3rd Action#146223:14":"B:false","2nd Action#146223:21":"B:false","1st Action#146223:28":"B:false","⿻  Content#422655:24":"S","Form Factor":"V:Compact|Compact,Cozy","Fixed":"V:False|False,True","Collapsed":"V:False|False,True"},"Popover":{"Header#153771:0":"B:false","Footer#153771:14":"B:false","Resize Handle#230738:94":"B:false","⿻ Content#422659:91":"S","Scrollbar#460647:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Arrow":"V:False|False,True","Arrow Position":"V:None|None,↖ Top Left,↑ Top Center,↗ Top Right,↗ Right Top,→ Right Center,↘ Right Bottom,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,↙ Left Bottom,← Left Center,↖ Left Top","Resize Handle Position":"V:↖ Top Left|↖ Top Left,↗ Top Right,↘ Bottom Right,↙ Bottom Left"},"Product Icon":{"Icon#458135:0":"I:bcda1a5cba51eed5db5c05ffc5c429660ff80899 bus-public-transport","Type":"V:Product Switch Icon|Product Switch Icon,Icon","Size":"V:Large|Small,Large"},"Product Switch Element":{"✏️ Title#452468:0":"T:Title","✏️ Subtitle#452468:11":"T:Subtitle","Size":"V:Large|Small,Large","Interaction State":"V:Regular|Regular,Hover,Pressed,Selected,Selected Hover"},"Product Switch":{"⿻ Large Elements#454469:10":"S","⿻ Small Elements#454469:15":"S","Size":"V:Large|Small,Large","Scrollbar":"V:False|True,False"},"Progress Indicator":{"Text#103111:0":"B:true","✏️ Text Value#141830:0":"T:60%","✏️ Progress Bar#142242:0":"T:write/delete to move the progress value","Value State":"V:None|None,Information,Positive,Critical,Negative","Interaction State":"V:Regular|Disabled,Regular"},"Radio Button":{"Label#125545:8":"B:false","✏️ Text#154638:0":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Selected":"V:False|False,True"},"Rating Indicator Single":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Hover,Read-Only,Regular","Selected":"V:False|False,True"},"Rating Indicator":{"Label#104633:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Read Only,Disabled"},"Scrollbar":{"Interaction State":"V:Regular|Regular,Hover"},"Select":{"Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|False,True"},"Settings":{"Resize Handle#289298:0":"B:false","List Scrollbar#292448:0":"B:false","Content Scrollbar#292448:3":"B:false","⿻ Content#422659:22":"S","Unique Identifier#480620:11":"B:false","1st User Details#480620:22":"B:false","2nd User Details#480620:33":"B:false","Manage Account Button#480620:44":"B:false","⿻ Additional Settings#480620:55":"S","Add Additional Settings#480620:66":"B:false","Region#480711:77":"B:true","Date Format#480711:88":"B:true","Time Format#480711:99":"B:true","Time Zone#480711:110":"B:true","Currency#480711:121":"B:true","Number Format#480711:132":"B:true","Add Content#481377:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Default|Default,User Account,Appearance,Language and Region,Notifications"},"Shell Search Selector":{"✏️ Text#415778:0":"T:All","Interaction State":"V:Regular|Regular,Hover,Hover on Icon,Active","Advanced Filtering":"V:False|True,False"},"Shell Search Button":{"Interaction State":"V:Regular|Regular,Hover,Active,While Typing"},"Shell Search":{"Interaction State":"V:Regular|Regular,Hover,Active,Searched,While Typing","Expanded":"V:True|False,True","Selector":"V:False|False,True"},"Branding Button":{"Product Identifier#285341:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Active"},"Shell Button":{"Interaction State":"V:Regular|Regular,Hover,Active,Toggled"},"Shell Bar":{"Back Button#104186:9":"B:false","1st Extra Action#230178:0":"B:false","2nd Extra Action#230178:12":"B:false","Extra Right Area#285220:3":"B:false","Extra Left Area#285220:9":"B:false","Joule#285220:15":"B:false","Feedback#285220:21":"B:false","Product Switch#285220:27":"B:false","Overflow#285285:0":"B:true","Notification#285285:11":"B:true","Help#285285:22":"B:true","Walk me#285750:0":"B:false","Support#285750:11":"B:false","Shell Search#328265:0":"B:true","⿻   Extra Left Area#422659:0":"S","⿻ Extra Right Area#422659:11":"S","Size":"V:XL|S,M,L,XL,XXL","Hamburger":"V:False|False,True"},"Navigation Item":{"Navigation Indicator / External Link#283218:12":"B:true","Navigation Indicator / External Link Icon#283293:50":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Two Click-Area#283293:112":"B:false","✏️ Text#283293:137":"T:Nav Item","Icon#328810:0":"I:ddf4537c2f792179f11f64cae869cd1241e5ec7e home","External Link#406893:0":"B:false","Tag#469827:7":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Navigation Item|Navigation Item,Child Item,Navigation Group,Quick Create","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Pressed Hover,Pressed Active","Selected":"V:False|True,False","Expanded":"V:False|True,False","Long Tag":"V:False|False,True"},"Side Navigation":{"Scrollbar#283293:201":"B:false","Arrow#325625:0":"B:true","⿻ Navigation Items#415662:0":"S","⿻ Footer#415679:7":"S","⿻ Navigation Items Collapsed#415950:0":"S","⿻ Footer Collapsed#415950:7":"S","Search#469823:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Collapsed|Collapsed,Expanded,Floating"},"Tooltip and Input":{"✏️ Value#237327:1":"T:65","Tooltip / Input":"V:Tooltip|Tooltip,Input","Form Factor":"V:Compact|Compact,Cozy"},"Range Slider Handle":{"Tooltip / Input#104968:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"},"Range Slider":{"Tick Marks#104968:7":"B:false","Labels#299312:21":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Disabled,Regular","Left Value":"V:0%|0%,25%,50%,75%","Right Value":"V:25%|25%,50%,75%,100%"},"Slider Handle":{"Tooltip / Input#104968:30":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"},"Slider":{"Tick Marks#104968:25":"B:false","Labels#299312:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Disabled","Value":"V:0%|0%,25%,50%,75%,100%"},"Step Input":{"✏️ Value#148178:0":"T:50","Message Popover#154602:65":"B:false","✏️ Description Text#469803:0":"T:Description Text","Description Text#469803:35":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|None,Negative,Critical,Positive,Information"},"Switch":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Non-Semantic|Non-Semantic,Semantic","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Checked":"V:True|True,False"},"Icon Tab Bar":{"Overflow#103133:0":"B:true","⿻ Tabs Inline, Non Semantic#425676:0":"S","⿻ Tabs Inline, Semantic#426727:0":"S","⿻ Tabs Shell Navigation, Non Semantic#426727:46":"S","⿻ Tabs Icon Only, Non Semantic, Compact#426736:0":"S","⿻ Tabs Icon Only, Semantic, Compact#426736:46":"S","⿻ Tabs Process, Non Semantic, Compact#426762:92":"S","⿻ Tabs Process, Semantic, Compact#426762:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Compact#426762:184":"S","⿻ Tabs Filter Tabs, Semantic, Compact#426762:230":"S","⿻ Tabs Icon Only, Non Semantic, Cozy#426848:0":"S","⿻ Tabs Icon Only, Semantic, Cozy#426848:46":"S","⿻ Tabs Process, Non Semantic, Cozy#426848:92":"S","⿻ Tabs Process, Semantic, Cozy#426848:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Cozy#426848:184":"S","⿻ Tabs Filter Tabs, Semantic, Cozy#426848:230":"S","Form Factor":"V:N/A|Cozy,Compact,N/A","Type":"V:Inline Mode|Inline Mode,Icon Only,Process Tabs,Shell Navigation,Filter Tabs","Semantic":"V:No|No,Yes","Size":"V:S|S,M and L,XL"},"Tab Bar Overflow":{"Type":"V:'More' Text|'More' Text,Count","Interaction State":"V:Regular|Regular,Hover,Down"},"Tab":{"Badge#101559:0":"B:false","Item Count#101799:0":"B:false","Menu Arrow#101979:0":"B:true","Icon#112262:750":"I:361026d73858fabff3db3e9bdea5a18681beccc2 group","✏️ Text#183920:0":"T:Tab Text","✏️ Additional Text#183920:77":"T:53 of 123","✏️ Counter#183920:154":"T:123","✏️ Label#183920:231":"T:Products","Item Count Text#183920:308":"T:3","Separator#183922:0":"B:false","Arrow#183922:77":"B:false","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Inline|Inline,Icon Only,Shell Navigation,Process and Filter,Filter Total","Interaction State":"V:Regular Active|Regular Active,Regular Inactive,Hover on Arrow (Active),Hover (Inactive),Hover on Text (Inactive),Hover on Arrow (Inactive)","Value State":"V:Non Semantic|Non Semantic,None,Positive,Critical,Negative"},"Table Highlight":{"Value State":"V:Information|Information,Error,Warning,Success,None"},"Table Cell":{"1st Column#188248:0":"B:false","✏️ Text#190298:0":"T:Text","Button Type – Compact#190298:59":"I:f6246d2947c0a3cc1560cc40ce9ed6bd789d8416 Icon Button/Form Factor=Compact, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Compact#191065:0":"I:4ccc8a9d82c4094267a43b82c45c4b4564dbced3 Input/Form Factor=Compact, Interaction State=Regular, Value State=None, Content=Placeholder","✏️ Currency#191125:0":"T:EUR","Button Type – Cozy#192997:0":"I:00a3434ed7a0e9830ce0eeae8aac9bafed7b00b2 Icon Button/Form Factor=Cozy, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Cozy#192997:175":"I:7c27077d7736b75f9d0724e3fb4512bda7bd46f0 Input/Form Factor=Cozy, Interaction State=Regular, Value State=None, Content=Placeholder","Icon#200078:0":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","✏️ By Text Description#239124:0":"T:Description","Collapse / Expand#242161:0":"B:false","⿻ Content Compact#471778:237":"S","⿻ Content Cozy#471778:463":"S","Form Factor":"V:Compact|Compact,Cozy","Hierarchy":"V:Cell|Cell,Column Header,Group Header","Type":"V:Text|Text,Check Box,Icon,Link,Tag,Button,Input,Currency,Rating Indicator,Highlight,Object Identifier - Bold,Object Identifier - Link,Empty","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Alignment":"V:Left|Left,Right"},"Table":{"Highlight#200542:0":"B:false","⿻ Columns Compact#426001:0":"S","⿻ Rows Compact#426001:5":"S","⿻ Columns Cozy#426001:10":"S","⿻ Rows Cozy#426001:15":"S","Form Factor":"V:Compact|Compact,Cozy","Structure":"V:Columns|Columns,Rows"},"Tag":{"Left Icon#188702:0":"B:false","Icon#189116:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","⿻ Content#473512:0":"S","✏️ Text#474619:0":"T:Tag","Interaction State":"V:Regular|Regular,Hover,Down","Value State":"V:Information|Information,Positive,Critical,Negative,None,Indication Colors","Color":"V:Semantic|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b,Semantic","Large Design":"V:No|No,Yes","Icon Only":"V:False|False,True"},"Text":{"✏️ Text#223176:0":"T:Lorem ipsum","Selected":"V:False|True,False"},"Text Area":{"Scroll Bar#147859:1":"B:false","✏️ Placeholder#147861:0":"T:Write your message here.","✏️ Typed Text#147861:3":"T:Typed text","Counter#165575:0":"B:false","Message Popover#165575:1":"B:false","✏️ Counter Text#165575:2":"T:180 characters left","✏️ Text#165588:0":"T:180 characters left","Form Factor":"V:Compact|Compact,Cozy","Content":"V:Placeholder|Placeholder,Typed Text","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|Negative,Information,Positive,Critical,None"},"Tick Mark":{"Selected#193792:0":"B:false","Size":"V:Large|Large,Small"},"Number Selector":{"✏️ Number#195120:2":"T:3","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected"},"Clock-face":{"Form Factor":"V:Compact|Cozy,Compact","Type":"V:12 hours|12 hours,24 hours,Minutes,Seconds"},"Hours and Minutes Output":{"Seconds#194107:0":"B:false","AM/PM 12 hours view#194107:3":"B:true","Current Time#194199:6":"B:false","Form Factor":"V:Compact|Compact,Cozy"},"Time Dropdown":{"Form Factor":"V:Compact|Compact,Cozy"},"Time Picker":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|True,False"},"Toast":{"✏️ Text#142680:0":"T:2 sales orders were deleted.","Type":"V:Regular|Regular"},"Tooltip":{"✏️ Text#466725:9":"T:Save (Ctrl+S)","Arrow Position":"V:↑ Top Center|↑ Top Center,↗ Top Right,→ Right Center,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,← Left Center,↖ Top Left"},"Tree Item Base":{"✏️ Text#182211:63":"T:Level","Icon#184583:159":"I:40534f62cdce550850addd3a7dcfa843d3c68e0c navigation-down-arrow","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Selected":"V:False|False,True","Level 1":"V:True|False,True","Last Child":"V:False|False,True"},"Tree Item":{"Level 10#186218:93":"B:true","Level 9#186218:124":"B:true","Level 8#186218:155":"B:true","Level 5#186218:186":"B:true","Level 6#186218:217":"B:true","Form Factor":"V:Compact|Compact,Cozy","Levels":"V:1|1,2,3,4-6,7+","Selection":"V:None|None,Independent,Dependent"},"Tree":{"⿻ Tree Items Compact#425685:3":"S","⿻ Tree Items Cozy#427338:0":"S","Form Factor":"V:Compact|Compact,Cozy"},"Token":{"✏️ Text#154228:0":"T:Token","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected,Selected Hover,Read Only"},"Overflow Link and Typing ":{"✏️ Typed Text#202050:14":"T:Typing","Type":"V:Overflow Link|Overflow Link,Typing"},"Tokenizer":{"Overflow Link / Typing#202017:10":"B:false","Overflow Link#202050:3":"B:false","⿻ Tokens Compact#425873:0":"S","⿻ Tokens Cozy#425873:7":"S","⿻ Tokens Multiline Compact#425882:0":"S","⿻ Tokens Multiline Cozy#425882:7":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Single Line|Single Line,Multiline","Input":"V:False|False,True"},"Toolbar Items":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Separator|Separator,Spacer (set to fill)"},"Toolbar":{"Title#186167:0":"B:false","3rd Action#186464:3":"B:true","1st Action#186482:6":"B:true","2nd Action#186482:9":"B:true","✏️ Title Text#186490:0":"T:Toolbar Title","Input#186514:12":"B:false","Segmented Button#186514:15":"B:false","4th Action#186601:9":"B:false","5th Action#186601:18":"B:false","6th Action#186601:21":"B:false","7th Action#186601:24":"B:false","8th Action#186601:27":"B:false","9th Action#186601:30":"B:false","10th Action#186601:33":"B:false","11th Action#186601:36":"B:false","12th Action#186601:39":"B:false","13th Action#186601:42":"B:false","⿻ Actions Compact#425685:6":"S","⿻ Left Area#425685:12":"S","⿻ Actions Cozy#427338:3":"S","Form Factor":"V:Compact|Compact,Cozy"},"Tool Header":{"Form Factor":"V:Compact|Compact,Cozy"},"Header Content Area":{"⿻ Content#454728:0":"S"},"User Menu Custom Menu List Item":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:true","Trailing Space#147034:144":"B:true","✏️ Menu List Item#152462:90":"T:User Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Sub-menu Item#451233:0":"B:true","✏️ Sub-menu Item#451233:7":"T:Sub-menu Item","Sub-menu#452355:0":"B:false","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"User Menu Custom List Item":{"✏️ 2nd Subline#285480:1":"T:Second Subline","✏️ 1st Subline#285480:2":"T:First Subline","✏️ User Name#285480:3":"T:User Name","Separator#285480:4":"B:true","Active User#285480:6":"B:true","Avatar#285835:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|True,False"},"User Menu Custom List ":{"⿻ User Menu Custom List Items#427954:6":"S"},"User Menu":{"✏️ User Name#282907:0":"T:Alex Morgan","✏️ 1st Subline#282907:3":"T:alex.morgan@example.com","✏️ 2nd Subline#282907:6":"T:Delivery Manager","Action Button#330471:0":"B:true","✏️ 3rd Subline#422064:0":"T:Primary Employment","⿻ Custom Menu List Items Cozy#427954:0":"S","⿻ Custom Menu List Items Compact#427954:3":"S","Form Factor":"V:Compact|Compact,Cozy","Header Content Area":"V:False|True,False"},"AI Split Menu Button":{},"AI Menu Button":{},"AI Button":{},"AI Prompt Input":{},"AI Rich Text Editor":{},"AI Text Area":{},"AI Input":{},"Wizard Page Header":{"Size":"V:XL 1440px|XL 1440px,L 1024px,M 834px,Dialog Wizard,Review Header"},".base/Wizard Step":{"State":"V:Current|Future,Current,Complete","Final Step":"V:False|False,True"},"calendar":{"Week Numbers#379380:0":"B:true","Week Header#477740:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Mixed Calendar":"V:False|False,True"},"list":{"⿻ List Items Compact#427968:0":"S","⿻ List Items Cozy#427968:3":"S","Form Factor":"V:Compact|Compact,Cozy"},"menu":{"⿻ Menu List Items Cozy#427954:13":"S","⿻ Menu List Items Compact#427954:16":"S","Form Factor":"V:Compact|Compact,Cozy"},"settings":{"Resize Handle#289298:0":"B:false","List Scrollbar#292448:0":"B:false","Content Scrollbar#292448:3":"B:false","⿻ Content#422659:22":"S","Unique Identifier#480620:11":"B:false","1st User Details#480620:22":"B:false","2nd User Details#480620:33":"B:false","Manage Account Button#480620:44":"B:false","⿻ Additional Settings#480620:55":"S","Add Additional Settings#480620:66":"B:false","Region#480711:77":"B:true","Date Format#480711:88":"B:true","Time Format#480711:99":"B:true","Time Zone#480711:110":"B:true","Currency#480711:121":"B:true","Number Format#480711:132":"B:true","Add Content#481377:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Default|Default,User Account,Appearance,Language and Region,Notifications"},"tag":{"Left Icon#188702:0":"B:false","Icon#189116:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","⿻ Content#473512:0":"S","✏️ Text#474619:0":"T:Tag","Interaction State":"V:Regular|Regular,Hover,Down","Value State":"V:Information|Information,Positive,Critical,Negative,None,Indication Colors","Color":"V:Semantic|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b,Semantic","Large Design":"V:No|No,Yes","Icon Only":"V:False|False,True"}}};
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
  const r = await fetchT(url, init, (opts && opts.timeout) || 12000, true);
  if (r.timeout) E('api timeout ' + path.split('?')[0], 'no answer in time');
  return { status: r.status, json: r.json };
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

async function placeTreeLogos(rootId, logos) {
  if (!logos || !logos.length) return 0;
  let placed = 0;
  try {
    const root = await figma.getNodeByIdAsync(rootId);
    if (!root || !('findAll' in root)) return 0;
    const used = new Set();
    for (let i = 0; i < logos.length; i++) {
      const it = logos[i];
      const all = root.findAll(_G(function (n) { return 'fills' in n && namedLike(n, it.name); }));
      const pick = all.find(function (n) { return !used.has(n.id); });
      if (!pick) continue;
      try {
        pick.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(it.pngBase64)).hash, scaleMode: 'FILL' }];
        used.add(pick.id);
        placed++;
      } catch (_) { E('placeTreeLogos', _); }
    }
  } catch (_) { E('placeTreeLogos', _); }
  return placed;
}

function namedLike(n, el) {
  const a = n.name.toLowerCase();
  const b = el.toLowerCase();
  return a === b || a.endsWith(' · ' + b) || a.endsWith('/' + b) || a.endsWith(' ' + b);
}
// ─── Make → SAP: a pasted probe dump becomes a SAP frame, all inside the plugin (no bridge, no node, no model) ───
function makeSay(text, extra) {
  try {
    const line = new Date().toISOString().slice(11, 19) + ' ' + String(text || '').slice(0, 200), norm = line.slice(9).replace(/\d+/g, '#'), last = BUILDLOG[BUILDLOG.length - 1];
    if (last && last.slice(9).replace(/\d+/g, '#') === norm) BUILDLOG[BUILDLOG.length - 1] = line;   // a status line that only counts seconds: one row
    else BUILDLOG.push(line);
    if (BUILDLOG.length > 60) BUILDLOG.shift();
  } catch (e) { E('makeSay', e); }
  send(Object.assign({ type: 'make-status', text: text }, extra || {}));
}
async function makeBuild(json, viaLink) {
  if (treeBusy) { makeSay('Busy — wait for the running build.'); return; }
  treeBusy = true;
  if (!viaLink) lastMakeLink = '';   // a pasted dump has no link to read again
  const srcLink = viaLink ? lastMakeLink : '';
  const t0 = Date.now();
  try {
    let dump;
    try { dump = JSON.parse(json); } catch (e) { makeSay('That is not a Make dump (not JSON).', { ok: false }); return; }
    const isDom = !!(dump && dump.kind === 'dom' && Array.isArray(dump.nodes) && dump.nodes.length);
    if (!isDom && (!dump || !Array.isArray(dump.controls) || !dump.controls.length)) { makeSay('No UI5 controls or web components found in this app. Is the link right, and is the app open in Chrome?', { ok: false }); return; }
    if (/,Ç¨|√º|√§|√∂|,Äì|¬∑/.test(json)) { makeSay('This paste is garbled (€, ü, ä, – show as ,Ç¨ √º √§ ,Äì): the text was copied with the wrong encoding. Click the Make bookmark again and paste; do not copy through a terminal.', { ok: false }); return; }
    makeSay('Converting ' + (isDom ? dump.nodes.length + ' page elements (web components)' : dump.controls.length + ' controls') + '…');
    const conv = MAKE_CONVERT(dump, MAKE_KIT, MAKE_MAP, MAKE_EXTRA, dump.title || 'Make screen');
    makeSay('Building ' + conv.controls + ' controls as SAP kit components…');
    const built = await RUN_TREE(FULL_KIT, conv.tree);
    if (typeof built === 'string') { makeSay('Build error: ' + built, { ok: false }); return; }
    const warn = conv.warn.concat(Array.isArray(built.WARN) ? built.WARN : []);
    if (!dump.explore) warn.unshift('NO popups / screens were read: the page scan did not run. Use a figma.com/make share link, and reload the Chrome extension (chrome://extensions, version 2.6.0).');
    else if (dump.explore.error) warn.unshift('Page scan failed: ' + dump.explore.error);
    let placed = 0;
    const data = dump.imageData || {};
    const logos = conv.images.filter(function (im) { return data[im.src]; }).map(function (im) { return { name: im.element, pngBase64: String(data[im.src]).replace(/^data:[^,]*,/, '') }; });
    if (logos.length) { makeSay('Placing ' + logos.length + ' image(s)…'); placed = await placeTreeLogos(built.nodeId, logos); }
    // Open overlays of the app (Dialog, Popover, Menu…) and the extra states a dump carries (dump.states: popups and other screens the
    // app showed when it was used): each is built as its own frame to the right of the screen
    let popups = 0; const fails = []; const popIds = [];
    try {
      const main = await figma.getNodeByIdAsync(built.nodeId); let gx = main ? main.x + main.width + 80 : 0;
      const seen = new Set();
      const list = (conv.extra || []).map(function (ex) { seen.add(ex.name + ex.box[2] + 'x' + ex.box[3]); return { name: ex.name, tree: ex.tree }; });
      for (const st of (Array.isArray(dump.states) ? dump.states : [])) {
        let d2; try { d2 = typeof st.dump === 'string' ? JSON.parse(st.dump) : st.dump; } catch (_) { continue; }
        if (!d2 || !Array.isArray(d2.controls) || !d2.controls.length) continue;
        const c2 = MAKE_CONVERT(d2, MAKE_KIT, MAKE_MAP, MAKE_EXTRA, st.name);
        if (st.kind === 'screen') list.push({ name: 'Screen — ' + st.name, tree: c2.tree });
        (c2.extra || []).forEach(function (ex) { const k = st.name + '|' + ex.name + ex.box[2] + 'x' + ex.box[3]; if (seen.has(k)) return; seen.add(k); list.push({ name: /—/.test(ex.name) ? 'Popup — ' + ex.name : 'Popup — ' + st.name + ' · ' + ex.name, tree: ex.tree }); });
      }
      for (const it of list) {
        makeSay('Building ' + it.name + '…');
        it.tree.n = it.name;
        try {
          const b2 = await RUN_TREE(FULL_KIT, it.tree);
          if (typeof b2 === 'string') { fails.push('FAILED ' + it.name + ': ' + b2); continue; }
          const nd = await figma.getNodeByIdAsync(b2.nodeId);
          if (nd && main) { nd.x = gx; nd.y = main.y; gx += nd.width + 80; popups++; popIds.push(nd.id); }
          if (Array.isArray(b2.WARN)) b2.WARN.forEach(function (w) { warn.push(it.name + ': ' + w); });
        } catch (e1) { fails.push('FAILED ' + it.name + ': ' + (e1 && e1.message ? e1.message : e1)); }
      }
    } catch (e) { fails.push('FAILED popups: ' + (e && e.message ? e.message : e)); }
    Array.prototype.unshift.apply(warn, fails);
    if (resyncCtx) { try { await applyResync(built.nodeId, popIds); } catch (e) { E('applyResync', e); } }   // re-sync: the new frame takes the place of the old one
    lastBuildIds.set(built.nodeId, [built.nodeId].concat(popIds));
    try { await showNode(built.nodeId); } catch (_) { E('makeBuild', _); }
    makeSay('Done in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s · ' + built.made + ' layers' + (placed ? ' · ' + placed + ' image(s)' : '') + (popups ? ' · ' + popups + ' popup / screen frame(s)' : ''),
      { ok: true, nodeId: built.nodeId, made: built.made, warn: warn, ms: Date.now() - t0 });
    // (the "What next?" card was removed on request — no audit runs after a build)
  } catch (err) {
    makeSay('Build failed: ' + (err && err.message ? err.message : String(err)), { ok: false });
  } finally {
    treeBusy = false;
  }
}

// ─── Make link: the bridge opens the link in headless Chrome and returns the probe dump; then the same makeBuild ───
// (no model, no extension). The plugin cannot open the app itself — its sandbox may call only the bridge.
let makeLinkBusy = false;
async function makeLink(url) {
  url = String(url || '').trim();
  if (makeLinkBusy) { makeSay('A link is already being read — wait for it.'); return; }
  if (treeBusy) { makeSay('Busy — wait for the running build.'); return; }
  makeLinkBusy = true;
  lastMakeLink = url;
  try {
    makeSay('Sending the link to the bridge…');
    const r = await api('/make/fetch', { method: 'POST', timeout: 30000, body: { url: url } });
    if (r.status === 0) { makeSay('The Make bridge is not running. ' + makeCtlText('start'), { ok: false }); return; }
    if (r.status === 401) { makeSay('The bridge does not know this plugin yet. Wait a few seconds (it pairs by itself), then paste the link again.', { ok: false }); return; }
    if (r.status === 404) { makeSay('The running bridge is an older version without Make links. ' + makeCtlText('restart'), { ok: false }); return; }
    if (r.status !== 200 || !r.json || !r.json.jobId) { makeSay((r.json && r.json.error) || ('The bridge refused the link (' + r.status + ').'), { ok: false }); return; }
    const jobId = r.json.jobId, t0 = Date.now();
    for (;;) {
      await new Promise(function (res) { setTimeout(res, 1500); });
      const s = await api('/make/job?' + qs({ jobId: jobId }));
      if (s.status === 0) { makeSay('Lost the bridge while reading the link.', { ok: false }); return; }
      if (s.status !== 200 || !s.json) { makeSay((s.json && s.json.error) || ('The bridge lost the job (' + s.status + ').'), { ok: false }); return; }
      if (s.json.status === 'error') { makeSay(s.json.error || 'Could not read the link.', { ok: false }); return; }
      if (s.json.status === 'done') {
        makeSay('Read the app in ' + Math.round((Date.now() - t0) / 1000) + ' s. Converting…');
        makeLinkBusy = false;
        await makeBuild(s.json.dump, true);
        return;
      }
      if (Date.now() - t0 > 200000) { makeSay('Reading the link took too long.', { ok: false }); return; }
      makeSay((s.json.step || 'Reading the app…') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' s');
    }
  } catch (err) {
    makeSay('Make link failed: ' + (err && err.message ? err.message : String(err)), { ok: false });
  } finally {
    makeLinkBusy = false;
  }
}



// ── kit definitions (KIT.d) for the fallback — straight from the kit file ──
FULL_KIT.d = {"Avatar Badge":{"Size":"V:XL and Bigger|XL and Bigger,L,M and Smaller","Value State":"V:None|None,Positive,Critical,Negative,Information","Color":"V:None|Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,None"},"Avatar Group":{"Overflow Button#100499:0":"B:false","Type":"V:Group|Group,Individual","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Size":"V:XL|XS,S,M,L,XL"},"Avatar":{"Badge#98694:0":"B:false","Optional Border#98694:211":"B:false","Person Icon#112262:148":"I:15f9f2047731a76b001f89d9362236e158402db3 person-placeholder","Object Icon#114257:7":"I:6b2655212b50d8dbf5d9ace87a1c7186942a28d5 product","✏️ Initials#143938:0":"T:SD","Type":"V:Image|Image,Icon,Initials","Interaction State":"V:Regular|Regular,Hover,Active,Toggled Hover,Disabled","Content":"V:Person|Person,Object","Size":"V:XL|XS,S,M,L,XL","Color":"V:Image|Image,1,2,3,4,5,6,7,8,9,10,Transparent,Tile,Placeholder"},"Footer":{"2nd Action#146241:0":"B:true","3rd Action#146241:5":"B:false","4th Action#146241:10":"B:false","1st Action#337405:0":"B:true","⿻ Actions Compact#427958:0":"S","⿻ Actions Cozy#427958:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Footer|Footer,Floating Footer"},"Header":{"Action#182392:0":"B:false","Subheader#184355:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Title|Title,Title with back button,Error,Warning,Success,Information,Confirmation"},"Breadcrumb":{"7th Child Item#153806:6":"B:false","3rd Child Item#153806:7":"B:false","5th Child Item#153806:8":"B:false","4th Child Item#153806:10":"B:false","6th Child Item#153806:11":"B:false","2nd Child item#153806:12":"B:false","1st Child Item#153814:0":"B:true","✏️ Current Item#153814:3":"T:Current item","⿻ Breadcrumbs#425845:0":"S","Overflow":"V:False|False,True","Popover":"V:False|False,True"},"Busy Indicator Dot":{"Size":"V:XXS|XXS,XS,S,M,L,XL,XXL"},"Busy Indicator":{"Text#146239:0":"B:false","✏️ Text Value#146239:4":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"},"Animated Busy Indicator":{"Text#397886:0":"B:false","✏️ Text Value#397886:8":"T:Loading text should be inserted in this area and should be wrapped","Size":"V:Small|Small,Medium,Large"},"Button Badge":{"✏️ Number#473631:0":"T:72","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Counter Badge|Attention Badge,Counter Badge"},"Segmented Button":{"3rd Button#167915:5":"B:true","4th Button#167915:10":"B:true","5th Button#167915:15":"B:false","⿻ Text Segments Compact#425845:10":"S","⿻ Icon Segments Compact#425845:15":"S","⿻ Icon Segments Cozy#427418:0":"S","⿻ Text Segments Cozy#427418:5":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Text,Icon"},"Segmented Button Singular":{"Icon#112262:123":"I:396436a4e244a78ea435d973b9ff1512652d46c5 heating-cooling","Icon Left#114173:291":"B:false","✏️ Text#145508:644":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Text|Icon,Text","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True"},"Icon Split Button":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Split Button":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Left Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Right Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Icon Menu Button":{"Icon#112262:49":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Menu Button":{"Icon Left#112572:0":"B:false","Icon#112572:97":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:546":"T:Button","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled"},"Icon Button":{"Attention Badge#112533:390":"B:false","Icon#112533:584":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"},"Button":{"Icon Left#112533:293":"B:false","Icon#112533:487":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","✏️ Text#145508:461":"T:Button","Attention Badge#269292:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Primary|Primary,Secondary,Accept,Reject,Attention,Tertiary","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|False,True","Counter Badge":"V:False|True,False"},"Legend":{},"Mixed Calendar Button":{"✏️ 1st Line#379904:24":"T:Rabi’ I","✏️ 2nd Line#379904:36":"T:Sep - Oct","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Toggled":"V:False|True,False"},"Calendar Date Types":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled","Day":"V:Work Day|Work Day,Non-Working Day,Week Day,Week Number,Adjacent Month's Day","Today":"V:False|False,True","Selected":"V:False|False,True","Range":"V:False|False,True","Accent":"V:False|False,True","Mixed Calendar Date":"V:False|False,True"},"Legend Item":{"Text#242137:0":"T:Day","Day Type":"V:Today|Today,Selected,Work Day,Non-Work Day,Special Day 1,Special Day 2,Special Day 3,Special Day 4,Special Day 5,Special Day 6,Special Day 7,Special Day 8,Special Day 9,Special Day 10,Special Day 11,Special Day 12,Special Day 13,Special Day 14,Special Day 15,Special Day 16,Special Day 17,Special Day 18,Special Day 19,Special Day 20"},"Two-Month Calendar":{"Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Layout":"V:Horizontal|Horizontal,Vertical"},"Calendar":{"Week Numbers#379380:0":"B:true","Week Header#477740:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Selection":"V:Day|Day,Month,Year,Year Range","Mixed Calendar":"V:False|False,True"},"Banner":{"✏️ Title#221827:0":"T:This is your banner title","✏️ Text#221827:3":"T:Here you can insert any additional information that may be relevant to the context. This section serves as a placeholder for content that can provide more in-depth explanations, supplementary data, or any other pertinent details that the reader might need.","Type":"V:Text Block with Image|Text Block with Image,Text Container on Image,Text on Colorful Background"},"Card Timestamp and Counter":{"✏️ Timestamp Text#320283:0":"T:2hrs ago","Icon Button#320283:1":"B:true","✏️ Counter Text#320306:3":"T:6 of 12","Type":"V:Timestamp|Counter,Timestamp"},"Card Badge":{"Text#229927:2":"B:true","✏️ Text#229927:3":"T:New","With Icon#229927:4":"B:false","Icon#232335:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","Color":"V:Default|Default,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"},"Card Footer":{"3rd Action#207890:15":"B:false","2nd Action#207890:17":"B:false","Form Factor":"V:Compact|Compact,Cozy"},"Card Numeric Header":{"2nd Indicator#208598:2":"B:true","Label#208598:3":"B:true","Micro Chart#241442:0":"B:false","1st Indicator#304002:0":"B:true"},"Card Extended Header":{"2nd Tag#207847:2":"B:false","Rating Indicator#207847:6":"B:true","Link#207847:8":"B:true","3rd Tag#207847:10":"B:false","2nd Row#209363:9":"B:true","3rd Row#300122:0":"B:false","1st Row#302504:0":"B:true","1st Tag#307702:3":"B:true","Timestamp#332737:0":"B:true","⿻  3rd Row#422655:9":"S","Form Factor":"V:Compact|Compact,Cozy"},"Card Main Header":{"Avatar#103789:0":"B:true","Subtitle#103789:4":"B:true","Counter#103789:8":"B:true","Action#208598:5":"B:false","Trailing Area#209363:4":"B:true","✏️ Title#218182:0":"T:Alain Chevalier","✏️ Subtitle#218182:5":"T:Sales Executive","Timestamp#307080:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active"},"Card Media Block":{"✏️ Text#209363:0":"T:Incoming \nApplications","Type":"V:Image|Image,Image with Padding,Title"},"Card":{"Slot#114257:0":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Extended Header#205668:9":"B:false","Numeric Header#205668:16":"B:false","Content#205668:23":"B:true","Footer#205668:30":"B:false","Media Block#207890:18":"B:false","1st Badge#208835:6":"B:false","Main Header#210374:0":"B:true","2nd Badge#229944:5":"B:false","Content/Footer Space#319730:0":"B:true","Header#322738:0":"B:true","⿻  Content#422655:0":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover","▶️ Interactive Header":"V:False|True,False"},"Page Indicator Dots":{"Selected":"V:True|True,False"},"On Content Page Indicator":{"✏️  Text#236170:0":"T:1 of 9","Type":"V:Dots|Dots,Numbers,Hidden"},"Page Indicator":{"✏️  Text#236170:4":"T:1 of 9","Type":"V:Dots|Dots,Numbers"},"Carousel":{"Multiple Items#355313:0":"B:false","Indicator Bar#360874:0":"B:true","Indicator Buttons#360874:7":"B:true","⿻  Multiple Items#422655:12":"S","Indicator Position":"V:Bottom|Bottom,Top","Buttons Position":"V:On Bar|On Bar,On Image","On Content":"V:False|False,True"},"Check Box":{"Label#125545:8":"B:false","✏️ Text#154638:49":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only,Display Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Check":"V:Unchecked|Unchecked,Checked,Tristate"},"Swatch":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover / Pressed / Selected","Color":"V:Gold|Gold,Light Coral,Deep Pink,Medium Violet Red,Medium Slate Blue,Cornflower Blue,Light Sea Green,Olive Drab,Royal Blue,Light Cyan,White,Light Gray,Dark Gray,Dim Gray,Black,Transparent"},"Color Palette":{"Form Factor":"V:Compact|Compact,Cozy"},"Color Picker Color Mode Panel":{"Color Mode":"V:HSLA|HSLA,RGB","Form Factor":"V:Compact|Compact,Cozy"},"Color Picker Comparison Color Fields":{"Opacity 100%#313616:6":"B:true","Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red"},"Color Picker Slider":{"Form Factor":"V:Compact|Compact,Cozy","Color":"V:Blue|Blue,Red","Percentage":"V:30%|30%,100%"},"Color Picker":{"Default Mode#315367:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Gradient Field":"V:Blue Hue|Blue Hue,Red Hue"},"Date (Range) Picker":{"Calendar#165202:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Type":"V:One-Month|One-Month,Two-Month","Orientation":"V:N/A|N/A,Horizontal,Vertical"},"Date Time Dropdown":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Date and Time|Date and Time,Date,Time"},"Date Time Picker":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|False,True"},"Dialog Block Layer":{},"Dialog":{"Slot#114549:3":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","Resize Handle#153790:0":"B:false","⿻  Content#422655:19":"S","Form Factor":"V:Compact|Compact,Cozy","Scrollable Content":"V:False|False,True"},"Drop-Down Value Message Item":{"Type":"V:Negative|Negative,Critical,Positive,Information"},"Drop-Down Item":{"Check Box#181512:0":"B:false","✏️ 1st Column#181512:279":"T:Option text","✏️ 2nd Column#181512:293":"T:2nd Column","Separator#181522:307":"B:false","Show 2nd Column#181557:321":"B:false","Delete Button#212713:0":"B:false","⿻ Content Compact#471778:195":"S","⿻ Content Cozy#471778:223":"S","Form Factor":"V:Compact|Cozy,Compact,N/A","Type":"V:Single Line|Single Line,Group Header","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"Drop-Down Base":{"Show Value Message#190333:0":"B:false","⿻ Drop-Down Items Compact#427954:7":"S","⿻ Drop-Down Items Cozy#427954:10":"S","Form Factor":"V:Compact|Compact,Cozy"},"Drop-Down":{"Form Factor":"V:Compact|Compact,Cozy"},"Expand / Collapse and Pin Buttons":{"Header Behaviour":"V:Expanded|Collapsed,Expanded","Pin Button":"V:True|True,False"},"Dynamic Page Header":{"Expand and Pin Buttons#416566:0":"B:true","⿻ Content#416566:6":"S","⿻ Header Area#416566:9":"S","Header Shadow#416566:18":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:XL and XXL|S,M,L,XL and XXL","Interaction State":"V:Regular|Regular,Hover","Collapsed":"V:False|True,False"},"File Uploader":{"Form Factor":"V:Compact|Compact,Cozy","Text":"V:Placeholder|Placeholder,Uploaded File"},"Form Item":{"✏️ Form Header Text#237212:0":"T:Form Header","✏️ Group Header Text#237212:24":"T:Group Header","Required Label#466778:0":"B:false","Type":"V:Input|Input,Tokenizer,Text Area,Check Box,Group Header,Form Header","Form Factor":"V:Compact|Compact,Cozy,N/A","Mode":"V:Edit Mode|Edit Mode,Display Mode,N/A","Orientation":"V:4:8 Horizontal|4:8 Horizontal,4:7:1 Horizontal,Vertical,N/A","Two Input Controls":"V:No|No,Yes"},"Form":{"Type":"V:4:8 Horizontal with groups|4:8 Horizontal with groups,4:7:1 Horizontal,Vertical with groups,Vertical","Form Factor":"V:Compact|Compact,Cozy","Display Mode":"V:False|False,True"},"Homepage Hero Banner":{"⿻ Action Area#440899:0":"S","⿻ Content Area#440899:2":"S","✏️ Date#441217:0":"T:Thursday, November 5, 2025","✏️ Salutation#441217:2":"T:Hello, Henry","Action Area#441217:4":"B:false","Content Area#441217:7":"B:false","Size":"V:XL Full-width|XS,S,M,L,XL Letterbox,XL Full-width","Form Factor":"V:Compact|Compact,Cozy","Variation":"V:False|True,False"},"Illustrated Message":{"✏️ Title#99555:0":"T:Let's get some results","✏️ Description#99555:17":"T:Start by providing your search criteria.","Illustration L#129986:0":"I:3e6dd1ef07f30539422119902a38147c87f9622a Before Search/Size=L","Illustration M#129986:9":"I:cc40cf665805bb22b83e74f3161d0c6e48ff9655 Before Search/Size=M","Illustration S#129986:18":"I:9acff3f046e634485e3808e62d418f7194eec8ef Before Search/Size=S","Illustration XS#129986:27":"I:8c85d2c6d6c767092f209374a0471abc6a21b44e Before Search/Size=XS","3rd Button#177911:52":"B:false","2nd Button#177911:61":"B:false","1st Button#177911:79":"B:false","Form Factor":"V:Compact|Compact,Cozy","Size":"V:Large (L)|Extra Small (XS),Small (S),Medium (M),Large (L)"},"Input Button":{"Icon#148177:0":"I:80086d2e8969c07e7c885e6ee9244005bfc3864d decline","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information"},"Input Message Popover":{"✏️ Text#148609:0":"T:Message text giving further context.","Value State":"V:Negative|Negative,Critical,Positive,Information"},"Input":{"Trailing Action#144344:0":"B:false","2nd Action#144344:3":"B:false","✏️ Placeholder#145437:156":"T:Placeholder","✏️ Typed Text#145437:221":"T:Typed Text","Message Popover#154602:0":"B:false","Description Text#267637:0":"B:false","✏️ Description Text#267656:0":"T:Description Text","⿻ Content Compact#471773:0":"S","⿻ Content Cozy#471778:130":"S","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Read Only,Disabled","Value State":"V:None|None,Negative,Critical,Positive,Information","Content":"V:Placeholder|Placeholder,Typed Text"},"Label":{"Required#104646:0":"B:false","✏️ Label#237212:48":"T:Label:","Type":"V:Regular|Regular"},"Link":{"✏️ Text#142188:0":"T:Link","Icon#283747:121":"I:e58e7884f9b11181af59a8bb7cd4c2106d5327e9 inspect","Type":"V:Icon Link|Regular,Emphasized,Subtle,Icon Link","Interaction State":"V:Regular|Regular,Hover,Visited,Down,Disabled","Icon Position":"V:Right|Right,Left,N/A"},"Selector":{"Form Factor":"V:Compact|Compact,Cozy","Selector Type":"V:Check Box|Check Box,Radio Button","Selected":"V:Unselected|Selected,Tristate,Unselected"},"List Attachment":{"Text#155542:4":"T:Attachment","Type":"V:Attachment|Attachment,Object Status"},"List Thumbnail":{"Icon#155542:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Thumbnail":"V:Avatar|Avatar,Icon"},"List Item":{"Separator#123475:0":"B:true","Icon / Selector#147034:0":"B:false","Navigation Indicator#147034:36":"B:false","Leading Icon#147034:54":"B:true","Selector#147034:72":"B:false","Item Counter#147034:108":"B:false","Trailing Icon#147034:144":"B:false","Leading Icon Swap#152431:18":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","2nd Button#152451:36":"B:false","✏️ Counter Value#152451:54":"T:12345","1st Button#152462:72":"B:false","✏️ Text#152462:90":"T:List Item","✏️ Byline#152704:108":"T:Byline","Attachment#152767:146":"B:true","Thumbnail#152767:165":"B:false","✏️ Group Name#152767:195":"T:Group Header","✏️ Footer Text#152767:225":"T:List Footer","Trailing Icon Swap#155542:7":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Object Status#155958:0":"B:false","✏️ Growing Text#155999:31":"T:More","⿻ Content#415971:0":"S","Content Container#415971:27":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Single Line|List Header,Group Header,Single Line,Byline,Growing List Item,Footer","Interaction State":"V:Regular|Regular,Hover,Down,N/A","Selected":"V:False|True,False"},"List":{"⿻ List Items Compact#427968:0":"S","⿻ List Items Cozy#427968:3":"S","Form Factor":"V:Compact|Compact,Cozy"},"Trailing Container":{"✏️ Shortcut#161491:0":"T:Ctrl+3","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Arrow|Shortcut,Arrow,Checkmark"},"Menu List Item":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:false","Trailing Space#147034:144":"B:false","✏️ Text#152462:90":"T:Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"Menu":{"⿻ Menu List Items Cozy#427954:13":"S","⿻ Menu List Items Compact#427954:16":"S","Form Factor":"V:Compact|Compact,Cozy"},"Message Strip Icon Button":{"Interaction  State":"V:Regular|Regular,Hover,Down","Type":"V:Indication 1 to 10|Indication 1 to 10,Indication 1b to 10b"},"Message Strip":{"Close Button#102938:0":"B:true","Value State":"V:Information|Information,Positive,Critical,Negative,Indication Color","Icon":"V:True|True,False","Color":"V:None|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b"},"Multi Combobox":{"\"Show all\" Footer#212884:27":"B:false","Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|True,False"},"Multi Input":{"Drop-Down#209617:14":"B:false","\"Show all\" Footer#212884:17":"B:false","Form Factor":"V:Compact|Compact,Cozy","Display Only":"V:False|False,True"},"Notifications Status Indicator":{"Type":"V:Positive|Positive,Negative,Critical,Information,Neutral"},"Notification List Item":{"Status Indicator#274252:3":"B:false","More#274252:6":"B:true","Importance Tag#274252:14":"B:false","Description#274252:17":"B:true","✏️ Title#274309:0":"T:Notification Title","✏️ Description#274309:5":"T:Description of notification topic","✏️ Group Name#276270:0":"T:Today","Arrow#288437:14":"I:d206a924630cb08c1b62f4c2ddef383b8142e519 slim-arrow-down","Form Factor":"V:Compact|N/A,Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Type":"V:Notification List Item|Group Header,Notification List Item","Read":"V:False|False,True"},"Notification Banner":{"2nd List Item#274329:0":"B:true","3rd List Item#274329:3":"B:false","4th List Item#274329:6":"B:false","5th List Item#274329:9":"B:false","6th List Item#274329:12":"B:false","7th List Item#274329:15":"B:false","8th List Item#274329:18":"B:false","9th List Item#274329:21":"B:false","10th List Item#274329:24":"B:false","⿻ Content#415687:0":"S","Size":"V:S|S,M / L"},"Notifications Growing Item":{"Interaction State":"V:Regular|Regular,Hover,Down","Busy Indicator":"V:False|True,False"},"Notifications":{"Message Strip#274252:26":"B:false","1st Growing Notifications#274252:29":"B:false","2nd Growing Notifications#413974:0":"B:false","Toolbar Sorting#414088:0":"B:false","⿻ Content#414766:10":"S","Size":"V:S|S,M / L","Scrollbar":"V:False|False,True"},"Object Attribute":{"Type":"V:Regular|Regular,Active"},"Object Identifier":{"Hover":"V:No|No,Yes","Link":"V:No|No,Yes","Emphasis":"V:No|No,Yes"},"Object Number":{"Type":"V:Regular|Regular,Emphasized,Large,Inverted","Semantic":"V:Error|None,Information,Success,Warning,Error"},"Object Status":{"Semantic":"V:Information|None,Information,Success,Warning,Error","Inverted":"V:No|No,Yes","Large Design":"V:No|No,Yes"},"Panel":{"Slot#114200:7":"I:1f0283948a8d41e691d8cd9c0cd34b398179fcfe Slot/Type=Single","✏️ Title#145524:0":"T:Panel Title","4th Action#146223:7":"B:false","3rd Action#146223:14":"B:false","2nd Action#146223:21":"B:false","1st Action#146223:28":"B:false","⿻  Content#422655:24":"S","Form Factor":"V:Compact|Compact,Cozy","Fixed":"V:False|False,True","Collapsed":"V:False|False,True"},"Popover":{"Header#153771:0":"B:false","Footer#153771:14":"B:false","Resize Handle#230738:94":"B:false","⿻ Content#422659:91":"S","Scrollbar#460647:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Arrow":"V:False|False,True","Arrow Position":"V:None|None,↖ Top Left,↑ Top Center,↗ Top Right,↗ Right Top,→ Right Center,↘ Right Bottom,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,↙ Left Bottom,← Left Center,↖ Left Top","Resize Handle Position":"V:↖ Top Left|↖ Top Left,↗ Top Right,↘ Bottom Right,↙ Bottom Left"},"Product Icon":{"Icon#458135:0":"I:bcda1a5cba51eed5db5c05ffc5c429660ff80899 bus-public-transport","Type":"V:Product Switch Icon|Product Switch Icon,Icon","Size":"V:Large|Small,Large"},"Product Switch Element":{"✏️ Title#452468:0":"T:Title","✏️ Subtitle#452468:11":"T:Subtitle","Size":"V:Large|Small,Large","Interaction State":"V:Regular|Regular,Hover,Pressed,Selected,Selected Hover"},"Product Switch":{"⿻ Large Elements#454469:10":"S","⿻ Small Elements#454469:15":"S","Size":"V:Large|Small,Large","Scrollbar":"V:False|True,False"},"Progress Indicator":{"Text#103111:0":"B:true","✏️ Text Value#141830:0":"T:60%","✏️ Progress Bar#142242:0":"T:write/delete to move the progress value","Value State":"V:None|None,Information,Positive,Critical,Negative","Interaction State":"V:Regular|Disabled,Regular"},"Radio Button":{"Label#125545:8":"B:false","✏️ Text#154638:0":"T:With text","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Value State":"V:None|None,Information,Positive,Critical,Negative","Selected":"V:False|False,True"},"Rating Indicator Single":{"Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Hover,Read-Only,Regular","Selected":"V:False|False,True"},"Rating Indicator":{"Label#104633:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Read Only,Disabled"},"Scrollbar":{"Interaction State":"V:Regular|Regular,Hover"},"Select":{"Form Factor":"V:Compact|Compact,Cozy","Drop-Down":"V:False|False,True"},"Settings":{"Resize Handle#289298:0":"B:false","List Scrollbar#292448:0":"B:false","Content Scrollbar#292448:3":"B:false","⿻ Content#422659:22":"S","Unique Identifier#480620:11":"B:false","1st User Details#480620:22":"B:false","2nd User Details#480620:33":"B:false","Manage Account Button#480620:44":"B:false","⿻ Additional Settings#480620:55":"S","Add Additional Settings#480620:66":"B:false","Region#480711:77":"B:true","Date Format#480711:88":"B:true","Time Format#480711:99":"B:true","Time Zone#480711:110":"B:true","Currency#480711:121":"B:true","Number Format#480711:132":"B:true","Add Content#481377:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Default|Default,User Account,Appearance,Language and Region,Notifications"},"Shell Search Selector":{"✏️ Text#415778:0":"T:All","Interaction State":"V:Regular|Regular,Hover,Hover on Icon,Active","Advanced Filtering":"V:False|True,False"},"Shell Search Button":{"Interaction State":"V:Regular|Regular,Hover,Active,While Typing"},"Shell Search":{"Interaction State":"V:Regular|Regular,Hover,Active,Searched,While Typing","Expanded":"V:True|False,True","Selector":"V:False|False,True"},"Branding Button":{"Product Identifier#285341:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Active"},"Shell Button":{"Interaction State":"V:Regular|Regular,Hover,Active,Toggled"},"Shell Bar":{"Back Button#104186:9":"B:false","1st Extra Action#230178:0":"B:false","2nd Extra Action#230178:12":"B:false","Extra Right Area#285220:3":"B:false","Extra Left Area#285220:9":"B:false","Joule#285220:15":"B:false","Feedback#285220:21":"B:false","Product Switch#285220:27":"B:false","Overflow#285285:0":"B:true","Notification#285285:11":"B:true","Help#285285:22":"B:true","Walk me#285750:0":"B:false","Support#285750:11":"B:false","Shell Search#328265:0":"B:true","⿻   Extra Left Area#422659:0":"S","⿻ Extra Right Area#422659:11":"S","Size":"V:XL|S,M,L,XL,XXL","Hamburger":"V:False|False,True"},"Navigation Item":{"Navigation Indicator / External Link#283218:12":"B:true","Navigation Indicator / External Link Icon#283293:50":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","Two Click-Area#283293:112":"B:false","✏️ Text#283293:137":"T:Nav Item","Icon#328810:0":"I:ddf4537c2f792179f11f64cae869cd1241e5ec7e home","External Link#406893:0":"B:false","Tag#469827:7":"B:false","Form Factor":"V:Compact|Compact,Cozy,N/A","Type":"V:Navigation Item|Navigation Item,Child Item,Navigation Group,Quick Create","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Pressed Hover,Pressed Active","Selected":"V:False|True,False","Expanded":"V:False|True,False","Long Tag":"V:False|False,True"},"Side Navigation":{"Scrollbar#283293:201":"B:false","Arrow#325625:0":"B:true","⿻ Navigation Items#415662:0":"S","⿻ Footer#415679:7":"S","⿻ Navigation Items Collapsed#415950:0":"S","⿻ Footer Collapsed#415950:7":"S","Search#469823:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Collapsed|Collapsed,Expanded,Floating"},"Tooltip and Input":{"✏️ Value#237327:1":"T:65","Tooltip / Input":"V:Tooltip|Tooltip,Input","Form Factor":"V:Compact|Compact,Cozy"},"Range Slider Handle":{"Tooltip / Input#104968:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"},"Range Slider":{"Tick Marks#104968:7":"B:false","Labels#299312:21":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Disabled,Regular","Left Value":"V:0%|0%,25%,50%,75%","Right Value":"V:25%|25%,50%,75%,100%"},"Slider Handle":{"Tooltip / Input#104968:30":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Down"},"Slider":{"Tick Marks#104968:25":"B:false","Labels#299312:0":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Disabled","Value":"V:0%|0%,25%,50%,75%,100%"},"Step Input":{"✏️ Value#148178:0":"T:50","Message Popover#154602:65":"B:false","✏️ Description Text#469803:0":"T:Description Text","Description Text#469803:35":"B:false","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|None,Negative,Critical,Positive,Information"},"Switch":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Non-Semantic|Non-Semantic,Semantic","Interaction State":"V:Regular|Regular,Hover,Disabled,Read Only","Checked":"V:True|True,False"},"Icon Tab Bar":{"Overflow#103133:0":"B:true","⿻ Tabs Inline, Non Semantic#425676:0":"S","⿻ Tabs Inline, Semantic#426727:0":"S","⿻ Tabs Shell Navigation, Non Semantic#426727:46":"S","⿻ Tabs Icon Only, Non Semantic, Compact#426736:0":"S","⿻ Tabs Icon Only, Semantic, Compact#426736:46":"S","⿻ Tabs Process, Non Semantic, Compact#426762:92":"S","⿻ Tabs Process, Semantic, Compact#426762:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Compact#426762:184":"S","⿻ Tabs Filter Tabs, Semantic, Compact#426762:230":"S","⿻ Tabs Icon Only, Non Semantic, Cozy#426848:0":"S","⿻ Tabs Icon Only, Semantic, Cozy#426848:46":"S","⿻ Tabs Process, Non Semantic, Cozy#426848:92":"S","⿻ Tabs Process, Semantic, Cozy#426848:138":"S","⿻ Tabs Filter Tabs, Non Semantic, Cozy#426848:184":"S","⿻ Tabs Filter Tabs, Semantic, Cozy#426848:230":"S","Form Factor":"V:N/A|Cozy,Compact,N/A","Type":"V:Inline Mode|Inline Mode,Icon Only,Process Tabs,Shell Navigation,Filter Tabs","Semantic":"V:No|No,Yes","Size":"V:S|S,M and L,XL"},"Tab Bar Overflow":{"Type":"V:'More' Text|'More' Text,Count","Interaction State":"V:Regular|Regular,Hover,Down"},"Tab":{"Badge#101559:0":"B:false","Item Count#101799:0":"B:false","Menu Arrow#101979:0":"B:true","Icon#112262:750":"I:361026d73858fabff3db3e9bdea5a18681beccc2 group","✏️ Text#183920:0":"T:Tab Text","✏️ Additional Text#183920:77":"T:53 of 123","✏️ Counter#183920:154":"T:123","✏️ Label#183920:231":"T:Products","Item Count Text#183920:308":"T:3","Separator#183922:0":"B:false","Arrow#183922:77":"B:false","Form Factor":"V:N/A|Compact,Cozy,N/A","Type":"V:Inline|Inline,Icon Only,Shell Navigation,Process and Filter,Filter Total","Interaction State":"V:Regular Active|Regular Active,Regular Inactive,Hover on Arrow (Active),Hover (Inactive),Hover on Text (Inactive),Hover on Arrow (Inactive)","Value State":"V:Non Semantic|Non Semantic,None,Positive,Critical,Negative"},"Table Highlight":{"Value State":"V:Information|Information,Error,Warning,Success,None"},"Table Cell":{"1st Column#188248:0":"B:false","✏️ Text#190298:0":"T:Text","Button Type – Compact#190298:59":"I:f6246d2947c0a3cc1560cc40ce9ed6bd789d8416 Icon Button/Form Factor=Compact, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Compact#191065:0":"I:4ccc8a9d82c4094267a43b82c45c4b4564dbced3 Input/Form Factor=Compact, Interaction State=Regular, Value State=None, Content=Placeholder","✏️ Currency#191125:0":"T:EUR","Button Type – Cozy#192997:0":"I:00a3434ed7a0e9830ce0eeae8aac9bafed7b00b2 Icon Button/Form Factor=Cozy, Type=Tertiary, Interaction State=Regular, Toggled=False, Counter Badge=False","Input Type – Cozy#192997:175":"I:7c27077d7736b75f9d0724e3fb4512bda7bd46f0 Input/Form Factor=Cozy, Interaction State=Regular, Value State=None, Content=Placeholder","Icon#200078:0":"I:3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d slim-arrow-right","✏️ By Text Description#239124:0":"T:Description","Collapse / Expand#242161:0":"B:false","⿻ Content Compact#471778:237":"S","⿻ Content Cozy#471778:463":"S","Form Factor":"V:Compact|Compact,Cozy","Hierarchy":"V:Cell|Cell,Column Header,Group Header","Type":"V:Text|Text,Check Box,Icon,Link,Tag,Button,Input,Currency,Rating Indicator,Highlight,Object Identifier - Bold,Object Identifier - Link,Empty","Interaction State":"V:Regular|Regular,Hover,Down","Selected":"V:False|False,True","Alignment":"V:Left|Left,Right"},"Table":{"Highlight#200542:0":"B:false","⿻ Columns Compact#426001:0":"S","⿻ Rows Compact#426001:5":"S","⿻ Columns Cozy#426001:10":"S","⿻ Rows Cozy#426001:15":"S","Form Factor":"V:Compact|Compact,Cozy","Structure":"V:Columns|Columns,Rows"},"Tag":{"Left Icon#188702:0":"B:false","Icon#189116:0":"I:a3752e5eec2addfa9a045328b88c53a8eb61d6a6 example","⿻ Content#473512:0":"S","✏️ Text#474619:0":"T:Tag","Interaction State":"V:Regular|Regular,Hover,Down","Value State":"V:Information|Information,Positive,Critical,Negative,None,Indication Colors","Color":"V:Semantic|None,Indication 1,Indication 2,Indication 3,Indication 4,Indication 5,Indication 6,Indication 7,Indication 8,Indication 9,Indication 10,Indication 1b,Indication 2b,Indication 3b,Indication 4b,Indication 5b,Indication 6b,Indication 7b,Indication 8b,Indication 9b,Indication 10b,Semantic","Large Design":"V:No|No,Yes","Icon Only":"V:False|False,True"},"Text":{"✏️ Text#223176:0":"T:Lorem ipsum","Selected":"V:False|True,False"},"Text Area":{"Scroll Bar#147859:1":"B:false","✏️ Placeholder#147861:0":"T:Write your message here.","✏️ Typed Text#147861:3":"T:Typed text","Counter#165575:0":"B:false","Message Popover#165575:1":"B:false","✏️ Counter Text#165575:2":"T:180 characters left","✏️ Text#165588:0":"T:180 characters left","Form Factor":"V:Compact|Compact,Cozy","Content":"V:Placeholder|Placeholder,Typed Text","Interaction State":"V:Regular|Regular,Hover,Active,Disabled,Read Only","Value State":"V:None|Negative,Information,Positive,Critical,None"},"Tick Mark":{"Selected#193792:0":"B:false","Size":"V:Large|Large,Small"},"Number Selector":{"✏️ Number#195120:2":"T:3","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected"},"Clock-face":{"Form Factor":"V:Compact|Cozy,Compact","Type":"V:12 hours|12 hours,24 hours,Minutes,Seconds"},"Hours and Minutes Output":{"Seconds#194107:0":"B:false","AM/PM 12 hours view#194107:3":"B:true","Current Time#194199:6":"B:false","Form Factor":"V:Compact|Compact,Cozy"},"Time Dropdown":{"Form Factor":"V:Compact|Compact,Cozy"},"Time Picker":{"Form Factor":"V:Compact|Compact,Cozy","Dropdown":"V:False|True,False"},"Toast":{"✏️ Text#142680:0":"T:2 sales orders were deleted.","Type":"V:Regular|Regular"},"Tooltip":{"✏️ Text#466725:9":"T:Save (Ctrl+S)","Arrow Position":"V:↑ Top Center|↑ Top Center,↗ Top Right,→ Right Center,↘ Bottom Right,↓ Bottom Center,↙ Bottom Left,← Left Center,↖ Top Left"},"Tree Item Base":{"✏️ Text#182211:63":"T:Level","Icon#184583:159":"I:40534f62cdce550850addd3a7dcfa843d3c68e0c navigation-down-arrow","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Active,Disabled","Selected":"V:False|False,True","Level 1":"V:True|False,True","Last Child":"V:False|False,True"},"Tree Item":{"Level 10#186218:93":"B:true","Level 9#186218:124":"B:true","Level 8#186218:155":"B:true","Level 5#186218:186":"B:true","Level 6#186218:217":"B:true","Form Factor":"V:Compact|Compact,Cozy","Levels":"V:1|1,2,3,4-6,7+","Selection":"V:None|None,Independent,Dependent"},"Tree":{"⿻ Tree Items Compact#425685:3":"S","⿻ Tree Items Cozy#427338:0":"S","Form Factor":"V:Compact|Compact,Cozy"},"Token":{"✏️ Text#154228:0":"T:Token","Form Factor":"V:Compact|Compact,Cozy","Interaction State":"V:Regular|Regular,Hover,Selected,Selected Hover,Read Only"},"Overflow Link and Typing ":{"✏️ Typed Text#202050:14":"T:Typing","Type":"V:Overflow Link|Overflow Link,Typing"},"Tokenizer":{"Overflow Link / Typing#202017:10":"B:false","Overflow Link#202050:3":"B:false","⿻ Tokens Compact#425873:0":"S","⿻ Tokens Cozy#425873:7":"S","⿻ Tokens Multiline Compact#425882:0":"S","⿻ Tokens Multiline Cozy#425882:7":"S","Form Factor":"V:Compact|Compact,Cozy","Type":"V:Single Line|Single Line,Multiline","Input":"V:False|False,True"},"Toolbar Items":{"Form Factor":"V:Compact|Compact,Cozy","Type":"V:Separator|Separator,Spacer (set to fill)"},"Toolbar":{"Title#186167:0":"B:false","3rd Action#186464:3":"B:true","1st Action#186482:6":"B:true","2nd Action#186482:9":"B:true","✏️ Title Text#186490:0":"T:Toolbar Title","Input#186514:12":"B:false","Segmented Button#186514:15":"B:false","4th Action#186601:9":"B:false","5th Action#186601:18":"B:false","6th Action#186601:21":"B:false","7th Action#186601:24":"B:false","8th Action#186601:27":"B:false","9th Action#186601:30":"B:false","10th Action#186601:33":"B:false","11th Action#186601:36":"B:false","12th Action#186601:39":"B:false","13th Action#186601:42":"B:false","⿻ Actions Compact#425685:6":"S","⿻ Left Area#425685:12":"S","⿻ Actions Cozy#427338:3":"S","Form Factor":"V:Compact|Compact,Cozy"},"Tool Header":{"Form Factor":"V:Compact|Compact,Cozy"},"Header Content Area":{"⿻ Content#454728:0":"S"},"User Menu Custom Menu List Item":{"Separator#123475:0":"B:false","Leading Space#147034:0":"B:true","Trailing Space#147034:144":"B:true","✏️ Menu List Item#152462:90":"T:User Menu List Item","Icon#303557:0":"I:ff1de89f036f7aef09afe2d157fc3bd9206cee7f globe","Leading Icon#305089:0":"B:true","Sub-menu Item#451233:0":"B:true","✏️ Sub-menu Item#451233:7":"T:Sub-menu Item","Sub-menu#452355:0":"B:false","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|False,True"},"User Menu Custom List Item":{"✏️ 2nd Subline#285480:1":"T:Second Subline","✏️ 1st Subline#285480:2":"T:First Subline","✏️ User Name#285480:3":"T:User Name","Separator#285480:4":"B:true","Active User#285480:6":"B:true","Avatar#285835:0":"B:true","Interaction State":"V:Regular|Regular,Hover,Down,Disabled","Selected":"V:False|True,False"},"User Menu Custom List ":{"⿻ User Menu Custom List Items#427954:6":"S"},"User Menu":{"✏️ User Name#282907:0":"T:Alex Morgan","✏️ 1st Subline#282907:3":"T:alex.morgan@example.com","✏️ 2nd Subline#282907:6":"T:Delivery Manager","Action Button#330471:0":"B:true","✏️ 3rd Subline#422064:0":"T:Primary Employment","⿻ Custom Menu List Items Cozy#427954:0":"S","⿻ Custom Menu List Items Compact#427954:3":"S","Form Factor":"V:Compact|Compact,Cozy","Header Content Area":"V:False|True,False"},"AI Split Menu Button":{},"AI Menu Button":{},"AI Button":{},"AI Prompt Input":{},"AI Rich Text Editor":{},"AI Text Area":{},"AI Input":{},"Wizard Page Header":{"Size":"V:XL 1440px|XL 1440px,L 1024px,M 834px,Dialog Wizard,Review Header"},".base/Wizard Step":{"State":"V:Current|Future,Current,Complete","Final Step":"V:False|False,True"}};
// ── glue for SAP Bridge v2: own token, own health check, same makeLink / makeBuild ──
async function msaPair() {
  token = null;
  const r = await api('/pair');
  if (r.status === 200 && r.json && r.json.token) { token = r.json.token; await figma.clientStorage.setAsync('makeFigmaToken', token); }
  return r.status;
}
// ask the SAP bridge to start the Make bridge (node …/make-figma/ctl.js start); true when it is up
async function makeEnsure() {
  try {
    const tok = await figma.clientStorage.getAsync('sapBridgeToken'); if (!tok) return false;
    const base = globalThis.__sapBridgeBase || 'http://localhost:41778';
    const r = await Promise.race([fetch(base + '/make/ensure?token=' + encodeURIComponent(tok), { method: 'POST', body: '{}' }), new Promise(function (_, no) { setTimeout(function () { no(new Error('t')); }, 15000); })]);
    return r.status === 200;
  } catch (_) { return false; }
}
// find the Make bridge: all candidate ports in parallel (each cut after 800 ms); remembers the port that answers
async function makeFind() {
  const all = await Promise.all(MAKE_PORTS.map(function (p) { return fetchT('http://localhost:' + p + '/health', {}, 800, true).then(function (r) { r.port = p; return r; }); }));
  const hit = all.filter(function (r) { return r.json && r.json.app === 'make-figma-bridge'; })[0];
  if (hit) { BASE = 'http://localhost:' + hit.port; return hit; }
  return all[0];   // 41779: nothing, or another program
}
async function msaReady() {
  if (!token) token = (await figma.clientStorage.getAsync('makeFigmaToken')) || null;
  let h = await makeFind();
  if (h.status === 0 && (await makeEnsure())) h = await makeFind();   // not running: start it for the user, then go on
  if (h.status === 0) return { ok: false, down: true, error: 'The Make bridge is not running and could not be started by itself. Press “Start Make bridge”. Or: ' + makeCtlText('start') };
  if (!h.json || h.json.app !== 'make-figma-bridge') return { ok: false, error: 'Port 41779 is used by another program (' + ((h.json && h.json.app) || 'no answer') + ').' };
  const paired = 'The Make bridge is paired with another plugin. Free it once, then send again: ' + makePairText();
  if (!token) {
    const st = await msaPair();
    if (!token) return { ok: false, error: st === 409 ? paired : 'Could not pair with the Make bridge.' };
  } else {
    const t = await api('/make/job?jobId=none');            // a stale token is answered with 401
    if (t.status === 401) { await figma.clientStorage.setAsync('makeFigmaToken', ''); token = null; const st2 = await msaPair(); if (!token) return { ok: false, error: st2 === 409 ? paired : 'Could not pair with the Make bridge.' }; }
  }
  if (!h.json.extension) return { ok: false, error: 'The Chrome extension "Make → SAP" is not connected. Open Chrome, reload the extension in chrome://extensions and keep Chrome open.' };
  return { ok: true, extVersion: h.json.extVersion || '' };
}
async function msaLink(url) { const r = await msaReady(); if (!r.ok) { makeSay(r.error, { ok: false, down: !!r.down }); return; } return makeLink(url); }

// ── audit: the built frame against the Make boxes (conv.trace: path in the tree + the Make box of each leaf) ──
async function makeAudit(frameId, conv) {
  const res = { differences: 0, fixable: 0, items: [] };
  lastAudit = { frameId: frameId, fixes: [] };
  try {
    const frame = await figma.getNodeByIdAsync(frameId), tr = conv && conv.trace, tree = conv && conv.tree;
    if (!frame || !Array.isArray(tr) || !tree || !frame.absoluteBoundingBox) return res;
    const o = frame.absoluteBoundingBox, TYPES = { text: ['TEXT'], inst: ['INSTANCE'], icon: ['INSTANCE', 'FRAME', 'VECTOR', 'COMPONENT', 'BOOLEAN_OPERATION'], img: ['RECTANGLE', 'FRAME', 'INSTANCE', 'ELLIPSE'] };
    const rows = [];
    for (const t of tr) {
      if (!TYPES[t.k] || !Array.isArray(t.p) || !Array.isArray(t.b) || t.b.length < 4) continue;
      let node = frame, tn = tree, ok = true;
      for (const i of t.p) {
        if (!node.children || !node.children[i] || !tn.c || !tn.c[i]) { ok = false; break; }
        node = node.children[i]; tn = tn.c[i];
      }
      const ab = ok && node.absoluteBoundingBox;
      if (!ab) continue;
      const nameOk = !!tn.n && node.name === tn.n;
      if (!nameOk && TYPES[t.k].indexOf(node.type) < 0) continue;   // not the node the path points at: skip
      rows.push({ node: node, nameOk: nameOk, b: t.b, dx: ab.x - o.x - t.b[0], dy: ab.y - o.y - t.b[1], dw: ab.width - t.b[2], dh: ab.height - t.b[3] });
    }
    if (!rows.length) return res;
    const med = function (k) { const a = rows.map(function (r) { return r[k]; }).sort(function (x, y) { return x - y; }); return a[a.length >> 1]; };
    const mx = med('dx'), my = med('dy');   // the Make page may not start at 0,0: only the spread counts
    const diffs = [];
    for (const r of rows) {
      const dx = Math.round((r.dx - mx) * 10) / 10, dy = Math.round((r.dy - my) * 10) / 10, dw = Math.round(r.dw * 10) / 10, dh = Math.round(r.dh * 10) / 10;
      if (!(Math.abs(dw) > 2 || Math.abs(dh) > 2 || Math.abs(dx) > 3 || Math.abs(dy) > 3)) continue;
      let text, mag;
      if (Math.abs(dw) > 2) { text = r.node.name + ' — ' + Math.abs(Math.round(dw)) + ' px ' + (dw > 0 ? 'wider' : 'narrower') + ' than in Make'; mag = Math.abs(dw); }
      else if (Math.abs(dh) > 2) { text = r.node.name + ' — ' + Math.abs(Math.round(dh)) + ' px ' + (dh > 0 ? 'taller' : 'shorter') + ' than in Make'; mag = Math.abs(dh); }
      else { text = r.node.name + ' — off by ' + Math.round(dx) + ',' + Math.round(dy) + ' px'; mag = Math.abs(dx) + Math.abs(dy); }
      diffs.push({ id: r.node.id, text: text, mag: mag });
      if (r.nameOk && (r.node.type === 'TEXT' || r.node.type === 'INSTANCE') && Math.abs(dw) > 2 && Math.abs(dh) <= 2 && 'resize' in r.node && !r.node.locked) lastAudit.fixes.push({ nodeId: r.node.id, w: r.b[2] });
    }
    diffs.sort(function (x, y) { return y.mag - x.mag; });
    res.differences = diffs.length; res.fixable = lastAudit.fixes.length;
    res.items = diffs.slice(0, 6).map(function (d) { return { id: d.id, text: d.text }; });
  } catch (e) { E('makeAudit', e); res.differences = 0; res.fixable = 0; res.items = []; lastAudit.fixes = []; }
  return res;
}
async function sendMakeOptions(frameId, conv, link) {
  let a = { differences: 0, fixable: 0, items: [] };
  try { a = await makeAudit(frameId, conv); } catch (e) { E('sendMakeOptions', e); }
  send({ type: 'make-options', frameId: frameId, link: link || '', differences: a.differences, fixable: a.fixable, items: a.items });
}
async function makeFix(frameId) {
  const a = lastAudit;
  if (!a || a.frameId !== frameId || !a.fixes.length) { send({ type: 'make-fixed', fixed: 0, failed: 0 }); makeSay('Nothing to fix.', { ok: true }); return; }
  let fixed = 0, failed = 0;
  for (const f of a.fixes) {
    try {
      const n = await figma.getNodeByIdAsync(f.nodeId);
      if (!n || !('resize' in n)) { failed++; continue; }
      try { if ('layoutSizingHorizontal' in n) n.layoutSizingHorizontal = 'FIXED'; } catch (e) { E('makeFix sizing', e); }
      if (n.type === 'TEXT' && n.textAutoResize === 'WIDTH_AND_HEIGHT') n.textAutoResize = 'HEIGHT';
      n.resize(f.w, n.height);
      fixed++;
    } catch (e) { E('makeFix', e); failed++; }
  }
  a.fixes = [];
  send({ type: 'make-fixed', fixed: fixed, failed: failed });
  makeSay('Fixed ' + fixed + ' difference(s).' + (failed ? ' ' + failed + ' could not be fixed.' : ''), { ok: true });
}

// ── re-sync: read the same Make link again; the new frame replaces the old one (and its popups) or stands beside it ──
async function applyResync(newId, popIds) {
  const ctx = resyncCtx; resyncCtx = null;
  if (!ctx || ctx.mode !== 'replace') return;
  const nf = await figma.getNodeByIdAsync(newId); if (!nf) return;
  const keep = new Set([newId].concat(popIds));
  for (const id of ctx.ids) {
    if (keep.has(id)) continue;
    try { const n = await figma.getNodeByIdAsync(id); if (n) n.remove(); } catch (e) { E('applyResync remove', e); }
  }
  lastBuildIds.delete(ctx.id);
  if (nf.parent && nf.parent.id === ctx.parentId) {   // same place, popups move with it
    const dx = ctx.x - nf.x, dy = ctx.y - nf.y;
    nf.x += dx; nf.y += dy;
    for (const id of popIds) { try { const n = await figma.getNodeByIdAsync(id); if (n) { n.x += dx; n.y += dy; } } catch (e) { E('applyResync move', e); } }
  }
  nf.name = ctx.name;
}
async function makeResync(m) {
  if (treeBusy || makeLinkBusy) { makeSay('Busy — wait for the running build.'); return; }
  const url = String((m && m.link) || '').trim();
  if (!url) { makeSay('This frame has no Make link. Paste the link and send it again.', { ok: false }); return; }
  const mode = m && m.mode === 'replace' ? 'replace' : 'beside';
  try {
    let old = null; try { old = await figma.getNodeByIdAsync(String((m && m.frameId) || '')); } catch (e) { E('makeResync', e); }
    resyncCtx = (old && mode === 'replace') ? { id: old.id, x: old.x, y: old.y, name: old.name, parentId: old.parent ? old.parent.id : '', mode: mode, ids: [old.id].concat(lastBuildIds.get(old.id) || []) } : null;
    await msaLink(url);
  } finally { resyncCtx = null; }
}
// state of the Make bridge for the health report
async function makeStatus() {
  const h = await makeFind(), j = h.json;
  if (h.status === 0) return { state: 'down' };
  if (!j || j.app !== 'make-figma-bridge') return { state: 'other', what: (j && j.app) || 'no answer' };
  if (!token) token = (await figma.clientStorage.getAsync('makeFigmaToken')) || null;
  let other = false;
  if (j.paired) { if (!token) other = true; else { const t = await api('/make/job?jobId=none'); if (t.status === 401) other = true; } }
  return { state: 'up', port: h.port, paired: !!j.paired, other: other, ext: !!j.extension, extVersion: j.extVersion || '' };
}
return {
  link: msaLink,
  fix: makeFix,
  resync: makeResync,
  status: makeStatus,
  ensure: makeEnsure,
  busy: function () { return treeBusy || makeLinkBusy; },
  info: function () { return { runtimeVer: RUNTIME_VER, convKB: Math.round(String(MAKE_CONVERT).length / 1024) }; },
};
})();
// <<MAKESA END>>
