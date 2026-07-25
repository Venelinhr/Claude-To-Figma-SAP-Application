# SAP Fiori Guideline Batch Refresh
# Generated: 2026-07-25T10:22:18.703397
# Components: 139

Run each prompt below in sequence in a Claude session with Chrome MCP access.

────────────────────────────────────────────────────────────

## [1/139] AIButton

# Refresh SAP Fiori guideline: AIButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AIButton' || s.name.endsWith('.AIButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AIButton"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AIButton",
  "slug": "ai-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A button variant that triggers an AI-powered action (Joule integration). Visually distinguished with the SAP AI accent color and often a spark or wand icon. Used to signal AI-assisted features to users.",
  "whenToUse": [
    "Trigger an AI-generated action (draft an email, summarize, translate)",
    "Open a Joule assistant panel or overlay",
    "Invoke autocomplete, suggestion, or generation flows",
    "Distinguish AI actions from standard actions in the same toolbar"
  ],
  "whenNotToUse": [
    "For non-AI actions \u2014 use standard Button",
    "For destructive actions \u2014 even AI-driven destructive actions should use standard Button with type=Negative",
    "For navigation \u2014 use Link",
    "For settings toggles \u2014 use Switch"
  ],
  "doRules": [
    "Pair with a Joule spark or wand icon for immediate recognition",
    "Keep labels action-oriented ('Draft response', 'Summarize', 'Suggest values')",
    "Show a loading state during AI processing",
    "Provide undo or edit for AI-generated content \u2014 never make it final without user consent"
  ],
  "dontRules": [
    "Do not use the AI style for non-AI actions \u2014 misleading",
    "Do not omit the icon \u2014 the visual cue is essential",
    "Do not use for silent background AI (that should have no button)",
    "Do not chain AI Buttons without user confirmation between steps"
  ],
  "layoutGuidance": {
    "placement": "In toolbars, form actions, empty states, alongside AI-generated content",
    "sizing": "Height 32px compact, 40px cozy",
    "spacing": "Standard button spacing (8px)",
    "alignment": "Same as regular buttons"
  },
  "contentGuidance": {
    "labelLength": "\u2264 25 chars, verb-first",
    "contentRules": "Action-oriented ('Draft', 'Summarize', 'Explain')",
    "examples": [
      "\u2728 Draft response",
      "\u2728 Summarize with Joule"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + label",
    "L": "Icon + label",
    "M": "Icon + label",
    "S": "Icon only, label in tooltip"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "aria-label describes the AI action ('Draft response with Joule')",
      "Loading state announced (aria-busy='true')",
      "AI accent color meets 4.5:1 contrast against background",
      "Icon has meaningful role (not decorative)"
    ]
  },
  "patterns": [
    "Joule integration",
    "AI-assisted form fill",
    "Content generation"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "Form",
      "Card",
      "Panel",
      "DynamicPageTitle actions"
    ],
    "forbiddenWith": [
      "Inside another AI element without visual separation"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AIButton.json`
7. Confirm: "Updated AIButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [2/139] AIInput

# Refresh SAP Fiori guideline: AIInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AIInput' || s.name.endsWith('.AIInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AIInput"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AIInput",
  "slug": "joule-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A single-line text input with AI-assisted suggestions or completion. Visually distinguished by the Joule accent border. User types, the AI proposes completions or corrections inline.",
  "whenToUse": [
    "Field that benefits from AI-assisted autocomplete (names, entities, tags)",
    "Free-text prompt to Joule for a single-line query",
    "Search field with AI-enhanced ranking",
    "Any input where AI can meaningfully reduce typing effort"
  ],
  "whenNotToUse": [
    "For structured field entry (dates, numbers) \u2014 use DatePicker/StepInput",
    "For multi-line prompts \u2014 use AITextArea or AIPromptInput",
    "For simple text without AI value \u2014 use Input",
    "For password entry \u2014 use Input type=password"
  ],
  "doRules": [
    "Show a Joule accent (border or icon) so users know AI is active",
    "Let users accept, reject, or edit AI suggestions before commit",
    "Preserve typed-so-far text while suggesting completions inline",
    "Support the same keyboard patterns as Input (Tab, Enter, Escape)"
  ],
  "dontRules": [
    "Do not auto-commit AI suggestions without user consent",
    "Do not hide the fact that AI is involved",
    "Do not use for high-stakes numeric or ID fields where AI mistakes are costly",
    "Do not chain multiple AIInputs without visible AI feedback per field"
  ],
  "layoutGuidance": {
    "placement": "Inside forms, filter bars, search regions",
    "sizing": "Standard Input dimensions",
    "spacing": "Standard field spacing",
    "alignment": "Full width in FormElement"
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 40 chars",
    "contentRules": "Placeholder describes what to type and hints at AI value",
    "examples": [
      "\"Describe the supplier \u2014 Joule will find matches\""
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width",
    "L": "Full width",
    "M": "Full width",
    "S": "Full width"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 3.3.2 Labels or Instructions (Level A)"
    ],
    "requirements": [
      "aria-describedby points to a hint explaining AI assistance",
      "aria-autocomplete='list' or 'both' as appropriate",
      "Suggestions announced via aria-live='polite'",
      "Screen reader announces 'AI-assisted' role on focus"
    ]
  },
  "patterns": [
    "AI-assisted search",
    "Joule prompt entry",
    "Smart autocomplete field"
  ],
  "compatibility": {
    "allowedWith": [
      "Form",
      "FormElement",
      "FilterBar",
      "Dialog"
    ],
    "forbiddenWith": [
      "Table cells (too dense)"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AIInput.json`
7. Confirm: "Updated AIInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [3/139] AIMenuButton

# Refresh SAP Fiori guideline: AIMenuButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AIMenuButton' || s.name.endsWith('.AIMenuButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AIMenuButton"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AIMenuButton",
  "slug": "joule-menu-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A menu button variant styled with the SAP AI accent, opening a menu of Joule-powered actions. Used in toolbars where multiple AI actions are grouped behind one entry point.",
  "whenToUse": [
    "Toolbar entry point for 2\u20138 AI-powered actions",
    "Card or panel header with an AI shortcut menu",
    "Object page actions where AI is one of several action groups",
    "When AI actions need dedicated visual emphasis"
  ],
  "whenNotToUse": [
    "For a single AI action \u2014 use AIButton",
    "For non-AI menu \u2014 use MenuButton",
    "For AI action with variants sharing a primary \u2014 use AISplitMenuButton",
    "For >8 items \u2014 use a dedicated Joule panel"
  ],
  "doRules": [
    "Group related AI actions (e.g. 'Summarize', 'Draft', 'Translate')",
    "Include a Joule spark icon on the button",
    "Order menu items by frequency of use",
    "Keep menu concise \u2014 3\u20136 items is ideal"
  ],
  "dontRules": [
    "Do not mix AI and non-AI actions in the same menu \u2014 split them",
    "Do not omit the AI visual accent \u2014 users need to know AI is invoked",
    "Do not use for destructive actions",
    "Do not chain AI actions without user confirmation between steps"
  ],
  "layoutGuidance": {
    "placement": "Toolbars, DynamicPageTitle actions, card headers",
    "sizing": "Height 32px compact, 40px cozy",
    "spacing": "Standard button spacing",
    "alignment": "Same as other buttons in the row"
  },
  "contentGuidance": {
    "labelLength": "\u2264 25 chars, verb-first",
    "contentRules": "Action-oriented labels",
    "examples": [
      "\u2728 AI Actions \u25bc",
      "\u2728 Joule \u25bc"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + label + chevron",
    "L": "Same",
    "M": "Same",
    "S": "Icon + chevron only"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "role='button' with aria-haspopup='menu' and aria-expanded",
      "aria-label describes menu contents ('AI actions')",
      "Menu items have role='menuitem'",
      "Keyboard: Enter opens; Arrow keys navigate; Escape closes"
    ]
  },
  "patterns": [
    "Toolbar AI actions",
    "Object page AI menu",
    "Card header AI shortcut"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "DynamicPageTitle",
      "Card"
    ],
    "forbiddenWith": [
      "Table cells",
      "Inline in text"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AIMenuButton.json`
7. Confirm: "Updated AIMenuButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [4/139] AIPromptInput

# Refresh SAP Fiori guideline: AIPromptInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AIPromptInput' || s.name.endsWith('.AIPromptInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AIPromptInput"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AIPromptInput",
  "slug": "joule-prompt-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A prominent multi-line input for prompting Joule with a question, instruction, or context. Includes a Send action, character counter, and optional attach/upload controls. The primary entry point to Joule conversations.",
  "whenToUse": [
    "As the main input in a Joule conversation panel",
    "For open-ended prompts that require multiple sentences",
    "When user needs to iterate on a prompt before sending",
    "As a standalone entry point to AI generation"
  ],
  "whenNotToUse": [
    "For single-line search \u2014 use AIInput",
    "For rich-text with formatting \u2014 use AIRichTextEditor",
    "For non-AI multi-line input \u2014 use TextArea",
    "As a form field for structured data \u2014 use TextArea with validation"
  ],
  "doRules": [
    "Provide a clear Send affordance (button or Enter binding)",
    "Show a character/token counter if there's a limit",
    "Include example prompts for first-time users",
    "Support Cmd/Ctrl+Enter to send while Enter inserts a newline"
  ],
  "dontRules": [
    "Do not auto-send without explicit user action",
    "Do not truncate the input at a low character count without warning",
    "Do not send an empty prompt",
    "Do not hide previous prompts from history"
  ],
  "layoutGuidance": {
    "placement": "Bottom of Joule panel, top of AI-generation flows",
    "sizing": "Min height 96px, max 240px with scroll; full width of panel",
    "spacing": "16px internal padding",
    "alignment": "Text top-left, Send button bottom-right, counter bottom-left"
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 60 chars",
    "contentRules": "Prompt is any user text; system may add context before sending",
    "examples": [
      "\"Ask Joule anything about your data...\""
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width of panel",
    "L": "Full width",
    "M": "Full width",
    "S": "Full width, may fill viewport height"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 3.3.2 Labels or Instructions (Level A)",
      "WCAG 2.1 \u00b7 4.1.3 Status Messages (Level AA)"
    ],
    "requirements": [
      "aria-label='Message Joule'",
      "Send button has aria-label='Send prompt'",
      "Character counter announced when nearing limit",
      "Response streaming announced via aria-live='polite'"
    ]
  },
  "patterns": [
    "Joule conversation input",
    "AI generation prompt",
    "Ask AI panel"
  ],
  "compatibility": {
    "allowedWith": [
      "Joule panel",
      "Popover",
      "Dialog"
    ],
    "forbiddenWith": [
      "Table cells",
      "Inline form field"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AIPromptInput.json`
7. Confirm: "Updated AIPromptInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [5/139] AIRichTextEditor

# Refresh SAP Fiori guideline: AIRichTextEditor

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AIRichTextEditor' || s.name.endsWith('.AIRichTextEditor'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AIRichTextEditor"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AIRichTextEditor",
  "slug": "joule-rich-text-editor",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A rich-text editor with AI-assisted content generation, formatting, and improvement. Distinguished from plain RichTextEditor by the Joule accent border and inline AI toolbar. Used for long-form authored content with formatting.",
  "whenToUse": [
    "Composing formal correspondence with formatting (bold, lists, links)",
    "Drafting knowledge-base articles or documentation",
    "Editing rich content where AI can assist with grammar, tone, structure",
    "Any RichTextEditor where AI improves user output"
  ],
  "whenNotToUse": [
    "For plain multi-line text \u2014 use AITextArea",
    "For a Joule conversation prompt \u2014 use AIPromptInput",
    "For structured markdown \u2014 use TextArea with markdown preview",
    "For code editing \u2014 use dedicated code editor"
  ],
  "doRules": [
    "Provide AI actions in a persistent toolbar (Rephrase, Fix grammar, Change tone)",
    "Let users accept/reject AI suggestions inline",
    "Preserve full formatting when applying AI transformations",
    "Show visible AI badge in the editor chrome"
  ],
  "dontRules": [
    "Do not overwrite formatted content silently",
    "Do not run AI on every keystroke",
    "Do not lose undo history when AI acts",
    "Do not use for legal or contractual text without human review"
  ],
  "layoutGuidance": {
    "placement": "Inside forms, dialogs, or dedicated authoring pages",
    "sizing": "Min height 240px; grow with content",
    "spacing": "16px internal padding; toolbar at top",
    "alignment": "Toolbar top, content below, AI actions in overflow menu"
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 80 chars",
    "contentRules": "Rich HTML or Markdown; AI can refactor while preserving structure",
    "examples": [
      "\"Compose your message \u2014 Joule can help refine it\""
    ]
  },
  "responsiveBehavior": {
    "XL": "Full toolbar + content",
    "L": "Full toolbar + content",
    "M": "Compact toolbar with overflow menu",
    "S": "Toolbar collapses to essentials; AI in overflow"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 1.4.5 Images of Text (AA)"
    ],
    "requirements": [
      "Toolbar buttons have aria-labels; AI actions clearly labeled",
      "role='textbox' with aria-multiline='true'",
      "AI suggestions announced via aria-live",
      "Keyboard shortcuts follow standard editor conventions"
    ]
  },
  "patterns": [
    "Email composer with AI",
    "Article authoring",
    "Knowledge base editing"
  ],
  "compatibility": {
    "allowedWith": [
      "Dialog",
      "Card",
      "Panel",
      "Form"
    ],
    "forbiddenWith": [
      "Table cells",
      "Toolbar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AIRichTextEditor.json`
7. Confirm: "Updated AIRichTextEditor.json — N fields populated"

────────────────────────────────────────────────────────────

## [6/139] AISplitMenuButton

# Refresh SAP Fiori guideline: AISplitMenuButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AISplitMenuButton' || s.name.endsWith('.AISplitMenuButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AISplitMenuButton"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AISplitMenuButton",
  "slug": "joule-split-menu-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A split-button variant for AI-powered actions: main AI action on the left, dropdown arrow on the right that reveals variants. Combines fast access to the primary AI action with easy access to alternatives.",
  "whenToUse": [
    "Primary AI action with 2\u20135 close variants (Summarize / Summarize brief / Summarize technical)",
    "Save-and-continue AI flows with related output modes",
    "AI generation with quick access to alternate styles/tones",
    "Toolbar where AI has a clear default but variants matter"
  ],
  "whenNotToUse": [
    "For unrelated AI actions \u2014 use AIMenuButton (no primary bias)",
    "For a single AI action \u2014 use AIButton",
    "For >5 variants \u2014 use dedicated Joule panel",
    "For non-AI actions \u2014 use SplitButton"
  ],
  "doRules": [
    "Make the main button the most-used AI variant",
    "Group related variants together in the menu",
    "Include the current mode as highlighted in the dropdown",
    "Use type=Emphasized only if this is truly the primary screen action"
  ],
  "dontRules": [
    "Do not use for irreversible destructive actions",
    "Do not hide the AI accent \u2014 even on the arrow",
    "Do not swap the main action based on last selection (surprises users)",
    "Do not use inside table cells"
  ],
  "layoutGuidance": {
    "placement": "Toolbars, dialog footers, form action rows, object headers",
    "sizing": "Height 32px compact, 40px cozy",
    "spacing": "Standard button spacing",
    "alignment": "Right-aligned in footers"
  },
  "contentGuidance": {
    "labelLength": "Main action \u2264 20 chars",
    "contentRules": "Main label + verb-first variants in menu",
    "examples": [
      "\u2728 Summarize \u25bc  (menu: Summarize \u00b7 Summarize brief \u00b7 Summarize technical)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full label + arrow",
    "L": "Full label + arrow",
    "M": "Full label + arrow",
    "S": "May collapse to icon + arrow"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "Main button and arrow are separate focusable elements",
      "Arrow has aria-haspopup='menu' and aria-expanded",
      "Keyboard: Enter on main activates primary; Down opens menu",
      "AI role announced by screen reader ('AI-assisted split menu button')"
    ]
  },
  "patterns": [
    "AI action with variants",
    "Toolbar Joule primary action",
    "AI split action bar"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "Bar",
      "DynamicPageTitle",
      "ObjectHeader"
    ],
    "forbiddenWith": [
      "Table cells",
      "Dense List rows"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AISplitMenuButton.json`
7. Confirm: "Updated AISplitMenuButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [7/139] AITextArea

# Refresh SAP Fiori guideline: AITextArea

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AITextArea' || s.name.endsWith('.AITextArea'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AITextArea"
   - slug: "joule"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/joule"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AITextArea",
  "slug": "joule-text-area",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/joule/",
  "purpose": "A multi-line text input with AI-assisted content generation, correction, or expansion. Distinguished from plain TextArea by the Joule accent border and inline AI suggestion capability.",
  "whenToUse": [
    "Long-form text fields where AI can draft or improve content (emails, descriptions, notes)",
    "Feedback or comment fields with tone-check assistance",
    "Any TextArea where AI can meaningfully reduce user effort",
    "As part of a form where AI generates sections on demand"
  ],
  "whenNotToUse": [
    "For structured multi-line data (addresses, code) \u2014 use TextArea",
    "For a Joule conversation \u2014 use AIPromptInput",
    "For rich formatted content \u2014 use AIRichTextEditor",
    "When AI adds no value (very short field, pure data entry)"
  ],
  "doRules": [
    "Provide clear AI actions ('Rephrase', 'Shorten', 'Expand', 'Fix grammar')",
    "Let user accept, reject, or edit AI suggestions inline",
    "Preserve original text as user can undo AI changes",
    "Show a visible AI badge so users know AI is active"
  ],
  "dontRules": [
    "Do not overwrite user text without explicit action",
    "Do not run AI on every keystroke \u2014 too aggressive",
    "Do not hide the raw text \u2014 AI suggestions are additive, not replacements",
    "Do not use in high-stakes contexts (legal, medical) without clear disclaimers"
  ],
  "layoutGuidance": {
    "placement": "Inside forms, cards, panels",
    "sizing": "Min height 96px; grow to max 320px with scroll",
    "spacing": "Standard field spacing",
    "alignment": "Full width in FormElement"
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 60 chars",
    "contentRules": "Free-form text; AI can suggest completions or improvements",
    "examples": [
      "\"Draft your response \u2014 Joule can help\""
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width",
    "L": "Full width",
    "M": "Full width",
    "S": "Full width"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 3.3.2 Labels or Instructions (Level A)"
    ],
    "requirements": [
      "AI actions have aria-labels ('Rephrase with Joule')",
      "Suggested changes announced via aria-live='polite'",
      "Undo/redo keyboard shortcuts work as expected",
      "AI badge is announced as 'AI-assisted' on focus"
    ]
  },
  "patterns": [
    "AI-assisted content drafting",
    "Feedback field with tone check",
    "Email composer with Joule"
  ],
  "compatibility": {
    "allowedWith": [
      "Form",
      "FormElement",
      "Card",
      "Panel",
      "Dialog"
    ],
    "forbiddenWith": [
      "Table cells",
      "ShellBar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AITextArea.json`
7. Confirm: "Updated AITextArea.json — N fields populated"

────────────────────────────────────────────────────────────

## [8/139] ActionListItem

# Refresh SAP Fiori guideline: ActionListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/action-list-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/action-list-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ActionListItem' || s.name.endsWith('.ActionListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ActionListItem"
   - slug: "action-list-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/action-list-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ActionListItem",
  "slug": "action-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/action-list-item/",
  "purpose": "List row that triggers an action when tapped, instead of navigating to a detail page. Used in setting menus, command palettes, action lists.",
  "whenToUse": [
    "Settings menus that toggle modes or run actions",
    "Quick-access action palettes",
    "Sub-menu rows that fire an event rather than navigate"
  ],
  "whenNotToUse": [
    "Navigation \u2014 use StandardListItem with arrow",
    "Object summary \u2014 use ObjectListItem",
    "Selection \u2014 use CheckBox list"
  ],
  "doRules": [
    "Use verb-first labels (Action-oriented)",
    "Add a leading icon for recognition",
    "Bind label to sapList_TextColor or sapButton_TextColor if emphasized"
  ],
  "dontRules": [
    "Do not use ActionListItem for navigation",
    "Do not omit icons when icon-only ActionListItem siblings exist"
  ],
  "layoutGuidance": {
    "placement": "Place ActionListItem inside a compatible container (List, Popover).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for list item.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List",
    "Used inside Popover"
  ],
  "compatibility": [
    "List",
    "Popover"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ActionListItem.json`
7. Confirm: "Updated ActionListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [9/139] AddDimensions

# Refresh SAP Fiori guideline: AddDimensions

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AddDimensions' || s.name.endsWith('.AddDimensions'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AddDimensions"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AddDimensions",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "An empty-state illustration used inside IllustratedMessage when the user needs to add dimensions to a chart, pivot table, or analytical view. Signals 'no data because no dimensions selected yet \u2014 pick some to start'.",
  "whenToUse": [
    "Empty analytical chart before any dimensions are selected",
    "Pivot table with no row/column dimensions",
    "Report builder with no data axes configured",
    "Any analytics view awaiting user configuration"
  ],
  "whenNotToUse": [
    "For 'no data returned' after a query \u2014 use different illustration",
    "For a general empty list \u2014 use appropriate empty-state variant",
    "As a decorative element \u2014 always paired with actionable text",
    "In non-analytical contexts"
  ],
  "doRules": [
    "Pair the illustration with clear title and description",
    "Provide a call-to-action button ('Add dimensions', 'Configure chart')",
    "Use the appropriate size (Spot, Dialog, Scene) for the container",
    "Keep description short \u2014 the illustration does the visual work"
  ],
  "dontRules": [
    "Do not use in non-empty states",
    "Do not omit the CTA \u2014 user needs a path forward",
    "Do not shrink below Spot size (48\u00d748) \u2014 becomes illegible",
    "Do not use if the actual empty state has a different cause"
  ],
  "layoutGuidance": {
    "placement": "Inside IllustratedMessage container in empty chart/table region",
    "sizing": "Spot 48\u00d748 \u00b7 Dialog 120\u00d7120 \u00b7 Scene 240\u00d7240",
    "spacing": "16px between illustration, title, description, action",
    "alignment": "Centered vertically and horizontally in the empty region"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 40 chars; description \u2264 120 chars; button \u2264 20 chars",
    "contentRules": "Title states the empty state; description explains; button is action-first",
    "examples": [
      "Title: 'No dimensions selected' \u00b7 Description: 'Add dimensions to start analyzing' \u00b7 Button: 'Add dimensions'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Scene or Dialog size",
    "L": "Dialog size",
    "M": "Dialog size",
    "S": "Spot size"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "Illustration has role='img' with meaningful aria-label",
      "Title uses appropriate heading level",
      "CTA button clearly describes the action",
      "Focus moves to CTA when illustration is shown"
    ]
  },
  "patterns": [
    "Analytical empty state",
    "Chart configuration prompt",
    "Pivot table setup"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any other parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AddDimensions.json`
7. Confirm: "Updated AddDimensions.json — N fields populated"

────────────────────────────────────────────────────────────

## [10/139] AddPeopleToCalendar

# Refresh SAP Fiori guideline: AddPeopleToCalendar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AddPeopleToCalendar' || s.name.endsWith('.AddPeopleToCalendar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AddPeopleToCalendar"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AddPeopleToCalendar",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "Empty-state illustration used inside IllustratedMessage for empty planning-calendar or scheduling views where no people/attendees have been added yet.",
  "whenToUse": [
    "Empty planning calendar awaiting attendees",
    "Team scheduling view before members are assigned",
    "Meeting scheduler with no participants",
    "Resource planner needing user assignment"
  ],
  "whenNotToUse": [
    "For general empty calendar \u2014 use EmptyPlanningCalendar",
    "For empty user directory \u2014 use appropriate empty-state variant",
    "In non-scheduling contexts",
    "As decoration"
  ],
  "doRules": [
    "Pair with CTA ('Add attendees', 'Assign team')",
    "Include description explaining why users are needed",
    "Use appropriate size for the container",
    "Keep tone welcoming, not accusatory"
  ],
  "dontRules": [
    "Do not use without a call-to-action",
    "Do not use for permission-denied states",
    "Do not shrink below legible size",
    "Do not use in single-user contexts"
  ],
  "layoutGuidance": {
    "placement": "Inside IllustratedMessage in empty scheduling region",
    "sizing": "Spot 48\u00d748 \u00b7 Dialog 120\u00d7120 \u00b7 Scene 240\u00d7240",
    "spacing": "16px between elements",
    "alignment": "Centered in the empty region"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 40 chars; description \u2264 120 chars",
    "contentRules": "Title names the state; description invites action",
    "examples": [
      "Title: 'No attendees yet' \u00b7 Description: 'Add people to see their availability' \u00b7 Button: 'Add attendees'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Scene / Dialog size",
    "L": "Dialog size",
    "M": "Dialog size",
    "S": "Spot size"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "role='img' with descriptive aria-label",
      "Title as semantic heading",
      "CTA has clear action label",
      "Focus moves to CTA on show"
    ]
  },
  "patterns": [
    "Empty planning calendar",
    "Meeting scheduler onboarding",
    "Team scheduler"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any other parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AddPeopleToCalendar.json`
7. Confirm: "Updated AddPeopleToCalendar.json — N fields populated"

────────────────────────────────────────────────────────────

## [11/139] Avatar

# Refresh SAP Fiori guideline: Avatar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Avatar' || s.name.endsWith('.Avatar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Avatar"
   - slug: "avatar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Avatar",
  "slug": "avatar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/avatar/",
  "purpose": "A visual representation of a person, product, or object. Supports initials, icon, photo, or custom image.",
  "whenToUse": [
    "Display user identity in ShellBar, comments, lists",
    "Display product/object identity in tables",
    "Compact visual representation when name alone is insufficient"
  ],
  "whenNotToUse": [
    "For decoration without identity meaning",
    "For complex data display \u2014 use Card or Tile"
  ],
  "doRules": [
    "Always use square for products, circle for people",
    "Show initials when no photo available",
    "Use consistent size within a context (XS/S/M/L/XL)",
    "Pair with name or accessible label"
  ],
  "dontRules": [
    "Do not use circle for product/object avatars",
    "Do not stretch image to non-square ratios",
    "Do not omit aria-label for icon-only avatars"
  ],
  "layoutGuidance": {
    "placement": "ShellBar, ObjectHeader, List, Table.",
    "sizing": "XS=24, S=32, M=48, L=72, XL=128 px.",
    "spacing": "8\u201316px between avatars and other content.",
    "alignment": "Avatar left, content right."
  },
  "contentGuidance": {
    "labelLength": "Initials 1\u20133 chars.",
    "contentRules": [
      "Initials are first letter of first + last name",
      "Icon for object/role types"
    ],
    "examples": [
      "JR",
      "MS",
      "P"
    ]
  },
  "responsiveBehavior": {
    "XL": "XL or L size",
    "L": "L or M size",
    "M": "M or S size",
    "S": "S size"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Tooltip or aria-label describes the avatar subject",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "contrast",
      "requirement": "Initials/icon contrast \u2265 4.5:1 against background",
      "wcag": "1.4.3 (AA)"
    }
  ],
  "patterns": [
    "User identity",
    "Product avatar",
    "Notification badge"
  ],
  "compatibility": {
    "worksWith": [
      "ShellBar",
      "ObjectHeader",
      "List",
      "Table"
    ],
    "incompatible": [
      "As primary CTA"
    ]
  },
  "exceptions": [
    "Group avatars (avatar stack) for showing multiple users"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Avatar.json`
7. Confirm: "Updated Avatar.json — N fields populated"

────────────────────────────────────────────────────────────

## [12/139] AvatarGroup

# Refresh SAP Fiori guideline: AvatarGroup

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar-group

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar-group")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'AvatarGroup' || s.name.endsWith('.AvatarGroup'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "AvatarGroup"
   - slug: "avatar-group"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/avatar-group"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "AvatarGroup",
  "slug": "avatar-group",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/avatar-group/",
  "purpose": "Group of overlapping Avatars showing multiple users or entities. Final Avatar can be a +N counter for overflow.",
  "whenToUse": [
    "List of users assigned to a task",
    "Attendees on an event",
    "Object collaborators in a header",
    "Up to ~5 visible + counter"
  ],
  "whenNotToUse": [
    "Single user \u2014 use Avatar",
    "When all users must be individually identifiable \u2014 use a list",
    "For non-user entities use Tag or ObjectMarker"
  ],
  "doRules": [
    "Cap visible avatars at 5; show +N for overflow",
    "Order by most-relevant-first",
    "Each avatar should have tooltip with name"
  ],
  "dontRules": [
    "Do not show more than 5 visible avatars + counter",
    "Do not use AvatarGroup as a primary action surface",
    "Do not omit the overflow counter"
  ],
  "layoutGuidance": {
    "placement": "Place AvatarGroup inside a compatible container (DynamicPageHeader, ObjectPageLayout, Panel).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for object display.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPageHeader",
    "Used inside ObjectPageLayout",
    "Used inside Panel"
  ],
  "compatibility": [
    "DynamicPageHeader",
    "ObjectPageLayout",
    "Panel",
    "Card",
    "ColumnListItem"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/AvatarGroup.json`
7. Confirm: "Updated AvatarGroup.json — N fields populated"

────────────────────────────────────────────────────────────

## [13/139] Banner

# Refresh SAP Fiori guideline: Banner

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Banner' || s.name.endsWith('.Banner'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Banner"
   - slug: "banner"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Banner",
  "slug": "banner",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-page/",
  "purpose": "A generic banner element for showing prominent messages within page content. Distinct from MessageStrip (inline validation) and NotificationBanner (system-wide, at page top). Used inside cards, panels, or content sections to highlight important information.",
  "whenToUse": [
    "Highlight an important content-level message inside a card or panel",
    "Show a feature announcement inline within a business flow",
    "Communicate context-specific information (e.g. 'This item is read-only')",
    "Draw attention to a change or milestone in content"
  ],
  "whenNotToUse": [
    "For page-level validation \u2014 use MessageStrip",
    "For system-wide alerts \u2014 use NotificationBanner",
    "For transient toast \u2014 use MessageToast",
    "For empty states \u2014 use IllustratedMessage"
  ],
  "doRules": [
    "Use a clear title (\u2264 60 chars)",
    "Provide a description with context",
    "Include a dismiss action if the banner is not blocking",
    "Pair color with icon and text \u2014 never state-by-color alone"
  ],
  "dontRules": [
    "Do not stack multiple banners in the same section",
    "Do not use as a persistent header \u2014 content moves as user scrolls",
    "Do not use for critical errors \u2014 use MessageStrip or Dialog instead",
    "Do not use decorative banners without a real message"
  ],
  "layoutGuidance": {
    "placement": "Inside page content, cards, or panels",
    "sizing": "Height ~60\u201380px depending on density; full parent width",
    "spacing": "16px internal padding; 16px margin from siblings",
    "alignment": "Icon left \u00b7 title+description middle \u00b7 dismiss right"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 60 chars; description \u2264 160 chars",
    "contentRules": "Title states the fact; description gives context or action",
    "examples": [
      "Read-only mode \u2014 this record has been locked by another user"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + title + description + action",
    "L": "Same",
    "M": "Description may truncate",
    "S": "Title only; expand for description"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)",
      "WCAG 2.1 \u00b7 4.1.3 Status Messages (Level AA)"
    ],
    "requirements": [
      "role='status' or 'alert' depending on severity",
      "Icon paired with descriptive text",
      "Dismiss button has aria-label",
      "Focus is not stolen unless critical"
    ]
  },
  "patterns": [
    "Inline content notice",
    "Feature announcement",
    "Read-only indicator"
  ],
  "compatibility": {
    "allowedWith": [
      "Page",
      "Panel",
      "Card",
      "DynamicPage content",
      "ObjectPageSection"
    ],
    "forbiddenWith": [
      "Toolbar",
      "Table cells",
      "Dialog title bar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Banner.json`
7. Confirm: "Updated Banner.json — N fields populated"

────────────────────────────────────────────────────────────

## [14/139] Bar

# Refresh SAP Fiori guideline: Bar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/bar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/bar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Bar' || s.name.endsWith('.Bar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Bar"
   - slug: "bar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/bar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Bar",
  "slug": "bar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/bar/",
  "purpose": "A horizontal container for page-level actions and titles. Used as a header, footer, or subheader anchor for a page or dialog. Sits at the top or bottom of a container, with left/middle/right content regions.",
  "whenToUse": [
    "As the header of a Dialog or Popover (contains title + close/accept buttons)",
    "As the footer of a Dialog or Page (contains primary + secondary action buttons)",
    "As a subheader inside a page below the main title",
    "When you need three-region horizontal alignment (left / center / right)"
  ],
  "whenNotToUse": [
    "Inside a Toolbar \u2014 Toolbar is a container of items, Bar is a page-level region",
    "For a floating action bar \u2014 use OverflowToolbar with responsive behavior instead",
    "As a container of general content \u2014 use Panel or Card"
  ],
  "doRules": [
    "Use design=Header for a top bar, design=Footer for a bottom bar, design=Subheader for an intermediate bar",
    "Place the primary action right-aligned in a Footer bar",
    "Center the title in the contentMiddle slot for dialog headers",
    "Use ToolbarSpacer inside a slot to push content to the edge"
  ],
  "dontRules": [
    "Do not use a Bar for arbitrary layout \u2014 it is semantic (header/footer/subheader)",
    "Do not stack multiple Bars in the same region \u2014 restructure the page instead",
    "Do not put non-action content in a footer Bar"
  ],
  "layoutGuidance": {
    "placement": "Top or bottom of parent container (Dialog, Page)",
    "sizing": "Full width of parent. Height: 44px compact, 56px cozy",
    "spacing": "8px internal padding compact, 16px cozy",
    "alignment": "contentLeft: flush left \u00b7 contentMiddle: centered \u00b7 contentRight: flush right"
  },
  "contentGuidance": {
    "labelLength": "Titles up to 40 characters. Truncate with ellipsis if longer.",
    "contentRules": "Actions as Buttons, labels as Titles, no arbitrary text",
    "examples": [
      "Dialog header: [Close]  [Title]  [Save]",
      "Page footer: [Cancel]  \u2190 spacer \u2192  [Submit]"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width, all three regions visible",
    "L": "Same as XL",
    "M": "Same. Titles may truncate.",
    "S": "Middle region may collapse; primary action stays right"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "Bar has aria-role of banner (header) or contentinfo (footer)",
      "Title text has 4.5:1 contrast against bar background",
      "Focus order: left content \u2192 middle \u2192 right actions"
    ]
  },
  "patterns": [
    "Dialog",
    "Fullscreen Dialog",
    "Popover",
    "Page footer actions"
  ],
  "compatibility": {
    "allowedWith": [
      "Button",
      "Title",
      "ToolbarSpacer",
      "Text",
      "SearchField"
    ],
    "forbiddenWith": [
      "ShellBar (top-level), Toolbar (as parent)"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Bar.json`
7. Confirm: "Updated Bar.json — N fields populated"

────────────────────────────────────────────────────────────

## [15/139] Breadcrumb

# Refresh SAP Fiori guideline: Breadcrumb

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/breadcrumb

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/breadcrumb")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Breadcrumb' || s.name.endsWith('.Breadcrumb'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Breadcrumb"
   - slug: "breadcrumb"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/breadcrumb"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Breadcrumb",
  "slug": "breadcrumb",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/breadcrumb/",
  "purpose": "Shows the user's current location within a hierarchy and lets them navigate back to ancestor pages. Appears above the page title and provides one-click traversal upward through the app structure.",
  "whenToUse": [
    "App has deep hierarchy (depth > 1) and user navigation comes from above",
    "Object Page or List Report screens where users drill in from a parent",
    "When users need to navigate back to ancestor contexts without using browser back",
    "When the path itself carries meaning users may want to share or bookmark"
  ],
  "whenNotToUse": [
    "On root pages (Home) where there is no parent hierarchy",
    "When app navigation is shallow (1 level only)",
    "Inside modal Dialogs (no hierarchy context)",
    "On worklist screens where users come from a single 'my queue' entry point"
  ],
  "doRules": [
    "Place the Breadcrumb above the page title in the DynamicPageTitle component",
    "Show the full path from root to current page",
    "Make every item before current a clickable link (sapLinkColor)",
    "Render the current item as plain text (not a link)",
    "Use forward slash ('/') as separator between items"
  ],
  "dontRules": [
    "Do not include the current page as a clickable link",
    "Do not show more than 5 levels \u2014 collapse middle levels with ellipsis if deeper",
    "Do not use Breadcrumb in lieu of a working back button",
    "Do not use bold or large fonts \u2014 Breadcrumb is supporting context, not primary",
    "Do not hardcode colors \u2014 bind to sapLinkColor / sapContent_LabelColor"
  ],
  "layoutGuidance": {
    "placement": "Top of page header, above the H1 Title within DynamicPageTitle.",
    "sizing": "Auto height (single line). Each item auto-width.",
    "spacing": "4-8px between items and separators.",
    "alignment": "Left-aligned to page content edge."
  },
  "contentGuidance": {
    "labelLength": "Match the destination page title verbatim. 1-3 words per item.",
    "contentRules": [
      "Use the same exact label as the destination page header",
      "Localize all labels",
      "Avoid abbreviations unless the destination page itself uses them"
    ],
    "examples": [
      "Home / Inventory / Suppliers",
      "Invoices / Exceptions",
      "Integration and APIs / Packages"
    ]
  },
  "responsiveBehavior": {
    "XL": "Show full path at all levels.",
    "L": "Show full path at all levels.",
    "M": "If path > 4 items, collapse middle items with '\u2026' button.",
    "S": "Show only current + immediate parent; offer '\u2026' menu for deeper ancestors."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Wrap in <nav aria-label='Breadcrumb'>. Final item gets aria-current='page'.",
    "contrast": "Link items meet 4.5:1 against page bg (WCAG AA). Current item meets text contrast standards.",
    "keyboard": "Tab to enter; left/right arrow not used (single linear order is fine). Enter to follow link.",
    "screenReader": "Reads as 'Breadcrumb, list of N, X of N, link, ...; current page, ...'"
  },
  "patterns": [
    "Object Page \u2014 always include Breadcrumb",
    "List Report \u2014 include when accessed from a parent section",
    "Drill-down detail \u2014 required to make 'back to list' obvious"
  ],
  "compatibility": [
    "DynamicPageTitle",
    "DynamicPage",
    "ObjectPageLayout",
    "ShellBar"
  ],
  "exceptions": [
    "Single-level apps (no hierarchy) \u2014 omit Breadcrumb entirely",
    "Mobile / narrow viewport \u2014 use a back button + page title, no breadcrumb trail"
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Breadcrumb.json`
7. Confirm: "Updated Breadcrumb.json — N fields populated"

────────────────────────────────────────────────────────────

## [16/139] BusyDialog

# Refresh SAP Fiori guideline: BusyDialog

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busy-dialog

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busy-dialog")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'BusyDialog' || s.name.endsWith('.BusyDialog'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "BusyDialog"
   - slug: "busy-dialog"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busy-dialog"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "BusyDialog",
  "slug": "busy-dialog",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/busy-dialog/",
  "purpose": "Modal dialog containing a BusyIndicator and optional message. Blocks UI during long operations.",
  "whenToUse": [
    "Operations > 2 seconds that block workflow (save, sync, batch process)",
    "When user must wait before proceeding"
  ],
  "whenNotToUse": [
    "Short operations \u2014 use BusyIndicator inline",
    "Non-blocking \u2014 use ProgressIndicator",
    "Determinate progress \u2014 use ProgressIndicator"
  ],
  "doRules": [
    "Include a clear message (\"Saving...\", \"Syncing...\")",
    "Provide Cancel button for cancellable operations",
    "Auto-dismiss when complete"
  ],
  "dontRules": [
    "Do not use BusyDialog for trivial waits (< 2s)",
    "Do not omit a descriptive message",
    "Do not block UI unnecessarily"
  ],
  "layoutGuidance": {
    "placement": "Place BusyDialog inside a compatible container (Triggered from any context).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Triggered from any context"
  ],
  "compatibility": [
    "Triggered from any context"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/BusyDialog.json`
7. Confirm: "Updated BusyDialog.json — N fields populated"

────────────────────────────────────────────────────────────

## [17/139] BusyIndicator

# Refresh SAP Fiori guideline: BusyIndicator

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busyindicator

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busyindicator")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'BusyIndicator' || s.name.endsWith('.BusyIndicator'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "BusyIndicator"
   - slug: "busyindicator"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/busyindicator"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "BusyIndicator",
  "slug": "busy-indicator",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/busy-indicator/",
  "purpose": "A loading spinner used to indicate that an asynchronous operation is in progress. Shows user that the system is working.",
  "whenToUse": [
    "During data loading (table, list, page)",
    "During save/submit operations",
    "When operation takes longer than 1 second",
    "Page-level loading states"
  ],
  "whenNotToUse": [
    "For instant operations (<1s) \u2014 no feedback needed",
    "For empty/no-data states \u2014 use IllustratedMessage",
    "For static placeholders \u2014 use skeleton UI",
    "For long-running tasks (>10s) \u2014 use ProgressIndicator with progress"
  ],
  "doRules": [
    "Use when operation takes longer than 1 second",
    "Show descriptive text (\"Loading orders...\", \"Saving...\")",
    "Use Small for inline contexts; Large for full-page",
    "Block interaction only when necessary"
  ],
  "dontRules": [
    "Do not use for instant operations",
    "Do not block entire UI for non-critical operations",
    "Do not omit text when context unclear",
    "Do not show busy state on a control that has no operation pending"
  ],
  "layoutGuidance": {
    "placement": "Inline beside control, centered in container, full-page overlay.",
    "sizing": "Small=16, Medium=32, Large=64 px.",
    "spacing": "8px between spinner and text.",
    "alignment": "Spinner left, text right."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words describing operation.",
    "contentRules": [
      "Use gerund verbs (Loading, Saving)",
      "Include what is loading when ambiguous"
    ],
    "examples": [
      "Loading...",
      "Saving order",
      "Validating"
    ]
  },
  "responsiveBehavior": {
    "XL": "Small or Medium inline",
    "L": "Small or Medium inline",
    "M": "Medium",
    "S": "Large overlay if blocking"
  },
  "accessibilityGuidance": [
    {
      "category": "announcements",
      "requirement": "Busy state announced via aria-busy=true",
      "wcag": "4.1.3 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Text describes what is loading",
      "wcag": "1.3.1 (A)"
    }
  ],
  "patterns": [
    "Loading state",
    "Async operation feedback"
  ],
  "compatibility": {
    "worksWith": [
      "Dialog",
      "Page",
      "Table",
      "List"
    ],
    "incompatible": [
      "As replacement for empty state \u2014 use IllustratedMessage"
    ]
  },
  "exceptions": [
    "busyIndicatorDelay prevents flash on fast operations"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/BusyIndicator.json`
7. Confirm: "Updated BusyIndicator.json — N fields populated"

────────────────────────────────────────────────────────────

## [18/139] Button

# Refresh SAP Fiori guideline: Button

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/button

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/button")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Button' || s.name.endsWith('.Button'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Button"
   - slug: "button"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/button"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Button",
  "slug": "button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/button/",
  "purpose": "A clickable control that triggers an action. Buttons come in multiple semantic types (Emphasized, Accept, Reject, Negative, Critical, Transparent) to communicate action priority and consequence.",
  "whenToUse": [
    "Trigger primary or secondary actions in forms, toolbars, dialogs, and pages",
    "Use Emphasized type for the single primary action per screen",
    "Pair an icon with a label for clarity when the icon is not universally recognized",
    "Use Transparent or Ghost for de-emphasized secondary actions",
    "Use Negative for destructive actions like delete or cancel-and-discard"
  ],
  "whenNotToUse": [
    "Use a Link when the action is navigation (going to another page or URL)",
    "Inside table cells at small sizes \u2014 use Link or IconButton instead",
    "When stacking many buttons vertically \u2014 restructure with toolbars or menus"
  ],
  "doRules": [
    "Use Emphasized type for the single primary action per screen",
    "Pair an icon with a label for clarity when the icon is not universally recognized",
    "Keep button labels short and action-oriented (verb-first)",
    "Use Negative type with confirmation dialog for destructive actions"
  ],
  "dontRules": [
    "Do not use multiple Emphasized buttons in one toolbar \u2014 confuses primary intent",
    "Do not use vague labels like \"OK\", \"Click here\", \"Submit\" when more specific text fits",
    "Do not use a Button when a Link is more appropriate (navigation vs action)",
    "Do not put primary buttons on the left of toolbars \u2014 primary action goes right"
  ],
  "layoutGuidance": {
    "placement": "Right-aligned in toolbars for primary actions; left for secondary/cancel.",
    "sizing": "Auto width; height 26px Compact / 36px Cozy. Min 32\u00d732 touch target.",
    "spacing": "8px gap between buttons in toolbar.",
    "alignment": "Group related buttons; separate destructive with spacing."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words max. Verb-first (\"Save\", \"Add Artifact\", \"Delete Package\").",
    "contentRules": [
      "Use sentence case unless brand requires title case",
      "Avoid punctuation in labels",
      "Localize all labels"
    ],
    "examples": [
      "Save",
      "Cancel",
      "Add",
      "Delete Package",
      "Export"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full button with label and optional icon",
    "L": "Full button with label and optional icon",
    "M": "Full button or icon-only for space-constrained toolbars",
    "S": "Icon-only with tooltip on mobile; move secondary actions to overflow menu"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Text-to-background contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "tap-target",
      "requirement": "Min 32\u00d732px Compact / 44\u00d744px Cozy",
      "wcag": "2.5.5 (AAA)"
    },
    {
      "category": "labeling",
      "requirement": "Icon-only buttons MUST have tooltip + aria-label",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus indicator with 3:1 contrast against adjacent colors",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "keyboard",
      "requirement": "Enter and Space activate; Tab moves focus",
      "wcag": "2.1.1 (A)"
    }
  ],
  "patterns": [
    "Toolbar action",
    "Dialog action",
    "Form submission",
    "Bulk action"
  ],
  "compatibility": {
    "worksWith": [
      "Toolbar",
      "OverflowToolbar",
      "Dialog",
      "Form",
      "Panel",
      "MenuButton",
      "ShellBar"
    ],
    "incompatible": [
      "Inside Table cells at S viewport",
      "Stacked vertically in toolbar"
    ]
  },
  "exceptions": [
    "When used inside IconTabBar action area, hide label and show icon only",
    "In condensed list rows, prefer Link over Button"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Button.json`
7. Confirm: "Updated Button.json — N fields populated"

────────────────────────────────────────────────────────────

## [19/139] Calendar

# Refresh SAP Fiori guideline: Calendar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Calendar' || s.name.endsWith('.Calendar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Calendar"
   - slug: "calendar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Calendar",
  "slug": "calendar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/calendar/",
  "purpose": "Full month-view calendar for date selection and event display. Used in scheduling apps, date-range pickers, and event browsers. Supports single date, multiple dates, and date-range selection.",
  "whenToUse": [
    "Select a date from a visible month view (vs typing in DatePicker)",
    "Browse events by day/week/month",
    "Show availability or blackout dates in bookings",
    "Enable navigation across months and years"
  ],
  "whenNotToUse": [
    "For a single-field date input in a form \u2014 use DatePicker",
    "For a date range \u2014 use DateRangePicker (compact) or Calendar with range mode",
    "For time-of-day selection \u2014 use TimePicker or DateTimePicker",
    "When you have >2 months to show \u2014 use CalendarLegend and multi-month view"
  ],
  "doRules": [
    "Show current date highlighted with today marker",
    "Provide navigation to switch months and years",
    "Support keyboard navigation (Arrow keys move by day, PageUp/Down by month)",
    "Show weekday abbreviations in the header row"
  ],
  "dontRules": [
    "Do not use for years far in the future/past \u2014 becomes tedious to navigate",
    "Do not omit the year \u2014 always visible in the header",
    "Do not use in a Popover for range selection \u2014 becomes cramped",
    "Do not mix compact and cozy density within the same calendar"
  ],
  "layoutGuidance": {
    "placement": "Standalone in a page, inside a card, or inside a Popover (for pickers)",
    "sizing": "320px min width; height ~360px for standard month view",
    "spacing": "Day cells: 4px gap compact, 8px cozy",
    "alignment": "Grid layout: 7 columns (days) \u00d7 6 rows max"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 dates",
    "contentRules": "Days as numbers 1-31; weekday header as 2-3 letter abbreviations",
    "examples": [
      "Mo Tu We Th Fr Sa Su",
      "1 2 3 4 5 6 7"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full month grid",
    "L": "Full month grid",
    "M": "Full month grid",
    "S": "May switch to list view or DatePicker fallback"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "aria-label on every day cell ('Monday, 8 July 2026')",
      "Selected date has 3:1 contrast against unselected cells",
      "Keyboard: Arrow keys move focus; Enter selects; Escape closes if inside Popover",
      "Today marker is visible without relying on color alone"
    ]
  },
  "patterns": [
    "Date pickers (in Popover)",
    "Booking flows",
    "Event browsers",
    "Planning views"
  ],
  "compatibility": {
    "allowedWith": [
      "Popover",
      "Page",
      "Panel",
      "Card"
    ],
    "forbiddenWith": [
      "Inline in Table cells",
      "Inside Dialog title bar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Calendar.json`
7. Confirm: "Updated Calendar.json — N fields populated"

────────────────────────────────────────────────────────────

## [20/139] Card

# Refresh SAP Fiori guideline: Card

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/card

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/card")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Card' || s.name.endsWith('.Card'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Card"
   - slug: "card"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/card"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Card",
  "slug": "card",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/card/",
  "purpose": "A self-contained content container with optional header, content area, and footer. Used on overview pages and dashboards to group related information.",
  "whenToUse": [
    "Overview Page tile content",
    "Analytical dashboards \u2014 KPI tiles, mini-charts, lists",
    "When information should be grouped visually with a border + header",
    "Mobile / responsive layouts that flow into a grid"
  ],
  "whenNotToUse": [
    "As a list row \u2014 use StandardListItem",
    "For modal content \u2014 use Dialog",
    "For form sections \u2014 use Panel"
  ],
  "doRules": [
    "Provide a clear header title",
    "Bind card background to sapBackgroundColor or sapShellColor",
    "Bind border to sapShell_BorderColor",
    "Keep card content focused on a single subject"
  ],
  "dontRules": [
    "Do not nest Cards more than 1 level deep",
    "Do not mix Card and Panel in the same row \u2014 pick one",
    "Do not omit the header \u2014 a Card without a header is just a Panel",
    "Do not exceed ~4 KPIs per card \u2014 readability degrades"
  ],
  "layoutGuidance": {
    "placement": "Place Card inside a compatible container (DynamicPage, OverflowToolbar, List).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for container \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in DynamicPage",
    "Used in OverflowToolbar",
    "Used in List"
  ],
  "compatibility": [
    "DynamicPage",
    "OverflowToolbar",
    "List",
    "Table",
    "Form"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Card.json`
7. Confirm: "Updated Card.json — N fields populated"

────────────────────────────────────────────────────────────

## [21/139] Carousel

# Refresh SAP Fiori guideline: Carousel

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/carousel

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/carousel")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Carousel' || s.name.endsWith('.Carousel'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Carousel"
   - slug: "carousel"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/carousel"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Carousel",
  "slug": "carousel",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/carousel/",
  "purpose": "Horizontally swipeable container that displays one item at a time with paging dots. Used for showcasing related images, cards, or KPIs.",
  "whenToUse": [
    "Hero images on an overview page",
    "A sequence of equivalent items where the user reviews one at a time",
    "Featured content rotators",
    "Mobile-first layouts where horizontal scroll is natural"
  ],
  "whenNotToUse": [
    "When all items must be visible simultaneously \u2014 use a grid of Cards",
    "For navigation \u2014 use Tabs or IconTabBar",
    "When item order matters and users must compare \u2014 use Table or Card grid",
    "For more than ~7 items \u2014 users lose context"
  ],
  "doRules": [
    "Show paging dots so users can see total count",
    "Set itemHeight large enough that content is readable on first slide",
    "Provide keyboard navigation (Left/Right arrows)",
    "Bind background to sapBackgroundColor"
  ],
  "dontRules": [
    "Do not auto-rotate \u2014 let users control pace",
    "Do not hide paging dots",
    "Do not exceed ~7 items",
    "Do not use Carousel for primary navigation"
  ],
  "layoutGuidance": {
    "placement": "Place Carousel inside a compatible container (DynamicPage, Panel, Card).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for container \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in DynamicPage",
    "Used in Panel",
    "Used in Card"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Card",
    "Dialog"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Carousel.json`
7. Confirm: "Updated Carousel.json — N fields populated"

────────────────────────────────────────────────────────────

## [22/139] CheckBox

# Refresh SAP Fiori guideline: CheckBox

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/checkbox

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/checkbox")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'CheckBox' || s.name.endsWith('.CheckBox'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "CheckBox"
   - slug: "checkbox"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/checkbox"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "CheckBox",
  "slug": "checkbox",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/checkbox/",
  "purpose": "A binary selection control (selected / not selected) with optional Partial state for indeterminate selections. Used in forms, lists, and tables for multi-select.",
  "whenToUse": [
    "Boolean settings (enable/disable)",
    "Multi-select in lists and tables (select-all + items)",
    "Multiple non-exclusive options in a form",
    "Terms acceptance, opt-in confirmations"
  ],
  "whenNotToUse": [
    "For mutually exclusive options \u2014 use RadioButton",
    "For instant toggles without form context \u2014 use Switch",
    "When only one choice exists \u2014 use a different pattern"
  ],
  "doRules": [
    "Use Partial state for \"select all\" with mixed children",
    "Place label to the right of the checkbox",
    "Group related checkboxes vertically",
    "Mark required group with Label.required=true"
  ],
  "dontRules": [
    "Do not use a CheckBox when a Switch fits better (instant action)",
    "Do not use CheckBox for mutually exclusive options \u2014 use RadioButton",
    "Do not skip the text label"
  ],
  "layoutGuidance": {
    "placement": "Inside Form, Table header (select-all), Table row (multi-select).",
    "sizing": "16\u00d716px box. Touch area includes label.",
    "spacing": "8px between checkbox and label; 8px between checkboxes.",
    "alignment": "Box left, label right."
  },
  "contentGuidance": {
    "labelLength": "1\u201310 words.",
    "contentRules": [
      "Use sentence case",
      "State positive options (e.g. \"Enable\" not \"Don't disable\")"
    ],
    "examples": [
      "Send me email updates",
      "I agree to the terms"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline with label",
    "L": "Inline with label",
    "M": "Inline with label",
    "S": "Full width with label wrapping"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Space toggles state",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Visible label or aria-label required",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "tap-target",
      "requirement": "Min 32px clickable area including label",
      "wcag": "2.5.5 (AAA)"
    },
    {
      "category": "status",
      "requirement": "Selected state announced; Partial state announced as mixed",
      "wcag": "4.1.2 (A)"
    }
  ],
  "patterns": [
    "Form field",
    "Multi-select",
    "Terms acceptance"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "Table",
      "List"
    ],
    "incompatible": [
      "Without text or aria-label"
    ]
  },
  "exceptions": [
    "Partial state when \u22651 but not all children selected"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/CheckBox.json`
7. Confirm: "Updated CheckBox.json — N fields populated"

────────────────────────────────────────────────────────────

## [23/139] Column

# Refresh SAP Fiori guideline: Column

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/column

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/column")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Column' || s.name.endsWith('.Column'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Column"
   - slug: "column"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/column"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Column",
  "slug": "responsive-table",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/responsive-table/",
  "purpose": "A column definition within a Table. Holds the header label, sort/filter affordances, and width/alignment rules.",
  "whenToUse": [
    "As a child of Table only",
    "To define each data column"
  ],
  "whenNotToUse": [
    "Outside Table",
    "For non-tabular data"
  ],
  "doRules": [
    "Use clear, concise header text",
    "Align numeric columns to End (right)",
    "Indicate sort direction with arrow icon",
    "Set appropriate minScreenWidth for responsive collapse"
  ],
  "dontRules": [
    "Do not use a Column for actions \u2014 use a separate action column",
    "Do not stack header labels vertically",
    "Do not skip header text"
  ],
  "layoutGuidance": {
    "placement": "As child of Table.",
    "sizing": "Width auto or fixed via Column.width.",
    "spacing": "Inherits Table spacing.",
    "alignment": "hAlign property: Begin (left), Center, End (right)."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words.",
    "contentRules": [
      "Use nouns for column names",
      "Pluralize for clarity if appropriate",
      "Avoid abbreviations"
    ],
    "examples": [
      "Name",
      "Runtime Profile",
      "Versions",
      "Actions"
    ]
  },
  "responsiveBehavior": {
    "XL": "All columns shown",
    "L": "All shown; demandPopin collapses minor columns",
    "M": "Secondary columns pop in below primary",
    "S": "Only most important columns visible"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Column header text must describe contents",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "keyboard",
      "requirement": "Sortable columns activate sort on Enter",
      "wcag": "2.1.1 (A)"
    }
  ],
  "patterns": [
    "Table column definition"
  ],
  "compatibility": {
    "worksWith": [
      "Table",
      "ColumnListItem"
    ],
    "incompatible": [
      "Outside Table"
    ]
  },
  "exceptions": [
    "popinDisplay determines how column content shows when collapsed"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Column.json`
7. Confirm: "Updated Column.json — N fields populated"

────────────────────────────────────────────────────────────

## [24/139] ColumnListItem

# Refresh SAP Fiori guideline: ColumnListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/columnlistitem

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/columnlistitem")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ColumnListItem' || s.name.endsWith('.ColumnListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ColumnListItem"
   - slug: "columnlistitem"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/columnlistitem"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ColumnListItem",
  "slug": "responsive-table",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/responsive-table/",
  "purpose": "A row in a Table containing one cell per column. Supports type variants (Inactive, Active, Navigation, Detail) for different interaction patterns.",
  "whenToUse": [
    "As a child of Table only",
    "For each data row"
  ],
  "whenNotToUse": [
    "Outside Table",
    "For grouping headers (use GroupHeaderListItem)"
  ],
  "doRules": [
    "Use Navigation type when row click opens detail page",
    "Use Active type when row click triggers action",
    "Keep row height consistent across the table",
    "Use ObjectIdentifier in the primary column"
  ],
  "dontRules": [
    "Do not nest interactive elements inside Active or Navigation rows",
    "Do not vary row height arbitrarily",
    "Do not skip row click behavior when defined"
  ],
  "layoutGuidance": {
    "placement": "Inside Table items aggregation.",
    "sizing": "Height 48px Compact / 64px Cozy by default. Custom rows up to 114px.",
    "spacing": "1px row border.",
    "alignment": "Cell alignment inherited from Column.hAlign."
  },
  "contentGuidance": {
    "labelLength": "Cell content varies by column.",
    "contentRules": [
      "First column: ObjectIdentifier with title + optional description",
      "Status columns: ObjectStatus with semantic state",
      "Numeric columns: ObjectNumber"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "All cells inline",
    "L": "All cells inline",
    "M": "Pop-in: secondary cells appear below primary",
    "S": "Card-like layout, attributes stacked"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter on Navigation type opens detail; arrow keys move between cells",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus ring on row",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "Row click affordance announced via type variant"
    }
  ],
  "patterns": [
    "Table row",
    "Master list row",
    "Drilldown item"
  ],
  "compatibility": {
    "worksWith": [
      "Table",
      "Column"
    ],
    "incompatible": [
      "Outside Table"
    ]
  },
  "exceptions": [
    "DetailAndActive type when row has both detail-action and primary click"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ColumnListItem.json`
7. Confirm: "Updated ColumnListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [25/139] ComboBox

# Refresh SAP Fiori guideline: ComboBox

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/combo-box

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/combo-box")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ComboBox' || s.name.endsWith('.ComboBox'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ComboBox"
   - slug: "combo-box"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/combo-box"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ComboBox",
  "slug": "combo-box",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/combo-box/",
  "purpose": "A dropdown selector that combines typing with a scrollable list \u2014 user can type to filter or click to choose. Handles known finite lists (10-100 items) better than Select.",
  "whenToUse": [
    "10-100 items in a known list (countries, categories, sizes)",
    "User might know the answer and prefers typing",
    "Values are strings, not numbers or ranges",
    "You need auto-complete but not free-text (which would be Input)"
  ],
  "whenNotToUse": [
    "Fewer than 10 items \u2014 use Select (simpler)",
    "More than 100 items \u2014 use MultiInput with async search",
    "Free-text \u2014 use Input",
    "Multiple selections \u2014 use MultiComboBox"
  ],
  "doRules": [
    "Show all matching items as user types (case-insensitive prefix match)",
    "Provide a Reset (X) affordance to clear",
    "Default to placeholder text when empty",
    "Show validation state (Error/Warning/Success) via state property"
  ],
  "dontRules": [
    "Do not allow arbitrary text if the value must be in the list",
    "Do not scroll the dropdown to more than 8 visible items \u2014 use MultiInput for large sets",
    "Do not use for numeric ranges \u2014 use Slider or StepInput",
    "Do not hide the dropdown chevron"
  ],
  "layoutGuidance": {
    "placement": "Inline in forms, filter bars, dialogs",
    "sizing": "Min width 200px; height 32px compact, 40px cozy",
    "spacing": "Standard field spacing (16px between form rows)",
    "alignment": "Full width in FormElement; left-aligned in HBox"
  },
  "contentGuidance": {
    "labelLength": "Placeholder up to 40 chars",
    "contentRules": "Item labels are noun phrases; consistent format across items",
    "examples": [
      "Country: [Germany|]",
      "Priority: [High     \u25bc]"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full field width",
    "L": "Full field width",
    "M": "Full field width",
    "S": "May become full-screen picker on tap"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 3.3.2 Labels or Instructions (Level A)"
    ],
    "requirements": [
      "role='combobox' with aria-expanded reflecting dropdown state",
      "Associated Label element (visible or aria-labelledby)",
      "Selected value announced by screen reader",
      "Keyboard: Down opens dropdown; Arrow keys navigate; Enter selects; Escape closes"
    ]
  },
  "patterns": [
    "Form field",
    "FilterBar item",
    "Dialog input"
  ],
  "compatibility": {
    "allowedWith": [
      "Form",
      "FormElement",
      "FilterBar",
      "Dialog",
      "Panel"
    ],
    "forbiddenWith": [
      "Table cells (too dense)",
      "Toolbar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ComboBox.json`
7. Confirm: "Updated ComboBox.json — N fields populated"

────────────────────────────────────────────────────────────

## [26/139] DatePicker

# Refresh SAP Fiori guideline: DatePicker

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datepicker

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datepicker")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DatePicker' || s.name.endsWith('.DatePicker'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DatePicker"
   - slug: "datepicker"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datepicker"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DatePicker",
  "slug": "date-picker",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/date-picker/",
  "purpose": "A single-date input with calendar popup. Type or click the calendar icon to choose a date. Respects locale formatting.",
  "whenToUse": [
    "Single-date input in forms",
    "Date filters in FilterBar",
    "Birthdate, due-date, expiration entry"
  ],
  "whenNotToUse": [
    "For date range \u2014 use DateRangePicker",
    "For date + time \u2014 use DateTimePicker",
    "For time only \u2014 use TimePicker"
  ],
  "doRules": [
    "Use locale-aware date format",
    "Provide minDate/maxDate when range is constrained",
    "Show format hint in placeholder",
    "Allow keyboard entry of date string"
  ],
  "dontRules": [
    "Do not require user to type format manually without hint",
    "Do not omit calendar icon"
  ],
  "layoutGuidance": {
    "placement": "Form, FilterBar, Dialog body.",
    "sizing": "256px default.",
    "spacing": "8px vertical between fields.",
    "alignment": "Calendar icon right; date left."
  },
  "contentGuidance": {
    "labelLength": "Placeholder shows format hint.",
    "contentRules": [
      "Date shown in locale format",
      "Calendar popup shows current month"
    ],
    "examples": [
      "MM/dd/yyyy",
      "2026-06-25",
      "25.06.2026"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full input + calendar popup",
    "L": "Full input + calendar popup",
    "M": "Full input + popup",
    "S": "Native mobile date picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Calendar icon opens picker; arrow keys navigate dates; Enter selects; Escape closes",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label; format hint in placeholder",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Selected date announced"
    }
  ],
  "patterns": [
    "Form field",
    "Filter dimension",
    "Date entry"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "FilterBar"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "displayFormat overrides locale default"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DatePicker.json`
7. Confirm: "Updated DatePicker.json — N fields populated"

────────────────────────────────────────────────────────────

## [27/139] DateRangePicker

# Refresh SAP Fiori guideline: DateRangePicker

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/daterangepicker

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/daterangepicker")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DateRangePicker' || s.name.endsWith('.DateRangePicker'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DateRangePicker"
   - slug: "daterangepicker"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/daterangepicker"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DateRangePicker",
  "slug": "date-range-picker",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/date-range-picker/",
  "purpose": "Two-date input with shared calendar. User selects start and end dates. Used for filters like \"From \u2013 To\" or date-range constraints.",
  "whenToUse": [
    "Date-range filters (date ranges in lists, reports)",
    "Period selection (vacation, report range)",
    "Constraining a range of values"
  ],
  "whenNotToUse": [
    "For a single date \u2014 use DatePicker",
    "For predefined ranges only \u2014 use Select with presets"
  ],
  "doRules": [
    "Use for date range filters (e.g. \"From \u2013 To\")",
    "Provide preset ranges (Last 7 days, This month, etc.) when relevant",
    "Highlight selected range visually in calendar"
  ],
  "dontRules": [
    "Do not allow end date before start date",
    "Do not omit clear-action affordance"
  ],
  "layoutGuidance": {
    "placement": "FilterBar, Form.",
    "sizing": "300px default; wider than DatePicker.",
    "spacing": "8px vertical between fields.",
    "alignment": "Two date displays side-by-side or stacked."
  },
  "contentGuidance": {
    "labelLength": "Format hint in placeholder.",
    "contentRules": [
      "Format like \"MM/dd/yyyy \u2013 MM/dd/yyyy\"",
      "Show preset shortcuts above calendar"
    ],
    "examples": [
      "Last 7 days",
      "01/01/2026 \u2013 06/25/2026"
    ]
  },
  "responsiveBehavior": {
    "XL": "Two dates inline",
    "L": "Two dates inline",
    "M": "Two dates inline; calendar may stack vertically",
    "S": "Native mobile range picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Two-step calendar: select start, then end. Arrow keys navigate",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Both bounds announced when range changes"
    }
  ],
  "patterns": [
    "Filter range",
    "Period selection"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "FilterBar"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "Locale-specific separator (\u2014, \u2013, \"to\") in display"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DateRangePicker.json`
7. Confirm: "Updated DateRangePicker.json — N fields populated"

────────────────────────────────────────────────────────────

## [28/139] DateTimePicker

# Refresh SAP Fiori guideline: DateTimePicker

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datetimepicker

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datetimepicker")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DateTimePicker' || s.name.endsWith('.DateTimePicker'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DateTimePicker"
   - slug: "datetimepicker"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/datetimepicker"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DateTimePicker",
  "slug": "date-time-picker",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/date-time-picker/",
  "purpose": "A single date + time input combining calendar and time picker.",
  "whenToUse": [
    "When both date and time-of-day are required",
    "Meeting time entry, deadline with time, scheduled tasks"
  ],
  "whenNotToUse": [
    "When only date is needed \u2014 use DatePicker",
    "When only time is needed \u2014 use TimePicker"
  ],
  "doRules": [
    "Use when both date AND time are required",
    "Show 24-hour or AM/PM based on locale",
    "Default to current time when applicable"
  ],
  "dontRules": [
    "Do not use when only date or only time is needed",
    "Do not omit timezone indication when relevant"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog.",
    "sizing": "256px default.",
    "spacing": "8px vertical between fields.",
    "alignment": "Date left, time right of picker UI."
  },
  "contentGuidance": {
    "labelLength": "Format hint in placeholder.",
    "contentRules": [
      "Locale-aware format",
      "Optional seconds"
    ],
    "examples": [
      "MM/dd/yyyy HH:mm",
      "06/25/2026 14:30"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full input + popup",
    "L": "Full input + popup",
    "M": "Full input + popup",
    "S": "Native mobile picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab between date and time fields; arrows navigate within",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    }
  ],
  "patterns": [
    "Schedule entry",
    "Timestamp field"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "displayFormat for fine control"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DateTimePicker.json`
7. Confirm: "Updated DateTimePicker.json — N fields populated"

────────────────────────────────────────────────────────────

## [29/139] Dialog

# Refresh SAP Fiori guideline: Dialog

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dialog

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dialog")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Dialog' || s.name.endsWith('.Dialog'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Dialog"
   - slug: "dialog"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dialog"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Dialog",
  "slug": "dialog",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/dialog/",
  "purpose": "A modal overlay that interrupts the user flow to present a focused task, confirmation, or information. Blocks interaction with the underlying page until dismissed.",
  "whenToUse": [
    "For confirmations of destructive or critical actions",
    "For focused short tasks requiring user input",
    "For detail views requiring action",
    "For error/warning messages requiring acknowledgment"
  ],
  "whenNotToUse": [
    "For non-blocking notifications \u2014 use Toast or MessageStrip",
    "For long forms \u2014 use a new page",
    "For navigation \u2014 use Link"
  ],
  "doRules": [
    "Use for confirmations, focused tasks, or detail views requiring user action",
    "Include primary action button (right) and Cancel (left)",
    "Use State variant for semantic messages (Information, Warning, Error)",
    "Provide title that summarizes the dialog purpose"
  ],
  "dontRules": [
    "Do not stack dialogs",
    "Do not put long forms in Dialog \u2014 use a new page",
    "Do not omit close affordance (Cancel button or X)",
    "Do not block escape key from closing"
  ],
  "layoutGuidance": {
    "placement": "Centered over the application; backdrop dims underlying content.",
    "sizing": "Auto width 320\u201380% viewport; height hugs content up to 80% viewport.",
    "spacing": "Internal padding 16px.",
    "alignment": "Title top, content middle, action bar bottom."
  },
  "contentGuidance": {
    "labelLength": "Title 1\u20138 words; body content as needed.",
    "contentRules": [
      "Title summarizes purpose",
      "Body explains what user must decide",
      "Action labels are verbs"
    ],
    "examples": [
      "Delete Package?",
      "Confirm Save",
      "Validation Error"
    ]
  },
  "responsiveBehavior": {
    "XL": "Centered with auto width",
    "L": "Centered with auto width",
    "M": "80% viewport width",
    "S": "Full-screen dialog"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Escape closes; Tab cycles within dialog (focus trap)",
      "wcag": "2.1.2 (A)"
    },
    {
      "category": "focus",
      "requirement": "Focus moves into dialog on open; returns to trigger on close",
      "wcag": "2.4.3 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Dialog has accessible title via aria-labelledby",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "status",
      "requirement": "Destructive dialogs use State=Warning or Error with text \u2014 not color alone",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Dialog open/close announced; content announced when opened"
    }
  ],
  "patterns": [
    "Confirmation",
    "Focused task",
    "Error acknowledgment"
  ],
  "compatibility": {
    "worksWith": [
      "Button",
      "Form",
      "List",
      "MessageStrip"
    ],
    "incompatible": [
      "Inside another Dialog",
      "Inside Toolbar"
    ]
  },
  "exceptions": [
    "Message type for short confirmations (no custom content)",
    "Resizable/draggable variants for tool-like dialogs"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Dialog.json`
7. Confirm: "Updated Dialog.json — N fields populated"

────────────────────────────────────────────────────────────

## [30/139] DropDown

# Refresh SAP Fiori guideline: DropDown

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DropDown' || s.name.endsWith('.DropDown'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DropDown"
   - slug: "select"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DropDown",
  "slug": "select",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/select/",
  "purpose": "A single-selection dropdown control \u2014 user opens a list and picks one value. Compact and predictable for a small fixed set of options. Similar to HTML <select>. Legacy alias for Select in some SAP contexts.",
  "whenToUse": [
    "2\u201310 predefined options in a fixed list (Priority, Status, Region)",
    "The user selects exactly one value from a small set",
    "You want the field to occupy minimal horizontal space",
    "The options are static and rarely change"
  ],
  "whenNotToUse": [
    "For 10+ options \u2014 use ComboBox with type-to-filter",
    "For multi-select \u2014 use MultiComboBox",
    "For binary \u2014 use Switch or CheckBox",
    "For free text \u2014 use Input"
  ],
  "doRules": [
    "Show a default value (or 'Select\u2026' placeholder)",
    "Sort items alphabetically or by frequency of use",
    "Provide a valueState (Error/Warning/Success/Information) with matching text",
    "Use consistent capitalization across options"
  ],
  "dontRules": [
    "Do not use for booleans \u2014 Switch is clearer",
    "Do not show more than 8 items in the popup without scrolling \u2014 becomes noisy",
    "Do not allow free-text entry (that's ComboBox)",
    "Do not use for chained/dependent selections without clear indication"
  ],
  "layoutGuidance": {
    "placement": "Inside forms, filter bars, dialogs",
    "sizing": "Min width 120px; height 32px compact, 40px cozy",
    "spacing": "Standard field spacing",
    "alignment": "Full width in FormElement"
  },
  "contentGuidance": {
    "labelLength": "Option labels \u2264 30 chars; placeholder \u2264 30 chars",
    "contentRules": "Options are nouns or short adjectives, consistent format",
    "examples": [
      "Priority: [High \u25bc]",
      "Status: [Pending \u25bc]"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full field width",
    "L": "Full field width",
    "M": "Full field width",
    "S": "May become full-screen picker on tap"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 3.3.2 Labels or Instructions (Level A)"
    ],
    "requirements": [
      "role='combobox' or use native <select>",
      "Associated Label element",
      "Selected value announced by screen reader",
      "Keyboard: Space/Down opens list; Arrow keys navigate; Enter selects; Escape closes"
    ]
  },
  "patterns": [
    "Form field",
    "FilterBar item",
    "Dialog input"
  ],
  "compatibility": {
    "allowedWith": [
      "Form",
      "FormElement",
      "FilterBar",
      "Dialog",
      "Panel"
    ],
    "forbiddenWith": [
      "Table cells (too dense for most cases)",
      "Toolbar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DropDown.json`
7. Confirm: "Updated DropDown.json — N fields populated"

────────────────────────────────────────────────────────────

## [31/139] DynamicPage

# Refresh SAP Fiori guideline: DynamicPage

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpage

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpage")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DynamicPage' || s.name.endsWith('.DynamicPage'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DynamicPage"
   - slug: "dynamicpage"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpage"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DynamicPage",
  "slug": "dynamic-page",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/dynamic-page-layout/",
  "purpose": "A page-layout container with a snappable header, sticky title, and scrollable content. The base for Object Page and many other floorplans.",
  "whenToUse": [
    "For pages with header metadata + main content",
    "For Object Page floorplan",
    "When header should collapse on scroll"
  ],
  "whenNotToUse": [
    "For simple forms \u2014 use Form directly",
    "For full-screen dialogs \u2014 use Dialog",
    "For wizards \u2014 use Wizard"
  ],
  "doRules": [
    "Use DynamicPage for Object Page floorplan",
    "Always include DynamicPageTitle and content section",
    "Use DynamicPageHeader for snappable metadata",
    "Set showFooter when destructive actions need persistent visibility"
  ],
  "dontRules": [
    "Do not use DynamicPage for simple forms \u2014 use Form",
    "Do not nest DynamicPage inside DynamicPage",
    "Do not omit DynamicPageTitle"
  ],
  "layoutGuidance": {
    "placement": "Full content area below ShellBar.",
    "sizing": "Full viewport height.",
    "spacing": "Title 48px, header variable, content fills.",
    "alignment": "Vertical stack: title \u2192 header \u2192 content \u2192 footer."
  },
  "contentGuidance": {
    "labelLength": "N/A (container)",
    "contentRules": [
      "Use semantic slots: title, header, content, footer"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full layout",
    "L": "Full layout",
    "M": "Header may collapse to save space",
    "S": "Header collapsed by default; expand on tap"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Header collapse/expand via keyboard",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Title is announced as page heading"
    }
  ],
  "patterns": [
    "Object Page",
    "Detail page"
  ],
  "compatibility": {
    "worksWith": [
      "DynamicPageTitle",
      "DynamicPageHeader",
      "IconTabBar",
      "ObjectPageLayout"
    ],
    "incompatible": [
      "Inside Dialog",
      "Inside Card"
    ]
  },
  "exceptions": [
    "preserveHeaderStateOnScroll prevents collapse on scroll"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DynamicPage.json`
7. Confirm: "Updated DynamicPage.json — N fields populated"

────────────────────────────────────────────────────────────

## [32/139] DynamicPageHeader

# Refresh SAP Fiori guideline: DynamicPageHeader

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpageheader

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpageheader")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DynamicPageHeader' || s.name.endsWith('.DynamicPageHeader'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DynamicPageHeader"
   - slug: "dynamicpageheader"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpageheader"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DynamicPageHeader",
  "slug": "dynamic-page-layout",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/dynamic-page-layout/",
  "purpose": "The expandable header section below the DynamicPageTitle. Holds metadata that supplements the title (vendor, mode, version, description).",
  "whenToUse": [
    "For supplementary metadata about the page object",
    "In Object Page floorplan",
    "For description, key-value attributes, status indicators"
  ],
  "whenNotToUse": [
    "As page footer",
    "For primary actions \u2014 use DynamicPageTitle",
    "For navigation \u2014 use breadcrumbs in title"
  ],
  "doRules": [
    "Place metadata that supplements the title (vendor, mode, version, etc.)",
    "Allow user to snap (collapse) for more content room",
    "Use 48\u00d748px icon left-aligned next to text"
  ],
  "dontRules": [
    "Do not put primary actions here \u2014 use DynamicPageTitle",
    "Do not exceed 2 rows of metadata",
    "Do not duplicate title content"
  ],
  "layoutGuidance": {
    "placement": "Below DynamicPageTitle.",
    "sizing": "Full width; height varies by content.",
    "spacing": "Internal padding 16px.",
    "alignment": "Icon left, content right."
  },
  "contentGuidance": {
    "labelLength": "Description 1\u20132 lines.",
    "contentRules": [
      "Use Label/value pairs for metadata",
      "Group related metadata"
    ],
    "examples": [
      "Vendor: SAP",
      "Mode: Editable",
      "Version: 1.0.0"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full expanded layout",
    "L": "Full expanded layout",
    "M": "Compressed metadata",
    "S": "Collapsed by default; expand on tap"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Pin/unpin via keyboard",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Expanded/collapsed state announced"
    }
  ],
  "patterns": [
    "Object metadata",
    "Page header"
  ],
  "compatibility": {
    "worksWith": [
      "DynamicPage",
      "FilterBar",
      "ObjectPageLayout"
    ],
    "incompatible": [
      "As page footer"
    ]
  },
  "exceptions": [
    "pinnable=true allows user to lock header expanded"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DynamicPageHeader.json`
7. Confirm: "Updated DynamicPageHeader.json — N fields populated"

────────────────────────────────────────────────────────────

## [33/139] DynamicPageTitle

# Refresh SAP Fiori guideline: DynamicPageTitle

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpagetitle

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpagetitle")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DynamicPageTitle' || s.name.endsWith('.DynamicPageTitle'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DynamicPageTitle"
   - slug: "dynamicpagetitle"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamicpagetitle"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DynamicPageTitle",
  "slug": "dynamic-page-layout",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/dynamic-page-layout/",
  "purpose": "The sticky title bar of a DynamicPage. Contains breadcrumbs, page title, action buttons, and optionally an avatar/icon.",
  "whenToUse": [
    "As child of DynamicPage or ObjectPageLayout",
    "For page identification and primary actions"
  ],
  "whenNotToUse": [
    "Outside DynamicPage",
    "As page section header (use Panel)"
  ],
  "doRules": [
    "Use one DynamicPageTitle per page",
    "Place primary actions in actions slot",
    "Place navigation breadcrumb in breadcrumbs slot",
    "Use 72:Black 24px for the main heading"
  ],
  "dontRules": [
    "Do not include more than 4 primary actions",
    "Do not duplicate ShellBar content",
    "Do not omit the title"
  ],
  "layoutGuidance": {
    "placement": "Top of DynamicPage, sticky on scroll.",
    "sizing": "Full width, height 48px (collapsed) to 96px (expanded).",
    "spacing": "Breadcrumb above title; actions right-aligned.",
    "alignment": "Title left, actions right."
  },
  "contentGuidance": {
    "labelLength": "Title 1\u20135 words preferred.",
    "contentRules": [
      "Title in Black 24px",
      "Use sentence case"
    ],
    "examples": [
      "Purchase Order",
      "AKS_PKG"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full layout",
    "L": "Full layout",
    "M": "Actions may collapse to overflow",
    "S": "Sticky compact title only"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Heading text is the accessible name of the page",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "contrast",
      "requirement": "Title contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    }
  ],
  "patterns": [
    "Page title",
    "Sticky header"
  ],
  "compatibility": {
    "worksWith": [
      "DynamicPage",
      "ObjectPageLayout"
    ],
    "incompatible": [
      "Outside DynamicPage"
    ]
  },
  "exceptions": [
    "Snapped state hides description/metadata for scroll efficiency"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DynamicPageTitle.json`
7. Confirm: "Updated DynamicPageTitle.json — N fields populated"

────────────────────────────────────────────────────────────

## [34/139] DynamicSideContent

# Refresh SAP Fiori guideline: DynamicSideContent

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamic-side-content

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamic-side-content")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'DynamicSideContent' || s.name.endsWith('.DynamicSideContent'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "DynamicSideContent"
   - slug: "dynamic-side-content"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/dynamic-side-content"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "DynamicSideContent",
  "slug": "dynamic-side-content",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/dynamic-side-content/",
  "purpose": "A two-column layout with a main content area and a side content panel. The side content is context-sensitive (help text, related info, metadata) and can collapse or hide at smaller viewports. Used to keep primary content visible while offering auxiliary information.",
  "whenToUse": [
    "Main content needs a persistent auxiliary panel (help, related, metadata)",
    "You want the side panel to be responsive and gracefully hide on small screens",
    "The side content is secondary \u2014 user can complete the task without it",
    "The main content occupies most of the horizontal space (60\u201375%)"
  ],
  "whenNotToUse": [
    "Both panels are equally important \u2014 use FlexibleColumnLayout instead",
    "You need three columns \u2014 use FlexibleColumnLayout in 3-column mode",
    "The side content is critical (never hides) \u2014 use a static two-column grid",
    "For master-detail navigation \u2014 use FlexibleColumnLayout"
  ],
  "doRules": [
    "Place the primary task in the main content, not the side",
    "Use the side content for context, help, and metadata",
    "Give the side content a clear heading so users know its purpose",
    "Ensure the side content is optional \u2014 page must work without it"
  ],
  "dontRules": [
    "Do not put primary actions in the side content",
    "Do not overload with more than 1\u20132 side sections",
    "Do not use for two-column form layouts (use Form's columns instead)",
    "Do not stack DynamicSideContent inside another DynamicSideContent"
  ],
  "layoutGuidance": {
    "placement": "Inside a DynamicPage content area or an Object Page section",
    "sizing": "Main content: 60\u201375% \u00b7 Side content: 25\u201340%",
    "spacing": "24px gap between columns",
    "alignment": "Both columns top-aligned"
  },
  "contentGuidance": {
    "labelLength": "Side heading \u2264 40 chars",
    "contentRules": "Main content: primary task. Side content: help text, related lists, timestamps",
    "examples": [
      "Main: object form \u00b7 Side: activity timeline",
      "Main: chart \u00b7 Side: legend + filters"
    ]
  },
  "responsiveBehavior": {
    "XL": "Both columns visible",
    "L": "Both columns visible",
    "M": "Side content collapses below main",
    "S": "Side content hidden, accessible via a toggle button"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.2 Meaningful Sequence (Level A)",
      "WCAG 2.1 \u00b7 1.4.10 Reflow (Level AA)"
    ],
    "requirements": [
      "Reading order: main content \u2192 side content",
      "Side content has landmark role (aside/complementary)",
      "Toggle button (S viewport) has aria-expanded state",
      "Content reflows without horizontal scroll at 320px width"
    ]
  },
  "patterns": [
    "Object Page with metadata sidebar",
    "Analytical page with legend",
    "Help panel alongside form"
  ],
  "compatibility": {
    "allowedWith": [
      "DynamicPage",
      "ObjectPageLayout",
      "Panel",
      "Card",
      "Timeline"
    ],
    "forbiddenWith": [
      "Inside Dialog (space too limited)",
      "Inside another DynamicSideContent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/DynamicSideContent.json`
7. Confirm: "Updated DynamicSideContent.json — N fields populated"

────────────────────────────────────────────────────────────

## [35/139] EmptyPlanningCalendar

# Refresh SAP Fiori guideline: EmptyPlanningCalendar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'EmptyPlanningCalendar' || s.name.endsWith('.EmptyPlanningCalendar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "EmptyPlanningCalendar"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "EmptyPlanningCalendar",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "Empty-state illustration for a planning calendar with no scheduled events, meetings, or bookings. Signals 'no events in this range \u2014 either extend the range or create the first event'.",
  "whenToUse": [
    "Weekly/monthly planning calendar with no bookings in the visible range",
    "Fresh calendar view for a newly-created project",
    "Filtered calendar where the filter matches nothing",
    "Booking flows before any dates have been picked"
  ],
  "whenNotToUse": [
    "When a query returns zero results in a busy calendar \u2014 different UX",
    "For a general no-data state \u2014 use appropriate illustration",
    "In non-calendar contexts",
    "As decoration"
  ],
  "doRules": [
    "Pair with a 'Create event' or 'Schedule meeting' CTA",
    "Include description with contextual hint (e.g. 'or try a different date range')",
    "Use appropriate size for the calendar's viewport",
    "Keep the illustration on-brand with the calendar theme"
  ],
  "dontRules": [
    "Do not use for a calendar that just failed to load \u2014 use error state",
    "Do not omit the CTA \u2014 user needs a next step",
    "Do not shrink illustration below Spot size",
    "Do not overlay on top of pre-loaded events"
  ],
  "layoutGuidance": {
    "placement": "Inside IllustratedMessage in the empty calendar body",
    "sizing": "Spot 48\u00d748 \u00b7 Dialog 120\u00d7120 \u00b7 Scene 240\u00d7240",
    "spacing": "16px between elements",
    "alignment": "Centered in the empty calendar region"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 40 chars; description \u2264 120 chars",
    "contentRules": "Title states the empty state; description offers a next step",
    "examples": [
      "Title: 'Nothing scheduled' \u00b7 Description: 'Your calendar is clear \u2014 create an event to get started' \u00b7 Button: 'Create event'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Scene / Dialog size",
    "L": "Dialog size",
    "M": "Dialog size",
    "S": "Spot size"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "role='img' with descriptive aria-label",
      "Title uses semantic heading",
      "CTA describes the action clearly",
      "Focus moves to CTA on show"
    ]
  },
  "patterns": [
    "Empty calendar view",
    "Fresh scheduling flow",
    "Filtered calendar with no results"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any other parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/EmptyPlanningCalendar.json`
7. Confirm: "Updated EmptyPlanningCalendar.json — N fields populated"

────────────────────────────────────────────────────────────

## [36/139] FeedInput

# Refresh SAP Fiori guideline: FeedInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-input

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-input")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FeedInput' || s.name.endsWith('.FeedInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FeedInput"
   - slug: "feed-input"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-input"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FeedInput",
  "slug": "feed-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/feed-input/",
  "purpose": "Input optimised for feed/comment posting \u2014 multi-line text area with submit button anchored to the bottom-right.",
  "whenToUse": [
    "Comment composers under FeedListItem",
    "Reply boxes on activity items",
    "Note-posting in object detail pages"
  ],
  "whenNotToUse": [
    "Simple text \u2014 use Input",
    "Long-form documents \u2014 use TextArea",
    "Form fields \u2014 use Input or TextArea per type"
  ],
  "doRules": [
    "Include an Avatar showing current user",
    "Submit button is right-bottom-aligned, Emphasized type",
    "Auto-grow textarea up to ~5 lines, then scroll",
    "Disable submit until non-empty"
  ],
  "dontRules": [
    "Do not use FeedInput as a generic textarea",
    "Do not omit the Avatar",
    "Do not auto-submit on Enter (use Cmd+Enter or button click)"
  ],
  "layoutGuidance": {
    "placement": "Place FeedInput inside a compatible container (List (FeedListItem context), DynamicPage, Card).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List (FeedListItem context)",
    "Used inside DynamicPage",
    "Used inside Card"
  ],
  "compatibility": [
    "List (FeedListItem context)",
    "DynamicPage",
    "Card"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FeedInput.json`
7. Confirm: "Updated FeedInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [37/139] FeedListItem

# Refresh SAP Fiori guideline: FeedListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-list-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-list-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FeedListItem' || s.name.endsWith('.FeedListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FeedListItem"
   - slug: "feed-list-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/feed-list-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FeedListItem",
  "slug": "feed-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/feed-list-item/",
  "purpose": "Activity feed entry \u2014 author avatar + name + timestamp + message body + optional actions (Like / Reply).",
  "whenToUse": [
    "Social feed in an app",
    "Comment threads on an object",
    "Activity / audit log with rich content"
  ],
  "whenNotToUse": [
    "Tabular data \u2014 use Table",
    "Hierarchical \u2014 use Tree",
    "Simple list \u2014 use StandardListItem"
  ],
  "doRules": [
    "Include Avatar + author + timestamp + body",
    "Group consecutive items by same author",
    "Bind body text to sapList_TextColor"
  ],
  "dontRules": [
    "Do not omit timestamps",
    "Do not embed forms in FeedListItem \u2014 link out",
    "Do not use for tabular data"
  ],
  "layoutGuidance": {
    "placement": "Place FeedListItem inside a compatible container (List).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for list item.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List"
  ],
  "compatibility": [
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FeedListItem.json`
7. Confirm: "Updated FeedListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [38/139] FileUploader

# Refresh SAP Fiori guideline: FileUploader

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/fileuploader

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/fileuploader")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FileUploader' || s.name.endsWith('.FileUploader'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FileUploader"
   - slug: "fileuploader"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/fileuploader"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FileUploader",
  "slug": "file-uploader",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/file-uploader/",
  "purpose": "A control for selecting and uploading files. Combines a Browse button with file name display, supports drag-and-drop, mime-type filter, max-size limit.",
  "whenToUse": [
    "Single or multi-file upload in forms",
    "Attaching documents to records",
    "Profile photo, document upload"
  ],
  "whenNotToUse": [
    "For URL-based content \u2014 use Input",
    "For large datasets \u2014 use server-side upload tools"
  ],
  "doRules": [
    "Specify accepted mimeType for clarity",
    "Show file size limit before upload",
    "Allow drag-and-drop where supported",
    "Display selected file name with remove affordance"
  ],
  "dontRules": [
    "Do not omit file size limit",
    "Do not silently fail on rejected file types",
    "Do not omit progress feedback for large files"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog body.",
    "sizing": "Width fills container.",
    "spacing": "8px vertical between fields.",
    "alignment": "Button left, file display right."
  },
  "contentGuidance": {
    "labelLength": "Button text \"Browse...\" or context-specific.",
    "contentRules": [
      "Show selected file name",
      "Show file size limit hint",
      "List accepted formats"
    ],
    "examples": [
      "Browse...",
      "document.pdf (2 MB / 10 MB)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full button + filename + remove",
    "L": "Full button + filename + remove",
    "M": "Full button + filename",
    "S": "Native mobile file picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter activates browse; file dialog uses native OS controls",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label describing what to upload",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Upload progress announced; success/error states announced",
      "wcag": "4.1.3 (AA)"
    }
  ],
  "patterns": [
    "Form attachment",
    "Profile upload",
    "Document upload"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "Dialog"
    ],
    "incompatible": [
      "Without mimeType constraint"
    ]
  },
  "exceptions": [
    "multiple=true allows file picker to select multiple files"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FileUploader.json`
7. Confirm: "Updated FileUploader.json — N fields populated"

────────────────────────────────────────────────────────────

## [39/139] FilterBar

# Refresh SAP Fiori guideline: FilterBar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/filterbar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/filterbar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FilterBar' || s.name.endsWith('.FilterBar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FilterBar"
   - slug: "filterbar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/filterbar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FilterBar",
  "slug": "filter-bar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/filter-bar/",
  "purpose": "A panel that holds filter input fields above a list or table. Allows users to refine displayed results without leaving the page.",
  "whenToUse": [
    "Above List or Table when filtering is needed",
    "For List Report floorplan",
    "When \u22652 filter dimensions exist"
  ],
  "whenNotToUse": [
    "For single search input \u2014 use SearchField in toolbar",
    "For sort-only \u2014 use column sort affordance",
    "When all data should be shown by default"
  ],
  "doRules": [
    "Place in DynamicPageHeader slot",
    "Show most important filters by default",
    "Provide Go button to execute filter",
    "Allow filter configuration for advanced users"
  ],
  "dontRules": [
    "Do not stack filter rows when horizontal space allows",
    "Do not skip Labels on filter fields",
    "Do not require user to learn all filters at once"
  ],
  "layoutGuidance": {
    "placement": "In DynamicPageHeader, above main content.",
    "sizing": "Full width.",
    "spacing": "16px between filter fields.",
    "alignment": "Horizontal flow; wraps to multiple rows if needed."
  },
  "contentGuidance": {
    "labelLength": "Label text 1\u20132 words.",
    "contentRules": [
      "Use Input, Select, DateRangePicker as filter children",
      "Pair each with Label"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Multiple filters per row",
    "L": "Multiple filters per row",
    "M": "Fewer filters per row; rest in \"More Filters\" dialog",
    "S": "Single filter per row or in dialog"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab through filter fields in DOM order",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Each filter has Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Filter applied state announced"
    }
  ],
  "patterns": [
    "List Report filtering",
    "Search and filter"
  ],
  "compatibility": {
    "worksWith": [
      "DynamicPage",
      "DynamicPageHeader",
      "Input",
      "Select",
      "DateRangePicker"
    ],
    "incompatible": [
      "Inside Table cell",
      "As Dialog content"
    ]
  },
  "exceptions": [
    "Adaptive filter shows hidden filters via \"Adapt Filters\" dialog"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FilterBar.json`
7. Confirm: "Updated FilterBar.json — N fields populated"

────────────────────────────────────────────────────────────

## [40/139] Footer

# Refresh SAP Fiori guideline: Footer

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/page-footer-bar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/page-footer-bar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Footer' || s.name.endsWith('.Footer'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Footer"
   - slug: "page-footer-bar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/page-footer-bar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Footer",
  "slug": "footer",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/bar/",
  "purpose": "A page-level footer region containing primary and secondary actions. Sits at the bottom of a Page, Dialog, or DynamicPage. Under the hood, this is a Bar with design=Footer. Used when actions should always be visible at the bottom regardless of content scroll.",
  "whenToUse": [
    "Bottom-of-page primary action rows (Save / Cancel / Submit)",
    "Fullscreen Dialog footers with confirm/cancel",
    "Wizard footer with Back / Next / Finish buttons",
    "Any page needing a persistent action row at the bottom"
  ],
  "whenNotToUse": [
    "For an in-content actions bar \u2014 use Toolbar",
    "For an object detail's actions \u2014 use ObjectPageHeader actions instead",
    "For content that scrolls off \u2014 actions should stay visible",
    "For notifications or messages \u2014 use MessageStrip or NotificationBanner"
  ],
  "doRules": [
    "Right-align primary action (Emphasized style)",
    "Left-align secondary actions (Cancel, Back)",
    "Use ToolbarSpacer to push primary right",
    "Keep footer height consistent across pages"
  ],
  "dontRules": [
    "Do not put unrelated content in the footer",
    "Do not stack multiple footers",
    "Do not use for status messages \u2014 footer is for actions",
    "Do not hide the footer on scroll if actions are still relevant"
  ],
  "layoutGuidance": {
    "placement": "Bottom of Page, DynamicPage, or Dialog",
    "sizing": "Height 48px compact, 56px cozy; full container width",
    "spacing": "16px internal padding, 8px between buttons",
    "alignment": "contentLeft (cancel) \u00b7 spacer \u00b7 contentRight (primary)"
  },
  "contentGuidance": {
    "labelLength": "Button labels \u2264 20 chars",
    "contentRules": "Only action buttons; no arbitrary text",
    "examples": [
      "[Cancel]  spacer  [Save Draft] [Submit]"
    ]
  },
  "responsiveBehavior": {
    "XL": "All actions visible inline",
    "L": "All actions visible inline",
    "M": "May collapse secondary actions into a MenuButton",
    "S": "Primary action full-width; secondary in overflow"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)",
      "WCAG 2.1 \u00b7 2.4.6 Headings and Labels (AA)"
    ],
    "requirements": [
      "role='contentinfo' or 'region' with aria-label='Actions'",
      "Focus order: left actions \u2192 primary right",
      "Primary action reachable via Enter from anywhere on the page (when appropriate)",
      "Sticky positioning does not overlap focused inputs"
    ]
  },
  "patterns": [
    "Page footer",
    "Dialog footer",
    "Wizard footer"
  ],
  "compatibility": {
    "allowedWith": [
      "Page",
      "DynamicPage",
      "Dialog",
      "Wizard"
    ],
    "forbiddenWith": [
      "Toolbar (they are different components)",
      "Nested Footer"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Footer.json`
7. Confirm: "Updated Footer.json — N fields populated"

────────────────────────────────────────────────────────────

## [41/139] Form

# Refresh SAP Fiori guideline: Form

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Form' || s.name.endsWith('.Form'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Form"
   - slug: "form"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Form",
  "slug": "simple-form",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/form/",
  "purpose": "A container that arranges form fields and labels in a responsive grid. Supports edit and display modes with consistent spacing.",
  "whenToUse": [
    "For creating, editing, or displaying structured data",
    "In Object Page sections",
    "In dialogs requiring multiple inputs",
    "For settings pages"
  ],
  "whenNotToUse": [
    "For single-field input \u2014 use field component directly",
    "For freeform layout \u2014 use FlexBox or VBox",
    "For tabular data \u2014 use Table"
  ],
  "doRules": [
    "Group related fields under a FormContainer with title",
    "Use SimpleForm for basic forms; Form for complex layouts",
    "Mark required fields with required=true",
    "Use editable=false for display mode"
  ],
  "dontRules": [
    "Do not skip Labels on fields",
    "Do not put unrelated fields in same group",
    "Do not stretch the form to full width on wide viewports"
  ],
  "layoutGuidance": {
    "placement": "Inside page content, ObjectPageSection, Dialog.",
    "sizing": "Max width 1024px preferred; width fills parent up to max.",
    "spacing": "8px Compact / 16px Cozy between fields.",
    "alignment": "Labels left, fields right (or labels above on narrow)."
  },
  "contentGuidance": {
    "labelLength": "Field labels 1\u20133 words.",
    "contentRules": [
      "Group with FormContainer",
      "Use FormElement per Label+field pair"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Multi-column layout (2\u20133 columns)",
    "L": "2-column layout",
    "M": "Single column with labels left",
    "S": "Single column with labels above fields"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab navigates through fields in DOM order",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Every form field paired with Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Required fields announced; errors announced via valueState"
    }
  ],
  "patterns": [
    "Create form",
    "Edit form",
    "Settings"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Input",
      "Select",
      "CheckBox",
      "RadioButton",
      "Switch",
      "Panel"
    ],
    "incompatible": [
      "Inside Toolbar",
      "Inside Table cell"
    ]
  },
  "exceptions": [
    "SimpleForm has a different child API but same visual output"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Form.json`
7. Confirm: "Updated Form.json — N fields populated"

────────────────────────────────────────────────────────────

## [42/139] FormContainer

# Refresh SAP Fiori guideline: FormContainer

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-container

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-container")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FormContainer' || s.name.endsWith('.FormContainer'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FormContainer"
   - slug: "form-container"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-container"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FormContainer",
  "slug": "form-container",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/form-container/",
  "purpose": "Logical grouping within a Form. Contains FormElements. Has optional title.",
  "whenToUse": [
    "Inside Form / SimpleForm",
    "When fields should be grouped under a heading (Personal Info / Address / Preferences)"
  ],
  "whenNotToUse": [
    "Single-group form \u2014 direct FormElements are fine",
    "For visual sections \u2014 use Panel inside Form"
  ],
  "doRules": [
    "Provide a clear group title when appropriate",
    "Group 3-7 FormElements per FormContainer",
    "Use sentence-case titles"
  ],
  "dontRules": [
    "Do not nest FormContainer",
    "Do not exceed 7 FormElements per group"
  ],
  "layoutGuidance": {
    "placement": "Place FormContainer inside a compatible container (Form, SimpleForm).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for forms.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Form",
    "Used inside SimpleForm"
  ],
  "compatibility": [
    "Form",
    "SimpleForm"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FormContainer.json`
7. Confirm: "Updated FormContainer.json — N fields populated"

────────────────────────────────────────────────────────────

## [43/139] FormElement

# Refresh SAP Fiori guideline: FormElement

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-element

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-element")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FormElement' || s.name.endsWith('.FormElement'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FormElement"
   - slug: "form-element"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/form-element"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FormElement",
  "slug": "form-element",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/form-element/",
  "purpose": "Single field row inside a FormContainer \u2014 a Label + one or more input fields.",
  "whenToUse": [
    "Inside FormContainer",
    "Every input field in a Form"
  ],
  "whenNotToUse": [
    "Outside FormContainer",
    "For non-form layouts"
  ],
  "doRules": [
    "Always include a Label",
    "Bind Label to its Input via labelFor",
    "Use one main Input per FormElement"
  ],
  "dontRules": [
    "Do not omit the Label",
    "Do not stack multiple Labels per FormElement",
    "Do not nest FormElements"
  ],
  "layoutGuidance": {
    "placement": "Place FormElement inside a compatible container (FormContainer).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for forms.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside FormContainer"
  ],
  "compatibility": [
    "FormContainer"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FormElement.json`
7. Confirm: "Updated FormElement.json — N fields populated"

────────────────────────────────────────────────────────────

## [44/139] FormattedText

# Refresh SAP Fiori guideline: FormattedText

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/formatted-text

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/formatted-text")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'FormattedText' || s.name.endsWith('.FormattedText'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "FormattedText"
   - slug: "formatted-text"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/formatted-text"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "FormattedText",
  "slug": "formatted-text",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/formatted-text/",
  "purpose": "Text container that supports inline HTML-like markup \u2014 bold, italic, links, line breaks. Used for rich text in object descriptions, help content, formatted messages.",
  "whenToUse": [
    "Object descriptions with mixed formatting",
    "Help text with inline links",
    "Localized messages with bold/italic emphasis",
    "Server-supplied formatted content"
  ],
  "whenNotToUse": [
    "Plain text \u2014 use Text",
    "Headings \u2014 use Title",
    "Lists \u2014 use List",
    "Editable rich text \u2014 use TextArea + format toolbar"
  ],
  "doRules": [
    "Sanitize HTML before rendering",
    "Bind base text to sapList_TextColor",
    "Use sapLinkColor for inline links"
  ],
  "dontRules": [
    "Do not render unsanitized user-supplied HTML",
    "Do not use FormattedText for layout (no positioned content)",
    "Do not embed forms inside FormattedText"
  ],
  "layoutGuidance": {
    "placement": "Place FormattedText inside a compatible container (Panel, Dialog, Card).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for typography.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Panel",
    "Used inside Dialog",
    "Used inside Card"
  ],
  "compatibility": [
    "Panel",
    "Dialog",
    "Card",
    "MessageStrip"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/FormattedText.json`
7. Confirm: "Updated FormattedText.json — N fields populated"

────────────────────────────────────────────────────────────

## [45/139] GenericTag

# Refresh SAP Fiori guideline: GenericTag

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/generic-tag

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/generic-tag")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'GenericTag' || s.name.endsWith('.GenericTag'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "GenericTag"
   - slug: "generic-tag"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/generic-tag"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "GenericTag",
  "slug": "generic-tag",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/generic-tag/",
  "purpose": "A compact tag control used to show a numeric KPI alongside a short label. Combines a label with a value, optionally with a semantic status color. Common in dashboards and object headers.",
  "whenToUse": [
    "Show a KPI with label + numeric value (e.g. 'Overdue: 12')",
    "Alongside ObjectStatus when both a metric and a categorical state are needed",
    "In an Object Header header content region",
    "For at-a-glance metrics that don't require a full chart"
  ],
  "whenNotToUse": [
    "For purely categorical state without a value \u2014 use ObjectStatus",
    "For a categorical label without a value or state \u2014 use InfoLabel",
    "For long text \u2014 use Text or Title",
    "As a status indicator in table cells \u2014 use ObjectStatus for row status"
  ],
  "doRules": [
    "Keep labels to 1-2 words maximum",
    "Pair semantic status color with icon or text for accessibility",
    "Use design=StatusIconHidden when the status is expressed by value alone",
    "Right-align in dashboard KPI rows for visual scanning"
  ],
  "dontRules": [
    "Do not use color alone to convey status (WCAG 1.4.1)",
    "Do not put full sentences in the label",
    "Do not stack GenericTags vertically \u2014 use a proper KPI grid",
    "Do not use for booleans \u2014 use Switch or CheckBox"
  ],
  "layoutGuidance": {
    "placement": "Horizontal row in dashboards, object header content region, card content",
    "sizing": "Hug content. Min height 32px compact, 40px cozy",
    "spacing": "8px between adjacent GenericTags",
    "alignment": "Label + value inline, or label above value in stacked mode"
  },
  "contentGuidance": {
    "labelLength": "1-15 characters. Longer labels wrap.",
    "contentRules": "Label is a noun phrase, value is a number or short string",
    "examples": [
      "Overdue: 12",
      "Complete: 87%",
      "Errors: 3"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline in horizontal row",
    "L": "Same",
    "M": "May wrap to next row",
    "S": "Stacks vertically or wraps"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "Semantic status colors always paired with icon or descriptive text",
      "Value + label together form an accessible name",
      "Focus indicator visible when interactive"
    ]
  },
  "patterns": [
    "Object Header",
    "KPI dashboard row",
    "Card content"
  ],
  "compatibility": {
    "allowedWith": [
      "ObjectHeader",
      "Card",
      "Panel",
      "HBox"
    ],
    "forbiddenWith": [
      "Inside Table cells (too small)"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/GenericTag.json`
7. Confirm: "Updated GenericTag.json — N fields populated"

────────────────────────────────────────────────────────────

## [46/139] GroupHeaderListItem

# Refresh SAP Fiori guideline: GroupHeaderListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/group-header-list-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/group-header-list-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'GroupHeaderListItem' || s.name.endsWith('.GroupHeaderListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "GroupHeaderListItem"
   - slug: "group-header-list-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/group-header-list-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "GroupHeaderListItem",
  "slug": "group-header-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/group-header-list-item/",
  "purpose": "Section header within a List. Visually separates groups of items by category, status, or date.",
  "whenToUse": [
    "Grouped lists (group by date, status, category)",
    "Long lists that benefit from sectional structure",
    "Mobile contact-list-style alphabetical groupings"
  ],
  "whenNotToUse": [
    "Short lists (< 10 items) \u2014 no grouping needed",
    "Tabular data \u2014 use Table with grouped Columns"
  ],
  "doRules": [
    "Provide a concise group title",
    "Bind title to sapContent_LabelColor",
    "Always uppercase or title-case for visual hierarchy"
  ],
  "dontRules": [
    "Do not omit the count when relevant (\"Inbox (12)\")",
    "Do not nest GroupHeaderListItems"
  ],
  "layoutGuidance": {
    "placement": "Place GroupHeaderListItem inside a compatible container (List).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for list item.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List"
  ],
  "compatibility": [
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/GroupHeaderListItem.json`
7. Confirm: "Updated GroupHeaderListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [47/139] GroupingColumns

# Refresh SAP Fiori guideline: GroupingColumns

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'GroupingColumns' || s.name.endsWith('.GroupingColumns'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "GroupingColumns"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "GroupingColumns",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "Empty-state illustration used in analytical tables or pivot views when the user hasn't defined any grouping columns yet. Signals 'add columns to group by \u2014 the table is waiting'.",
  "whenToUse": [
    "Analytical Table view with no grouping columns configured",
    "Pivot report awaiting grouping dimension selection",
    "Any data table with a grouping UI that starts empty",
    "Data explorer with configurable grouping"
  ],
  "whenNotToUse": [
    "For empty raw data \u2014 use different empty state",
    "For a table filter with no results \u2014 use different variant",
    "As decoration",
    "In non-analytical contexts"
  ],
  "doRules": [
    "Pair with CTA ('Add grouping', 'Configure columns')",
    "Include description explaining what grouping does",
    "Use appropriate size for the container",
    "Guide user toward the grouping affordance visually"
  ],
  "dontRules": [
    "Do not use if data is loading \u2014 that's a spinner state",
    "Do not omit the CTA",
    "Do not use for permission errors",
    "Do not shrink illustration below Spot size"
  ],
  "layoutGuidance": {
    "placement": "Inside IllustratedMessage in the empty table region",
    "sizing": "Spot 48\u00d748 \u00b7 Dialog 120\u00d7120 \u00b7 Scene 240\u00d7240",
    "spacing": "16px between elements",
    "alignment": "Centered in the empty table"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 40 chars; description \u2264 120 chars",
    "contentRules": "Title names the state; description invites configuration",
    "examples": [
      "Title: 'No grouping selected' \u00b7 Description: 'Choose columns to group your data by' \u00b7 Button: 'Add grouping'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Scene / Dialog size",
    "L": "Dialog size",
    "M": "Dialog size",
    "S": "Spot size"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "role='img' with descriptive aria-label",
      "Title as semantic heading",
      "CTA clearly labeled",
      "Focus moves to CTA on show"
    ]
  },
  "patterns": [
    "Empty analytical table",
    "Pivot configuration prompt",
    "Data explorer setup"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any other parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/GroupingColumns.json`
7. Confirm: "Updated GroupingColumns.json — N fields populated"

────────────────────────────────────────────────────────────

## [48/139] HomepageHeroBanner

# Refresh SAP Fiori guideline: HomepageHeroBanner

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'HomepageHeroBanner' || s.name.endsWith('.HomepageHeroBanner'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "HomepageHeroBanner"
   - slug: "banner"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/banner"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "HomepageHeroBanner",
  "slug": "home-page",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/home-page/",
  "purpose": "A large hero banner at the top of a home page or launchpad. Communicates brand identity, primary welcome message, and optional call-to-action. Usually spans full width with a background image and prominent typography.",
  "whenToUse": [
    "Landing page for a role-based SAP app",
    "Fiori Launchpad home tile with welcome content",
    "Marketing-style intro to a business flow",
    "Brand-forward first-impression pages"
  ],
  "whenNotToUse": [
    "On task-focused screens \u2014 use a plain DynamicPageTitle",
    "For a small header \u2014 use ShellBar's brand area",
    "For product cards \u2014 use Card or GenericTile",
    "Inside dialogs or popovers \u2014 too much visual weight"
  ],
  "doRules": [
    "Keep title short (\u2264 60 chars) and easy to scan",
    "Include a clear call-to-action button when there is a primary next step",
    "Use a background image that reinforces the brand or context",
    "Ensure title contrast against background image (dark overlay if needed)"
  ],
  "dontRules": [
    "Do not use hero banner on every page \u2014 reserve for landings",
    "Do not put critical actions here alone \u2014 repeat them elsewhere",
    "Do not omit the overlay if background image is busy \u2014 text won't read",
    "Do not use for status messages or errors"
  ],
  "layoutGuidance": {
    "placement": "Top of home / landing page, below ShellBar",
    "sizing": "Height 240\u2013320px desktop, 180px mobile; full width",
    "spacing": "48px internal padding",
    "alignment": "Title + subtitle + CTA left-aligned or centered"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 60 chars; subtitle \u2264 140 chars",
    "contentRules": "Title is welcome/orientation; subtitle offers context; CTA is verb-first",
    "examples": [
      "Welcome, Nadia \u2014 your dashboard is ready",
      "Get started with Purchase Orders \u2014 Create new PO \u25b8"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full hero with image + text + CTA",
    "L": "Full hero",
    "M": "Reduced height, image may crop",
    "S": "Title + CTA only, image may hide or be simplified"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)",
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "Title contrast against background \u2265 4.5:1 (add overlay if needed)",
      "Background image has alt='' (decorative) or descriptive alt",
      "H1 semantic role for the title",
      "CTA button clearly labeled with the destination action"
    ]
  },
  "patterns": [
    "Fiori Launchpad landing",
    "Initial Page floorplan",
    "Product marketing home"
  ],
  "compatibility": {
    "allowedWith": [
      "DynamicPage (as first child)",
      "Page (as first child)"
    ],
    "forbiddenWith": [
      "Dialog",
      "Popover",
      "Panel",
      "Card"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/HomepageHeroBanner.json`
7. Confirm: "Updated HomepageHeroBanner.json — N fields populated"

────────────────────────────────────────────────────────────

## [49/139] IconButton

# Refresh SAP Fiori guideline: IconButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/iconbutton

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/iconbutton")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconButton' || s.name.endsWith('.IconButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconButton"
   - slug: "iconbutton"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/iconbutton"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconButton",
  "slug": "icon-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/icon-button/",
  "purpose": "A button that shows only an icon, no text. Used for compact action triggers when screen space is limited or actions are universally recognized.",
  "whenToUse": [
    "In toolbars where space is constrained",
    "For universally recognized actions (delete, edit, settings)",
    "For row-level actions in tables",
    "In ShellBar for global actions (notifications, help, account)"
  ],
  "whenNotToUse": [
    "For primary actions \u2014 use Button with label",
    "For unfamiliar icon metaphors",
    "When label adds important clarification"
  ],
  "doRules": [
    "Use a tooltip explaining the action",
    "Pair with a well-known icon metaphor",
    "Keep touch area \u226532px even if icon is smaller",
    "Use Transparent type as default; Emphasized only for emphasis"
  ],
  "dontRules": [
    "Do not use IconButton for primary actions \u2014 use Button with label",
    "Do not use unfamiliar custom icons",
    "Do not skip tooltip",
    "Do not make touch area smaller than 32\u00d732px"
  ],
  "layoutGuidance": {
    "placement": "In toolbars, ShellBar, table rows.",
    "sizing": "32\u00d732px Compact / 44\u00d744px Cozy. Square aspect.",
    "spacing": "4px between adjacent icon buttons.",
    "alignment": "Right-aligned in toolbars by default."
  },
  "contentGuidance": {
    "labelLength": "No label \u2014 tooltip only.",
    "contentRules": [
      "Icon must convey action clearly",
      "Tooltip describes action in verb form"
    ],
    "examples": [
      "Edit",
      "Delete",
      "More Options",
      "Notifications"
    ]
  },
  "responsiveBehavior": {
    "XL": "Standard 32\u00d732px",
    "L": "Standard 32\u00d732px",
    "M": "Standard 32\u00d732px",
    "S": "May grow to 44\u00d744px for touch targets"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Icon-only buttons MUST have tooltip (aria-label)",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "tap-target",
      "requirement": "Min 32\u00d732px Compact / 44\u00d744px Cozy",
      "wcag": "2.5.5 (AAA)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus ring",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "keyboard",
      "requirement": "Enter and Space activate",
      "wcag": "2.1.1 (A)"
    }
  ],
  "patterns": [
    "Toolbar action",
    "Row action",
    "Shell action",
    "Settings trigger"
  ],
  "compatibility": {
    "worksWith": [
      "Toolbar",
      "OverflowToolbar",
      "ShellBar",
      "Table"
    ],
    "incompatible": [
      "As primary CTA without label"
    ]
  },
  "exceptions": [
    "ShellIconButton variant has different styling for the application shell"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconButton.json`
7. Confirm: "Updated IconButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [50/139] IconMenuButton

# Refresh SAP Fiori guideline: IconMenuButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu-button

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu-button")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconMenuButton' || s.name.endsWith('.IconMenuButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconMenuButton"
   - slug: "menu-button"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu-button"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconMenuButton",
  "slug": "menu-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/menu-button/",
  "purpose": "An icon-only button that opens a Menu when clicked. Space-efficient way to expose a menu of actions when a label would take too much space (toolbars, table row actions, dense list items).",
  "whenToUse": [
    "Row actions in a Table where each row has 3+ actions",
    "Overflow menus in toolbars when horizontal space is tight",
    "Card header 'More' menu (typically a three-dots icon)",
    "Kebab menus for context-specific actions"
  ],
  "whenNotToUse": [
    "For a single action \u2014 use IconButton",
    "For 6+ actions \u2014 use a proper Menu with labels",
    "When the icon meaning is unclear without a label \u2014 use MenuButton",
    "For primary actions \u2014 use Button with a clear label"
  ],
  "doRules": [
    "Always provide a tooltip and aria-label describing what the menu contains",
    "Use standardized icons: three dots (\u22ee) for 'more', gear for settings, filter icon for filter menu",
    "Show the chevron only when space allows (or omit for kebab-style)",
    "Anchor the menu below the button by default"
  ],
  "dontRules": [
    "Do not omit the tooltip \u2014 icon-only is fine, but the icon must be discoverable",
    "Do not use ambiguous icons \u2014 pick well-known ones or fall back to labeled MenuButton",
    "Do not use for a single action \u2014 IconButton is correct there",
    "Do not stack multiple IconMenuButtons in the same row unless separated visually"
  ],
  "layoutGuidance": {
    "placement": "Toolbars, table row action columns, card headers",
    "sizing": "32\u00d732 compact, 40\u00d740 cozy",
    "spacing": "Standard button spacing (8px)",
    "alignment": "Right-aligned in row actions; left-aligned in toolbars"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 icon only",
    "contentRules": "Icon must be well-known or heavily used across the app",
    "examples": [
      "\u22ee (More actions)",
      "\u2699 (Settings)",
      "\u25bd (Filter)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon only",
    "L": "Icon only",
    "M": "Icon only",
    "S": "Icon only"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 2.5.5 Target Size (AAA)"
    ],
    "requirements": [
      "aria-label describing the menu contents ('Row actions')",
      "aria-haspopup='menu' and aria-expanded reflect menu state",
      "Minimum 32px compact / 44px cozy tap target",
      "Keyboard: Enter opens; Down opens with focus in menu; Escape closes"
    ]
  },
  "patterns": [
    "Table row actions",
    "Toolbar overflow",
    "Card header more menu"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "Table (cell)",
      "Card (header)"
    ],
    "forbiddenWith": [
      "As primary action",
      "Standalone without container"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconMenuButton.json`
7. Confirm: "Updated IconMenuButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [51/139] IconSplitButton

# Refresh SAP Fiori guideline: IconSplitButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconSplitButton' || s.name.endsWith('.IconSplitButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconSplitButton"
   - slug: "split-button"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconSplitButton",
  "slug": "split-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/split-button/",
  "purpose": "An icon-only split-button: main action icon on left, dropdown arrow on right that opens a Menu. Space-efficient version of SplitButton where the icon alone is meaningful.",
  "whenToUse": [
    "Toolbar row actions with 2\u20135 close variants (Save / Save as / Save & Close via icon)",
    "Density-critical placements where labels don't fit",
    "When the icon is well-known and instantly understood",
    "Object header actions with variants"
  ],
  "whenNotToUse": [
    "When the icon meaning is unclear \u2014 use SplitButton (labeled)",
    "For a single action \u2014 use IconButton",
    "For unrelated actions \u2014 use IconMenuButton",
    "In table cells where 3+ actions exist \u2014 use IconMenuButton (kebab)"
  ],
  "doRules": [
    "Use only widely-recognized icons (save, share, export, delete)",
    "Provide a tooltip and aria-label on the main icon",
    "Group related menu items together",
    "Keep the chevron arrow proportional to the icon"
  ],
  "dontRules": [
    "Do not use ambiguous icons \u2014 accessibility suffers",
    "Do not hide the split-button chevron",
    "Do not use for destructive actions",
    "Do not stack multiple IconSplitButtons in the same row without visual separation"
  ],
  "layoutGuidance": {
    "placement": "Toolbars, DynamicPageTitle actions, object headers",
    "sizing": "Height 32/40px; width hugs icon + arrow (~64/80px)",
    "spacing": "Standard button spacing",
    "alignment": "Right-aligned in footers"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 icon only",
    "contentRules": "Icon must be well-known; tooltip describes the primary action",
    "examples": [
      "[\ud83d\udcbe\u25bc] Save (menu: Save \u00b7 Save as \u00b7 Save & Close)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + arrow",
    "L": "Icon + arrow",
    "M": "Icon + arrow",
    "S": "May collapse into a MenuButton with labels"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 2.5.5 Target Size (AAA)"
    ],
    "requirements": [
      "Main icon has aria-label describing primary action",
      "Arrow has aria-label='More options' and aria-haspopup='menu'",
      "Minimum 32px compact / 44px cozy tap targets",
      "Keyboard: Enter on main = primary; Down on arrow = open menu"
    ]
  },
  "patterns": [
    "Toolbar dense action",
    "Object header split action",
    "Editor toolbar"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "Bar",
      "DynamicPageTitle"
    ],
    "forbiddenWith": [
      "Table cells (too small)",
      "Dense List rows"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconSplitButton.json`
7. Confirm: "Updated IconSplitButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [52/139] IconTabBar

# Refresh SAP Fiori guideline: IconTabBar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabbar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabbar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconTabBar' || s.name.endsWith('.IconTabBar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconTabBar"
   - slug: "icontabbar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabbar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconTabBar",
  "slug": "icontabbar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/icontabbar/",
  "purpose": "A navigation container that organizes content into labeled tabs with optional icons. Tabs can show counters and badges. Used as a secondary navigation within a page.",
  "whenToUse": [
    "Organize related content into separate views at the top of a content area",
    "Show category-based content (Header / Overview / Artifacts / Documents)",
    "Allow users to switch between content panels without page reload",
    "Display item counts in tab badges (e.g. \"Artifacts (2)\")"
  ],
  "whenNotToUse": [
    "Inside a dialog \u2014 use a Form or Panel instead",
    "Inside a table cell or list item",
    "As the only navigation on a page \u2014 use SideNavigation for primary nav",
    "When tabs exceed ~7 \u2014 split into separate pages or use hierarchical navigation"
  ],
  "doRules": [
    "Place at top of content area below page header",
    "Use Bold weight for active tab and Semibold Duplex for inactive \u2014 same size",
    "Indicate active tab with 3px bottom bar in sapShell_Navigation_SelectedColor",
    "Keep tab labels short (1\u20133 words) and consistent in length",
    "Show count in parens for tab badges"
  ],
  "dontRules": [
    "Do not nest IconTabBar inside another IconTabBar",
    "Do not use more than 7 tabs \u2014 split into multiple pages",
    "Do not change tab text via direct text node injection \u2014 use selectedKey + setProperties on IconTabFilter children",
    "Do not communicate active state by color alone \u2014 use the bottom bar"
  ],
  "layoutGuidance": {
    "placement": "Top of content area, below DynamicPageHeader, full width.",
    "sizing": "Height 44px. Full container width with horizontal scroll if tabs overflow.",
    "spacing": "32px gap between tabs.",
    "alignment": "Tabs left-aligned with 48px left padding."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words. Add (count) badge when applicable.",
    "contentRules": [
      "Use noun labels for content categories (Header, Overview, Artifacts)",
      "Pluralize counted entities",
      "Keep tab order stable across visits"
    ],
    "examples": [
      "Header",
      "Overview",
      "Artifacts (2)",
      "Documents",
      "Tags"
    ]
  },
  "responsiveBehavior": {
    "XL": "All tabs visible inline",
    "L": "All tabs visible inline",
    "M": "Tabs visible inline; horizontal scroll if needed",
    "S": "Overflow menu replaces inline tabs; selected tab + dropdown for others"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Active tab text contrast \u2265 4.5:1 with background",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "keyboard",
      "requirement": "Arrow keys navigate between tabs; Enter activates",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus indicator on focused tab",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "status",
      "requirement": "Active tab distinguishable by more than color (uses 3px bar)",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Each tab has accessible name from text property"
    }
  ],
  "patterns": [
    "Object Page sections",
    "List Report views",
    "Wizard steps (when nonlinear)"
  ],
  "compatibility": {
    "worksWith": [
      "IconTabFilter",
      "DynamicPage",
      "ObjectPageLayout",
      "DynamicPageHeader"
    ],
    "incompatible": [
      "Dialog",
      "Table cell",
      "List item"
    ]
  },
  "exceptions": [
    "Inline mode (headerMode=Inline) places tabs in the page title area",
    "For very wide tabs, allow horizontal scroll with shadows indicating overflow"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconTabBar.json`
7. Confirm: "Updated IconTabBar.json — N fields populated"

────────────────────────────────────────────────────────────

## [53/139] IconTabFilter

# Refresh SAP Fiori guideline: IconTabFilter

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabfilter

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabfilter")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconTabFilter' || s.name.endsWith('.IconTabFilter'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconTabFilter"
   - slug: "icontabfilter"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icontabfilter"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconTabFilter",
  "slug": "icontabbar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/icontabbar/",
  "purpose": "A single tab within an IconTabBar. Holds the tab label, optional icon, count badge, and selected state.",
  "whenToUse": [
    "As child of IconTabBar only",
    "For each tab in the bar"
  ],
  "whenNotToUse": [
    "Outside IconTabBar",
    "For navigation across pages \u2014 use SideNavigation"
  ],
  "doRules": [
    "Use short labels (1\u20133 words)",
    "Show count in parens for tab badges like \"Artifacts (2)\"",
    "Use design=Vertical for label-only tabs; Horizontal for icon+label",
    "Set key for selectedKey binding"
  ],
  "dontRules": [
    "Do not change tab label text via direct injection \u2014 use text property",
    "Do not nest IconTabFilter inside IconTabFilter",
    "Do not use long labels"
  ],
  "layoutGuidance": {
    "placement": "Inside IconTabBar items aggregation.",
    "sizing": "Auto width by label; height matches IconTabBar.",
    "spacing": "32px gap to next tab.",
    "alignment": "Center within tab area."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words.",
    "contentRules": [
      "Use noun labels",
      "Add (count) for badges"
    ],
    "examples": [
      "Header",
      "Overview",
      "Artifacts (2)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline with full label",
    "L": "Inline with full label",
    "M": "Inline; horizontal scroll if overflow",
    "S": "Collapsed into overflow menu"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys navigate tabs",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "status",
      "requirement": "Selected state shown by color AND underline",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Selected state announced as \"selected\""
    }
  ],
  "patterns": [
    "Tab within IconTabBar"
  ],
  "compatibility": {
    "worksWith": [
      "IconTabBar"
    ],
    "incompatible": [
      "Outside IconTabBar"
    ]
  },
  "exceptions": [
    "IconTabSeparator for visual grouping between tabs"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconTabFilter.json`
7. Confirm: "Updated IconTabFilter.json — N fields populated"

────────────────────────────────────────────────────────────

## [54/139] IconTabHeader

# Refresh SAP Fiori guideline: IconTabHeader

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-header

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-header")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconTabHeader' || s.name.endsWith('.IconTabHeader'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconTabHeader"
   - slug: "icon-tab-header"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-header"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconTabHeader",
  "slug": "icon-tab-header",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/icon-tab-header/",
  "purpose": "Header zone of IconTabBar \u2014 the strip that holds the tab filters. Used as a standalone navigation strip when the content panel is rendered separately.",
  "whenToUse": [
    "Standalone tab strip without IconTabBar content panel",
    "Detached tab navigation in a custom layout"
  ],
  "whenNotToUse": [
    "Normal use \u2014 IconTabBar already includes its IconTabHeader",
    "For top tabs without filters \u2014 use Tabs"
  ],
  "doRules": [
    "Inherit visual styling from IconTabBar",
    "Manage selected state same as IconTabBar"
  ],
  "dontRules": [
    "Do not use IconTabHeader if IconTabBar is sufficient \u2014 duplication risk",
    "Do not nest IconTabHeader"
  ],
  "layoutGuidance": {
    "placement": "Place IconTabHeader inside a compatible container (IconTabBar, DynamicPage).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for navigation.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside IconTabBar",
    "Used inside DynamicPage"
  ],
  "compatibility": [
    "IconTabBar",
    "DynamicPage"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconTabHeader.json`
7. Confirm: "Updated IconTabHeader.json — N fields populated"

────────────────────────────────────────────────────────────

## [55/139] IconTabSeparator

# Refresh SAP Fiori guideline: IconTabSeparator

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-separator

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-separator")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IconTabSeparator' || s.name.endsWith('.IconTabSeparator'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IconTabSeparator"
   - slug: "icon-tab-separator"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/icon-tab-separator"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IconTabSeparator",
  "slug": "icon-tab-separator",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/icon-tab-separator/",
  "purpose": "Visual separator between groups of tabs inside an IconTabBar.",
  "whenToUse": [
    "Inside IconTabBar between logical tab groups",
    "When tabs span multiple distinct categories"
  ],
  "whenNotToUse": [
    "Outside IconTabBar",
    "For visual padding \u2014 adjust itemSpacing instead"
  ],
  "doRules": [
    "Use to separate logically distinct tab groups (Process / Settings / Help)",
    "Keep separator visually subtle"
  ],
  "dontRules": [
    "Do not abuse separators to compensate for tab overcrowding (limit tabs instead)",
    "Do not use multiple separators in a row"
  ],
  "layoutGuidance": {
    "placement": "Place IconTabSeparator inside a compatible container (IconTabBar).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for navigation.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside IconTabBar"
  ],
  "compatibility": [
    "IconTabBar"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IconTabSeparator.json`
7. Confirm: "Updated IconTabSeparator.json — N fields populated"

────────────────────────────────────────────────────────────

## [56/139] IllustratedMessage

# Refresh SAP Fiori guideline: IllustratedMessage

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustratedmessage

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustratedmessage")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'IllustratedMessage' || s.name.endsWith('.IllustratedMessage'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "IllustratedMessage"
   - slug: "illustratedmessage"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustratedmessage"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "IllustratedMessage",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustratedmessage/",
  "purpose": "Empty-state placeholder with an illustration, title, description, and optional action. Used when a list/table is empty or a search returns no results.",
  "whenToUse": [
    "Empty state for lists, tables, or search results",
    "Error states with a recovery action",
    "Onboarding screens to introduce empty functionality",
    "After dismissing all items in a queue"
  ],
  "whenNotToUse": [
    "As decorative content \u2014 IllustratedMessage signals state",
    "For loading states \u2014 use BusyIndicator",
    "For inline form validation \u2014 use MessageStrip",
    "When data IS present \u2014 only show when empty"
  ],
  "doRules": [
    "Pick an illustration matching the context (NoData / NoTasks / NoFilter / NoActivities)",
    "Provide a one-line title explaining the state",
    "Provide a description suggesting what to do next",
    "Include an action button when the user can recover (Refresh, Create, etc.)"
  ],
  "dontRules": [
    "Do not show IllustratedMessage if the cause is unclear",
    "Do not use generic illustrations when a specific one exists",
    "Do not omit the action when the user can recover",
    "Do not nest IllustratedMessage inside another IllustratedMessage"
  ],
  "layoutGuidance": {
    "placement": "Place IllustratedMessage inside a compatible container (DynamicPage, Panel, Dialog).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in DynamicPage",
    "Used in Panel",
    "Used in Dialog"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Dialog",
    "Table",
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/IllustratedMessage.json`
7. Confirm: "Updated IllustratedMessage.json — N fields populated"

────────────────────────────────────────────────────────────

## [57/139] Image

# Refresh SAP Fiori guideline: Image

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/image

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/image")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Image' || s.name.endsWith('.Image'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Image"
   - slug: "image"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/image"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Image",
  "slug": "image",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/image/",
  "purpose": "Displays a raster image (photo, product shot, avatar). Supports lazy loading and fallback content. Use for content imagery, not for iconography (use Icon component instead).",
  "whenToUse": [
    "Show a product photo, user avatar (photo), or content image",
    "Display a brand mark or logo in a fixed layout",
    "As part of a card or list item showing rich content",
    "For screenshots or diagrams inline with text"
  ],
  "whenNotToUse": [
    "For icons \u2014 use Icon (better a11y, resolution-independent)",
    "For decorative backgrounds \u2014 use CSS background-image at the frame level",
    "For inline emoji \u2014 use text with emoji chars",
    "For SVG-based art \u2014 use Vector or a proper icon library"
  ],
  "doRules": [
    "Always provide alt text for content images",
    "Use decorativeImage=true (or empty alt) for purely decorative images",
    "Constrain size explicitly (width + height) to prevent layout shift",
    "Provide fallback content when image fails to load"
  ],
  "dontRules": [
    "Do not use for icons \u2014 Icon is the correct control",
    "Do not omit alt text on content images (fails WCAG 1.1.1)",
    "Do not stretch images beyond native resolution",
    "Do not use images to convey text content that could be text"
  ],
  "layoutGuidance": {
    "placement": "Inside cards, list items, page content areas, avatars",
    "sizing": "Constrained by parent; explicit width and height required",
    "spacing": "Padding depends on parent (Card: 16px, List item: 8px)",
    "alignment": "Object-fit contain or cover based on use case"
  },
  "contentGuidance": {
    "labelLength": "Alt text 5-125 characters describing the image content",
    "contentRules": "Alt text describes the image's role in the page, not its visual",
    "examples": [
      "'Product: red ergonomic chair'",
      "'CEO Nadia Fischer'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Native or upscaled with quality settings",
    "L": "Same",
    "M": "May crop with object-fit: cover",
    "S": "May hide non-essential images or use smaller variants"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)",
      "WCAG 2.1 \u00b7 1.4.5 Images of Text (Level AA)"
    ],
    "requirements": [
      "Alt text required for content images",
      "Empty alt='' for purely decorative images",
      "Avoid text embedded in images (use real text instead)",
      "Provide long descriptions for complex images via aria-describedby"
    ]
  },
  "patterns": [
    "Card thumbnail",
    "List item avatar",
    "Page hero image",
    "Product cards"
  ],
  "compatibility": {
    "allowedWith": [
      "Card",
      "StandardListItem",
      "ObjectListItem",
      "Page",
      "Panel"
    ],
    "forbiddenWith": [
      "ShellBar (use logo prop)",
      "Dialog title bar"
    ]
  },
  "exceptions": [
    "Web pages that must be text-only should hide images completely, not use empty alt"
  ],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Image.json`
7. Confirm: "Updated Image.json — N fields populated"

────────────────────────────────────────────────────────────

## [58/139] InfoLabel

# Refresh SAP Fiori guideline: InfoLabel

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/info-label

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/info-label")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'InfoLabel' || s.name.endsWith('.InfoLabel'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "InfoLabel"
   - slug: "info-label"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/info-label"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "InfoLabel",
  "slug": "info-label",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/info-label/",
  "purpose": "A compact categorical label used to tag items by category, priority, or type. Non-semantic (no state colors) \u2014 purely for classification. Common in inbox lists, message centers, and search results.",
  "whenToUse": [
    "Categorize list items by type (e.g. 'Invoice', 'Purchase Order', 'RFP')",
    "Show priority levels without state colors ('P1', 'P2', 'P3')",
    "Tag items with tenant, department, or region",
    "Group similar items visually in a compact form"
  ],
  "whenNotToUse": [
    "For semantic state (error/warning/success) \u2014 use ObjectStatus",
    "For a KPI with a value \u2014 use GenericTag",
    "For a full state indicator \u2014 use Tag with color",
    "As a clickable filter \u2014 use Token or FilterItem"
  ],
  "doRules": [
    "Keep labels to 1-3 words",
    "Use consistent colors within a category set (all 'Invoice' labels same color)",
    "Place InfoLabel before the primary text in a list item",
    "Use the neutral palette by default; colored variant only when categories need distinction"
  ],
  "dontRules": [
    "Do not use InfoLabel for state or status \u2014 that's ObjectStatus's job",
    "Do not stack multiple InfoLabels on one item \u2014 combine or use fewer",
    "Do not put values inside InfoLabel \u2014 that's GenericTag",
    "Do not use as a link \u2014 InfoLabel is display-only"
  ],
  "layoutGuidance": {
    "placement": "Inline at the start of a list item or table cell",
    "sizing": "Hug content. Height 20px compact, 24px cozy",
    "spacing": "8px right margin from adjacent content",
    "alignment": "Vertically centered with adjacent text"
  },
  "contentGuidance": {
    "labelLength": "1-15 characters",
    "contentRules": "Noun or noun phrase; capitalized",
    "examples": [
      "Invoice",
      "PO",
      "Rejected",
      "Tenant A"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline",
    "L": "Inline",
    "M": "Inline",
    "S": "May wrap below primary text"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)",
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)"
    ],
    "requirements": [
      "Label text has 4.5:1 contrast against InfoLabel background",
      "Provides aria-label describing the category",
      "Color coding is decorative \u2014 semantic meaning always in text"
    ]
  },
  "patterns": [
    "Inbox list",
    "Message center",
    "Search results",
    "Message popover items"
  ],
  "compatibility": {
    "allowedWith": [
      "StandardListItem",
      "ObjectListItem",
      "MessagePopoverItem",
      "NotificationListItem"
    ],
    "forbiddenWith": [
      "Standalone (always paired with content)"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/InfoLabel.json`
7. Confirm: "Updated InfoLabel.json — N fields populated"

────────────────────────────────────────────────────────────

## [59/139] Input

# Refresh SAP Fiori guideline: Input

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-field

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-field")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Input' || s.name.endsWith('.Input'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Input"
   - slug: "input-field"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-field"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Input",
  "slug": "input-field",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/input-field/",
  "purpose": "A single-line text input field for user data entry. Supports semantic input types (Text, Email, Number, Password, URL, Tel) and value state feedback (Error, Warning, Success, Information).",
  "whenToUse": [
    "Capture single-line user input in forms and filters",
    "Allow free-text entry where options are not predefined",
    "Provide search input with placeholder text",
    "Use type=Email or Number for semantic mobile keyboard"
  ],
  "whenNotToUse": [
    "Use Select when 4\u201312 fixed options exist",
    "Use ComboBox when many options with type-ahead needed",
    "Use DatePicker for date input",
    "Use TextArea for multi-line input"
  ],
  "doRules": [
    "Pair every Input with a Label component",
    "Use placeholder text only as a hint \u2014 never as a replacement for label",
    "Use valueState=Error with valueStateText message when validation fails",
    "Use type=\"Email\" or \"Number\" for semantic input types \u2014 improves mobile keyboard",
    "Show clear icon when user has typed (showClearIcon=true)"
  ],
  "dontRules": [
    "Do not use placeholder as the field label",
    "Do not communicate error state by red border alone \u2014 include text message",
    "Do not use Input when MultiInput, Select, or DatePicker fits better",
    "Do not skip the visible Label"
  ],
  "layoutGuidance": {
    "placement": "Inside a Form, FilterBar, or Dialog body.",
    "sizing": "Default 256px wide; resizes to fill form column.",
    "spacing": "Vertical spacing between fields: 8px (Compact), 16px (Cozy).",
    "alignment": "Left-aligned with Label above or to the left."
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 50 chars. Value visible up to field width.",
    "contentRules": [
      "Use sentence case for placeholders",
      "Indicate required fields with * via Label.required=true",
      "Provide valueStateText for error/warning states"
    ],
    "examples": [
      "Filter Artifacts",
      "Search",
      "Enter name",
      "name@company.com"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width of form column",
    "L": "Full width of form column",
    "M": "Single column stacked layout",
    "S": "Full viewport width with Label above"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Border contrast \u2265 3:1 against background",
      "wcag": "1.4.11 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Every input MUST have visible or aria label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus indicator on focused state",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "status",
      "requirement": "Value state communicated by color AND icon AND text \u2014 not color alone",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "keyboard",
      "requirement": "Tab moves focus; Enter submits form"
    }
  ],
  "patterns": [
    "Form field",
    "Filter input",
    "Search",
    "Inline edit"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "SimpleForm",
      "Toolbar",
      "Dialog",
      "FilterBar"
    ],
    "incompatible": [
      "Without Label",
      "Inside Table cell at S viewport (use inline edit pattern)"
    ]
  },
  "exceptions": [
    "Search input inside Shell uses Shell Search variant with rounded corners",
    "Read-only inputs use editable=false and lose border"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Input.json`
7. Confirm: "Updated Input.json — N fields populated"

────────────────────────────────────────────────────────────

## [60/139] InputListItem

# Refresh SAP Fiori guideline: InputListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-list-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-list-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'InputListItem' || s.name.endsWith('.InputListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "InputListItem"
   - slug: "input-list-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/input-list-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "InputListItem",
  "slug": "input-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/input-list-item/",
  "purpose": "List row containing a Label + inline Input control. Used in settings screens, mobile form layouts, profile edit pages.",
  "whenToUse": [
    "Mobile-optimized form layouts",
    "Settings screens (label + value)",
    "Quick edit lists where each row contains one field"
  ],
  "whenNotToUse": [
    "Multi-field forms \u2014 use Form / SimpleForm",
    "Read-only display \u2014 use DisplayListItem"
  ],
  "doRules": [
    "Each row has exactly one Label + one Input",
    "Bind Label color to sapContent_LabelColor",
    "Validate inputs inline"
  ],
  "dontRules": [
    "Do not stack multiple Inputs in one row",
    "Do not omit the Label"
  ],
  "layoutGuidance": {
    "placement": "Place InputListItem inside a compatible container (List).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for list item.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List"
  ],
  "compatibility": [
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/InputListItem.json`
7. Confirm: "Updated InputListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [61/139] InputMessagePopover

# Refresh SAP Fiori guideline: InputMessagePopover

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'InputMessagePopover' || s.name.endsWith('.InputMessagePopover'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "InputMessagePopover"
   - slug: "message-popover"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "InputMessagePopover",
  "slug": "message-popover",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-popover/",
  "purpose": "A popover that shows the current validation state and messages for a specific Input field. Anchored to the field, shows only messages relevant to that input. Distinct from MessagePopover (all messages) and inline valueStateText (short single message).",
  "whenToUse": [
    "Input has multiple validation issues to communicate",
    "The issue needs a link/action to resolve (e.g. 'Import file' for an empty required field)",
    "Long-form error explanation that doesn't fit inline",
    "You want the user to see history of issues, not just the latest"
  ],
  "whenNotToUse": [
    "For a single short message \u2014 use inline valueStateText on the Input",
    "For form-level validation summary \u2014 use MessagePopover in the toolbar",
    "For persistent inline hints \u2014 use aria-describedby with helper text",
    "For a page-level notice \u2014 use MessageStrip"
  ],
  "doRules": [
    "Open automatically on invalid input, close on focus loss",
    "Order messages by severity: Error \u2192 Warning \u2192 Success \u2192 Information",
    "Provide an action button when the issue can be fixed via the popover",
    "Keep messages concise; use links for full details"
  ],
  "dontRules": [
    "Do not detach the popover from its anchored Input",
    "Do not stack modally over other popovers",
    "Do not use for non-Input controls \u2014 MessagePopover is the general-purpose version",
    "Do not include success messages if there are also errors"
  ],
  "layoutGuidance": {
    "placement": "Anchored to Input field, above or below based on space",
    "sizing": "Width 320\u2013400px; height max ~240px with scroll",
    "spacing": "8px between messages; divider between severities",
    "alignment": "Items left-aligned"
  },
  "contentGuidance": {
    "labelLength": "Message title \u2264 60 chars; description \u2264 160 chars",
    "contentRules": "Title states the problem; description suggests fix",
    "examples": [
      "Field 'Email' \u2014 invalid format \u00b7 Description: 'Use format name@domain.com'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Popover positioned near field",
    "L": "Same",
    "M": "Same",
    "S": "May become inline expanded area below Input"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 3.3.1 Error Identification (Level A)",
      "WCAG 2.1 \u00b7 3.3.3 Error Suggestion (Level AA)",
      "WCAG 2.1 \u00b7 4.1.3 Status Messages (Level AA)"
    ],
    "requirements": [
      "role='dialog' or 'alertdialog' depending on severity",
      "Errors announced via aria-live='assertive'; others 'polite'",
      "aria-describedby on the Input points to popover content",
      "Escape closes; focus returns to Input"
    ]
  },
  "patterns": [
    "Input field validation",
    "Form error explanation",
    "Field-scoped help"
  ],
  "compatibility": {
    "allowedWith": [
      "Input (anchor)",
      "MaskInput",
      "ComboBox",
      "MultiInput"
    ],
    "forbiddenWith": [
      "Standalone",
      "Table cells"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/InputMessagePopover.json`
7. Confirm: "Updated InputMessagePopover.json — N fields populated"

────────────────────────────────────────────────────────────

## [62/139] Label

# Refresh SAP Fiori guideline: Label

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/label

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/label")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Label' || s.name.endsWith('.Label'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Label"
   - slug: "label"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/label"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Label",
  "slug": "label",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/label/",
  "purpose": "A text label that identifies an input field or describes a value. Supports required indicator and display-only state.",
  "whenToUse": [
    "To label every form field (Input, Select, CheckBox, etc.)",
    "To identify a value in display mode",
    "To group related fields with a section title"
  ],
  "whenNotToUse": [
    "As body text \u2014 use Text or Title instead",
    "For headings \u2014 use Title with appropriate level",
    "Without an associated field"
  ],
  "doRules": [
    "Place Label above or to the left of the field",
    "Mark required fields with the * indicator",
    "Keep labels concise (1\u20133 words)",
    "Associate with the field via labelFor"
  ],
  "dontRules": [
    "Do not use Label as body text",
    "Do not skip Label and rely on placeholder",
    "Do not use punctuation at the end"
  ],
  "layoutGuidance": {
    "placement": "Above or left of the associated field.",
    "sizing": "Auto height.",
    "spacing": "4px gap to field (top) or 8px gap (left).",
    "alignment": "Left-aligned with field."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words.",
    "contentRules": [
      "Use sentence case",
      "No punctuation",
      "Indicate required with *"
    ],
    "examples": [
      "Vendor",
      "Mode",
      "Email Address"
    ]
  },
  "responsiveBehavior": {
    "XL": "Label left, field right (form layout)",
    "L": "Label left, field right",
    "M": "Label above field (stacked)",
    "S": "Label above field (stacked)"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Always associate with the field via labelFor",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "contrast",
      "requirement": "Label-to-background contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "status",
      "requirement": "Required indicator visible and announced"
    }
  ],
  "patterns": [
    "Form field label",
    "Display-only data identifier"
  ],
  "compatibility": {
    "worksWith": [
      "Input",
      "Select",
      "CheckBox",
      "RadioButton",
      "Switch",
      "DatePicker",
      "Form"
    ],
    "incompatible": [
      "Standalone with no field associated"
    ]
  },
  "exceptions": [
    "DisplayOnly mode for read-only labels (no required indicator)"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Label.json`
7. Confirm: "Updated Label.json — N fields populated"

────────────────────────────────────────────────────────────

## [63/139] Legend

# Refresh SAP Fiori guideline: Legend

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/legend

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/legend")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Legend' || s.name.endsWith('.Legend'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Legend"
   - slug: "legend"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/legend"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Legend",
  "slug": "chart-legend",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/analytical-list-page/",
  "purpose": "A key that maps colors, patterns, or icons to data categories in a chart or calendar. Provides the reader with the meaning of visual encodings. Common in analytical dashboards, calendar apps, and visualization-heavy screens.",
  "whenToUse": [
    "Alongside any chart with more than 2 series",
    "In calendar views with color-coded event types",
    "For heat maps and multi-series area/line charts",
    "When visual encoding is not self-explanatory"
  ],
  "whenNotToUse": [
    "For single-series charts \u2014 legend is redundant",
    "When the chart has direct labels on each series \u2014 legend duplicates that",
    "For a filter \u2014 use FilterBar or MultiComboBox",
    "For static help \u2014 use IllustratedMessage or Text"
  ],
  "doRules": [
    "Place the legend at the top or right of the chart",
    "Match the exact color/pattern used in the chart",
    "Use short, meaningful labels (\u2264 20 chars)",
    "Support interactive filtering \u2014 clicking a legend item toggles that series"
  ],
  "dontRules": [
    "Do not rely on color alone \u2014 pair with patterns or icons for accessibility",
    "Do not use for charts with 8+ series (becomes unreadable)",
    "Do not shrink swatches below 12\u00d712 \u2014 must be visible",
    "Do not detach legend from its chart"
  ],
  "layoutGuidance": {
    "placement": "Top or right of the chart it describes",
    "sizing": "Height hugs content; row height 24px",
    "spacing": "16px between items",
    "alignment": "Horizontal for top placement, vertical for right placement"
  },
  "contentGuidance": {
    "labelLength": "Each item \u2264 20 chars",
    "contentRules": "Swatch + label; optional value shown after the label",
    "examples": [
      "\u25a0 Sales  \u25a0 Costs  \u25a0 Profit",
      "\u25cf Meetings  \u25cf Deadlines  \u25cf Personal"
    ]
  },
  "responsiveBehavior": {
    "XL": "Horizontal row visible",
    "L": "Horizontal row",
    "M": "May wrap to 2 rows",
    "S": "Vertical stack below chart"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "Swatches use both color AND pattern/icon to distinguish series",
      "Legend labels have 4.5:1 contrast",
      "Interactive legend items have visible focus and aria-pressed state",
      "Screen reader announces 'legend' role for the wrapping container"
    ]
  },
  "patterns": [
    "Chart legend",
    "Calendar type key",
    "Heat map key"
  ],
  "compatibility": {
    "allowedWith": [
      "Card",
      "Panel",
      "AnalyticalListPage",
      "Calendar",
      "DynamicSideContent"
    ],
    "forbiddenWith": [
      "Standalone without a chart",
      "Inside Dialog title",
      "Table cells"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Legend.json`
7. Confirm: "Updated Legend.json — N fields populated"

────────────────────────────────────────────────────────────

## [64/139] Link

# Refresh SAP Fiori guideline: Link

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/link

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/link")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Link' || s.name.endsWith('.Link'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Link"
   - slug: "link"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/link"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Link",
  "slug": "link",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/link/",
  "purpose": "A navigational text element that takes the user to another page, view, or external URL. Distinct from Button (which triggers actions).",
  "whenToUse": [
    "For navigation between pages or to external URLs",
    "For breadcrumbs",
    "In tables to navigate to detail views",
    "For inline references within prose"
  ],
  "whenNotToUse": [
    "For actions \u2014 use Button",
    "As primary CTA",
    "When the destination is unclear"
  ],
  "doRules": [
    "Use Link for navigation between pages or external URLs",
    "Use descriptive text that makes sense out of context",
    "Mark external links with an icon or indicator",
    "Use Subtle variant in secondary contexts"
  ],
  "dontRules": [
    "Do not use Link for actions \u2014 use Button",
    "Do not use \"click here\" as link text",
    "Do not style arbitrary text blue to imitate Link \u2014 use the component"
  ],
  "layoutGuidance": {
    "placement": "Inline within text; in toolbars; in table cells.",
    "sizing": "Auto width.",
    "spacing": "Inherits surrounding text spacing.",
    "alignment": "Inherits text alignment."
  },
  "contentGuidance": {
    "labelLength": "1\u20138 words; descriptive.",
    "contentRules": [
      "Describe the destination",
      "Avoid \"click here\", \"more\"",
      "Use sentence case"
    ],
    "examples": [
      "View order details",
      "SAP documentation",
      "ranjan@sap.com"
    ]
  },
  "responsiveBehavior": {
    "XL": "Standard inline",
    "L": "Standard inline",
    "M": "Standard inline",
    "S": "May wrap to new line"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter activates link",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus ring",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Link text describes destination \u2014 avoid \"click here\"",
      "wcag": "2.4.4 (A)"
    },
    {
      "category": "announcements",
      "requirement": "External links announced as opening in new window"
    }
  ],
  "patterns": [
    "Breadcrumb",
    "Inline reference",
    "Table cell navigation",
    "External link"
  ],
  "compatibility": {
    "worksWith": [
      "Toolbar",
      "OverflowToolbar",
      "Form",
      "List",
      "Table"
    ],
    "incompatible": [
      "As primary CTA",
      "In tight icon-only toolbar"
    ]
  },
  "exceptions": [
    "Subtle variant for de-emphasized links",
    "Emphasized variant for key inline references"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Link.json`
7. Confirm: "Updated Link.json — N fields populated"

────────────────────────────────────────────────────────────

## [65/139] List

# Refresh SAP Fiori guideline: List

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'List' || s.name.endsWith('.List'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "List"
   - slug: "list"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "List",
  "slug": "list",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/list/",
  "purpose": "A vertical list of similar items, typically with title, description, and optional status or icon. Simpler than Table; no multi-column alignment.",
  "whenToUse": [
    "For 3\u201320 similar items with consistent structure",
    "For master lists in split-screen flows",
    "When items have title + 1\u20132 secondary attributes",
    "For notification or message lists"
  ],
  "whenNotToUse": [
    "For tabular data with multiple aligned columns \u2014 use Table",
    "For very few items (<3) \u2014 inline them",
    "For complex hierarchical data \u2014 use Tree"
  ],
  "doRules": [
    "Use List for ~3\u201320 items with consistent structure",
    "Show title + optional description per item",
    "Use MultiSelect mode for bulk actions",
    "Show item count or filter in toolbar"
  ],
  "dontRules": [
    "Do not use List for tabular data with multiple aligned columns \u2014 use Table",
    "Do not put unrelated content types in one list",
    "Do not skip item type when row is interactive"
  ],
  "layoutGuidance": {
    "placement": "In page content, master pane of split-screen.",
    "sizing": "Full width; item height varies by type (48\u201396px).",
    "spacing": "Separator border between items.",
    "alignment": "Left-aligned content."
  },
  "contentGuidance": {
    "labelLength": "Title 1\u20138 words; description 1 line preferred.",
    "contentRules": [
      "Use ObjectIdentifier or StandardListItem",
      "Group related items",
      "Sort meaningfully"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full list visible",
    "L": "Full list visible",
    "M": "Scrollable list",
    "S": "Full viewport width"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys navigate items; Enter activates",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "List has accessible name",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Item position announced (e.g. \"item 3 of 10\")"
    }
  ],
  "patterns": [
    "Master list",
    "Notification list",
    "Item picker"
  ],
  "compatibility": {
    "worksWith": [
      "StandardListItem",
      "ListItem",
      "OverflowToolbar"
    ],
    "incompatible": [
      "As primary navigation \u2014 use SideNavigation"
    ]
  },
  "exceptions": [
    "GrowingList for incremental loading; FixedList for finite known set"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/List.json`
7. Confirm: "Updated List.json — N fields populated"

────────────────────────────────────────────────────────────

## [66/139] ListItem

# Refresh SAP Fiori guideline: ListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ListItem' || s.name.endsWith('.ListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ListItem"
   - slug: "list"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/list"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ListItem",
  "slug": "list",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/list/",
  "purpose": "The base class for all List row types (StandardListItem, ObjectListItem, ColumnListItem, ActionListItem, etc.). Rarely used directly \u2014 most consumers pick a specific subclass. Provides shared behavior (selection, actions, type=Active/Detail/Navigation).",
  "whenToUse": [
    "As a base for custom list-item variants that need shared List behavior",
    "When you need highlight + press + selection semantics without a specific subclass",
    "For minimal placeholder rows during load",
    "For a generic clickable row where no other subclass fits"
  ],
  "whenNotToUse": [
    "For a standard text row \u2014 use StandardListItem",
    "For an object summary row \u2014 use ObjectListItem",
    "For a table row \u2014 use ColumnListItem (inside Table)",
    "For a menu action \u2014 use ActionListItem or MenuListItem"
  ],
  "doRules": [
    "Prefer a specific subclass when one fits \u2014 better semantics + prebuilt layout",
    "Set type=Active for clickable rows, Detail for view-detail, Navigation for drill-in",
    "Support selection modes if the parent List has selectionMode configured",
    "Use consistent height across list rows"
  ],
  "dontRules": [
    "Do not build custom variants on top of ListItem if a specific subclass exists",
    "Do not omit type \u2014 defaults to Inactive which is not clickable",
    "Do not use for non-list contexts (Menu, Table cells)",
    "Do not stack multiple actions inside without a clear primary"
  ],
  "layoutGuidance": {
    "placement": "Inside a List",
    "sizing": "Height 32/48px compact/cozy for standard; varies by subclass",
    "spacing": "8px horizontal padding",
    "alignment": "Left-aligned content; navigation chevron right"
  },
  "contentGuidance": {
    "labelLength": "Depends on subclass",
    "contentRules": "Content and layout provided by subclasses",
    "examples": [
      "Base row: text + navigation chevron"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full row",
    "L": "Full row",
    "M": "Full row",
    "S": "Full row; may drop secondary content"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 2.5.5 Target Size (AAA)"
    ],
    "requirements": [
      "role='listitem' (implicit)",
      "aria-selected when list has selection",
      "Focusable when type is Active / Detail / Navigation",
      "Minimum 32px compact / 44px cozy tap target"
    ]
  },
  "patterns": [
    "Custom list variants",
    "Base for ObjectListItem etc.",
    "Placeholder rows"
  ],
  "compatibility": {
    "allowedWith": [
      "List (parent only)"
    ],
    "forbiddenWith": [
      "Toolbar",
      "Table body",
      "Standalone"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ListItem.json`
7. Confirm: "Updated ListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [67/139] MaskedInput

# Refresh SAP Fiori guideline: MaskedInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/masked-input

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/masked-input")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MaskedInput' || s.name.endsWith('.MaskedInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MaskedInput"
   - slug: "masked-input"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/masked-input"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MaskedInput",
  "slug": "masked-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/masked-input/",
  "purpose": "Input that enforces a character mask (phone numbers, SSN, credit cards, postal codes). User can only enter characters matching the mask pattern.",
  "whenToUse": [
    "Phone numbers, SSN, credit card, postal code",
    "Any structured numeric input with fixed formatting",
    "When typo prevention via input format is needed"
  ],
  "whenNotToUse": [
    "Free-form text \u2014 use Input",
    "Numeric with range \u2014 use StepInput",
    "Currency \u2014 use Input with type=Number"
  ],
  "doRules": [
    "Provide a clear placeholder showing the mask format",
    "Use the correct mask character (9 for digit, A for letter, etc.)",
    "Validate completeness before submit"
  ],
  "dontRules": [
    "Do not use MaskedInput for variable-length data",
    "Do not omit the mask placeholder",
    "Do not localize without re-checking mask format"
  ],
  "layoutGuidance": {
    "placement": "Place MaskedInput inside a compatible container (Form, Dialog, Panel).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Form",
    "Used inside Dialog",
    "Used inside Panel"
  ],
  "compatibility": [
    "Form",
    "Dialog",
    "Panel"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MaskedInput.json`
7. Confirm: "Updated MaskedInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [68/139] Menu

# Refresh SAP Fiori guideline: Menu

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Menu' || s.name.endsWith('.Menu'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Menu"
   - slug: "menu"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Menu",
  "slug": "menu",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/menu/",
  "purpose": "A vertical list of clickable items shown in a Popover-like container. Used to group secondary actions, provide contextual choices, or expose overflow actions. Typically anchored to a MenuButton, IconButton, or context invocation.",
  "whenToUse": [
    "Group 3-10 related actions behind a single button",
    "Show contextual actions on right-click or long-press",
    "Overflow container for actions that don't fit in a toolbar",
    "Cascading submenus for hierarchical action sets"
  ],
  "whenNotToUse": [
    "For a single action \u2014 use Button directly",
    "For >10 items \u2014 use a Dialog with searchable list",
    "For navigation between pages \u2014 use SideNavigation or IconTabBar",
    "For form field options \u2014 use Select or ComboBox"
  ],
  "doRules": [
    "Order items by frequency of use (most common first)",
    "Group related items with separators",
    "Use icons for scannability when actions are visual",
    "Support keyboard navigation (Arrow keys, Enter, Escape)"
  ],
  "dontRules": [
    "Do not nest submenus more than 2 levels deep",
    "Do not put destructive actions at the top \u2014 put them at the bottom",
    "Do not omit icons in a mixed icon/no-icon menu \u2014 pick one style",
    "Do not use for exclusive choice \u2014 use RadioButtonGroup"
  ],
  "layoutGuidance": {
    "placement": "Anchored to trigger element (Button, IconButton, cell)",
    "sizing": "Width hugs content, min 160px; height max 400px with scroll",
    "spacing": "Item height 32px compact, 40px cozy; separator 8px",
    "alignment": "Text left-aligned, icons on the left, shortcuts right"
  },
  "contentGuidance": {
    "labelLength": "Item labels \u2264 30 characters; verb-first (e.g. 'Delete', 'Export as CSV')",
    "contentRules": "Actions as short imperative phrases; no punctuation",
    "examples": [
      "Edit \u00b7 Duplicate \u00b7 Export \u25b8 \u00b7 \u2500 \u00b7 Delete"
    ]
  },
  "responsiveBehavior": {
    "XL": "Anchored Popover",
    "L": "Anchored Popover",
    "M": "Anchored Popover",
    "S": "May become full-width action sheet at bottom of screen"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "role='menu' with role='menuitem' on items",
      "Focus moves into first item on open; returns to trigger on close",
      "Keyboard: Arrow keys move focus; Enter activates; Escape closes",
      "Destructive items announced with aria-label like 'Delete permanently'"
    ]
  },
  "patterns": [
    "MenuButton",
    "SplitButton overflow",
    "Context menu on right-click",
    "Toolbar overflow"
  ],
  "compatibility": {
    "allowedWith": [
      "MenuButton",
      "SplitButton",
      "IconButton",
      "Popover"
    ],
    "forbiddenWith": [
      "Standalone (always anchored)",
      "Inside Table cells directly"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Menu.json`
7. Confirm: "Updated Menu.json — N fields populated"

────────────────────────────────────────────────────────────

## [69/139] MenuButton

# Refresh SAP Fiori guideline: MenuButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menubutton

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menubutton")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MenuButton' || s.name.endsWith('.MenuButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MenuButton"
   - slug: "menubutton"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menubutton"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MenuButton",
  "slug": "menu-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/menu-button/",
  "purpose": "A button that opens a menu of related actions when clicked. Supports Regular mode (entire button opens menu) or Split mode (text fires default action, arrow opens menu).",
  "whenToUse": [
    "When 2+ related actions can be grouped under one trigger",
    "For \"Add\" with multiple type options (Add API, Add Flow, etc.)",
    "For \"Actions\" with bulk operations",
    "In Split mode when one action is more common than others"
  ],
  "whenNotToUse": [
    "When fewer than 2 menu items exist \u2014 use Button",
    "For navigation \u2014 use Link",
    "When actions are unrelated"
  ],
  "doRules": [
    "Use Split mode when default action is common (e.g. \"Save\" + \"Save and Close\")",
    "Use Regular mode for \"Add\", \"Actions\", \"More\" menus",
    "Show \u25be arrow to indicate menu",
    "Group related menu items together"
  ],
  "dontRules": [
    "Do not use MenuButton when fewer than 2 menu items exist",
    "Do not nest MenuButton inside MenuButton",
    "Do not use long menu items (keep under 30 chars)"
  ],
  "layoutGuidance": {
    "placement": "In toolbars, page actions.",
    "sizing": "Auto width; height 26px Compact / 36px Cozy.",
    "spacing": "8px gap to adjacent buttons.",
    "alignment": "Menu opens below or above based on viewport space."
  },
  "contentGuidance": {
    "labelLength": "1\u20132 words on the button; menu items max 30 chars.",
    "contentRules": [
      "Button text describes menu purpose",
      "Menu items are specific actions"
    ],
    "examples": [
      "Add \u25be",
      "Actions \u25be",
      "More \u25be"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full button + menu",
    "L": "Full button + menu",
    "M": "Full button + menu",
    "S": "May collapse to icon-only on tight viewports"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter/Space opens menu; arrow keys navigate items; Escape closes",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Button text describes the menu purpose; menu items have accessible names",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "focus",
      "requirement": "Focus stays on trigger when menu opens; moves to first item on arrow down",
      "wcag": "2.4.3 (A)"
    },
    {
      "category": "announcements",
      "requirement": "aria-haspopup and aria-expanded states announced"
    }
  ],
  "patterns": [
    "Bulk action menu",
    "Add menu",
    "Split action"
  ],
  "compatibility": {
    "worksWith": [
      "Toolbar",
      "OverflowToolbar",
      "Menu"
    ],
    "incompatible": [
      "Inside table cell",
      "Inside form field"
    ]
  },
  "exceptions": [
    "Use SplitButton component (not MenuButton) when default action and dropdown share the same icon"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MenuButton.json`
7. Confirm: "Updated MenuButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [70/139] MenuListItem

# Refresh SAP Fiori guideline: MenuListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MenuListItem' || s.name.endsWith('.MenuListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MenuListItem"
   - slug: "menu"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MenuListItem",
  "slug": "menu",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/menu/",
  "purpose": "A single item inside a Menu \u2014 a clickable action with optional icon, shortcut, and submenu chevron. Never used standalone; always inside a Menu.",
  "whenToUse": [
    "As an item in a Menu popover",
    "When the menu needs icons for scannability",
    "When keyboard shortcuts should be visible",
    "For hierarchical menus (with submenu chevron)"
  ],
  "whenNotToUse": [
    "As a standalone list row \u2014 use StandardListItem",
    "For form values \u2014 use Item (inside Select/ComboBox)",
    "For toolbar actions \u2014 use Button directly",
    "For navigation \u2014 use NavigationItem"
  ],
  "doRules": [
    "Use verb-first labels (Delete, Edit, Duplicate)",
    "Show shortcut on the right when the action has a keyboard binding",
    "Use a chevron \u25b8 to indicate a submenu",
    "Group destructive actions at the bottom with a separator above"
  ],
  "dontRules": [
    "Do not use MenuListItem outside a Menu",
    "Do not omit icons in a mixed icon/no-icon menu \u2014 pick one style",
    "Do not disable without a hint why (tooltip or grayed reason)",
    "Do not nest more than 2 submenu levels"
  ],
  "layoutGuidance": {
    "placement": "Inside a Menu popover",
    "sizing": "Height 32px compact, 40px cozy; width fills menu",
    "spacing": "Icon 24px left \u00b7 12px gap \u00b7 text \u00b7 shortcut right",
    "alignment": "Left-aligned text; right-aligned shortcut/chevron"
  },
  "contentGuidance": {
    "labelLength": "\u2264 30 characters, verb-first",
    "contentRules": "Imperative phrases, no punctuation",
    "examples": [
      "Edit  \u2318E",
      "Export \u25b8",
      "Delete permanently"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full label + icon + shortcut",
    "L": "Full label + icon + shortcut",
    "M": "Same",
    "S": "Shortcut may hide"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "role='menuitem'",
      "aria-disabled when non-actionable",
      "Keyboard: Arrow keys navigate; Enter activates",
      "Submenu items have aria-haspopup"
    ]
  },
  "patterns": [
    "Menu items",
    "Context menu items",
    "Overflow menu items"
  ],
  "compatibility": {
    "allowedWith": [
      "Menu (only)"
    ],
    "forbiddenWith": [
      "Any parent other than Menu"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MenuListItem.json`
7. Confirm: "Updated MenuListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [71/139] MessageBox

# Refresh SAP Fiori guideline: MessageBox

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-box

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-box")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MessageBox' || s.name.endsWith('.MessageBox'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MessageBox"
   - slug: "message-box"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-box"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MessageBox",
  "slug": "message-box",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-box/",
  "purpose": "Modal dialog for confirming actions, showing errors, asking yes/no questions. Has predefined types: Confirm, Error, Warning, Information, Success.",
  "whenToUse": [
    "Destructive action confirmation (Delete X?)",
    "Error notifications that need acknowledgment",
    "Critical decisions before commit"
  ],
  "whenNotToUse": [
    "Non-blocking feedback \u2014 use MessageStrip",
    "Toast-style ephemeral \u2014 use MessageToast",
    "Multi-step interaction \u2014 use Dialog"
  ],
  "doRules": [
    "Use predefined types (Confirm / Error / Warning / Information / Success)",
    "Include explicit buttons (Yes / No, Cancel / OK)",
    "Match button intent to action consequence"
  ],
  "dontRules": [
    "Do not use MessageBox for non-critical info \u2014 use MessageToast",
    "Do not omit confirm button on destructive actions",
    "Do not nest MessageBox"
  ],
  "layoutGuidance": {
    "placement": "Place MessageBox inside a compatible container (Triggered from any context).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Triggered from any context"
  ],
  "compatibility": [
    "Triggered from any context"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MessageBox.json`
7. Confirm: "Updated MessageBox.json — N fields populated"

────────────────────────────────────────────────────────────

## [72/139] MessagePopover

# Refresh SAP Fiori guideline: MessagePopover

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MessagePopover' || s.name.endsWith('.MessagePopover'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MessagePopover"
   - slug: "message-popover"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-popover"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MessagePopover",
  "slug": "message-popover",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-popover/",
  "purpose": "Anchored Popover that displays validation messages from a Form. Lists errors/warnings/info from across the form so users can navigate to each.",
  "whenToUse": [
    "Form validation summaries",
    "Aggregate error display from a multi-field form",
    "When users need to jump to each error from a single trigger"
  ],
  "whenNotToUse": [
    "Inline field validation \u2014 use MessageStrip below the field",
    "Critical errors \u2014 use MessageBox",
    "Tooltips \u2014 use Popover with text"
  ],
  "doRules": [
    "Anchor to a status button with error count",
    "Group messages by severity (Errors / Warnings / Info)",
    "Make each row navigable to the source field"
  ],
  "dontRules": [
    "Do not use MessagePopover for non-form contexts",
    "Do not omit the error count on the trigger button"
  ],
  "layoutGuidance": {
    "placement": "Place MessagePopover inside a compatible container (Form, Dialog).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Form",
    "Used inside Dialog"
  ],
  "compatibility": [
    "Form",
    "Dialog"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MessagePopover.json`
7. Confirm: "Updated MessagePopover.json — N fields populated"

────────────────────────────────────────────────────────────

## [73/139] MessageStrip

# Refresh SAP Fiori guideline: MessageStrip

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/messagestrip

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/messagestrip")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MessageStrip' || s.name.endsWith('.MessageStrip'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MessageStrip"
   - slug: "messagestrip"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/messagestrip"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MessageStrip",
  "slug": "message-strip",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-strip/",
  "purpose": "A horizontal message bar for inline feedback (Information, Positive, Warning, Error). Persistent message about page or section state.",
  "whenToUse": [
    "Page-level or section-level status message",
    "Validation summary in forms",
    "Action result (e.g. \"Saved successfully\")",
    "Persistent contextual information"
  ],
  "whenNotToUse": [
    "For transient toasts \u2014 use MessageToast",
    "For destructive confirmations \u2014 use Dialog",
    "As primary CTA container"
  ],
  "doRules": [
    "Use Information for neutral context",
    "Use Positive for success confirmations",
    "Use Warning for non-blocking issues",
    "Use Error for blocking issues",
    "Always show icon alongside text",
    "Include close button when message is dismissible"
  ],
  "dontRules": [
    "Do not use MessageStrip for transient toasts \u2014 use MessageToast",
    "Do not use as primary CTA container",
    "Do not stack multiple MessageStrips of same type",
    "Do not omit icon \u2014 status by color alone violates WCAG"
  ],
  "layoutGuidance": {
    "placement": "Top of Page content, Dialog body, Form section.",
    "sizing": "Full width of parent.",
    "spacing": "16px below; before main content.",
    "alignment": "Icon left, text middle, close right."
  },
  "contentGuidance": {
    "labelLength": "Message 1\u20132 sentences.",
    "contentRules": [
      "Concise, action-oriented text",
      "Include link to detailed help when needed"
    ],
    "examples": [
      "Settings saved successfully.",
      "Could not save \u2014 check your connection."
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width",
    "L": "Full width",
    "M": "Full width; text wraps",
    "S": "Full width; close may collapse"
  },
  "accessibilityGuidance": [
    {
      "category": "status",
      "requirement": "Type communicated by icon AND text \u2014 not color alone",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Message announced via aria-live=\"polite\"",
      "wcag": "4.1.3 (AA)"
    },
    {
      "category": "keyboard",
      "requirement": "Close button activatable via Enter/Space",
      "wcag": "2.1.1 (A)"
    }
  ],
  "patterns": [
    "Inline feedback",
    "Validation summary",
    "Status banner"
  ],
  "compatibility": {
    "worksWith": [
      "Page",
      "DynamicPage",
      "Dialog",
      "Form"
    ],
    "incompatible": [
      "Inside Table cell",
      "As toolbar item"
    ]
  },
  "exceptions": [
    "showCloseButton=true allows user dismissal"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MessageStrip.json`
7. Confirm: "Updated MessageStrip.json — N fields populated"

────────────────────────────────────────────────────────────

## [74/139] MessageToast

# Refresh SAP Fiori guideline: MessageToast

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-toast

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-toast")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MessageToast' || s.name.endsWith('.MessageToast'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MessageToast"
   - slug: "message-toast"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/message-toast"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MessageToast",
  "slug": "message-toast",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/message-toast/",
  "purpose": "Transient bottom-of-screen toast notification. Auto-dismisses after a few seconds. Non-blocking.",
  "whenToUse": [
    "Successful save confirmation",
    "Background action completed",
    "Non-critical info that does not block workflow"
  ],
  "whenNotToUse": [
    "Critical errors \u2014 use MessageBox",
    "Validation feedback \u2014 use MessageStrip",
    "Permanent status \u2014 use ObjectStatus"
  ],
  "doRules": [
    "Use short messages (5-10 words)",
    "Position bottom-center by default",
    "Set duration 3-5 seconds",
    "Make dismissible by tap"
  ],
  "dontRules": [
    "Do not use MessageToast for critical info",
    "Do not stack multiple MessageToasts simultaneously",
    "Do not include actions (use MessageStrip)"
  ],
  "layoutGuidance": {
    "placement": "Place MessageToast inside a compatible container (Anywhere \u2014 appears as overlay).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Anywhere \u2014 appears as overlay"
  ],
  "compatibility": [
    "Anywhere \u2014 appears as overlay"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MessageToast.json`
7. Confirm: "Updated MessageToast.json — N fields populated"

────────────────────────────────────────────────────────────

## [75/139] MultiComboBox

# Refresh SAP Fiori guideline: MultiComboBox

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multicombobox

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multicombobox")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MultiComboBox' || s.name.endsWith('.MultiComboBox'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MultiComboBox"
   - slug: "multicombobox"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multicombobox"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MultiComboBox",
  "slug": "multi-combobox",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/multi-combobox/",
  "purpose": "A multi-select dropdown with type-ahead filter. User can select multiple items from a list; selected items appear as tokens above the input. Suited for 10+ options where search helps.",
  "whenToUse": [
    "Multiple selections from a fixed list of 10+ options",
    "When type-ahead search aids selection",
    "For filter dimensions in FilterBar",
    "When users may add/remove items frequently"
  ],
  "whenNotToUse": [
    "For single selection \u2014 use ComboBox",
    "For <10 options \u2014 use CheckBox group",
    "For free-text multi-value \u2014 use MultiInput"
  ],
  "doRules": [
    "Sort options logically (alphabetical, frequency, category)",
    "Show selected items as removable tokens",
    "Provide Select All when applicable",
    "Indicate when no matches via empty state"
  ],
  "dontRules": [
    "Do not omit Label",
    "Do not allow duplicates if uniqueness matters",
    "Do not display fewer than 4 options in the dropdown"
  ],
  "layoutGuidance": {
    "placement": "Form, FilterBar, Dialog body.",
    "sizing": "256px default; grows with tokens.",
    "spacing": "8px vertical between filter fields.",
    "alignment": "Tokens wrap above input."
  },
  "contentGuidance": {
    "labelLength": "Token text 1\u20133 words.",
    "contentRules": [
      "Token contains item label",
      "Long items truncate with ellipsis"
    ],
    "examples": [
      "Cloud Integration",
      "API",
      "Integration Flow"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full multi-line tokens visible",
    "L": "Full multi-line tokens visible",
    "M": "Tokens may compress to overflow indicator",
    "S": "Tokens stacked vertically"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Type-ahead filters; arrows traverse suggestions; Enter selects; Backspace removes last token",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Number of selected items announced when count changes",
      "wcag": "4.1.3 (AA)"
    }
  ],
  "patterns": [
    "FilterBar field",
    "Multi-select form field"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "FilterBar",
      "Toolbar",
      "Tokenizer"
    ],
    "incompatible": [
      "Without Label",
      "Table cell at S viewport"
    ]
  },
  "exceptions": [
    "Use showSelectAll for select-all action; some implementations omit"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MultiComboBox.json`
7. Confirm: "Updated MultiComboBox.json — N fields populated"

────────────────────────────────────────────────────────────

## [76/139] MultiInput

# Refresh SAP Fiori guideline: MultiInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multiinput

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multiinput")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'MultiInput' || s.name.endsWith('.MultiInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "MultiInput"
   - slug: "multiinput"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/multiinput"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "MultiInput",
  "slug": "multi-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/multi-input/",
  "purpose": "A free-text input that creates tokens. User types and presses Enter (or comma) to create a removable token. Used for tags, email lists, comma-separated free entry.",
  "whenToUse": [
    "Free-text multi-value entry (tags, emails)",
    "When values are not from a predefined list",
    "For input where order matters and items are user-defined"
  ],
  "whenNotToUse": [
    "When values come from a fixed list \u2014 use MultiComboBox",
    "For single-value entry \u2014 use Input",
    "For paragraph text \u2014 use TextArea"
  ],
  "doRules": [
    "Show clear hint that Enter or comma creates a token",
    "Allow inline editing of tokens",
    "Validate each token format if applicable (email, number, etc.)"
  ],
  "dontRules": [
    "Do not allow duplicates if uniqueness matters",
    "Do not lose typed text on focus loss without warning"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog, Toolbar.",
    "sizing": "256px default; grows with tokens.",
    "spacing": "8px vertical between fields.",
    "alignment": "Tokens flow inline; wrap to next row."
  },
  "contentGuidance": {
    "labelLength": "Token text varies.",
    "contentRules": [
      "Token shows token value",
      "Long tokens truncate"
    ],
    "examples": [
      "john@sap.com",
      "alpha",
      "beta"
    ]
  },
  "responsiveBehavior": {
    "XL": "Tokens inline; flexible width",
    "L": "Tokens inline",
    "M": "Tokens inline; wrap as needed",
    "S": "Tokens stacked"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter creates token; Backspace removes last; arrow keys navigate tokens",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Token created/removed announced"
    }
  ],
  "patterns": [
    "Tag input",
    "Recipient list",
    "Free-tag entry"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "Tokenizer",
      "Token"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "enableMultiLineMode=true allows tokens to wrap multiple lines"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/MultiInput.json`
7. Confirm: "Updated MultiInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [77/139] NavigationItem

# Refresh SAP Fiori guideline: NavigationItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/navigationitem

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/navigationitem")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'NavigationItem' || s.name.endsWith('.NavigationItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "NavigationItem"
   - slug: "navigationitem"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/navigationitem"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "NavigationItem",
  "slug": "navigation-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/side-navigation/",
  "purpose": "An individual entry in the SideNavigation. Can be a top-level Navigation Item or a nested Child Item. Supports selected and expanded states.",
  "whenToUse": [
    "As a child of SideNavigation only",
    "For destinations that lead to a page or view",
    "For grouping headers when used with hasChildren=true"
  ],
  "whenNotToUse": [
    "Outside SideNavigation",
    "For actions (use Button instead)",
    "Standalone in toolbars"
  ],
  "doRules": [
    "Use Semibold Duplex for top-level items, Regular for sub-items",
    "Indicate current page with Selected variant \u2014 3px left bar + tinted bg",
    "Indent child items 24px under parent",
    "Show expand arrow when item has children"
  ],
  "dontRules": [
    "Do not change text color via direct override \u2014 use Selected variant",
    "Do not add custom corner radius \u2014 use sapButton_BorderCornerRadius (8px)",
    "Do not skip selected indicator"
  ],
  "layoutGuidance": {
    "placement": "Inside SideNavigation Content Container.",
    "sizing": "Height 32px; full sidebar width.",
    "spacing": "4px between items.",
    "alignment": "Icon left, label center, expand arrow right."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words preferred; truncate with ellipsis if longer.",
    "contentRules": [
      "Use nouns for destinations",
      "Consistent capitalization"
    ],
    "examples": [
      "Home",
      "Integrations and APIs",
      "Custom Type Systems"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full label + icon + arrow visible",
    "L": "Full label + icon + arrow visible",
    "M": "Icon-only when sidebar collapsed",
    "S": "Hidden by default; full layout in expanded menu"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Selected state contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "focus",
      "requirement": "Visible 2px focus ring",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Every nav item must have text or aria-label",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "status",
      "requirement": "Selected state communicated via background + left bar (not color alone)",
      "wcag": "1.4.1 (A)"
    }
  ],
  "patterns": [
    "Navigation entry",
    "Hierarchical item"
  ],
  "compatibility": {
    "worksWith": [
      "SideNavigation"
    ],
    "incompatible": [
      "Standalone",
      "Toolbar"
    ]
  },
  "exceptions": [
    "Child Item type for nested items",
    "Two Click-Area variant when item has both navigation and expand"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/NavigationItem.json`
7. Confirm: "Updated NavigationItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [78/139] NoNotifications

# Refresh SAP Fiori guideline: NoNotifications

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'NoNotifications' || s.name.endsWith('.NoNotifications'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "NoNotifications"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "NoNotifications",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "Empty-state illustration used inside the Notifications popover or notification inbox when the user has no notifications. Signals 'you're all caught up \u2014 nothing new here'.",
  "whenToUse": [
    "Notifications popover from ShellBar when list is empty",
    "Notification inbox page with no items",
    "Filtered notification view with no matches",
    "Fresh user account before any notifications arrive"
  ],
  "whenNotToUse": [
    "For unread-count zero but items exist \u2014 that's not empty",
    "For a load failure \u2014 use error state",
    "As decoration outside notification contexts",
    "For general empty list without notification semantics"
  ],
  "doRules": [
    "Use a friendly, positive message ('All caught up!', 'No new notifications')",
    "Optional secondary description ('Check back later')",
    "Use appropriate size for the popover or page",
    "Keep tone light \u2014 this is a positive empty state"
  ],
  "dontRules": [
    "Do not use apologetic or negative language",
    "Do not add a CTA if there's no meaningful action",
    "Do not use for error states",
    "Do not shrink below Spot size"
  ],
  "layoutGuidance": {
    "placement": "Inside IllustratedMessage in the empty notification region",
    "sizing": "Spot 48\u00d748 in popover \u00b7 Dialog 120\u00d7120 on page",
    "spacing": "16px between illustration and text",
    "alignment": "Centered vertically and horizontally"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 40 chars; description \u2264 80 chars",
    "contentRules": "Title is positive; description is optional and brief",
    "examples": [
      "Title: 'All caught up!' \u00b7 Description: 'You have no new notifications'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Dialog or Spot depending on container",
    "L": "Same",
    "M": "Same",
    "S": "Spot size"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "role='img' with aria-label='No notifications'",
      "Title as semantic heading",
      "role='status' on the containing region",
      "Screen reader announces the empty state"
    ]
  },
  "patterns": [
    "Empty notifications popover",
    "Empty notification inbox",
    "Positive empty state"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any other parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/NoNotifications.json`
7. Confirm: "Updated NoNotifications.json — N fields populated"

────────────────────────────────────────────────────────────

## [79/139] NotificationBanner

# Refresh SAP Fiori guideline: NotificationBanner

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'NotificationBanner' || s.name.endsWith('.NotificationBanner'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "NotificationBanner"
   - slug: "notification"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "NotificationBanner",
  "slug": "notification-banner",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/notification-banner/",
  "purpose": "A full-width horizontal banner shown at the top of a page or app to announce system-wide events, maintenance, or important alerts. Persistent until dismissed. Distinct from inline MessageStrip (page-scoped) and toast (transient).",
  "whenToUse": [
    "System-wide maintenance announcements (planned downtime, updates)",
    "Global business events (new feature, policy change)",
    "Critical alerts affecting all users (security notice)",
    "Migration or deprecation notices requiring user acknowledgment"
  ],
  "whenNotToUse": [
    "Page-scoped notice \u2014 use MessageStrip",
    "Transient success feedback \u2014 use MessageToast",
    "In-flow errors \u2014 use inline field validation",
    "Marketing content \u2014 banners are for operational messages"
  ],
  "doRules": [
    "Use the correct semantic type (Information / Success / Warning / Error)",
    "Include a dismiss action (X) unless the message must remain",
    "Keep title short (< 80 chars) and description actionable",
    "Provide a link/button to more details or the action to take"
  ],
  "dontRules": [
    "Do not use color alone to signal type \u2014 always include an icon",
    "Do not stack multiple NotificationBanners \u2014 collapse into a Notifications popover",
    "Do not use for user-generated content or per-user alerts",
    "Do not persist past the event window (auto-dismiss when resolved)"
  ],
  "layoutGuidance": {
    "placement": "Directly below ShellBar, spans full app width",
    "sizing": "Height 48px compact, 56px cozy; width 100% of viewport",
    "spacing": "16px internal padding",
    "alignment": "Icon left, text middle, actions right"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 80 chars; description \u2264 200 chars",
    "contentRules": "Title is the event summary; description is context or action",
    "examples": [
      "Planned maintenance: system offline Sunday 2:00\u20134:00 UTC",
      "New privacy policy takes effect Jan 1 \u2014 review it"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + title + description + action",
    "L": "Same",
    "M": "Description may truncate",
    "S": "Icon + short title only; expand to see full text"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)",
      "WCAG 2.1 \u00b7 4.1.3 Status Messages (Level AA)"
    ],
    "requirements": [
      "role='alert' (Error) or role='status' (Information/Success)",
      "Icon + text always paired (never color-alone)",
      "Dismiss button has aria-label='Dismiss'",
      "Focus is not stolen when banner appears (unless Error)"
    ]
  },
  "patterns": [
    "System-wide announcement",
    "Maintenance notice",
    "Policy change alert"
  ],
  "compatibility": {
    "allowedWith": [
      "Below ShellBar only"
    ],
    "forbiddenWith": [
      "Inside Dialog",
      "Inside Card",
      "Inside Panel",
      "In Toolbar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/NotificationBanner.json`
7. Confirm: "Updated NotificationBanner.json — N fields populated"

────────────────────────────────────────────────────────────

## [80/139] NotificationListItem

# Refresh SAP Fiori guideline: NotificationListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'NotificationListItem' || s.name.endsWith('.NotificationListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "NotificationListItem"
   - slug: "notification"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "NotificationListItem",
  "slug": "notification-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/notification-list-item/",
  "purpose": "A single notification entry shown in a Notifications popover or inbox. Contains title, description, timestamp, priority, author, and optional actions. Read/unread state visible.",
  "whenToUse": [
    "Inside a Notifications popover from ShellBar",
    "In a notification inbox page",
    "As a message center entry for user alerts",
    "For workflow tasks awaiting user action"
  ],
  "whenNotToUse": [
    "For inline alerts on a page \u2014 use MessageStrip",
    "For toast messages \u2014 use MessageToast",
    "For a system-wide banner \u2014 use NotificationBanner",
    "For a list of business objects \u2014 use StandardListItem or ObjectListItem"
  ],
  "doRules": [
    "Show unread indicator (dot or bold) prominently on left",
    "Include relative timestamp ('2 hours ago') for freshness",
    "Provide primary action button (Approve / View / Reply)",
    "Group by priority or category if list is long"
  ],
  "dontRules": [
    "Do not use color alone for priority \u2014 pair with icon or label",
    "Do not truncate the title without an ellipsis affordance",
    "Do not stack too many actions per item \u2014 max 3, others in overflow menu",
    "Do not hide the source/author \u2014 always visible in dense mode"
  ],
  "layoutGuidance": {
    "placement": "Inside Notifications popover, notification inbox page",
    "sizing": "Height ~80px compact / 96px cozy",
    "spacing": "Divider between items; 16px internal padding",
    "alignment": "Unread indicator left \u00b7 title+description middle \u00b7 time+actions right"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 80 chars; description \u2264 200 chars; author \u2264 40 chars",
    "contentRules": "Title is the event; description is context; time is relative",
    "examples": [
      "Purchase Order PO-48865 approved \u00b7 by Nadia \u00b7 2h ago"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full layout with all metadata",
    "L": "Full layout",
    "M": "Actions may collapse to icons",
    "S": "Description truncates; single primary action"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)",
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)"
    ],
    "requirements": [
      "Unread state via icon or text, not color alone",
      "Priority label paired with icon (arrows/exclamations)",
      "aria-label combines title + author + time for full context",
      "Keyboard: Enter/Space activates default action"
    ]
  },
  "patterns": [
    "Notifications popover (from ShellBar)",
    "Notification inbox",
    "Message center"
  ],
  "compatibility": {
    "allowedWith": [
      "Notifications",
      "List",
      "Panel"
    ],
    "forbiddenWith": [
      "Table cells",
      "Toolbar",
      "Standalone"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/NotificationListItem.json`
7. Confirm: "Updated NotificationListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [81/139] Notifications

# Refresh SAP Fiori guideline: Notifications

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Notifications' || s.name.endsWith('.Notifications'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Notifications"
   - slug: "notification"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/notification"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Notifications",
  "slug": "notifications",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/notifications-shellbar/",
  "purpose": "A popover accessible from the ShellBar that shows a list of user notifications. Contains NotificationListItems grouped by priority or time. Central hub for user alerts, tasks, and updates.",
  "whenToUse": [
    "As the notifications popover triggered from ShellBar",
    "To centralize all user-scoped alerts in one predictable place",
    "For task-focused alerts (Approve, Review, Respond)",
    "When you need read/unread state per notification"
  ],
  "whenNotToUse": [
    "For system-wide alerts \u2014 use NotificationBanner",
    "For toast-style transient feedback \u2014 use MessageToast",
    "For a per-page validation message \u2014 use MessageStrip",
    "For a full inbox \u2014 use a dedicated page with List, not the popover"
  ],
  "doRules": [
    "Group notifications by priority (High \u2192 Medium \u2192 Low) or by time",
    "Show the unread count as a badge on the ShellBar trigger",
    "Provide 'Mark all as read' and 'Clear all' actions in the header",
    "Support both quick actions per item and clicking through to the source"
  ],
  "dontRules": [
    "Do not use for arbitrary sidebar content \u2014 Popover is more flexible",
    "Do not exceed 20 items visible \u2014 paginate or link to full inbox",
    "Do not hide the read/unread distinction",
    "Do not remove notifications from the list on click \u2014 mark as read only"
  ],
  "layoutGuidance": {
    "placement": "Anchored to the notifications icon in ShellBar",
    "sizing": "Width 400\u2013480px, height max 600px with scroll",
    "spacing": "Divider between groups; 8px between items",
    "alignment": "Header (title + actions) top; items scroll below"
  },
  "contentGuidance": {
    "labelLength": "Popover title 'Notifications' + count badge",
    "contentRules": "Header actions: Mark all read, Clear all, Filter",
    "examples": [
      "Notifications (5)",
      "High priority (2), Medium (3)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Standard popover",
    "L": "Standard popover",
    "M": "Standard popover, may narrow",
    "S": "May become full-screen slide-in from right"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)"
    ],
    "requirements": [
      "Popover has role='dialog' with aria-label='Notifications'",
      "Trigger button announces unread count ('5 unread notifications')",
      "Each NotificationListItem is focusable and keyboard-actionable",
      "Escape closes the popover; focus returns to trigger"
    ]
  },
  "patterns": [
    "ShellBar notifications",
    "User task inbox summary"
  ],
  "compatibility": {
    "allowedWith": [
      "ShellBar (as anchor)",
      "NotificationListItem (as items)"
    ],
    "forbiddenWith": [
      "Inside a page (use dedicated notification inbox page instead)"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Notifications.json`
7. Confirm: "Updated Notifications.json — N fields populated"

────────────────────────────────────────────────────────────

## [82/139] ObjectAttribute

# Refresh SAP Fiori guideline: ObjectAttribute

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-attribute

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-attribute")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectAttribute' || s.name.endsWith('.ObjectAttribute'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectAttribute"
   - slug: "object-attribute"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-attribute"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectAttribute",
  "slug": "object-attribute",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-attribute/",
  "purpose": "Key-value pair for object metadata. The title is the label (e.g. 'Vendor:'), the text is the value (e.g. 'SAP'). Used in DynamicPageHeader and ObjectPageLayout headers to show object descriptors.",
  "whenToUse": [
    "Object header metadata pairs (Vendor: SAP, Version: 1.0.0, Status: Active)",
    "Inside ColumnListItem to show row metadata",
    "Inside cards as labeled facts",
    "When the relationship between a label and a value matters and a Form is overkill"
  ],
  "whenNotToUse": [
    "For form input fields \u2014 use Label + Input",
    "For status that needs color semantic \u2014 use ObjectStatus",
    "For numbers that need emphasis \u2014 use ObjectNumber",
    "For freeform text \u2014 use Text"
  ],
  "doRules": [
    "Always include the title (label) \u2014 it gives the value context",
    "Bind title color to sapContent_LabelColor, value color to sapList_TextColor",
    "Use ObjectAttribute in headerContent.meta of DynamicPageTitle",
    "Set active=true only when the value is interactive (drills to detail)"
  ],
  "dontRules": [
    "Do not omit the title \u2014 the label is the whole point",
    "Do not chain more than 4 ObjectAttributes horizontally \u2014 readability degrades",
    "Do not use ObjectAttribute for free-form text",
    "Do not nest ObjectAttribute inside another ObjectAttribute"
  ],
  "layoutGuidance": {
    "placement": "Horizontal flow inside DynamicPageHeader metadata band, ObjectPageLayout header, or card body.",
    "sizing": "Auto-width; auto height single line.",
    "spacing": "24px gap between ObjectAttribute pairs; 4px gap between title and value within a pair.",
    "alignment": "Left-aligned within container."
  },
  "contentGuidance": {
    "labelLength": "Title (label) 1-2 words with trailing colon; text (value) 1-4 words.",
    "contentRules": [
      "Title in sentence case + colon: 'Vendor:', 'Mode:', 'Status:'",
      "Text in sentence case: 'SAP', 'Editable', 'Active'",
      "Localize both title and text",
      "For numeric values with unit, use ObjectNumber instead"
    ],
    "examples": [
      "Vendor: SAP",
      "Mode: Editable",
      "Version: 1.0.0",
      "Status: Active"
    ]
  },
  "responsiveBehavior": {
    "XL": "All ObjectAttributes inline.",
    "L": "All ObjectAttributes inline.",
    "M": "May wrap to multiple rows; preserve title-value pairing.",
    "S": "Stack vertically; each pair occupies a full row."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Title acts as label; value acts as value. Pair as <dl><dt>title</dt><dd>value</dd></dl> semantically.",
    "contrast": "Label and value both \u2265 4.5:1 (WCAG AA).",
    "keyboard": "Active ObjectAttribute (active=true) is tabbable; otherwise non-interactive.",
    "screenReader": "Announced as 'title, value' pair."
  },
  "patterns": [
    "DynamicPageHeader metadata band",
    "ObjectPageLayout header subtitle area",
    "Card body \u2014 labeled facts",
    "List row metadata"
  ],
  "compatibility": [
    "DynamicPageHeader",
    "DynamicPageTitle",
    "ObjectPageLayout",
    "Panel",
    "ColumnListItem",
    "List"
  ],
  "exceptions": [
    "Inside DynamicPageHeader.props.headerContent.meta the plugin auto-generates ObjectAttribute-style pairs from { key, value } tuples \u2014 no need to emit ObjectAttribute explicitly in that slot."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectAttribute.json`
7. Confirm: "Updated ObjectAttribute.json — N fields populated"

────────────────────────────────────────────────────────────

## [83/139] ObjectHeader

# Refresh SAP Fiori guideline: ObjectHeader

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-header

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-header")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectHeader' || s.name.endsWith('.ObjectHeader'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectHeader"
   - slug: "object-header"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-header"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectHeader",
  "slug": "object-header",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-header/",
  "purpose": "The header region of an Object Page that identifies and summarizes the object. Contains the title, subtitle, key attributes, statuses, and primary actions. Sits at the top of Object Page layouts.",
  "whenToUse": [
    "As the header of an Object Page (via ObjectPageDynamicHeaderTitle)",
    "In a Fullscreen Dialog that shows a single object",
    "As the header of a Card that summarizes an object",
    "Anywhere the user needs to see 'what am I looking at?' at a glance"
  ],
  "whenNotToUse": [
    "For a list header \u2014 use DynamicPageTitle with count instead",
    "For a small object preview \u2014 use ObjectListItem in a list",
    "For a modal action confirmation \u2014 use Dialog title alone",
    "Standalone as a page \u2014 Object Header is a region, not a page"
  ],
  "doRules": [
    "Show 1-3 key attributes maximum in the visible header",
    "Include an image or Avatar for identity when available",
    "Pair status text with icon (no state-by-color-alone)",
    "Include primary actions in the actions slot"
  ],
  "dontRules": [
    "Do not exceed 5 status indicators \u2014 becomes noisy",
    "Do not put long descriptions in the header \u2014 use the content area",
    "Do not hide the object title \u2014 always visible in snapped state",
    "Do not use in place of DynamicPageTitle for list views"
  ],
  "layoutGuidance": {
    "placement": "Top of Object Page, above sections",
    "sizing": "Height ~180px expanded, ~50px snapped",
    "spacing": "16px between attributes; 24px between attribute groups",
    "alignment": "Title left-aligned; actions right-aligned; attributes in horizontal wrap"
  },
  "contentGuidance": {
    "labelLength": "Title up to 100 chars; subtitle up to 200 chars; attributes \u2264 40 chars each",
    "contentRules": "Title is a name or ID; subtitle is descriptive; attributes are key-value or numeric",
    "examples": [
      "Purchase Order PO-48865 \u00b7 Supplier ABC Corp \u00b7 Status: Pending"
    ]
  },
  "responsiveBehavior": {
    "XL": "All attributes visible horizontally",
    "L": "Attributes may wrap to 2 rows",
    "M": "Attributes stack to a single column",
    "S": "Snapped state by default; expand on tap"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "Title as H1 (or semantic heading role)",
      "Actions have accessible names (aria-label if icon-only)",
      "Status indicators have icon + text (not color-only)",
      "Focus order: title \u2192 attributes \u2192 actions"
    ]
  },
  "patterns": [
    "Object Page",
    "Fullscreen Dialog for objects",
    "Card summary header"
  ],
  "compatibility": {
    "allowedWith": [
      "ObjectPageLayout",
      "DynamicPage",
      "Dialog",
      "Card"
    ],
    "forbiddenWith": [
      "List (as list item)",
      "Table cells",
      "Toolbar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectHeader.json`
7. Confirm: "Updated ObjectHeader.json — N fields populated"

────────────────────────────────────────────────────────────

## [84/139] ObjectIdentifier

# Refresh SAP Fiori guideline: ObjectIdentifier

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectidentifier

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectidentifier")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectIdentifier' || s.name.endsWith('.ObjectIdentifier'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectIdentifier"
   - slug: "objectidentifier"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectidentifier"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectIdentifier",
  "slug": "object-identifier",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-identifier/",
  "purpose": "The primary identifier of an object \u2014 title plus optional secondary text. Used as the lead cell in tables/lists and headlines in ObjectHeader.",
  "whenToUse": [
    "First/primary column in tables",
    "Headline of master list items",
    "Title in ObjectHeader",
    "When the object title needs an associated description"
  ],
  "whenNotToUse": [
    "As page title \u2014 use DynamicPageTitle",
    "For body text \u2014 use Text",
    "When title alone suffices \u2014 use Title or Text"
  ],
  "doRules": [
    "Use as the first/primary cell content in tables and lists",
    "Use titleActive=true when title is clickable to drill down",
    "Keep title short; use text for the description",
    "Pair with ObjectStatus for status columns"
  ],
  "dontRules": [
    "Do not use as standalone \u2014 always inside a row/item context",
    "Do not duplicate title and text content",
    "Do not omit the secondary text when context aids clarity"
  ],
  "layoutGuidance": {
    "placement": "Table cell, List item, ObjectHeader.",
    "sizing": "Fits row height.",
    "spacing": "2\u20134px vertical between title and text.",
    "alignment": "Title above text; both left-aligned."
  },
  "contentGuidance": {
    "labelLength": "Title 1\u20135 words; text 1 line.",
    "contentRules": [
      "Title is primary identifier (name, ID)",
      "Text is supplementary (description, ID number)"
    ],
    "examples": [
      "Order #12345",
      "Pending review"
    ]
  },
  "responsiveBehavior": {
    "XL": "Title + text inline",
    "L": "Title + text inline",
    "M": "Title + text stacked",
    "S": "Title + text stacked"
  },
  "accessibilityGuidance": [
    {
      "category": "labeling",
      "requirement": "Title is the primary identifier; text gives secondary context",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "keyboard",
      "requirement": "When titleActive=true, title is keyboard-activatable as link",
      "wcag": "2.1.1 (A)"
    }
  ],
  "patterns": [
    "Primary table column",
    "List item title"
  ],
  "compatibility": {
    "worksWith": [
      "Table",
      "List",
      "ColumnListItem",
      "ObjectHeader"
    ],
    "incompatible": [
      "As page title"
    ]
  },
  "exceptions": [
    "emphasized=true for high-priority items"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectIdentifier.json`
7. Confirm: "Updated ObjectIdentifier.json — N fields populated"

────────────────────────────────────────────────────────────

## [85/139] ObjectListItem

# Refresh SAP Fiori guideline: ObjectListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-list-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-list-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectListItem' || s.name.endsWith('.ObjectListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectListItem"
   - slug: "object-list-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-list-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectListItem",
  "slug": "object-list-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-list-item/",
  "purpose": "Rich List item showing an object summary \u2014 title, identifier, attributes, status, optional icon/avatar. Used in master-list views to summarize objects before drilling in.",
  "whenToUse": [
    "Master-detail list views (drill into Object Page)",
    "List that summarizes objects with multiple attributes",
    "When ObjectIdentifier alone is insufficient"
  ],
  "whenNotToUse": [
    "Simple text list \u2014 use StandardListItem",
    "Tabular comparison \u2014 use Table",
    "Single attribute \u2014 use StandardListItem"
  ],
  "doRules": [
    "Title is the primary identifier (verb-first if action-oriented)",
    "Use ObjectStatus for status",
    "Bind title to sapTitleColor, attrs to sapContent_LabelColor"
  ],
  "dontRules": [
    "Do not exceed 4 attributes inline \u2014 readability suffers",
    "Do not omit title \u2014 required"
  ],
  "layoutGuidance": {
    "placement": "Place ObjectListItem inside a compatible container (List).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for list item.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside List"
  ],
  "compatibility": [
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectListItem.json`
7. Confirm: "Updated ObjectListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [86/139] ObjectMarker

# Refresh SAP Fiori guideline: ObjectMarker

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-marker

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-marker")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectMarker' || s.name.endsWith('.ObjectMarker'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectMarker"
   - slug: "object-marker"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-marker"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectMarker",
  "slug": "object-marker",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-marker/",
  "purpose": "Status indicator with icon + label for an object's state (Draft, Locked, Unsaved, Flagged, Favorite).",
  "whenToUse": [
    "Object state in a list row or object header",
    "Indicate locked-by-other, draft, unsaved changes",
    "Read-only state visualization"
  ],
  "whenNotToUse": [
    "Semantic status (Error/Warning/Success) \u2014 use ObjectStatus",
    "Free-form tags \u2014 use Tag",
    "For numeric values \u2014 use ObjectNumber"
  ],
  "doRules": [
    "Use predefined types: Draft, Locked, LockedBy, Unsaved, Favorite, Flagged",
    "Pair icon with text label",
    "Bind text to sapContent_LabelColor"
  ],
  "dontRules": [
    "Do not invent new marker types",
    "Do not use ObjectMarker for action-required state \u2014 use MessageStrip"
  ],
  "layoutGuidance": {
    "placement": "Place ObjectMarker inside a compatible container (ColumnListItem, ObjectListItem, DynamicPageHeader).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for object display.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside ColumnListItem",
    "Used inside ObjectListItem",
    "Used inside DynamicPageHeader"
  ],
  "compatibility": [
    "ColumnListItem",
    "ObjectListItem",
    "DynamicPageHeader",
    "Card"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectMarker.json`
7. Confirm: "Updated ObjectMarker.json — N fields populated"

────────────────────────────────────────────────────────────

## [87/139] ObjectNumber

# Refresh SAP Fiori guideline: ObjectNumber

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectnumber

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectnumber")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectNumber' || s.name.endsWith('.ObjectNumber'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectNumber"
   - slug: "objectnumber"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectnumber"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectNumber",
  "slug": "object-number",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-number/",
  "purpose": "A prominent numeric value (count, amount, percentage) with unit and semantic state. Used for KPIs and key metrics.",
  "whenToUse": [
    "Display key numeric metric (count, amount, percentage)",
    "KPI in dashboard tiles",
    "Critical numbers in ObjectHeader (revenue, days remaining)",
    "In tables for numeric status (over budget, low stock)"
  ],
  "whenNotToUse": [
    "For text content \u2014 use Text",
    "For status \u2014 use ObjectStatus",
    "For ranges \u2014 use ObjectStatus or Tag"
  ],
  "doRules": [
    "Use for prominent KPI display",
    "Include unit alongside the number",
    "Use state to communicate semantic meaning (over budget, low stock)",
    "Use emphasized=true for primary KPI"
  ],
  "dontRules": [
    "Do not omit unit when ambiguous",
    "Do not use Error state for non-critical numbers",
    "Do not use larger than required font size (limits responsive design)"
  ],
  "layoutGuidance": {
    "placement": "ObjectHeader, Card, Table cell.",
    "sizing": "Auto width.",
    "spacing": "Inherits surrounding spacing.",
    "alignment": "Number prominent (20px Bold); unit smaller (12px Regular)."
  },
  "contentGuidance": {
    "labelLength": "Number + unit.",
    "contentRules": [
      "Number formatted to locale",
      "Unit follows number"
    ],
    "examples": [
      "1,234 EUR",
      "95%",
      "12 days"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full layout",
    "L": "Full layout",
    "M": "Full layout",
    "S": "Number prominent, unit may stack below"
  },
  "accessibilityGuidance": [
    {
      "category": "status",
      "requirement": "Critical numbers (Error/Warning) accompanied by ObjectStatus text",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Number + unit read together",
      "wcag": "1.3.1 (A)"
    }
  ],
  "patterns": [
    "KPI display",
    "Numeric metric"
  ],
  "compatibility": {
    "worksWith": [
      "ObjectHeader",
      "Card",
      "Table"
    ],
    "incompatible": [
      "Without unit when unit matters"
    ]
  },
  "exceptions": [
    "inverted=true for dark backgrounds"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectNumber.json`
7. Confirm: "Updated ObjectNumber.json — N fields populated"

────────────────────────────────────────────────────────────

## [88/139] ObjectPageHeader

# Refresh SAP Fiori guideline: ObjectPageHeader

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-header

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-header")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectPageHeader' || s.name.endsWith('.ObjectPageHeader'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectPageHeader"
   - slug: "object-page-header"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-header"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectPageHeader",
  "slug": "object-page-header",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-page-header/",
  "purpose": "Header of an ObjectPageLayout \u2014 visually identical to DynamicPageHeader. Holds title, subtitle, metadata, actions for an object.",
  "whenToUse": [
    "Inside ObjectPageLayout",
    "Top of an Object Page detail screen"
  ],
  "whenNotToUse": [
    "DynamicPage screens \u2014 use DynamicPageHeader",
    "List Report screens \u2014 use DynamicPageTitle"
  ],
  "doRules": [
    "Same conventions as DynamicPageHeader",
    "Include title, subtitle, key metadata"
  ],
  "dontRules": [
    "Do not use outside ObjectPageLayout",
    "Do not omit the title"
  ],
  "layoutGuidance": {
    "placement": "Place ObjectPageHeader inside a compatible container (ObjectPageLayout).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for page layout.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside ObjectPageLayout"
  ],
  "compatibility": [
    "ObjectPageLayout"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectPageHeader.json`
7. Confirm: "Updated ObjectPageHeader.json — N fields populated"

────────────────────────────────────────────────────────────

## [89/139] ObjectPageLayout

# Refresh SAP Fiori guideline: ObjectPageLayout

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectpagelayout

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectpagelayout")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectPageLayout' || s.name.endsWith('.ObjectPageLayout'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectPageLayout"
   - slug: "objectpagelayout"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectpagelayout"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectPageLayout",
  "slug": "object-page",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-page/",
  "purpose": "A floorplan for displaying a single business object with multiple sections. Includes object header, anchor bar, and scrollable section content.",
  "whenToUse": [
    "For object detail pages with multiple sections",
    "When user needs to view comprehensive information about a single entity",
    "For Edit and Display modes of an object"
  ],
  "whenNotToUse": [
    "For simple single-section pages \u2014 use DynamicPage",
    "For lists of objects \u2014 use List Report",
    "For wizards \u2014 use Wizard"
  ],
  "doRules": [
    "Use for object detail pages with multiple sections",
    "Use Anchor Bar for quick navigation when many sections exist",
    "Show object header with key facts at top",
    "Use IconTabBar for grouped sections"
  ],
  "dontRules": [
    "Do not use for simple single-section pages \u2014 use DynamicPage",
    "Do not put a Table as the only content \u2014 use List Report",
    "Do not omit the object header"
  ],
  "layoutGuidance": {
    "placement": "Full content area.",
    "sizing": "Full viewport.",
    "spacing": "Section spacing 32px; anchor bar 44px.",
    "alignment": "Anchor bar sticky top; sections scroll."
  },
  "contentGuidance": {
    "labelLength": "Section titles 1\u20133 words.",
    "contentRules": [
      "Use ObjectPageSection for each section",
      "Use subsections for granularity"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Anchor bar visible; sections in 2-col grid where applicable",
    "L": "Anchor bar visible; sections in 2-col",
    "M": "Anchor bar visible; single column",
    "S": "Anchor bar collapsed; single column"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Anchor bar items navigate via arrow keys; Enter scrolls to section",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Each section has heading; anchor bar mirrors structure",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Section position announced when scrolled to"
    }
  ],
  "patterns": [
    "Object Page floorplan",
    "Detail view"
  ],
  "compatibility": {
    "worksWith": [
      "DynamicPageTitle",
      "DynamicPageHeader",
      "IconTabBar",
      "ObjectPageSection"
    ],
    "incompatible": [
      "Inside Dialog",
      "Nested ObjectPageLayout"
    ]
  },
  "exceptions": [
    "useIconTabBar=true replaces Anchor Bar with IconTabBar"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectPageLayout.json`
7. Confirm: "Updated ObjectPageLayout.json — N fields populated"

────────────────────────────────────────────────────────────

## [90/139] ObjectPageSection

# Refresh SAP Fiori guideline: ObjectPageSection

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-section

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-section")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectPageSection' || s.name.endsWith('.ObjectPageSection'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectPageSection"
   - slug: "object-page-section"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-section"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectPageSection",
  "slug": "object-page-section",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-page-section/",
  "purpose": "Major section of an ObjectPageLayout \u2014 has a title, optional anchor in the navigation menu, contains SubSections.",
  "whenToUse": [
    "Inside ObjectPageLayout",
    "When detail page has multiple major themes (General / Schedule / Notes)"
  ],
  "whenNotToUse": [
    "Outside ObjectPageLayout",
    "For minor groupings \u2014 use ObjectPageSubSection or Panel"
  ],
  "doRules": [
    "Provide a clear, scoped title",
    "Use 2-7 SubSections per Section",
    "Make title navigable via the page anchor menu"
  ],
  "dontRules": [
    "Do not nest Sections",
    "Do not exceed 7 SubSections per Section",
    "Do not omit the title"
  ],
  "layoutGuidance": {
    "placement": "Place ObjectPageSection inside a compatible container (ObjectPageLayout).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for page layout.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside ObjectPageLayout"
  ],
  "compatibility": [
    "ObjectPageLayout"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectPageSection.json`
7. Confirm: "Updated ObjectPageSection.json — N fields populated"

────────────────────────────────────────────────────────────

## [91/139] ObjectPageSubSection

# Refresh SAP Fiori guideline: ObjectPageSubSection

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-sub-section

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-sub-section")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectPageSubSection' || s.name.endsWith('.ObjectPageSubSection'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectPageSubSection"
   - slug: "object-page-sub-section"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/object-page-sub-section"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectPageSubSection",
  "slug": "object-page-sub-section",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-page-sub-section/",
  "purpose": "Subsection within an ObjectPageSection. Carries title + content.",
  "whenToUse": [
    "Inside ObjectPageSection",
    "When a Section needs to be divided into logical groups"
  ],
  "whenNotToUse": [
    "Outside ObjectPageSection",
    "For top-level sections \u2014 use ObjectPageSection"
  ],
  "doRules": [
    "Provide H3-level title",
    "Group related Form fields or content here",
    "Keep content focused"
  ],
  "dontRules": [
    "Do not nest SubSections",
    "Do not skip ObjectPageSection (always wrap in Section)"
  ],
  "layoutGuidance": {
    "placement": "Place ObjectPageSubSection inside a compatible container (ObjectPageSection).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for page layout.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside ObjectPageSection"
  ],
  "compatibility": [
    "ObjectPageSection"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectPageSubSection.json`
7. Confirm: "Updated ObjectPageSubSection.json — N fields populated"

────────────────────────────────────────────────────────────

## [92/139] ObjectStatus

# Refresh SAP Fiori guideline: ObjectStatus

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectstatus

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectstatus")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ObjectStatus' || s.name.endsWith('.ObjectStatus'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ObjectStatus"
   - slug: "objectstatus"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/objectstatus"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ObjectStatus",
  "slug": "object-status",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/object-status/",
  "purpose": "A semantic status indicator combining icon, text, and semantic color. The standard SAP pattern for communicating state.",
  "whenToUse": [
    "Showing status (Success/Warning/Error/Information) on objects",
    "In tables for status columns",
    "In ObjectHeader for prominent status display"
  ],
  "whenNotToUse": [
    "For categorical labels (non-semantic) \u2014 use Tag",
    "For interactive controls \u2014 use Button",
    "Without text \u2014 status by color alone violates WCAG"
  ],
  "doRules": [
    "Always pair state color with state icon",
    "Use clear, concise status text",
    "Use semantic state property (Success/Warning/Error/Information)",
    "Combine with ObjectNumber for KPI display"
  ],
  "dontRules": [
    "Do not communicate status by color alone",
    "Do not use Error state for warnings \u2014 use the right semantic level",
    "Do not omit text \u2014 color + icon alone is insufficient"
  ],
  "layoutGuidance": {
    "placement": "Table cell, List item, ObjectHeader, Form.",
    "sizing": "Auto width by text.",
    "spacing": "Inherits surrounding spacing.",
    "alignment": "Icon left, text right."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words.",
    "contentRules": [
      "Status text describes state",
      "Combine with semantic state prop"
    ],
    "examples": [
      "Approved",
      "Pending Review",
      "Failed",
      "Draft"
    ]
  },
  "responsiveBehavior": {
    "XL": "Icon + text inline",
    "L": "Icon + text inline",
    "M": "Icon + text inline",
    "S": "Icon + text inline"
  },
  "accessibilityGuidance": [
    {
      "category": "status",
      "requirement": "State communicated by icon AND text \u2014 not color alone",
      "wcag": "1.4.1 (A)"
    },
    {
      "category": "contrast",
      "requirement": "Status text contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "State announced via aria-label",
      "wcag": "4.1.2 (A)"
    }
  ],
  "patterns": [
    "Status column",
    "KPI indicator",
    "Object state"
  ],
  "compatibility": {
    "worksWith": [
      "Table",
      "List",
      "Form",
      "ObjectHeader"
    ],
    "incompatible": [
      "Without text \u2014 icon-only status"
    ]
  },
  "exceptions": [
    "Inverted style for dark backgrounds"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ObjectStatus.json`
7. Confirm: "Updated ObjectStatus.json — N fields populated"

────────────────────────────────────────────────────────────

## [93/139] OverflowToolbar

# Refresh SAP Fiori guideline: OverflowToolbar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overflow

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overflow")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'OverflowToolbar' || s.name.endsWith('.OverflowToolbar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "OverflowToolbar"
   - slug: "toolbar-overflow"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overflow"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "OverflowToolbar",
  "slug": "toolbar-overflow",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/toolbar-overflow/",
  "purpose": "A horizontal action bar that automatically collapses its less-important actions into an overflow \u22ee menu when the available width is insufficient. Used above tables, in dialogs, and as a section-level action toolbar.",
  "whenToUse": [
    "Above a Table or List to host bulk-action buttons (Add, Delete, Approve, Export)",
    "As a section toolbar in an Object Page with section-scoped actions",
    "When the action count varies based on selection or context and may exceed available width",
    "When you need an inline title + search input + multiple action buttons in one row",
    "In Dialogs with multiple actions where some may need to overflow"
  ],
  "whenNotToUse": [
    "For page-level actions tied to the entity title \u2014 those belong in DynamicPageTitle's actions slot",
    "When there is only ONE action \u2014 use a single Button placed in the relevant slot instead",
    "For navigation between sections \u2014 use IconTabBar or Breadcrumb",
    "Inside a Table cell \u2014 table rows should use IconButton/MenuButton, not a toolbar"
  ],
  "doRules": [
    "Place the section title on the left edge",
    "Use itemSpacing of 8px between action items",
    "Order actions left-to-right by importance: primary right-side actions last",
    "Keep at most 1 Emphasized button \u2014 represents the section's primary action",
    "Show the most-used 2-3 actions inline; let the rest overflow into the \u22ee menu",
    "Place destructive actions inside the overflow menu, never inline (prevent mis-click)",
    "Use SearchField inline for table-scoped search; keep it left of action buttons"
  ],
  "dontRules": [
    "Do not put primary CTAs inside the overflow menu \u2014 they must always be visible",
    "Do not exceed 5 inline actions before letting overflow take over",
    "Do not stack two OverflowToolbars vertically \u2014 combine into one",
    "Do not put long labels on inline buttons when space is tight \u2014 use IconButton with tooltip",
    "Do not nest one OverflowToolbar inside another",
    "Do not use color alone to differentiate action types \u2014 rely on Button.type semantics"
  ],
  "layoutGuidance": {
    "placement": "Full-width row directly above the Table or section it controls.",
    "sizing": "Height 44px (matches SAP control standard). Width = parent content width.",
    "spacing": "16px horizontal padding. 8px gap between items. Title left-edge, actions right-edge via ToolbarSpacer or layoutGrow.",
    "alignment": "Items vertically centered. Title and action group horizontally distributed (SPACE_BETWEEN behavior \u2014 implement via layoutGrow on the spacer node)."
  },
  "contentGuidance": {
    "titleLength": "1-3 words + optional counter (e.g. 'Artifacts (2)', 'Pending Approvals (47)').",
    "contentRules": [
      "Counter in parentheses matches the row count of the table below",
      "Action labels are short, verb-first (Add, Delete, Approve, Export)",
      "Overflow menu items use the same labels as if they were inline",
      "SearchField placeholder describes the scope ('Search artifacts' not just 'Search')"
    ]
  },
  "responsiveBehavior": {
    "XL": "All inline actions visible; SearchField shown.",
    "L": "All inline actions visible; SearchField may shrink.",
    "M": "Lower-priority actions move to overflow \u22ee; SearchField narrows.",
    "S": "Most actions in overflow \u22ee; title and primary action remain visible."
  },
  "accessibilityGuidance": {
    "WCAG_2_4_3_FocusOrder": "Tab order: Title \u2192 SearchField \u2192 inline actions (left to right) \u2192 overflow button.",
    "WCAG_2_1_1_Keyboard": "Every action reachable by keyboard. Enter/Space triggers; Escape closes overflow menu.",
    "WCAG_2_4_7_FocusVisible": "Every interactive child has a visible focus ring.",
    "WCAG_4_1_2_NameRoleValue": "Toolbar has role=toolbar. Overflow button has aria-haspopup=true and aria-expanded reflecting open state.",
    "WCAG_1_4_3_Contrast": "Title text 4.5:1 against toolbar background. Action button text per Button component's a11y rules."
  },
  "patterns": [
    "Table headerToolbar \u2014 OverflowToolbar above a Table holding title + search + actions",
    "Object Page section header \u2014 OverflowToolbar at the top of a section",
    "Filter Bar actions \u2014 Go / Adapt Filters / Save buttons in an OverflowToolbar within DynamicPageHeader",
    "Dialog footer \u2014 multiple actions with overflow fallback for confirm/cancel groupings"
  ],
  "compatibility": [
    "Title",
    "Label",
    "Button",
    "IconButton",
    "MenuButton",
    "SearchField",
    "ToolbarSpacer",
    "ToggleButton",
    "Select",
    "ComboBox"
  ],
  "exceptions": [
    "Inside a Table cell \u2014 use IconButton or MenuButton directly, not a toolbar",
    "As Dialog primary content \u2014 Dialog has its own footer for actions",
    "Nested inside another OverflowToolbar \u2014 combine into a single toolbar"
  ],
  "version": "1.149.0",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/OverflowToolbar.json`
7. Confirm: "Updated OverflowToolbar.json — N fields populated"

────────────────────────────────────────────────────────────

## [94/139] Panel

# Refresh SAP Fiori guideline: Panel

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/panel

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/panel")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Panel' || s.name.endsWith('.Panel'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Panel"
   - slug: "panel"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/panel"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Panel",
  "slug": "panel",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/panel/",
  "purpose": "A container with a header that groups related content. Can be expandable to show/hide content.",
  "whenToUse": [
    "To group related content with a visible header",
    "For expandable advanced settings",
    "As a section within a page",
    "For grouping form sections"
  ],
  "whenNotToUse": [
    "As primary navigation",
    "For full-page content \u2014 use DynamicPage",
    "For modal content \u2014 use Dialog"
  ],
  "doRules": [
    "Use Panel to group related content with a header",
    "Use Expandable when content is optional or advanced",
    "Set headerText to describe the group",
    "Use ToolbarToolbar for header-level actions"
  ],
  "dontRules": [
    "Do not nest Panel inside Panel more than 2 levels",
    "Do not use Panel as primary navigation",
    "Do not omit header text"
  ],
  "layoutGuidance": {
    "placement": "Inside page content, Object Page section.",
    "sizing": "Width fills parent.",
    "spacing": "Internal padding 16px.",
    "alignment": "Header top, content below."
  },
  "contentGuidance": {
    "labelLength": "Header text 1\u20135 words.",
    "contentRules": [
      "Use Bold 16px for header",
      "Nest Form, Table, or List as content"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full layout",
    "L": "Full layout",
    "M": "Full layout",
    "S": "May collapse by default if Expandable"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter on header toggles expand/collapse",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Panel has headerText",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Expanded state announced via aria-expanded"
    }
  ],
  "patterns": [
    "Content section",
    "Advanced settings group"
  ],
  "compatibility": {
    "worksWith": [
      "Form",
      "Table",
      "List",
      "IconTabBar"
    ],
    "incompatible": [
      "Inside table cell",
      "Inside ShellBar"
    ]
  },
  "exceptions": [
    "Use Card for elevated panel-like containers with shadow"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Panel.json`
7. Confirm: "Updated Panel.json — N fields populated"

────────────────────────────────────────────────────────────

## [95/139] Popover

# Refresh SAP Fiori guideline: Popover

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/popover

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/popover")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Popover' || s.name.endsWith('.Popover'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Popover"
   - slug: "popover"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/popover"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Popover",
  "slug": "popover",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/popover/",
  "purpose": "Floating panel anchored to a triggering element. Shows transient supplementary content like a menu, picker, or detail snippet without taking over the screen.",
  "whenToUse": [
    "Overflow menus from a Button / IconButton",
    "Detail-on-hover for table cells (rare; avoid for accessibility)",
    "Color pickers, date pickers, dropdown menus",
    "Confirmation prompts for low-risk actions (use Dialog for high-risk)"
  ],
  "whenNotToUse": [
    "For critical actions \u2014 use Dialog",
    "For navigation \u2014 use SideNavigation or IconTabBar",
    "For inline content \u2014 use Panel",
    "When content needs to persist \u2014 use a dedicated section, not Popover"
  ],
  "doRules": [
    "Anchor to the triggering element clearly (arrow / tail)",
    "Provide a close affordance (\u00d7 or Esc)",
    "Limit content to a single task \u2014 Popover should not branch into sub-tasks",
    "Bind fill to sapShellColor, border to sapShell_BorderColor"
  ],
  "dontRules": [
    "Do not nest Popovers (Popover-from-Popover)",
    "Do not use Popover for forms with > 3 fields \u2014 use Dialog",
    "Do not auto-dismiss on hover-out for click-triggered Popovers",
    "Do not use Popover for navigation (use SideNavigation)"
  ],
  "layoutGuidance": {
    "placement": "Place Popover inside a compatible container (Button, IconButton, MenuButton).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for overlay \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Button",
    "Used in IconButton",
    "Used in MenuButton"
  ],
  "compatibility": [
    "Button",
    "IconButton",
    "MenuButton",
    "Link"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Popover.json`
7. Confirm: "Updated Popover.json — N fields populated"

────────────────────────────────────────────────────────────

## [96/139] ProductSwitch

# Refresh SAP Fiori guideline: ProductSwitch

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/product-switch

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/product-switch")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ProductSwitch' || s.name.endsWith('.ProductSwitch'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ProductSwitch"
   - slug: "product-switch"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/product-switch"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ProductSwitch",
  "slug": "product-switch",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/product-switch/",
  "purpose": "A tile grid popover anchored to the ShellBar that lets users jump to other SAP products or apps. Shows product logos + names in a compact grid. Distinct from UserMenu (personal) and Notifications (alerts).",
  "whenToUse": [
    "As the app-switcher in ShellBar for SAP products (Cloud ERP, SuccessFactors, Ariba, etc.)",
    "When users have multiple entitled products",
    "For cross-product navigation in a multi-app landscape",
    "As the 'waffle menu' pattern of the SAP shell"
  ],
  "whenNotToUse": [
    "For in-app page navigation \u2014 use SideNavigation",
    "For user account actions \u2014 use UserMenu",
    "For notifications \u2014 use Notifications popover",
    "For a small number of app links (< 4) \u2014 put them directly in ShellBar"
  ],
  "doRules": [
    "Show product logos alongside names for scannability",
    "Group products by category (Core / Add-ons / External) when the list is long",
    "Highlight the current product visually",
    "Support keyboard navigation across the grid"
  ],
  "dontRules": [
    "Do not include non-SAP or non-entitled products",
    "Do not use for a single product \u2014 omit the switch entirely",
    "Do not put per-page actions inside \u2014 that belongs elsewhere",
    "Do not exceed 20 products in the base view \u2014 paginate or search"
  ],
  "layoutGuidance": {
    "placement": "Anchored to ShellBar (typically left of user avatar)",
    "sizing": "Width 400\u2013560px; grid of 3\u20134 columns; item ~120\u00d7120",
    "spacing": "16px grid gap",
    "alignment": "Icon top, label below, centered per cell"
  },
  "contentGuidance": {
    "labelLength": "Product name \u2264 30 chars",
    "contentRules": "Standardized product names; icons match brand marks",
    "examples": [
      "SAP S/4HANA \u00b7 SuccessFactors \u00b7 Ariba \u00b7 Concur"
    ]
  },
  "responsiveBehavior": {
    "XL": "3\u20134 column grid",
    "L": "3 column grid",
    "M": "2 column grid",
    "S": "Full-height slide-in with 1-column list"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)"
    ],
    "requirements": [
      "Trigger has aria-label='Switch products'",
      "Each tile has aria-label='Open [Product Name]'",
      "Product logos have alt text (product name)",
      "Keyboard: Arrow keys navigate grid; Enter selects; Escape closes"
    ]
  },
  "patterns": [
    "Multi-product SAP landscape",
    "Fiori Launchpad app switcher"
  ],
  "compatibility": {
    "allowedWith": [
      "ShellBar (as anchor)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Inside other components"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ProductSwitch.json`
7. Confirm: "Updated ProductSwitch.json — N fields populated"

────────────────────────────────────────────────────────────

## [97/139] ProgressIndicator

# Refresh SAP Fiori guideline: ProgressIndicator

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progressindicator

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progressindicator")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ProgressIndicator' || s.name.endsWith('.ProgressIndicator'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ProgressIndicator"
   - slug: "progressindicator"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progressindicator"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ProgressIndicator",
  "slug": "progress-indicator",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/progressindicator/",
  "purpose": "Horizontal bar showing the completion percentage of a long-running task or quantitative state (storage used, completion progress, score).",
  "whenToUse": [
    "Long-running tasks (upload, sync, processing)",
    "Quantitative state of a single dimension (storage, quota, completion %)",
    "Multi-step wizards to show overall progress",
    "KPI tiles showing percentage of target"
  ],
  "whenNotToUse": [
    "For indeterminate progress \u2014 use BusyIndicator",
    "For categorical status \u2014 use ObjectStatus",
    "For ratings \u2014 use RatingIndicator",
    "For percentages alone (no progress connotation) \u2014 use Text with %"
  ],
  "doRules": [
    "Always show percent + descriptive label (\"47% \u2014 235 of 500 invoices\")",
    "Pick state color based on value (positive >= 80%, critical <= 20%)",
    "Use sapPositiveTextColor / sapCriticalTextColor / sapNegativeTextColor for semantic state",
    "Bind fill to a SAP variable matching state"
  ],
  "dontRules": [
    "Do not use ProgressIndicator without a label",
    "Do not animate when stalled \u2014 show static state",
    "Do not stack multiple ProgressIndicators for the same metric",
    "Do not use hardcoded color \u2014 bind to state-aware SAP token"
  ],
  "layoutGuidance": {
    "placement": "Place ProgressIndicator inside a compatible container (Card, Panel, ColumnListItem).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Card",
    "Used in Panel",
    "Used in ColumnListItem"
  ],
  "compatibility": [
    "Card",
    "Panel",
    "ColumnListItem",
    "Form",
    "DynamicPageHeader"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ProgressIndicator.json`
7. Confirm: "Updated ProgressIndicator.json — N fields populated"

────────────────────────────────────────────────────────────

## [98/139] ProgressStep

# Refresh SAP Fiori guideline: ProgressStep

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progress-step

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progress-step")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ProgressStep' || s.name.endsWith('.ProgressStep'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ProgressStep"
   - slug: "progress-step"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/progress-step"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ProgressStep",
  "slug": "progress-step",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/progress-step/",
  "purpose": "Single visual progress step in a horizontal sequence. Used to show position in a multi-step flow without the full Wizard layout.",
  "whenToUse": [
    "Top-of-page progress for a multi-step flow",
    "Order tracking visualizations",
    "Approval pipeline status"
  ],
  "whenNotToUse": [
    "Loading progress (use ProgressIndicator)",
    "Single-step status (use ObjectStatus)",
    "For more than 7 steps \u2014 collapse"
  ],
  "doRules": [
    "Mark exactly one as current",
    "Number steps sequentially",
    "Show step name below the circle"
  ],
  "dontRules": [
    "Do not exceed 7 steps",
    "Do not omit step labels"
  ],
  "layoutGuidance": {
    "placement": "Place ProgressStep inside a compatible container (Wizard, DynamicPage, Panel).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for feedback.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Wizard",
    "Used inside DynamicPage",
    "Used inside Panel"
  ],
  "compatibility": [
    "Wizard",
    "DynamicPage",
    "Panel"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ProgressStep.json`
7. Confirm: "Updated ProgressStep.json — N fields populated"

────────────────────────────────────────────────────────────

## [99/139] QuickView

# Refresh SAP Fiori guideline: QuickView

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/quick-view

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/quick-view")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'QuickView' || s.name.endsWith('.QuickView'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "QuickView"
   - slug: "quick-view"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/quick-view"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "QuickView",
  "slug": "quick-view",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/quick-view/",
  "purpose": "Object summary preview shown in a Popover anchored to a list row or link. Avatar + title + key facts + actions, without leaving the current page.",
  "whenToUse": [
    "Hover-preview of a user, customer, or object from a table row",
    "Quick-glance detail without full navigation",
    "Right-click context summaries"
  ],
  "whenNotToUse": [
    "Full editing \u2014 open Object Page",
    "Static text \u2014 use Popover with text",
    "Critical decisions \u2014 use Dialog"
  ],
  "doRules": [
    "Include Avatar + title + 3-5 key attributes",
    "Provide \"Open\" link to full detail page",
    "Bind background to sapShellColor"
  ],
  "dontRules": [
    "Do not embed forms in QuickView",
    "Do not exceed 5 attributes",
    "Do not nest QuickViews"
  ],
  "layoutGuidance": {
    "placement": "Place QuickView inside a compatible container (Triggered from List rows, Link, Avatar).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for overlay.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Triggered from List rows, Link, Avatar"
  ],
  "compatibility": [
    "Triggered from List rows, Link, Avatar"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/QuickView.json`
7. Confirm: "Updated QuickView.json — N fields populated"

────────────────────────────────────────────────────────────

## [100/139] RadioButton

# Refresh SAP Fiori guideline: RadioButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radiobutton

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radiobutton")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'RadioButton' || s.name.endsWith('.RadioButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "RadioButton"
   - slug: "radiobutton"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radiobutton"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "RadioButton",
  "slug": "radio-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/radio-button/",
  "purpose": "A single selection within a group of mutually exclusive options. Used when 2\u20136 options are visible and user must choose one.",
  "whenToUse": [
    "2\u20136 mutually exclusive options where all should be visible",
    "When the user must see all options to decide",
    "For settings with semantic categories"
  ],
  "whenNotToUse": [
    "For >6 options \u2014 use Select",
    "For non-exclusive options \u2014 use CheckBox",
    "For single binary choices \u2014 use Switch or CheckBox"
  ],
  "doRules": [
    "Use for 2\u20136 mutually exclusive options",
    "Always have one option selected by default when possible",
    "Group radios with same groupName",
    "Label the group with a header above"
  ],
  "dontRules": [
    "Do not use RadioButton outside a group",
    "Do not use with more than 6 options \u2014 use Select",
    "Do not allow no-selection if a choice is required"
  ],
  "layoutGuidance": {
    "placement": "Inside Form, Panel, Dialog body.",
    "sizing": "16\u00d716px circle. Touch area includes label.",
    "spacing": "8px between circle and label; 8px between options.",
    "alignment": "Vertical stack by default; horizontal for \u22643 options."
  },
  "contentGuidance": {
    "labelLength": "1\u20135 words.",
    "contentRules": [
      "Use parallel construction across options",
      "Capitalize consistently"
    ],
    "examples": [
      "Cloud Integration",
      "On-premise",
      "Hybrid"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline horizontal if \u22643 options",
    "L": "Inline horizontal if \u22643 options",
    "M": "Vertical stack",
    "S": "Vertical stack with full-width touch areas"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys move selection within group; Tab skips to next group",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Group has accessible name; each option has label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus on selected radio in group",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "Selected state announced as \"radio button, selected\""
    }
  ],
  "patterns": [
    "Form field group",
    "Settings selector"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "Panel"
    ],
    "incompatible": [
      "Alone without a group"
    ]
  },
  "exceptions": [
    "Use RadioButtonGroup component to enforce groupName binding"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/RadioButton.json`
7. Confirm: "Updated RadioButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [101/139] RadioButtonGroup

# Refresh SAP Fiori guideline: RadioButtonGroup

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radio-button-group

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radio-button-group")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'RadioButtonGroup' || s.name.endsWith('.RadioButtonGroup'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "RadioButtonGroup"
   - slug: "radio-button-group"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/radio-button-group"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "RadioButtonGroup",
  "slug": "radio-button-group",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/radio-button-group/",
  "purpose": "Vertical group of mutually-exclusive RadioButton options. Composed at plugin-time from items[] \u2014 each item becomes a RadioButton instance.",
  "whenToUse": [
    "Single-select from 2-7 options where all should be visible",
    "Form fields with discrete value choices",
    "Survey-style questions"
  ],
  "whenNotToUse": [
    "More than 7 options \u2014 use Select or ComboBox",
    "Multi-select \u2014 use CheckBox group",
    "Single yes/no \u2014 use Switch"
  ],
  "doRules": [
    "Show all options at once",
    "Mark exactly one as selected",
    "Provide clear, distinct labels",
    "Use vertical layout for >3 options"
  ],
  "dontRules": [
    "Do not allow zero-selected state when a default is reasonable",
    "Do not exceed 7 options",
    "Do not use RadioButtonGroup for binary toggles (use Switch)"
  ],
  "layoutGuidance": {
    "placement": "Place RadioButtonGroup inside a compatible container (Form, Dialog, Panel).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Form",
    "Used inside Dialog",
    "Used inside Panel"
  ],
  "compatibility": [
    "Form",
    "Dialog",
    "Panel",
    "FormContainer"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/RadioButtonGroup.json`
7. Confirm: "Updated RadioButtonGroup.json — N fields populated"

────────────────────────────────────────────────────────────

## [102/139] RangeSlider

# Refresh SAP Fiori guideline: RangeSlider

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rangeslider

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rangeslider")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'RangeSlider' || s.name.endsWith('.RangeSlider'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "RangeSlider"
   - slug: "rangeslider"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rangeslider"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "RangeSlider",
  "slug": "range-slider",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/range-slider/",
  "purpose": "A two-handle slider for selecting a numeric range (start, end) within a bounded scale.",
  "whenToUse": [
    "Numeric range filter (price, quantity, age)",
    "When both bounds need visual control",
    "In FilterBar for ranges"
  ],
  "whenNotToUse": [
    "For single value \u2014 use Slider",
    "For precise range entry \u2014 use two Input fields"
  ],
  "doRules": [
    "Use for numeric range selection",
    "Show both start and end value labels via tooltips",
    "Allow drag of either handle to adjust bounds"
  ],
  "dontRules": [
    "Do not use when only single value is needed",
    "Do not allow start > end",
    "Do not omit visible value labels"
  ],
  "layoutGuidance": {
    "placement": "FilterBar, Form.",
    "sizing": "Full width of container.",
    "spacing": "16px vertical between sliders.",
    "alignment": "Both handles draggable along track."
  },
  "contentGuidance": {
    "labelLength": "Tooltips show start and end.",
    "contentRules": [
      "Tooltips above each handle",
      "Optionally show selected range below"
    ],
    "examples": [
      "10\u201350",
      "0\u2013100"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width with handles",
    "L": "Full width with handles",
    "M": "Full width",
    "S": "Full width; touch targets enlarged"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab between handles; arrows adjust selected handle",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label; announce both bounds",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Both range bounds announced when changed"
    }
  ],
  "patterns": [
    "Range filter",
    "Constraint selection"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "FilterBar"
    ],
    "incompatible": [
      "Without bounds"
    ]
  },
  "exceptions": [
    "Constraint: end \u2265 start enforced automatically"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/RangeSlider.json`
7. Confirm: "Updated RangeSlider.json — N fields populated"

────────────────────────────────────────────────────────────

## [103/139] RatingIndicator

# Refresh SAP Fiori guideline: RatingIndicator

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rating-indicator

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rating-indicator")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'RatingIndicator' || s.name.endsWith('.RatingIndicator'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "RatingIndicator"
   - slug: "rating-indicator"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/rating-indicator"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "RatingIndicator",
  "slug": "rating-indicator",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/rating-indicator/",
  "purpose": "Displays or captures a rating on a numeric scale, typically 0-5 stars. Used for reviews, feedback, priority selection, and any 1-N ordinal input.",
  "whenToUse": [
    "Show a rating value from user reviews or evaluations",
    "Capture user feedback ratings (interactive mode)",
    "Prioritize items on an ordinal scale (1-5)",
    "Show performance scores or quality metrics"
  ],
  "whenNotToUse": [
    "For binary choices \u2014 use Switch or CheckBox",
    "For continuous values with fine granularity \u2014 use Slider",
    "For percentages \u2014 use ProgressIndicator",
    "For fixed categorical values \u2014 use Select or RadioButtonGroup"
  ],
  "doRules": [
    "Use consistent max value (typically 5) across the app",
    "Support half-star ratings only when precision matters",
    "Provide accessible label describing the metric ('4 out of 5 stars')",
    "Show numeric value next to stars when precision matters"
  ],
  "dontRules": [
    "Do not use for more than 10 items on the scale \u2014 becomes unreadable",
    "Do not rely on color alone (star vs empty must differ in shape)",
    "Do not omit the total (always show N of M)",
    "Do not use in dense table cells \u2014 too small to tap"
  ],
  "layoutGuidance": {
    "placement": "Inline within object cards, list items, or forms",
    "sizing": "Star size: 16px small, 22px medium (default), 32px large",
    "spacing": "4px between stars",
    "alignment": "Left-aligned by default"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 numeric",
    "contentRules": "Value is a number 0-maxValue, optionally with 0.5 increments",
    "examples": [
      "\u2605\u2605\u2605\u2605\u2606 (4.0)",
      "\u2605\u2605\u2605\u2605\u2605 (5.0 out of 5)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full-size stars",
    "L": "Full-size stars",
    "M": "May shrink to small size",
    "S": "Consider showing numeric value only"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)",
      "WCAG 2.1 \u00b7 2.5.5 Target Size (AAA)"
    ],
    "requirements": [
      "Interactive mode: 32px min compact / 44px min cozy tap target per star",
      "Star shape distinguishes rated vs unrated (not just color)",
      "aria-label: 'N out of M stars, [metric name]'",
      "Keyboard: Arrow keys change rating in interactive mode"
    ]
  },
  "patterns": [
    "Product cards",
    "Review sections",
    "Feedback forms",
    "Priority pickers"
  ],
  "compatibility": {
    "allowedWith": [
      "Card",
      "Panel",
      "Form",
      "StandardListItem",
      "ObjectListItem"
    ],
    "forbiddenWith": [
      "Dense table cells",
      "Bar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/RatingIndicator.json`
7. Confirm: "Updated RatingIndicator.json — N fields populated"

────────────────────────────────────────────────────────────

## [104/139] ResponsiveTable

# Refresh SAP Fiori guideline: ResponsiveTable

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/responsive-table

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/responsive-table")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ResponsiveTable' || s.name.endsWith('.ResponsiveTable'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ResponsiveTable"
   - slug: "responsive-table"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/responsive-table"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ResponsiveTable",
  "slug": "responsive-table",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/responsive-table/",
  "purpose": "Alias for sap.m.Table \u2014 the responsive table that Fiori uses by default. NOT to be confused with sap.ui.table.Table (GridTable).",
  "whenToUse": [
    "Standard tabular data display",
    "Anywhere Table is used"
  ],
  "whenNotToUse": [
    "For analytical / heavy data \u2014 use GridTable (out of scope)",
    "For hierarchical \u2014 use Tree"
  ],
  "doRules": [
    "Treat as Table \u2014 same conventions apply"
  ],
  "dontRules": [
    "Do not confuse with sap.ui.table.Table (GridTable)"
  ],
  "layoutGuidance": {
    "placement": "Place ResponsiveTable inside a compatible container (DynamicPage, Panel, Dialog).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for data display.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPage",
    "Used inside Panel",
    "Used inside Dialog"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Dialog",
    "OverflowToolbar (as headerToolbar)"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ResponsiveTable.json`
7. Confirm: "Updated ResponsiveTable.json — N fields populated"

────────────────────────────────────────────────────────────

## [105/139] SearchField

# Refresh SAP Fiori guideline: SearchField

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/search-field

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/search-field")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'SearchField' || s.name.endsWith('.SearchField'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "SearchField"
   - slug: "search-field"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/search-field"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "SearchField",
  "slug": "search-field",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/search-field/",
  "purpose": "Input control specialized for filter/search queries. Visually identical to Input with a leading magnifier icon, used to narrow lists, tables, or filter results.",
  "whenToUse": [
    "Filter a visible list or table by free-text query",
    "Trigger a search action that returns a result set",
    "In OverflowToolbar of a list-report or worklist page",
    "In FilterBar as the global text filter"
  ],
  "whenNotToUse": [
    "As a generic text input \u2014 use Input",
    "As a form field with validation \u2014 use Input with type",
    "Inside a table cell \u2014 use Input",
    "When the action is navigation (jump to page) \u2014 use Link"
  ],
  "doRules": [
    "Place in OverflowToolbar at the right, before the spacer or after the title",
    "Provide a specific placeholder ('Filter Invoices', 'Search Suppliers')",
    "Show the magnifier icon (default behavior \u2014 do not suppress)",
    "Make filter behavior immediate (typeahead) where dataset size permits"
  ],
  "dontRules": [
    "Do not use generic placeholders like just 'Search'",
    "Do not stack multiple SearchFields in one toolbar",
    "Do not omit the icon \u2014 it is the visual cue for search semantics",
    "Do not use SearchField for non-search purposes"
  ],
  "layoutGuidance": {
    "placement": "Right side of OverflowToolbar, after ToolbarSpacer.",
    "sizing": "Auto width up to ~280px; height 26px Compact / 36px Cozy.",
    "spacing": "8px gap from adjacent buttons.",
    "alignment": "Right-aligned within toolbar."
  },
  "contentGuidance": {
    "labelLength": "Placeholder 2-4 words ('Filter Artifacts', 'Search Invoices').",
    "contentRules": [
      "Placeholder uses sentence case: 'Filter exceptions' not 'FILTER EXCEPTIONS'",
      "Avoid 'Type to search' \u2014 be specific about what is searched",
      "Localize all placeholders"
    ],
    "examples": [
      "Filter Artifacts",
      "Search Invoices",
      "Find Supplier",
      "Filter exceptions by vendor or status"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width up to 280px.",
    "L": "Full width up to 280px.",
    "M": "May shrink to 200px; icon stays visible.",
    "S": "Collapses to icon-only; tap expands to full overlay."
  },
  "accessibilityGuidance": {
    "ariaPattern": "<input role='searchbox' aria-label='...'>. Maps to <search> landmark when wrapping content.",
    "contrast": "Border \u2265 3:1 with bg (WCAG AA non-text 1.4.11).",
    "keyboard": "Tab to focus; Enter to submit search; Escape to clear.",
    "screenReader": "Announced as 'search, [placeholder]'."
  },
  "patterns": [
    "OverflowToolbar \u2014 global filter",
    "FilterBar \u2014 text filter alongside select filters",
    "DynamicPageTitle \u2014 global search (rare)"
  ],
  "compatibility": [
    "OverflowToolbar",
    "Toolbar",
    "FilterBar",
    "DynamicPageTitle"
  ],
  "exceptions": [
    "The SAP Figma library does not ship a distinct SearchField component \u2014 plugin maps SearchField \u2192 Input and uses the placeholder as the search prompt."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/SearchField.json`
7. Confirm: "Updated SearchField.json — N fields populated"

────────────────────────────────────────────────────────────

## [106/139] SegmentedButton

# Refresh SAP Fiori guideline: SegmentedButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/segmentedbutton

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/segmentedbutton")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'SegmentedButton' || s.name.endsWith('.SegmentedButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "SegmentedButton"
   - slug: "segmentedbutton"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/segmentedbutton"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "SegmentedButton",
  "slug": "segmented-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/segmentedbutton/",
  "purpose": "Group of mutually exclusive button options shown side-by-side. Used for view-mode switching, mode toggling, or single-select from 2-5 options.",
  "whenToUse": [
    "View mode toggle (List / Grid / Map)",
    "Time period selector (Day / Week / Month / Year)",
    "Filter category toggle when options are mutually exclusive",
    "Wizard step jump (rare; usually use IconTabBar)"
  ],
  "whenNotToUse": [
    "More than 5 options \u2014 use Select or IconTabBar",
    "Multi-select \u2014 use CheckBox group",
    "For primary actions \u2014 use Button",
    "For navigation \u2014 use IconTabBar"
  ],
  "doRules": [
    "Mark exactly one segment as selected at all times",
    "Use Tabs for navigation, SegmentedButton for view-state",
    "Bind selected fill to sapButton_Emphasized_Background",
    "Bind selected text to sapButton_Emphasized_TextColor"
  ],
  "dontRules": [
    "Do not allow zero-selected state (always one is active)",
    "Do not exceed 5 segments \u2014 readability degrades",
    "Do not mix SegmentedButton with Select for the same axis",
    "Do not use SegmentedButton on narrow mobile viewports (use Select)"
  ],
  "layoutGuidance": {
    "placement": "Place SegmentedButton inside a compatible container (OverflowToolbar, DynamicPageTitle, FilterBar).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in OverflowToolbar",
    "Used in DynamicPageTitle",
    "Used in FilterBar"
  ],
  "compatibility": [
    "OverflowToolbar",
    "DynamicPageTitle",
    "FilterBar",
    "Form"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/SegmentedButton.json`
7. Confirm: "Updated SegmentedButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [107/139] Select

# Refresh SAP Fiori guideline: Select

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Select' || s.name.endsWith('.Select'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Select"
   - slug: "select"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/select"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Select",
  "slug": "select",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/select/",
  "purpose": "A dropdown control allowing the user to choose one option from a list of 4\u201312 mutually exclusive items. Compact alternative to RadioButton group.",
  "whenToUse": [
    "4\u201312 mutually exclusive options",
    "When all options should be visible on demand",
    "When the choice does not need search/filter",
    "In forms and filter bars"
  ],
  "whenNotToUse": [
    "Use RadioButton when \u22643 options",
    "Use ComboBox when >12 options or search is needed",
    "Use MultiComboBox for multi-select"
  ],
  "doRules": [
    "Use Select when 4\u201312 mutually exclusive options exist",
    "Use a clear default value when applicable",
    "Pair every Select with a Label",
    "Order options logically (frequency, alphabetical, recency)"
  ],
  "dontRules": [
    "Do not use Select with fewer than 3 options \u2014 use RadioButton",
    "Do not use Select with more than 12 options \u2014 use ComboBox with search",
    "Do not nest Select inside Select"
  ],
  "layoutGuidance": {
    "placement": "Inside Form, FilterBar, Dialog body.",
    "sizing": "Default 256px wide; resizable.",
    "spacing": "8px vertical between fields.",
    "alignment": "Left-aligned with Label above or to the left."
  },
  "contentGuidance": {
    "labelLength": "Option text \u2264 30 chars preferred.",
    "contentRules": [
      "Use sentence case",
      "Avoid repetitive words across options"
    ],
    "examples": [
      "Cloud Integration",
      "Integration Flow",
      "API"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width of form column",
    "L": "Full width of form column",
    "M": "Single column stacked",
    "S": "Native mobile select picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter/Space opens dropdown; arrow keys traverse options",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with a Label component",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus ring on closed state; option focus visible when open",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "Selected value announced when changed"
    }
  ],
  "patterns": [
    "Form field",
    "Filter dropdown"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "SimpleForm",
      "Toolbar"
    ],
    "incompatible": [
      "Without a Label"
    ]
  },
  "exceptions": [
    "When options have icons, use Select with icon+text variant"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Select.json`
7. Confirm: "Updated Select.json — N fields populated"

────────────────────────────────────────────────────────────

## [108/139] ShellBar

# Refresh SAP Fiori guideline: ShellBar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shell-bar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shell-bar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ShellBar' || s.name.endsWith('.ShellBar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ShellBar"
   - slug: "shell-bar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shell-bar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ShellBar",
  "slug": "shell-bar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/shell-bar/",
  "purpose": "The top-level application header bar that displays product branding, primary navigation, search, notifications, and user account. Fixed across all viewports.",
  "whenToUse": [
    "As the topmost element of every SAP Fiori application",
    "To provide consistent product identity and global navigation",
    "When users need persistent access to search, notifications, and account",
    "To house the hamburger menu trigger for the SideNavigation"
  ],
  "whenNotToUse": [
    "Inside dialogs or popovers",
    "On printed views or PDFs",
    "For embedded UI inside another application"
  ],
  "doRules": [
    "Place ShellBar as the first node in screen hierarchy",
    "Use Branding Button slot for product name (max 2 lines)",
    "Show only icons users need \u2014 hide others via boolean variants",
    "Keep ShellBar height fixed at 52px regardless of variant",
    "Use ShellSearch for global search; Shell icon buttons for global actions"
  ],
  "dontRules": [
    "Do not place ShellBar inside another container with padding",
    "Do not add custom buttons outside the supported slots",
    "Do not change ShellBar background color \u2014 it is locked to sapShellColor",
    "Do not duplicate ShellBar across nested views"
  ],
  "layoutGuidance": {
    "placement": "Topmost element, full viewport width, fixed position.",
    "sizing": "Height 52px. Width = viewport width.",
    "spacing": "Horizontal padding 48px (Size XL/L), 16px (M), 8px (S).",
    "alignment": "Branding left, navigation center, actions+avatar right."
  },
  "contentGuidance": {
    "labelLength": "Brand text \u2264 2 lines. Avatar shows initials or photo.",
    "contentRules": [
      "Product name in Semibold Duplex 16px",
      "Use the SAP logo only when authorized",
      "Show notifications badge with count"
    ],
    "examples": [
      "SAP Integration Suite",
      "SAP S/4HANA Cloud"
    ]
  },
  "responsiveBehavior": {
    "XL": "Size=XL variant \u2014 full layout with all slots visible",
    "L": "Size=L variant \u2014 full layout",
    "M": "Size=M variant \u2014 middle slots may collapse to overflow",
    "S": "Size=S variant \u2014 minimal: hamburger + brand + avatar; rest in overflow"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Brand text contrast \u2265 4.5:1 against shell background",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "All shell icon buttons MUST have tooltips",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "keyboard",
      "requirement": "Tab order: hamburger \u2192 brand \u2192 middle \u2192 right \u2192 avatar",
      "wcag": "2.4.3 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus indicator on every interactive shell element",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "Notification badge state announced via aria-live"
    }
  ],
  "patterns": [
    "Application shell",
    "Global navigation",
    "Cross-app search"
  ],
  "compatibility": {
    "worksWith": [
      "Avatar",
      "Shell Search",
      "Shell Icon Button",
      "Branding Button",
      "User Menu",
      "SideNavigation"
    ],
    "incompatible": [
      "Inside any container",
      "Stacked with another header"
    ]
  },
  "exceptions": [
    "Hamburger variant=False when SideNavigation is permanently visible",
    "Joule (AI Copilot) button available only when AI features enabled"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ShellBar.json`
7. Confirm: "Updated ShellBar.json — N fields populated"

────────────────────────────────────────────────────────────

## [109/139] ShellSearch

# Refresh SAP Fiori guideline: ShellSearch

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shellbar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shellbar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ShellSearch' || s.name.endsWith('.ShellSearch'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ShellSearch"
   - slug: "shellbar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/shellbar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ShellSearch",
  "slug": "shell-bar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/shell-bar/",
  "purpose": "A search field mounted inside the ShellBar for app-wide or global search. Distinct from an inline SearchField that filters content on a page. Provides a persistent entry point to search from anywhere in the app.",
  "whenToUse": [
    "As the global search affordance in ShellBar",
    "For cross-page / cross-object search",
    "In apps where search is a primary user path",
    "When user might arrive on any page and want to find something"
  ],
  "whenNotToUse": [
    "For page-scoped filtering \u2014 use SearchField in FilterBar",
    "For a settings quick-find \u2014 use inline SearchField",
    "For per-page search \u2014 that's SearchField in the DynamicPageTitle",
    "In apps without cross-page search (leave the ShellBar clean)"
  ],
  "doRules": [
    "Support keyboard focus via 'S' shortcut or Cmd/Ctrl+K",
    "Show typeahead suggestions grouped by category (Objects \u00b7 Actions \u00b7 Help)",
    "Persist recent searches for the user",
    "Take the user to a search results page on Enter"
  ],
  "dontRules": [
    "Do not use for page-scoped operations \u2014 global scope only",
    "Do not omit the placeholder \u2014 user needs to know what's searchable",
    "Do not silently swallow input if there's no results \u2014 say 'No matches'",
    "Do not require a specific format \u2014 accept free-text"
  ],
  "layoutGuidance": {
    "placement": "Inside ShellBar, typically right of brand area",
    "sizing": "Expandable \u2014 icon at rest, ~400\u2013600px wide when expanded",
    "spacing": "16px right margin from adjacent ShellBar items",
    "alignment": "Vertically centered in the ShellBar"
  },
  "contentGuidance": {
    "labelLength": "Placeholder \u2264 30 chars",
    "contentRules": "Placeholder hints at scope ('Search all objects\u2026')",
    "examples": [
      "\"Search everything...\"",
      "\"Find people, files, or actions\""
    ]
  },
  "responsiveBehavior": {
    "XL": "Expanded field always visible",
    "L": "Expanded on hover/focus",
    "M": "Icon at rest, expands on tap",
    "S": "Icon only; opens full-screen search overlay on tap"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)",
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)"
    ],
    "requirements": [
      "role='search' on wrapping landmark",
      "aria-label='Search'",
      "Global keyboard shortcut announced in tooltip",
      "Suggestions announced via aria-live='polite'"
    ]
  },
  "patterns": [
    "Global app search",
    "Cross-object find",
    "Fiori Launchpad search"
  ],
  "compatibility": {
    "allowedWith": [
      "ShellBar (only)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any parent other than ShellBar"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ShellSearch.json`
7. Confirm: "Updated ShellSearch.json — N fields populated"

────────────────────────────────────────────────────────────

## [110/139] SideNavigation

# Refresh SAP Fiori guideline: SideNavigation

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/sidenavigation

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/sidenavigation")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'SideNavigation' || s.name.endsWith('.SideNavigation'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "SideNavigation"
   - slug: "sidenavigation"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/sidenavigation"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "SideNavigation",
  "slug": "side-navigation",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/side-navigation/",
  "purpose": "A vertical navigation rail at the left side of the application providing primary navigation. Can be expanded (showing labels) or collapsed (icons only).",
  "whenToUse": [
    "For primary application navigation when there are 5+ top-level destinations",
    "When multi-level hierarchy needs to be shown",
    "For long-running task views where consistent navigation is important"
  ],
  "whenNotToUse": [
    "For \u22644 top-level destinations \u2014 use IconTabBar instead",
    "For one-time wizards or guided flows",
    "When horizontal space is severely constrained"
  ],
  "doRules": [
    "Use Expanded variant when sidebar width \u2265 224px",
    "Use Collapsed (icon-only) when space is constrained",
    "Group related items under collapsible Navigation Group",
    "Mark current page with Selected state"
  ],
  "dontRules": [
    "Do not place more than 2 levels of nesting",
    "Do not mix icons-only and icon+label items in same group",
    "Do not put primary actions in side nav \u2014 use ShellBar or toolbar"
  ],
  "layoutGuidance": {
    "placement": "Left side, full viewport height, below ShellBar.",
    "sizing": "224\u2013256px Expanded, 48px Collapsed.",
    "spacing": "4px between items.",
    "alignment": "Items left-aligned, icons centered in 16px box."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words per item.",
    "contentRules": [
      "Use nouns for destinations",
      "Maintain stable order",
      "Group by domain"
    ],
    "examples": [
      "Home",
      "Discover",
      "Design",
      "Integrations and APIs"
    ]
  },
  "responsiveBehavior": {
    "XL": "Expanded by default with all items visible",
    "L": "Expanded by default",
    "M": "Collapsed by default, expand on hover/click",
    "S": "Hidden \u2014 accessed via hamburger menu in ShellBar"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab through items in DOM order; arrow keys traverse hierarchy",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus indicator on focused nav item",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Each item needs accessible name; icon-only items need aria-label",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Current page indicated by aria-current=page"
    }
  ],
  "patterns": [
    "Primary navigation",
    "Hierarchical menu",
    "Application shell"
  ],
  "compatibility": {
    "worksWith": [
      "NavigationItem",
      "ShellBar",
      "AppLayout"
    ],
    "incompatible": [
      "Dialog",
      "Panel content area"
    ]
  },
  "exceptions": [
    "Floating variant for overflow on smaller viewports",
    "Collapsed state hides labels but preserves icons + tooltips"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/SideNavigation.json`
7. Confirm: "Updated SideNavigation.json — N fields populated"

────────────────────────────────────────────────────────────

## [111/139] SimpleForm

# Refresh SAP Fiori guideline: SimpleForm

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/simple-form

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/simple-form")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'SimpleForm' || s.name.endsWith('.SimpleForm'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "SimpleForm"
   - slug: "simple-form"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/simple-form"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "SimpleForm",
  "slug": "simple-form",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/simple-form/",
  "purpose": "Simplified Form alternative \u2014 automatically lays out Label + Input pairs in responsive columns. Less verbose than Form, more rigid.",
  "whenToUse": [
    "Standard label-input form layouts",
    "Settings pages",
    "Object edit screens with mostly text/select fields"
  ],
  "whenNotToUse": [
    "Custom field layouts \u2014 use Form",
    "Single-field input \u2014 use Input",
    "Multi-line data entry \u2014 use multiple Forms"
  ],
  "doRules": [
    "Group related fields with FormContainer",
    "Use FormElement for each field row",
    "Set responsive layout (1 col mobile, 2 col tablet, 3 col desktop)"
  ],
  "dontRules": [
    "Do not mix SimpleForm with Form in the same screen",
    "Do not omit Labels",
    "Do not use SimpleForm for complex layouts"
  ],
  "layoutGuidance": {
    "placement": "Place SimpleForm inside a compatible container (DynamicPage, Panel, Dialog).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for forms.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPage",
    "Used inside Panel",
    "Used inside Dialog"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Dialog",
    "ObjectPageSection"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/SimpleForm.json`
7. Confirm: "Updated SimpleForm.json — N fields populated"

────────────────────────────────────────────────────────────

## [112/139] Slider

# Refresh SAP Fiori guideline: Slider

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/slider

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/slider")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Slider' || s.name.endsWith('.Slider'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Slider"
   - slug: "slider"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/slider"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Slider",
  "slug": "slider",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/slider/",
  "purpose": "A single-value selection along a numeric range. Visual representation of value relative to min/max.",
  "whenToUse": [
    "Continuous numeric input where precision is less important",
    "Visual feedback of value position (volume, brightness, opacity)",
    "When the relationship to min/max matters visually"
  ],
  "whenNotToUse": [
    "When precise value entry required \u2014 use Input or StepInput",
    "For values without clear min/max",
    "For multi-select \u2014 use RangeSlider"
  ],
  "doRules": [
    "Use for continuous numeric input where precision is less important",
    "Show current value via tooltip on handle",
    "Show min/max labels at endpoints",
    "Allow keyboard adjustment via arrow keys"
  ],
  "dontRules": [
    "Do not use Slider when exact value entry is required \u2014 use Input",
    "Do not use without clear min/max",
    "Do not exceed 7 visible labels on the scale"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog body, settings panels.",
    "sizing": "Full width of container.",
    "spacing": "16px vertical between sliders.",
    "alignment": "Handle position reflects value."
  },
  "contentGuidance": {
    "labelLength": "Value shown as tooltip.",
    "contentRules": [
      "Tooltip shows current value",
      "Endpoints show min/max"
    ],
    "examples": [
      "0",
      "50",
      "100"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width with tooltip",
    "L": "Full width with tooltip",
    "M": "Full width",
    "S": "Full width; touch target enlarged"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys move; PageUp/Down jump; Home/End jump to bounds",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label; show current value visibly",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Value announced as percentage or absolute",
      "wcag": "4.1.2 (A)"
    }
  ],
  "patterns": [
    "Numeric range selection",
    "Setting adjustment"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form"
    ],
    "incompatible": [
      "Without bounds"
    ]
  },
  "exceptions": [
    "enableTickmarks shows tick marks at step intervals"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Slider.json`
7. Confirm: "Updated Slider.json — N fields populated"

────────────────────────────────────────────────────────────

## [113/139] SplitButton

# Refresh SAP Fiori guideline: SplitButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'SplitButton' || s.name.endsWith('.SplitButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "SplitButton"
   - slug: "split-button"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/split-button"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "SplitButton",
  "slug": "split-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/split-button/",
  "purpose": "A two-part button: main action on the left, dropdown arrow on the right that opens a Menu of related actions. Combines fast access to the primary action with easy access to variants.",
  "whenToUse": [
    "One primary action with 2-6 close variants (Save / Save as / Save & Close)",
    "The primary action is used ~70% of the time; variants ~30%",
    "Users benefit from a single click for the default and one extra click for alternatives",
    "In toolbars or footers of dialogs where space is limited"
  ],
  "whenNotToUse": [
    "For unrelated actions \u2014 use a MenuButton (no primary bias)",
    "For a single action \u2014 use Button",
    "For >6 variants \u2014 use MenuButton or dedicated menu",
    "When all variants are equally likely \u2014 use a Segmented Button or Menu"
  ],
  "doRules": [
    "Make the visible label the most-used variant",
    "Include the current variant in the dropdown as the highlighted item",
    "Group related variants together in the menu",
    "Use type=Emphasized only if the primary action is truly the primary screen action"
  ],
  "dontRules": [
    "Do not use for destructive actions in the main button \u2014 accidental clicks",
    "Do not hide the dropdown arrow \u2014 must be visible",
    "Do not swap the main action based on last selection (surprises users)",
    "Do not use inside table cells (too small)"
  ],
  "layoutGuidance": {
    "placement": "Toolbars, dialog footers, form action rows",
    "sizing": "Height 32px compact, 40px cozy; width hugs content",
    "spacing": "Standard button spacing (8px)",
    "alignment": "Right-aligned in footer, left-aligned in toolbar"
  },
  "contentGuidance": {
    "labelLength": "Main action \u2264 20 chars",
    "contentRules": "Main label is verb-first; menu items are verb-first variants",
    "examples": [
      "Save \u25bc  (menu: Save \u00b7 Save as \u00b7 Save & Close)"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full label + arrow",
    "L": "Full label + arrow",
    "M": "Full label + arrow",
    "S": "May collapse to icon + arrow"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "Main button and arrow are separate focusable elements",
      "Arrow has aria-haspopup and aria-expanded",
      "Keyboard: Enter on main activates primary; Down opens menu",
      "Screen reader announces both parts distinctly"
    ]
  },
  "patterns": [
    "Toolbar with primary action",
    "Dialog footer with variants",
    "Object header actions"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "Bar",
      "DynamicPageTitle",
      "ObjectHeader"
    ],
    "forbiddenWith": [
      "Table cells",
      "Dense List rows"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/SplitButton.json`
7. Confirm: "Updated SplitButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [114/139] StandardListItem

# Refresh SAP Fiori guideline: StandardListItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/standardlistitem

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/standardlistitem")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'StandardListItem' || s.name.endsWith('.StandardListItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "StandardListItem"
   - slug: "standardlistitem"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/standardlistitem"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "StandardListItem",
  "slug": "list",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/list/",
  "purpose": "A standard item in a List with title, description, info, and optional icon. Most common list item type.",
  "whenToUse": [
    "As child of List for simple items",
    "For master list rows",
    "For notification items"
  ],
  "whenNotToUse": [
    "For complex layouts \u2014 use CustomListItem",
    "For tabular data \u2014 use ColumnListItem in a Table"
  ],
  "doRules": [
    "Use Navigation type when item leads to detail",
    "Pair title with optional description and icon",
    "Use info property for trailing status/value",
    "Keep title short \u2014 truncate with ellipsis if long"
  ],
  "dontRules": [
    "Do not put complex layouts inside StandardListItem \u2014 use CustomListItem",
    "Do not omit type when item is interactive",
    "Do not stack multiple long lines"
  ],
  "layoutGuidance": {
    "placement": "Inside List items aggregation.",
    "sizing": "Height 48px Compact / 64px Cozy.",
    "spacing": "Separator below.",
    "alignment": "Icon left, title+description center-left, info right."
  },
  "contentGuidance": {
    "labelLength": "Title 1\u20138 words.",
    "contentRules": [
      "Title bold, description regular",
      "Info trailing right"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full layout",
    "L": "Full layout",
    "M": "Full layout",
    "S": "Description may wrap"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter activates Navigation type",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Visible focus ring",
      "wcag": "2.4.7 (AA)"
    }
  ],
  "patterns": [
    "List item",
    "Master list row"
  ],
  "compatibility": {
    "worksWith": [
      "List"
    ],
    "incompatible": [
      "Outside List",
      "As table row"
    ]
  },
  "exceptions": [
    "When icon is large product image, use ProductListItem instead"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/StandardListItem.json`
7. Confirm: "Updated StandardListItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [115/139] StepInput

# Refresh SAP Fiori guideline: StepInput

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/stepinput

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/stepinput")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'StepInput' || s.name.endsWith('.StepInput'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "StepInput"
   - slug: "stepinput"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/stepinput"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "StepInput",
  "slug": "step-input",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/step-input/",
  "purpose": "A bounded numeric input with up/down stepper buttons. Used for counts and small numeric values with min/max bounds.",
  "whenToUse": [
    "Bounded numeric input with min/max (Qty, count, percent)",
    "Small integer values where stepping is faster than typing",
    "Currency or unit values"
  ],
  "whenNotToUse": [
    "For unbounded numbers \u2014 use Input type=Number",
    "For large numeric ranges (>1000) \u2014 typing is faster",
    "For non-numeric input"
  ],
  "doRules": [
    "Use for bounded numeric input with min/max",
    "Show units when applicable (Qty, %, etc.)",
    "Set step size based on context (1 for counts, 0.1 for decimals)",
    "Default to a sensible starting value"
  ],
  "dontRules": [
    "Do not use for unbounded numbers",
    "Do not use for currency without specialized formatting",
    "Do not allow steps that bypass min/max constraints"
  ],
  "layoutGuidance": {
    "placement": "Form, Toolbar, FilterBar.",
    "sizing": "120px default.",
    "spacing": "8px between fields.",
    "alignment": "Number left, steppers right."
  },
  "contentGuidance": {
    "labelLength": "Numeric value display.",
    "contentRules": [
      "Number formatted to locale",
      "Negative values allowed if min<0"
    ],
    "examples": [
      "1",
      "5",
      "99"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full input + steppers",
    "L": "Full input + steppers",
    "M": "Full input + steppers",
    "S": "Native mobile number input"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Up/Down arrows step value; type to override",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label including units",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Value change announced"
    }
  ],
  "patterns": [
    "Quantity input",
    "Numeric form field"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form"
    ],
    "incompatible": [
      "Without min/max bounds"
    ]
  },
  "exceptions": [
    "displayValuePrecision controls decimal places"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/StepInput.json`
7. Confirm: "Updated StepInput.json — N fields populated"

────────────────────────────────────────────────────────────

## [116/139] Switch

# Refresh SAP Fiori guideline: Switch

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Switch' || s.name.endsWith('.Switch'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Switch"
   - slug: "switch"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Switch",
  "slug": "switch",
  "sourceUrl": "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/switch",
  "purpose": "A UI component used to toggle a setting on or off with a button. It lets users turn individual features on or off to adjust display settings or personalize the application's appearance.",
  "whenToUse": [
    "Set a setting as active or inactive (for example, in a dialog)",
    "Clearly show the current mode or state of a setting",
    "Apply changes that take effect immediately",
    "Use a default switch when you need a simple on/off component with predefined icons and standard colors",
    "Use a semantic switch when the action represents a positive or negative state",
    "Add a descriptive label above or directly before a switch component so users understand which value it controls"
  ],
  "whenNotToUse": [
    "Don't use for selecting multiple options or when extra steps (e.g. a Save button) are required for changes to take effect",
    "Don't use when it's unclear which state the component is displaying \u2014 use a Checkbox instead",
    "Don't include text inside the switch component itself \u2014 this causes localization issues"
  ],
  "doRules": [
    "Use Semantic type (green/red) when the action represents a clearly positive or negative state",
    "Place a label above or directly before the switch to identify what it controls",
    "Add optional text (e.g. 'On'/'Off') when the main label doesn't fully explain active vs inactive",
    "Provide a tooltip when no label is available to give context",
    "Use Compact density for desktop/mouse interactions; Cozy for touch devices"
  ],
  "dontRules": [
    "Don't include text inside the switch handle \u2014 localization breaks the component",
    "Don't use switch when change requires a separate Save action \u2014 use Checkbox instead",
    "Don't truncate labels if avoidable \u2014 allow wrapping; truncate only as last resort"
  ],
  "layoutGuidance": {
    "placement": "Label above or directly before the switch. Side label repositions below the switch when horizontal space is insufficient.",
    "sizing": "Compact mode: smaller height for mouse/keyboard. Cozy mode: larger for touch. Width auto.",
    "spacing": "Label wraps by default. Optional text sits after the switch on the same line.",
    "alignment": "Label above: switch pushed down when label wraps. Label to side: moves below on narrow containers."
  },
  "contentGuidance": {
    "labelLength": "Short and descriptive (e.g. 'Enable Notifications', 'Receive Updates'). One sentence max.",
    "contentRules": [
      "Label must identify what the switch controls",
      "Optional text should be a single word (e.g. 'On'/'Off')",
      "Supports LTR and RTL reading directions",
      "Do not embed text inside the switch handle"
    ],
    "examples": [
      "Enable Notifications",
      "Receive Updates",
      "Dark Mode",
      "Auto-save"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full switch with label and optional text",
    "L": "Full switch with label and optional text",
    "M": "Label may reposition below switch if side-label cannot fit horizontally",
    "S": "Compact \u2192 Cozy for touch; side label moves below switch on narrow containers"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Tab: moves focus to switch. Shift+Tab: navigates backward. Spacebar or Enter/Return: toggles state.",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "focus",
      "requirement": "Focused state displays an additional border around the track as a visible focus indicator.",
      "wcag": "2.4.7 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Provide a tooltip when no visible label is present to identify what the switch controls.",
      "wcag": "4.1.2 (A)"
    },
    {
      "category": "contrast",
      "requirement": "SAP follows WCAG and WAI-ARIA standards. See Accessibility in SAP Fiori and Accessibility Design Tools Handbook.",
      "wcag": "1.4.3 (AA)"
    }
  ],
  "patterns": [
    "Settings panel",
    "Personalization dialog",
    "Display settings toggle",
    "Feature flag control",
    "Form: binary state field"
  ],
  "compatibility": {
    "worksWith": [
      "Dialog",
      "Form",
      "Label",
      "Text",
      "ObjectStatus",
      "Panel",
      "SimpleForm"
    ],
    "incompatible": [
      "Inside Table cells when multiple options need selection \u2014 use Checkbox",
      "When a Save action is required before the change takes effect \u2014 use Checkbox"
    ]
  },
  "exceptions": [
    "Semantic type overrides default on/off colors with green (positive) and red (negative) \u2014 system-defined icons cannot be changed",
    "Hover states are not supported on touch devices"
  ],
  "types": [
    "Default: icon inside handle, default on/off colors (gray/blue)",
    "Semantic: green=positive (on), red=negative (off), system-defined icons",
    "Switch with label: label placed above or before the switch",
    "Switch with optional text: short text after switch explains active/inactive meaning"
  ],
  "figmaNode": "https://www.figma.com/design/SILcWzK5uFghKun9jx6D7c/SAP-Web-UI-Kit?node-id=19-2027",
  "ui5Api": "https://ui5.sap.com/#/api/sap.m.Switch",
  "ui5Samples": "https://ui5.sap.com/#/entity/sap.m.Switch",
  "webComponent": "ui5-switch",
  "version": "v1-148",
  "lastChecked": "2026-07-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Switch.json`
7. Confirm: "Updated Switch.json — N fields populated"

────────────────────────────────────────────────────────────

## [117/139] Table

# Refresh SAP Fiori guideline: Table

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Table' || s.name.endsWith('.Table'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Table"
   - slug: "table"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Table",
  "slug": "responsive-table",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/responsive-table/",
  "purpose": "A tabular display of data with columns, rows, and optional selection. Supports sorting, filtering, multi-select, and inline actions.",
  "whenToUse": [
    "For structured data with multiple aligned columns",
    "When users need to compare items across attributes",
    "For lists requiring bulk actions",
    "When sort/filter functionality is needed"
  ],
  "whenNotToUse": [
    "For fewer than 3 rows \u2014 use List",
    "For complex hierarchical data \u2014 use Tree or TreeTable",
    "For single-record detail \u2014 use Form"
  ],
  "doRules": [
    "Use a clear title in the Table Toolbar",
    "Provide column headers with sort/filter affordances",
    "Use MultiSelect mode when bulk actions exist",
    "Use ResponsiveTable for narrow viewports"
  ],
  "dontRules": [
    "Do not put primary actions inside cells \u2014 use row click or toolbar",
    "Do not use Table for fewer than 3 rows \u2014 use List",
    "Do not stack tables \u2014 provide tabs or filters"
  ],
  "layoutGuidance": {
    "placement": "Below page header and toolbar.",
    "sizing": "Full width of content area.",
    "spacing": "Header 32px, rows 48px Compact / 64px Cozy.",
    "alignment": "Headers left-aligned (numeric right)."
  },
  "contentGuidance": {
    "labelLength": "Cell content varies by column type.",
    "contentRules": [
      "Use ObjectIdentifier for primary cell content",
      "Use ObjectStatus for status values",
      "Truncate long text with ellipsis"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "All columns visible inline",
    "L": "All columns visible; minor columns may collapse",
    "M": "Pop-in behavior \u2014 secondary columns move below primary cell",
    "S": "Card-like layout with stacked attributes"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys navigate cells; Enter activates row action",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Table has caption or aria-label; each column has header",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "contrast",
      "requirement": "Cell text contrast \u2265 4.5:1",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "announcements",
      "requirement": "Row position announced (e.g. \"row 3 of 12\")"
    }
  ],
  "patterns": [
    "List Report",
    "Master list",
    "Bulk action surface"
  ],
  "compatibility": {
    "worksWith": [
      "ColumnListItem",
      "Column",
      "OverflowToolbar",
      "Toolbar"
    ],
    "incompatible": [
      "Inside narrow card",
      "Inside Dialog body without scrolling"
    ]
  },
  "exceptions": [
    "Use AnalyticalTable for grouped/aggregated data",
    "Use TreeTable for hierarchical data"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Table.json`
7. Confirm: "Updated Table.json — N fields populated"

────────────────────────────────────────────────────────────

## [118/139] TableCell

# Refresh SAP Fiori guideline: TableCell

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TableCell' || s.name.endsWith('.TableCell'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TableCell"
   - slug: "table"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/table"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TableCell",
  "slug": "table",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/table/",
  "purpose": "The individual cell of a Table row. Holds display content (Text, Link, ObjectStatus, GenericTag, Avatar) or interactive controls (Input, Select, IconButton) depending on the column type. Aligns to its Column's alignment rule.",
  "whenToUse": [
    "As the atomic unit of a Table row's data",
    "For simple text values, semantic status, or numeric metrics",
    "For inline editing when the column supports it",
    "For row-level action buttons (Edit / Delete / More)"
  ],
  "whenNotToUse": [
    "For complex composed layouts \u2014 restructure into ObjectListItem instead",
    "For nested tables \u2014 tables inside tables are usually the wrong pattern",
    "For long text \u2014 use ObjectListItem or a Card view",
    "For a table used as a layout grid \u2014 use Grid or Auto Layout"
  ],
  "doRules": [
    "Align text-cells to the left, numeric cells to the right",
    "Use ObjectStatus for semantic state; never plain Text with color",
    "Truncate with ellipsis and provide tooltip for full content",
    "Support both display and inline-edit modes if the column is editable"
  ],
  "dontRules": [
    "Do not use color alone for state (fails WCAG 1.4.1)",
    "Do not put more than 2 pieces of content in one cell without visual grouping",
    "Do not use for large text \u2014 cells should be scannable at a glance",
    "Do not omit column alignment (defaults may not match content type)"
  ],
  "layoutGuidance": {
    "placement": "Inside a Table row, aligned to Column",
    "sizing": "Row height 32px compact, 48px cozy; cell width from Column",
    "spacing": "8px horizontal padding, 4px vertical",
    "alignment": "Follows the parent Column's hAlign property"
  },
  "contentGuidance": {
    "labelLength": "Depends on Column type; typically \u2264 40 chars visible",
    "contentRules": "Type-appropriate content: string, number, status, action",
    "examples": [
      "PO-48865",
      "$12,340.00",
      "ObjectStatus 'Pending'"
    ]
  },
  "responsiveBehavior": {
    "XL": "All cells visible",
    "L": "All cells visible",
    "M": "Lower-priority columns hide (via Column's importance)",
    "S": "Only 2-3 highest-priority columns; row expands to show rest"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)",
      "WCAG 2.1 \u00b7 1.4.1 Use of Color (Level A)"
    ],
    "requirements": [
      "role='cell' or 'gridcell' (implicit from <td>)",
      "Complex cell content has accessible name (aria-label if pure icons)",
      "Semantic state paired with icon or text",
      "Interactive cells have visible focus indicator"
    ]
  },
  "patterns": [
    "Data table row",
    "Editable grid",
    "Row actions column"
  ],
  "compatibility": {
    "allowedWith": [
      "Table (as parent only)",
      "Text",
      "Link",
      "ObjectStatus",
      "GenericTag",
      "Avatar",
      "IconButton",
      "Input (edit mode)"
    ],
    "forbiddenWith": [
      "Standalone",
      "Inside Dialog",
      "Inside Panel directly"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TableCell.json`
7. Confirm: "Updated TableCell.json — N fields populated"

────────────────────────────────────────────────────────────

## [119/139] Tabs

# Refresh SAP Fiori guideline: Tabs

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tabs

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tabs")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Tabs' || s.name.endsWith('.Tabs'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Tabs"
   - slug: "tabs"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tabs"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Tabs",
  "slug": "tabs",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/tabs/",
  "purpose": "Top-aligned tabbed navigation with text labels. Visual variant of IconTabBar \u2014 used when tabs do not need icons.",
  "whenToUse": [
    "Page-level tab navigation when icons would add noise",
    "Sub-section navigation on detail pages"
  ],
  "whenNotToUse": [
    "When tabs are critical app-level navigation \u2014 use IconTabBar",
    "When more than ~7 tabs \u2014 use Select or ComboBox"
  ],
  "doRules": [
    "Mark exactly one tab as selected",
    "Bind selected text to sapButton_Emphasized_TextColor",
    "Limit to 7 tabs"
  ],
  "dontRules": [
    "Do not exceed 7 tabs",
    "Do not nest Tabs inside Tabs",
    "Do not hide the selected indicator"
  ],
  "layoutGuidance": {
    "placement": "Place Tabs inside a compatible container (DynamicPage, Panel, Form).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for navigation.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPage",
    "Used inside Panel",
    "Used inside Form"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Form"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Tabs.json`
7. Confirm: "Updated Tabs.json — N fields populated"

────────────────────────────────────────────────────────────

## [120/139] Tag

# Refresh SAP Fiori guideline: Tag

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tag

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tag")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Tag' || s.name.endsWith('.Tag'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Tag"
   - slug: "tag"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tag"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Tag",
  "slug": "tag",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/tag/",
  "purpose": "A categorical label or status indicator. Used for tagging objects with descriptive metadata.",
  "whenToUse": [
    "Category labels on objects (priority, type, status)",
    "Tag clouds for browsing",
    "Visual grouping by category"
  ],
  "whenNotToUse": [
    "For semantic status \u2014 use ObjectStatus",
    "For interactive filters \u2014 use Tokenizer/Token",
    "For navigation \u2014 use Link"
  ],
  "doRules": [
    "Use for categorical labels (status types, tags, badges)",
    "Use consistent colorScheme for the same category",
    "Keep tag text short (1\u20133 words)",
    "Use icon prefix for clarity when needed"
  ],
  "dontRules": [
    "Do not communicate status by color alone \u2014 use ObjectStatus",
    "Do not use long tag text",
    "Do not omit accessible label for icon-only tags"
  ],
  "layoutGuidance": {
    "placement": "ObjectHeader, List, Table cells.",
    "sizing": "Auto width by text.",
    "spacing": "4\u20138px between tags.",
    "alignment": "Inline with surrounding content."
  },
  "contentGuidance": {
    "labelLength": "1\u20133 words.",
    "contentRules": [
      "Use sentence case",
      "Short categorical labels"
    ],
    "examples": [
      "Critical",
      "In Progress",
      "Sales"
    ]
  },
  "responsiveBehavior": {
    "XL": "Inline tags",
    "L": "Inline tags",
    "M": "Inline tags; wrap",
    "S": "Stacked tags or overflow"
  },
  "accessibilityGuidance": [
    {
      "category": "contrast",
      "requirement": "Text contrast \u2265 4.5:1 against tag background",
      "wcag": "1.4.3 (AA)"
    },
    {
      "category": "labeling",
      "requirement": "Tag text alone provides meaning \u2014 do not rely on color",
      "wcag": "1.4.1 (A)"
    }
  ],
  "patterns": [
    "Category label",
    "Tag badge"
  ],
  "compatibility": {
    "worksWith": [
      "ObjectHeader",
      "List",
      "Table"
    ],
    "incompatible": [
      "As primary CTA"
    ]
  },
  "exceptions": [
    "Inverted tag for high-emphasis use"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Tag.json`
7. Confirm: "Updated Tag.json — N fields populated"

────────────────────────────────────────────────────────────

## [121/139] Text

# Refresh SAP Fiori guideline: Text

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/text

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/text")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Text' || s.name.endsWith('.Text'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Text"
   - slug: "text"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/text"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Text",
  "slug": "text",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/text/",
  "purpose": "Plain text node for body content, descriptions, paragraph copy, and inline labels. The most basic text primitive in the SAP UI vocabulary.",
  "whenToUse": [
    "Body copy, descriptions, paragraphs in cards, panels, dialogs",
    "Secondary text in object cells (after the primary title)",
    "Help text, hint text, supporting copy in forms",
    "Static labels that are NOT associated with an input (those use Label)"
  ],
  "whenNotToUse": [
    "For headings \u2014 use Title with appropriate Level",
    "For interactive elements \u2014 use Link or Button",
    "For input labels \u2014 use Label so screen readers associate it",
    "For status messages \u2014 use MessageStrip"
  ],
  "doRules": [
    "Bind fill to sapList_TextColor (primary) or sapContent_LabelColor (subtle/secondary)",
    "Use SAP font family 72 at standard sizes (12, 14, 16)",
    "Enable wrapping for long text; set maxLines to truncate gracefully",
    "Keep paragraph text under ~3 sentences in cards and condensed contexts"
  ],
  "dontRules": [
    "Do not use Text where bold heading semantics apply \u2014 use Title",
    "Do not hardcode font sizes outside the SAP scale",
    "Do not put Text inside a table cell when ObjectIdentifier or ObjectAttribute is appropriate",
    "Do not use Text for status \u2014 use ObjectStatus or MessageStrip"
  ],
  "layoutGuidance": {
    "placement": "Inline within Form fields, Panels, Cards, Dialogs, and DynamicPageHeader slots.",
    "sizing": "Auto height; width inherits from parent. Set textAutoResize to HEIGHT for wrap.",
    "spacing": "8px line spacing implicit via font metrics; 16px between paragraphs.",
    "alignment": "Default left-aligned (Begin); use End only for numeric or right-rail data."
  },
  "contentGuidance": {
    "labelLength": "Body 1-3 sentences; description 1 sentence; label 1-3 words.",
    "contentRules": [
      "Use plain language \u2014 avoid jargon",
      "Localize all text",
      "Capitalize only the first letter (sentence case)",
      "End sentences with a period; omit period from single-fragment labels"
    ],
    "examples": [
      "Package containing employee data replication integration scenarios",
      "Created by ranjan@sap.com on Mar 10, 2026",
      "API",
      "Active"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full text shown.",
    "L": "Full text shown.",
    "M": "Wrapping enabled where width contracts.",
    "S": "May truncate with maxLines or wrap; ensure readability."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to plain text node (no aria role). Inherits from parent landmark.",
    "contrast": "Body text contrast \u2265 4.5:1 against bg (WCAG AA).",
    "keyboard": "Not interactive; tab passes over Text nodes.",
    "screenReader": "Announced as plain text within its parent landmark."
  },
  "patterns": [
    "Card body \u2014 Text for description",
    "Object header \u2014 Text for subtitle / metadata",
    "Form \u2014 Text for help/hint",
    "Empty state \u2014 Text for explanatory copy"
  ],
  "compatibility": [
    "Form",
    "Panel",
    "Dialog",
    "DynamicPage",
    "Card",
    "Table",
    "List",
    "ColumnListItem"
  ],
  "exceptions": [
    "Native renderer \u2014 no SAP instance for sap.m.Text. Plugin creates figma.createText() with bound SAP variables.",
    "When wrapping is critical (long descriptions), explicitly set props.wrap=true."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Text.json`
7. Confirm: "Updated Text.json — N fields populated"

────────────────────────────────────────────────────────────

## [122/139] TextArea

# Refresh SAP Fiori guideline: TextArea

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/textarea

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/textarea")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TextArea' || s.name.endsWith('.TextArea'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TextArea"
   - slug: "textarea"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/textarea"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TextArea",
  "slug": "text-area",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/text-area/",
  "purpose": "A multi-line text input for free-form content. Supports auto-grow, character counting, and value state validation.",
  "whenToUse": [
    "Multi-line free text (comments, descriptions, notes)",
    "When user input may exceed one line",
    "For long-form input in dialogs and forms"
  ],
  "whenNotToUse": [
    "For single-line input \u2014 use Input",
    "For structured multi-value \u2014 use MultiInput",
    "For rich text \u2014 use rich text editor"
  ],
  "doRules": [
    "Use for multi-line free text (comments, descriptions)",
    "Set rows to indicate expected length",
    "Show character counter when maxLength applies",
    "Enable growing=true to expand as user types"
  ],
  "dontRules": [
    "Do not use for single-line input \u2014 use Input",
    "Do not omit Label",
    "Do not set maxLength below realistic length"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog, Panel.",
    "sizing": "Width fills container; height by rows.",
    "spacing": "8px vertical between fields.",
    "alignment": "Left-aligned with Label above."
  },
  "contentGuidance": {
    "labelLength": "Placeholder hints expected content.",
    "contentRules": [
      "Use placeholder for examples",
      "Show character count near maxLength"
    ],
    "examples": [
      "Add a comment...",
      "Describe the issue"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full width of form column",
    "L": "Full width of form column",
    "M": "Single column stacked",
    "S": "Full viewport width"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Enter creates newline; Tab moves focus",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    },
    {
      "category": "announcements",
      "requirement": "Character count announced when maxLength set",
      "wcag": "4.1.3 (AA)"
    }
  ],
  "patterns": [
    "Comment field",
    "Description input",
    "Long-form entry"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form",
      "Dialog"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "growing=true allows auto-resize on content"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TextArea.json`
7. Confirm: "Updated TextArea.json — N fields populated"

────────────────────────────────────────────────────────────

## [123/139] TimePicker

# Refresh SAP Fiori guideline: TimePicker

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timepicker

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timepicker")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TimePicker' || s.name.endsWith('.TimePicker'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TimePicker"
   - slug: "timepicker"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timepicker"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TimePicker",
  "slug": "time-picker",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/time-picker/",
  "purpose": "A single time-of-day input. User can type or use up/down spinners for hours, minutes, optional seconds.",
  "whenToUse": [
    "Time-only entry (alarm, business hours, meeting start)",
    "When time without date is meaningful"
  ],
  "whenNotToUse": [
    "When date is also required \u2014 use DateTimePicker",
    "For durations \u2014 use Input type=Number"
  ],
  "doRules": [
    "Use when only time-of-day is needed",
    "Match locale 12/24 hour format",
    "Show AM/PM toggle when applicable"
  ],
  "dontRules": [
    "Do not use for date+time \u2014 use DateTimePicker",
    "Do not allow seconds when minute precision suffices"
  ],
  "layoutGuidance": {
    "placement": "Form, Dialog.",
    "sizing": "160px default.",
    "spacing": "8px vertical between fields.",
    "alignment": "Field left, spinner right."
  },
  "contentGuidance": {
    "labelLength": "Format hint in placeholder.",
    "contentRules": [
      "Locale 12/24h",
      "AM/PM in 12h format"
    ],
    "examples": [
      "HH:mm",
      "09:30",
      "02:45 PM"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full input + spinners",
    "L": "Full input + spinners",
    "M": "Full input + spinners",
    "S": "Native mobile time picker"
  },
  "accessibilityGuidance": [
    {
      "category": "keyboard",
      "requirement": "Arrow keys adjust hours/minutes; Tab moves between fields",
      "wcag": "2.1.1 (A)"
    },
    {
      "category": "labeling",
      "requirement": "Pair with Label",
      "wcag": "1.3.1 (A)"
    }
  ],
  "patterns": [
    "Time entry",
    "Schedule field"
  ],
  "compatibility": {
    "worksWith": [
      "Label",
      "Form"
    ],
    "incompatible": [
      "Without Label"
    ]
  },
  "exceptions": [
    "Step value (e.g. 15-min intervals)"
  ],
  "version": "2026.Q2",
  "lastChecked": "2026-06-25"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TimePicker.json`
7. Confirm: "Updated TimePicker.json — N fields populated"

────────────────────────────────────────────────────────────

## [124/139] Timeline

# Refresh SAP Fiori guideline: Timeline

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Timeline' || s.name.endsWith('.Timeline'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Timeline"
   - slug: "timeline"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Timeline",
  "slug": "timeline",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/timeline/",
  "purpose": "Vertical sequence of timestamped events. Used for activity feeds, audit logs, change history, task timelines.",
  "whenToUse": [
    "Activity feed of recent events on an object",
    "Audit log / change history",
    "Sequence of related events in chronological order"
  ],
  "whenNotToUse": [
    "Hierarchical data \u2014 use Tree",
    "Tabular comparison \u2014 use Table",
    "Live chat \u2014 use FeedListItem in a List"
  ],
  "doRules": [
    "Sort newest-first by default",
    "Show user + action + timestamp per event",
    "Use TimelineItem children",
    "Bind text to sapList_TextColor"
  ],
  "dontRules": [
    "Do not paginate Timeline visibly \u2014 show recent N + a \"See more\" link",
    "Do not interleave with other content"
  ],
  "layoutGuidance": {
    "placement": "Place Timeline inside a compatible container (DynamicPage, Panel, Card).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for data display.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPage",
    "Used inside Panel",
    "Used inside Card"
  ],
  "compatibility": [
    "DynamicPage",
    "Panel",
    "Card"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Timeline.json`
7. Confirm: "Updated Timeline.json — N fields populated"

────────────────────────────────────────────────────────────

## [125/139] TimelineItem

# Refresh SAP Fiori guideline: TimelineItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline-item

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline-item")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TimelineItem' || s.name.endsWith('.TimelineItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TimelineItem"
   - slug: "timeline-item"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/timeline-item"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TimelineItem",
  "slug": "timeline-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/timeline-item/",
  "purpose": "Single event in a Timeline. Has user/source, action description, timestamp, optional content body.",
  "whenToUse": [
    "Inside Timeline",
    "Each timestamped event in an activity feed"
  ],
  "whenNotToUse": [
    "Outside Timeline",
    "For a standalone activity card \u2014 use Card or ColumnListItem"
  ],
  "doRules": [
    "Always include user + timestamp",
    "Use ObjectStatus or icon for event type",
    "Keep description concise (1-2 lines)"
  ],
  "dontRules": [
    "Do not omit timestamp",
    "Do not embed long forms \u2014 link out instead",
    "Do not nest TimelineItem inside TimelineItem"
  ],
  "layoutGuidance": {
    "placement": "Place TimelineItem inside a compatible container (Timeline).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for data display.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Timeline"
  ],
  "compatibility": [
    "Timeline"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TimelineItem.json`
7. Confirm: "Updated TimelineItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [126/139] Title

# Refresh SAP Fiori guideline: Title

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/title

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/title")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Title' || s.name.endsWith('.Title'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Title"
   - slug: "title"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/title"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Title",
  "slug": "title",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/title/",
  "purpose": "Heading text that labels a page, section, or grouped content. Title carries semantic heading level (H1-H6) which screen readers use for navigation; visual size is determined by the level variant.",
  "whenToUse": [
    "Page-level H1 \u2014 exactly one per page, inside DynamicPageTitle.slots.heading",
    "Section H2 \u2014 for major sections of an Object Page or detail screen",
    "Subsection H3-H4 \u2014 for grouped content within a section",
    "Toolbar title \u2014 when an OverflowToolbar needs a left-aligned descriptive label (e.g. 'Artifacts (47)')",
    "Panel header \u2014 when a Panel needs an accessible heading"
  ],
  "whenNotToUse": [
    "As body text or paragraphs \u2014 use Text or Label instead",
    "As interactive control labels \u2014 use Label and associate via labelFor",
    "As status messages or hints \u2014 use MessageStrip or Text",
    "Inside table cells \u2014 use plain text with appropriate SAP text style binding"
  ],
  "doRules": [
    "Use exactly one H1 per page (page title in DynamicPageTitle)",
    "Use H2 for major sections, H3 for subsections; do NOT skip levels (H1\u2192H3 breaks screen reader navigation)",
    "Keep titles short \u2014 1 line where possible, max 2 lines on wrap",
    "Bind text color to sapTitleColor for page/section, sapList_TextColor for toolbar context",
    "Use the Level/TitleStyle variant \u2014 don't hardcode font size"
  ],
  "dontRules": [
    "Do not skip heading levels (H1\u2192H3 breaks accessibility tree)",
    "Do not hardcode color \u2014 bind to a sapTitle*/sapList_TextColor variable",
    "Do not use Title for non-heading content (status, hints, interactive labels)",
    "Do not repeat the same title text multiple times at the same level in a single section",
    "Do not use ALL CAPS \u2014 relies on visual style not text content"
  ],
  "layoutGuidance": {
    "placement": "Top of the content area or section. Page H1 lives inside DynamicPageTitle.slots.heading.",
    "sizing": "H1 = 28px Bold, H2 = 24px, H3 = 20px, H4 = 18px (page title), H5 = 16px, H6 = 14px.",
    "spacing": "Match SAP heading rhythm: 16px below H1; 12px below H2; 8px below H3.",
    "alignment": "Left-aligned to content edge. Page title aligns with first content column."
  },
  "contentGuidance": {
    "labelLength": "Page title: 1-5 words. Section: 1-3 words. Toolbar title: 1-3 words plus optional count e.g. 'Artifacts (47)'.",
    "contentRules": [
      "Use sentence case unless brand requires title case",
      "Avoid punctuation at the end (period, colon)",
      "Localize all titles",
      "For counts, parenthesize: 'Artifacts (47)' not 'Artifacts: 47' or '47 Artifacts'"
    ],
    "examples": [
      "Purchase Order",
      "Invoice Exceptions",
      "Artifacts (47)",
      "AKS_PKG",
      "Suppliers"
    ]
  },
  "responsiveBehavior": {
    "XL": "Full size at H1 28px / H2 24px / etc.",
    "L": "Full size at all levels.",
    "M": "Page H1 may scale to 24px on dense mobile-tablet hybrid layouts.",
    "S": "Page H1 scales to 20px; sub-headings may be reduced one step."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to <h1>-<h6> HTML element via Level/TitleStyle variant. Screen readers expose heading level for navigation.",
    "contrast": "Title text contrast \u2265 4.5:1 normal (\u2265 3:1 large text \u2265 18.67px bold per WCAG AA).",
    "keyboard": "Not interactive (heading is non-interactive). Skip-to-heading shortcuts (H key in screen readers) jump between Title elements.",
    "screenReader": "Announced as 'heading, level N, [text]'."
  },
  "patterns": [
    "DynamicPageTitle.slots.heading \u2014 page H1",
    "Object Page section header \u2014 H2",
    "OverflowToolbar \u2014 left-aligned toolbar title (e.g. 'Artifacts (47)')",
    "Panel \u2014 header label",
    "Form \u2014 section grouping"
  ],
  "compatibility": [
    "DynamicPageTitle",
    "ObjectPageLayout",
    "Panel",
    "Form",
    "OverflowToolbar",
    "Toolbar",
    "Dialog"
  ],
  "exceptions": [
    "The SAP Figma library does not ship a standalone Title instance \u2014 the plugin aliases Title to the SAP Label instance for rendered output, OR uses a native text node bound to SAP text style + color variables.",
    "Native text rendering is acceptable as long as the fill is bound to a SAP variable (sapTitleColor or sapList_TextColor)."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Title.json`
7. Confirm: "Updated Title.json — N fields populated"

────────────────────────────────────────────────────────────

## [127/139] ToggleButton

# Refresh SAP Fiori guideline: ToggleButton

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toggle-button

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toggle-button")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ToggleButton' || s.name.endsWith('.ToggleButton'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ToggleButton"
   - slug: "toggle-button"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toggle-button"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ToggleButton",
  "slug": "toggle-button",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/toggle-button/",
  "purpose": "Stateful Button \u2014 visually shows pressed/unpressed state. Used for binary toggles that aren't pure switches (e.g. format toolbar bold/italic, filter chip on/off).",
  "whenToUse": [
    "Toolbar format toggles (Bold / Italic / Underline)",
    "Filter mode toggle in a toolbar",
    "When state must be visually distinct from disabled"
  ],
  "whenNotToUse": [
    "Single-action triggers \u2014 use Button",
    "Multiple mutually-exclusive options \u2014 use SegmentedButton",
    "Enable/disable a value \u2014 use Switch"
  ],
  "doRules": [
    "Show pressed state via fill, not just text",
    "Bind pressed fill to sapButton_Emphasized_Background",
    "Provide aria-pressed attribute equivalent"
  ],
  "dontRules": [
    "Do not use without a clear pressed/unpressed visual distinction",
    "Do not stack multiple ToggleButtons that are actually mutually exclusive \u2014 use SegmentedButton"
  ],
  "layoutGuidance": {
    "placement": "Place ToggleButton inside a compatible container (OverflowToolbar, Toolbar, Form).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for button.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside OverflowToolbar",
    "Used inside Toolbar",
    "Used inside Form"
  ],
  "compatibility": [
    "OverflowToolbar",
    "Toolbar",
    "Form"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ToggleButton.json`
7. Confirm: "Updated ToggleButton.json — N fields populated"

────────────────────────────────────────────────────────────

## [128/139] Token

# Refresh SAP Fiori guideline: Token

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/token

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/token")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Token' || s.name.endsWith('.Token'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Token"
   - slug: "token"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/token"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Token",
  "slug": "token",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/token/",
  "purpose": "A single tag-like chip representing a filter value, selected option, or entity reference. Always lives inside a Tokenizer or MultiInput.",
  "whenToUse": [
    "Inside a Tokenizer to show selected filter values",
    "Inside MultiInput / MultiComboBox to show selected options",
    "In FilterBar to show active filters",
    "Anywhere users select multiple values from a set"
  ],
  "whenNotToUse": [
    "Standalone \u2014 Token only works inside Tokenizer or MultiInput",
    "For navigation \u2014 use Link",
    "For action \u2014 use Button",
    "For status \u2014 use ObjectStatus or Tag"
  ],
  "doRules": [
    "Provide concise text (1-3 words)",
    "Include a delete (\u00d7) affordance unless explicitly read-only",
    "Bind text to sapList_TextColor",
    "Make tokens removable by keyboard (Delete/Backspace)"
  ],
  "dontRules": [
    "Do not use Token for status \u2014 use Tag",
    "Do not include long text \u2014 tokens should fit on one line",
    "Do not omit the delete affordance on user-editable tokens",
    "Do not nest Tokens"
  ],
  "layoutGuidance": {
    "placement": "Place Token inside a compatible container (Tokenizer, MultiInput, MultiComboBox).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Tokenizer",
    "Used in MultiInput",
    "Used in MultiComboBox"
  ],
  "compatibility": [
    "Tokenizer",
    "MultiInput",
    "MultiComboBox"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Token.json`
7. Confirm: "Updated Token.json — N fields populated"

────────────────────────────────────────────────────────────

## [129/139] Tokenizer

# Refresh SAP Fiori guideline: Tokenizer

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tokenizer

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tokenizer")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Tokenizer' || s.name.endsWith('.Tokenizer'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Tokenizer"
   - slug: "tokenizer"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tokenizer"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Tokenizer",
  "slug": "tokenizer",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/tokenizer/",
  "purpose": "A horizontal container of Token chips. Used to show multiple selected values together with overflow handling and add/remove affordances.",
  "whenToUse": [
    "Display selected filter values from a FilterBar",
    "Show selected tags or categories on an object",
    "Multi-value input where each value becomes a removable chip",
    "Anywhere MultiComboBox or MultiInput's built-in tokenizer is insufficient"
  ],
  "whenNotToUse": [
    "Single-value input \u2014 use Input",
    "For action buttons \u2014 use OverflowToolbar",
    "For navigation tabs \u2014 use IconTabBar"
  ],
  "doRules": [
    "Provide tokens via items[] array",
    "Show \"+N more\" overflow indicator when tokens exceed available width",
    "Allow keyboard navigation between tokens (Left/Right)",
    "Bind background to sapBackgroundColor"
  ],
  "dontRules": [
    "Do not exceed ~10 visible tokens \u2014 use overflow",
    "Do not mix Token and other content inside Tokenizer",
    "Do not nest Tokenizers",
    "Do not omit the overflow indicator"
  ],
  "layoutGuidance": {
    "placement": "Place Tokenizer inside a compatible container (Form, FilterBar, DynamicPageHeader).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for input \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Form",
    "Used in FilterBar",
    "Used in DynamicPageHeader"
  ],
  "compatibility": [
    "Form",
    "FilterBar",
    "DynamicPageHeader",
    "Panel"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Tokenizer.json`
7. Confirm: "Updated Tokenizer.json — N fields populated"

────────────────────────────────────────────────────────────

## [130/139] Toolbar

# Refresh SAP Fiori guideline: Toolbar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Toolbar' || s.name.endsWith('.Toolbar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Toolbar"
   - slug: "toolbar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Toolbar",
  "slug": "toolbar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/toolbar/",
  "purpose": "Horizontal container for related actions, controls, and titles. The simpler sibling of OverflowToolbar \u2014 does NOT manage overflow when content exceeds available width.",
  "whenToUse": [
    "Action group with fixed, predictable content that won't overflow",
    "Inline action row in a Panel or Form header",
    "Simple action set in a Dialog footer (consider Dialog's own buttons instead)",
    "When you know the viewport width is always sufficient"
  ],
  "whenNotToUse": [
    "When action count may exceed width \u2014 use OverflowToolbar (almost always)",
    "When you need responsive overflow behavior \u2014 use OverflowToolbar",
    "Inside table cells \u2014 use IconButton or Button",
    "For navigation \u2014 use ShellBar or DynamicPageTitle"
  ],
  "doRules": [
    "Use Toolbar only when OverflowToolbar is NOT needed (rare)",
    "Place primary action right-aligned (after a ToolbarSpacer)",
    "Group related buttons; separate destructive actions with spacing",
    "Bind fill to sapShellColor (Solid) or sapBackgroundColor (Transparent)"
  ],
  "dontRules": [
    "Do not put a primary CTA on the left \u2014 convention is right-aligned",
    "Do not stack Toolbars vertically \u2014 combine into one",
    "Do not omit the ToolbarSpacer when items should be left+right aligned",
    "Do not mix Toolbar and OverflowToolbar in the same area"
  ],
  "layoutGuidance": {
    "placement": "Top of Panel/Form/section, below DynamicPageTitle, or as Dialog footer.",
    "sizing": "Auto-width 100%; height 44px Compact / 48px Cozy.",
    "spacing": "8px gap between buttons; 16px between groups.",
    "alignment": "Left-anchored by default; ToolbarSpacer pushes right group."
  },
  "contentGuidance": {
    "labelLength": "Inherits from children (Buttons, Title).",
    "contentRules": [
      "Limit to ~6 actions for predictable layouts; beyond that, use OverflowToolbar"
    ],
    "examples": [
      "Title | Spacer | Search | Add | Delete | Export",
      "Cancel | Spacer | Save"
    ]
  },
  "responsiveBehavior": {
    "XL": "All items inline.",
    "L": "All items inline.",
    "M": "Risk of overflow \u2014 prefer OverflowToolbar.",
    "S": "High overflow risk \u2014 strongly prefer OverflowToolbar."
  },
  "accessibilityGuidance": {
    "ariaPattern": "role='toolbar' with aria-label describing purpose. Arrow keys navigate within toolbar.",
    "contrast": "Border \u2265 3:1 with bg (WCAG AA non-text 1.4.11).",
    "keyboard": "Tab enters/exits; arrow keys navigate internally.",
    "screenReader": "Announced as 'toolbar, [label], N items'."
  },
  "patterns": [
    "Panel header \u2014 title + a few actions",
    "Form section header \u2014 section actions",
    "Dialog footer (rare; Dialog has its own buttons)"
  ],
  "compatibility": [
    "Button",
    "MenuButton",
    "IconButton",
    "ToolbarSpacer",
    "Title",
    "Label",
    "Input",
    "SearchField",
    "Select"
  ],
  "exceptions": [
    "In nearly all production cases, prefer OverflowToolbar. Toolbar is documented for completeness but its incompatibility with overflow makes it rare."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Toolbar.json`
7. Confirm: "Updated Toolbar.json — N fields populated"

────────────────────────────────────────────────────────────

## [131/139] ToolbarItems

# Refresh SAP Fiori guideline: ToolbarItems

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ToolbarItems' || s.name.endsWith('.ToolbarItems'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ToolbarItems"
   - slug: "toolbar-overview"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ToolbarItems",
  "slug": "toolbar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/toolbar/",
  "purpose": "A grouping wrapper for items inside a Toolbar. Used to collect a related set of actions together \u2014 visually or semantically. Rendered by the plugin as a pass-through \u2014 parent Toolbar handles the actual layout.",
  "whenToUse": [
    "Group related actions inside a Toolbar (view toggles, sort options)",
    "As an alias when the spec generator wants to group semantically",
    "When you need a named container for a subset of toolbar items",
    "For programmatic show/hide of an item group"
  ],
  "whenNotToUse": [
    "For a single action \u2014 put it directly in the Toolbar",
    "For a separate visual toolbar \u2014 use a second Toolbar",
    "For unrelated actions \u2014 don't force-group them",
    "In place of ToolbarSpacer \u2014 that's for spacing, not grouping"
  ],
  "doRules": [
    "Group items that share a semantic purpose (all filter actions, all view options)",
    "Keep group size to 2\u20135 items for scannability",
    "Use ToolbarSpacer between groups when visual separation is needed",
    "Support show/hide of the entire group as a unit"
  ],
  "dontRules": [
    "Do not nest ToolbarItems inside ToolbarItems",
    "Do not use for individual items \u2014 use direct Toolbar children",
    "Do not stack groups without separators",
    "Do not use outside a Toolbar"
  ],
  "layoutGuidance": {
    "placement": "Inside a Toolbar or OverflowToolbar",
    "sizing": "Hugs content; height matches parent",
    "spacing": "Inherits parent Toolbar spacing",
    "alignment": "Inline with other Toolbar items"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 container",
    "contentRules": "Contains only Toolbar-legal items (Button, IconButton, Select, etc.)",
    "examples": [
      "Group 1: [Sort \u25bc] [Filter \u25bc]  \u00b7  Group 2: [Grid] [List]"
    ]
  },
  "responsiveBehavior": {
    "XL": "All items visible inline",
    "L": "Same",
    "M": "May collapse via OverflowToolbar",
    "S": "May collapse entirely into overflow menu"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)"
    ],
    "requirements": [
      "role='group' with aria-label describing the group's purpose",
      "Focus order follows visual order within the group",
      "Child items provide their own labels",
      "Group can be reached via a single Tab, then Arrow keys within"
    ]
  },
  "patterns": [
    "Grouped toolbar actions",
    "View mode toggle group",
    "Filter action cluster"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar"
    ],
    "forbiddenWith": [
      "Standalone",
      "Any non-Toolbar parent"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ToolbarItems.json`
7. Confirm: "Updated ToolbarItems.json — N fields populated"

────────────────────────────────────────────────────────────

## [132/139] ToolbarSpacer

# Refresh SAP Fiori guideline: ToolbarSpacer

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'ToolbarSpacer' || s.name.endsWith('.ToolbarSpacer'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "ToolbarSpacer"
   - slug: "toolbar-overview"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/toolbar-overview"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "ToolbarSpacer",
  "slug": "toolbar-spacer",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/toolbar/",
  "purpose": "An invisible flex-grow element inside a Toolbar (or Bar) that pushes items apart. Used to separate a title on the left from actions on the right, or to distribute space between groups of toolbar items.",
  "whenToUse": [
    "Push a group of items to the right side of a Toolbar",
    "Separate title from actions in a Bar's contentMiddle slot",
    "Distribute items evenly in a wide toolbar",
    "Anchor a search field to the right while other items stay left"
  ],
  "whenNotToUse": [
    "For fixed spacing between items \u2014 use margin/padding instead",
    "Between rows \u2014 Toolbar is horizontal-only",
    "Outside a Toolbar or Bar \u2014 it has no meaning",
    "For empty state \u2014 use IllustratedMessage instead"
  ],
  "doRules": [
    "Use exactly one ToolbarSpacer to split a Toolbar into left/right",
    "Use multiple ToolbarSpacers to distribute items evenly",
    "Prefer ToolbarSpacer over manual widths for responsive behavior",
    "Place it between semantic groups, not within a group"
  ],
  "dontRules": [
    "Do not use as a visible separator \u2014 use ToolbarSeparator for that",
    "Do not stack multiple ToolbarSpacers back-to-back",
    "Do not add width to ToolbarSpacer \u2014 it should flex naturally",
    "Do not use outside a Toolbar or Bar"
  ],
  "layoutGuidance": {
    "placement": "Between items in a Toolbar or Bar",
    "sizing": "flex-grow: 1 \u00b7 min-width: 0",
    "spacing": "n/a (fills available space)",
    "alignment": "n/a"
  },
  "contentGuidance": {
    "labelLength": "n/a",
    "contentRules": "No visible content",
    "examples": [
      "[Title] [Spacer] [Save] [Cancel]"
    ]
  },
  "responsiveBehavior": {
    "XL": "Fills available space",
    "L": "Fills available space",
    "M": "May collapse if toolbar wraps to two rows",
    "S": "May be ignored if items stack"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.3.1 Info and Relationships (Level A)"
    ],
    "requirements": [
      "role='presentation' \u2014 no semantic meaning for screen readers",
      "Focus order is unaffected (spacer is not focusable)",
      "Does not appear in the accessibility tree"
    ]
  },
  "patterns": [
    "Toolbar with left title + right actions",
    "Bar footer with cancel + submit",
    "OverflowToolbar layouts"
  ],
  "compatibility": {
    "allowedWith": [
      "Toolbar",
      "OverflowToolbar",
      "Bar",
      "FilterBar"
    ],
    "forbiddenWith": [
      "Panel content",
      "Card content",
      "Dialog content directly"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/ToolbarSpacer.json`
7. Confirm: "Updated ToolbarSpacer.json — N fields populated"

────────────────────────────────────────────────────────────

## [133/139] Tree

# Refresh SAP Fiori guideline: Tree

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tree

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tree")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Tree' || s.name.endsWith('.Tree'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Tree"
   - slug: "tree"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/tree"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Tree",
  "slug": "tree",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/tree/",
  "purpose": "Hierarchical list of nested items. Displays parent-child relationships through indentation and expand/collapse affordances.",
  "whenToUse": [
    "Hierarchical data with arbitrary depth (file trees, org charts, category hierarchies)",
    "Drill-down navigation in worklists",
    "When list of items has parent-child relationships users need to expand/collapse"
  ],
  "whenNotToUse": [
    "Flat lists \u2014 use List",
    "Tabular data \u2014 use Table",
    "Two-level hierarchy only \u2014 use grouped List with section headers",
    "When user needs to compare attributes across items \u2014 use Table"
  ],
  "doRules": [
    "Bind row text to sapList_TextColor",
    "Limit indent to 4 levels max \u2014 beyond that, redesign as filtered list",
    "Use a chevron icon for expandable nodes (rotates on expand)",
    "Show expand/collapse state in the icon orientation"
  ],
  "dontRules": [
    "Do not use Tree for non-hierarchical data",
    "Do not nest Tree inside another Tree",
    "Do not omit the expand/collapse affordance \u2014 users cannot discover nesting otherwise",
    "Do not show more than ~200 visible nodes at once \u2014 virtualize or filter"
  ],
  "layoutGuidance": {
    "placement": "Place Tree inside a compatible container (Panel, Dialog, DynamicPage).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for data display \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Panel",
    "Used in Dialog",
    "Used in DynamicPage"
  ],
  "compatibility": [
    "Panel",
    "Dialog",
    "DynamicPage",
    "List"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Tree.json`
7. Confirm: "Updated Tree.json — N fields populated"

────────────────────────────────────────────────────────────

## [134/139] TreeItem

# Refresh SAP Fiori guideline: TreeItem

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/treeitem

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/treeitem")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TreeItem' || s.name.endsWith('.TreeItem'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TreeItem"
   - slug: "treeitem"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/treeitem"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TreeItem",
  "slug": "tree-item",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/treeitem/",
  "purpose": "A single row within a Tree. Carries text, optional icon, and expand/collapse affordance for child items.",
  "whenToUse": [
    "Inside a Tree as a tree node",
    "When child items are nested directly under this item via the children property"
  ],
  "whenNotToUse": [
    "Outside of a Tree \u2014 TreeItem only works inside Tree",
    "As a list item \u2014 use StandardListItem instead",
    "For interactive actions \u2014 TreeItem is a row, not an action"
  ],
  "doRules": [
    "Provide text for every TreeItem",
    "Use level (depth) to indicate nesting",
    "Mark expandable items with hasChildren=true to render the chevron",
    "Bind text to sapList_TextColor"
  ],
  "dontRules": [
    "Do not use TreeItem without a parent Tree",
    "Do not nest TreeItem markup; nesting is by level/parent metadata not DOM nesting",
    "Do not omit text on a TreeItem"
  ],
  "layoutGuidance": {
    "placement": "Place TreeItem inside a compatible container (Tree).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Avoid punctuation in short labels",
      "Localize all text"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense or collapse \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern (Popover, Dialog) on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for data display \u2014 see SAP Fiori a11y docs.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used in Tree"
  ],
  "compatibility": [
    "Tree"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TreeItem.json`
7. Confirm: "Updated TreeItem.json — N fields populated"

────────────────────────────────────────────────────────────

## [135/139] TwoMonthCalendar

# Refresh SAP Fiori guideline: TwoMonthCalendar

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'TwoMonthCalendar' || s.name.endsWith('.TwoMonthCalendar'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "TwoMonthCalendar"
   - slug: "calendar"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/calendar"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "TwoMonthCalendar",
  "slug": "planning-calendar",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/planning-calendar/",
  "purpose": "A calendar view showing two consecutive months side-by-side. Used when the user needs to see current + next month at once \u2014 booking flows, date-range picking, comparing month layouts. A wider variant of Calendar.",
  "whenToUse": [
    "Booking or reservation flows where the range typically spans months",
    "Date-range pickers where showing both months helps context",
    "Comparing schedules across two months at a glance",
    "Wide desktop calendar views (>800px available)"
  ],
  "whenNotToUse": [
    "For single-month selection \u2014 use Calendar",
    "For date-time selection \u2014 use DateTimePicker",
    "On mobile \u2014 collapse to Calendar or single-month view",
    "For quarter/year overview \u2014 use dedicated period picker"
  ],
  "doRules": [
    "Highlight today in both months",
    "Support keyboard navigation across the boundary between months",
    "Show the year in each month's header (avoids ambiguity at year boundary)",
    "Support range selection with visual highlight across both months"
  ],
  "dontRules": [
    "Do not shrink below the width needed for both months",
    "Do not omit month labels \u2014 always show 'January 2026 \u00b7 February 2026'",
    "Do not use in constrained popovers \u2014 falls back to Calendar there",
    "Do not use for time-of-day selection"
  ],
  "layoutGuidance": {
    "placement": "Standalone page, wide card, or dedicated planning view",
    "sizing": "Min width 640px; height ~380px",
    "spacing": "16px between the two month grids",
    "alignment": "Side-by-side horizontal grids"
  },
  "contentGuidance": {
    "labelLength": "n/a \u2014 dates",
    "contentRules": "Days as numbers; weekday headers; month title with year",
    "examples": [
      "January 2026 \u00b7 February 2026"
    ]
  },
  "responsiveBehavior": {
    "XL": "Two months side-by-side",
    "L": "Two months side-by-side",
    "M": "May collapse to single month",
    "S": "Single month (falls back to Calendar)"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 1.4.3 Contrast (Level AA)"
    ],
    "requirements": [
      "aria-label on each day cell with full date (including month + year)",
      "Selected/range cells have visible highlight (not color alone)",
      "Keyboard: Arrow keys navigate; Tab moves between months",
      "Today marker distinguishable without color"
    ]
  },
  "patterns": [
    "Date-range picker",
    "Booking flow",
    "Planning calendar view"
  ],
  "compatibility": {
    "allowedWith": [
      "Page",
      "Panel",
      "Card",
      "Dialog"
    ],
    "forbiddenWith": [
      "Popover (too narrow)",
      "Table cells"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/TwoMonthCalendar.json`
7. Confirm: "Updated TwoMonthCalendar.json — N fields populated"

────────────────────────────────────────────────────────────

## [136/139] UnableToLoadImage

# Refresh SAP Fiori guideline: UnableToLoadImage

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'UnableToLoadImage' || s.name.endsWith('.UnableToLoadImage'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "UnableToLoadImage"
   - slug: "illustrated-message"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/illustrated-message"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "UnableToLoadImage",
  "slug": "illustrated-message",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/illustrated-message/",
  "purpose": "Empty-state illustration used when an image or media asset fails to load (network error, missing file, permission denied). Replaces the broken-image placeholder with a clear, on-brand fallback.",
  "whenToUse": [
    "Image src fails to resolve (404, 403, timeout)",
    "Video or media asset cannot be played",
    "As a fallback in ProductCard, Card thumbnail, or Avatar",
    "Any content-image failure that should not break layout"
  ],
  "whenNotToUse": [
    "For expected empty states (no image required) \u2014 use different variant",
    "For load-in-progress \u2014 use placeholder or Skeleton",
    "As decoration",
    "For failed-required-content (use error page)"
  ],
  "doRules": [
    "Show a descriptive message ('Image failed to load')",
    "Provide a retry action if applicable",
    "Match the size and shape of the image slot it replaces",
    "Use tone appropriate for the context (not alarming)"
  ],
  "dontRules": [
    "Do not use for a decorative-only image \u2014 hide it silently instead",
    "Do not use browser-default broken-image icon",
    "Do not omit descriptive text \u2014 user needs to know what happened",
    "Do not shrink below Spot size"
  ],
  "layoutGuidance": {
    "placement": "In place of the failed image inside its container",
    "sizing": "Matches the image container's dimensions",
    "spacing": "n/a \u2014 fills image slot",
    "alignment": "Centered in the container"
  },
  "contentGuidance": {
    "labelLength": "Title \u2264 30 chars; description \u2264 80 chars",
    "contentRules": "Title states the problem; description offers retry option",
    "examples": [
      "Title: 'Image unavailable' \u00b7 Description: 'Could not load this image'"
    ]
  },
  "responsiveBehavior": {
    "XL": "Matches image container",
    "L": "Matches image container",
    "M": "Matches image container",
    "S": "Matches image container; may hide text if very small"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 1.1.1 Non-text Content (Level A)",
      "WCAG 2.1 \u00b7 4.1.3 Status Messages (Level AA)"
    ],
    "requirements": [
      "role='img' with aria-label describing the failure",
      "role='status' on the wrapping element to announce the change",
      "Retry action (if present) has clear label",
      "Failed image src does not attempt to load repeatedly"
    ]
  },
  "patterns": [
    "Image failure fallback",
    "Product card broken thumbnail",
    "Avatar fallback"
  ],
  "compatibility": {
    "allowedWith": [
      "IllustratedMessage (only)",
      "Image (as fallback)"
    ],
    "forbiddenWith": [
      "Standalone without container"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/UnableToLoadImage.json`
7. Confirm: "Updated UnableToLoadImage.json — N fields populated"

────────────────────────────────────────────────────────────

## [137/139] UserMenu

# Refresh SAP Fiori guideline: UserMenu

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'UserMenu' || s.name.endsWith('.UserMenu'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "UserMenu"
   - slug: "menu"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/menu"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "UserMenu",
  "slug": "user-menu",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/user-menu/",
  "purpose": "A popover anchored to the user avatar in the ShellBar, containing profile info, preferences, and account actions. Provides consistent access to user-scoped functions (Settings, Sign Out, Help) across all SAP apps.",
  "whenToUse": [
    "Standard ShellBar user avatar dropdown",
    "Access to user preferences, theme, language",
    "Sign Out affordance",
    "Access to user profile page"
  ],
  "whenNotToUse": [
    "For product switch \u2014 use ProductSwitch instead",
    "For notifications \u2014 use Notifications popover",
    "For app navigation \u2014 use SideNavigation",
    "For per-page actions \u2014 use DynamicPageTitle actions"
  ],
  "doRules": [
    "Show user avatar + name + email at the top",
    "Group actions by scope: Profile \u00b7 Preferences \u00b7 Session (with dividers)",
    "Always include a Sign Out action as the last item",
    "Support keyboard navigation and focus trap"
  ],
  "dontRules": [
    "Do not put app-level actions in UserMenu \u2014 those belong elsewhere",
    "Do not exceed 8 items \u2014 trim to essentials",
    "Do not omit avatar/name header \u2014 user needs identity confirmation",
    "Do not use the UserMenu for chat, notifications, or search"
  ],
  "layoutGuidance": {
    "placement": "Anchored to user avatar in ShellBar (right side)",
    "sizing": "Width 320\u2013360px; height max 480px with scroll",
    "spacing": "8px between items; dividers between groups",
    "alignment": "Header centered/left-aligned; items left-aligned"
  },
  "contentGuidance": {
    "labelLength": "Item labels \u2264 30 chars; user name \u2264 40",
    "contentRules": "User info + grouped preference actions + sign-out",
    "examples": [
      "Nadia Fischer / nadia@example.com \u00b7 [Profile] [Settings] [Help] [Sign out]"
    ]
  },
  "responsiveBehavior": {
    "XL": "Popover from ShellBar avatar",
    "L": "Same",
    "M": "Same",
    "S": "May become full-height slide-in from right"
  },
  "accessibilityGuidance": {
    "wcagCriteria": [
      "WCAG 2.1 \u00b7 2.1.1 Keyboard (Level A)",
      "WCAG 2.1 \u00b7 4.1.2 Name, Role, Value (Level A)"
    ],
    "requirements": [
      "Popover has role='dialog' with aria-label='User menu'",
      "Avatar trigger has aria-label with user name",
      "Keyboard: Enter opens; Escape closes; Arrow keys navigate items",
      "Focus returns to trigger on close"
    ]
  },
  "patterns": [
    "ShellBar user avatar dropdown",
    "User profile access",
    "Sign-out flow"
  ],
  "compatibility": {
    "allowedWith": [
      "ShellBar (as anchor)"
    ],
    "forbiddenWith": [
      "Standalone (must be anchored)",
      "Inside any other component"
    ]
  },
  "exceptions": [],
  "version": "1.149.0",
  "lastChecked": "2026-07-08"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/UserMenu.json`
7. Confirm: "Updated UserMenu.json — N fields populated"

────────────────────────────────────────────────────────────

## [138/139] Wizard

# Refresh SAP Fiori guideline: Wizard

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'Wizard' || s.name.endsWith('.Wizard'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "Wizard"
   - slug: "wizard"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "Wizard",
  "slug": "wizard",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/wizard/",
  "purpose": "Multi-step process layout \u2014 guides user through a sequence of WizardSteps with progress indicator at top. Used for onboarding, data entry, complex object creation.",
  "whenToUse": [
    "New object creation requiring multiple form pages",
    "Onboarding flows",
    "Multi-step approval / signoff processes",
    "Operations that branch based on earlier choices"
  ],
  "whenNotToUse": [
    "Single-page form \u2014 use Form",
    "Linear data review (no input) \u2014 use Timeline",
    "Step count > 7 \u2014 redesign with sections"
  ],
  "doRules": [
    "Show all steps in the header even when only one is active",
    "Allow back navigation",
    "Validate per-step before allowing next",
    "Mark optional steps clearly"
  ],
  "dontRules": [
    "Do not exceed ~7 steps",
    "Do not allow Next without validation passing",
    "Do not skip rendering disabled future steps \u2014 they should be visible"
  ],
  "layoutGuidance": {
    "placement": "Place Wizard inside a compatible container (DynamicPage, Dialog).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for page layout.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside DynamicPage",
    "Used inside Dialog"
  ],
  "compatibility": [
    "DynamicPage",
    "Dialog"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/Wizard.json`
7. Confirm: "Updated Wizard.json — N fields populated"

────────────────────────────────────────────────────────────

## [139/139] WizardStep

# Refresh SAP Fiori guideline: WizardStep

Source URL: https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard-step

Steps:
1. Use Chrome MCP: `navigate_page("https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard-step")`
2. Wait for: `wait_for(["When to Use", "When Not to Use", "Do", "Don't"])`
3. Get page content via evaluate_script — extract structured text from main#main:
   ```js
   const main = document.querySelector('main#main');
   const getMeta = n => document.querySelector(`meta[name="${n}"]`)?.content || '';
   return {
     title: document.querySelector('h1')?.innerText.trim() || document.title,
     status: getMeta('uielementsstatus'),
     category: getMeta('uielementscategory'),
     modified: getMeta('modified-time'),
     content: main?.innerText || '',
     apiLinks: Array.from(main?.querySelectorAll('a[href*="ui5.sap.com"]') || []).map(a => ({text: a.innerText.trim(), href: a.href})),
     imageAlts: Array.from(main?.querySelectorAll('img[alt]') || []).map(i => i.alt).filter(a => a),
     related: Array.from(main?.querySelectorAll('a[href*="ui-elements/"]') || []).map(a => a.innerText.trim()).filter(t => t)
   };
   ```
4. Also run: `evaluate_script` on ui5.sap.com to get uxGuidelinesLink + description:
   ```js
   const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
   const json = await res.json();
   const ctrl = json.symbols.find(s => s.basename === 'WizardStep' || s.name.endsWith('.WizardStep'));
   return ctrl ? { desc: ctrl.description?.replace(/<[^>]+>/g,'').slice(0,400), uxLink: ctrl.uxGuidelinesLink } : null;
   ```
5. Produce a JSON object with ALL 17 required fields:
   - componentName: "WizardStep"
   - slug: "wizard-step"
   - sourceUrl: "https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/wizard-step"
   - purpose: [1-2 sentence description from the page or API]
   - whenToUse: [array of specific use-case strings from page]
   - whenNotToUse: [array of "use X instead" strings from page]
   - doRules: [array of "do" rules from page]
   - dontRules: [array of "don't" rules from page]
   - layoutGuidance: { placement, sizing, spacing, alignment }
   - contentGuidance: { labelLength, contentRules, examples: [] }
   - responsiveBehavior: { XL, L, M, S }
   - accessibilityGuidance: { wcagCriteria: [], requirements: [] }
   - patterns: [array of pattern names this component participates in]
   - compatibility: { allowedWith: [], forbiddenWith: [] }
   - exceptions: []
   - version: "1.149.0"
   - lastChecked: "2026-07-25"

Existing guideline (use as fallback for any field not found on the page):
{
  "componentName": "WizardStep",
  "slug": "wizard-step",
  "sourceUrl": "https://experience.sap.com/fiori-design-web/wizard-step/",
  "purpose": "A single step inside a Wizard. Contains a title + the content for that step (typically a Form).",
  "whenToUse": [
    "Inside Wizard as a step",
    "Each logical phase of a multi-step process"
  ],
  "whenNotToUse": [
    "Outside of Wizard",
    "For non-sequential content \u2014 use Panel"
  ],
  "doRules": [
    "Provide a clear step title",
    "Validate inputs before allowing nextStep",
    "Use Form inside the step for inputs"
  ],
  "dontRules": [
    "Do not nest WizardStep",
    "Do not allow horizontal scrolling within a step"
  ],
  "layoutGuidance": {
    "placement": "Place WizardStep inside a compatible container (Wizard).",
    "sizing": "Auto width unless explicitly sized; height matches density (Compact 26-32px, Cozy 36-44px).",
    "spacing": "8px gap from adjacent elements; 16px between groups.",
    "alignment": "Inherits from parent Auto Layout."
  },
  "contentGuidance": {
    "labelLength": "See doRules for specific length guidance.",
    "contentRules": [
      "Use sentence case",
      "Localize all text",
      "Avoid jargon"
    ],
    "examples": []
  },
  "responsiveBehavior": {
    "XL": "Full size and visibility.",
    "L": "Full size and visibility.",
    "M": "May condense \u2014 see Fiori responsive design guidelines.",
    "S": "May convert to alternative pattern on narrow viewports."
  },
  "accessibilityGuidance": {
    "ariaPattern": "Maps to ARIA pattern appropriate for page layout.",
    "contrast": "\u2265 4.5:1 for text, \u2265 3:1 for borders (WCAG AA).",
    "keyboard": "Full keyboard support \u2014 Tab to focus, Enter/Space to activate.",
    "screenReader": "Announced with role and state."
  },
  "patterns": [
    "Used inside Wizard"
  ],
  "compatibility": [
    "Wizard"
  ],
  "exceptions": [
    "See pluginNotes for plugin-specific rendering caveats."
  ],
  "version": "2025.06",
  "lastChecked": "2026-06-26"
}

6. Write the result to: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/knowledge/guidelines/WizardStep.json`
7. Confirm: "Updated WizardStep.json — N fields populated"

────────────────────────────────────────────────────────────
