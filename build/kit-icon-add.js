#!/usr/bin/env node
// kit-icon-add.js <name>=<componentKey> [...] — add SAP icons that knowledge/live/kit.json (61 Iconography icons) lacks, after finding
// them in the SAP Web UI Kit library with the Figma MCP: search_design_system(query:'<name>', includeLibraryKeys:['<SAP Web UI Kit key>']).
// The full SAP icon set lives in that library; once added here an icon is valid everywhere (door, kit.js pack, the build).
'use strict';
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '../knowledge/live/icons-extra.json');
const pairs = process.argv.slice(2).map(a => a.split('=')).filter(p => p.length === 2 && /^[a-z0-9-]+$/.test(p[0]) && /^[0-9a-f]{40}$/.test(p[1]));
if (!pairs.length) { console.log('usage: node build/kit-icon-add.js <name>=<40-hex component key> [...]'); process.exit(64); }
const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const added = [];
for (const [n, k] of pairs) { if (!d.icons[n] || d.icons[n].key !== k) { d.icons[n] = { key: k, desc: 'SAP Web UI Kit' }; added.push(n); } }
fs.writeFileSync(F, JSON.stringify(d, null, 1) + '\n');
console.log(`ICONS +${added.length} (${added.join(', ') || 'already there'}) · ${Object.keys(d.icons).length} extra icons`);
