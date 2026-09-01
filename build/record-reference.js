#!/usr/bin/env node
/**
 * record-reference.js — Write .claude/.reference-selected (Gate 0, canonical reference selection).
 * Usage:
 *   node build/record-reference.js --node "9:1550" --score 88 --rationale "4-state schedule dialog, exact match" --effort "low — relabel + toggle states"
 *
 * This is the LEGITIMATE write path for the Gate 0 marker (not agent self-echo, same model as
 * record-reuse-decision.js). The agent runs score-canonical.js first, then calls this with the
 * chosen node + score + rationale. Validation is on node FORMAT (a real Figma node id), NOT on
 * canonical-index membership — a curated gold node (e.g. E083 9:1550) is valid even though the
 * index was intentionally left unchanged (design decision 2026-07-22).
 *
 * If the top score is < 60 (no suitable reference), Gate 0 additionally requires .scratch-approved
 * (user sign-off) — that is enforced by guard-reference-gate.sh, not here.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const node = get('--node') || '';
const score = parseFloat(get('--score') || 'NaN');
const rationale = get('--rationale') || '';
const effort = get('--effort') || '';
// 2026-09-02: the node's NAME as read LIVE from the file (via use_figma) — required.
// Why: the scorer's top match "Outage List Overview" (canonical-index figNode 750:174925)
// resolved in the live file to "Schedule Operation — State D EndOnly", a 560×430 dialog
// (docs/NODE-ID-CONFLICTS.md already listed that id). A clone by id alone would have
// built a list report from a dialog, silently. The build code must assert this name.
const name = get('--name') || '';

// Validate node id FORMAT (N:N or N-N, optional file-prefix like E083...:2:5355 tolerated by
// checking the trailing node segment). Reject obviously-bad input.
const nodeCore = node.includes(':') && node.split(':').length > 2
  ? node.split(':').slice(-2).join(':')   // fileKey:9:1550 -> 9:1550
  : node;
if (!/^\d+[:-]\d+$/.test(nodeCore)) {
  console.error(`✗ invalid node id: "${node}" — expected format "N:N" or "N-N" (e.g. 9:1550)`);
  process.exit(1);
}
if (Number.isNaN(score)) {
  console.error('✗ --score is required and must be a number (run score-canonical.js first)');
  process.exit(1);
}
if (!rationale) {
  console.error('✗ --rationale is required (one line: why this reference)');
  process.exit(1);
}
if (!name) {
  console.error('✗ --name is required: the node\'s name as read LIVE via use_figma (e.g. --name "Orders List Report").');
  console.error('  Node ids drift between files and docs (750:174925 is a dialog in the live file, not the Outage List).');
  console.error('  Read it:  use_figma → (await figma.getNodeByIdAsync("<id>")).name   then assert it in the clone code.');
  process.exit(1);
}

const decision = {
  nodeId: node,
  verifiedName: name,
  score,
  rationale,
  adaptationEffort: effort || '(unspecified)',
  at: 'session'
};
const out = path.join(ROOT, '.claude', '.reference-selected');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(decision));
console.log('✓ Gate 0 reference recorded:', JSON.stringify(decision));
if (score < 60) {
  console.log('⚠ score < 60 — this is a low/no-match case. guard-reference-gate.sh will also require .scratch-approved (user sign-off) before build.');
}
