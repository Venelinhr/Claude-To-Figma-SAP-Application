// make-probe-dom.browser.js — generic DOM reader for Make apps that are NOT classic SAPUI5 (React, UI5 Web Components, plain HTML).
// Runs inside the page (or one frame of it). Returns { dump } — JSON text: { kind:'dom', viewport, page, vars, nodes[] }.
// A node: i (index), p (parent index), t (tag), r [x,y,w,h] in page px, tx (own text), cs (computed style), at (attributes of custom
// elements + a few standard ones), svg (markup of small inline svg), img (src of an <img>), wc (text of a UI5 web component).
// A UI5 web component (ui5-*) is kept as ONE node with its attributes; its shadow DOM is not entered (the converter maps the tag to a kit part).
(async () => {
  const cfg = window.__MAKE_CFG || {};
  try { await document.fonts.ready; } catch (_) {}
  const SKIP = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, NOSCRIPT: 1, HEAD: 1, TITLE: 1, TEMPLATE: 1 };
  const nodes = [], MAX = 4000;
  const sx = window.scrollX || 0, sy = window.scrollY || 0;
  const rnd = v => Math.round(v * 100) / 100;
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const transparent = c => !c || c === 'transparent' || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c);
  function style(cs) {
    const o = {};
    if (!transparent(cs.backgroundColor)) o.bg = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== 'none') o.bgi = cs.backgroundImage.slice(0, 200);
    o.color = cs.color; o.fs = cs.fontSize; o.fw = cs.fontWeight; o.ff = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    if (cs.lineHeight !== 'normal') o.lh = cs.lineHeight;
    if (cs.textAlign !== 'start' && cs.textAlign !== 'left') o.ta = cs.textAlign;
    if (cs.textTransform !== 'none') o.tt = cs.textTransform;
    if (cs.textDecorationLine !== 'none') o.td = cs.textDecorationLine;
    if (cs.fontStyle !== 'normal') o.fst = cs.fontStyle;
    if (cs.letterSpacing !== 'normal' && cs.letterSpacing !== '0px') o.ls = cs.letterSpacing;
    o.d = cs.display;
    if (/flex/.test(cs.display)) { o.fd = cs.flexDirection; if (cs.gap && cs.gap !== 'normal') o.gap = cs.gap; o.jc = cs.justifyContent; o.ai = cs.alignItems; if (cs.flexWrap !== 'nowrap') o.wrap = cs.flexWrap; }
    if (/grid/.test(cs.display)) { o.gtc = cs.gridTemplateColumns; if (cs.gap && cs.gap !== 'normal') o.gap = cs.gap; }
    const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(v => parseFloat(v) || 0);
    if (pad.some(Boolean)) o.pad = pad;
    const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(v => parseFloat(v) || 0);
    if (bw.some(Boolean)) { o.bw = bw; o.bc = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor]; o.bs = cs.borderTopStyle; }
    if (cs.borderTopLeftRadius !== '0px') o.rad = cs.borderTopLeftRadius;
    if (cs.boxShadow !== 'none') o.sh = cs.boxShadow.slice(0, 200);
    if (cs.opacity !== '1') o.op = cs.opacity;
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') o.ov = cs.overflowX + '/' + cs.overflowY;
    if (cs.position !== 'static') o.pos = cs.position;
    if (cs.flexGrow !== '0') o.fg = cs.flexGrow;
    return o;
  }
  function attrs(el, tag) {
    const a = {}, names = el.getAttributeNames ? el.getAttributeNames() : [], custom = tag.indexOf('-') > -1;
    for (const n of names) {
      if (n === 'style') continue;
      if (n === 'class' && !custom) continue;
      if (custom || /^(type|role|aria-label|aria-checked|aria-selected|title|alt|placeholder|value|href|checked|disabled|name|for|id)$/.test(n)) a[n] = String(el.getAttribute(n)).slice(0, 300);
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) a.value = String(el.value || '').slice(0, 200);
    return Object.keys(a).length ? a : undefined;
  }
  function walk(el, parent) {
    if (nodes.length >= MAX || SKIP[el.tagName]) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const r = el.getBoundingClientRect(), tag = el.tagName.toLowerCase();
    const hidden = cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
    if (!hidden && (r.width > 0 || r.height > 0 || el.childNodes.length)) {
      const n = { i: nodes.length, p: parent, t: tag, r: [rnd(r.left + sx), rnd(r.top + sy), rnd(r.width), rnd(r.height)], cs: style(cs) };
      const own = [].slice.call(el.childNodes).filter(c => c.nodeType === 3).map(c => clean(c.textContent)).filter(Boolean).join(' ');
      if (own) n.tx = own.slice(0, 400);
      const at = attrs(el, tag); if (at) n.at = at;
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) n.sc = [el.scrollWidth, el.scrollHeight];
      if (tag === 'svg') { const m = el.outerHTML; if (m.length < 6000) n.svg = m; nodes.push(n); return; }
      if (tag === 'img') { n.img = el.currentSrc || el.src || ''; if (n.img.length > 200000) n.img = ''; nodes.push(n); return; }
      nodes.push(n);
      if (/^ui5-/.test(tag)) { n.wc = clean(el.textContent).slice(0, 300); return; }
      for (const c of el.children) walk(c, n.i);
      return;
    }
    for (const c of el.children) walk(c, parent);
  }
  walk(document.body, -1);
  const vars = {}, bs = getComputedStyle(document.body);
  for (const n of (cfg.vars || [])) { const v = bs.getPropertyValue('--' + n).trim(); if (v) vars[n] = v; }
  const dump = { kind: 'dom', url: location.href, title: document.title, viewport: [innerWidth, innerHeight], page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], theme: (document.body.className + ' ' + document.documentElement.className).slice(0, 200), vars, nodes };
  return { dump: JSON.stringify(dump) };
})()
