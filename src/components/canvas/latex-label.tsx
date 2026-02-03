'use client';

// KaTeX wrapper component for rendering LaTeX in SVG via foreignObject

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexLabelProps {
  text: string;
  x: number;
  y: number;
  position?: 'above' | 'below' | 'left' | 'right';
}

// Offsets for label positioning relative to anchor point
const POSITION_OFFSETS: Record<string, { dx: number; dy: number; anchor: string }> = {
  above: { dx: 0, dy: -15, anchor: 'middle' },
  below: { dx: 0, dy: 20, anchor: 'middle' },
  left: { dx: -10, dy: 5, anchor: 'end' },
  right: { dx: 10, dy: 5, anchor: 'start' },
};

export function LatexLabel({ text, x, y, position = 'above' }: LatexLabelProps) {
  const offset = POSITION_OFFSETS[position];

  // Render LaTeX, fallback to plain text if parsing fails
  const html = useMemo(() => {
    if (!text) return '';

    try {
      return katex.renderToString(text, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return text;
    }
  }, [text]);

  if (!text) return null;

  // Calculate foreignObject position based on anchor
  const foX = offset.anchor === 'end' ? x + offset.dx - 80
            : offset.anchor === 'start' ? x + offset.dx
            : x + offset.dx - 40;
  const foY = y + offset.dy - 10;

  return (
    <foreignObject
      x={foX}
      y={foY}
      width={80}
      height={30}
      style={{ overflow: 'visible' }}
    >
      <div
        style={{
          fontSize: '14px',
          textAlign: offset.anchor === 'end' ? 'right'
                   : offset.anchor === 'start' ? 'left'
                   : 'center',
          whiteSpace: 'nowrap',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  );
}
