'use client';

// Tree edge component - renders line between nodes with probability label

import type { TreeEdge } from '@/types/tree';
import { LatexLabel } from './latex-label';

interface TreeEdgeComponentProps {
  edge: TreeEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function TreeEdgeComponent({
  edge,
  x1,
  y1,
  x2,
  y2,
}: TreeEdgeComponentProps) {
  // Calculate midpoint for label placement
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Offset label slightly based on position
  const labelOffset = edge.labelPosition === 'left' ? -15 : 15;

  return (
    <g>
      {/* Edge line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#374151"
        strokeWidth={1.5}
      />

      {/* Edge label (probability) */}
      {edge.label && (
        <LatexLabel
          text={edge.label}
          x={midX + labelOffset}
          y={midY}
          position={edge.labelPosition === 'left' ? 'left' : 'right'}
        />
      )}
    </g>
  );
}
