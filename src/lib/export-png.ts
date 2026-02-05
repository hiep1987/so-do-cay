// PNG export utility using html2canvas for proper KaTeX/foreignObject rendering

import html2canvas from 'html2canvas';

/**
 * Convert LaTeX commands to styled HTML for PNG export
 * Uses CSS text-decoration: overline for continuous overline (instead of per-character combining chars)
 */
function convertLatexToStyledHtml(latex: string): string {
  let result = latex;

  // Handle \overline{...} - wrap in span with CSS overline for continuous line
  result = result.replace(/\\overline\{([^}]*)\}/g, '<span style="text-decoration: overline; text-decoration-thickness: 1px;">$1</span>');

  // Handle \bar{X} - single character macron (keep using combining char for single chars)
  result = result.replace(/\\bar\{([^}]*)\}/g, '$1\u0304');

  // Handle \text{...} - just extract content
  result = result.replace(/\\text\{([^}]*)\}/g, '$1');

  // Remove remaining backslashes from other LaTeX commands
  result = result.replace(/\\\\/g, '');

  return result;
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

  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;

  // Create a container for export with explicit black text color
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
    color: #000000 !important;
  `;

  // Add style element to force black text color on all descendants
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #export-container, #export-container * {
      color: #000000 !important;
      opacity: 1 !important;
    }
  `;
  container.id = 'export-container';
  container.appendChild(styleEl);

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

  // Remove grid pattern and background
  const gridPattern = clone.querySelector('defs');
  if (gridPattern) {
    gridPattern.remove();
  }
  // Remove both grid and dots pattern backgrounds
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

  // Replace KaTeX content with styled HTML for proper rendering
  // KaTeX fonts don't support Vietnamese diacritics, so use styled HTML with system fonts
  const foreignObjects = clone.querySelectorAll('foreignObject');
  foreignObjects.forEach((fo) => {
    const originalText = fo.getAttribute('data-original-text') || '';
    const textAlign = fo.getAttribute('data-text-align') || 'center';
    // Find the label div - either with .latex-label class or direct child div
    const labelDiv = fo.querySelector('.latex-label') || fo.querySelector('div');

    if (labelDiv && originalText) {
      // Convert LaTeX to styled HTML: \overline{AB} uses CSS text-decoration for continuous line
      const styledHtml = convertLatexToStyledHtml(originalText);

      // Clear existing KaTeX content and set styled HTML
      (labelDiv as HTMLElement).innerHTML = styledHtml;
      (labelDiv as HTMLElement).style.cssText = `
        font-size: 16px !important;
        font-family: "Times New Roman", Georgia, serif !important;
        font-style: italic !important;
        color: #000000 !important;
        text-align: ${textAlign} !important;
        white-space: nowrap !important;
        opacity: 1 !important;
      `;
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
