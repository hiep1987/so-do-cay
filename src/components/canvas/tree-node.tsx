'use client';

// Tree node component - renders colored circle with label
// Supports click to select, double-click to add child

import type { TreeNode } from '@/types/tree';
import type { MouseEvent } from 'react';
import { LatexLabel } from './latex-label';
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

  return (
    <g onClick={handleClick} onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
      {/* Node circle with selection highlight */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={fillColor}
        stroke={isSelected ? '#3b82f6' : 'none'}
        strokeWidth={isSelected ? 3 : 0}
      />

      {/* Node label */}
      {node.label && (
        <LatexLabel
          text={node.label}
          x={x}
          y={y}
          position={node.labelPosition}
        />
      )}
    </g>
  );
}
