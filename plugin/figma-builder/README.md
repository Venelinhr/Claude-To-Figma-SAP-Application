# This plugin does NOT build SAP screens

If you installed this plugin standalone and ran it expecting SAP Web UI Kit
components to appear — that is not what it does, even if the SAP Web UI Kit
is linked as a library in your file.

## What this plugin actually is

A **token binder**, not a screen builder. It takes frames that were already
built elsewhere (by Claude Code, via the `use_figma` MCP tool and this repo's
`/sap-screen` skill) and:
- rebinds raw hex fills/strokes to real SAP design token variables
- swaps `[icon:...]` placeholder text for real SAP kit icon instances
- applies SAP text styles to `[typo:role]`-tagged text
- runs accessibility checks

It never calls `importComponentSetByKeyAsync` to create a Button, Table,
Input, etc. If you run it on a blank page or hand-drawn frames, you will get
`No frames to bind` — that is expected, not a bug.

## How to actually build a real SAP screen

1. Open a terminal, `cd` into this repo, run `claude` (see main [README](../../README.md))
2. In Claude Code: `/sap-screen <reference image or description> <your Figma URL>`
3. Claude builds the screen using real SAP Web UI Kit component instances
4. **Then** open this plugin in that same Figma file and click **Bind SAP Tokens**

Step 2 is the part that creates real components. This plugin only does step 4.
