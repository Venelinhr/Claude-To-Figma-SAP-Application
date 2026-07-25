#!/usr/bin/env python3
"""
bulk-refresh-guidelines.py — Direct Chrome MCP guideline refresher
===================================================================
Called from a Claude session that has Chrome MCP access.
Reads each component URL, navigates Chrome MCP, extracts structured data,
and writes updated knowledge/guidelines/{Name}.json files.

This script is meant to be EXECUTED by Claude Code (not imported).
Run it with: python3 build/bulk-refresh-guidelines.py [--all] [--priority]

The actual HTTP navigation happens via Chrome MCP tools called by the Claude session.
This script documents the extraction logic and schema mapping used.

For the Claude session to run the refresh, use the JS extractor below in
evaluate_script after navigating each page.
"""

EXTRACTOR_JS = """
(() => {
  const main = document.querySelector('main#main');
  if (!main) return null;

  const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content?.trim() || '';
  const url = window.location.href.replace(/[?#].*$/, '');

  // Extract page text by section
  const sections = {};
  let currentSection = 'intro';
  const allText = [];

  main.querySelectorAll('h2, h3, p, li').forEach(el => {
    const tag = el.tagName.toLowerCase();
    const text = el.innerText?.trim();
    if (!text) return;
    if (tag === 'h2') { currentSection = text.toLowerCase().replace(/\\s+/g, '_'); sections[currentSection] = []; }
    else if (tag === 'h3') { allText.push('### ' + text); }
    else if (tag === 'p') { allText.push(text); }
    else if (tag === 'li') { allText.push('* ' + text); }
    if (sections[currentSection]) sections[currentSection].push(text);
  });

  // Do/Don't rules
  const doRules = [], dontRules = [];
  let inDo = false, inDont = false;
  main.querySelectorAll('li, h3').forEach(el => {
    const t = el.tagName.toLowerCase();
    const text = el.innerText?.trim();
    if (t === 'h3' && text?.toLowerCase() === 'do') { inDo = true; inDont = false; return; }
    if (t === 'h3' && text?.toLowerCase() === "don't") { inDo = false; inDont = true; return; }
    if (t === 'li' && inDo) doRules.push(text);
    if (t === 'li' && inDont) dontRules.push(text);
  });

  // When to use / not use
  const whenToUse = (sections['when_to_use'] || sections['use'] || []).filter(t => t.startsWith('* ')).map(t => t.slice(2));
  const whenNotToUse = (sections['don\'t'] || sections['don_t'] || []).filter(t => t.startsWith('* ')).map(t => t.slice(2));

  // Keyboard nav table
  const kbRows = [];
  main.querySelectorAll('table tr').forEach((row, i) => {
    if (i === 0) return;
    const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
    if (cells.length >= 2) kbRows.push({ key: cells[0], action: cells[1] });
  });

  // API + Figma links
  const apiLinks = Array.from(new Set(
    Array.from(main.querySelectorAll('a[href*="ui5.sap.com"]')).map(a => a.href)
  ));
  const figmaLink = Array.from(main.querySelectorAll('a[href*="figma.com"]')).map(a => a.href)[0] || '';

  // Related
  const related = Array.from(new Set(
    Array.from(main.querySelectorAll('a[href*="ui-elements/"]'))
      .map(a => a.innerText.trim()).filter(t => t)
  ));

  // Image alt texts
  const imageAlts = Array.from(main.querySelectorAll('img[alt]'))
    .map(i => i.alt).filter(a => a.length > 5);

  return {
    componentName: document.querySelector('h1')?.innerText?.trim() || document.title,
    sourceUrl: url,
    status: getMeta('uielementsstatus') || 'Available',
    category: getMeta('uielementscategory') || '',
    modified: getMeta('modified-time') || '',
    fullText: main.innerText,
    doRules,
    dontRules,
    whenToUse,
    whenNotToUse,
    keyboardNav: kbRows,
    apiLinks,
    figmaLink,
    related,
    imageAlts,
    sectionsFound: Object.keys(sections)
  };
})()
"""

# Priority components (most used in SAP Fiori builds)
PRIORITY_COMPONENTS = [
    "Button", "Input", "Dialog", "Select", "CheckBox", "DatePicker",
    "Table", "List", "ShellBar", "Toolbar", "OverflowToolbar",
    "DynamicPage", "FilterBar", "Form", "IconTabBar", "MessageBox",
    "Popover", "Avatar", "BusyIndicator", "MultiComboBox", "ComboBox",
    "RadioButton", "Link", "Text", "Label", "Switch"
]

if __name__ == "__main__":
    import json, sys
    from pathlib import Path

    project_root = Path(__file__).resolve().parent.parent
    reg_dir = project_root / "knowledge" / "components" / "registry"

    for name in PRIORITY_COMPONENTS:
        f = reg_dir / f"{name}.json"
        if f.exists():
            d = json.loads(f.read_text())
            url = d.get("guidelineUrl", "")
            if url:
                print(f"{name}: {url}")
