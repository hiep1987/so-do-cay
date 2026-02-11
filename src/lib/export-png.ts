// PNG export utility using SVG→Canvas rendering
// Embeds KaTeX HTML with inlined CSS in foreignObject for accurate LaTeX rendering
// Uses data: URI to avoid tainted canvas security restriction

import katex from 'katex';

/**
 * Collect KaTeX CSS from page stylesheets for embedding in export SVG.
 */
function getKatexCss(): string {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules);
      const hasKatex = rules.some((r) => r.cssText.includes('.katex'));
      if (hasKatex) {
        return rules.map((r) => r.cssText).join('\n');
      }
    } catch {
      // Cross-origin stylesheet, skip
    }
  }
  return '';
}

/**
 * Create a self-contained foreignObject with KaTeX-rendered HTML for export.
 * Positioned at content coordinates (scale=1, no pan offset).
 */
function createExportForeignObject(
  doc: Document,
  originalText: string,
  contentX: number,
  contentY: number,
  textAlign: string,
  labelPosition: string
): SVGForeignObjectElement {
  const fo = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject') as SVGForeignObjectElement;
  fo.setAttribute('x', String(contentX));
  fo.setAttribute('y', String(contentY));
  fo.setAttribute('width', '80');
  fo.setAttribute('height', '30');
  fo.setAttribute('style', 'overflow: visible;');

  let html: string;
  try {
    html = katex.renderToString(originalText, { throwOnError: false, displayMode: false });
  } catch {
    html = originalText;
  }

  const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign === 'left' ? 'flex-start' : 'center';
  const alignItems = (labelPosition === 'left' || labelPosition === 'right' || labelPosition === 'center')
    ? 'center' : 'flex-start';
  let extraStyle = '';
  if (labelPosition === 'center') {
    extraStyle = 'background-color: white; color: #000000; padding: 1px 3px; width: fit-content; margin: 0 auto;';
  }

  // Build XHTML body with xmlns for SVG foreignObject embedding
  const xhtmlBody = `<div xmlns="http://www.w3.org/1999/xhtml" style="position: relative; width: 100%; height: 100%;"><div style="font-size: 14px; white-space: nowrap; height: 100%; display: flex; align-items: ${alignItems}; justify-content: ${justifyContent}; ${extraStyle}">${html}</div></div>`;

  fo.innerHTML = xhtmlBody;
  return fo;
}

/**
 * Prepare SVG clone for PNG export with embedded KaTeX foreignObjects.
 * Inlines KaTeX CSS so the SVG is fully self-contained.
 */
function prepareExportSvg(svgElement: SVGSVGElement) {
  const group = svgElement.querySelector('g');
  const bbox = group?.getBBox() || new DOMRect(0, 0, 800, 600);

  let minX = bbox.x;
  let minY = bbox.y;
  let maxX = bbox.x + bbox.width;
  let maxY = bbox.y + bbox.height;
  const labelFOs = svgElement.querySelectorAll('foreignObject');
  labelFOs.forEach((fo) => {
    const cx = parseFloat(fo.getAttribute('data-content-x') || '0');
    const cy = parseFloat(fo.getAttribute('data-content-y') || '0');
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx + 80);
    maxY = Math.max(maxY, cy + 30);
  });

  const padding = 20;
  const bottomPadding = 40;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding + bottomPadding;

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('style');

  const cloneGroup = clone.querySelector('g');
  if (cloneGroup) {
    cloneGroup.removeAttribute('transform');
  }

  // Inject KaTeX CSS into SVG defs for self-contained rendering
  const katexCss = getKatexCss();
  if (katexCss) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = katexCss;
    defs.appendChild(style);
    clone.insertBefore(defs, clone.firstChild);
  }

  // Replace cloned foreignObjects with fresh KaTeX-rendered ones at export coords
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
    const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');
    const labelPosition = fo.getAttribute('data-label-position') || '';

    if (originalText) {
      const exportFo = createExportForeignObject(
        document, originalText, contentX, contentY, textAlign, labelPosition
      );
      // Append to SVG root (not group) — matches live canvas layout
      clone.appendChild(exportFo);
    }
    fo.remove();
  });

  // Remove grid pattern defs (keep our KaTeX CSS defs)
  clone.querySelectorAll('defs').forEach((d) => {
    if (d.querySelector('pattern')) d.remove();
  });
  clone.querySelectorAll('rect[fill^="url(#"]').forEach((r) => r.remove());

  // Remove UI hint texts
  clone.querySelectorAll(':scope > text').forEach((t) => t.remove());

  return { clone, width, height };
}

/**
 * Export SVG to high-quality PNG.
 * Uses data: URI (not blob: URI) to avoid tainted canvas with foreignObject.
 * Default scale=3 for crisp 3x resolution.
 */
export async function exportPng(
  svgElement: SVGSVGElement,
  filename = 'tree-diagram.png',
  scale = 3
) {
  const { clone, width, height } = prepareExportSvg(svgElement);

  // Add white background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', clone.viewBox.baseVal.x.toString());
  bgRect.setAttribute('y', clone.viewBox.baseVal.y.toString());
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'white');
  clone.insertBefore(bgRect, clone.firstChild);

  // Serialize SVG to data: URI (avoids tainted canvas from foreignObject)
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

  const img = new Image();
  img.width = width;
  img.height = height;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load SVG as image'));
    img.src = svgDataUrl;
  });
}
