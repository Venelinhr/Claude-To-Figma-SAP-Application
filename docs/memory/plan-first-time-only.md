---
name: plan-first-time-only
description: Show the plan (and ask Approve/Reject/Modify) only for the FIRST build of a screen; later edits/fixes/rebuilds go straight through — no plan unless the user asks
metadata:
  node_type: memory
  type: feedback
  originSessionId: b421efbc-fb98-4219-88d9-45d25321762e
  modified: 2026-10-05T03:56:23.168Z
---

User rule (2026-10-05): "show the plan when started for the very first time! After that, if you do changes, don't show the plan — only on user request or to ask a question."

**Why:** repeating the plan after every small fix wasted time and felt like noise.
**How to apply:** first build of a new screen/image → ASCII plan + Approve/Reject/Modify (Claude chat AND plugin). Any later change on that built frame (fix, adjust, rebuild) → just do it, report what changed. Bridge prompts chat.md/job.md carry the same rule. Related: [[plugin-first-builder]].
