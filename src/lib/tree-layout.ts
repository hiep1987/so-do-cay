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

// Count leaf nodes in a subtree
function countLeaves(node: TreeNodeWithChildren): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// Calculate subtree width based on leaf count
// Uses uniform leaf spacing so all leaves are evenly distributed
function calculateSubtreeWidth(
  node: TreeNodeWithChildren,
  leafSpacing: number
): number {
  const leaves = countLeaves(node);
  // Width = space needed for all leaves (gaps between them)
  return (leaves - 1) * leafSpacing;
}

// Recursive layout function using leaf-count-based subtree widths
// Ensures all leaves are evenly spaced like TikZ
function layoutNode(
  node: TreeNodeWithChildren,
  x: number,
  y: number,
  settings: TreeSettings,
  positions: NodePosition[],
  leafSpacing: number
): void {
  positions.push({ id: node.node.id, x, y });

  if (node.children.length === 0) return;

  const { levelDistance, direction } = settings;
  const isHorizontal = direction === 'horizontal';

  // Calculate width for each child's subtree based on leaf count
  const childWidths = node.children.map((child) =>
    calculateSubtreeWidth(child, leafSpacing)
  );

  // Total width = sum of child subtree widths + gaps between children
  const totalChildrenWidth =
    childWidths.reduce((sum, w) => sum + w, 0) +
    (node.children.length - 1) * leafSpacing;

  const childPrimary = isHorizontal ? x + levelDistance : y + levelDistance;
  let currentSecondary = (isHorizontal ? y : x) - totalChildrenWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childSubtreeWidth = childWidths[i];

    const childSecondary = currentSecondary + childSubtreeWidth / 2;

    const childX = isHorizontal ? childPrimary : childSecondary;
    const childY = isHorizontal ? childSecondary : childPrimary;

    layoutNode(child, childX, childY, settings, positions, leafSpacing);

    currentSecondary += childSubtreeWidth + leafSpacing;
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
  // Use siblingDistance as the uniform spacing between leaves
  const leafSpacing = settings.siblingDistance;
  layoutNode(root, startX, startY, settings, positions, leafSpacing);

  return positions;
}
