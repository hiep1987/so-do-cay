// PNG export utility - render SVG to canvas and download

export async function exportPng(
  svgElement: SVGSVGElement,
  filename = 'tree-diagram.png',
  scale = 2 // Higher resolution output
) {
  // Clone SVG
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Get content bounds
  const group = svgElement.querySelector('g');
  const bbox = group?.getBBox() || new DOMRect(0, 0, 800, 600);
  const padding = 20;

  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;

  // Set viewBox to fit content
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

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
  const gridRect = clone.querySelector('rect[fill="url(#grid)"]');
  if (gridRect) {
    gridRect.remove();
  }

  // Remove zoom indicator
  const zoomText = clone.querySelector('text');
  if (zoomText) {
    zoomText.remove();
  }

  // Add white background rectangle
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', String(bbox.x - padding));
  bg.setAttribute('y', String(bbox.y - padding));
  bg.setAttribute('width', String(width));
  bg.setAttribute('height', String(height));
  bg.setAttribute('fill', 'white');
  clone.insertBefore(bg, clone.firstChild);

  // Serialize SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Load SVG as image
  const img = new Image();
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG image'));
  });

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Failed to get canvas context');
  }

  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);

  URL.revokeObjectURL(url);

  // Convert to PNG and download
  canvas.toBlob((blob) => {
    if (blob) {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }
  }, 'image/png');
}
