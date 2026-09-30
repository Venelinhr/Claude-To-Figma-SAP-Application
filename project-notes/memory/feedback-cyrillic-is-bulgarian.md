---
name: feedback-cyrillic-is-bulgarian
description: "Cyrillic text in this user's reference images is Bulgarian — never call it Russian; keep texts Bulgarian in plans and Figma"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-27T18:25:47.902Z
---

Cyrillic in the user's references (flight screens: Спирки, Най-добро, Избор…) is **Bulgarian**. Never call it Russian.

**Why:** the user corrected this sharply (2026-09-27) when OCR output mentioned the ru-RU model.

**How to apply:** say "Bulgarian (bg)". macOS Vision has no bg model — `build/see.py --lang bg` uses the Cyrillic model only for letter shapes, then fixes Latin look-alike letters (o→о, a→а…) inside Cyrillic words. Plan texts stay exactly as in the image. Related: [[workflow-v4-split]].
