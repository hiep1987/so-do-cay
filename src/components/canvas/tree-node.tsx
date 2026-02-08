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
}

export function TreeNodeComponent({
  node,
  x,
  y,
  size,
  isSelected,
  onClick,
  onDoubleClick,
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

  // When labelPosition is 'center', hide the circle (label replaces the node)
  if (node.labelPosition === 'center') {
    return (
      <g onClick={handleClick} onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Invisible hit area for click/selection */}
        <circle
          cx={x}
          cy={y}
          r={size * 0.75}
          fill="transparent"
          stroke={isSelected ? '#3b82f6' : 'none'}
          strokeWidth={isSelected ? 3 : 0}
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
