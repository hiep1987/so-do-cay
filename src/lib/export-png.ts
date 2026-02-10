// PNG export utility using native SVG→Canvas rendering
// Produces high-quality vector-crisp output without html2canvas dependency

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

/**
 * Prepare a clean SVG clone for export:
 * - Reset transform, set viewBox to content bounds
 * - Replace foreignObject with native SVG text
 * - Remove grid, background, zoom indicator
 * Returns { clone, width, height }
 */
function prepareExportSvg(svgElement: SVGSVGElement) {
  const group = svgElement.querySelector('g');
  const bbox = group?.getBBox() || new DOMRect(0, 0, 800, 600);

  // Expand bbox to include foreignObject label positions (rendered outside group)
  let minX = bbox.x;
  let minY = bbox.y;
  let maxX = bbox.x + bbox.width;
  let maxY = bbox.y + bbox.height;
  const labelFOs = svgElement.querySelectorAll('foreignObject');
  labelFOs.forEach((fo) => {
    const cx = parseFloat(fo.getAttribute('data-content-x') || '0');
    const cy = parseFloat(fo.getAttribute('data-content-y') || '0');
    // foreignObject has width=80, height=30
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

  // Set viewBox and dimensions using expanded bounds
  clone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('style');

  // Reset transform on main group
  const cloneGroup = clone.querySelector('g');
  if (cloneGroup) {
    cloneGroup.removeAttribute('transform');
  }

  // Replace foreignObjects with native SVG text elements
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject'));
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const contentX = parseFloat(fo.getAttribute('data-content-x') || '0');
    const contentY = parseFloat(fo.getAttribute('data-content-y') || '0');
    const labelPosition = fo.getAttribute('data-label-position') || '';

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

      // For center labels, add white background rect behind text (matches TikZ fill=white)
      if (labelPosition === 'center' && cloneGroup) {
        const textWidth = text.length * 8 + 6;
        const textHeight = 18;
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', String(contentX - textWidth / 2 + 40));
        bgRect.setAttribute('y', String(contentY + 15 - textHeight / 2));
        bgRect.setAttribute('width', String(textWidth));
        bgRect.setAttribute('height', String(textHeight));
        bgRect.setAttribute('fill', 'white');
        cloneGroup.appendChild(bgRect);
      }

      if (cloneGroup) {
        cloneGroup.appendChild(textElement);
      }
    }

    fo.remove();
  });

  // Remove grid pattern and background
  const gridPattern = clone.querySelector('defs');
  if (gridPattern) {
    gridPattern.remove();
  }
  const backgroundRects = clone.querySelectorAll('rect[fill^="url(#"]');
  backgroundRects.forEach((rect) => rect.remove());

  // Remove all UI hint texts (zoom %, "scroll: zoom", "drag: pan")
  clone.querySelectorAll(':scope > text').forEach((t) => t.remove());

  return { clone, width, height };
}

/**
 * Export SVG to high-quality PNG using native SVG→Canvas rendering.
 * Serializes cleaned SVG, loads as Image, draws onto scaled canvas.
 * Default scale=3 for crisp 3x resolution.
 */
export async function exportPng(
  svgElement: SVGSVGElement,
  filename = 'tree-diagram.png',
  scale = 3
) {
  const { clone, width, height } = prepareExportSvg(svgElement);

  // Add white background rect to the SVG itself
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', clone.viewBox.baseVal.x.toString());
  bgRect.setAttribute('y', clone.viewBox.baseVal.y.toString());
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'white');
  clone.insertBefore(bgRect, clone.firstChild);

  // Serialize SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // Load SVG as image and draw onto canvas
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

      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG at scaled resolution
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
        resolve();
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load SVG as image'));
    img.src = svgUrl;
  });

  URL.revokeObjectURL(svgUrl);
}
