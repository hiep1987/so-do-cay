'use client';

// SVG canvas component with pan/zoom and tree rendering - dark mode developer tool aesthetic

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, type MouseEvent, type WheelEvent } from 'react';
import { useTreeStore } from '@/hooks/use-tree-store';
import { useTreeLayout } from '@/hooks/use-tree-layout';
import { TreeNodeComponent } from './tree-node';
import { TreeEdgeComponent } from './tree-edge';

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

// Interface for exposing SVG element to parent components (for export)
export interface TreeCanvasRef {
  getSvgElement: () => SVGSVGElement | null;
}

// Default probability tree matching reference TikZ format
// Structure: Root O → A/Ā → B/B̄
// Labels use LaTeX format directly for TikZ export
const SAMPLE_NODES = [
  { id: 'root', parentId: null, label: '\\text{Gốc } O', labelPosition: 'above' as const, color: 'orange' },
  { id: 'a', parentId: 'root', label: 'A', labelPosition: 'left' as const, color: 'cyan' },
  { id: 'a-bar', parentId: 'root', label: '\\overline{A}', labelPosition: 'right' as const, color: 'green' },
  { id: 'b1', parentId: 'a', label: 'B', labelPosition: 'below' as const, color: 'pink' },
  { id: 'b1-bar', parentId: 'a', label: '\\overline{B}', labelPosition: 'below' as const, color: 'violet' },
  { id: 'b2', parentId: 'a-bar', label: 'B', labelPosition: 'below' as const, color: 'pink' },
  { id: 'b2-bar', parentId: 'a-bar', label: '\\overline{B}', labelPosition: 'below' as const, color: 'violet' },
];

const SAMPLE_EDGES = [
  { id: 'e1', sourceId: 'root', targetId: 'a', label: '0,4', labelPosition: 'left' as const },
  { id: 'e2', sourceId: 'root', targetId: 'a-bar', label: '0,6', labelPosition: 'right' as const },
  { id: 'e3', sourceId: 'a', targetId: 'b1', label: '0,3', labelPosition: 'left' as const },
  { id: 'e4', sourceId: 'a', targetId: 'b1-bar', label: '0,7', labelPosition: 'right' as const },
  { id: 'e5', sourceId: 'a-bar', targetId: 'b2', label: '0,4', labelPosition: 'left' as const },
  { id: 'e6', sourceId: 'a-bar', targetId: 'b2-bar', label: '0,6', labelPosition: 'right' as const },
];

export const TreeCanvas = forwardRef<TreeCanvasRef>(function TreeCanvas(_, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasInitializedView, setHasInitializedView] = useState(false);

  // Expose SVG element to parent for export functionality
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
  }));

  // Store state
  const { nodes, edges, settings, selectedId, setSelected, setDiagram, addNode, isPreviewMode } = useTreeStore();
  const positions = useTreeLayout();

  // Load sample data on mount
  useEffect(() => {
    if (nodes.length === 0) {
      setDiagram(SAMPLE_NODES, SAMPLE_EDGES);
    }
  }, [nodes.length, setDiagram]);

  // Center tree in canvas on initial load
  useEffect(() => {
    if (hasInitializedView || positions.size === 0 || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();

    // Calculate tree bounding box from positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    // Add padding for node size and labels
    const padding = 60;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const treeCenterX = (minX + maxX) / 2;
    const treeCenterY = (minY + maxY) / 2;

    // Center the tree in the canvas
    const canvasCenterX = rect.width / 2;
    const canvasCenterY = rect.height / 2;

    setView({
      x: canvasCenterX - treeCenterX,
      y: canvasCenterY - treeCenterY,
      scale: 1,
    });
    setHasInitializedView(true);
  }, [positions, hasInitializedView]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(view.scale * delta, 0.1), 5);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleDiff = newScale - view.scale;
      const newX = view.x - (mouseX - view.x) * (scaleDiff / view.scale);
      const newY = view.y - (mouseY - view.y) * (scaleDiff / view.scale);

      setView({ x: newX, y: newY, scale: newScale });
    }
  }, [view]);

  // Handle pan start - allow dragging on SVG background or rect elements
  const handleMouseDown = useCallback((e: MouseEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const isBackground = target === svgRef.current || target.tagName.toLowerCase() === 'rect';
    if (e.button === 0 && isBackground) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
    }
  }, [view.x, view.y]);

  // Handle pan move
  const handleMouseMove = useCallback((e: MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setView((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [isDragging, dragStart]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Background click to deselect (only if not in preview mode)
  const handleBackgroundClick = useCallback(() => {
    if (!isPreviewMode) {
      setSelected(null, null);
    }
  }, [isPreviewMode, setSelected]);

  // Node click handlers (disabled in preview mode)
  const handleNodeClick = useCallback((nodeId: string) => {
    if (!isPreviewMode) {
      setSelected(nodeId, 'node');
    }
  }, [isPreviewMode, setSelected]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (!isPreviewMode) {
      addNode(nodeId);
    }
  }, [isPreviewMode, addNode]);

  const handleEdgeClick = useCallback((edgeId: string) => {
    if (!isPreviewMode) {
      setSelected(edgeId, 'edge');
    }
  }, [isPreviewMode, setSelected]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: '#0F172A' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleBackgroundClick}
    >
      {/* Grid background - dark mode */}
      <defs>
        <pattern
          id="grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${view.x} ${view.y}) scale(${view.scale})`}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#1E293B"
            strokeWidth={1 / view.scale}
          />
        </pattern>
        {/* Subtle dot pattern for depth */}
        <pattern
          id="dots"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${view.x} ${view.y}) scale(${view.scale})`}
        >
          <circle cx="20" cy="20" r="1" fill="#334155" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#dots)" />

      {/* Transformed content */}
      <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
        {/* Render edges first (below nodes) */}
        {edges.map((edge) => {
          const sourcePos = positions.get(edge.sourceId);
          const targetPos = positions.get(edge.targetId);
          if (!sourcePos || !targetPos) return null;

          return (
            <TreeEdgeComponent
              key={edge.id}
              edge={edge}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              isSelected={selectedId === edge.id}
              onClick={() => handleEdgeClick(edge.id)}
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          return (
            <TreeNodeComponent
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              size={settings.nodeSize}
              isSelected={selectedId === node.id}
              onClick={() => handleNodeClick(node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node.id)}
            />
          );
        })}
      </g>

      {/* Zoom indicator - dark mode */}
      <text
        x="12"
        y="24"
        fontSize="12"
        fontFamily="var(--font-geist-mono), monospace"
        fill="#64748B"
      >
        zoom: {Math.round(view.scale * 100)}%
      </text>
    </svg>
  );
});
