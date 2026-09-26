// SAP Quick Actions — one-click state/border/density changes on the selection.
// No model, no UI: runs the change and closes. Every colour is a bound SAP variable.

const KEY = {
  sapActiveColor: '8280fcbaf014930076ff69cc352ce47246d4829c',
  sapList_BorderColor: 'ae5e040923e301aea32233ae118cc187149588b0',
};

// On/off prop per SAP kit component (checked against the kit 2026-09-26).
const TOGGLE = [
  { prop: 'Check', on: 'Checked', off: 'Unchecked' },   // Check Box
  { prop: 'Checked', on: 'True', off: 'False' },        // Switch
  { prop: 'Selected', on: 'True', off: 'False' },       // Radio Button, Table Cell
];

function defsOf(inst) {
  const p = inst.mainComponent && inst.mainComponent.parent;
  return p && p.type === 'COMPONENT_SET' ? p.componentPropertyDefinitions : {};
}

function hasVariant(inst) { return Object.keys(defsOf(inst)).length > 0; }

function targets(sel) {
  // An instance is its own target; a frame acts on the instances inside it.
  const out = [];
  for (const n of sel) {
    if (n.type === 'INSTANCE') out.push(n);
    else if ('findAll' in n) out.push(...n.findAll(x => x.type === 'INSTANCE' && hasVariant(x)));
  }
  return out;
}

// Set one variant prop only if the component really has that prop and value.
function setVariant(inst, prop, value) {
  const d = defsOf(inst)[prop];
  if (!d || d.type !== 'VARIANT' || d.variantOptions.indexOf(value) < 0) return false;
  inst.setProperties({ [prop]: value });
  return true;
}

function toggle(inst) {
  const props = inst.componentProperties;
  for (const t of TOGGLE) {
    if (!props[t.prop]) continue;
    const next = props[t.prop].value === t.on ? t.off : t.on;
    if (setVariant(inst, t.prop, next)) return true;
  }
  return false;
}

async function border(nodes, key, weight) {
  const v = await figma.variables.importVariableByKeyAsync(key);
  const paint = figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
  let n = 0;
  for (const node of nodes) {
    if (!('strokes' in node)) continue;
    node.strokes = [paint];
    node.strokeAlign = 'INSIDE';
    node.strokeWeight = weight;
    n++;
  }
  return n;
}

async function run(cmd, sel) {
  if (!sel.length) return 'Select something first';
  let n = 0;
  if (cmd === 'toggle') { for (const i of targets(sel)) if (toggle(i)) n++; return n + ' toggled'; }
  if (cmd === 'border-selected') return (await border(sel, KEY.sapActiveColor, 2)) + ' → selected border';
  if (cmd === 'border-normal') return (await border(sel, KEY.sapList_BorderColor, 1)) + ' → normal border';

  const variant = {
    'type-primary': ['Type', 'Primary'], 'type-secondary': ['Type', 'Secondary'],
    'type-tertiary': ['Type', 'Tertiary'],
    'ff-compact': ['Form Factor', 'Compact'], 'ff-cozy': ['Form Factor', 'Cozy'],
    'state-disabled': ['Interaction State', 'Disabled'],
    'state-regular': ['Interaction State', 'Regular'],
  }[cmd];
  if (variant) { for (const i of targets(sel)) if (setVariant(i, variant[0], variant[1])) n++; return n + ' → ' + variant[1]; }

  const pad = { 'pad-16': 16, 'pad-24': 24, 'pad-32': 32 }[cmd];
  if (pad !== undefined) {
    for (const node of sel) if ('paddingLeft' in node) { node.paddingLeft = pad; node.paddingRight = pad; n++; }
    return n + ' → side padding ' + pad;
  }
  return 'Unknown action';
}

run(figma.command, figma.currentPage.selection)
  .then(msg => figma.closePlugin(msg))
  .catch(e => figma.closePlugin('Error: ' + e.message));
