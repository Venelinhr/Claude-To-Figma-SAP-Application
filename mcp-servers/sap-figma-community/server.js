#!/usr/bin/env node
/**
 * SAP Figma Community Library MCP Server (MCP 3)
 *
 * Drift detection + registry maintenance for the SAP Web UI Kit.
 * Reads local registry at knowledge/components/registry/*.json.
 * Compares against the live SAP Web UI Kit Figma file via figma MCP / cached fingerprint.
 *
 * NOTE: This server cannot make HTTP requests directly to Figma — the Figma
 * MCP server handles that. This server provides:
 *   - Diff/freshness logic across local registry entries
 *   - Update routines that the caller (Claude) feeds with live data fetched via figma MCP
 *   - Sync state tracked in .sync-state.json
 *
 * Tools:
 *   - getCurrentLibraryVersion       — last-known SAP Web UI Kit version
 *   - getRegistryEntry               — one component's local registry record
 *   - checkRegistryFreshness         — list entries older than staleness threshold
 *   - listKnownComponents            — all registered component names
 *   - listMissingFigmaIds            — entries with empty figmaComponentId
 *   - recordLiveData                 — accept live data fetched by caller; diff vs registry
 *   - applySync                      — write registry updates from a diff
 *   - markSynced                     — update lastValidated date on entries
 *
 * Install:
 *   npm install
 *
 * Run via Claude Code:
 *   claude mcp add --transport stdio --scope user sap-figma-community -- \
 *     node /absolute/path/to/this/server.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ────────────────────────────────────────────────────────────────────────────
// PATHS
// ────────────────────────────────────────────────────────────────────────────
const REGISTRY_DIR = resolve(__dirname, '..', '..', 'knowledge', 'components', 'registry');
const SYNC_STATE_FILE = resolve(__dirname, '.sync-state.json');

// Known SAP Web UI Kit Figma Community file ID — the canonical source.
// Corrected 2026-09-19: this used to be 'p7zm5EMBk5DRRZdxNeJ4f5', which
// disagreed with RULE 23 (CLAUDE.md) and every build-gating spot
// (build/verify-invariants.js KIT_KEY, build/native-frame-allowlist.json
// kitFileKey). Confirmed correct against the live SAP knowledge server's own
// Figma adapter (sap-design-cf-live / figma-adapter.js FILE_KEY), which
// independently hardcodes this same ID as the SAP Web UI Kit.
const SAP_FIGMA_FILE_ID = 'SILcWzK5uFghKun9jx6D7c';

// Staleness threshold — entries older than this are "stale"
const STALENESS_DAYS = 30;

// ────────────────────────────────────────────────────────────────────────────
// REGISTRY LOADER
// ────────────────────────────────────────────────────────────────────────────

function loadRegistry() {
  if (!existsSync(REGISTRY_DIR)) {
    throw new Error(`Registry not found at ${REGISTRY_DIR}`);
  }
  const files = readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  const entries = {};
  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(REGISTRY_DIR, file), 'utf8'));
      const name = data.componentName || file.replace('.json', '');
      entries[name] = { ...data, _file: file };
    } catch (e) {
      console.error(`[mcp-figma-community] Failed to load ${file}: ${e.message}`);
    }
  }
  return entries;
}

let _registry = null;
function getRegistry() {
  if (_registry === null) _registry = loadRegistry();
  return _registry;
}
function reloadRegistry() { _registry = loadRegistry(); return _registry; }

// ────────────────────────────────────────────────────────────────────────────
// SYNC STATE
// ────────────────────────────────────────────────────────────────────────────

function loadSyncState() {
  if (!existsSync(SYNC_STATE_FILE)) {
    return {
      figmaFileId: SAP_FIGMA_FILE_ID,
      lastFullSync: null,
      lastKnownLibraryVersion: '1.149.0',
      lastSeenFingerprint: null,
      knownDrifts: [],
    };
  }
  try { return JSON.parse(readFileSync(SYNC_STATE_FILE, 'utf8')); }
  catch (e) { console.error(`Sync state corrupt: ${e.message}`); return {}; }
}

function saveSyncState(state) {
  writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
}

// ────────────────────────────────────────────────────────────────────────────
// STALENESS LOGIC
// ────────────────────────────────────────────────────────────────────────────

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return Infinity;
  return (Date.now() - then) / 86400000;
}

function classifyEntry(entry) {
  const age = daysSince(entry.lastValidated);
  const hasFigmaId = !!entry.figmaComponentId;
  if (!hasFigmaId) return { status: 'missing-figma-id', age };
  if (age > STALENESS_DAYS) return { status: 'stale', age };
  return { status: 'fresh', age };
}

// ────────────────────────────────────────────────────────────────────────────
// TOOL IMPLEMENTATIONS
// ────────────────────────────────────────────────────────────────────────────

function toolGetCurrentLibraryVersion() {
  const state = loadSyncState();
  return {
    content: [{
      type: 'text',
      text: `SAP Web UI Kit Figma file: ${state.figmaFileId}\n` +
            `Last known library version: ${state.lastKnownLibraryVersion}\n` +
            `Last full registry sync: ${state.lastFullSync || 'never'}\n` +
            `Last seen file fingerprint: ${state.lastSeenFingerprint || '—'}\n\n` +
            `To check live: use the figma MCP to get_metadata on file ${state.figmaFileId}`,
    }],
  };
}

function toolGetRegistryEntry({ componentName }) {
  if (!componentName) {
    return { isError: true, content: [{ type: 'text', text: 'componentName required' }] };
  }
  const reg = getRegistry();
  const entry = reg[componentName];
  if (!entry) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `${componentName} not in local registry. Use listKnownComponents to see all.`,
      }],
    };
  }
  const cls = classifyEntry(entry);
  const copy = { ...entry };
  delete copy._file;
  return {
    content: [{
      type: 'text',
      text: `Status: ${cls.status} (${Math.round(cls.age)} days since lastValidated)\n` +
            `figmaComponentId: ${entry.figmaComponentId || '(missing)'}\n` +
            `figmaLibraryFileId: ${entry.figmaLibraryFileId}\n` +
            `libraryVersion: ${entry.libraryVersion}\n` +
            `lastValidated: ${entry.lastValidated}\n\n` +
            `Full entry:\n${JSON.stringify(copy, null, 2)}`,
    }],
  };
}

function toolCheckRegistryFreshness({ thresholdDays } = {}) {
  const threshold = thresholdDays || STALENESS_DAYS;
  const reg = getRegistry();
  const fresh = [], stale = [], missing = [];

  for (const name in reg) {
    const cls = classifyEntry(reg[name]);
    const item = { name, age: Math.round(cls.age), lastValidated: reg[name].lastValidated };
    if (cls.status === 'missing-figma-id') missing.push(item);
    else if (cls.age > threshold) stale.push(item);
    else fresh.push(item);
  }

  stale.sort((a, b) => b.age - a.age);
  missing.sort((a, b) => b.age - a.age);

  return {
    content: [{
      type: 'text',
      text: `Registry freshness (threshold: ${threshold} days)\n\n` +
            `✓ Fresh: ${fresh.length}\n` +
            `⚠ Stale: ${stale.length}\n` +
            `✗ Missing figmaComponentId: ${missing.length}\n` +
            `Total: ${Object.keys(reg).length}\n\n` +
            (stale.length ? `Stale entries:\n${stale.slice(0, 20).map(s => `  ${s.name} (${s.age}d old)`).join('\n')}\n${stale.length > 20 ? `  …and ${stale.length - 20} more\n` : ''}\n` : '') +
            (missing.length ? `Missing Figma component ID:\n${missing.map(m => `  ${m.name}`).join('\n')}\n` : ''),
    }],
  };
}

function toolListKnownComponents() {
  const reg = getRegistry();
  const items = Object.keys(reg).sort().map(n => {
    const cls = classifyEntry(reg[n]);
    const icon = cls.status === 'fresh' ? '✓' : cls.status === 'stale' ? '⚠' : '✗';
    return `  ${icon} ${n} (${Math.round(cls.age)}d, ${cls.status})`;
  }).join('\n');
  return {
    content: [{
      type: 'text',
      text: `${Object.keys(reg).length} registered SAP components:\n\n${items}`,
    }],
  };
}

function toolListMissingFigmaIds() {
  const reg = getRegistry();
  const missing = [];
  for (const name in reg) {
    if (!reg[name].figmaComponentId) {
      missing.push({
        name,
        category: reg[name].componentCategory,
        file: reg[name]._file,
      });
    }
  }
  return {
    content: [{
      type: 'text',
      text: missing.length === 0
        ? 'All registered components have a figmaComponentId.'
        : `Missing figmaComponentId (${missing.length} components):\n\n` +
          missing.map(m => `  ${m.name}  [${m.category}]  ${m.file}`).join('\n') +
          `\n\nTo fix: call figma.search_design_system or import_component_set on each, then call recordLiveData.`,
    }],
  };
}

function toolRecordLiveData({ componentName, liveData }) {
  if (!componentName || !liveData) {
    return { isError: true, content: [{ type: 'text', text: 'componentName and liveData required' }] };
  }
  const reg = getRegistry();
  const existing = reg[componentName];
  if (!existing) {
    return {
      isError: true,
      content: [{ type: 'text', text: `No registry entry for ${componentName}. Use addRegistryEntry first.` }],
    };
  }

  // Diff fields
  const diffs = [];
  function diff(field, oldVal, newVal) {
    if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field, old: oldVal, new: newVal });
    }
  }
  diff('figmaComponentId', existing.figmaComponentId, liveData.figmaComponentId);
  diff('libraryVersion', existing.libraryVersion, liveData.libraryVersion);
  diff('supportedVariants', existing.supportedVariants, liveData.supportedVariants);
  diff('supportedProperties', existing.supportedProperties, liveData.supportedProperties);

  if (diffs.length === 0) {
    return {
      content: [{ type: 'text', text: `No drift for ${componentName}. Live data matches registry.` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Drift detected in ${componentName}:\n\n` +
            diffs.map(d => `  ${d.field}:\n    OLD: ${JSON.stringify(d.old)}\n    NEW: ${JSON.stringify(d.new)}`).join('\n\n') +
            `\n\nTo apply: call applySync with { componentName: "${componentName}", updates: {...} }`,
    }],
  };
}

// SECURITY FIX 2026-07-21: only these fields may be merged into a registry entry via applySync.
// Previously ...updates was spread wholesale, letting a caller inject/clobber ANY key
// (componentName, _file, huge blobs) and corrupt the registry that downstream gates trust.
const APPLYSYNC_ALLOWED_FIELDS = ['figmaComponentId', 'libraryVersion', 'supportedVariants', 'supportedProperties'];
const MAX_UPDATE_BYTES = 64 * 1024;

// Confirm join(REGISTRY_DIR, file) stays inside REGISTRY_DIR and file has no path components.
function safeRegistryPath(file) {
  if (typeof file !== 'string' || basename(file) !== file) return null;
  const p = resolve(REGISTRY_DIR, file);
  const base = resolve(REGISTRY_DIR) + sep;
  return p.startsWith(base) ? p : null;
}

function toolApplySync({ componentName, updates, dryRun }) {
  if (!componentName || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { isError: true, content: [{ type: 'text', text: 'componentName (string) and updates (object) required' }] };
  }
  if (JSON.stringify(updates).length > MAX_UPDATE_BYTES) {
    return { isError: true, content: [{ type: 'text', text: 'updates payload too large' }] };
  }
  const reg = getRegistry();
  const existing = reg[componentName];
  if (!existing) {
    return { isError: true, content: [{ type: 'text', text: `No registry entry for ${componentName}` }] };
  }

  // Whitelist: keep only known mergeable fields from caller input.
  const safeUpdates = {};
  for (const k of APPLYSYNC_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, k)) safeUpdates[k] = updates[k];
  }
  if (Object.keys(safeUpdates).length === 0) {
    return { isError: true, content: [{ type: 'text', text: `No updatable fields. Allowed: ${APPLYSYNC_ALLOWED_FIELDS.join(', ')}` }] };
  }

  const merged = { ...existing, ...safeUpdates, lastValidated: new Date().toISOString().slice(0, 10) };
  delete merged._file;

  if (dryRun) {
    return {
      content: [{
        type: 'text',
        text: `[DRY RUN] Would write to ${existing._file}:\n\n${JSON.stringify(merged, null, 2)}`,
      }],
    };
  }

  const path = safeRegistryPath(existing._file);
  if (!path) {
    return { isError: true, content: [{ type: 'text', text: `Refusing write: registry file path escapes the registry dir.` }] };
  }
  writeFileSync(path, JSON.stringify(merged, null, 2));
  reloadRegistry();

  return {
    content: [{
      type: 'text',
      text: `✓ Updated ${path}. Registry reloaded. lastValidated set to ${merged.lastValidated}.`,
    }],
  };
}

function toolMarkSynced({ componentName }) {
  const reg = getRegistry();
  if (componentName) {
    const e = reg[componentName];
    if (!e) return { isError: true, content: [{ type: 'text', text: `No entry for ${componentName}` }] };
    const p = safeRegistryPath(e._file);
    if (!p) return { isError: true, content: [{ type: 'text', text: 'Refusing write: path escapes registry dir.' }] };
    const merged = { ...e, lastValidated: new Date().toISOString().slice(0, 10) };
    delete merged._file;
    writeFileSync(p, JSON.stringify(merged, null, 2));
    reloadRegistry();
    return { content: [{ type: 'text', text: `✓ Marked ${componentName} as synced.` }] };
  }
  // mark all
  const today = new Date().toISOString().slice(0, 10);
  let count = 0; const failed = [];
  for (const name in reg) {
    const e = reg[name];
    const p = safeRegistryPath(e._file);
    if (!p) { failed.push(name); continue; }
    try {
      const merged = { ...e, lastValidated: today };
      delete merged._file;
      writeFileSync(p, JSON.stringify(merged, null, 2));
      count++;
    } catch (_) { failed.push(name); }
  }
  const state = loadSyncState();
  state.lastFullSync = today;
  saveSyncState(state);
  reloadRegistry();
  const note = failed.length ? ` (${failed.length} failed: ${failed.slice(0, 5).join(', ')})` : '';
  return { content: [{ type: 'text', text: `✓ Marked ${count} entries as synced. State saved.${note}` }] };
}

function toolGetSAPFigmaFileId() {
  return {
    content: [{
      type: 'text',
      text: `SAP Web UI Kit Figma Community File ID:\n  ${SAP_FIGMA_FILE_ID}\n\n` +
            `URL: https://www.figma.com/community/file/<community-id>\n` +
            `Use this with the figma MCP: search_design_system, get_metadata, etc.`,
    }],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'getCurrentLibraryVersion',
    description: 'Get the SAP Web UI Kit Figma file ID, last-known library version, and last-sync state. Use this first to understand registry state before querying components.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'getSAPFigmaFileId',
    description: 'Get the canonical SAP Web UI Kit Figma Community file ID. Used as input to the figma MCP for live lookups.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'getRegistryEntry',
    description: 'Get one component\'s full local registry entry (figmaComponentId, variants, properties, etc.) + staleness status.',
    inputSchema: {
      type: 'object',
      required: ['componentName'],
      properties: {
        componentName: { type: 'string', description: 'SAP component name (e.g. "Button")' },
      },
    },
  },
  {
    name: 'checkRegistryFreshness',
    description: 'List all registry entries by status — fresh / stale / missing Figma ID. Used to identify which components need re-validation.',
    inputSchema: {
      type: 'object',
      properties: {
        thresholdDays: { type: 'number', description: 'Days since lastValidated before an entry is "stale" (default: 30)' },
      },
    },
  },
  {
    name: 'listKnownComponents',
    description: 'List all components in the local registry with freshness indicators (✓ fresh / ⚠ stale / ✗ missing).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'listMissingFigmaIds',
    description: 'List registry entries where figmaComponentId is empty — these need to be looked up via the figma MCP.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'recordLiveData',
    description: 'Compare live Figma data (fetched by caller via figma MCP) against the local registry entry. Returns a structured diff. Use this to detect drift after re-fetching component metadata.',
    inputSchema: {
      type: 'object',
      required: ['componentName', 'liveData'],
      properties: {
        componentName: { type: 'string' },
        liveData: {
          type: 'object',
          description: 'Live data fetched from Figma: { figmaComponentId, libraryVersion, supportedVariants, supportedProperties }',
        },
      },
    },
  },
  {
    name: 'applySync',
    description: 'Write updates to a registry entry on disk. Pass dryRun:true to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['componentName', 'updates'],
      properties: {
        componentName: { type: 'string' },
        updates: { type: 'object', description: 'Fields to merge into the existing entry' },
        dryRun: { type: 'boolean', description: 'If true, return what would be written without writing' },
      },
    },
  },
  {
    name: 'markSynced',
    description: 'Set lastValidated to today on a single component or all (if componentName omitted). Updates the global sync state.',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: { type: 'string', description: 'Optional — if omitted, marks all entries' },
      },
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// MCP SERVER SETUP
// ────────────────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'sap-figma-community', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'getCurrentLibraryVersion': return toolGetCurrentLibraryVersion();
      case 'getSAPFigmaFileId':        return toolGetSAPFigmaFileId();
      case 'getRegistryEntry':         return toolGetRegistryEntry(args || {});
      case 'checkRegistryFreshness':   return toolCheckRegistryFreshness(args || {});
      case 'listKnownComponents':      return toolListKnownComponents();
      case 'listMissingFigmaIds':      return toolListMissingFigmaIds();
      case 'recordLiveData':           return toolRecordLiveData(args || {});
      case 'applySync':                return toolApplySync(args || {});
      case 'markSynced':               return toolMarkSynced(args || {});
      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (e) {
    // SECURITY FIX 2026-07-21: never return e.stack to the caller (leaks absolute paths + username).
    console.error(e.stack);
    return { isError: true, content: [{ type: 'text', text: `Tool error: ${e.message}` }] };
  }
});

// ────────────────────────────────────────────────────────────────────────────
// START
// ────────────────────────────────────────────────────────────────────────────

// ROBUSTNESS FIX 2026-07-21: surface fatal errors instead of a silent transport drop.
process.on('unhandledRejection', (err) => { console.error('[sap-figma-community-mcp] unhandledRejection:', err); });
const transport = new StdioServerTransport();
try {
  await server.connect(transport);
} catch (e) {
  console.error('[sap-figma-community-mcp] fatal:', e);
  process.exit(1);
}

console.error(`[sap-figma-community-mcp] Started.`);
console.error(`[sap-figma-community-mcp] Registry: ${REGISTRY_DIR}`);
console.error(`[sap-figma-community-mcp] Loaded ${Object.keys(getRegistry()).length} components.`);
console.error(`[sap-figma-community-mcp] SAP Figma file ID: ${SAP_FIGMA_FILE_ID}`);
