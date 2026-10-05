#!/usr/bin/env node
// measure.js <job dir> — the DESIGN lane's measurement sheet (2026-10-04, user rule: "the first image measurement is the key moment to
// identify floor plan and components (states, variables, text style, size)"). The script measures; Claude designs.
//   reads   <job>/see-ref/spec.json (true scale: see.py ui_width) + <job>/marks.json (the numbers on ref-marked.png)
//   writes  <job>/measure.txt          frame, zones, every text / icon / component / divider with its box, style and colour token
//           <job>/design.expect.json   "m:T5" / "m:7" / "text:<content>" → measured box — layout-sim checks the designed tree against it
'use strict';
const fs = require('fs'), path = require('path');
const job = process.argv[2];
if (!job) { console.log('usage: node build/measure.js <job dir>'); process.exit(64); }
const spec = JSON.parse(fs.readFileSync(path.join(job, 'see-ref/spec.json'), 'utf8'));
const mk = JSON.parse(fs.readFileSync(path.join(job, 'marks.json'), 'utf8'));
const R = v => Math.round(v), bx = b => `${R(b[0])},${R(b[1])} ${R(b[2])}×${R(b[3])}`, key = b => b.join(',');
const f = spec.frame, L = [], E = {};
const boxes = [], lines = [];
(function w(o) {
  if (o.type === 'box') boxes.push(o);
  if (o.type === 'divider' || o.type === 'separator') lines.push(o);
  (o.children || []).forEach(w);
})({ children: spec.sections });
const tokOf = {}; (function w(o) { if (o.box) tokOf[key(o.box)] = o; (o.children || []).forEach(w); })({ children: spec.sections });

L.push(`FRAME ${f.w}×${f.h} (true screen scale, measured from SAP 14 px body text) · page ${f.fill || 'sapBackgroundColor'}`);
L.push('');
L.push('ZONES (blue letters on ref-marked.png) — the floorplan regions');
for (const z of mk.zones || []) { const o = tokOf[key(z.box)] || {}; L.push(`  ${z.id}  ${bx(z.box)}${o.fill ? ' · fill ' + o.fill + (o.fill_hex ? ' ' + o.fill_hex : '') : ''}${o.border && o.border !== 'none' ? ' · border ' + o.border : ''}${o.radius ? ' · radius ' + o.radius : ''}`); }
L.push('');
L.push('BOXES (cards, bars, fields, pills)');
for (const o of boxes) L.push(`  ${bx(o.box)} · fill ${o.fill || '-'}${o.fill_hex ? ' ' + o.fill_hex : ''}${o.border && o.border !== 'none' ? ' · border ' + o.border : ''}${o.radius ? ' · radius ' + o.radius : ''}${o.shadow ? ' · shadow' : ''}`);
for (const o of lines) L.push(`  line ${bx(o.box)} · ${o.token || ''}`);
L.push('');
L.push('TEXTS (green T#) — OCR text · measured SAP text style · colour token · box. The OCR can merge or misread: the PICTURE is the truth.');
for (const t of mk.texts || []) {
  const o = tokOf[key(t.box)] || {};
  L.push(`  ${t.id}  "${t.text}" · ${t.style || o.style || '?'}${o.measured ? ' (' + o.measured + ')' : ''} · ${o.token || '?'}${o.color ? ' ' + o.color : ''} · ${bx(t.box)}`);
  E['m:' + t.id] = t.box.map(R); if ((mk.texts || []).filter(q => q.text === t.text).length === 1) E['text:' + t.text] = t.box.map(R);   // a text said twice has no unique key: give the node its "m" id
}
L.push('');
L.push('ICONS (pink numbers; icons-sheet.png shows each one enlarged) — box · colour · first guess');
for (const i of mk.icons || []) { const o = tokOf[key(i.box)] || {}; L.push(`  ${i.id}  ${bx(i.box)} · ${o.token || '?'}${o.color ? ' ' + o.color : ''}${i.icon ? ' · guess ' + i.icon : ''}`); E['m:' + i.id] = i.box.map(R); }
if ((mk.components || []).length) {
  L.push('');
  L.push('COMPONENTS the detector guessed (orange C#) — often wrong; decide from the picture');
  for (const c of mk.components) L.push(`  ${c.id}  ${c.component} "${c.text || ''}" · ${bx(c.box)}`);
}
fs.writeFileSync(path.join(job, 'measure.txt'), L.join('\n') + '\n');
fs.writeFileSync(path.join(job, 'design.expect.json'), JSON.stringify(E));
console.log(`MEASURE ${f.w}×${f.h} · ${(mk.zones || []).length} zones · ${boxes.length} boxes · ${(mk.texts || []).length} texts · ${(mk.icons || []).length} icons → ${path.join(job, 'measure.txt')}`);
