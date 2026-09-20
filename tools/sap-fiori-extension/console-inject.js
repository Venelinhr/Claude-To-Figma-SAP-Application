/**
 * SAP Fiori → LLM — Console Inject v2.0
 *
 * Paste this entire script into Chrome DevTools Console on any page.
 * Works on:
 *   sap.com/design-system/…        → SAP Fiori guideline (sections, tables, links)
 *   ui5.sap.com/#/api/…            → UI5 API reference (properties, events, methods)
 *   ui5.sap.com/#/entity/…         → UI5 samples (properties, events, samples list)
 *   any other site                 → generic extraction (main content, links)
 *
 * After running:
 *   - A "Copy page" chip appears top-right
 *   - window.__sapFetch() returns the extracted Markdown
 *
 * Quick test in console after injecting:
 *   window.__sapFetch().then(r => console.log(r.doc))
 */

(async function() {
  'use strict';

  // ── Remove any prior injection ──────────────────────────────────────────────
  document.getElementById('sap-llm-root')?.remove();
  document.getElementById('sap-llm-styles')?.remove();

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'sap-llm-styles';
  style.textContent = `
#sap-llm-root {
  all: initial;
  position: fixed;
  top: 76px;
  right: 16px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  color: #1d2d3e;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
#sap-llm-chip {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 100px;
  box-shadow: 0 1px 6px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.08);
  cursor: default;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
}
#sap-llm-chip-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 10px 12px;
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  transition: background .12s;
}
#sap-llm-chip-main:hover { background: #f0f1f3; }
#sap-llm-chip-label {
  font-size: 15px; font-weight: 600; color: #1a1a1a;
  transition: color .2s;
}
#sap-llm-root.copied #sap-llm-chip-label { color: #107E3E; }
#sap-llm-icon-wrap {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
#sap-llm-icon-wrap svg {
  position: absolute;
  inset: 0;
  width: 18px;
  height: 18px;
  color: #2c2c2c;
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), opacity .15s;
}
#sap-llm-icon-copy  { transform: scale(1);   opacity: 1; }
#sap-llm-icon-check { transform: scale(0.4); opacity: 0; }
#sap-llm-root.copied #sap-llm-icon-copy  { transform: scale(0.4); opacity: 0; }
#sap-llm-root.copied #sap-llm-icon-check { transform: scale(1);   opacity: 1; color: #107E3E; }
#sap-llm-root.copied #sap-llm-chip {
  box-shadow: 0 1px 6px rgba(16,126,62,.25), 0 0 0 1px rgba(16,126,62,.2);
  transition: box-shadow .2s;
}
#sap-llm-chip-divider {
  width: 1px;
  height: 20px;
  background: rgba(0,0,0,.14);
  flex-shrink: 0;
}
#sap-llm-chip-caret {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border: none;
  background: none;
  flex-shrink: 0;
}
#sap-llm-chip-caret:hover { background: #f0f1f3; }
#sap-llm-chip-caret svg {
  width: 16px; height: 16px; color: #2c2c2c;
  transition: transform .2s;
}
#sap-llm-root.open #sap-llm-chip-caret svg { transform: rotate(180deg); }
#sap-llm-menu {
  display: none;
  margin-top: 8px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 28px rgba(0,0,0,.14), 0 1px 6px rgba(0,0,0,.08);
  overflow: hidden;
  min-width: 260px;
  align-self: flex-end;
}
#sap-llm-root.open #sap-llm-menu { display: block; }
.sap-llm-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; cursor: pointer;
  transition: background .12s; border: none;
  background: none; width: 100%; text-align: left;
  box-sizing: border-box;
}
.sap-llm-item:hover { background: #f0f1f3; }
.sap-llm-item-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #f0f1f3; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.sap-llm-item-icon svg { width: 20px; height: 20px; color: #2c2c2c; }
.sap-llm-item-title {
  font-size: 14px; font-weight: 700; color: #1a1a1a;
  display: block;
}
.sap-llm-item-subtitle {
  font-size: 12px; color: #777; display: block; margin-top: 2px;
  font-weight: 400;
}
#sap-llm-toast {
  display: none; margin-top: 8px; padding: 7px 14px;
  border-radius: 8px; font-size: 12px; font-weight: 600;
  text-align: center; background: #107E3E; color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.15); align-self: flex-end;
}
#sap-llm-toast.show { display: block; }
#sap-llm-toast.err  { background: #BB0000; }
`;
  document.head.appendChild(style);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE TYPE DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  function getPageType() {
    const url = location.href;
    if (url.includes('sap.com/design-system/fiori-design-web') ||
        url.includes('experience.sap.com/fiori-design-web')) return 'guideline';
    if (url.includes('ui5.sap.com') && url.includes('#/entity/'))  return 'samples';
    if (url.includes('ui5.sap.com') && url.includes('#/api/'))     return 'api';
    if (/amazon\.(com|de|co\.uk|fr|it|es|co\.jp|ca|com\.au|in|nl|pl|se|sg)/.test(location.hostname)) return 'amazon';
    return 'generic';
  }

  function getClassName() {
    const raw = decodeURIComponent(location.hash || '');
    return raw
      .replace(/^#\/(api|entity)\//, '')
      .split(/[#/]/)[0]
      .trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

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

  function fixGuidelineUrl(url) {
    if (!url) return '';
    const m = url.match(/fiori-design-web\/([^/?#]+)/);
    if (m) return `https://www.sap.com/design-system/fiori-design-web/v1-148/ui-elements/${m[1]}`;
    return url;
  }

  function stripSince(text) {
    return text.replace(/<br><br><i>Since:.*?<\/i>/gi, '').replace(/\s*Since:\s*[\d.]+\.?\s*$/i, '').trim();
  }

  function cleanDesc(html = '') {
    return clean(stripSince(html)).replace(/\n/g, ' ').trim();
  }

  function getOwnProps(sym) {
    const meta = sym?.['ui5-metadata'];
    return (meta?.properties || []).filter(p => p.visibility === 'public');
  }

  function getPropType(p) {
    return p.typeInfo?.template || p.typeInfo?.type || p.type || '';
  }

  function nodeToMd(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      const text = a.innerText.trim();
      if (href && text) a.replaceWith(document.createTextNode(`[${text}](${href})`));
    });
    clone.querySelectorAll('img').forEach(img => {
      const alt = img.alt?.trim() || '';
      const src = img.src || img.dataset.src || '';
      if (alt || src) img.replaceWith(document.createTextNode(`\n\n![${alt}](${src})\n`));
    });
    return clone.innerText?.trim() || '';
  }

  function liToMd(li) {
    return nodeToMd(li).replace(/\n+/g, ' ');
  }

  function collectPageLinks(root) {
    const links = [];
    const seen = new Set();
    Array.from((root || document).querySelectorAll('a[href]')).forEach(a => {
      const href = a.href;
      const text = a.innerText?.trim();
      if (!href || !text || seen.has(href)) return;
      if (href.startsWith('javascript:') || href === location.href) return;
      if (['Copy URL', 'Learn more', 'Home', 'Back', 'UI5 Logo'].includes(text)) return;
      seen.add(href);
      links.push({ text, href });
    });
    return links;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTOR — GUIDELINE (sap.com/design-system/…)
  // ═══════════════════════════════════════════════════════════════════════════

  function extractGuideline() {
    const main = document.querySelector('main#main');
    if (!main) return null;

    const url   = location.href.replace(/[?#].*$/, '');
    const title = document.querySelector('h1')?.innerText?.trim() || document.title;
    const slug  = slugFromUrl(url);

    let doc = `---\n`;
    doc += `componentName: "${title}"\n`;
    doc += `slug: "${slug}"\n`;
    doc += `sourceUrl: "${url}"\n`;
    doc += `status: "${getMeta('uielementsstatus') || 'Available'}"\n`;
    doc += `category: "${getMeta('uielementscategory') || ''}"\n`;
    doc += `version: "v1-148"\n`;
    doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n`;
    doc += `---\n\n# ${title}\n\n`;

    const processed = new WeakSet();
    const sections = main.querySelectorAll('.section:not(.toc-container)');
    sections.forEach(section => {
      if (processed.has(section)) return;
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
        if (tag === 'h3')      doc += `### ${node.innerText.trim()}\n\n`;
        else if (tag === 'h4') doc += `#### ${node.innerText.trim()}\n\n`;
        else if (tag === 'p')  doc += `${nodeToMd(node)}\n\n`;
        else if (tag === 'ul' || tag === 'ol')
          doc += Array.from(node.querySelectorAll(':scope > li'))
            .map(li => `* ${liToMd(li)}`).join('\n') + '\n\n';
        else if (tag === 'table') doc += tableToMarkdown(node) + '\n';
      }
    });

    const SKIP_TEXT = new Set(['Copy URL','Learn more','Home','Back','UI5 Logo','Feedback',
      'SAPUI5','SAP Web Components','Figma']);
    const SKIP_HREF = /^(javascript:|mailto:)/;
    const seen = new Set();
    const ui5Links = [], figmaLinks = [], guideLinks = [], accessibilityLinks = [], otherLinks = [];

    Array.from(main.querySelectorAll('a[href]')).forEach(a => {
      const href = a.href;
      const text = a.innerText?.trim();
      if (!href || !text || seen.has(href)) return;
      if (SKIP_HREF.test(href) || SKIP_TEXT.has(text)) return;
      if (href === url) return;
      try {
        const hrefUrl = new URL(href);
        if (hrefUrl.pathname === new URL(url).pathname && hrefUrl.hash) return;
      } catch {}
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
      if (ui5Links.length)          doc += `### UI5 / API Reference\n\n${ui5Links.join('\n')}\n\n`;
      if (figmaLinks.length)        doc += `### Figma\n\n${figmaLinks.join('\n')}\n\n`;
      if (guideLinks.length)        doc += `### SAP Guidelines & Related\n\n${guideLinks.join('\n')}\n\n`;
      if (accessibilityLinks.length) doc += `### Accessibility Standards\n\n${accessibilityLinks.join('\n')}\n\n`;
      if (otherLinks.length)        doc += `### Other\n\n${otherLinks.join('\n')}\n\n`;
    }

    return { doc, slug, title, type: 'guideline' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTOR — UI5 SAMPLES (ui5.sap.com/#/entity/…)
  // ═══════════════════════════════════════════════════════════════════════════

  async function extractSamples() {
    const className = getClassName();
    if (!className) return null;

    const slug     = className.toLowerCase().replace(/\./g, '-');
    const main     = document.querySelector('main, [role="main"]');
    const pageText = main?.innerText || '';
    const since    = pageText.match(/Available Since:\s*([\d.]+)/)?.[1] || '';
    const category = pageText.match(/Category:\s*([^\n]+)/)?.[1]?.trim() || '';
    const density  = pageText.match(/Content Density:\s*([^\n]+)/)?.[1]?.trim() || '';

    const sampleRows = Array.from(document.querySelectorAll('[role="row"]'))
      .map(row => row.querySelector('[role="gridcell"]')?.innerText?.trim())
      .filter(Boolean);

    const sym    = await fetchUI5Symbol(className);
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
    doc += `availableSince: "${since}"\ncategory: "${category}"\ncontentDensity: "${density}"\n`;
    doc += `extends: "${sym?.extends || ''}"\nimplements: "${(sym?.implements || []).join(', ')}"\n`;
    doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n---\n\n# ${className} — Samples\n\n`;

    if (sym?.description) doc += `## Overview\n\n${clean(sym.description)}\n\n`;

    const ownProps = getOwnProps(sym);
    if (ownProps.length) {
      doc += `## Properties\n\n| Property | Type | Default | Since | Description |\n| --- | --- | --- | --- | --- |\n`;
      ownProps.forEach(p => {
        const type = getPropType(p);
        const def  = String(p.defaultValue ?? '');
        const desc = clean(p.description || '').slice(0, 150).replace(/\n/g, ' ');
        doc += `| \`${p.name}\` | \`${type}\` | \`${def}\` | ${p.since || ''} | ${desc} |\n`;
      });
      doc += '\n';
    }

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

    if (sampleRows.length) {
      doc += `## Available Samples\n\n`;
      sampleRows.forEach(s => { doc += `* ${s}\n`; });
      doc += '\n';
    }

    doc += `## Links\n\n* [Samples](https://ui5.sap.com/#/entity/${className})\n`;
    doc += `* [API Reference](https://ui5.sap.com/#/api/${className})\n`;
    if (uxLink) doc += `* [UX Guidelines](${uxLink})\n`;

    return { doc, slug, title: className, type: 'samples' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTOR — UI5 API (ui5.sap.com/#/api/…)
  // ═══════════════════════════════════════════════════════════════════════════

  async function extractAPI() {
    const className = getClassName();
    if (!className) return null;

    const slug   = className.toLowerCase().replace(/\./g, '-');
    const sym    = await fetchUI5Symbol(className);
    const meta   = sym?.['ui5-metadata'] || {};
    const uxLink = fixGuidelineUrl(sym?.uxGuidelinesLink || '');
    const pageText = document.querySelector('main, [role="main"]')?.innerText || '';
    const sinceRaw = pageText.match(/[Aa]vailable since[:\s]+([^\n]+)/)?.[1]?.trim() || sym?.since || '';
    const since  = sinceRaw.replace(/\.$/, '').trim();

    let doc = `---\ncomponentName: "${className}"\nslug: "${slug}"\n`;
    doc += `apiUrl: "https://ui5.sap.com/#/api/${className}"\n`;
    doc += `samplesUrl: "https://ui5.sap.com/#/entity/${className}"\n`;
    if (uxLink) doc += `guidelineUrl: "${uxLink}"\n`;
    if (since)  doc += `availableSince: "${since}"\n`;
    if (sym?.extends)           doc += `extends: "${sym.extends}"\n`;
    if (sym?.implements?.length) doc += `implements: "${sym.implements.join(', ')}"\n`;
    doc += `module: "${sym?.module || ''}"\n`;
    doc += `lastChecked: "${new Date().toISOString().slice(0, 10)}"\n---\n\n# ${className}\n\n`;

    if (sym?.description) doc += `## Overview\n\n${cleanDesc(sym.description)}\n\n`;

    doc += `## Constructor\n\n\`\`\`js\nnew ${className}(sId?, mSettings?)\n\`\`\`\n\n`;
    if (sym?.constructor?.description) {
      const ctorDesc = cleanDesc(sym.constructor.description)
        .replace(/\s*See sap\.ui\.base\..+$/s, '').trim();
      if (ctorDesc) doc += `${ctorDesc}\n\n`;
    }

    const ownProps = getOwnProps(sym);
    if (ownProps.length) {
      doc += `## Properties\n\n| Property | Type | Default | Since | Description |\n| --- | --- | --- | --- | --- |\n`;
      ownProps.forEach(p => {
        doc += `| \`${p.name}\` | \`${getPropType(p)}\` | \`${String(p.defaultValue ?? '')}\` | ${p.since || ''} | ${cleanDesc(p.description || '').slice(0, 200)} |\n`;
      });
      doc += '\n';
    }

    const ownAggs = (meta.aggregations || []).filter(a => a.visibility === 'public');
    if (ownAggs.length) {
      doc += `## Aggregations\n\n| Aggregation | Cardinality | Type | Since | Description |\n| --- | --- | --- | --- | --- |\n`;
      ownAggs.forEach(a => {
        doc += `| \`${a.name}\` | ${a.cardinality || ''} | \`${a.typeInfo?.template || a.type || ''}\` | ${a.since || ''} | ${cleanDesc(a.description || '').slice(0, 180)} |\n`;
      });
      doc += '\n';
    }

    const ownAssocs = (meta.associations || []).filter(a => a.visibility === 'public');
    if (ownAssocs.length) {
      doc += `## Associations\n\n| Association | Cardinality | Type | Since | Description |\n| --- | --- | --- | --- | --- |\n`;
      ownAssocs.forEach(a => {
        doc += `| \`${a.name}\` | ${a.cardinality || ''} | \`${a.type || ''}\` | ${a.since || ''} | ${cleanDesc(a.description || '').slice(0, 180)} |\n`;
      });
      doc += '\n';
    }

    const ownEvents = (sym?.events || []).filter(e => !e.borrowedFrom);
    if (ownEvents.length) {
      doc += `## Events\n\n| Event | Parameters | Since | Description |\n| --- | --- | --- | --- |\n`;
      const SKIP_PARAMS = new Set(['oControlEvent','getSource','getParameters']);
      ownEvents.forEach(e => {
        const params = (e.parameters || [])
          .filter(p => p.name && !SKIP_PARAMS.has(p.name))
          .map(p => `\`${p.name}\`: ${p.typeInfo?.template || p.type || ''}`).join(', ');
        doc += `| \`${e.name}\` | ${params || '—'} | ${e.since || ''} | ${cleanDesc(e.description || '').slice(0, 180)} |\n`;
      });
      doc += '\n';
    }

    const allPropNames = new Set(ownProps.map(p => p.name));
    const allMethods   = (sym?.methods || []).filter(m => m.visibility === 'public' && !m.borrowedFrom);
    const accessors    = [];
    const meaningful   = [];

    allMethods.forEach(m => {
      const name = m.name.replace(/^sap\.\w+\.\w+\./, '');
      if (/\.(extend|getMetadata)$/.test(m.name) || name === 'extend' || name === 'getMetadata') return;
      const propMatch = name.match(/^(get|set)([A-Z].+)$/);
      if (propMatch) {
        const prop = propMatch[2][0].toLowerCase() + propMatch[2].slice(1);
        if (allPropNames.has(prop)) { accessors.push({ ...m, cleanName: name }); return; }
      }
      meaningful.push({ ...m, cleanName: name });
    });

    if (meaningful.length) {
      doc += `## Methods\n\n| Method | Returns | Since | Description |\n| --- | --- | --- | --- |\n`;
      meaningful.forEach(m => {
        const sig  = (m.parameters || []).map(p => p.optional ? `${p.name}?` : p.name).join(', ');
        doc += `| \`${m.cleanName}(${sig})\` | \`${m.returnValue?.type || 'void'}\` | ${m.since || ''} | ${cleanDesc(m.description || '').slice(0, 200)} |\n`;
      });
      doc += '\n';
    }

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

    doc += `## Links\n\n* [API Reference](https://ui5.sap.com/#/api/${className})\n`;
    doc += `* [Samples](https://ui5.sap.com/#/entity/${className})\n`;
    if (uxLink) doc += `* [UX Guidelines](${uxLink})\n`;

    return { doc, slug, title: className, type: 'api' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTOR — AMAZON
  // ═══════════════════════════════════════════════════════════════════════════

  function extractAmazon() {
    const url   = location.href.replace(/[?#].*$/, '');
    const g     = id => document.getElementById(id)?.innerText?.trim() || '';
    const q     = sel => document.querySelector(sel)?.innerText?.trim() || '';
    const qa    = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const title = g('productTitle') || q('h1') || document.title;
    const brand = q('#bylineInfo, .po-brand .a-span9') || '';
    const slug  = url.split('/dp/')[1]?.split('/')[0] || slugFromUrl(url);
    const price = q('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay .a-offscreen, #corePrice_feature_div .a-offscreen') || '';
    const rating = q('#acrPopover .a-declarative, #averageCustomerReviews .a-icon-alt') || '';
    const reviews = q('#acrCustomerReviewText') || '';
    const availability = g('availability') || q('#outOfStock') || '';
    const bullets = qa('#feature-bullets li:not(.aok-hidden) span.a-list-item')
      .map(li => li.innerText.trim())
      .filter(t => t.length > 5 && !t.includes('Make sure'));
    const description = q('#productDescription p, #productDescription span') || '';
    const specs = [];
    qa('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr').forEach(row => {
      const cells = qa('td, th', row).map(c => c.innerText.replace(/[\n\t]+/g, ' ').trim()).filter(Boolean);
      if (cells.length >= 2) specs.push(`| ${cells.join(' | ')} |`);
    });

    let doc = `---\ntitle: "${title.replace(/"/g, '\\"')}"\nsite: "${location.hostname}"\nurl: "${url}"\n`;
    if (brand) doc += `brand: "${brand.replace(/[Vv]isit |^By /,'').trim()}"\n`;
    if (price) doc += `price: "${price}"\n`;
    if (rating) doc += `rating: "${rating}"\n`;
    if (reviews) doc += `reviews: "${reviews}"\n`;
    doc += `extracted: "${new Date().toISOString().slice(0, 10)}"\n---\n\n# ${title}\n\n`;
    if (bullets.length) { doc += `## Key Features\n\n`; bullets.forEach(b => { doc += `* ${b}\n`; }); doc += '\n'; }
    if (description) doc += `## Description\n\n${description}\n\n`;
    if (specs.length) { doc += `## Technical Specifications\n\n| Specification | Value |\n| --- | --- |\n${specs.join('\n')}\n\n`; }

    return { doc, slug, title, type: 'amazon' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTOR — GENERIC (any site)
  // ═══════════════════════════════════════════════════════════════════════════

  function extractGeneric() {
    const url      = location.href.replace(/[?#].*$/, '');
    const title    = document.querySelector('h1')?.innerText?.trim() || document.title;
    const slug     = slugFromUrl(url) || 'page';
    const desc     = document.querySelector('meta[name="description"]')?.content?.trim()
                  || document.querySelector('meta[property="og:description"]')?.content?.trim() || '';
    const siteName = document.querySelector('meta[property="og:site_name"]')?.content?.trim()
                  || location.hostname.replace(/^www\./, '');
    const author   = document.querySelector('meta[name="author"]')?.content?.trim()
                  || document.querySelector('[rel="author"]')?.innerText?.trim() || '';
    const published = document.querySelector('time[datetime]')?.getAttribute('datetime')
                   || document.querySelector('meta[property="article:published_time"]')?.content || '';

    let doc = `---\ntitle: "${title.replace(/"/g, '\\"')}"\nsite: "${siteName}"\nurl: "${url}"\n`;
    if (author)    doc += `author: "${author}"\n`;
    if (published) doc += `published: "${published}"\n`;
    if (desc)      doc += `description: "${desc.replace(/"/g, '\\"')}"\n`;
    doc += `extracted: "${new Date().toISOString().slice(0, 10)}"\n---\n\n# ${title}\n\n`;
    if (desc) doc += `> ${desc}\n\n`;

    const mainEl =
      document.querySelector('main, article, [role="main"]')
      || document.querySelector('#main-content, #content, #article, #post')
      || document.querySelector('.article-body, .post-content, .entry-content, .story-body')
      || document.body;

    const BLOCK_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','ul','ol','table','blockquote','pre','figure']);
    const SKIP_TAGS  = new Set(['script','style','nav','header','footer','aside','noscript','iframe','form']);
    const SKIP_ROLES = new Set(['navigation','banner','complementary','contentinfo','search']);

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
      if (tag === 'h1') continue;
      else if (tag === 'h2')  doc += `\n## ${text}\n\n`;
      else if (tag === 'h3')  doc += `\n### ${text}\n\n`;
      else if (tag === 'h4')  doc += `\n#### ${text}\n\n`;
      else if (tag === 'h5' || tag === 'h6') doc += `\n##### ${text}\n\n`;
      else if (tag === 'p')   doc += `${nodeToMd(node)}\n\n`;
      else if (tag === 'blockquote') doc += `> ${text.replace(/\n/g, '\n> ')}\n\n`;
      else if (tag === 'pre') doc += `\`\`\`\n${text}\n\`\`\`\n\n`;
      else if (tag === 'ul' || tag === 'ol')
        doc += Array.from(node.querySelectorAll(':scope > li')).map(li => `* ${liToMd(li)}`).join('\n') + '\n\n';
      else if (tag === 'table') doc += tableToMarkdown(node) + '\n';
    }

    const SKIP_LINK_TEXT = new Set(['', 'read more', 'more', 'click here', 'here', 'link', '↗', '→']);
    const seenLinks = new Set();
    const pageLinks = [];
    Array.from(mainEl.querySelectorAll('a[href]')).forEach(a => {
      const href = a.href;
      const text = (a.innerText?.trim().split('\n')[0] || '').trim();
      if (!href || seenLinks.has(href)) return;
      if (/^(javascript:|mailto:|tel:|#)/.test(href)) return;
      if (SKIP_LINK_TEXT.has(text.toLowerCase())) return;
      if (href === url) return;
      if (text.length < 4 || text.length > 120) return;
      seenLinks.add(href);
      pageLinks.push(`* [${text}](${href})`);
    });
    if (pageLinks.length) doc += `\n## Links\n\n${pageLinks.slice(0, 30).join('\n')}\n`;

    return { doc, slug, title, type: 'generic' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN EXTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  async function extract() {
    const type = getPageType();
    if (type === 'guideline') return extractGuideline();
    if (type === 'samples')   return extractSamples();
    if (type === 'api')       return extractAPI();
    if (type === 'amazon')    return extractAmazon();
    return extractGeneric();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHIP UI
  // ═══════════════════════════════════════════════════════════════════════════

  const ICONS = {
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    markdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 15V9l3 3 3-3v6"/><path d="M16 9l-2 3 2 3"/></svg>`,
    claude: `<svg fill="currentColor" fill-rule="evenodd" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/></svg>`,
    caret: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  };

  const root = document.createElement('div');
  root.id = 'sap-llm-root';
  root.innerHTML = `
    <div id="sap-llm-chip">
      <button id="sap-llm-chip-main" data-action="copy">
        <div id="sap-llm-icon-wrap">
          <svg id="sap-llm-icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg id="sap-llm-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span id="sap-llm-chip-label">Copy page</span>
      </button>
      <div id="sap-llm-chip-divider"></div>
      <button id="sap-llm-chip-caret">${ICONS.caret}</button>
    </div>
    <div id="sap-llm-menu">
      <div class="sap-llm-item" data-action="copy">
        <div class="sap-llm-item-icon">${ICONS.copy}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">Copy page</span>
          <span class="sap-llm-item-subtitle">Copy as Markdown for LLMs</span>
        </div>
      </div>
      <div class="sap-llm-item" data-action="download">
        <div class="sap-llm-item-icon">${ICONS.markdown}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">Download as .md ↗</span>
          <span class="sap-llm-item-subtitle">Save Markdown file to disk</span>
        </div>
      </div>
      <div class="sap-llm-item" data-action="open-claude">
        <div class="sap-llm-item-icon">${ICONS.claude}</div>
        <div class="sap-llm-item-text">
          <span class="sap-llm-item-title">Open in Claude ↗</span>
          <span class="sap-llm-item-subtitle">Copy + open claude.ai</span>
        </div>
      </div>
    </div>
    <div id="sap-llm-toast"></div>`;
  document.body.appendChild(root);

  let cached  = null;
  let loading = false;

  const chipMain  = root.querySelector('#sap-llm-chip-main');
  const chipCaret = root.querySelector('#sap-llm-chip-caret');
  const label     = root.querySelector('#sap-llm-chip-label');
  const menu      = root.querySelector('#sap-llm-menu');

  function showToast(msg, isErr = false) {
    const toast = root.querySelector('#sap-llm-toast');
    toast.textContent = msg;
    toast.className = 'show' + (isErr ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.className = ''; }, 3000);
  }

  function flashCopied() {
    root.classList.add('copied');
    label.textContent = 'Copied!';
    clearTimeout(root._copiedTimer);
    root._copiedTimer = setTimeout(() => {
      root.classList.remove('copied');
      label.textContent = 'Copy page';
    }, 1800);
  }

  async function ensureExtracted() {
    if (cached || loading) return;
    loading = true;
    label.textContent = 'Loading…';
    cached = await extract();
    label.textContent = 'Copy page';
    loading = false;
  }

  async function doAction(action) {
    await ensureExtracted();
    if (!cached) { showToast('Content not found — try reloading', true); return; }

    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(cached.doc);
        flashCopied();
      } catch {
        showToast('Clipboard blocked — use Download instead', true);
      }
    }

    if (action === 'download') {
      const blob = new Blob([cached.doc], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `${cached.slug}.md` }).click();
      URL.revokeObjectURL(url);
      showToast(`⬇ Downloading ${cached.slug}.md`);
    }

    if (action === 'open-claude') {
      const typeLabel = { guideline: 'SAP Fiori design guideline', samples: 'SAPUI5 Demo Kit samples', api: 'SAPUI5 API reference', generic: 'page' }[cached.type] || 'page';
      const prompt = `# Task\nSummarize the key information from this ${typeLabel}.\n\n# Source: "${cached.title}"\nURL: ${location.href}\n\n${cached.doc}`;
      const ok = await navigator.clipboard.writeText(prompt).then(() => true).catch(() => false);
      if (ok) { flashCopied(); window.open('https://claude.ai', '_blank'); }
      else showToast('Clipboard blocked', true);
    }
  }

  chipMain.addEventListener('click', async e => { e.stopPropagation(); await doAction('copy'); });
  chipCaret.addEventListener('click', async e => {
    e.stopPropagation();
    const opening = !root.classList.contains('open');
    root.classList.toggle('open');
    if (opening) await ensureExtracted();
  });
  document.addEventListener('click', e => { if (!root.contains(e.target)) root.classList.remove('open'); }, true);
  menu.addEventListener('click', async e => {
    const item = e.target.closest('.sap-llm-item');
    if (!item) return;
    root.classList.remove('open');
    await doAction(item.dataset.action);
  });

  // ── Expose on window ───────────────────────────────────────────────────────
  window.__sapFetch = extract;

  // ── Console feedback ───────────────────────────────────────────────────────
  const pageType = getPageType();
  console.log(`%c SAP → LLM injected ✓`, 'background:#107E3E;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold');
  console.log(`%c Page type: ${pageType}`, 'color:#107E3E;font-weight:bold');
  console.log(`%c Quick test: window.__sapFetch().then(r => console.log(r.doc))`, 'color:#666;font-style:italic');

})();
