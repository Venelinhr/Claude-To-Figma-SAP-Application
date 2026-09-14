#!/usr/bin/env node
// check-registry-freshness.js — warn-only staleness scan over knowledge/components/registry/*.json.
//
// The live SAP Web UI Kit changes daily (per the sap-figma-community MCP tool description), but
// nothing in the build path ever re-checks whether a registry entry's `lastValidated` date is
// still recent. This script is the mechanical version of that check: it never blocks a build
// (staleness alone doesn't mean the data is wrong), it just surfaces entries past the threshold
// so a human can decide whether to re-verify via `/sap-registry-update <ComponentName>`.
//
// Usage: node build/check-registry-freshness.js [--days N] [--json]
// Exit code is always 0 — this is advisory, never a gate.

const fs = require('fs');
const path = require('path');

const REGISTRY_DIR = path.join(__dirname, '..', 'knowledge', 'components', 'registry');
const DEFAULT_THRESHOLD_DAYS = 30;

function parseArgs(argv) {
  const args = { days: DEFAULT_THRESHOLD_DAYS, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--days') args.days = Number(argv[++i]) || DEFAULT_THRESHOLD_DAYS;
    else if (argv[i] === '--json') args.json = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = Date.now();
  const thresholdMs = args.days * 24 * 60 * 60 * 1000;

  if (!fs.existsSync(REGISTRY_DIR)) {
    console.error(`Registry dir not found: ${REGISTRY_DIR}`);
    process.exit(0);
  }

  const files = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json'));
  const stale = [];
  const missing = [];

  for (const f of files) {
    let json;
    try {
      json = JSON.parse(fs.readFileSync(path.join(REGISTRY_DIR, f), 'utf8'));
    } catch (e) {
      continue; // malformed JSON is a different problem, not this script's job
    }
    const name = json.componentName || f.replace(/\.json$/, '');
    const dateStr = json.lastValidated;
    if (!dateStr) {
      missing.push(name);
      continue;
    }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      missing.push(name);
      continue;
    }
    const ageMs = now - d.getTime();
    if (ageMs > thresholdMs) {
      stale.push({ name, lastValidated: dateStr, ageDays: Math.round(ageMs / 86400000) });
    }
  }

  stale.sort((a, b) => b.ageDays - a.ageDays);

  if (args.json) {
    console.log(JSON.stringify({ thresholdDays: args.days, staleCount: stale.length, stale, missingLastValidated: missing }, null, 2));
    process.exit(0);
  }

  if (stale.length === 0 && missing.length === 0) {
    console.log(`✓ Registry freshness: all ${files.length} components validated within ${args.days} days.`);
    process.exit(0);
  }

  if (stale.length > 0) {
    console.log(`⚠ Registry freshness: ${stale.length}/${files.length} components not re-validated in >${args.days} days (advisory only, not a build blocker):`);
    for (const s of stale.slice(0, 20)) {
      console.log(`  ${s.name} — last validated ${s.lastValidated} (${s.ageDays}d ago)`);
    }
    if (stale.length > 20) console.log(`  … and ${stale.length - 20} more. Run with --json for the full list.`);
    console.log(`Re-verify a component against the live SAP Web UI Kit with: /sap-registry-update <ComponentName>`);
  }
  if (missing.length > 0) {
    console.log(`⚠ ${missing.length} registry entries have no valid lastValidated date: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', …' : ''}`);
  }
  process.exit(0); // advisory only — never fail the build on staleness
}

main();
