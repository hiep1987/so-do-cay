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
 * Create native SVG text element (or group with overline) to replace foreignObject
 * Uses a line element for overline since text-decoration is not supported in Inkscape
 */
function createSvgTextElement(
  doc: Document,
  text: string,
  x: number,
  y: number,
  textAlign: string,
  hasOverline: boolean
): SVGElement {
  const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');

  // Set position
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

  textEl.textContent = text;

  // If overline needed, create a group with text + line
  if (hasOverline) {
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(textEl);

    // Create overline as a line element
    // Estimate text width based on character count (approx 8px per char for 14px font)
    const textWidth = text.length * 8;
    const lineY = y - 9; // Position above text

    // Calculate line start/end based on alignment
    let lineX1: number, lineX2: number;
    if (textAlign === 'right') {
      lineX1 = x - textWidth;
      lineX2 = x;
    } else if (textAlign === 'left') {
      lineX1 = x;
      lineX2 = x + textWidth;
    } else {
      lineX1 = x - textWidth / 2;
      lineX2 = x + textWidth / 2;
    }

    const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(lineX1));
    line.setAttribute('y1', String(lineY));
    line.setAttribute('x2', String(lineX2));
    line.setAttribute('y2', String(lineY));
    line.setAttribute('stroke', '#000000');
    line.setAttribute('stroke-width', '1');

    group.appendChild(line);
    return group;
  }

  return textEl;
}

export function exportSvg(svgElement: SVGSVGElement, filename = 'tree-diagram.svg') {
  // Clone SVG to avoid modifying original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const doc = clone.ownerDocument;

  // Remove background color style (canvas dark mode color)
  clone.style.backgroundColor = '';
  clone.removeAttribute('style');

  // Calculate bounding box including label positions outside the group
  const bbox = calculateContentBounds(svgElement);
  let minX = bbox.x;
  let minY = bbox.y;
  let maxX = bbox.x + bbox.width;
  let maxY = bbox.y + bbox.height;

  // Expand bounds to include foreignObject labels (rendered outside main group)
  const labelFOs = svgElement.querySelectorAll('foreignObject');
  labelFOs.forEach((fo) => {
    const cx = parseFloat(fo.getAttribute('data-content-x') || '0');
    const cy = parseFloat(fo.getAttribute('data-content-y') || '0');
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx + 80);
    maxY = Math.max(maxY, cy + 30);
  });

  const padding = 40;
  const bottomPadding = 60;
  const width = (maxX - minX) + padding * 2;
  const height = (maxY - minY) + padding + bottomPadding;

  // Set viewBox to fit content with padding
  clone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

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

  // Remove all UI hint texts (zoom %, "scroll: zoom", "drag: pan")
  clone.querySelectorAll(':scope > text').forEach((t) => t.remove());

  // Replace foreignObject elements with native SVG text
  // foreignObject is not supported by Inkscape and other desktop SVG editors
  const foreignObjects = clone.querySelectorAll('foreignObject');
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';

    if (originalText) {
      // Use pre-calculated content coordinates (stored in latex-label.tsx)
      const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
      const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');
      const labelPosition = fo.getAttribute('data-label-position') || '';
      const foWidth = 80;
      const foHeight = 30;

      // Calculate text position based on alignment
      let textX: number;
      if (textAlign === 'right') {
        textX = contentX + foWidth;
      } else if (textAlign === 'left') {
        textX = contentX;
      } else {
        textX = contentX + foWidth / 2;
      }
      const textY = contentY + foHeight / 2;

      // Convert LaTeX to plain text
      const { text, hasOverline } = convertLatexToPlainText(originalText);

      // Create native SVG text element
      const textEl = createSvgTextElement(doc, text, textX, textY, textAlign, hasOverline);

      // For center labels, add white background rect behind text (matches TikZ fill=white)
      if (labelPosition === 'center') {
        const textWidth = text.length * 8 + 6; // approx char width + padding
        const textHeight = 18;
        const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', String(textX - textWidth / 2));
        bgRect.setAttribute('y', String(textY - textHeight / 2));
        bgRect.setAttribute('width', String(textWidth));
        bgRect.setAttribute('height', String(textHeight));
        bgRect.setAttribute('fill', 'white');
        if (mainGroup) {
          mainGroup.appendChild(bgRect);
        }
      }

      // Insert into main group and remove foreignObject
      if (mainGroup) {
        mainGroup.appendChild(textEl);
      }
      fo.remove();
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
