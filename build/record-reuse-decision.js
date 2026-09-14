#!/usr/bin/env node
/**
 * record-reuse-decision.js — Write .claude/.reuse-declared from a scored build.
 * Usage: node build/record-reuse-decision.js --level 3 --score 63.3 --base "750:174786"
 * This is the LEGITIMATE write path for the reuse marker (not agent self-echo).
 * The agent should run score-canonical.js first, then call this with the result.
 *
 * 2026-09-14 (audit finding E): Gate 0 (record-reference.js -> .reference-selected) and this
 * gate (RULE 31 -> .reuse-declared) score the SAME candidate from the SAME score-canonical.js
 * run, but every field had to be retyped by hand into a second command with no cross-check —
 * a real chance for the two markers to name different nodes for the same build. --score and
 * --base are now OPTIONAL: when omitted, they default from .reference-selected if it exists
 * this session (nodeId -> baseCanonical, score -> score). --level is still required — it is
 * a judgment call (how much to adapt), not a fact record-reference.js already captured. If you
 * pass --base explicitly and it disagrees with .reference-selected's node, that is flagged
 * (not blocked) so a genuine deliberate override isn't silently prevented.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : null; };

const REF_PATH = path.join(ROOT, '.claude', '.reference-selected');
let ref = null;
try { ref = JSON.parse(fs.readFileSync(REF_PATH, 'utf8')); } catch (e) { /* not recorded yet, or unreadable — that's fine, fall back to explicit args */ }

const level = parseInt(get('--level') || '5', 10);
const scoreArg = get('--score');
const baseArg = get('--base');
const score = scoreArg !== null ? parseFloat(scoreArg) : (ref ? ref.score : 0);
const base = baseArg !== null ? baseArg : (ref ? ref.nodeId : 'none');
const delta = get('--delta') || null;

if (baseArg !== null && ref && ref.nodeId && baseArg !== ref.nodeId && baseArg !== 'none') {
  console.error(`⚠ --base "${baseArg}" does not match .reference-selected's recorded node "${ref.nodeId}" — both markers now name different canonicals for this build. If this is deliberate (e.g. Gate 0 picked one reference, but this build is actually reusing a different one), proceed; otherwise re-run record-reference.js or omit --base to default from it.`);
}

const decision = { level, score, baseCanonical: base, deltaSpec: delta };
const out = path.join(ROOT, '.claude', '.reuse-declared');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(decision));
console.log('✓ reuse decision recorded:', JSON.stringify(decision));
if (baseArg === null && ref) console.log(`  (--base/--score defaulted from .reference-selected: node "${ref.nodeId}", score ${ref.score})`);
