// TikZ code generator for tree diagrams
// Generates LaTeX TikZ code matching the format in tikz.txt example

import { TreeNode, TreeEdge, TreeSettings, TreeDiagram } from '@/types/tree';

// Rotate label positions 90° clockwise for horizontal layout
// vertical→horizontal: left→above, right→below, above→left, below→right
const HORIZONTAL_POSITION_MAP: Record<string, string> = {
  left: 'above',
  right: 'below',
  above: 'left',
  below: 'right',
};

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
function formatLabel(label: string, position: string, labelOffset?: number, isHorizontal?: boolean): string {
  if (!label) return '';

  // Rotate position for horizontal layout
  const pos = isHorizontal ? (HORIZONTAL_POSITION_MAP[position] || position) : position;

  const distPt = Math.round((labelOffset ?? 15) / 3);
  // above: yshift>0, below: yshift<0, left: xshift<0, right: xshift>0
  const shiftAxis = (pos === 'left' || pos === 'right') ? 'xshift' : 'yshift';
  const sign = (pos === 'above' || pos === 'right') ? '' : '-';
  const shiftStyle = distPt !== 5 ? `[${shiftAxis}=${sign}${distPt}pt]` : '';

  const labelContent = (label.startsWith('$') && label.endsWith('$')) ? label : `$${label}$`;
  return `, label={${shiftStyle}${pos}:{${labelContent}}}`;
}

// Direction vectors matching canvas LatexLabel POSITION_DIRS (default offset = 15px)
const EDGE_LABEL_DIRS: Record<string, { dx: number; dy: number; anchor: string }> = {
  above: { dx: 0, dy: -1, anchor: 'south' },
  below: { dx: 0, dy: 1, anchor: 'north' },
  left: { dx: -1, dy: 0, anchor: 'east' },
  right: { dx: 1, dy: 0, anchor: 'west' },
};

// Generate edge label markup matching canvas positioning exactly
// Canvas computes: position = midpoint + (labelOffsetX, labelOffsetY) + direction*15px
// TikZ: use sloped=false so xshift/yshift are absolute (not path-relative)
function generateEdgeLabel(edge: TreeEdge, isHorizontal?: boolean): string {
  if (!edge.label) return '';
  // Rotate label position for horizontal layout
  const pos = isHorizontal ? (HORIZONTAL_POSITION_MAP[edge.labelPosition] || edge.labelPosition) : edge.labelPosition;
  const dir = EDGE_LABEL_DIRS[pos] || EDGE_LABEL_DIRS.left;
  // Convert px offsets to pt (calibrated: 1pt ≈ 1.667px, so px * 0.6 ≈ pt)
  // Note: direction offset (15px) is NOT added here because TikZ anchor already handles
  // the text alignment that the canvas achieves via its position direction shift
  const xPt = Math.round((edge.labelOffsetX ?? 0) * 0.6);
  // TikZ Y-axis is inverted relative to canvas (positive = up in TikZ, down in canvas)
  const yPt = -Math.round((edge.labelOffsetY ?? 0) * 0.6);
  return `edge from parent node[pos=0.5,sloped=false,anchor=${dir.anchor},xshift=${xPt}pt,yshift=${yPt}pt] {$${edge.label}$}`;
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
  isRoot: boolean = false,
  isHorizontal: boolean = false
): string {
  // Use 4 spaces per indent level
  const nodeIndent = '    '.repeat(depth);
  const childBlockIndent = '    '.repeat(depth + 1);
  const childContentIndent = '    '.repeat(depth + 2);
  const color = COLOR_MAP[node.color] || node.color;

  // When labelPosition is 'center', node becomes a text label (no dot circle)
  const isCenterLabel = node.labelPosition === 'center';

  let label = '';
  if (!isCenterLabel) {
    label = formatLabel(node.label, node.labelPosition, node.labelOffset, isHorizontal);
  }

  // TikZ vertical: renders children left-to-right (same as visual order, no reverse needed)
  // TikZ horizontal (grow=right): renders children bottom-to-top, reverse to match visual top-to-bottom
  const childNodes = allNodes.filter((n) => n.parentId === node.id);
  const children = isHorizontal ? childNodes.reverse() : childNodes;

  // Root node uses \node, children use node (no backslash) in TikZ tree syntax
  const nodeCmd = isRoot ? '\\node' : 'node';

  let result: string;
  if (isCenterLabel && node.label) {
    // Center label: node rendered as white-filled rectangle with label text
    const labelContent = (node.label.startsWith('$') && node.label.endsWith('$')) ? node.label : `$${node.label}$`;
    result = `${nodeIndent}${nodeCmd}[fill=white,rectangle,inner sep=1pt] {${labelContent}}`;
  } else {
    result = `${nodeIndent}${nodeCmd}[dot=${color}${label}] {}`;
  }

  if (children.length > 0) {
    result += '\n';
    for (const child of children) {
      const edge = edgeMap.get(child.id);
      // Child nodes are rendered at depth+2 (inside child { } block)
      const childStr = generateNode(child, allNodes, edgeMap, depth + 2, false, isHorizontal);
      const edgeLabel = edge ? generateEdgeLabel(edge, isHorizontal) : '';

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
  const isHorizontal = settings.direction === 'horizontal';
  const tree = generateNode(root, nodes, edgeMap, 0, true, isHorizontal);

  return `\\begin{tikzpicture}[
${styles}
]
${tree};
\\end{tikzpicture}`;
}
