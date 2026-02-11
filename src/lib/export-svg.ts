// SVG export utility - serialize SVG with native <text> elements (no foreignObject)
// Uses native SVG text for Inkscape/Illustrator compatibility

import { createSvgLabelElement } from './latex-to-native-svg-text';

export function exportSvg(svgElement: SVGSVGElement, filename = 'tree-diagram.svg') {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const doc = clone.ownerDocument;
  clone.removeAttribute('style');

  const bbox = (svgElement.querySelector('g')?.getBBox()) || new DOMRect(0, 0, 800, 600);
  let minX = bbox.x, minY = bbox.y;
  let maxX = bbox.x + bbox.width, maxY = bbox.y + bbox.height;

  // Expand bounds to include label foreignObjects
  const labelFOs = svgElement.querySelectorAll('foreignObject');
  labelFOs.forEach((fo) => {
    const cx = parseFloat(fo.getAttribute('data-content-x') || '0');
    const cy = parseFloat(fo.getAttribute('data-content-y') || '0');
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx + 80);
    maxY = Math.max(maxY, cy + 30);
  });

  const padding = 40, bottomPadding = 60;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding + bottomPadding;
  clone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const mainGroup = clone.querySelector('g');
  if (mainGroup) mainGroup.removeAttribute('transform');

  // Remove grid patterns and background rects
  clone.querySelectorAll('defs').forEach((d) => { if (d.querySelector('pattern')) d.remove(); });
  clone.querySelectorAll('rect[fill^="url(#"]').forEach((r) => r.remove());
  // Remove UI hint texts (direct children text elements)
  clone.querySelectorAll(':scope > text').forEach((t) => t.remove());

  // Replace foreignObjects with native SVG text elements appended to clone root
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
    const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const labelPosition = fo.getAttribute('data-label-position') || '';

    if (originalText) {
      // Match text anchor point to the flexbox alignment used in the live canvas
      const cx = textAlign === 'right' ? contentX + 80
               : textAlign === 'left' ? contentX
               : contentX + 40;
      // Vertical: left/right/center use align-items:center (mid of 30px height)
      // above/below use align-items:flex-start (top ~5px into 30px height)
      const cy = (labelPosition === 'left' || labelPosition === 'right' || labelPosition === 'center')
               ? contentY + 15
               : contentY + 5;
      const svgLabel = createSvgLabelElement(doc, originalText, cx, cy, labelPosition);
      clone.appendChild(svgLabel);
    }
    fo.remove();
  });

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
