// Tree layout algorithm - computes symmetric node positions for tree diagram

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

  // Create TreeNodeWithChildren for each node
  for (const node of nodes) {
    nodeMap.set(node.id, { node, children: [] });
  }

  // Link children to parents
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

// Count leaf nodes in subtree (for proper width calculation)
function countLeaves(node: TreeNodeWithChildren): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// Calculate subtree width based on leaf count for symmetric distribution
function calculateSubtreeWidth(
  node: TreeNodeWithChildren,
  siblingDistance: number
): number {
  const leafCount = countLeaves(node);
  // Width = (leafCount - 1) * siblingDistance to center properly
  return (leafCount - 1) * siblingDistance;
}

// Recursive layout function with symmetric distribution
// Supports both vertical (top-down) and horizontal (left-to-right) directions
function layoutNode(
  node: TreeNodeWithChildren,
  x: number,
  y: number,
  settings: TreeSettings,
  positions: NodePosition[]
): void {
  positions.push({ id: node.node.id, x, y });

  if (node.children.length === 0) return;

  const { levelDistance, siblingDistance, direction } = settings;
  const isHorizontal = direction === 'horizontal';

  // Calculate width for each child's subtree
  const childWidths = node.children.map((child) =>
    calculateSubtreeWidth(child, siblingDistance)
  );

  // Total width of all children subtrees + gaps between them
  const totalChildrenWidth =
    childWidths.reduce((sum, w) => sum + w, 0) +
    (node.children.length - 1) * siblingDistance;

  // In horizontal mode: children go right (X+), spread vertically (Y)
  // In vertical mode: children go down (Y+), spread horizontally (X)
  const childPrimary = isHorizontal ? x + levelDistance : y + levelDistance;
  let currentSecondary = (isHorizontal ? y : x) - totalChildrenWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childSubtreeWidth = childWidths[i];

    const childSecondary = currentSecondary + childSubtreeWidth / 2;

    const childX = isHorizontal ? childPrimary : childSecondary;
    const childY = isHorizontal ? childSecondary : childPrimary;

    layoutNode(child, childX, childY, settings, positions);

    currentSecondary += childSubtreeWidth + siblingDistance;
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

  // Start root at center-top (vertical) or left-center (horizontal)
  const startX = settings.direction === 'horizontal' ? 50 : 400;
  const startY = settings.direction === 'horizontal' ? 300 : 50;
  layoutNode(root, startX, startY, settings, positions);

  return positions;
}
