// v6-tools.js — the Figma Agent's v6 toolbox. Stored IN the Figma file (key v6tools) by the SAP Bridge plugin; build/v6pack.js prepends
//   const OPSM  (build/ops.js: applyOps)   const SK  (build/sketch.js: sketch, scene, layerTree)
// This is the BODY of  new AsyncFunction('G', 'NAME', 'OPS', 'MODE', body)  — the Agent types only the 4-line wrapper (see the skill).
//   G(key)  = figma.root.getSharedPluginData('sapfiori', key)
//   MODE 'list'   → the gold screens in this file (name · size · title · what it shows)
//         'names' → the layers of gold NAME that the ops may change (exact layer names, kit props, inner texts, clone-able repeats)
//         'plan'  → apply OPS, return the v6 plan drawing (wireframe + layers) — nothing is built
//         'build' → apply OPS, build the frame with the stored runtime, return { result:{nodeId,WARN,made}, plan, layers }; remembers the tree (key last_<nodeId>)
//         'check' → NAME = a node id built by 'build': in-Figma gate — missing layers · wrong kit parts · wrong texts · raw colours · text without a style · size. Numbers only
// OPS = { title?, set:[…], remove:[…], clone:[…] } — content only, the same language as build/reskin.js. No geometry.
const AF = Object.getPrototypeOf(async () => {}).constructor;
const KEYS = figma.root.getSharedPluginDataKeys('sapfiori').filter(k => k.indexOf('gold_') === 0);
const load = name => { const k = 'gold_' + name; return KEYS.indexOf(k) >= 0 ? JSON.parse(G(k)) : null; };
if (MODE === 'list') {
  return KEYS.map(k => { const g = JSON.parse(G(k)); return k.slice(5) + ' | ' + g.tree.w + 'x' + g.tree.h + ' | ' + g.title + ' | ' + g.texts.slice(0, 10).join(' · '); }).join('\n') || 'NO GOLD IN THIS FILE — open SAP Bridge once (it installs v6)';
}
if (MODE === 'check') {
  const raw = G('last_' + String(NAME).replace(':', '_')), node = await figma.getNodeByIdAsync(String(NAME));
  if (!raw || !node) return 'NO BUILD RECORD for ' + NAME + ' (only frames made by MODE build can be checked)';
  const T = JSON.parse(raw), bad = [];
  const flat = []; (function w(o, path) { flat.push({ o, path }); (o.c || []).forEach(c => w(c, path + '/' + c.n)); })(T, T.n);
  const byName = {}; node.findAll(() => true).forEach(n => { (byName[n.name] = byName[n.name] || []).push(n); }); byName[node.name] = [node];
  let want = 0, kit = 0, kitOk = 0, texts = 0, textsOk = 0;
  for (const { o } of flat) {
    if (o.abs && !byName[o.n]) continue;
    want++;
    const hit = (byName[o.n] || [])[0];
    if (!hit) { bad.push('MISSING layer "' + o.n + '"'); continue; }
    if (o.k === 'i') { kit++; let m = ''; try { const mc = hit.mainComponent; m = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : ''; } catch (e) {} if (hit.type === 'INSTANCE' && m === o.cp) kitOk++; else bad.push('NOT KIT "' + o.n + '" want ' + o.cp + ' got ' + (hit.type === 'INSTANCE' ? m : hit.type)); }
    if (o.k === 't') { texts++; if (hit.type === 'TEXT' && hit.characters === String(o.t)) textsOk++; else bad.push('TEXT "' + o.n + '" want ' + JSON.stringify(o.t) + ' got ' + JSON.stringify(hit.characters)); if (hit.type === 'TEXT' && !hit.textStyleId) bad.push('NO TEXT STYLE "' + o.n + '"'); }
  }
  const raw2 = node.findAll(n => n.type === 'FRAME' && n.fills && n.fills.length && n.fills.some(f => f.type === 'SOLID' && !(n.boundVariables && n.boundVariables.fills))).map(n => n.name);
  raw2.slice(0, 8).forEach(n => bad.push('RAW FILL (no colour variable) "' + n + '"'));
  const sizeBad = Math.abs(node.width - T.w) > 2 || Math.abs(node.height - T.h) > 2;
  if (sizeBad) bad.push('SIZE ' + Math.round(node.width) + 'x' + Math.round(node.height) + ' want ' + T.w + 'x' + T.h);
  return { layers: (want - bad.filter(b => b.indexOf('MISSING') === 0).length) + '/' + want, kit: kitOk + '/' + kit, texts: textsOk + '/' + texts, problems: bad.length, pass: bad.length === 0, lines: bad.slice(0, 12) };
}
const g = load(NAME);
if (!g) return 'NO GOLD "' + NAME + '" — use one of: ' + KEYS.map(k => k.slice(5)).join(', ');
const T = g.tree;
if (MODE === 'names') {
  const sig = o => [o.k || 'f', o.cp || '', o.d || '', (o.c || []).map(sig).join(',')].join('|');
  const out = [];
  (function walk(o, d) {
    const pad = '  '.repeat(d);
    if (o.k === 't') out.push(pad + '"' + o.n + '" text: ' + JSON.stringify(o.t));
    else if (o.k === 'i') out.push(pad + '"' + o.n + '" ' + o.cp + (o.pr ? ' pr=' + JSON.stringify(o.pr) : '') + (o.tx ? ' tx=' + JSON.stringify(o.tx) : ''));
    else if (o.k === 'ic') out.push(pad + '"' + o.n + '" icon ' + o.ic);
    else if (o.k !== 'r') out.push(pad + o.n);
    const kids = o.c || [];
    for (let i = 0; i < kids.length; i++) {
      let j = i; while (j + 1 < kids.length && sig(kids[j + 1]) === sig(kids[i])) j++;
      walk(kids[i], d + 1);
      if (j > i) out.push(pad + '  ↑ repeats x' + (j - i + 1) + ' (clone "' + kids[i].n + '" times:' + (j - i) + ' to add more; remove by name)');
      i = j;
    }
  })(T, 0);
  return out.join('\n');
}
if (OPS && OPS.title) T.n = String(OPS.title);
const r = OPSM.applyOps(T, OPS || {});
if (r.errs.length) return { errors: r.errs };
const plan = T.w > 600 ? SK.scene(T).text : SK.sketch(T), layers = SK.layerTree(T);
if (MODE === 'plan') return { plan, layers };
const rt = G('v6rt');
if (!rt) return 'INSTALL FIRST — open SAP Bridge once in this file';
const result = await new AF('KIT', 'TREE', rt + '\nreturn await BUILD_TREE(TREE);')(g.kit, T);
if (result && result.nodeId) { try { for (const k of figma.root.getSharedPluginDataKeys('sapfiori')) if (k.indexOf('last_') === 0) figma.root.setSharedPluginData('sapfiori', k, '');   // keep only the newest record
  figma.root.setSharedPluginData('sapfiori', 'last_' + String(result.nodeId).replace(':', '_'), JSON.stringify(T)); } catch (e) {} }
return { result, plan, layers };
