// SVG export utility - serialize SVG element with proper viewBox
// Uses native SVG text elements for maximum compatibility (Inkscape, Illustrator, etc.)

/**
 * Convert LaTeX commands to plain text for SVG export
 * Returns { text, hasOverline } for native SVG rendering
 */
function convertLatexToPlainText(latex: string): { text: string; hasOverline: boolean } {
  let result = latex;
  let hasOverline = false;

  // Handle \overline{...} - extract content and mark for overline
  const overlineMatch = result.match(/\\overline\{([^}]*)\}/);
  if (overlineMatch) {
    hasOverline = true;
    result = result.replace(/\\overline\{([^}]*)\}/g, '$1');
  }

  // Handle \bar{X} - use combining macron for single chars
  result = result.replace(/\\bar\{([^}]*)\}/g, '$1\u0304');

  // Handle \text{...} - just extract content
  result = result.replace(/\\text\{([^}]*)\}/g, '$1');

  // Remove remaining backslashes from other LaTeX commands
  result = result.replace(/\\\\/g, '');

  return { text: result, hasOverline };
}

/**
 * Create native SVG text element to replace foreignObject
 * This ensures compatibility with Inkscape, Illustrator, and other SVG editors
 */
function createSvgTextElement(
  doc: Document,
  text: string,
  x: number,
  y: number,
  textAlign: string,
  hasOverline: boolean
): SVGTextElement {
  const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');

  // Set position - adjust y for text baseline
  textEl.setAttribute('x', String(x));
  textEl.setAttribute('y', String(y));

  // Set text anchor based on alignment
  const anchor = textAlign === 'right' ? 'end' : textAlign === 'left' ? 'start' : 'middle';
  textEl.setAttribute('text-anchor', anchor);
  textEl.setAttribute('dominant-baseline', 'middle');

  // Set font styling - italic Times New Roman like the canvas
  textEl.setAttribute('font-family', '"Times New Roman", Georgia, serif');
  textEl.setAttribute('font-size', '14');
  textEl.setAttribute('font-style', 'italic');
  textEl.setAttribute('fill', '#000000');

  // Add overline decoration if needed
  if (hasOverline) {
    textEl.setAttribute('text-decoration', 'overline');
  }

  textEl.textContent = text;

  return textEl;
}

export function exportSvg(svgElement: SVGSVGElement, filename = 'tree-diagram.svg') {
  // Clone SVG to avoid modifying original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const doc = clone.ownerDocument;

  // Calculate bounding box of content
  const bbox = calculateContentBounds(svgElement);
  const padding = 40; // Increased padding for labels

  // Set viewBox to fit content with padding
  clone.setAttribute('viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
  );
  clone.setAttribute('width', String(bbox.width + padding * 2));
  clone.setAttribute('height', String(bbox.height + padding * 2));

  // Remove transform from main group (reset pan/zoom)
  const mainGroup = clone.querySelector('g');
  if (mainGroup) {
    mainGroup.removeAttribute('transform');
  }

  // Remove grid pattern and background
  const gridPattern = clone.querySelector('defs');
  if (gridPattern) {
    gridPattern.remove();
  }
  const gridRect = clone.querySelector('rect[fill="url(#grid)"]');
  if (gridRect) {
    gridRect.remove();
  }
  const dotsRect = clone.querySelector('rect[fill="url(#dots)"]');
  if (dotsRect) {
    dotsRect.remove();
  }

  // Remove zoom indicator text
  const zoomText = clone.querySelector('text');
  if (zoomText) {
    zoomText.remove();
  }

  // Replace foreignObject elements with native SVG text
  // foreignObject is not supported by Inkscape and other desktop SVG editors
  const foreignObjects = clone.querySelectorAll('foreignObject');
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';

    if (originalText) {
      // Get foreignObject position and dimensions
      const foX = parseFloat(fo.getAttribute('x') || '0');
      const foY = parseFloat(fo.getAttribute('y') || '0');
      const foWidth = parseFloat(fo.getAttribute('width') || '80');
      const foHeight = parseFloat(fo.getAttribute('height') || '30');

      // Calculate text position based on alignment
      let textX: number;
      if (textAlign === 'right') {
        textX = foX + foWidth;
      } else if (textAlign === 'left') {
        textX = foX;
      } else {
        textX = foX + foWidth / 2;
      }
      const textY = foY + foHeight / 2;

      // Convert LaTeX to plain text
      const { text, hasOverline } = convertLatexToPlainText(originalText);

      // Create native SVG text element
      const textEl = createSvgTextElement(doc, text, textX, textY, textAlign, hasOverline);

      // Replace foreignObject with text element
      fo.parentNode?.replaceChild(textEl, fo);
    } else {
      // Remove empty foreignObjects
      fo.remove();
    }
  });

  // Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });

  // Trigger download
  downloadBlob(blob, filename);
}

function calculateContentBounds(svg: SVGSVGElement): DOMRect {
  const group = svg.querySelector('g');
  if (group) {
    return group.getBBox();
  }
  return new DOMRect(0, 0, 800, 600);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
