// SVG export utility - serialize SVG element with proper viewBox

/**
 * Convert LaTeX commands to styled HTML for SVG export
 * Uses CSS text-decoration for overline (same as PNG export)
 */
function convertLatexToStyledHtml(latex: string): string {
  let result = latex;

  // Handle \overline{...} - wrap in span with CSS overline
  result = result.replace(/\\overline\{([^}]*)\}/g, '<span style="text-decoration: overline; text-decoration-thickness: 1px;">$1</span>');

  // Handle \bar{X} - single character macron
  result = result.replace(/\\bar\{([^}]*)\}/g, '$1\u0304');

  // Handle \text{...} - just extract content
  result = result.replace(/\\text\{([^}]*)\}/g, '$1');

  // Remove remaining backslashes from other LaTeX commands
  result = result.replace(/\\\\/g, '');

  return result;
}

export function exportSvg(svgElement: SVGSVGElement, filename = 'tree-diagram.svg') {
  // Clone SVG to avoid modifying original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Calculate bounding box of content
  const bbox = calculateContentBounds(svgElement);
  const padding = 20;

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

  // Remove grid pattern and background (first rect with url(#grid))
  const gridPattern = clone.querySelector('defs');
  if (gridPattern) {
    gridPattern.remove();
  }
  const gridRect = clone.querySelector('rect[fill="url(#grid)"]');
  if (gridRect) {
    gridRect.remove();
  }
  // Also remove dots pattern background
  const dotsRect = clone.querySelector('rect[fill="url(#dots)"]');
  if (dotsRect) {
    dotsRect.remove();
  }

  // Remove zoom indicator text
  const zoomText = clone.querySelector('text');
  if (zoomText) {
    zoomText.remove();
  }

  // Fix duplicate labels: Replace KaTeX content with simple styled HTML
  // KaTeX renders both katex-html and katex-mathml, causing text duplication when serialized
  const foreignObjects = clone.querySelectorAll('foreignObject');
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    const labelDiv = fo.querySelector('.latex-label') || fo.querySelector('div');

    if (labelDiv && originalText) {
      // Convert LaTeX to styled HTML (same as PNG export)
      const styledHtml = convertLatexToStyledHtml(originalText);

      // Replace KaTeX content with simple styled HTML to avoid duplication
      (labelDiv as HTMLElement).innerHTML = styledHtml;
      (labelDiv as HTMLElement).style.cssText = `
        font-size: 14px;
        font-family: "Times New Roman", Georgia, serif;
        font-style: italic;
        text-align: ${textAlign};
        white-space: nowrap;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: ${textAlign === 'right' ? 'flex-end' : textAlign === 'left' ? 'flex-start' : 'center'};
      `;
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
