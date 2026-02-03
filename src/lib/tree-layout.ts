// Tree layout algorithm - computes node positions for tree diagram

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

// Calculate subtree width (for centering parent above children)
function calculateSubtreeWidth(
  node: TreeNodeWithChildren,
  siblingDistance: number
): number {
  if (node.children.length === 0) return 0;

  let totalWidth = 0;
  for (let i = 0; i < node.children.length; i++) {
    const childWidth = calculateSubtreeWidth(node.children[i], siblingDistance);
    totalWidth += Math.max(childWidth, siblingDistance);
  }
  // Subtract one siblingDistance since we don't need gap after last child
  return totalWidth - siblingDistance;
}

// Recursive layout function
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

  // Calculate total width needed for all children
  const childWidths = node.children.map(
    (child) => Math.max(calculateSubtreeWidth(child, siblingDistance), siblingDistance)
  );
  const totalWidth = childWidths.reduce((sum, w) => sum + w, 0) - siblingDistance;

  // Start position for first child (centered below parent)
  let currentX = x - totalWidth / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childWidth = childWidths[i];
    const childX = currentX + childWidth / 2;

    layoutNode(child, childX, childY, settings, positions);
    currentX += childWidth;
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
