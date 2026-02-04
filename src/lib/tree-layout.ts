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
function layoutNode(
  node: TreeNodeWithChildren,
  x: number,
  y: number,
  settings: TreeSettings,
  positions: NodePosition[]
): void {
  positions.push({ id: node.node.id, x, y });

  if (node.children.length === 0) return;

  const { levelDistance, siblingDistance } = settings;
  const childY = y + levelDistance;

  // Calculate width for each child's subtree
  const childWidths = node.children.map((child) =>
    calculateSubtreeWidth(child, siblingDistance)
  );

  // Total width of all children subtrees + gaps between them
  const totalChildrenWidth =
    childWidths.reduce((sum, w) => sum + w, 0) +
    (node.children.length - 1) * siblingDistance;

  // Start from left edge, centered under parent
  let currentX = x - totalChildrenWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childSubtreeWidth = childWidths[i];

    // Position child at center of its subtree allocation
    const childX = currentX + childSubtreeWidth / 2;

    layoutNode(child, childX, childY, settings, positions);

    // Move to next position: current subtree width + gap
    currentX += childSubtreeWidth + siblingDistance;
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

  // Start root at center top
  layoutNode(root, 400, 50, settings, positions);

  return positions;
}
