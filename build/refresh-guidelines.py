#!/usr/bin/env python3
"""
refresh-guidelines.py — Chrome MCP-driven SAP Fiori guideline auto-refresh
==========================================================================

Usage:
    python3 build/refresh-guidelines.py [--component <name>] [--all] [--stale-days <N>]

Examples:
    # Refresh a single component
    python3 build/refresh-guidelines.py --component Button

    # Refresh all components (uses Chrome MCP for each URL)
    python3 build/refresh-guidelines.py --all

    # Refresh only components whose guideline is older than 30 days
    python3 build/refresh-guidelines.py --stale-days 30

How it works:
    1. Reads knowledge/components/registry/ to get guidelineUrl for each component.
    2. For each target, opens the guideline page in Chrome via the MCP.
    3. Reads the page content and distills it into the 17-field guideline JSON schema.
    4. Writes the result to knowledge/guidelines/{ComponentName}.json.
    5. Sets lastChecked to today.

Prerequisites:
    - Chrome MCP server must be running (claude-devtools MCP).
    - This script DOES NOT call the MCP directly — it GENERATES a Claude prompt
      that, when run in a Claude Code session with Chrome MCP, will perform
      the refresh for each component. This is because the Chrome MCP is only
      available inside Claude sessions, not from a standalone Python script.

Alternatively — Manual / assisted workflow:
    Run with --generate-prompts to produce a list of prompts, one per component,
    that you can paste into a Claude session with Chrome MCP access.

Output:
    knowledge/guidelines/{ComponentName}.json (overwritten with fresh content)
    build/refresh-log-YYYYMMDD.json           (what was refreshed, what changed)

Added: 2026-07-09
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REGISTRY_DIR = PROJECT_ROOT / "knowledge" / "components" / "registry"
GUIDELINES_DIR = PROJECT_ROOT / "knowledge" / "guidelines"
LOG_DIR = PROJECT_ROOT / "build"

GUIDELINE_SCHEMA_FIELDS = [
    "componentName", "slug", "sourceUrl", "purpose",
    "whenToUse", "whenNotToUse", "doRules", "dontRules",
    "layoutGuidance", "contentGuidance", "responsiveBehavior",
    "accessibilityGuidance", "patterns", "compatibility",
    "exceptions", "version", "lastChecked"
]

SAP_FIORI_BASE = "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/"


def load_registry() -> dict:
    """Return {name: entry} for every registry JSON."""
    reg = {}
    for f in sorted(REGISTRY_DIR.glob("*.json")):
        if f.name == "_schema.json":
            continue
        try:
            reg[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  ⚠  Invalid JSON in registry/{f.name}: {e}", file=sys.stderr)
    return reg


def load_cached_guideline(name: str) -> dict | None:
    path = GUIDELINES_DIR / f"{name}.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def days_since_last_checked(entry: dict) -> int | None:
    lc = entry.get("lastChecked")
    if not lc:
        return None
    try:
        d = datetime.strptime(lc, "%Y-%m-%d").date()
        return (date.today() - d).days
    except ValueError:
        return None


def slug_from_url(url: str) -> str:
    """Extract slug from SAP guideline URL."""
    url = url.rstrip("/")
    return url.split("/")[-1]


def generate_claude_prompt(name: str, guideline_url: str, existing: dict | None) -> str:
    """
    Generate a Claude prompt that, when run with Chrome MCP access,
    will fetch the guideline page and write the updated JSON.
    """
    output_path = GUIDELINES_DIR / f"{name}.json"
    slug = slug_from_url(guideline_url)
    existing_json = json.dumps(existing, indent=2) if existing else "null"

    return f'''# Refresh SAP Fiori guideline: {name}

Source URL: {guideline_url}

Steps:
1. Use Chrome MCP: `navigate_page("{guideline_url}")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${{n}}"]`)?.content || '';
   return {{
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({{text: a.innerText.trim(), href: a.href}})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   }};
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === '{name}' || s.name.endsWith('.{name}'));
   return ctrl ? {{ desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink }} : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "{name}"
   - slug: "{slug}"
   - sourceUrl: "{guideline_url}"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: {{ placement, sizing, spacing, alignment }}
   - contentGuidance: {{ labelLength, contentRules, examples: [] }}
   - responsiveBehavior: {{ XL, L, M, S }}
   - accessibilityGuidance: {{ wcagCriteria: [], requirements: [] }}
   - patterns: [array of pattern names this component participates in]
   - compatibility: {{ allowedWith: [], forbiddenWith: [] }}
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "{date.today().isoformat()}"

Existing guideline (use as fallback for any field not found on the page):
{existing_json}

6. Write the result to: `{output_path}`
7. Confirm: "Updated {name}.json — N fields populated"
'''


def generate_batch_script(targets: list[tuple[str, str, dict | None]], output_path: Path) -> None:
    """Write a batch prompt file for running all refreshes in one Claude session."""
    lines = [
        "# SAP Fiori Guideline Batch Refresh",
        f"# Generated: {datetime.now().isoformat()}",
        f"# Components: {len(targets)}",
        "",
        "Run each prompt below in sequence in a Claude session with Chrome MCP access.",
        "",
        "─" * 60,
        ""
    ]
    for i, (name, url, existing) in enumerate(targets, 1):
        lines.append(f"## [{i}/{len(targets)}] {name}")
        lines.append("")
        lines.append(generate_claude_prompt(name, url, existing))
        lines.append("─" * 60)
        lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n  Batch prompt file written: {output_path}")
    print(f"  Paste it into a Claude session with Chrome MCP to run all {len(targets)} refreshes.")


def check_stale(reg: dict, stale_days: int) -> list[str]:
    """Return component names whose guideline is older than stale_days."""
    stale = []
    for name, entry in reg.items():
        cached = load_cached_guideline(name)
        if cached is None:
            stale.append(name)
            continue
        age = days_since_last_checked(cached)
        if age is None or age >= stale_days:
            stale.append(name)
    return sorted(stale)


def print_status(reg: dict) -> None:
    """Print a freshness report for all components."""
    today = date.today()
    fresh = stale = missing = 0
    print(f"\n{'Component':<30} {'Guideline':<12} {'Age':<10} {'URL'}")
    print("─" * 80)
    for name, entry in sorted(reg.items()):
        cached = load_cached_guideline(name)
        url = entry.get("guidelineUrl", "")
        if cached is None:
            print(f"  {name:<28} {'MISSING':<12} {'—':<10} {url}")
            missing += 1
        else:
            age = days_since_last_checked(cached)
            age_str = f"{age}d" if age is not None else "?"
            status = "STALE" if (age is None or age > 30) else "FRESH"
            print(f"  {name:<28} {status:<12} {age_str:<10} {url}")
            if status == "FRESH":
                fresh += 1
            else:
                stale += 1
    print("─" * 80)
    print(f"  Fresh (<30 days): {fresh}  ·  Stale (>30 days): {stale}  ·  Missing: {missing}")


def main() -> int:
    parser = argparse.ArgumentParser(description="SAP Fiori guideline auto-refresh")
    parser.add_argument("--component", metavar="NAME", help="Refresh a single component")
    parser.add_argument("--all", action="store_true", help="Generate refresh prompts for all components")
    parser.add_argument("--stale-days", type=int, metavar="N", default=30,
                        help="Target components older than N days (default: 30)")
    parser.add_argument("--status", action="store_true", help="Show freshness status for all components")
    parser.add_argument("--generate-prompts", action="store_true",
                        help="Write batch prompt file (default when --all or --stale-days used)")
    args = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        return 0

    reg = load_registry()
    print(f"\nLoaded {len(reg)} registry entries")

    if args.status:
        print_status(reg)
        return 0

    # Determine which components to target
    targets: list[tuple[str, str, dict | None]] = []

    if args.component:
        name = args.component
        if name not in reg:
            print(f"  ✗ '{name}' not found in registry", file=sys.stderr)
            return 1
        url = reg[name].get("guidelineUrl", "")
        if not url:
            print(f"  ✗ '{name}' has no guidelineUrl in registry", file=sys.stderr)
            return 1
        targets = [(name, url, load_cached_guideline(name))]

    elif args.all:
        for name, entry in sorted(reg.items()):
            url = entry.get("guidelineUrl", "")
            if url:
                targets.append((name, url, load_cached_guideline(name)))
        print(f"  Targeting all {len(targets)} components with guidelineUrl")

    else:
        # Default: stale-days mode
        stale_names = check_stale(reg, args.stale_days)
        for name in stale_names:
            url = reg[name].get("guidelineUrl", "")
            if url:
                targets.append((name, url, load_cached_guideline(name)))
        print(f"  {len(targets)} components older than {args.stale_days} days")

    if not targets:
        print("  Nothing to refresh.")
        return 0

    # Output mode
    if args.generate_prompts or args.all or not args.component:
        # Write batch prompt file
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        batch_file = LOG_DIR / f"refresh-guidelines-batch-{ts}.md"
        generate_batch_script(targets, batch_file)
    else:
        # Single component — print prompt to stdout for easy paste
        name, url, existing = targets[0]
        print(f"\n{'─'*60}")
        print(f"Prompt for refreshing: {name}")
        print(f"{'─'*60}\n")
        print(generate_claude_prompt(name, url, existing))

    # Write log
    log = {
        "date": datetime.now().isoformat(),
        "mode": "single" if args.component else ("all" if args.all else f"stale-{args.stale_days}d"),
        "targets": [{"name": n, "url": u} for n, u, _ in targets],
        "count": len(targets)
    }
    log_path = LOG_DIR / f"refresh-log-{datetime.now().strftime('%Y%m%d')}.json"
    log_path.write_text(json.dumps(log, indent=2), encoding="utf-8")
    print(f"\n  Log written: {log_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
