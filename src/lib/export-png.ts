// PNG export utility using html2canvas for proper KaTeX/foreignObject rendering

import html2canvas from 'html2canvas';

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

  // Create a container for export
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.backgroundColor = 'white';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';

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

  // Set text color to black for export (canvas has white text on dark bg)
  const labels = clone.querySelectorAll('.latex-label');
  labels.forEach((label) => {
    (label as HTMLElement).style.color = '#000000';
  });

  // Hide KaTeX MathML elements to prevent duplicate text in export
  // KaTeX renders both HTML and MathML for accessibility, but html2canvas captures both
  const mathmlElements = clone.querySelectorAll('.katex-mathml');
  mathmlElements.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
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
