#!/usr/bin/env node
/**
 * score-canonical.js — Deterministic similarity scorer for the Canonical Pattern Library (RULE 31).
 *
 * Reads skill/references/canonical-index.json and scores a build request against every canonical.
 * Replaces hand-computed prose scoring with a reproducible number — same input, same output, every time.
 *
 * Scoring (authoritative — matches canonical-similarity-rubric.md + SYSTEM_PROMPT RULE 31):
 *   Floorplan match : 50  (exact floorplan = 50, adjacent variant = 30, different = 0)
 *   Region overlap  : 30  (matched_regions / total_request_regions × 30)
 *   Component overlap: 20  (shared_components / total_request_components × 20)
 *   Total = 0–100. Threshold: >=85 Level 1 (clone direct) · 60–84 Level 2/3 (clone + delta) · <60 Level 5 (new)
 *
 * Usage:
 *   node build/score-canonical.js --floorplan "List Report" --regions ShellBar,DynamicPageTitle,ResponsiveTable --components ShellBar,Button,ResponsiveTable,ObjectStatus
 *   node build/score-canonical.js --json '{"floorplan":"List Report","regions":[...],"components":[...]}'
 *
 * Output: ranked JSON of matches with score breakdown + recommended reuse level.
 *
 * ⛔ RESOLUTION IS BY NAME + WIDTH, NEVER BY NODE ID (AUDIT-V2 §8.4 P10).
 * Every match carries `resolveBy:"name+width"`, the live-file query to run, and `hintNodeId`
 * (NON-AUTHORITATIVE). The id is a hint you must ASSERT against the live name+width before
 * `.clone()`. Why: this scorer used to rank "Outage List Overview" first with figNode
 * 750:174925; in the live file that id is "Schedule Operation — State D EndOnly", a 560×430
 * dialog — a Level-2 clone by id would have silently built a list report from a dialog.
 * Entries flagged `unverified:true` have NO trustworthy id at all: resolve them live or do not
 * clone them. See docs/NODE-ID-CONFLICTS.md.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'skill', 'references', 'canonical-index.json');

// ── Floorplan adjacency map — which floorplans count as "adjacent variant" (30 pts) ──
const ADJACENCY = {
  'List Report':   ['Worklist', 'Analytical List Page', 'Object Page'],
  'Worklist':      ['List Report', 'Analytical List Page'],
  'Object Page':   ['List Report', 'Dialog'],
  'Dialog':        ['Object Page', 'Log Panel', 'Card', 'Wizard'],
  'Log Panel':     ['Dialog'],
  'FCL':           ['FCL + SideNav', 'Master-Detail'],
  'FCL + SideNav': ['FCL', 'Master-Detail'],
  'Card':          ['Dialog'],
  'Wizard':        ['Dialog'],
  'SideNavigation':['FCL + SideNav'],
};

// ── Component name aliasing (2026-09-14 fix) ──────────────────────────────────
// overlapScore() used to be exact-string match only: norm('ObjectStatus') !==
// norm('Object Status'), so a VDI read that wrote the spaced-out form scored 0
// against a canonical that had the PascalCase form, even though it is the SAME
// component. This is spelling/spacing drift on ONE component, never a claim
// that two DIFFERENT components (e.g. ObjectStatus vs ObjectMarker — verified
// distinct in knowledge/components/registry/, different componentCategory) are
// interchangeable. Scope stays narrow on purpose: collapse whitespace/case so
// "Object Status", "object-status", "ObjectStatus" all key to the same alias
// bucket; do NOT invent cross-component synonyms.
const COMPONENT_ALIASES = {
  // canonical registry name -> extra surface forms VDI/free-text output uses
  ObjectStatus: ['object status', 'status'],
  ObjectNumber: ['object number'],
  ObjectAttribute: ['object attribute'],
  DynamicPageHeader: ['dynamic page header', 'page header'],
  DynamicPageTitle: ['dynamic page title', 'page title'],
  ResponsiveTable: ['responsive table', 'table'],
  SearchField: ['search field', 'search'],
  SegmentedButton: ['segmented button'],
  SideNavigation: ['side navigation', 'side nav'],
  IconTabBar: ['icon tab bar', 'tab bar'],
  FilterBar: ['filter bar'],
  DatePicker: ['date picker'],
  TimePicker: ['time picker'],
  CheckBox: ['checkbox', 'check box'],
};
const ALIAS_TO_CANONICAL = (() => {
  const map = new Map();
  for (const [canonicalName, aliases] of Object.entries(COMPONENT_ALIASES)) {
    const key = canonicalName.toLowerCase();
    map.set(key, key);
    for (const a of aliases) map.set(a.toLowerCase(), key);
  }
  return map;
})();

function norm(s) {
  const base = String(s || '').trim().toLowerCase();
  // Collapse hyphens/underscores/extra spaces to single spaces so "search-field",
  // "search_field", "search  field" all reach the same lookup key.
  const collapsed = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return ALIAS_TO_CANONICAL.get(collapsed) || collapsed;
}

function floorplanScore(requestFp, canonicalFp) {
  const r = norm(requestFp), c = norm(canonicalFp);
  if (!r || !c) return 0;
  if (r === c) return 50;                                   // exact
  const adj = (ADJACENCY[requestFp] || []).map(norm);
  if (adj.includes(c)) return 30;                           // adjacent variant
  // symmetric check
  const adjC = (ADJACENCY[canonicalFp] || []).map(norm);
  if (adjC.includes(r)) return 30;
  return 0;                                                 // different
}

function overlapScore(requestArr, canonicalArr, weight) {
  const req = (requestArr || []).map(norm).filter(Boolean);
  if (req.length === 0) return 0;
  const can = new Set((canonicalArr || []).map(norm));
  const matched = req.filter(x => can.has(x)).length;
  return (matched / req.length) * weight;
}

// P10: the live-file resolver. A canonical is identified by NAME + WIDTH, never by id.
const WIDTH_TOLERANCE_PX = 2;

function liveQuery(name, width) {
  if (!name) return null;
  const w = Number(width);
  if (!Number.isFinite(w)) {
    return `figma.currentPage.findAll(n => n.name === ${JSON.stringify(name)})  // ⚠ width unknown — confirm the match by hand`;
  }
  return `figma.currentPage.findAll(n => n.name === ${JSON.stringify(name)} && Math.abs(n.width - ${w}) <= ${WIDTH_TOLERANCE_PX})`;
}

function scoreCanonical(request, canonical) {
  const fp = floorplanScore(request.floorplan, canonical.floorplan);
  const rg = overlapScore(request.regions, canonical.regions, 30);
  const cp = overlapScore(request.components, canonical.keyComponents || canonical.components, 20);
  const total = Math.round((fp + rg + cp) * 10) / 10;
  // hintNodeId is NON-AUTHORITATIVE — kept only so a human can check the hint against the live
  // name+width. figNode/figmaNode are deprecated aliases for the same hint.
  const hint = canonical.hintNodeId || canonical.figNode || canonical.figmaNode || null;
  const unverified = canonical.unverified === true || canonical.liveVerified === false;
  return {
    id: canonical.id,
    name: canonical.name,
    width: canonical.width ?? null,
    resolveBy: 'name+width',
    liveQuery: liveQuery(canonical.name, canonical.width),
    hintNodeId: hint,
    hintNodeIdAuthoritative: false,
    unverified,
    // Deprecated alias — older callers read `figNode`. Never clone by it.
    figNode: hint,
    floorplan: canonical.floorplan || null,
    score: total,
    breakdown: { floorplan: fp, regions: Math.round(rg * 10) / 10, components: Math.round(cp * 10) / 10 },
    ...(canonical.hintNote ? { hintNote: canonical.hintNote } : {}),
  };
}

function reuseLevel(score) {
  if (score >= 85) return { level: 1, action: 'clone directly, inject content only' };
  if (score >= 70) return { level: 2, action: 'clone + delta (similar screen)' };
  if (score >= 60) return { level: 3, action: 'clone + delta (floorplan reuse)' };
  return { level: 5, action: 'no strong match — build new (state explicitly)' };
}

// F-4 (Performance Recovery, RC-2): read a request straight from a cached VDI semantic model
// (semantic-models/<slug>-<sha1>.md) so the scorer reuses the analysis instead of re-deriving it.
// Parses frontmatter `floorplan:` + the "## Zones" bullets (regions) + the Component column of
// the "## Components" table (components).
function requestFromModel(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const req = { floorplan: '', regions: [], components: [] };

  const fm = txt.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    const m = fm[1].match(/^floorplan:\s*(.+)$/m);
    // Take the leading floorplan name before any " (" or " —" qualifier.
    if (m) req.floorplan = m[1].split(/\s+[(—-]/)[0].trim();
  }
  // Zones: lines under "## Zones" like "- A: Hero ..." or "- A Object Header: ...".
  const zblock = txt.match(/##\s*Zones\s*\n([\s\S]*?)(\n##\s|$)/);
  if (zblock) {
    for (const line of zblock[1].split('\n')) {
      const zm = line.match(/^-\s*([A-Z0-9]+)\b/);
      if (zm) req.regions.push(zm[1].trim());
    }
  }
  // Components: support BOTH a markdown table (2nd column) AND a bullet list
  // ("- DynamicPageHeader — zone A — ...").
  const cblock = txt.match(/##\s*Components[^\n]*\n([\s\S]*?)(\n##\s|$)/);
  if (cblock) {
    for (const line of cblock[1].split('\n')) {
      let comp = '';
      if (line.includes('|')) {
        const cells = line.split('|').map(s => s.trim()).filter(Boolean);
        if (cells.length >= 2 && !/^zone$/i.test(cells[0]) && !/^-+$/.test(cells[1])) {
          comp = cells[1];
        }
      } else {
        const bm = line.match(/^-\s*(.+)$/);
        if (bm) comp = bm[1];
      }
      if (!comp) continue;
      // Take the leading component name: strip icon glyphs, cut at first separator/count.
      comp = comp.replace(/^[◆✦\s]+/, '').split(/\s*[—|·×]\s*|\s+—|\s+×/)[0].trim().split(/\s{2,}/)[0];
      // Keep a plausible PascalCase/word component token only.
      const first = comp.split(/\s/)[0];
      if (first && /^[A-Za-z]/.test(first) && !req.components.includes(first)) req.components.push(first);
    }
  }
  return req;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') { return JSON.parse(argv[++i]); }
    if (a === '--from-model') { return requestFromModel(argv[++i]); }
    if (a === '--floorplan') args.floorplan = argv[++i];
    else if (a === '--regions') args.regions = argv[++i].split(',').map(s => s.trim());
    else if (a === '--components') args.components = argv[++i].split(',').map(s => s.trim());
  }
  return args;
}

function main() {
  const request = parseArgs(process.argv);
  if (!request.floorplan && !request.regions && !request.components) {
    console.error('Usage: node build/score-canonical.js --floorplan "List Report" --regions R1,R2 --components C1,C2');
    console.error('   or: node build/score-canonical.js --json \'{"floorplan":"...","regions":[...],"components":[...]}\'');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  // Tier 1 ships in the tracked index. Tier 2 (personal, confirmed) lives in a gitignored
  // side file canonical-index-tier2.json — merge it when present.
  const tier1 = (index.tiers && index.tiers.tier1) || [];
  let tier2 = (index.tiers && index.tiers.tier2) || [];
  const TIER2_PATH = path.join(__dirname, '..', 'skill', 'references', 'canonical-index-tier2.json');
  if (tier2.length === 0 && fs.existsSync(TIER2_PATH)) {
    try {
      const t2 = JSON.parse(fs.readFileSync(TIER2_PATH, 'utf8'));
      tier2 = t2.tier2 || t2.tiers?.tier2 || [];
    } catch (e) { /* personal file optional */ }
  }

  // Tier 2 entries inherit fingerprint from their Tier 1 parent (inheritsFrom)
  const tier1ById = Object.fromEntries(tier1.map(c => [c.id, c]));
  const tier2Full = tier2.map(t2 => {
    const parent = tier1ById[t2.inheritsFrom] || {};
    return {
      id: t2.figmaNode || t2.id,
      name: t2.name,
      // P10: width is half the resolution key. Inherit the parent's when the Tier 2 record
      // (written by record-canonical.js) did not capture one.
      width: t2.width ?? parent.width ?? null,
      hintNodeId: t2.hintNodeId || t2.figmaNode || null,
      // Tier 2 rows are written from a build the user confirmed in their own live file, so the
      // id was real at write time — but it still must be asserted live before .clone().
      unverified: t2.unverified === true,
      floorplan: t2.floorplan || parent.floorplan,
      regions: t2.regions || parent.regions,
      keyComponents: t2.keyComponents || parent.keyComponents,
      tier: 2,
    };
  });

  const candidates = tier2Full.length ? tier2Full : tier1.map(c => ({ ...c, tier: 1 }));

  const scored = candidates
    .map(c => scoreCanonical(request, c))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  const best = top[0];
  const rec = best ? reuseLevel(best.score) : { level: 5, action: 'no canonicals available' };

  const result = {
    request,
    tierUsed: tier2Full.length ? 2 : 1,
    // P10 contract, restated on every run so no caller can miss it.
    resolution: {
      policy: 'name+width',
      rule: 'Resolve the chosen canonical in the LIVE Figma file by NAME + WIDTH. hintNodeId is a HINT ONLY — assert the live name and width before .clone().',
      widthTolerancePx: WIDTH_TOLERANCE_PX,
      hintNodeIdAuthoritative: false,
      why: 'AUDIT-V2 §8.4 P10 — this scorer once ranked "Outage List Overview" first with id 750:174925, which is live a 560x430 "Schedule Operation — State D EndOnly" dialog. Cloning by id builds the wrong screen silently.',
      conflictsDoc: 'docs/NODE-ID-CONFLICTS.md',
    },
    topMatches: top,
    recommendation: best ? {
      baseCanonical: best.id,
      baseCanonicalName: best.name,
      baseCanonicalWidth: best.width,
      resolveBy: 'name+width',
      liveQuery: best.liveQuery,
      hintNodeId: best.hintNodeId,
      hintNodeIdAuthoritative: false,
      unverified: best.unverified,
      // Deprecated alias — do not clone by this.
      figNode: best.hintNodeId,
      similarityScore: best.score,
      reuseLevel: rec.level,
      action: rec.action,
      nextStep: best.unverified
        ? `⚠ UNVERIFIED canonical — its stored id is known-wrong or unknown. Resolve LIVE first: ${best.liveQuery}. If nothing matches, do NOT clone; score again or build new with .scratch-approved.`
        : `Read it live first: ${best.liveQuery} → then: node build/record-reference.js --node "<live id>" --name "${best.name}" --score ${best.score} --rationale "…" --effort "…"  → assert src.name === ${JSON.stringify(best.name)} and src.width ≈ ${best.width} in the clone code.`,
    } : null,
  };

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) main();
module.exports = { scoreCanonical, floorplanScore, overlapScore, reuseLevel };
