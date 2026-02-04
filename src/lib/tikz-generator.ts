// TikZ code generator for tree diagrams
// Generates LaTeX TikZ code matching the format in tikz.txt example

import { TreeNode, TreeEdge, TreeSettings, TreeDiagram } from '@/types/tree';

// Color mapping from app colors to TikZ color modifiers
const COLOR_MAP: Record<string, string> = {
  orange: 'orange!80',
  cyan: 'cyan!50',
  green: 'green!60!black',
  pink: 'pink!90',
  violet: 'violet!80',
  red: 'red!80',
  blue: 'blue!60',
  yellow: 'yellow!80',
  gray: 'gray!60',
};

// Convert pixels to cm (approximate ratio for TikZ)
function pxToCm(px: number): string {
  return (px / 40).toFixed(1) + 'cm';
}

// Calculate max depth of tree for level styles
function getMaxDepth(nodes: TreeNode[]): number {
  if (nodes.length === 0) return 0;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let maxDepth = 0;

  for (const node of nodes) {
    let depth = 0;
    let current: TreeNode | undefined = node;
    while (current?.parentId) {
      depth++;
      current = nodeMap.get(current.parentId);
    }
    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth;
}

// Generate TikZ style definitions
function generateStyles(settings: TreeSettings, maxDepth: number): string {
  const lines: string[] = [
    `  dot/.style={circle, fill=#1, inner sep=0pt, minimum size=${settings.nodeSize}pt}`,
  ];

  // Add level styles with halving sibling distance per level
  for (let i = 1; i <= maxDepth; i++) {
    const siblingDist = settings.siblingDistance / Math.pow(2, i - 1);
    lines.push(
      `  level ${i}/.style={sibling distance=${pxToCm(siblingDist)}, level distance=${pxToCm(settings.levelDistance)}}`
    );
  }

  lines.push(`  edge from parent/.style={draw, thick, black}`);
  return lines.join(',\n');
}

// Format node label for TikZ with position
function formatLabel(label: string, position: string): string {
  if (!label) return '';

  let formatted = label;
  // Already in math mode
  if (label.startsWith('$') && label.endsWith('$')) {
    formatted = `{${label}}`;
  }
  // Contains LaTeX commands (backslash) - needs math mode
  else if (label.includes('\\')) {
    formatted = `{$${label}$}`;
  }
  // Plain text - wrap in braces
  else {
    formatted = `{${label}}`;
  }

  return `, label=${position}:${formatted}`;
}

// Generate edge label markup
function generateEdgeLabel(edge: TreeEdge): string {
  if (!edge.label) return '';
  const pos = edge.labelPosition === 'left' ? 'left=5pt' : 'right=5pt';
  return ` edge from parent node[${pos}] {${edge.label}}`;
}

// Recursively generate node and children TikZ code
function generateNode(
  node: TreeNode,
  allNodes: TreeNode[],
  edgeMap: Map<string, TreeEdge>,
  depth: number,
  isRoot: boolean = false
): string {
  const indent = '\t'.repeat(depth);
  const color = COLOR_MAP[node.color] || node.color;
  const label = formatLabel(node.label, node.labelPosition);

  // Find children sorted by their original order
  const children = allNodes.filter((n) => n.parentId === node.id);

  // Root node uses \node, children use node (no backslash) in TikZ tree syntax
  const nodeCmd = isRoot ? '\\node' : 'node';
  let result = `${indent}${nodeCmd}[dot=${color}${label}] {}`;

  if (children.length > 0) {
    result += '\n';
    for (const child of children) {
      const edge = edgeMap.get(child.id);
      const childStr = generateNode(child, allNodes, edgeMap, depth + 1, false);
      const edgeLabel = edge ? generateEdgeLabel(edge) : '';
      result += `${indent}child {\n${childStr}${edgeLabel}\n${indent}}\n`;
    }
    result = result.trimEnd();
  }

  return result;
}

// Main TikZ generator function
export function generateTikZ(diagram: TreeDiagram): string {
  const { nodes, edges, settings } = diagram;

  if (nodes.length === 0) {
    return '% No tree to export\n\\begin{tikzpicture}\n\\end{tikzpicture}';
  }

  // Find root node
  const root = nodes.find((n) => n.parentId === null);
  if (!root) {
    return '% No root node found\n\\begin{tikzpicture}\n\\end{tikzpicture}';
  }

  // Build edge map (targetId -> edge) for quick lookup
  const edgeMap = new Map(edges.map((e) => [e.targetId, e]));

  // Calculate max depth for styles
  const maxDepth = getMaxDepth(nodes);

  // Generate styles
  const styles = generateStyles(settings, maxDepth);

  // Generate tree recursively (root uses \node, children use node)
  const tree = generateNode(root, nodes, edgeMap, 1, true);

  return `\\begin{tikzpicture}[
${styles}
]
${tree};
\\end{tikzpicture}`;
}
