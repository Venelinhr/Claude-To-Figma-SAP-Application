#!/usr/bin/env node
/**
 * verify-invariants.js — THE POST-BUILD REALITY GATE (Gates 6/7/8).
 *
 * Root cause this fixes (from SAP-INVARIANT-ARCHITECTURE.md):
 *   The build always ended type:'success' and NO gate ever consumed the real built frame.
 *   This script is the one gate that reads the produced frame tree and is ALLOWED TO RETURN FAIL.
 *
 * It ingests a serialized frame dump (output/<node>-tree.json) produced by a use_figma walk of
 * root.findAll(() => true), then enforces the six build invariants with a ONE-FAIL-FAILS verdict:
 *
 *   INV 1  Zero native frames outside allowlist  — every node is a kit INSTANCE, a PASS_CONTAINER,
 *          or a PASS_PRIMITIVE_EXCEPTION. One fake component fails the build. No ratio.
 *   INV 2  Zero raw hex                          — every visible SOLID fill/stroke on a non-instance
 *          node has a bound SAP variable.
 *   INV 3  Zero non-SAP typography               — every TEXT is family '72' + a valid [typo:role]
 *          tag at the role's size (±1px).
 *   INV 4  Clone-first provenance                — if a canonical was applicable, the frame must
 *          carry basedOnCanonical provenance (checked when --canonical <id> is passed).
 *   INV 5  Sizing / overflow                     — (a) no visible child extends past a
 *          clipsContent:true parent's absoluteBoundingBox, and (b) a page-level header component
 *          (DynamicPageHeader/DynamicPageTitle/ObjectPageHeader) matches its parent's width within
 *          ±2px. Catches the layoutSizingHorizontal='FILL' silent-no-op (parent still HUG-width)
 *          that hides sibling content — see figma-build-patterns.md "Form Field FILL Fix".
 *   INV 8  Layer naming                          — names satisfy layer-naming.json deny rules.
 *
 * Input node shape (each element of root.findAll(()=>true) mapped to):
 *   { "id","name","type","visible","layoutMode","childCount","mainComponentKey",
 *     "fontFamily","fontSize",
 *     "width","absoluteBoundingBox":{"x","y","width","height"},
 *     "layoutSizingHorizontal","clipsContent":<bool>,   // sizing/overflow (INV 5)
 *     "parentId",   // id of this node's parent — REQUIRED for INV 5 on a flat-array dump, since
 *                   // findAll(()=>true).map(...) loses parent linkage; set from nd.parent.id.
 *                   // Omit only when the dump is a nested tree with children[] (parentId is then
 *                   // backfilled during flattening from the children[] edge).
 *     "overriddenFills":<bool>,"overriddenStrokes":<bool>,   // node-level: are paints locally overridden?
 *     "fills":[{"type","hex","boundVariable","overridden":<bool>}],   // per-paint: is THIS paint a local override?
 *     "strokes":[{"type","hex","boundVariable","overridden":<bool>}] }
 * The serializer MUST set overridden/overriddenFills for INSTANCE nodes (Figma: compare paint to the
 * main component, or use node.overriddenFields). Without it, an unbound raw-hex OVERRIDE on an instance
 * is treated as inherited and passes — the exact hole this closes. For non-instance nodes the flags are ignored.
 * Accepts either a flat array of nodes OR a nested tree with children[] (it flattens).
 * INV 5 is skipped per-node whenever the widened fields (absoluteBoundingBox/width/parentId) are
 * absent — an older dump without them still passes INV 1-4/8 unchanged (no false positives).
 *
 * Usage:
 *   node build/verify-invariants.js output/804-44859-tree.json
 *   node build/verify-invariants.js - < dump.json
 *   node build/verify-invariants.js dump.json --canonical 766:45166 --pre-bind --out output/804-verify.json
 *
 * Exit 0 = overallPass:true. Exit 2 = any invariant FAILED (prints each failing node). Exit 3 = bad input.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const load = (p, fallback) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }
  catch (e) { return fallback; }
};

const allowlist = load('build/native-frame-allowlist.json', { containerNamePatterns: [], forbiddenContainerNames: [], containerRequires: { layoutModeNot: 'NONE', minChildren: 1 } });
const primitives = load('build/primitive-exceptions.json', { primitives: [] });
const layerNaming = load('layer-naming.json', { deny: [], _denyExceptions: { preBindSkips: [] } });

const KIT_KEY = allowlist.kitFileKey || 'SILcWzK5uFghKun9jx6D7c';

// Typography role -> canonical size (SAP_BUILD_MANIFEST.md §5)
const TYPO_ROLES = {
  heading: 20, title: 16, subtitle: 14, label: 14,
  'label-emphasized': 14, labelbold: 14, body: 14, bodytext: 14,
  caption: 12, tableheader: 13, toolbartitle: 16,
  kpi: 28, display: 28,
};

function parseArgs(argv) {
  const a = { preBind: false, canonical: null, out: null, input: null };
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--pre-bind') a.preBind = true;
    else if (v === '--canonical') a.canonical = argv[++i];
    else if (v === '--out') a.out = argv[++i];
    else rest.push(v);
  }
  a.input = rest[0];
  return a;
}

// Flatten either a nested tree (children[]) or accept a flat array.
function flatten(dump) {
  const nodes = [];
  const visit = (n, depth, parentId) => {
    if (!n || typeof n !== 'object') return;
    if (depth >= 0) {
      // A nested tree's children[] carries the real parent-child edge; only backfill
      // parentId when the node doesn't already declare one (flat-array dumps set it themselves).
      if (n.parentId === undefined && parentId !== undefined) n.parentId = parentId;
      nodes.push(n);
    }
    for (const k of (n.children || [])) visit(k, depth + 1, n.id);
  };
  if (Array.isArray(dump)) { for (const n of dump) visit(n, 0, undefined); }
  else visit(dump, -1, undefined); // skip synthetic root wrapper if it's the whole-frame object at depth -1... but include real root
  // If we skipped a real root (dump was a single frame object), re-add it:
  if (!Array.isArray(dump) && dump && dump.type) nodes.unshift(dump);
  // de-dupe by id
  const seen = new Set();
  return nodes.filter(n => { if (!n.id || seen.has(n.id)) return !n.id; seen.add(n.id); return true; });
}

// Build id -> node map for parent lookups used by INV 5 (sizing/overflow).
function buildParentMap(nodes) {
  const byId = new Map();
  for (const n of nodes) if (n.id) byId.set(n.id, n);
  return byId;
}

function matchesAny(name, patterns) {
  return patterns.some(p => { try { return new RegExp(p).test(name); } catch { return false; } });
}

function classifyNode(n, isRoot) {
  const name = n.name || '';
  const type = n.type || '';
  if (n.visible === false) return { verdict: 'SKIP_HIDDEN', invariant: 1 };

  // The root frame is the screen wrapper (L1) — a legitimate container by definition.
  if (isRoot && type === 'FRAME') return { verdict: 'PASS_CONTAINER', invariant: 1, root: true };

  // Primitive exceptions first (icon placeholders, dividers, progress bars, demo pill)
  for (const prim of primitives.primitives) {
    if (matchesAny(name, [prim.namePattern]) && (prim.allowedTypes || []).includes(type)) {
      return { verdict: 'PASS_PRIMITIVE_EXCEPTION', invariant: 1, primitive: prim.id };
    }
  }

  if (type === 'INSTANCE') {
    const key = n.mainComponentKey || null;
    // A kit instance's main component key exists (kit membership is confirmed at bind;
    // here we require a non-null main component key — a detached/local instance has null).
    if (key) return { verdict: 'PASS_INSTANCE', invariant: 1 };
    return { verdict: 'FAIL_DETACH_OR_FOREIGN', invariant: 1, why: `INSTANCE '${name}' has no main component (detached/local)` };
  }

  if (type === 'FRAME') {
    // Fake component: a FRAME named after a SAP component (but not a legitimate layout name)
    // Only flag when the name IS the component name, ends with the component name,
    // or matches "ComponentName (variant)" — NOT "ComponentName Row" or "ComponentName — Something"
    if ((allowlist.forbiddenContainerNames || []).some(c => {
      if (name === c) return true;
      // "ComponentName (something)" variant suffix
      if (name.startsWith(c + ' (') && name.endsWith(')')) return true;
      // ends with " ComponentName" (e.g. layout named after the component at end)
      if (name.endsWith(' ' + c)) return true;
      return false;
    })) {
      return { verdict: 'FAIL_FAKE_COMPONENT', invariant: 1, why: `FRAME named after SAP component: '${name}' — must be a kit INSTANCE` };
    }
    // Pure layout container
    const req = allowlist.containerRequires || {};
    const layoutOk = (n.layoutMode && n.layoutMode !== (req.layoutModeNot || 'NONE'));
    const childOk = (typeof n.childCount === 'number' ? n.childCount : (n.children || []).length) >= (req.minChildren || 1);
    const nameOk = matchesAny(name, allowlist.containerNamePatterns || []);
    if (layoutOk && childOk && nameOk) return { verdict: 'PASS_CONTAINER', invariant: 1 };
    // A frame with no layout, or unrecognized name, standing in for content
    return { verdict: 'FAIL_FAKE_COMPONENT', invariant: 1, why: `FRAME '${name}' is not a kit instance, not an allowlisted container (layout=${n.layoutMode}, children=${childOk}, nameMatch=${nameOk}), and not a primitive` };
  }

  if (type === 'TEXT') return { verdict: 'PASS_TEXT', invariant: 3 };
  if (type === 'RECTANGLE' || type === 'LINE' || type === 'VECTOR' || type === 'ELLIPSE') {
    // primitives already handled; a bare rect that's not a primitive is suspicious
    return { verdict: 'FAIL_FAKE_COMPONENT', invariant: 1, why: `${type} '${name}' is not an allowlisted primitive` };
  }
  return { verdict: 'PASS_OTHER', invariant: 1 };
}

function checkFills(n, preBind) {
  // INV 2: every visible SOLID fill/stroke must bind a SAP variable — no raw hex.
  //
  // Instance paints are USUALLY owned by the library (inherited from the main component) and are
  // exempt. BUT Figma allows a LOCAL paint override on an instance, and an unbound raw-hex override
  // is exactly a "non-SAP color on top of a real SAP instance" leak. So we exempt instance paints
  // ONLY when they are inherited (not a local override). The serializer marks a local override with
  // p.overridden === true (or n.overriddenFills === true for the node). An unbound OVERRIDE fails;
  // an inherited paint (or a bound override) passes.
  //
  // --pre-bind exemption: non-instance nodes with unbound fills are expected pre-bind —
  // the Bind plugin resolves all [sap*] tagged names. Skip INV 2 for all non-instance
  // nodes when --pre-bind is set. Instance OVERRIDE failures are still checked.
  if (preBind && (n.type || '') !== 'INSTANCE') return [];
  const isInstance = (n.type || '') === 'INSTANCE';
  const nodeOverridesFills = n.overriddenFills === true || n.overriddenStrokes === true;
  const fails = [];
  const paints = [...(n.fills || []).map(p => ({ p, kind: 'fill' })),
                  ...(n.strokes || []).map(p => ({ p, kind: 'stroke' }))];
  for (const { p, kind } of paints) {
    if ((p.type || 'SOLID') !== 'SOLID') continue;
    if (p.visible === false) continue;
    const bound = p.boundVariable || (p.boundVariables && p.boundVariables.color);
    if (bound) continue; // bound to a SAP variable → always OK

    if (isInstance) {
      // Exempt only if this paint is inherited (not a local override).
      const isOverride = p.overridden === true || nodeOverridesFills;
      if (!isOverride) continue; // inherited library paint — OK
      fails.push({ verdict: 'FAIL_RAW_HEX', invariant: 2,
        why: `unbound raw-hex ${kind} OVERRIDE ${p.hex || ''} on SAP instance '${n.name}' — a local color override on an instance must still bind a SAP variable (never override with raw hex)` });
    } else {
      fails.push({ verdict: 'FAIL_RAW_HEX', invariant: 2,
        why: `unbound ${kind} ${p.hex || ''} on '${n.name}' — every color must bind a SAP variable` });
    }
  }
  return fails;
}

function checkTypo(n) {
  if ((n.type || '') !== 'TEXT') return null;
  const name = n.name || '';
  const fam = n.fontFamily || '';
  if (fam !== '72') return { verdict: 'FAIL_FONT', invariant: 3, why: `TEXT '${name}' uses font '${fam}', not SAP '72'` };
  const m = name.match(/\[typo:([a-zA-Z-]+)\]/);
  if (!m) return { verdict: 'FAIL_TYPO_TAG', invariant: 3, why: `TEXT '${name}' has no [typo:role] tag` };
  const role = m[1].toLowerCase();
  if (!(role in TYPO_ROLES)) return { verdict: 'FAIL_TYPO_ROLE', invariant: 3, why: `TEXT '${name}' role '${role}' not in typography registry` };
  const expected = TYPO_ROLES[role];
  const size = n.fontSize || 0;
  if (Math.abs(size - expected) > 1) return { verdict: 'FAIL_TYPO_SIZE', invariant: 3, why: `TEXT '${name}' role '${role}' size ${size} != ${expected}±1` };
  return null;
}

// Page-level header components that must span their parent's full width — a header
// narrower than its container is the DynamicPageHeader-FILL-no-op failure mode
// (RULE: figma-build-patterns.md "DynamicPageHeader (DPH) — Clone and Strip Pattern").
const PAGE_HEADER_NAME_RE = /\b(DynamicPageHeader|DynamicPageTitle|ObjectPageHeader)\b/i;
const WIDTH_TOLERANCE_PX = 2;

function boundsOverflow(childBox, parentBox) {
  if (!childBox || !parentBox) return false;
  const eps = 0.5; // sub-pixel rounding noise
  return (
    childBox.x < parentBox.x - eps ||
    childBox.y < parentBox.y - eps ||
    (childBox.x + childBox.width) > (parentBox.x + parentBox.width) + eps ||
    (childBox.y + childBox.height) > (parentBox.y + parentBox.height) + eps
  );
}

function checkSizing(n, parentMap) {
  // INV 5a: a visible child that extends past a clipsContent:true parent's bounds is
  // either invisibly clipped (content hidden from the user) or proof the parent never
  // got FIXED-width before a child's layoutSizingHorizontal='FILL' was set (silent no-op
  // — see figma-build-patterns.md "Form Field FILL Fix"). Either way it is a build defect.
  const fails = [];
  if (n.visible === false) return fails;
  const parentId = n.parentId;
  const parent = parentId ? parentMap.get(parentId) : null;
  if (parent && parent.clipsContent === true && n.absoluteBoundingBox && parent.absoluteBoundingBox) {
    if (boundsOverflow(n.absoluteBoundingBox, parent.absoluteBoundingBox)) {
      fails.push({ verdict: 'FAIL_CHILD_OVERFLOW', invariant: 5,
        why: `'${n.name}' (${JSON.stringify(n.absoluteBoundingBox)}) overflows clipping parent '${parent.name}' (${JSON.stringify(parent.absoluteBoundingBox)}) — content is either invisibly clipped or the parent never became FIXED-width before a child FILL was set (Form Field FILL Fix pattern)` });
    }
  }

  // INV 5b: a page-level header component whose width doesn't match its parent's width
  // is the DynamicPageHeader-narrower-than-screen bug — layoutSizingHorizontal='FILL' was
  // set on the header while its parent was still HUG-width, so FILL silently no-op'd and
  // the header (and everything inside it) rendered too narrow, hiding sibling content.
  if (PAGE_HEADER_NAME_RE.test(n.name || '') && parent && typeof n.width === 'number' && typeof parent.width === 'number') {
    if (Math.abs(n.width - parent.width) > WIDTH_TOLERANCE_PX) {
      fails.push({ verdict: 'FAIL_HEADER_WIDTH_MISMATCH', invariant: 5,
        why: `page-header '${n.name}' width ${n.width} != parent '${parent.name}' width ${parent.width} (±${WIDTH_TOLERANCE_PX}px) — layoutSizingHorizontal='FILL' likely no-op'd because the parent wasn't FIXED-width yet; verify with the Form Field FILL Fix guard (figma-build-patterns.md) before setting FILL` });
    }
  }
  return fails;
}

function checkName(n, preBind) {
  const name = n.name || '';
  const skips = preBind ? (layerNaming._denyExceptions?.preBindSkips || []) : [];
  for (const d of (layerNaming.deny || [])) {
    if (skips.includes(d.pattern)) continue;
    try { if (new RegExp(d.pattern).test(name)) return { verdict: 'FAIL_LAYER_NAME', invariant: 8, why: `'${name}': ${d.why}` }; }
    catch { /* skip bad regex */ }
  }
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) { console.error('Usage: node build/verify-invariants.js <dump.json|-> [--canonical <id>] [--pre-bind] [--out <verify.json>]'); process.exit(3); }

  let dump;
  try {
    const raw = args.input === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(args.input, 'utf8');
    dump = JSON.parse(raw);
  } catch (e) { console.error('✗ Could not read/parse dump:', e.message); process.exit(3); }

  const nodes = flatten(dump);
  const parentMap = buildParentMap(nodes);
  const fails = [];
  const summary = { instances: 0, containers: 0, primitives: 0, text: 0, other: 0, hidden: 0, fails: 0 };
  const rootNode = Array.isArray(dump) ? nodes[0] : (dump && dump.type ? dump : nodes[0]);

  for (const n of nodes) {
    const c = classifyNode(n, n === rootNode);
    if (c.verdict === 'SKIP_HIDDEN') { summary.hidden++; continue; }
    if (c.verdict === 'PASS_INSTANCE') summary.instances++;
    else if (c.verdict === 'PASS_CONTAINER') summary.containers++;
    else if (c.verdict === 'PASS_PRIMITIVE_EXCEPTION') summary.primitives++;
    else if (c.verdict === 'PASS_TEXT') summary.text++;
    else if (c.verdict.startsWith('PASS')) summary.other++;
    else fails.push({ id: n.id, name: n.name, ...c });

    // INV 2 fills
    for (const f of checkFills(n, args.preBind)) fails.push({ id: n.id, name: n.name, ...f });
    // INV 3 typo
    const t = checkTypo(n); if (t) fails.push({ id: n.id, name: n.name, ...t });
    // INV 5 sizing/overflow
    for (const s of checkSizing(n, parentMap)) fails.push({ id: n.id, name: n.name, ...s });
    // INV 8 names
    const nm = checkName(n, args.preBind); if (nm) fails.push({ id: n.id, name: n.name, ...nm });
  }

  // INV 4 provenance (only when a canonical was declared applicable via --canonical,
  // sourced from .reuse-declared baseCanonical). The MCP-first builder cannot call
  // setPluginData on the live node (plugin-sandbox-only), but it DOES control the
  // JSON tree dump — so provenance is proven by a `basedOnCanonical` field on the
  // dumped root (set by the builder to the cloned node id) OR a matching name tag
  // `[clone:<id>]`. This makes INV4 actually enforceable on the default path
  // instead of silently passing every rebuilt-from-scratch frame.
  if (args.canonical) {
    const nameTag = rootNode && typeof rootNode.name === 'string' && /\[clone:[^\]]+\]/.test(rootNode.name);
    const prov = rootNode && (rootNode.basedOnCanonical || rootNode.pluginData?.basedOnCanonical || nameTag);
    if (!prov) fails.push({ id: rootNode?.id, name: rootNode?.name, verdict: 'FAIL_NO_PROVENANCE', invariant: 4, why: `canonical ${args.canonical} was declared applicable (.reuse-declared) but the frame carries no clone provenance — add "basedOnCanonical":"${args.canonical}" to the dumped root or a [clone:${args.canonical}] name tag (clone-first, RULE 28/31)` });
  }

  summary.fails = fails.length;
  const overallPass = fails.length === 0;
  const result = { node: rootNode?.id || null, name: rootNode?.name || null, overallPass, summary, fails };

  if (args.out) { try { fs.writeFileSync(path.join(ROOT, args.out), JSON.stringify(result, null, 2)); } catch (e) { /* non-fatal */ } }

  console.log(`Nodes: INSTANCE=${summary.instances} CONTAINER=${summary.containers} PRIMITIVE=${summary.primitives} TEXT=${summary.text} other=${summary.other} hidden=${summary.hidden}`);
  if (overallPass) {
    console.log(`✓ overallPass — every node is a real SAP instance, an allowlisted container, or an approved primitive. 0 raw hex, 0 non-SAP fonts.`);
    process.exit(0);
  }
  console.error(`\n✗ BUILD FAILS INVARIANTS — ${fails.length} violation(s):\n`);
  for (const f of fails.slice(0, 60)) console.error(`  [INV ${f.invariant}] ${f.verdict} — ${f.why}`);
  if (fails.length > 60) console.error(`  … and ${fails.length - 60} more`);
  console.error(`\nA build that violates any invariant cannot be handed off. Fix the frame or STOP.`);
  process.exit(2);
}

main();
