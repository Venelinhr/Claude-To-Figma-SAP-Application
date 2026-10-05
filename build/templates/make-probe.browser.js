// make-probe.browser.js — run in the browser page that renders a SAPUI5 app (a Figma Make app, local replica or preview).
// Walks every live UI5 control and records: class, non-default props, box (root-relative px), computed flex layout,
// colours, text metrics — and resolves each SAP theme variable named in vars.json to its live value.
// The result is POSTed to <origin>/save?name=make-dump.json (build/make-serve.py) and returned as a summary.
// Ground truth for build/make2tree.js: what the app REALLY is (control classes + states), not a picture of its DOM.
(async () => {
  const sap = window.sap, El = sap.ui.require('sap/ui/core/Element');
  const controls = [];
  El.registry.forEach(c => controls.push(c));
  const dom = c => (c.getDomRef ? c.getDomRef() : null);
  const host = document.getElementById('root') || document.body, rootEl = El.closestTo(host.firstElementChild) || controls.filter(c => dom(c) && !c.getParent())[0];
  const R0 = dom(rootEl).getBoundingClientRect();
  const r1 = v => Math.round(v * 10) / 10;
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return ''; const p = m[1].split(',').map(x => parseFloat(x)); if (p.length > 3 && p[3] === 0) return ''; return '#' + p.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); };
  // a control the user cannot see: CSS-hidden (display / visibility / opacity, own or inherited) or pushed out of an overflow-clipping ancestor sideways
  // (OverflowToolbar clones, off-screen measuring copies) — the converter drops it, so it can never stretch a frame
  const hiddenIn = d => {
    try { if (d.checkVisibility && !d.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return true; } catch (e) {}
    const b = d.getBoundingClientRect();
    for (let a = d.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (getComputedStyle(a).overflowX === 'visible') continue;
      const r = a.getBoundingClientRect(); if (b.left >= r.right - 0.5 || b.right <= r.left + 0.5) return true;
    }
    return false;
  };
  const items = [];
  const idx = new Map();
  for (const c of controls) {
    const d = dom(c); if (!d) continue;
    const b = d.getBoundingClientRect(); if (b.width < 0.5 && b.height < 0.5) continue;
    const cs = getComputedStyle(d), meta = c.getMetadata(), props = {};
    for (const [n, p] of Object.entries(meta.getAllProperties())) {
      let v; try { v = c.getProperty(n); } catch (e) { continue; }
      if (v === p.defaultValue || v === null || v === undefined || v === '' || (typeof v === 'object')) continue;
      if (['busy', 'busyIndicatorDelay', 'busyIndicatorSize', 'visible', 'blocked', 'fieldGroupIds'].includes(n)) continue;
      props[n] = v;
    }
    const it = {
      id: c.getId(), cls: meta.getName(), parent: c.getParent() ? c.getParent().getId() : null, props,
      css: (c.aCustomStyleClasses || []).slice(),
      box: [r1(b.left - R0.left), r1(b.top - R0.top), r1(b.width), r1(b.height)],
      st: {
        display: cs.display, dir: cs.flexDirection, wrap: cs.flexWrap, ai: cs.alignItems, jc: cs.justifyContent, gap: cs.columnGap + '/' + cs.rowGap,
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat),
        mar: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat),
        bg: rgb(cs.backgroundColor), fg: rgb(cs.color), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, ta: cs.textAlign,
        bw: parseFloat(cs.borderTopWidth) || 0, bc: rgb(cs.borderTopColor), br: parseFloat(cs.borderTopLeftRadius) || 0,
        sh: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 80),
        grow: cs.flexGrow, shrink: cs.flexShrink,
      },
    };
    // text metrics come from the innermost text element (the control's wrapper reports the container's font)
    const te = d.querySelector('bdi,h1,h2,h3,h4,h5,h6,span,label') || d, tcs = getComputedStyle(te);
    it.tx = { fs: parseFloat(tcs.fontSize), fw: parseInt(tcs.fontWeight, 10), fg: rgb(tcs.color), ff: tcs.fontFamily.split(',')[0].replace(/["']/g, ''), lh: parseFloat(tcs.lineHeight) || 0 };
    if (hiddenIn(d)) it.hid = 1;
    it.aria = { sel: d.getAttribute('aria-selected'), chk: d.getAttribute('aria-checked'), cls: (d.className && d.className.baseVal === undefined ? String(d.className) : '').slice(0, 160) };
    if (c.getSelectedItem) { try { const si = c.getSelectedItem(); if (si && si.getText) it.selText = si.getText(); } catch (e) {} }
    if (c.getSelectedItem && !it.selText) { try { const si = sap.ui.getCore().byId(c.getAssociation('selectedItem')); if (si && si.getText) it.selText = si.getText(); } catch (e) {} }
    items.push(it); idx.set(it.id, d);
  }
  // a control whose parent was not dumped (FormElement, FormContainer, …: no DOM of their own) is attached to the nearest dumped ancestor
  { const have = new Set(items.map(x => x.id)), byId = new Map(controls.map(x => [x.getId(), x]));
    items.forEach(it => { if (!it.parent || have.has(it.parent)) return; let p = it.parent, n = 0;
      while (p && !have.has(p) && n++ < 40) { const pc = byId.get(p) || sap.ui.getCore().byId(p); p = pc && pc.getParent && pc.getParent() ? pc.getParent().getId() : null; }
      if (p && have.has(p)) it.parent = p; }); }
  // DOM order = reading order; children of one parent keep it
  items.sort((a, b) => (idx.get(a.id).compareDocumentPosition(idx.get(b.id)) & 4 ? -1 : 1));
  items.forEach((it, i) => { it.i = i; });
  let vars = {};
  try {
    const cfg0 = window.__MAKE_CFG || {}, names = cfg0.vars || await (await fetch('vars.json')).json(), rs = getComputedStyle(document.documentElement);
    for (const n of names) { const v = rs.getPropertyValue('--' + n).trim(); if (v) vars[n] = v; }
  } catch (e) { vars = { error: String(e) }; }
  const out = { origin: location.href, title: document.title, ui5: sap.ui.version, theme: sap.ui.getCore().getConfiguration().getTheme(), compact: document.body.classList.contains('sapUiSizeCompact'),
    viewport: [innerWidth, innerHeight], root: rootEl.getId(), n: items.length, controls: items, vars };
  // images the app shows (airline logos etc.) → data URIs, so the plugin can place them without any server
  out.imageData = {};
  for (const it of items) if (it.cls === 'sap.m.Image' && it.props.src && !out.imageData[it.props.src]) {
    try { const r = await fetch(new URL(it.props.src, location.href)); const b = await r.blob();
      out.imageData[it.props.src] = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); } catch (e) { /* cross-origin: the plugin leaves an empty logo frame */ }
  }
  const cfg = window.__MAKE_CFG || {}, text = JSON.stringify(out);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) {}
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:8px;top:8px;width:60vw;height:120px;z-index:2147483647;box-shadow:0 0 0 3px #0064d9';
    document.body.appendChild(ta); ta.focus(); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    if (ok) { ta.remove(); return 'copied'; }
    return 'select-and-copy';
  };
  if (cfg.ret) return { dump: text };                       // headless fetch (build/make-fetch.js): hand the dump back to the caller
  let reply = '';
  if (cfg.post) { try { reply = await (await fetch(cfg.post, { method: 'POST', body: text })).text(); } catch (e) { reply = 'POST failed: ' + e; } }
  else if (cfg.clip) reply = await copy();
  else { try { reply = await (await fetch('/save?name=make-dump.json', { method: 'POST', body: text })).text(); } catch (e) { reply = 'save failed: ' + e; } }
  return { reply, n: items.length, kb: Math.round(text.length / 1024), images: Object.keys(out.imageData).length, vars: Object.keys(vars).length, root: out.root, ui5: out.ui5 };
})()
