#!/usr/bin/env node
// Merge knowledge/live/parts/*.json (written from build/templates/extract-kit-*.use_figma.js)
// into knowledge/live/kit.json — the single build-time source of truth for SAP Web UI Kit
// component keys, property keys, variant values, icons, variables and text styles.
// Refresh: re-run the 3 extract scripts on the kit (fileKey SILcWzK5uFghKun9jx6D7c), save parts, run this.
const fs = require('fs'), path = require('path');
const LIVE = path.join(__dirname, '..', 'knowledge', 'live'), P = path.join(LIVE, 'parts');
const rd = f => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8'));
const has = f => fs.existsSync(path.join(P, f));
const components = {};
const parts = re => fs.readdirSync(P).filter(f => re.test(f)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
for (const f of parts(/^components-\d+\.json$/))
  for (const c of rd(f)) {
    let name = c.name, i = 2;
    while (components[name]) name = `${c.name} (${c.page}${i > 2 ? ' ' + i : ''})`, i++;
    components[name] = { page: c.page, type: c.type, key: c.key, w: c.w, h: c.h, props: c.props };
  }
const vars = {};
for (const f of parts(/^vars-\d+\.json$/)) Object.assign(vars, rd(f));
const styles = has('styles.json') ? rd('styles.json') : {};
const icons = {};
for (const f of parts(/^icons-\d+\.json$/)) Object.assign(icons, rd(f));
const kit = {
  meta: { fileKey: 'SILcWzK5uFghKun9jx6D7c', extracted: new Date().toISOString().slice(0, 10),
    counts: { components: Object.keys(components).length, icons: Object.keys(icons).length, vars: Object.keys(vars).length,
      text: Object.keys(styles.text || {}).length, effects: Object.keys(styles.effects || {}).length },
    encoding: {
      props: 'T:<default text> | B:<bool default> | V:<default>|<options,...> | I:<default component key> <name> | S (slot)',
      vars: '<variable key>|<C=color F=float S=string B=bool>|<Morning Horizon (light) value or →alias>',
      text: '<style key>|<font family style>|<size>|<line height>' } },
  collections: styles.collections || [], components, icons, vars,
  text: styles.text || {}, effects: styles.effects || {}, paints: styles.paints || {} };
fs.writeFileSync(path.join(LIVE, 'kit.json'), JSON.stringify(kit));
console.log('kit.json', JSON.stringify(kit.meta.counts), (fs.statSync(path.join(LIVE, 'kit.json')).size / 1024).toFixed(0) + 'KB');
