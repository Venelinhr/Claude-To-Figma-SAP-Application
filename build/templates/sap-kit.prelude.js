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
  const f = figma.createAutoLayout(dir, { name: o.name || 'Container', itemSpacing: typeof o.gap === 'number' ? o.gap : 0 });
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
