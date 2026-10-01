// sketch.test.js — the plan wireframe must keep a perfectly straight right border (user rule 2026-10-01), phone and desktop,
// even when the text holds emoji, symbols, wide CJK or an ellipsis character.
'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('node:fs'), path = require('node:path');
const { sketch, scene, layerTree } = require('../build/sketch.js');

// the box part of a line = everything before the zone note (` A  Name`) that follows the closing border
const boxLines = out => out.split('\n').filter(l => /^[┌├└│]/.test(l)).map(l => [...l.split(/(?<=[┐┤┘│]) [A-Z]  /)[0]].length);
const EVIL = '🚚 ⌖ ⛟ Straße 日本語 … – € "q" ░▓◇ 👍🏽';
const tree = (w, kids) => ({ n: 'T', w, h: 600, d: 'V', c: kids });
const t = (n, s) => ({ n, k: 't', t: s, s: 'HH', w: 80, h: 16, st: 'MediumText/LHAuto/Regular', bg: 'sapTitleColor' });

for (const w of [390, 1440]) {
  test(`sketch ${w}px: every box line closes at the same column, hostile text included`, () => {
    const T = tree(w, [
      { n: 'Row', d: 'H', s: 'FH', w, h: 30, c: [{ n: 'ic', k: 'ic', ic: 'travel-itinerary', s: 'HH', w: 16, h: 16 }, t('a', EVIL), t('b', EVIL)] },
      { n: 'Row 2', d: 'H', s: 'FH', w, h: 30, c: [t('c', EVIL), { n: 'Status', k: 'i', cp: 'Object Status', pr: { Semantic: 'Error' }, tx: { Text: EVIL }, s: 'HH', w: 90, h: 16 }, t('d', EVIL)] },
      { n: 'Card A', d: 'V', bc: 'sapList_BorderColor', s: 'FX', w: 200, h: 80, c: [t('e', EVIL), t('f', EVIL)] },
    ]);
    const out = sketch(T), cut = boxLines(out);
    assert.ok(cut.length > 4);
    assert.strictEqual(new Set(cut).size, 1, 'box lines have different lengths: ' + [...new Set(cut)].join(','));
    assert.ok(!/[🚚⌖⛟日本語░▓◇👍🏽…]/u.test(out), 'an unsafe character reached the box');
  });
}

test('desktop gold tree: straight border, and every layer line ends with a level marker', () => {
  const f = path.join(__dirname, '..', 'knowledge', 'gold', 'trees', 'po-list-report-1440.tree.json');
  const T = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.strictEqual(new Set(boxLines(sketch(T))).size, 1);
  assert.match(layerTree(T), /← L1/);
});

test('desktop scene view: a clean rectangle (every line the same width), no unsafe characters, one letter per zone', () => {
  const f = path.join(__dirname, '..', 'knowledge', 'gold', 'trees', 'po-list-report-1440.tree.json');
  const T = JSON.parse(fs.readFileSync(f, 'utf8'));
  T.c[0].tx = { Text: 'Straße 日本語 🚚 …' };
  const { text, zones } = scene(T);
  assert.strictEqual(new Set(text.split('\n').map(l => [...l].length)).size, 1);
  assert.ok(!/[🚚日本語…]/u.test(text));
  assert.ok(zones.length >= 4 && new Set(zones.map(z => z.letter)).size === zones.length);
});
