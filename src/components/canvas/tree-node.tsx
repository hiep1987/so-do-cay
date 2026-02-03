'use client';

// Tree node component - renders colored circle with label

import type { TreeNode } from '@/types/tree';
import { LatexLabel } from './latex-label';
import { getColorHex } from '@/constants/colors';

interface TreeNodeComponentProps {
  node: TreeNode;
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  onClick: () => void;
}

export function TreeNodeComponent({
  node,
  x,
  y,
  size,
  isSelected,
  onClick,
}: TreeNodeComponentProps) {
  const fillColor = getColorHex(node.color);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Node circle */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={fillColor}
        stroke={isSelected ? '#1f2937' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
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
