'use client';

// Tree node component - renders colored circle with label

import type { TreeNode } from '@/types/tree';
import { LatexLabel } from './latex-label';

// Color palette for tree nodes
const COLORS: Record<string, string> = {
  orange: '#f97316',
  cyan: '#06b6d4',
  green: '#22c55e',
  pink: '#ec4899',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
};

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
  const fillColor = COLORS[node.color] || node.color || COLORS.orange;

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
