'use client';

// Tree node component - renders colored circle with label
// Supports click to select, double-click to add child
// Note: Labels are rendered separately via TreeCanvas for Safari foreignObject compatibility

import type { TreeNode } from '@/types/tree';
import type { MouseEvent } from 'react';
import { getColorHex } from '@/constants/colors';

interface TreeNodeComponentProps {
  node: TreeNode;
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  /** Measured width of center-position label for click hit area */
  centerLabelWidth?: number;
}

export function TreeNodeComponent({
  node,
  x,
  y,
  size,
  isSelected,
  onClick,
  onDoubleClick,
  centerLabelWidth,
}: TreeNodeComponentProps) {
  const fillColor = getColorHex(node.color);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.();
  };

  // When labelPosition is 'center', use a rectangle hit area matching the visible label
  if (node.labelPosition === 'center') {
    const w = centerLabelWidth ?? 30;
    const h = 30; // foreignObject height
    return (
      <g onClick={handleClick} onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
        <rect
          x={x - w / 2}
          y={y - h / 2}
          width={w}
          height={h}
          fill="transparent"
          stroke={isSelected ? '#3b82f6' : 'none'}
          strokeWidth={isSelected ? 2 : 0}
          rx={2}
        />
      </g>
    );
  }

  return (
    <g onClick={handleClick} onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
      {/* Node circle with selection highlight */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.75}
        fill={fillColor}
        stroke={isSelected ? '#3b82f6' : 'none'}
        strokeWidth={isSelected ? 3 : 0}
      />
    </g>
  );
}
