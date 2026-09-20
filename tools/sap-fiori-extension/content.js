/**
 * SAP Fiori → LLM — Content Script v2.0
 *
 * Works on ANY website. SAP pages get rich structured extraction.
 * All other sites get universal extraction (main content, headings, links).
 *
 *   sap.com/design-system/…    → extractGuideline()  — sections, tables, images
 *   ui5.sap.com/#/entity/…     → extractSamples()    — properties, events, samples
 *   ui5.sap.com/#/api/…        → extractAPI()        — full API reference
 *   any other site             → extractGeneric()    — universal: article, blog, docs
 *
 * Way 1 (manual): chip → Copy / Download / Open in Claude / Copy for CLI
 * Way 2 (Claude): window.__sapFetch() called via Chrome MCP evaluate_script
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE TYPE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function getPageType() {
  const url = location.href;
  if (url.includes('sap.com/design-system/fiori-design-web') ||
      url.includes('experience.sap.com/fiori-design-web')) return 'guideline';
  if (url.includes('ui5.sap.com') && url.includes('#/entity/'))  return 'samples';
  if (url.includes('ui5.sap.com') && url.includes('#/api/'))     return 'api';
  if (/amazon\.(com|de|co\.uk|fr|it|es|co\.jp|ca|com\.au|in|nl|pl|se|sg)/.test(location.hostname)) return 'amazon';
  return 'generic'; // all other sites — BBC, FT, GitHub, etc.
}

function getClassName() {
  // Handles all hash patterns:
  //   #/api/sap.m.Switch
  //   #/api/sap.m.Switch%23overview          (%23 = encoded #)
  //   #/api/sap.m.Switch%23methods/addAriaLabelledBy
  //   #/api/sap.m.Switch/overview
  //   #/entity/sap.m.Switch
  const raw = decodeURIComponent(location.hash || '');
  return raw
    .replace(/^#\/(api|entity)\//, '')  // strip #/api/ or #/entity/
    .split(/[#/]/)[0]                   // stop at # / sub-path
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function slugFromUrl(url) {
  return url.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop();
}

function clean(html = '') {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function tableToMarkdown(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  return rows.map((row, i) => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .map(c => c.innerText.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim());
    const line = `| ${cells.join(' | ')} |`;
    return i === 0 ? line + '\n' + `| ${cells.map(() => '---').join(' | ')} |` : line;
  }).join('\n') + '\n';
}

// Fetch UI5 JSON API and extract one component
const _apiCache = {};
async function fetchUI5Symbol(className) {
  const lib = className.split('.').slice(0, 2).join('.');
  const endpoint = `https://ui5.sap.com/test-resources/${lib.replace(/\./g,'/')}/designtime/apiref/api.json`;
  if (!_apiCache[endpoint]) {
    try {
      const r = await fetch(endpoint);
      _apiCache[endpoint] = await r.json();
    } catch { return null; }
  }
  return _apiCache[endpoint]?.symbols?.find(s => s.name === className) || null;
}

// Normalise the uxGuidelinesLink — the JSON still returns the old experience.sap.com URL.
// Rewrite it to the current sap.com/design-system URL.
function fixGuidelineUrl(url) {
  if (!url) return '';
  // https://experience.sap.com/fiori-design-web/switch/ → new URL
  const m = url.match(/fiori-design-web\/([^/?#]+)/);
  if (m) return `https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/${m[1]}`;
  return url;
}

// Strip "Since: X.X.X." suffixes that the API inlines into descriptions
function stripSince(text) {
  return text.replace(/<br><br><i>Since:.*?<\/i>/gi, '').replace(/\s*Since:\s*[\d.]+\.?\s*$/i, '').trim();
}

// Clean HTML + strip inline Since references
function cleanDesc(html = '') {
  return clean(stripSince(html)).replace(/\n/g, ' ').trim();
}

// Get all own (non-borrowed) properties from the correct location in the symbol.
// They live in sym['ui5-metadata'].properties, NOT in sym.properties (which is undefined).
function getOwnProps(sym) {
  const meta = sym?.['ui5-metadata'];
  return (meta?.properties || []).filter(p => p.visibility === 'public');
}

// Extract type string from a property entry
function getPropType(p) {
  return p.typeInfo?.template || p.typeInfo?.type || p.type || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — render a DOM node to Markdown preserving inline links + images
// ─────────────────────────────────────────────────────────────────────────────

// Convert an element's innerHTML to Markdown, preserving <a href> and <img alt>
function nodeToMd(el) {
  // Clone so we don't mutate the live DOM
  const clone = el.cloneNode(true);

  // Replace <a href="…">text</a> → [text](href)
  clone.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    const text = a.innerText.trim();
    if (href && text) {
      const md = document.createTextNode(`[${text}](${href})`);
      a.replaceWith(md);
    }
  });

  // Replace <img alt="…" src="…"> → ![alt](src)
  clone.querySelectorAll('img').forEach(img => {
    const alt = img.alt?.trim() || '';
    const src = img.src || img.dataset.src || '';
    if (alt || src) {
      const md = document.createTextNode(`\n\n![${alt}](${src})\n`);
      img.replaceWith(md);
    }
  });

  return clone.innerText?.trim() || '';
}

// Convert a <li> preserving nested links
function liToMd(li) {
  return nodeToMd(li).replace(/\n+/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — GUIDELINE PAGE  (sap.com/design-system/…)
// ─────────────────────────────────────────────────────────────────────────────

function extractGuideline() {
  const main = document.querySelector('main#main');
  if (!main) return null;

  const url   = location.href.replace(/[?#].*$/, '');
  const title = document.querySelector('h1')?.innerText?.trim() || document.title;
  const slug  = slugFromUrl(url);

  // ── Frontmatter ──────────────────────────────────────────────────────────
  let doc = `---\n`;
  doc += `componentName: "${title}"\n`;
  doc += `slug: "${slug}"\n`;
  doc += `sourceUrl: "${url}"\n`;
  doc += `status: "${getMeta('uielementsstatus') || 'Available'}"\n`;
  doc += `category: "${getMeta('uielementscategory') || ''}"\n`;
  doc += `version: "v1-148"\n`;
  doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n`;
  doc += `---\n\n# ${title}\n\n`;

  // ── Section content ───────────────────────────────────────────────────────
  // SAP pages nest sections inside a sticky container — deduplicate by tracking processed nodes
  const processed = new WeakSet();
  const sections = main.querySelectorAll('.section:not(.toc-container)');
  sections.forEach(section => {
    // Skip if this section is a child of another section we already processed
    if (processed.has(section)) return;
    // Mark all descendant sections so we don't re-render them
    section.querySelectorAll('.section').forEach(s => processed.add(s));

    const h2 = section.querySelector('h2');
    if (h2) doc += `\n## ${h2.innerText.trim()}\n\n`;

    const walker = document.createTreeWalker(section, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        const tag = node.tagName.toLowerCase();
        if (['h2','script','style','nav'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (['h3','h4','p','ul','ol','table','img'].includes(tag)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'img') {
        const alt = node.alt?.trim();
        const src = node.src || '';
        if (alt && alt.length > 5) doc += `> ![${alt}](${src})\n\n`;
        continue;
      }
      if (!node.innerText?.trim()) continue;
      if (tag === 'h3')         doc += `### ${node.innerText.trim()}\n\n`;
      else if (tag === 'h4')    doc += `#### ${node.innerText.trim()}\n\n`;
      else if (tag === 'p')     doc += `${nodeToMd(node)}\n\n`;
      else if (tag === 'ul' || tag === 'ol')
        doc += Array.from(node.querySelectorAll(':scope > li'))
          .map(li => `* ${liToMd(li)}`).join('\n') + '\n\n';
      else if (tag === 'table') doc += tableToMarkdown(node) + '\n';
    }

    // Related Links section — bare <a> siblings not inside <p>/<li>, render as grouped bullet list
    if (h2 && h2.innerText.trim() === 'Related Links') {
      section.querySelectorAll('h3, h4').forEach(heading => {
        doc += `\n### ${heading.innerText.trim()}\n\n`;
        let el = heading.nextSibling;
        while (el && !['H3','H4','H2'].includes(el.nodeName)) {
          if (el.nodeType === Node.ELEMENT_NODE && el.tagName === 'A' && el.href) {
            doc += `* [${el.innerText.trim()}](${el.href})\n`;
          } else if (el.nodeType === Node.TEXT_NODE) {
            const t = el.textContent.trim();
            // group labels like "SAPUI5", "SAP Web Components"
            if (t && t.length > 1 && !/^[\s\n]+$/.test(t)) doc += `\n**${t}**\n\n`;
          } else if (el.nodeType === Node.ELEMENT_NODE) {
            el.querySelectorAll('a[href]').forEach(a => {
              if (a.innerText.trim()) doc += `* [${a.innerText.trim()}](${a.href})\n`;
            });
          }
          el = el.nextSibling;
        }
        doc += '\n';
      });
    }
  });

  // ── Links — grouped by purpose ────────────────────────────────────────────
  // Collect all meaningful links from the main content area
  const SKIP_TEXT = new Set(['Copy URL','Learn more','Home','Back','UI5 Logo','Feedback',
    'SAPUI5','SAP Web Components','Figma','Information badge: SAPUI5',
    'Information badge: SAP Web Components','Information badge: Figma']);
  const SKIP_HREF = /^(javascript:|mailto:)/;

  const seen = new Set();
  const ui5Links = [], figmaLinks = [], guideLinks = [], accessibilityLinks = [], otherLinks = [];

  Array.from(main.querySelectorAll('a[href]')).forEach(a => {
    const href = a.href;
    const text = a.innerText?.trim();
    if (!href || !text || seen.has(href)) return;
    if (SKIP_HREF.test(href) || SKIP_TEXT.has(text)) return;
    // skip self-link and TOC anchor links (#intro, #when-to-use, etc.)
    if (href === url) return;
    const hrefUrl = new URL(href);
    if (hrefUrl.pathname === new URL(url).pathname && hrefUrl.hash) return; // same-page anchor
    seen.add(href);

    const entry = `* [${text}](${href})`;
    if (href.includes('ui5.sap.com'))    ui5Links.push(entry);
    else if (href.includes('figma.com')) figmaLinks.push(entry);
    else if (href.includes('w3.org') || href.toLowerCase().includes('wcag') || href.includes('/aria'))
                                         accessibilityLinks.push(entry);
    else if (href.includes('sap.com'))   guideLinks.push(entry);
    else                                 otherLinks.push(entry);
  });

  const hasLinks = ui5Links.length || figmaLinks.length || guideLinks.length || accessibilityLinks.length || otherLinks.length;
  if (hasLinks) {
    doc += `\n## Links\n\n`;
    if (ui5Links.length) {
      doc += `### UI5 / API Reference\n\n${ui5Links.join('\n')}\n\n`;
    }
    if (figmaLinks.length) {
      doc += `### Figma\n\n${figmaLinks.join('\n')}\n\n`;
    }
    if (guideLinks.length) {
      doc += `### SAP Guidelines & Related\n\n${guideLinks.join('\n')}\n\n`;
    }
    if (accessibilityLinks.length) {
      doc += `### Accessibility Standards\n\n${accessibilityLinks.join('\n')}\n\n`;
    }
    if (otherLinks.length) {
      doc += `### Other\n\n${otherLinks.join('\n')}\n\n`;
    }
  }

  return { doc, slug, title, type: 'guideline' };
}

// Collect all meaningful links from a page, deduplicated
function collectPageLinks(root) {
  const links = [];
  const seen = new Set();
  Array.from((root || document).querySelectorAll('a[href]')).forEach(a => {
    const href = a.href;
    const text = a.innerText?.trim();
    if (!href || !text || seen.has(href)) return;
    if (href.startsWith('javascript:') || href === location.href) return;
    // skip pure navigation chrome (breadcrumbs, Copy URL buttons)
    if (['Copy URL', 'Learn more', 'Home', 'Back', 'UI5 Logo'].includes(text)) return;
    seen.add(href);
    links.push({ text, href });
  });
  return links;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — UI5 SAMPLES PAGE  (ui5.sap.com/#/entity/…)
// ─────────────────────────────────────────────────────────────────────────────

async function extractSamples() {
  const className = getClassName();
  if (!className) return null;

  const slug  = className.toLowerCase().replace(/\./g, '-');
  const main  = document.querySelector('main, [role="main"]');
  const pageText = main?.innerText || '';

  const since    = pageText.match(/Available Since:\s*([\d.]+)/)?.[1] || '';
  const category = pageText.match(/Category:\s*([^\n]+)/)?.[1]?.trim() || '';
  const density  = pageText.match(/Content Density:\s*([^\n]+)/)?.[1]?.trim() || '';

  const sampleRows = Array.from(document.querySelectorAll('[role="row"]'))
    .map(row => row.querySelector('[role="gridcell"]')?.innerText?.trim())
    .filter(Boolean);

  const sym = await fetchUI5Symbol(className);
  const uxLink = fixGuidelineUrl(
    Array.from(document.querySelectorAll('a'))
      .find(a => a.href?.includes('fiori-design-web') || a.href?.includes('experience.sap.com'))?.href
    || sym?.uxGuidelinesLink || ''
  );

  let doc = `---\ncomponentName: "${className}"\nslug: "${slug}"\n`;
  doc += `sourceUrl: "${location.href}"\n`;
  doc += `samplesUrl: "https://ui5.sap.com/#/entity/${className}"\n`;
  doc += `apiUrl: "https://ui5.sap.com/#/api/${className}"\n`;
  if (uxLink) doc += `guidelineUrl: "${uxLink}"\n`;
  doc += `availableSince: "${since}"\n`;
  doc += `category: "${category}"\n`;
  doc += `contentDensity: "${density}"\n`;
  doc += `extends: "${sym?.extends || ''}"\n`;
  doc += `implements: "${(sym?.implements || []).join(', ')}"\n`;
  doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n`;
  doc += `---\n\n# ${className} — Samples\n\n`;

  if (sym?.description) doc += `## Overview\n\n${clean(sym.description)}\n\n`;

  // Properties — from ui5-metadata.properties (sym.properties is undefined in this API)
  const ownProps = getOwnProps(sym);
  if (ownProps.length) {
    doc += `## Properties\n\n| Property | Type | Default | Since | Description |\n| --- | --- | --- | --- | --- |\n`;
    ownProps.forEach(p => {
      const type = getPropType(p);
      const def  = String(p.defaultValue ?? '');
      const desc = clean(p.description || '').slice(0, 150).replace(/\n/g, ' ');
      const since = p.since || '';
      doc += `| \`${p.name}\` | \`${type}\` | \`${def}\` | ${since} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // Events (own only)
  const ownEvents = (sym?.events || []).filter(e => !e.borrowedFrom);
  if (ownEvents.length) {
    doc += `## Events\n\n| Event | Parameters | Description |\n| --- | --- | --- |\n`;
    ownEvents.forEach(e => {
      const params = (e.parameters || [])
        .filter(p => p.name && p.typeInfo?.template)
        .map(p => `\`${p.name}\`: ${p.typeInfo.template}`).join(', ');
      doc += `| \`${e.name}\` | ${params} | ${clean(e.description || '').slice(0, 150)} |\n`;
    });
    doc += '\n';
  }

  // Samples list
  if (sampleRows.length) {
    doc += `## Available Samples\n\n`;
    sampleRows.forEach(s => { doc += `* ${s}\n`; });
    doc += '\n';
  }

  // ALL links from the page
  const links = collectPageLinks(document);
  if (links.length) {
    doc += `## Links\n\n`;
    doc += `* [Samples](https://ui5.sap.com/#/entity/${className})\n`;
    doc += `* [API Reference](https://ui5.sap.com/#/api/${className})\n`;
    if (uxLink) doc += `* [UX Guidelines](${uxLink})\n`;
    const extra = links.filter(l => !l.href.includes(className) && (l.href.includes('sap.com') || l.href.includes('w3.org')));
    extra.slice(0, 20).forEach(l => { doc += `* [${l.text}](${l.href})\n`; });
    doc += '\n';
  }

  return { doc, slug, title: className, type: 'samples' };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — UI5 API REFERENCE PAGE  (ui5.sap.com/#/api/…)
// ─────────────────────────────────────────────────────────────────────────────

async function extractAPI() {
  const className = getClassName();
  if (!className) return null;

  const slug = className.toLowerCase().replace(/\./g, '-');
  const sym  = await fetchUI5Symbol(className);
  const meta = sym?.['ui5-metadata'] || {};
  const uxLink = fixGuidelineUrl(sym?.uxGuidelinesLink || '');

  // availableSince — read "Available since: X.X" from page header (may be "N/A" for legacy components)
  const pageText = document.querySelector('main, [role="main"]')?.innerText || '';
  const sinceRaw = pageText.match(/[Aa]vailable since[:\s]+([^\n]+)/)?.[1]?.trim() || sym?.since || '';
  const since = sinceRaw.replace(/\.$/, '').trim(); // strip trailing dot

  // ── Frontmatter ──────────────────────────────────────────────────────────
  let doc = `---\n`;
  doc += `componentName: "${className}"\n`;
  doc += `slug: "${slug}"\n`;
  doc += `apiUrl: "https://ui5.sap.com/#/api/${className}"\n`;
  doc += `samplesUrl: "https://ui5.sap.com/#/entity/${className}"\n`;
  if (uxLink)  doc += `guidelineUrl: "${uxLink}"\n`;
  if (since)   doc += `availableSince: "${since}"\n`;
  if (sym?.extends)    doc += `extends: "${sym.extends}"\n`;
  if (sym?.implements?.length) doc += `implements: "${sym.implements.join(', ')}"\n`;
  doc += `module: "${sym?.module || ''}"\n`;
  doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n`;
  doc += `---\n\n# ${className}\n\n`;

  // ── Overview ──────────────────────────────────────────────────────────────
  if (sym?.description) {
    doc += `## Overview\n\n${cleanDesc(sym.description)}\n\n`;
  }

  // ── Constructor ───────────────────────────────────────────────────────────
  doc += `## Constructor\n\n`;
  doc += `\`\`\`js\nnew ${className}(sId?, mSettings?)\n\`\`\`\n\n`;
  // Constructor description — stop at "See sap.ui.base..." boilerplate
  if (sym?.constructor?.description) {
    const ctorDesc = cleanDesc(sym.constructor.description)
      .replace(/\.\s*Accepts\b/g, '. Accepts')  // fix missing space: "Switch.Accepts"
      .replace(/\s*See sap\.ui\.base\..+$/s, '') // strip boilerplate reference
      .trim();
    if (ctorDesc) doc += `${ctorDesc}\n\n`;
  }

  // ── Properties ────────────────────────────────────────────────────────────
  const ownProps = getOwnProps(sym);
  if (ownProps.length) {
    doc += `## Properties\n\n`;
    doc += `| Property | Type | Default | Since | Description |\n`;
    doc += `| --- | --- | --- | --- | --- |\n`;
    ownProps.forEach(p => {
      const type = getPropType(p);
      const def  = String(p.defaultValue ?? '');
      const desc = cleanDesc(p.description || '').slice(0, 200);
      doc += `| \`${p.name}\` | \`${type}\` | \`${def}\` | ${p.since || ''} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // ── Aggregations ──────────────────────────────────────────────────────────
  const ownAggs = (meta.aggregations || []).filter(a => a.visibility === 'public');
  if (ownAggs.length) {
    doc += `## Aggregations\n\n`;
    doc += `| Aggregation | Cardinality | Type | Since | Description |\n`;
    doc += `| --- | --- | --- | --- | --- |\n`;
    ownAggs.forEach(a => {
      const type = a.typeInfo?.template || a.type || '';
      const desc = cleanDesc(a.description || '').slice(0, 180);
      doc += `| \`${a.name}\` | ${a.cardinality || ''} | \`${type}\` | ${a.since || ''} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // ── Associations ──────────────────────────────────────────────────────────
  const ownAssocs = (meta.associations || []).filter(a => a.visibility === 'public');
  if (ownAssocs.length) {
    doc += `## Associations\n\n`;
    doc += `| Association | Cardinality | Type | Since | Description |\n`;
    doc += `| --- | --- | --- | --- | --- |\n`;
    ownAssocs.forEach(a => {
      const desc = cleanDesc(a.description || '').slice(0, 180);
      doc += `| \`${a.name}\` | ${a.cardinality || ''} | \`${a.type || ''}\` | ${a.since || ''} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const ownEvents = (sym?.events || []).filter(e => !e.borrowedFrom);
  if (ownEvents.length) {
    doc += `## Events\n\n`;
    doc += `| Event | Parameters | Since | Description |\n`;
    doc += `| --- | --- | --- | --- |\n`;
    const SKIP_PARAMS = new Set(['oControlEvent','getSource','getParameters']);
    ownEvents.forEach(e => {
      const params = (e.parameters || [])
        .filter(p => p.name && !SKIP_PARAMS.has(p.name))
        .map(p => `\`${p.name}\`: ${p.typeInfo?.template || p.type || ''}`)
        .join(', ');
      const desc = cleanDesc(e.description || '').slice(0, 180);
      doc += `| \`${e.name}\` | ${params || '—'} | ${e.since || ''} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // ── Methods ───────────────────────────────────────────────────────────────
  const allPropNames = new Set(ownProps.map(p => p.name));
  const assocNames   = new Set(ownAssocs.map(a => a.name));
  const eventNames   = new Set(ownEvents.map(e => e.name));

  const allMethods = (sym?.methods || []).filter(m => m.visibility === 'public' && !m.borrowedFrom);

  const accessors  = [];  // getX/setX for known properties → shown as compact list
  const meaningful = [];  // everything else → shown in table

  allMethods.forEach(m => {
    const name = m.name.replace(/^sap\.\w+\.\w+\./, ''); // strip class prefix (sap.m.Switch.extend → extend)

    // Drop static scaffold (extend, getMetadata)
    if (/\.(extend|getMetadata)$/.test(m.name) || name === 'extend' || name === 'getMetadata') return;

    // getX/setX for known PROPERTIES → compact accessors list
    const propMatch = name.match(/^(get|set)([A-Z].+)$/);
    if (propMatch) {
      const prop = propMatch[2][0].toLowerCase() + propMatch[2].slice(1);
      if (allPropNames.has(prop)) { accessors.push({ ...m, cleanName: name }); return; }
    }

    // Everything else (attach/detach/fire events, add/remove associations, custom methods) → table
    meaningful.push({ ...m, cleanName: name });
  });

  if (meaningful.length) {
    doc += `## Methods\n\n`;
    doc += `| Method | Returns | Since | Description |\n`;
    doc += `| --- | --- | --- | --- |\n`;
    meaningful.forEach(m => {
      const ret  = m.returnValue?.type || 'void';
      const desc = cleanDesc(m.description || '').slice(0, 200);
      const sig  = (m.parameters || []).map(p => p.optional ? `${p.name}?` : p.name).join(', ');
      doc += `| \`${m.cleanName}(${sig})\` | \`${ret}\` | ${m.since || ''} | ${desc} |\n`;
    });
    doc += '\n';
  }

  // Property accessors — compact grouped list, not a verbose table
  if (accessors.length) {
    doc += `## Property Accessors\n\n`;
    const byProp = {};
    accessors.forEach(m => {
      const propMatch = m.cleanName.match(/^(get|set)([A-Z].+)$/);
      const prop = propMatch[2][0].toLowerCase() + propMatch[2].slice(1);
      if (!byProp[prop]) byProp[prop] = [];
      byProp[prop].push(`\`${m.cleanName}()\``);
    });
    Object.entries(byProp).forEach(([prop, methods]) => {
      doc += `* **${prop}**: ${methods.join(', ')}\n`;
    });
    doc += '\n';
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  doc += `## Links\n\n`;
  doc += `* [API Reference](https://ui5.sap.com/#/api/${className})\n`;
  doc += `* [Samples](https://ui5.sap.com/#/entity/${className})\n`;
  if (uxLink) doc += `* [UX Guidelines](${uxLink})\n`;

  return { doc, slug, title: className, type: 'api' };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — GENERIC (any website: Amazon, BBC, FT, GitHub, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function extractGeneric() {
  const url   = location.href.replace(/[?#].*$/, '');
  const title = document.querySelector('h1')?.innerText?.trim() || document.title;
  const slug  = slugFromUrl(url) || 'page';
  const desc  = document.querySelector('meta[name="description"]')?.content?.trim()
             || document.querySelector('meta[property="og:description"]')?.content?.trim()
             || '';
  const siteName = document.querySelector('meta[property="og:site_name"]')?.content?.trim()
                || location.hostname.replace(/^www\./, '');
  const author = document.querySelector('meta[name="author"]')?.content?.trim()
              || document.querySelector('[rel="author"]')?.innerText?.trim()
              || '';
  const published = document.querySelector('time[datetime]')?.getAttribute('datetime')
                 || document.querySelector('meta[property="article:published_time"]')?.content
                 || '';

  // ── Frontmatter ────────────────────────────────────────────────────────────
  let doc = `---\n`;
  doc += `title: "${title.replace(/"/g, '\\"')}"\n`;
  doc += `site: "${siteName}"\n`;
  doc += `url: "${url}"\n`;
  if (author)    doc += `author: "${author}"\n`;
  if (published) doc += `published: "${published}"\n`;
  if (desc)      doc += `description: "${desc.replace(/"/g, '\\"')}"\n`;
  doc += `extracted: "${new Date().toISOString().slice(0, 10)}"\n`;
  doc += `---\n\n# ${title}\n\n`;
  if (desc) doc += `> ${desc}\n\n`;

  // ── Find main content area ─────────────────────────────────────────────────
  const mainEl =
    document.querySelector('main, article, [role="main"]')
    || document.querySelector('#main-content, #content, #article, #post')
    || document.querySelector('.article-body, .post-content, .entry-content, .story-body, .article__body')
    || document.querySelector('.content, .main, .page-content')
    || document.body;

  // ── Extract content in DOM order ───────────────────────────────────────────
  const BLOCK_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','ul','ol','table','blockquote','pre','figure']);
  const SKIP_ROLES = new Set(['navigation','banner','complementary','contentinfo','search']);
  const SKIP_TAGS  = new Set(['script','style','nav','header','footer','aside','noscript','iframe','form']);

  const walker = document.createTreeWalker(mainEl, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const tag  = node.tagName.toLowerCase();
      const role = node.getAttribute('role') || '';
      if (SKIP_TAGS.has(tag) || SKIP_ROLES.has(role)) return NodeFilter.FILTER_REJECT;
      if (BLOCK_TAGS.has(tag)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    }
  });

  const seen = new WeakSet();
  let node;
  while ((node = walker.nextNode())) {
    if (seen.has(node)) continue;
    seen.add(node);
    const tag  = node.tagName.toLowerCase();
    const text = node.innerText?.trim();
    if (!text || text.length < 3) continue;

    if (tag === 'h1') { /* already in title */ continue; }
    else if (tag === 'h2')  doc += `\n## ${text}\n\n`;
    else if (tag === 'h3')  doc += `\n### ${text}\n\n`;
    else if (tag === 'h4')  doc += `\n#### ${text}\n\n`;
    else if (tag === 'h5' || tag === 'h6') doc += `\n##### ${text}\n\n`;
    else if (tag === 'p')   doc += `${nodeToMd(node)}\n\n`;
    else if (tag === 'blockquote') doc += `> ${text.replace(/\n/g, '\n> ')}\n\n`;
    else if (tag === 'pre') doc += `\`\`\`\n${text}\n\`\`\`\n\n`;
    else if (tag === 'figure') {
      const img = node.querySelector('img');
      const cap = node.querySelector('figcaption')?.innerText?.trim();
      if (img) doc += `> ![${img.alt || cap || ''}](${img.src})\n${cap ? `*${cap}*\n` : ''}\n`;
    }
    else if (tag === 'ul' || tag === 'ol') {
      doc += Array.from(node.querySelectorAll(':scope > li'))
        .map(li => `* ${liToMd(li)}`).join('\n') + '\n\n';
    }
    else if (tag === 'table') doc += tableToMarkdown(node) + '\n';
  }

  // ── All links from main content area ──────────────────────────────────────
  const SKIP_LINK_TEXT = new Set(['', 'read more', 'more', 'click here', 'here', 'link', '↗', '→']);
  const seenLinks = new Set();
  const pageLinks = [];
  Array.from(mainEl.querySelectorAll('a[href]')).forEach(a => {
    const href = a.href;
    // Use only the first line of link text — skip multi-line previews
    const text = (a.innerText?.trim().split('\n')[0] || '').trim();
    if (!href || seenLinks.has(href)) return;
    if (/^(javascript:|mailto:|tel:|#)/.test(href)) return;
    if (SKIP_LINK_TEXT.has(text.toLowerCase())) return;
    if (href === url) return;
    // Skip very short or very long link texts (nav items, full article previews)
    if (text.length < 4 || text.length > 120) return;
    seenLinks.add(href);
    pageLinks.push(`* [${text}](${href})`);
  });

  if (pageLinks.length) {
    doc += `\n## Links\n\n${pageLinks.slice(0, 30).join('\n')}\n`;
  }

  return { doc, slug, title, type: 'generic' };
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR — AMAZON PRODUCT PAGE
// ─────────────────────────────────────────────────────────────────────────────

function extractAmazon() {
  const url   = location.href.replace(/[?#].*$/, '');
  const g     = id => document.getElementById(id)?.innerText?.trim() || '';
  const q     = sel => document.querySelector(sel)?.innerText?.trim() || '';
  const qa    = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ── Core product info ───────────────────────────────────────────────────────
  const title = g('productTitle') || q('h1') || document.title;
  const brand = q('#bylineInfo, .po-brand .a-span9') || '';
  const slug  = url.split('/dp/')[1]?.split('/')[0] || slugFromUrl(url);

  // Price — try multiple price selectors Amazon uses
  const price = q('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay .a-offscreen, #corePrice_feature_div .a-offscreen') || '';

  // Rating & reviews
  const rating  = q('#acrPopover .a-declarative, #averageCustomerReviews .a-icon-alt') || '';
  const reviews = q('#acrCustomerReviewText') || '';

  // Availability
  const availability = g('availability') || q('#outOfStock') || '';

  // Description — main feature bullets
  const bullets = qa('#feature-bullets li:not(.aok-hidden) span.a-list-item')
    .map(li => li.innerText.trim())
    .filter(t => t.length > 5 && !t.includes('Make sure') && !/<\w/.test(t));

  // Product description (long)
  const description = q('#productDescription p, #productDescription span') || '';

  // Technical specs table
  const specs = [];
  qa('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, .a-normal.a-spacing-micro tr').forEach(row => {
    const cells = qa('td, th', row).map(c => c.innerText.replace(/[\n\t]+/g, ' ').trim()).filter(Boolean);
    if (cells.length >= 2) specs.push(`| ${cells.join(' | ')} |`);
  });

  // Additional info bullets
  const detailBullets = qa('#detailBullets_feature_div li span.a-list-item')
    .map(li => li.innerText.replace(/[\n\t]+/g, ' ').trim())
    .filter(t => t.length > 3 && !t.startsWith(':'));

  // Images (first 6 thumbnails alt texts)
  const images = qa('#altImages img, #imageBlock img')
    .map(i => i.alt?.trim()).filter(a => a && a.length > 5).slice(0, 6);

  // ── Build Markdown ──────────────────────────────────────────────────────────
  let doc = `---\n`;
  doc += `title: "${title.replace(/"/g, '\\"')}"\n`;
  doc += `site: "${location.hostname}"\n`;
  doc += `url: "${url}"\n`;
  if (brand) doc += `brand: "${brand.replace(/[Vv]isit |^By /,'').trim()}"\n`;
  if (price) doc += `price: "${price}"\n`;
  if (rating) doc += `rating: "${rating}"\n`;
  if (reviews) doc += `reviews: "${reviews}"\n`;
  if (availability) doc += `availability: "${availability}"\n`;
  doc += `extracted: "${new Date().toISOString().slice(0, 10)}"\n`;
  doc += `---\n\n# ${title}\n\n`;

  if (brand) doc += `**Brand:** ${brand.replace(/[Vv]isit |^By /, '').trim()}\n\n`;
  if (price) doc += `**Price:** ${price}\n\n`;
  if (rating || reviews) doc += `**Rating:** ${rating}${reviews ? ` (${reviews})` : ''}\n\n`;
  if (availability) doc += `**Availability:** ${availability}\n\n`;

  if (bullets.length) {
    doc += `## Key Features\n\n`;
    bullets.forEach(b => { doc += `* ${b}\n`; });
    doc += '\n';
  }

  if (description) {
    doc += `## Description\n\n${description}\n\n`;
  }

  if (specs.length) {
    doc += `## Technical Specifications\n\n`;
    doc += `| Specification | Value |\n| --- | --- |\n`;
    doc += specs.join('\n') + '\n\n';
  }

  if (detailBullets.length) {
    doc += `## Product Details\n\n`;
    detailBullets.forEach(b => { doc += `* ${b}\n`; });
    doc += '\n';
  }

  if (images.length) {
    doc += `## Images\n\n`;
    images.forEach(a => { doc += `* ${a}\n`; });
    doc += '\n';
  }

  // Links — product categories only
  const catLinks = qa('#wayfinding-breadcrumbs_feature_div a, #nav-subnav a')
    .map(a => `* [${a.innerText.trim()}](${a.href})`)
    .filter(l => l.length > 10).slice(0, 6);
  if (catLinks.length) {
    doc += `## Categories\n\n${catLinks.join('\n')}\n`;
  }

  return { doc, slug, title, type: 'amazon' };
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

async function extract() {
  const type = getPageType();
  if (type === 'guideline') return extractGuideline();
  if (type === 'samples')   return extractSamples();
  if (type === 'api')       return extractAPI();
  if (type === 'amazon')    return extractAmazon();
  return extractGeneric();   // all other sites
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING CHIP UI
// ─────────────────────────────────────────────────────────────────────────────

// Icon: copy (two overlapping squares — matches Claude.ai)
// Icon: markdown box [M↓] — matches "View as Markdown" in Claude.ai
// Icon: asterisk / snowflake — Claude logo
const ICONS = {
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  markdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 15V9l3 3 3-3v6"/><path d="M16 9l-2 3 2 3"/></svg>`,
  claude: `<svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/></svg>`,
  caret: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
};

// Chip label — always "Copy page" on the main button
const CHIP_LABELS = {
  guideline: 'Copy page',
  samples:   'Copy page',
  api:       'Copy page',
  generic:   'Copy page',
};

// Icon for "Copy for Claude CLI"
const CLI_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;

function buildChip(pageType) {
  const root = document.createElement('div');
  root.id = 'sap-llm-root';
  const chipLabel = CHIP_LABELS[pageType] || 'Copy page';

  root.innerHTML = `
    <div id="sap-llm-chip">
      <button id="sap-llm-chip-main" data-action="copy">
        <div id="sap-llm-icon-wrap">
          <svg id="sap-llm-icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg id="sap-llm-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span id="sap-llm-chip-label">${chipLabel}</span>
      </button>
      <div id="sap-llm-chip-divider"></div>
      <button id="sap-llm-chip-caret">
        ${ICONS.caret}
      </button>
    </div>

    <div id="sap-llm-menu">
      <div class="sap-llm-item" data-action="copy">
        <div class="sap-llm-item-icon">${ICONS.copy}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">Copy page</span>
          <span class="sap-llm-item-subtitle">Copy page as Markdown for LLMs</span>
        </div>
      </div>
      <div class="sap-llm-item" data-action="download">
        <div class="sap-llm-item-icon">${ICONS.markdown}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">View as Markdown ↗</span>
          <span class="sap-llm-item-subtitle">View this page as plain text</span>
        </div>
      </div>
      <div class="sap-llm-item" data-action="open-claude">
        <div class="sap-llm-item-icon">${ICONS.claude}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">Open in Claude ↗</span>
          <span class="sap-llm-item-subtitle">Ask questions about this page</span>
        </div>
      </div>
    </div>

    <div id="sap-llm-toast"></div>`;

  return root;
}

function showToast(root, msg, isErr = false) {
  const toast = root.querySelector('#sap-llm-toast');
  toast.textContent = msg;
  toast.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = ''; }, 3000);
}

// Morphs chip icon: copy → checkmark → copy, and label: "Copy page" → "Copied!" → "Copy page"
function flashCopied(root) {
  const label = root.querySelector('#sap-llm-chip-label');
  const prev = label.textContent;
  root.classList.add('copied');
  label.textContent = 'Copied!';
  clearTimeout(root._copiedTimer);
  root._copiedTimer = setTimeout(() => {
    root.classList.remove('copied');
    label.textContent = prev;
  }, 1800);
}

function injectChip() {
  if (document.getElementById('sap-llm-root')) return;

  const type = getPageType(); // always has a value now — no more 'unknown'
  const root = buildChip(type);
  document.body.appendChild(root);

  let cached = null;
  let loading = false;

  const chipMain  = root.querySelector('#sap-llm-chip-main');
  const chipCaret = root.querySelector('#sap-llm-chip-caret');
  const label     = root.querySelector('#sap-llm-chip-label');
  const menu      = root.querySelector('#sap-llm-menu');
  const defaultLabel = CHIP_LABELS[type] || 'Copy page';

  async function ensureExtracted() {
    if (cached || loading) return;
    loading = true;
    label.textContent = 'Loading…';
    cached = await extract();
    label.textContent = defaultLabel;
    loading = false;
  }

  async function doAction(action) {
    await ensureExtracted();
    if (!cached) { showToast(root, 'Content not found — try reloading', true); return; }

    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(cached.doc);
        flashCopied(root);
      } catch {
        showToast(root, 'Clipboard blocked — use Download instead', true);
      }
    }

    if (action === 'download') {
      const blob = new Blob([cached.doc], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `${cached.slug}.md` }).click();
      URL.revokeObjectURL(url);
      showToast(root, `⬇ Downloading ${cached.slug}.md`);
    }

    if (action === 'open-claude') {
      const typeLabel = {
        guideline: 'SAP Fiori design guideline',
        samples:   'SAPUI5 Demo Kit samples page',
        api:       'SAPUI5 API reference',
        generic:   'page'
      }[cached.type] || 'page';

      const canonicalUrl = cached.type === 'api'    ? `https://ui5.sap.com/#/api/${cached.title}`
                         : cached.type === 'samples' ? `https://ui5.sap.com/#/entity/${cached.title}`
                         : location.href.replace(/[?#].*$/, '');

      const taskHint = cached.type === 'guideline' ? `Build a SAP Fiori screen using ${cached.title} according to these guidelines.`
                     : cached.type === 'api'        ? `Use these API properties and events to implement ${cached.title} in a SAP Fiori application.`
                     : cached.type === 'samples'    ? `Show me how to use ${cached.title} based on these samples and properties.`
                     : `Summarize the key information from this page.`;

      const prompt = [
        `# Task`,
        taskHint,
        ``,
        `# Source: ${typeLabel} for "${cached.title}"`,
        `URL: ${canonicalUrl}`,
        ``,
        cached.doc,
      ].join('\n');

      const ok = await navigator.clipboard.writeText(prompt).then(() => true).catch(() => false);
      if (ok) {
        flashCopied(root);
        window.open('https://claude.ai', '_blank');
      } else {
        showToast(root, 'Clipboard blocked — copy failed', true);
      }
    }
  }

  // Left side: copy directly
  chipMain.addEventListener('click', async e => {
    e.stopPropagation();
    await doAction('copy');
  });

  // Right caret: toggle dropdown + pre-fetch
  chipCaret.addEventListener('click', async e => {
    e.stopPropagation();
    const opening = !root.classList.contains('open');
    root.classList.toggle('open');
    if (opening) await ensureExtracted();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!root.contains(e.target)) root.classList.remove('open');
  }, true);

  // Menu item clicks
  menu.addEventListener('click', async e => {
    const item = e.target.closest('.sap-llm-item');
    if (!item) return;
    root.classList.remove('open');
    await doAction(item.dataset.action);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK EXPORT  (?bulk_export=true)
// ─────────────────────────────────────────────────────────────────────────────

function checkBulkMode() {
  if (!location.search.includes('bulk_export=true')) return;
  async function run() {
    const result = await extract();
    if (!result) { setTimeout(run, 1500); return; }
    const blob = new Blob([result.doc], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'),
      { href: url, download: `${result.slug}.md` }).click();
    URL.revokeObjectURL(url);
    setTimeout(() => window.close(), 2500);
  }
  document.readyState === 'complete'
    ? setTimeout(run, 1200)
    : window.addEventListener('load', () => setTimeout(run, 1200));
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

checkBulkMode();

// Expose extractor on window so Claude CLI can call it via Chrome MCP evaluate_script:
//   evaluate_script(() => window.__sapFetch().then(r => r.doc))
window.__sapFetch = extract;

// ui5.sap.com is a SPA — re-inject chip on every hash change
if (location.hostname.includes('ui5.sap.com')) {
  window.addEventListener('hashchange', () => {
    const existing = document.getElementById('sap-llm-root');
    if (existing) existing.remove();
    setTimeout(injectChip, 600);
  });
  setTimeout(injectChip, 1000);
} else {
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', injectChip)
    : injectChip();
}
