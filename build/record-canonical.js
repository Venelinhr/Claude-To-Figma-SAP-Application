#!/usr/bin/env node
/**
 * record-canonical.js — Library write-back for the Canonical Pattern Library (RULE 31 · Gap 4).
 *
 * When a build is confirmed ("perfect" / "bravo" / "exactly"), this makes the confirmation
 * MECHANICAL instead of prose: it appends a row to the reuse-outcomes-ledger AND adds a Tier 2
 * entry to canonical-index.json — so the library actually grows and the learning loop is real.
 *
 * Usage:
 *   node build/record-canonical.js \
 *     --node "804:44859" --name "Purchase Orders" --width 320 --file "p7zm5EMBk5DRRZdxNeJ4f5" \
 *     --base "shipped-outage-list" --level 1 --score 94 --outcome "Bravo"
 *
 * --width is REQUIRED (added AUDIT-V2 P10, 2026-09-12): canonicals resolve live by name+width,
 * never by a stored node id — ids drift (see canonical-index.json → `resolution`). Read the
 * node's width live via use_figma/get_metadata before calling this; do not guess it.
 *
 * Effects (idempotent — re-running with the same --node updates rather than duplicates):
 *   1. Adds/updates a Tier 2 entry in skill/references/canonical-index.json
 *   2. Appends a row to .claude/memory/reuse-outcomes-ledger.md
 *
 * Both files are gitignored (personal). Run after the user confirms a build.
 */

const fs = require('fs');
const path = require('path');

const PROJ = path.join(__dirname, '..');
const INDEX_PATH = path.join(PROJ, 'skill', 'references', 'canonical-index.json');
const LEDGER_PATH = path.join(PROJ, '.claude', 'memory', 'reuse-outcomes-ledger.md');

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) a[k.slice(2)] = argv[++i];
  }
  return a;
}

function requireArg(a, key) {
  if (!a[key]) { console.error(`Missing required --${key}`); process.exit(1); }
  return a[key];
}

function main() {
  const a = parseArgs(process.argv);
  const node = requireArg(a, 'node');
  const name = requireArg(a, 'name');
  const file = a.file || 'p7zm5EMBk5DRRZdxNeJ4f5';
  const base = a.base || null;
  // width is required (not optional) since AUDIT-V2 P10: canonicals resolve live by
  // name+width, never by a stored node id (ids drift — see canonical-index.json →
  // `resolution`). A Tier 2 entry without a width can never be matched by that query.
  const widthRaw = requireArg(a, 'width');
  const width = parseFloat(widthRaw);
  if (Number.isNaN(width)) { console.error(`✗ --width must be a number, got "${widthRaw}"`); process.exit(1); }
  const level = a.level || '?';
  const score = a.score || '—';
  const outcome = a.outcome || 'confirmed';
  const date = a.date || new Date().toISOString().slice(0, 10); // caller may pass --date to avoid nondeterminism

  // ── 1. Update the PERSONAL Tier 2 file (gitignored — never the tracked index) ──
  const TIER2_PATH = path.join(PROJ, 'skill', 'references', 'canonical-index-tier2.json');
  let t2doc;
  try { t2doc = JSON.parse(fs.readFileSync(TIER2_PATH, 'utf8')); }
  catch (e) { t2doc = { version: '1.0', description: 'Personal Tier 2 canonicals (confirmed builds in YOUR Figma file). Gitignored — never shipped.', tier2: [] }; }
  t2doc.tier2 = t2doc.tier2 || [];

  const entry = {
    id: node,
    name,
    width,
    figmaNode: node,
    fileKey: file,
    approvedDate: date,
    confirmedBy: outcome,
    inheritsFrom: base,
  };

  const existingIdx = t2doc.tier2.findIndex(e => e.id === node || e.figmaNode === node);
  if (existingIdx >= 0) {
    t2doc.tier2[existingIdx] = { ...t2doc.tier2[existingIdx], ...entry };
    console.log(`• Updated existing Tier 2 entry: ${node}`);
  } else {
    t2doc.tier2.push(entry);
    console.log(`✓ Added Tier 2 canonical: ${name} (${node})`);
  }
  fs.writeFileSync(TIER2_PATH, JSON.stringify(t2doc, null, 2) + '\n');

  // ── 2. Append to reuse-outcomes-ledger.md ──
  let ledger = '';
  try { ledger = fs.readFileSync(LEDGER_PATH, 'utf8'); } catch (e) { /* create below */ }

  const row = `| ${date} | ${name} | ${base || 'none'} | ${level} | ${score}${typeof score === 'string' && score !== '—' && !score.includes('%') ? '%' : ''} | ✅ ${outcome} |`;

  if (ledger.includes('| Date | Screen Built |')) {
    // Insert after the last existing table row
    const lines = ledger.split('\n');
    let lastRow = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\| \d{4}-\d{2}-\d{2} \|/.test(lines[i])) lastRow = i;
    }
    if (lastRow >= 0) { lines.splice(lastRow + 1, 0, row); }
    else { lines.push(row); }
    fs.writeFileSync(LEDGER_PATH, lines.join('\n'));
  } else {
    // Ledger missing table — append a minimal one
    fs.writeFileSync(LEDGER_PATH, ledger +
      '\n\n| Date | Screen Built | Base Canonical | Reuse Level | Similarity | Outcome |\n' +
      '|------|-------------|----------------|-------------|------------|---------|\n' + row + '\n');
  }
  console.log(`✓ Ledger row added: ${name} · Level ${level} · ${score} · ${outcome}`);
  console.log('\nLibrary grew — next similar request will score against this canonical.');
}

if (require.main === module) main();
