// SVG export utility - serialize SVG element with proper viewBox

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

  // Remove zoom indicator text
  const zoomText = clone.querySelector('text');
  if (zoomText) {
    zoomText.remove();
  }

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
