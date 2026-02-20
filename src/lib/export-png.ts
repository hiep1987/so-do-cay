// PNG export utility using SVG→Canvas rendering
// Uses native SVG <text> elements instead of foreignObject for cross-browser compatibility
// (Safari misrenders foreignObject in SVG data URIs)

import { createSvgLabelElement } from './latex-to-native-svg-text';

/**
 * Prepare SVG clone for PNG export with native SVG text labels.
 * Replaces foreignObject labels with SVG <text> elements for Safari compatibility.
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

  // Remove UI hint texts and grid BEFORE adding label elements
  clone.querySelectorAll(':scope > text').forEach((t) => t.remove());
  clone.querySelectorAll('defs').forEach((d) => {
    if (d.querySelector('pattern')) d.remove();
  });
  clone.querySelectorAll('rect[fill^="url(#"]').forEach((r) => r.remove());

  // Replace foreignObjects with native SVG text elements (same as SVG export)
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
    const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const labelPosition = fo.getAttribute('data-label-position') || '';

    if (originalText) {
      // Calculate anchor point matching the foreignObject layout
      const cx = textAlign === 'right' ? contentX + 80
               : textAlign === 'left' ? contentX
               : contentX + 40;
      // Vertical: left/right/center labels are vertically centered (mid of 30px height)
      // above/below labels align to top (~5px into 30px height)
      const cy = (labelPosition === 'left' || labelPosition === 'right' || labelPosition === 'center')
               ? contentY + 15
               : contentY + 5;
      const svgLabel = createSvgLabelElement(document, originalText, cx, cy, labelPosition);
      clone.appendChild(svgLabel);
    }
    fo.remove();
  });

  return { clone, width, height };
}

/**
 * Export SVG to high-quality PNG.
 * Uses native SVG text (no foreignObject) for cross-browser compatibility.
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

  // Serialize SVG to data: URI
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
