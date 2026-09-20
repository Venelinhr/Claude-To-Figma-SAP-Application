# Test Fixtures

Sample JSON files used by the RULE 25 tag-contract linter (`build/lint-mcp-frame.js`)
and the post-build invariant gate (`build/verify-invariants.js`).

| File | Purpose |
|------|---------|
| `mcp-frame-clean.json` | A correctly tagged MCP-first frame — linter must pass this |
| `mcp-frame-broken.json` | A frame with raw hex fills and bad token tags — linter must fail this |
| `invariants/good-sap-frame.json` | A correctly bound SAP frame — `verify-invariants.js` must PASS this |
| `invariants/bad-native-frame.json` | A native-frame wireframe (fake components) — must FAIL |
| `invariants/instance-rawhex-override.json` | A SAP instance with an unbound raw-hex fill OVERRIDE — must FAIL (INV 2 instance-override hole) |
| `invariants/stroke-only-rawhex.json` | A node with an EMPTY `fills` array and an unbound raw-hex **stroke** — the exact shape of every table-row divider / card border in this system. Must FAIL. Regression fixture for the "fills-only, strokes-blind" checker bug class (same class fixed in the sibling `sap-figma-native` project's `checkRawHex`). |
| `invariants/stroke-only-bound-clean.json` | Same shape as above but the stroke IS bound to a SAP variable — must PASS. Guards against a false positive once strokes are checked. |

Run via `bash build/test-build.sh` as part of the regression suite.
