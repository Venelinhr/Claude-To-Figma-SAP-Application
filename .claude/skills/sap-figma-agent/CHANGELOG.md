# sap-figma-agent — version history

Moved out of SKILL.md on 2026-09-26 (Figma limit: 65,536 characters).
v7.10 (2026-09-26): Jev typed router at the top (generated from build/router-table.json); ACT = one ROUTE block call; sap-figma-act removed; selected border = sapList_SelectionBorderColor.

### v8 — 2026-09-27 (system v4)
- New default for new screens: Claude Code writes + validates the plan (`/plan-screen`), you build the
  pasted plan in PLAN MODE (no Step 1 stop, no redesign), Claude Code checks it (`/check-build`, MATCH %).
- PLAN MODE: every Icon Button gets its row's icon; layers named after plan elements; logos = named frames.
- Colour roles + icon meanings extended with live tokens/icons from gold 270:6722.
- Manual-fallback token table removed (keys live in the BUILD KIT).

## WHY THIS REWRITE EXISTS (read once, applies to every build)

v6 of this skill told the agent to "open the Assets panel (Shift+I), drag the
instance, set variants in the right-side panel." **The Figma Agent has no panel, no
mouse, no drag** — it only runs Plugin API code. With no code path given for "get the
real component," it silently fell back to `figma.createAutoLayout()` / `createFrame()`
+ raw text — exactly the "everything is frames" bug this rewrite fixes. v6 also tagged
colours and fonts with name comments (`[sapToken]`, `[typo:role]`) for a separate
"Bind" pass to apply later — if that pass never ran, the tags did nothing and fills
stayed raw hex. **v7 binds directly, in the same call that creates the node.** No
separate pass, nothing to forget.

---


### Version notes v7 – v7.9

Re-upload this skill to the Figma Agent panel whenever any rule changes — the Agent only
knows what's in this file. v7 (2026-09-25): full rewrite from v6's UI-panel workflow
(Assets panel / drag / right-side panel — none of which the Agent can perform) to a
code-first workflow built on the project's real `build/templates/sap-kit.prelude.js`
runtime. Kept the plan-mode artifacts that already worked (VDI table, floorplan tree,
confidence table, ASCII wireframe, ⚡ suggestions) and added the Component inventory
table with real keys as a fifth, mandatory Step-1 artifact — that table is the actual
fix: it forces a real kit key for every zone before any code runs. Added the State
table and Text style table, folded self-check into the build call itself (`WARN` +
`nativeWithPaintOrText`), resolved v6's rule conflicts (clone-vs-build-fresh, Form Item
vs Label+Input), and merged the 3x-repeated Schedule dialog spec into one block.

v7.1 (2026-09-26): a real build made with v7 still had unbound text — screen title
("Sofia (SOF) → Lamezia Terme (SUF)"), a big time ("21:00"), and bold address labels
all showed font family "Inter" in the inspector instead of the kit's "72" font, i.e.
built with a raw `figma.createText()` instead of `T()`. Root cause: large/bold display
text reads as "special" and gets a one-off treatment, while small 14px body text
correctly went through `T()` every time. Fixed: Text Style Table now states explicitly
that size/weight change nothing about the rule, added named styles for title/time/price
roles (H2/H3/H4 Bold) so there's no excuse to freehand a size, and Step 3's self-check
now programmatically scans every text node's `fontName.family` and fails on anything
that isn't `"72"` (`unstyledText` in the returned object) — this is no longer something
that can be missed by eye.

v7.2 (2026-09-26): the "read the whole kit" fix from v7.1 only covered components (153
of them, vs a ~35-name memorized shortlist before). v7.2 extends the same fix to the
other 4 kit categories, which had the identical gap: colours (142 variables, grouped by
prefix), text styles (25, now listed in full — it's short enough), icons (61), and
effects/shadows (12, now listed in full). Each now has its own "check the real catalog"
instruction and lookup command instead of relying on a name sounding plausible.

v7.3 (2026-09-26): pointed Step 0 and Step 4 at this project's own real measuring/audit
tools (`build/measure-ref.py`, `build/audit-screen.py`) instead of only reading by eye.
These scripts already exist in v3 projects, are proven (real bugs caught: a missing
swap-icon, wrong Compact/Cozy density on 7 checkboxes), and give exact px/token
readings the agent's own vision reasoning can only approximate. Step 0 now runs
measure-ref.py as the front gate whenever it's present; Step 4 already ran
audit-screen.py conditionally — reworded it to make clear it's the end gate, not an
optional extra, with the manual by-eye steps kept as the fallback when the scripts
aren't in this particular project.

v7.4 (2026-09-26): a real build still had unbound display text (title, price time) —
twice, despite v7.1's in-call self-check. Root cause: the self-check ran INSIDE the
same build call, checking the agent's own work from memory — the exact call that made
the mistake was also the one grading it. Found `build/verify-invariants.js` already
existed in this project with INV 3 doing precisely this check (font family must be
`"72"`) against the REAL node tree from outside the build call, and confirmed it needs
no `[typo:role]` tag for v7's un-tagged direct-binding style (font `"72"` at a real
role size passes with no tag — checked the actual source). It had simply never been
referenced in this skill. Step 3 is now two explicit layers: the in-call return (kept,
still useful as a first hint) plus this external re-check as the real gate, run before
Step 4. `expand-tree-dump.js` is the companion tool if the dump needs converting from
the compact row format.

v7.5 (2026-09-26): a real build's audit MISSING list correctly named two real gaps (a
bordered box around a pair of icons, a leading icon on each card's description line) —
the agent read the audit's own documented caveat ("the aggregate score can misjudge a
close screen") and applied it to the wrong thing: it skimmed the score, decided the
list was probably noise too, and called the build done without checking either named
line. The lines were correct; the discipline of checking them one by one was skipped.
Fixed: Step 4 now states this exact failure explicitly (so it's recognized, not
repeated), and both Step 4 and Step 5 require an explicit fixed/skipped-with-reason
disposition for every single MISSING/WRONG COLOUR/WRONG DENSITY/EXTRA line before the
build can be handed off — "the score can be wrong" is now scoped to the TOTAL number
only, never to an individual named line with coordinates.

v7.6 (2026-09-26): a real 1-line change (add a selected-state border, one bound
variable, one property) took 1.5 minutes end to end through this skill. Traced why:
Quick Mode correctly skipped the Step 1 plan for a small edit, but still routed the
change through the same full Step 2/3 machinery a whole new build needs — reload the
85-line prelude, look up the token, run the in-call check, AND run the external
`verify-invariants.js` node-tree export-and-check (Step 3 Layer 2). That's fixed
overhead sized for a multi-section build, applied to a single property. Added **ACT
MODE**, a new top-level mode above Quick Mode: for any request that names a concrete,
already-decided change (a property, color, state, spacing, icon, alignment) — find the
node, look up the one token if needed, apply it directly, one screenshot, one-line
report. No plan, no approval stop, no Component inventory table, no external
verify-invariants.js run. Quick Mode still exists for edits bigger than one property
(add a column, several related changes) where the full self-check still earns its
cost. The mode split is now stated as the very first thing in the skill, since it's
the main lever for the skill's actual purpose — acting fast inside Figma instead of
routing everything through Claude via MCP.

Old version kept at `SKILL.v6-backup-2026-09-25.md` in this same folder.
