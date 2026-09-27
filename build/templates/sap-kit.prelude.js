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
      const opts = inst.mainComponent.parent && inst.mainComponent.parent.type === 'COMPONENT_SET'
        ? inst.mainComponent.parent.componentPropertyDefinitions[real].variantOptions : [];
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
  const f = figma.createAutoLayout(dir, { name: o.name || 'Container', itemSpacing: typeof o.gap === 'number' ? o.gap : 0 });
  f.fills = []; f.strokesIncludedInLayout = false;   // a 1px card border must not push the content in (seen: cards +2px, sidebar +4px)
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
