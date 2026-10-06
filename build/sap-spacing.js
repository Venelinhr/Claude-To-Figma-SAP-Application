#!/usr/bin/env node
// sap-spacing.js — puts a tree on the SAP Horizon spacing scale (2026-10-05, user: "measure correct, place the correct spacing, gaps").
//   node build/sap-spacing.js <tree.json>      rewrites the file in place, prints one summary line
// Source: SAP wiki "30 - Spacing (Horizon)": sapContent_Space_Tiny 0.5rem · Small 1rem · Medium 2rem · Large 3rem;
// content container space S 1rem · M/L 2rem · XL 3rem (breakpoints 600 / 1024 / 1440). 0.25rem is the label-to-field step.
// Every padding and gap snaps to 0 · 4 · 8 · 16 · 24 · 32 · 48, larger offsets to the 8 px grid; the page edge gets the breakpoint's content space.
const fs = require('fs');
const f = process.argv[2];
if (!f) { console.log('usage: node build/sap-spacing.js <tree.json>'); process.exit(64); }
const T = JSON.parse(fs.readFileSync(f, 'utf8')), R = T.tree || T;
const snap = v => v <= 1 ? 0 : v <= 5 ? 4 : v <= 11 ? 8 : v <= 19 ? 16 : v <= 27 ? 24 : v <= 39 ? 32 : v <= 55 ? 48 : Math.round(v / 8) * 8;
let n = 0;
(function walk(o) {
  if (Array.isArray(o.p)) o.p = o.p.map(v => { const s = snap(v); if (s !== v) n++; return s; });
  if (typeof o.g === 'number') { const s = snap(o.g); if (s !== o.g) n++; o.g = s; }
  if (!o.k && o.d === 'H' && (o.c || []).length >= 2 && !o.g) { o.g = 8; n++; }          // items in a row never touch: sapContent_Space_Tiny
  if (o.k === 'i' && /^(Button|Range Slider|Slider|Input|Select|Search Field|Combo Box|Date Picker|Text Area)$/.test(o.cp) && (o.w || 0) >= 200) o.s = 'F' + String(o.s || 'HH').slice(1);   // a wide call-to-action / input control fills its column (never wider than it)
  (o.c || []).forEach(walk);
})(R);
const W = R.w || 1366, edge = W < 600 ? 16 : W < 1440 ? 32 : 48;   // sapContent_Space_S / M,L / XL
const page = (R.c || []).length === 1 && !R.c[0].k ? R.c[0] : R;     // the one top stack carries the page padding
page.p = [16, edge, 16, edge];                                       // sapContent_Margin_Medium: 1rem top/bottom, the breakpoint space left/right
if (page.d === 'H' && (page.c || []).length >= 2) page.g = edge;    // side panel ↔ content: the content space
fs.writeFileSync(f, JSON.stringify(T));
console.log(`SAP SPACING ${n} paddings/gaps on the Horizon scale (0·4·8·16·24·32·48) · page edge 16/${edge}px (${W < 600 ? 'S' : W < 1024 ? 'M' : W < 1440 ? 'L' : 'XL'})`);
