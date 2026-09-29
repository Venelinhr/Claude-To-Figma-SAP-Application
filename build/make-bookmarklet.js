#!/usr/bin/env node
// make-bookmarklet.js — builds the "Make → SAP" bookmark: the live probe + the kit variable names inline. No server needed.
//   node build/make-bookmarklet.js      writes bridge-out/make-bookmarklet.html (drag the link to the bookmarks bar)
// Click it on the running Make app (open the preview in its own tab) → the design is copied to the clipboard →
// Figma → SAP Bridge plugin → Cmd+V. The plugin converts and builds it (no node, no bridge, no model).
'use strict';
const fs = require('fs'), path = require('path');
const kit = require('../knowledge/live/kit.json');
const names = [...new Set(Object.keys(kit.vars).map(n => n.split('/').pop()))];
const probe = fs.readFileSync(path.join(__dirname, 'templates/make-probe.browser.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim().replace(/;\s*$/, '');
const code = `(async()=>{try{if(!window.sap||!window.sap.ui){var fs=[].slice.call(document.querySelectorAll('iframe')).filter(function(f){return f.src&&/^https?:/.test(f.src)}).sort(function(a,b){return b.offsetWidth*b.offsetHeight-a.offsetWidth*a.offsetHeight});if(fs.length){window.open(fs[0].src,'_blank');alert('Make → SAP: the app runs inside a frame on this page. I opened it in a new tab. Go to that tab and click the bookmark again.')}else alert('Make → SAP: this page is not a SAPUI5 app. Open the Make preview in its own tab (Share / Preview link) and click again.');return}window.__MAKE_CFG=${JSON.stringify({ clip: 1, vars: names })};const r=await ${probe};alert(r.reply==='copied'?'Make → SAP: copied '+r.n+' controls ('+r.kb+' KB). Now open Figma → SAP Bridge → press Cmd+V.':r.reply==='select-and-copy'?'Make → SAP: press Cmd+C on the selected box, then paste into SAP Bridge.':'Make → SAP: '+r.reply)}catch(e){alert('Make → SAP failed: '+e.message)}})()`;
const href = 'javascript:' + encodeURIComponent(code);
const out = path.join(__dirname, '..', 'bridge-out', 'make-bookmarklet.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `<!doctype html><meta charset=utf-8><title>Make → SAP</title><body style="font:16px system-ui;padding:32px;max-width:680px;line-height:1.5"><h2>Make → SAP</h2>
<p><b>Once:</b> drag this to your bookmarks bar →  <a href="${href.replace(/"/g, '&quot;')}" style="padding:8px 16px;background:#0064d9;color:#fff;border-radius:8px;text-decoration:none">Make → SAP</a></p>
<ol><li>Open the Make app in its own tab (Share / Preview link).</li><li>Click the bookmark. It says how many controls it copied.</li><li>In Figma open <b>SAP Bridge</b> and press <b>Cmd+V</b>. The SAP frame appears next to your content.</li></ol>
<p style="color:#556b82">Works for apps built from SAPUI5 controls. Anything it cannot map is listed in the plugin, never dropped silently.</p></body>`);
console.log(`bookmark ${(href.length / 1024).toFixed(1)} KB → ${out}`);
