// PNG export utility using html2canvas
// Replaces foreignObject with native SVG text for Safari compatibility

import html2canvas from 'html2canvas';

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
 * This avoids Safari's foreignObject rendering bugs
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

  // Adjust position: foreignObject has width=80, height=30
  // Text needs to be positioned at center of that box
  let textX = x + 40; // center of 80px width
  const textY = y + 15; // center of 30px height

  // Adjust X based on alignment
  if (textAlign === 'right') {
    textX = x + 80; // right edge
  } else if (textAlign === 'left') {
    textX = x; // left edge
  }

  textEl.setAttribute('x', String(textX));
  textEl.setAttribute('y', String(textY));

  // Set text anchor based on alignment
  const anchor = textAlign === 'right' ? 'end' : textAlign === 'left' ? 'start' : 'middle';
  textEl.setAttribute('text-anchor', anchor);
  textEl.setAttribute('dominant-baseline', 'middle');

  // Set font styling - italic Times New Roman
  textEl.setAttribute('font-family', '"Times New Roman", Georgia, serif');
  textEl.setAttribute('font-size', '16');
  textEl.setAttribute('font-style', 'italic');
  textEl.setAttribute('fill', '#000000');

  textEl.textContent = text;

  // If overline needed, create a group with text + line
  if (hasOverline) {
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(textEl);

    // Create overline as a line element
    // Estimate text width based on character count (approx 9px per char for 16px font)
    const textWidth = text.length * 9;
    const lineY = textY - 10; // Position above text

    // Calculate line start/end based on alignment
    let lineX1: number, lineX2: number;
    if (textAlign === 'right') {
      lineX1 = textX - textWidth;
      lineX2 = textX;
    } else if (textAlign === 'left') {
      lineX1 = textX;
      lineX2 = textX + textWidth;
    } else {
      lineX1 = textX - textWidth / 2;
      lineX2 = textX + textWidth / 2;
    }

    const lineEl = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineEl.setAttribute('x1', String(lineX1));
    lineEl.setAttribute('y1', String(lineY));
    lineEl.setAttribute('x2', String(lineX2));
    lineEl.setAttribute('y2', String(lineY));
    lineEl.setAttribute('stroke', '#000000');
    lineEl.setAttribute('stroke-width', '1');
    group.appendChild(lineEl);

    return group;
  }

  return textEl;
}

export async function exportPng(
  svgElement: SVGSVGElement,
  filename = 'tree-diagram.png',
  scale = 2
) {
  // Get content bounds from the main group
  const group = svgElement.querySelector('g');
  const bbox = group?.getBBox() || new DOMRect(0, 0, 800, 600);
  const padding = 20;
  const bottomPadding = 40; // Extra padding for bottom labels (below leaf nodes)

  const width = bbox.width + padding * 2;
  const height = bbox.height + padding + bottomPadding;

  // Create a container for export
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    background-color: white;
    z-index: 9999;
    overflow: hidden;
  `;
  container.id = 'export-container';

  // Clone the SVG
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Set viewBox to fit content with padding
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.style.display = 'block';
  clone.style.backgroundColor = 'white';

  // Reset transform on main group
  const cloneGroup = clone.querySelector('g');
  if (cloneGroup) {
    cloneGroup.removeAttribute('transform');
  }

  // Replace foreignObjects with native SVG text elements
  // This avoids Safari's buggy foreignObject rendering
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
    const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');

    if (originalText) {
      const { text, hasOverline } = convertLatexToPlainText(originalText);
      const textElement = createSvgTextElement(
        document,
        text,
        contentX,
        contentY,
        textAlign,
        hasOverline
      );

      // Insert text element into main group
      if (cloneGroup) {
        cloneGroup.appendChild(textElement);
      }
    }

    // Remove the foreignObject
    fo.remove();
  });

  // Remove grid pattern and background
  const gridPattern = clone.querySelector('defs');
  if (gridPattern) {
    gridPattern.remove();
  }
  const backgroundRects = clone.querySelectorAll('rect[fill^="url(#"]');
  backgroundRects.forEach((rect) => {
    rect.remove();
  });

  // Remove zoom indicator text
  const texts = clone.querySelectorAll('text');
  texts.forEach((text) => {
    if (text.textContent?.includes('%')) {
      text.remove();
    }
  });

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: scale,
      backgroundColor: 'white',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert to PNG and download
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
    }, 'image/png');
  } finally {
    document.body.removeChild(container);
  }
}
