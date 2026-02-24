'use client';

// KaTeX wrapper component for rendering LaTeX in SVG via foreignObject

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexLabelProps {
  text: string;
  x: number;
  y: number;
  position?: 'above' | 'below' | 'left' | 'right' | 'center';
  labelOffset?: number;
  // Transform props for Safari foreignObject fix
  viewX?: number;
  viewY?: number;
  scale?: number;
}

// Direction vectors for label positioning relative to anchor point
const POSITION_DIRS: Record<string, { dx: number; dy: number; anchor: string }> = {
  above: { dx: 0, dy: -1, anchor: 'middle' },
  below: { dx: 0, dy: 1, anchor: 'middle' },
  left: { dx: -1, dy: 0, anchor: 'end' },
  right: { dx: 1, dy: 0, anchor: 'start' },
  center: { dx: 0, dy: 0, anchor: 'middle' },
};

export function LatexLabel({ text, x, y, position = 'above', labelOffset, viewX = 0, viewY = 0, scale = 1 }: LatexLabelProps) {
  const dir = POSITION_DIRS[position];
  // For center position, no offset distance is applied
  const dist = position === 'center' ? 0 : (labelOffset ?? 20);
  const offset = { dx: dir.dx * dist, dy: dir.dy * dist, anchor: dir.anchor };

  // Preprocess LaTeX: convert \\ line breaks inside \text{} to \begin{array} for KaTeX
  const processedText = useMemo(() => {
    if (!text) return text;
    return text.replace(/\\text\s*\{([^}]*)\}/g, (match, content) => {
      if (!content.includes('\\\\')) return match;
      const lines = content.split('\\\\').map((l: string) => '\\text{' + l.trim() + '}');
      return '\\begin{array}{c}' + lines.join('\\\\') + '\\end{array}';
    });
  }, [text]);

  // Render LaTeX, fallback to plain text if parsing fails
  const html = useMemo(() => {
    if (!processedText) return '';

    try {
      return katex.renderToString(processedText, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return processedText;
    }
  }, [processedText]);

  if (!text) return null;

  // Apply transform manually for Safari foreignObject compatibility
  const transformedX = x * scale + viewX;
  const transformedY = y * scale + viewY;

  // Position-specific nudge to add clearance from node border
  const nudge = position === 'below' ? 5 : position === 'left' ? -5 : position === 'right' ? 5 : 0;

  // Calculate foreignObject position based on anchor
  const foWidth = position === 'center' ? 200 : 80;
  const foX = offset.anchor === 'end' ? transformedX + (offset.dx + nudge) * scale - 80
            : offset.anchor === 'start' ? transformedX + (offset.dx + nudge) * scale
            : transformedX + offset.dx * scale - (foWidth / 2);
  // For left/right positions, center label vertically relative to node
  // For center position, use larger foreignObject to fit multiline content
  const foHeight = position === 'center' ? 200 : 30;
  const belowNudge = position === 'below' ? 5 * scale : 0;
  const foY = (position === 'left' || position === 'right' || position === 'center')
            ? transformedY - (foHeight / 2) * scale
            : transformedY + offset.dy * scale - 10 + belowNudge;

  // Scale font size with zoom
  const fontSize = 14 * scale;

  // Store original content position for export (before transform applied)
  // Export will use these to recalculate position with scale=1, viewX=0, viewY=0
  const contentFoX = offset.anchor === 'end' ? x + (offset.dx + nudge) - 80
                   : offset.anchor === 'start' ? x + (offset.dx + nudge)
                   : x + offset.dx - (foWidth / 2);
  const contentFoY = (position === 'left' || position === 'right' || position === 'center')
                   ? y - foHeight / 2
                   : y + offset.dy - 10 + (position === 'below' ? 5 : 0);

  return (
    <foreignObject
      x={foX}
      y={foY}
      width={position === 'center' ? 200 : 80}
      height={foHeight}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
      data-original-text={text}
      data-text-align={offset.anchor === 'end' ? 'right' : offset.anchor === 'start' ? 'left' : 'center'}
      data-content-x={contentFoX}
      data-content-y={contentFoY}
      data-label-position={position}
    >
      {/* Wrapper div with explicit position to fix Safari foreignObject transform bug */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: position === 'center' ? 'flex' : undefined,
          alignItems: position === 'center' ? 'center' : undefined,
          justifyContent: position === 'center' ? 'center' : undefined,
        }}
      >
        <div
          className="latex-label"
          style={{
            fontSize: `${fontSize}px`,
            textAlign: offset.anchor === 'end' ? 'right'
                     : offset.anchor === 'start' ? 'left'
                     : 'center',
            whiteSpace: 'nowrap',
            height: position === 'center' ? 'auto' : '100%',
            display: 'flex',
            alignItems: (position === 'left' || position === 'right' || position === 'center') ? 'center' : 'flex-start',
            justifyContent: offset.anchor === 'end' ? 'flex-end'
                          : offset.anchor === 'start' ? 'flex-start'
                          : 'center',
            ...(position === 'center' ? {
              backgroundColor: 'white',
              color: '#000000',
              padding: `${1 * scale}px ${3 * scale}px`,
              width: 'fit-content',
              margin: '0 auto',
            } : {}),
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </foreignObject>
  );
}
