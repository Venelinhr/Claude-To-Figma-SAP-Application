// dump-layout.use_figma.js — READ-ONLY. An approved build → a v5 LAYOUT TREE (compact JSON) that
// build/render.js rebuilds 1:1 in any file. Set ROOT. Save the returned JSON as knowledge/gold/trees/<name>.tree.json.
// Node keys: n name · d 'H'|'V' (auto-layout; none = children placed by xy) · g gap · p [t,r,b,l] · a align
// (primary+counter: M min, C center, X max, S space-between) · s sizing in parent: F fill, H hug, X fixed (e.g. 'FH')
// · w h · xy [x,y] · abs 1 · r radius · bw stroke weight (n or [t,r,b,l]) · bc stroke token · bg fill token · img hash
// · clip 1 · c children. Leaves: k 't' text {t, st style, bg token, wrap} · 'i' SAP component {cp, pr} ·
// 'ic' icon {ic, bg} · 'r' rectangle · 'v' vector {svg, bg, bc}.
const ROOT = '435:9066';
const root = await figma.getNodeByIdAsync(ROOT);
const vc = {}, sc = {};
async function tok(bv) {
  if (!bv || !bv.id) return null;
  if (!(bv.id in vc)) { const v = await figma.variables.getVariableByIdAsync(bv.id); vc[bv.id] = v ? v.name.split('/').pop() : null; }
  return vc[bv.id];
}
async function paintTok(paints) {
  if (!Array.isArray(paints) || !paints.length || paints[0].visible === false) return undefined;
  const p = paints[0];
  if (p.type === 'IMAGE') return { img: p.imageHash };
  if (p.type !== 'SOLID') return undefined;
  const t = await tok(p.boundVariables && p.boundVariables.color);
  if (t) return t;
  const c = p.color, h = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return 'RAW#' + h(c.r) + h(c.g) + h(c.b);
}
const A = { MIN: 'M', CENTER: 'C', MAX: 'X', SPACE_BETWEEN: 'S', BASELINE: 'C' };
const r1 = x => Math.round(x * 10) / 10;
function propsOf(inst) {
  const out = {};
  for (const [k, v] of Object.entries(inst.componentProperties || {})) {
    if (v.type === 'INSTANCE_SWAP') continue;                      // resolved below by name
    out[k.replace(/#.*$/, '')] = v.type === 'BOOLEAN' ? v.value : String(v.value);
  }
  return out;
}
async function walk(n, parentAL) {
  const o = { n: n.name };
  const SZ = { FIXED: 'X', FILL: 'F', HUG: 'H' };
  if (parentAL && 'layoutSizingHorizontal' in n) o.s = SZ[n.layoutSizingHorizontal] + SZ[n.layoutSizingVertical];
  if (n.layoutPositioning === 'ABSOLUTE') o.abs = 1;
  if (!parentAL || o.abs) o.xy = [r1(n.x), r1(n.y)];
  o.w = r1(n.width); o.h = r1(n.height);
  if (n.type === 'TEXT') {
    o.k = 't'; o.t = n.characters;
    if (n.textStyleId && typeof n.textStyleId === 'string') { if (!(n.textStyleId in sc)) { const s = await figma.getStyleByIdAsync(n.textStyleId); sc[n.textStyleId] = s ? s.name : null; } o.st = sc[n.textStyleId]; }
    const f = await paintTok(n.fills); if (f) o.bg = f;
    if (n.textAutoResize === 'HEIGHT') o.wrap = 1;
    if (n.textAlignHorizontal !== 'LEFT') o.ta = n.textAlignHorizontal[0];
    return o;
  }
  if (n.type === 'INSTANCE') {
    const mc = n.mainComponent, set = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
    const pr = propsOf(n);
    const swaps = {};
    for (const [k, v] of Object.entries(n.componentProperties || {})) if (v.type === 'INSTANCE_SWAP') {
      const c = await figma.getNodeByIdAsync(v.value);
      if (c) swaps[k.replace(/#.*$/, '')] = (c.parent && c.parent.type === 'COMPONENT_SET' ? c.parent.name : c.name).split('/').pop();
    }
    if (!Object.keys(pr).length && !Object.keys(swaps).length && n.width <= 40 && n.height <= 40) {   // an icon
      o.k = 'ic'; o.ic = (set || mc).name.split('/').pop();
      const vec = n.findOne(v => (v.type === 'VECTOR' || v.type === 'BOOLEAN_OPERATION') && v.fills && v.fills.length);
      if (vec) { const f = await paintTok(vec.fills); if (f) o.bg = f; }
      return o;
    }
    o.k = 'i'; o.cp = (set || mc).name; o.pr = Object.assign(pr, swaps);
    return o;
  }
  if (n.type === 'RECTANGLE' || n.type === 'ELLIPSE') {
    o.k = 'r'; const f = await paintTok(n.fills); if (f) o.bg = f;
    if (n.type === 'ELLIPSE') o.el = 1;
    if (typeof n.cornerRadius === 'number' && n.cornerRadius) o.r = n.cornerRadius;
    return o;
  }
  if (['VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'POLYGON', 'STAR'].includes(n.type)) {
    o.k = 'v'; o.svg = await n.exportAsync({ format: 'SVG_STRING' });
    const f = await paintTok(n.fills); if (f) o.bg = f;
    const s = await paintTok(n.strokes); if (s) o.bc = s;
    return o;
  }
  const al = n.layoutMode && n.layoutMode !== 'NONE';               // FRAME / GROUP / COMPONENT: a container
  if (al) {
    o.d = n.layoutMode[0];
    if (n.itemSpacing) o.g = n.itemSpacing;
    const p = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft];
    if (p.some(Boolean)) o.p = p.every(x => x === p[0]) ? p[0] : p;
    const a = A[n.primaryAxisAlignItems] + A[n.counterAxisAlignItems]; if (a !== 'MM') o.a = a;
  }
  if (typeof n.cornerRadius === 'number' && n.cornerRadius) o.r = n.cornerRadius;
  if ('strokes' in n && n.strokes.length) {
    o.bc = await paintTok(n.strokes);
    o.bw = typeof n.strokeWeight === 'number' ? n.strokeWeight : [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight];
  }
  if ('fills' in n) { const f = await paintTok(n.fills); if (f && f.img) o.img = f.img; else if (f) o.bg = f; }
  if (n.clipsContent) o.clip = 1;
  if ('children' in n && n.children.length) { o.c = []; for (const ch of n.children) if (ch.visible !== false) o.c.push(await walk(ch, al)); }
  return o;
}
const tree = await walk(root, false);
delete tree.xy;
return JSON.stringify(tree);
