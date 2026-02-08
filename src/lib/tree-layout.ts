// Tree layout algorithm - matches TikZ sibling distance per level behavior
// Each level halves the sibling distance: level 1 = siblingDistance, level 2 = siblingDistance/2, etc.

import type { TreeNode, TreeSettings } from '@/types/tree';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface TreeNodeWithChildren {
  node: TreeNode;
  children: TreeNodeWithChildren[];
}

// Build tree structure from flat nodes array
function buildTree(nodes: TreeNode[]): TreeNodeWithChildren | null {
  if (nodes.length === 0) return null;

  const nodeMap = new Map<string, TreeNodeWithChildren>();

  for (const node of nodes) {
    nodeMap.set(node.id, { node, children: [] });
  }

  let root: TreeNodeWithChildren | null = null;
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parentId === null) {
      root = treeNode;
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(treeNode);
      }
    }
  }

  return root;
}

// TikZ-matching layout: siblings at depth d are spaced by siblingDistance / 2^(d-1)
// Children are centered around their parent's position
function layoutNode(
  node: TreeNodeWithChildren,
  x: number,
  y: number,
  depth: number,
  settings: TreeSettings,
  positions: NodePosition[]
): void {
  positions.push({ id: node.node.id, x, y });

  if (node.children.length === 0) return;

  const { levelDistance, siblingDistance, direction } = settings;
  const isHorizontal = direction === 'horizontal';

  // TikZ halves sibling distance at each level
  const sibDist = siblingDistance / Math.pow(2, depth);
  const totalWidth = (node.children.length - 1) * sibDist;

  const childPrimary = isHorizontal ? x + levelDistance : y + levelDistance;
  const parentSecondary = isHorizontal ? y : x;
  const startSecondary = parentSecondary - totalWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const childSecondary = startSecondary + i * sibDist;
    const childX = isHorizontal ? childPrimary : childSecondary;
    const childY = isHorizontal ? childSecondary : childPrimary;

    layoutNode(node.children[i], childX, childY, depth + 1, settings, positions);
  }
}

// Main layout function - computes positions for all nodes
export function computeTreeLayout(
  nodes: TreeNode[],
  settings: TreeSettings
): NodePosition[] {
  const positions: NodePosition[] = [];
  const root = buildTree(nodes);

  if (!root) return positions;

  const startX = settings.direction === 'horizontal' ? 50 : 400;
  const startY = settings.direction === 'horizontal' ? 300 : 50;
  layoutNode(root, startX, startY, 0, settings, positions);

  return positions;
}
