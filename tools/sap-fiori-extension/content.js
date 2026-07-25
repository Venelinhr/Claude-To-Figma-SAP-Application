/**
 * SAP Fiori → LLM — Content Script
 *
 * Runs on every SAP Fiori design system page.
 * Extracts the full guideline content into a structured Markdown document
 * compatible with the project's 17-field _schema.json format.
 *
 * Two modes:
 *   Normal: waits for popup to request extraction via chrome.runtime.onMessage
 *   Bulk:   detects ?bulk_export=true in URL, auto-downloads and closes tab
 */

'use strict';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function slugFromUrl(url) {
  return url.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop();
}

function tableToMarkdown(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  const lines = rows.map((row, i) => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .map(c => c.innerText.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim());
    const line = `| ${cells.join(' | ')} |`;
    if (i === 0) return line + '\n' + `| ${cells.map(() => '---').join(' | ')} |`;
    return line;
  });
  return lines.join('\n') + '\n';
}

// ── Core extractor ───────────────────────────────────────────────────────────

function extractGuideline() {
  const main = document.querySelector('main#main');
  if (!main) return null;

  const url   = window.location.href.replace(/[?#].*$/, '');
  const title = document.querySelector('h1')?.innerText?.trim() || document.title;
  const slug  = slugFromUrl(url);

  // ── Metadata (YAML frontmatter) ───────────────────────────────────────────
  const meta = {
    componentName: title,
    slug:          slug,
    sourceUrl:     url,
    status:        getMeta('uielementsstatus')  || 'Available',
    category:      getMeta('uielementscategory') || '',
    version:       'v1-148',
    lastChecked:   new Date().toISOString().slice(0, 10),
    lastModified:  getMeta('modified-time')  || '',
  };

  // ── Section content ───────────────────────────────────────────────────────
  let body = '';

  const sections = main.querySelectorAll('.section:not(.toc-container)');
  sections.forEach(section => {
    // Heading
    const h2 = section.querySelector('h2');
    if (h2) body += `\n## ${h2.innerText.trim()}\n\n`;

    // Walk content in DOM order
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        const tag = node.tagName.toLowerCase();
        if (['h2', 'script', 'style', 'nav'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (['h3', 'h4', 'p', 'ul', 'ol', 'table'].includes(tag)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const tag = node.tagName.toLowerCase();
      const text = node.innerText?.trim();
      if (!text) continue;

      if (tag === 'h3') {
        body += `### ${text}\n\n`;
      } else if (tag === 'h4') {
        body += `#### ${text}\n\n`;
      } else if (tag === 'p') {
        body += `${text}\n\n`;
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(node.querySelectorAll(':scope > li'))
          .map(li => `* ${li.innerText.trim().replace(/\n+/g, ' ')}`);
        body += items.join('\n') + '\n\n';
      } else if (tag === 'table') {
        body += tableToMarkdown(node) + '\n';
      }
    }

    // Visual descriptions (image alt texts)
    const imgs = Array.from(section.querySelectorAll('img[alt]'))
      .filter(i => i.alt.trim().length > 5);
    if (imgs.length) {
      imgs.forEach(i => {
        body += `> **Visual:** ${i.alt.trim()}\n\n`;
      });
    }
  });

  // ── Technical links block ─────────────────────────────────────────────────
  const apiLinks = Array.from(main.querySelectorAll('a[href*="ui5.sap.com"]'))
    .map(a => `* **${a.innerText.trim()}**: ${a.href}`)
    .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

  if (apiLinks.length) {
    body += `\n## Technical Implementation (API & Samples)\n\n`;
    body += apiLinks.join('\n') + '\n';
  }

  // ── Related components ────────────────────────────────────────────────────
  const related = Array.from(
    new Set(
      Array.from(main.querySelectorAll('a[href*="ui-elements/"]'))
        .map(a => a.innerText.trim())
        .filter(t => t && t !== title)
    )
  );
  if (related.length) {
    body += `\n## Related Components\n\n`;
    body += related.map(r => `* ${r}`).join('\n') + '\n';
  }

  // ── Assemble final document ───────────────────────────────────────────────
  let doc = `---\n`;
  doc += `componentName: "${meta.componentName}"\n`;
  doc += `slug: "${meta.slug}"\n`;
  doc += `sourceUrl: "${meta.sourceUrl}"\n`;
  doc += `status: "${meta.status}"\n`;
  doc += `category: "${meta.category}"\n`;
  doc += `version: "${meta.version}"\n`;
  doc += `lastChecked: "${meta.lastChecked}"\n`;
  if (meta.lastModified) doc += `lastModified: "${meta.lastModified}"\n`;
  doc += `---\n\n`;
  doc += `# ${title}\n\n`;
  doc += body.replace(/\n{3,}/g, '\n\n').trim();
  doc += '\n';

  return { doc, meta };
}

// ── Visual indicator badge ────────────────────────────────────────────────────

function showBadge(text, color = '#0070F2') {
  let badge = document.getElementById('sap-llm-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'sap-llm-badge';
    badge.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:999999',
      'padding:6px 12px', 'border-radius:6px', 'font:bold 12px/1.4 sans-serif',
      'color:#fff', 'box-shadow:0 2px 8px rgba(0,0,0,.25)', 'cursor:default',
      'transition:opacity .3s'
    ].join(';');
    document.body.appendChild(badge);
  }
  badge.textContent = text;
  badge.style.background = color;
  badge.style.opacity = '1';
}

function hideBadge(delay = 3000) {
  setTimeout(() => {
    const b = document.getElementById('sap-llm-badge');
    if (b) b.style.opacity = '0';
  }, delay);
}

// ── Message handler (from popup) ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extract') {
    const result = extractGuideline();
    if (result) {
      showBadge('✅ SAP Fiori — LLM Ready');
      hideBadge(2500);
      sendResponse({ ok: true, doc: result.doc, meta: result.meta });
    } else {
      sendResponse({ ok: false, error: 'main#main not found — page may still be loading' });
    }
  }
  return true; // keep channel open for async
});

// ── Bulk export mode ──────────────────────────────────────────────────────────
// Append ?bulk_export=true to any SAP guideline URL to trigger auto-download + tab close.

(function checkBulkMode() {
  if (!window.location.search.includes('bulk_export=true')) return;

  // Wait for page to fully render
  function runExport() {
    const result = extractGuideline();
    if (!result) {
      setTimeout(runExport, 1500);
      return;
    }

    showBadge('⬇ Exporting…', '#107E3E');

    const { doc, meta } = result;
    const fileName = `${meta.slug || meta.componentName.replace(/\s+/g, '_').toLowerCase()}.md`;
    const blob = new Blob([doc], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    showBadge(`✅ Saved ${fileName}`, '#107E3E');
    setTimeout(() => window.close(), 2500);
  }

  // Give the SPA a moment to hydrate before extracting
  if (document.readyState === 'complete') {
    setTimeout(runExport, 1200);
  } else {
    window.addEventListener('load', () => setTimeout(runExport, 1200));
  }
})();
