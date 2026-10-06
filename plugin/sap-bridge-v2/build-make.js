#!/usr/bin/env node
// plugin-v2/build-make.js — puts the standalone "Make → Figma" engine (converter + explorer results → SAP kit frames) into SAP Bridge v2's code.js
// as ONE self-contained block (MAKESA). It talks to the standalone Make bridge (port 41779) and the Chrome extension "Make → SAP" — never to the
// Claude bridge (41778), and it does not touch the Claude / Agent build engine. Run again after the standalone plugin is rebuilt:
//   node plugin-v2/build-make.js
'use strict';
// DEPRECATED (2026-10-05): this script regenerates the WHOLE Make block (glue + api copy) of code.js from the standalone plugin and would erase the audit
// work (health report, re-sync, fix differences, timeouts). Use  node plugin-v2/sync-make-engine.js  instead. Run this only with --force.
if (!process.argv.includes('--force')) { console.error('build-make.js is deprecated: use node plugin-v2/sync-make-engine.js (or pass --force)'); process.exit(2); }
const fs = require('fs'), path = require('path');
const SA = process.env.MAKE_SA || '/Users/C5408360/Downloads/SAP-Figma-Make-to-Figma-Screen/make-figma/plugin/code.js';
const V2 = path.join(__dirname, 'code.js');
const src = fs.readFileSync(SA, 'utf8');
const a = src.indexOf("const BASE = 'http://localhost:41779'"), b = src.indexOf('// ─── start ───');
if (a < 0 || b < 0) throw new Error('markers not found in ' + SA);
let seg = src.slice(a, b);
// The standalone engine carries an OLDER kit runtime: Button / Input component sets of the kit throw "Component set has existing errors" on
// componentProperties. SAP Bridge v2's own runtime already has the fix (kit-definition fallback). Swap the old setP / I for the fixed ones and
// give the engine the kit definitions (KIT.d) — read from the kit, nothing guessed.
{
  const v2all = fs.readFileSync(V2, 'utf8'), mk = v2all.indexOf('// <<MAKESA>>'), v2pre = mk >= 0 ? v2all.slice(0, mk) : v2all;
  const f0 = v2pre.indexOf('function _kitDefs'), f1 = v2pre.indexOf('function sub(inst, layerName)');
  if (f0 < 0 || f1 < f0) throw new Error('fixed kit runtime not found in v2 code.js (run: node build/plugin-bundle.js in the Claude project, then copy code.js)');
  const fixed = v2pre.slice(f0, f1);
  const o0 = seg.indexOf('async function setP(inst, props) {'), o1 = seg.indexOf('function sub(inst, layerName)');
  if (o0 < 0 || o1 < o0) throw new Error('old setP / I not found in the standalone engine');
  // ROOT CAUSE: setP guards only its first componentProperties read; its later componentPropertyDefinitions / setProperties calls read the same
  // property inside Figma and throw "in get_componentProperties: Component set … has existing errors" on the broken Button / Input sets.
  // So the WHOLE setP falls back to the kit definitions when any step hits a broken set.
  let fixedSafe = fixed.replace('async function setP(inst, props, kitName) {', 'async function _setPRaw(inst, props, kitName) {') +
    "async function setP(inst, props, kitName) {\n" +
    "  try { return await _setPRaw(inst, props, kitName); }\n" +
    "  catch (e) { if (!/existing errors|componentPropert/i.test(String(e && e.message))) throw e;\n" +
    "    return _setViaKit(inst, kitName || inst.getPluginData('kit') || inst.name, props); }\n}\n";
  if (!fixedSafe.includes('async function _setPRaw(')) throw new Error('setP wrapper failed');
  { const t0 = "const target = set.children.find(c => { const m = {}; for (const part of c.name.split(',')) { const [k, v] = part.split('='); if (v !== undefined) m[k.trim()] = v.trim(); }\n      return Object.keys(want).every(k => (m[k] || '').toLowerCase() === want[k].toLowerCase()); });";
    if (!fixedSafe.includes(t0)) throw new Error('variant search not found in the fixed runtime');
    fixedSafe = fixedSafe.replace(t0,
      "let target = null, bestScore = -1;                                      // exact match first; else the nearest variant that has every REQUESTED value (e.g. Initials + colour 6 when the current colour 'Image' does not exist for Initials)\n" +
      "    for (const c of set.children) { const m = {}; for (const part of c.name.split(',')) { const [k, v] = part.split('='); if (v !== undefined) m[k.trim()] = v.trim(); }\n" +
      "      if (!Object.keys(variants).every(k => (m[k] || '').toLowerCase() === String(variants[k]).toLowerCase())) continue;\n" +
      "      const sc = Object.keys(want).filter(k => (m[k] || '').toLowerCase() === String(want[k]).toLowerCase()).length; if (sc > bestScore) { bestScore = sc; target = c; } }"); }
  // _setViaKit set texts BEFORE it swapped the variant: the Input's typed-text layer exists only in its "Content = Typed Text" variant, so the
  // text found no layer. Now: variants first (Content = Typed Text added when a typed text is given and the kit offers it), then texts / booleans / icons.
  fixedSafe = fixedSafe.replace('async function _setViaKit(inst, kitName, props) {', 'async function _setViaKitCore(inst, kitName, props) {') +
    "async function _setViaKit(inst, kitName, props) {\n" +
    "  const defs = _kitDefs(kitName);\n" +
    "  if (defs) { const byNorm = {}; for (const k of Object.keys(defs)) byNorm[_norm(k)] = k; const vs = {}; let typed = false;\n" +
    "    for (const [n, v] of Object.entries(props)) { const real = defs[n] ? n : byNorm[_norm(n)]; if (!real) continue; if (defs[real].type === 'VARIANT') vs[real] = v; if (/typed text/i.test(real) && v) typed = true; }\n" +
    "    if (typed && defs.Content && defs.Content.type === 'VARIANT' && !vs.Content && defs.Content.variantOptions.includes('Typed Text')) vs.Content = 'Typed Text';\n" +
    "    if (Object.keys(vs).length) await _setViaKitCore(inst, kitName, vs); props = Object.assign({}, props, vs); }\n" +
    "  return _setViaKitCore(inst, kitName, props);\n}\n";
  seg = seg.slice(0, o0) + fixedSafe + seg.slice(o1);
  // two more unguarded reads: a nested instance (e.g. the Input inside a Multi Combobox) and the Shell Bar avatar
  const n0 = 'const defs = si.componentProperties, p = {};';
  if (!seg.includes(n0)) throw new Error('nested-instance code not found in the standalone engine');
  seg = seg.replace(n0, "let defs; try { defs = si.componentProperties; } catch (e1) { await _setViaKit(si, nm, pr); continue; }   // broken kit set (Input / Button): set it from the kit definitions\n        const p = {};");
  const v0 = "const ik = Object.keys(av.componentProperties).find(k => k.startsWith('✏️ Initials#'));";
  if (seg.includes(v0)) seg = seg.replace(v0, "let ik; try { ik = Object.keys(av.componentProperties).find(k => k.startsWith('✏️ Initials#')); } catch (e2) { ik = null; }");

  // Side Navigation items and the Shell Bar avatar are broken sets in some files too: fall back to bound layers + a direct variant swap.
  const rep = (from, to) => { if (!seg.includes(from)) throw new Error('engine text not found: ' + from.slice(0, 60)); seg = seg.replace(from, to); };
  rep("  const done = [];\n  for (let i = 0; i < kids0.length; i++) {", "  const done = [], broken = [];\n  for (let i = 0; i < kids0.length; i++) {");
  rep("    } catch (e) { WARN.push('nav item ' + i + ': text skipped (' + String(e.message).slice(0, 60) + ')'); }",
      "    } catch (e) { if (/existing errors/i.test(String(e.message))) broken.push(i); else WARN.push('nav item ' + i + ': text skipped (' + String(e.message).slice(0, 60) + ')'); }");
  rep("    catch (e) { WARN.push('nav item ' + i + ': swap skipped (' + String(e.message).slice(0, 50) + ')'); }\n  }\n}",
      "    catch (e) { WARN.push('nav item ' + i + ': swap skipped (' + String(e.message).slice(0, 50) + ')'); }\n  }\n" +
      "  for (const i of broken) { try { await _tick(); await _navFix(nth(i), items[i], iconId[i]); } catch (e) { WARN.push('nav item ' + i + ': ' + String(e.message).slice(0, 60)); } }   // broken set\n}\n" +
      "async function _navFix(it, d, iconNodeId) {          // a broken Navigation Item set: variant by name, text and icon through their bound layers\n" +
      "  if (!it) return; const mc = await it.getMainComponentAsync(), set = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;\n" +
      "  if (set) { const parse = nm => { const m = {}; for (const p of nm.split(',')) { const [k, v] = p.split('='); if (v !== undefined) m[k.trim()] = v.trim(); } return m; };\n" +
      "    const want = Object.assign(parse(mc.name), { Selected: d.selected ? 'True' : 'False' }); if ('Expanded' in want) want.Expanded = 'True';\n" +
      "    const tg = set.children.find(c => { const m = parse(c.name); return Object.keys(want).every(k => !(k in m) || m[k].toLowerCase() === String(want[k]).toLowerCase()); });\n" +
      "    if (tg && tg.id !== mc.id) { it.swapComponent(tg); await _tick(); } }\n" +
      "  const t = _boundLayer(it, '✏️ Text', 'TEXT'); if (t) { for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName); t.characters = String(d.text || ''); }\n" +
      "  if (iconNodeId) { const l = _boundLayer(it, 'Icon', 'INSTANCE_SWAP'), c = await figma.getNodeByIdAsync(iconNodeId); if (l && l.type === 'INSTANCE' && c) l.swapComponent(c.type === 'COMPONENT_SET' ? c.defaultVariant : c); }\n" +
      "}");
  rep("  try { av.setProperties({ Type: 'Initials', Color: '6', ...(ik ? { [ik]: initials } : {}) }); } catch (e) { WARN.push('avatar: ' + e.message); }",
      "  try { av.setProperties({ Type: 'Initials', Color: '6', ...(ik ? { [ik]: initials } : {}) }); }\n" +
      "  catch (e) { if (/existing errors/i.test(String(e.message))) { try { await _setViaKit(av, 'Avatar', { Type: 'Initials', Color: '6', Initials: initials }); } catch (e3) { WARN.push('avatar: ' + e3.message); } } else WARN.push('avatar: ' + e.message); }");
}
if (!/async function makeLink/.test(seg) || !/async function makeBuild/.test(seg)) throw new Error('makeLink / makeBuild missing in the standalone plugin');

const KIT_JSON = process.env.KIT_JSON || '/Users/C5408360/Downloads/Claude-To-Figma-SAP-Application/knowledge/live/kit.json';
const kitc = JSON.parse(fs.readFileSync(KIT_JSON, 'utf8')).components || {}, D = {};
for (const [nm, v] of Object.entries(kitc)) D[nm] = v.props || {};
const KITD = JSON.stringify(D);
const START = '// <<MAKESA>> generated by plugin-v2/build-make.js — do not edit by hand';
const END = '// <<MAKESA END>>';
const block = `${START}
const MAKESA = (function () {
${seg}
// ── kit definitions (KIT.d) for the fallback — straight from the kit file ──
FULL_KIT.d = ${KITD};
// ── glue for SAP Bridge v2: own token, own health check, same makeLink / makeBuild ──
const MAKE_CTL = '/Users/C5408360/Downloads/Figma Make /make-figma/ctl.js';   // the copy whose bridge is running
async function msaPair() {
  token = null;
  const r = await api('/pair');
  if (r.status === 200 && r.json && r.json.token) { token = r.json.token; await figma.clientStorage.setAsync('makeFigmaToken', token); }
  return r.status;
}
async function msaReady() {
  if (!token) token = (await figma.clientStorage.getAsync('makeFigmaToken')) || null;
  const h = await api('/health');
  if (h.status === 0) return { ok: false, error: 'The Make bridge is not running. Start it once: node ' + MAKE_CTL + ' start' };
  if (!h.json || h.json.app !== 'make-figma-bridge') return { ok: false, error: 'Port 41779 is used by another program.' };
  if (!token) {
    const st = await msaPair();
    if (!token) return { ok: false, error: st === 409 ? 'The Make bridge is paired with another plugin. Free it once, then send again: rm "/Users/C5408360/Downloads/Figma Make /make-figma/.pair.json"' : 'Could not pair with the Make bridge.' };
  } else {
    const t = await api('/make/job?jobId=none');            // a stale token is answered with 401
    if (t.status === 401) { await figma.clientStorage.setAsync('makeFigmaToken', ''); token = null; const st2 = await msaPair(); if (!token) return { ok: false, error: st2 === 409 ? 'The Make bridge is paired with another plugin. Free it once, then send again: rm "/Users/C5408360/Downloads/Figma Make /make-figma/.pair.json"' : 'Could not pair with the Make bridge.' }; }
  }
  if (!h.json.extension) return { ok: false, error: 'The Chrome extension "Make → SAP" is not connected. Open Chrome, reload the extension in chrome://extensions and keep Chrome open.' };
  return { ok: true, extVersion: h.json.extVersion || '' };
}
return {
  link: async function (url) { const r = await msaReady(); if (!r.ok) { makeSay(r.error, { ok: false }); return; } return makeLink(url); },
};
})();
${END}
`;

let v2 = fs.readFileSync(V2, 'utf8');
const i = v2.indexOf(START), j = v2.indexOf(END);
if (i >= 0 && j > i) v2 = v2.slice(0, i) + block.trimEnd() + v2.slice(j + END.length);
else v2 = v2.trimEnd() + '\n\n' + block;
new Function(v2);                                              // syntax check only (nothing runs)
fs.writeFileSync(V2, v2);
console.log(`MAKESA block ${(block.length / 1024).toFixed(0)} KB → ${V2}`);
