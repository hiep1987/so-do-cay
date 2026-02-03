'use client';

// Tree edge component - renders line between nodes with probability label
// Has invisible wider hit area for easier clicking

import type { TreeEdge } from '@/types/tree';
import type { MouseEvent } from 'react';
import { LatexLabel } from './latex-label';

interface TreeEdgeComponentProps {
  edge: TreeEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TreeEdgeComponent({
  edge,
  x1,
  y1,
  x2,
  y2,
  isSelected = false,
  onClick,
}: TreeEdgeComponentProps) {
  // Calculate midpoint for label placement
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Offset label slightly based on position
  const labelOffset = edge.labelPosition === 'left' ? -15 : 15;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Invisible wider line for easier clicking */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={12}
      />
      {/* Visible edge line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isSelected ? '#2563eb' : '#374151'}
        strokeWidth={isSelected ? 2.5 : 1.5}
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
