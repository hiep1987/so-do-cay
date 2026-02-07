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

// Generate TikZ style definitions (4-space indent to match reference)
function generateStyles(settings: TreeSettings, maxDepth: number): string {
  const lines: string[] = [
    `    dot/.style={circle, fill=#1, inner sep=0pt, minimum size=${settings.nodeSize}pt}`,
  ];

  // Add grow direction for horizontal mode
  if (settings.direction === 'horizontal') {
    lines.push(`    grow=right`);
  }

  // Add level styles with halving sibling distance per level
  for (let i = 1; i <= maxDepth; i++) {
    const siblingDist = settings.siblingDistance / Math.pow(2, i - 1);
    lines.push(
      `    level ${i}/.style={sibling distance=${pxToCm(siblingDist)}, level distance=${pxToCm(settings.levelDistance)}}`
    );
  }

  lines.push(`    edge from parent/.style={draw, thick, black}`);
  return lines.join(',\n');
}

// Format node label for TikZ with position
// Users input LaTeX directly (e.g., \text{Gốc } O, \overline{A})
function formatLabel(label: string, position: string, labelOffset?: number): string {
  if (!label) return '';

  const distPt = Math.round((labelOffset ?? 15) / 3);
  // above: yshift>0, below: yshift<0, left: xshift<0, right: xshift>0
  const shiftAxis = (position === 'left' || position === 'right') ? 'xshift' : 'yshift';
  const sign = (position === 'above' || position === 'right') ? '' : '-';
  const shiftStyle = distPt !== 5 ? `[${shiftAxis}=${sign}${distPt}pt]` : '';

  const labelContent = (label.startsWith('$') && label.endsWith('$')) ? label : `$${label}$`;
  return `, label={${shiftStyle}${position}:{${labelContent}}}`;
}

// Generate edge label markup (returns just the edge statement, caller handles indentation)
function generateEdgeLabel(edge: TreeEdge): string {
  if (!edge.label) return '';
  const offsetPt = Math.round((edge.labelOffset ?? 15) / 3);
  const posMap: Record<string, string> = {
    left: `left=${offsetPt}pt`,
    right: `right=${offsetPt}pt`,
    above: `above=${offsetPt}pt`,
    below: `below=${offsetPt}pt`,
  };
  const pos = posMap[edge.labelPosition] || `left=${offsetPt}pt`;
  return `edge from parent node[${pos}] {$${edge.label}$}`;
}

// Recursively generate node and children TikZ code
// Reference format indentation:
//   \node[...] {}         <- root at indent 0
//       child {           <- indent 4
//           node[...] {}  <- indent 8
//           edge from parent ...
//       }
function generateNode(
  node: TreeNode,
  allNodes: TreeNode[],
  edgeMap: Map<string, TreeEdge>,
  depth: number,
  isRoot: boolean = false
): string {
  // Use 4 spaces per indent level
  const nodeIndent = '    '.repeat(depth);
  const childBlockIndent = '    '.repeat(depth + 1);
  const childContentIndent = '    '.repeat(depth + 2);
  const color = COLOR_MAP[node.color] || node.color;
  const label = formatLabel(node.label, node.labelPosition, node.labelOffset);

  // Find children sorted by their original order
  const children = allNodes.filter((n) => n.parentId === node.id);

  // Root node uses \node, children use node (no backslash) in TikZ tree syntax
  const nodeCmd = isRoot ? '\\node' : 'node';
  let result = `${nodeIndent}${nodeCmd}[dot=${color}${label}] {}`;

  if (children.length > 0) {
    result += '\n';
    for (const child of children) {
      const edge = edgeMap.get(child.id);
      // Child nodes are rendered at depth+2 (inside child { } block)
      const childStr = generateNode(child, allNodes, edgeMap, depth + 2, false);
      const edgeLabel = edge ? generateEdgeLabel(edge) : '';

      // Format matching reference:
      //     child {
      //         node[...] {}
      //         edge from parent ...
      //     }
      result += `${childBlockIndent}child {\n`;
      result += `${childStr}\n`;
      if (edgeLabel) {
        result += `${childContentIndent}${edgeLabel}\n`;
      }
      result += `${childBlockIndent}}\n`;
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

  // Generate tree recursively (root at depth 0 = no indent, children indented)
  const tree = generateNode(root, nodes, edgeMap, 0, true);

  return `\\begin{tikzpicture}[
${styles}
]
${tree};
\\end{tikzpicture}`;
}
