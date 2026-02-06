'use client';

// Tree edge component - renders line between nodes with probability label
// Has invisible wider hit area for easier clicking
// Note: Labels are rendered separately via TreeCanvas for Safari foreignObject compatibility

import type { TreeEdge } from '@/types/tree';
import type { MouseEvent } from 'react';

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
    </g>
  );
}
