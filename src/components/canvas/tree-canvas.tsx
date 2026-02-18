'use client';

// SVG canvas component with pan/zoom and tree rendering - dark mode developer tool aesthetic

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, type MouseEvent, type WheelEvent, type TouchEvent } from 'react';
import { useTreeStore } from '@/hooks/use-tree-store';
import { useTreeLayout } from '@/hooks/use-tree-layout';
import { TreeNodeComponent } from './tree-node';
import { TreeEdgeComponent } from './tree-edge';
import { LatexLabel } from './latex-label';

// Rotate label positions 90° clockwise for horizontal layout (matches TikZ generator)
const HORIZONTAL_POSITION_MAP: Record<string, string> = {
  left: 'above',
  right: 'below',
  above: 'left',
  below: 'right',
};

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

// Interface for exposing SVG element to parent components (for export and view controls)
export interface TreeCanvasRef {
  getSvgElement: () => SVGSVGElement | null;
  resetView: () => void;
}

// Default probability tree matching reference TikZ format
// Structure: Root O → A/Ā → B/B̄
// Labels use LaTeX format directly for TikZ export
const SAMPLE_NODES = [
  { id: 'root', parentId: null, label: '\\text{Gốc } O', labelPosition: 'above' as const, labelOffset: 20, color: 'orange' },
  { id: 'a', parentId: 'root', label: 'A', labelPosition: 'left' as const, labelOffset: 20, color: 'cyan' },
  { id: 'a-bar', parentId: 'root', label: '\\overline{A}', labelPosition: 'right' as const, labelOffset: 20, color: 'green' },
  { id: 'b1', parentId: 'a', label: 'B', labelPosition: 'below' as const, labelOffset: 20, color: 'pink' },
  { id: 'b1-bar', parentId: 'a', label: '\\overline{B}', labelPosition: 'below' as const, labelOffset: 20, color: 'violet' },
  { id: 'b2', parentId: 'a-bar', label: 'B', labelPosition: 'below' as const, labelOffset: 20, color: 'pink' },
  { id: 'b2-bar', parentId: 'a-bar', label: '\\overline{B}', labelPosition: 'below' as const, labelOffset: 20, color: 'violet' },
];

const SAMPLE_EDGES = [
  { id: 'e1', sourceId: 'root', targetId: 'a', label: '0,4', labelPosition: 'left' as const, labelOffsetX: 0, labelOffsetY: 0 },
  { id: 'e2', sourceId: 'root', targetId: 'a-bar', label: '0,6', labelPosition: 'right' as const, labelOffsetX: 0, labelOffsetY: 0 },
  { id: 'e3', sourceId: 'a', targetId: 'b1', label: '0,3', labelPosition: 'left' as const, labelOffsetX: 0, labelOffsetY: 0 },
  { id: 'e4', sourceId: 'a', targetId: 'b1-bar', label: '0,7', labelPosition: 'right' as const, labelOffsetX: 0, labelOffsetY: 0 },
  { id: 'e5', sourceId: 'a-bar', targetId: 'b2', label: '0,4', labelPosition: 'left' as const, labelOffsetX: 0, labelOffsetY: 0 },
  { id: 'e6', sourceId: 'a-bar', targetId: 'b2-bar', label: '0,6', labelPosition: 'right' as const, labelOffsetX: 0, labelOffsetY: 0 },
];

export const TreeCanvas = forwardRef<TreeCanvasRef>(function TreeCanvas(_, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hasInitializedView, setHasInitializedView] = useState(false);
  // Touch state for two-finger pan + pinch-to-zoom
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; dist: number; scale: number } | null>(null);

  // Store state
  const { nodes, edges, settings, selectedId, setSelected, setDiagram, addNode, isPreviewMode } = useTreeStore();
  const positions = useTreeLayout();

  // Center tree in canvas at scale 1 (reusable for initial load and reset)
  const centerTree = useCallback(() => {
    if (positions.size === 0 || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const padding = 60;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const treeCenterX = (minX + maxX) / 2;
    const treeCenterY = (minY + maxY) / 2;
    const canvasCenterX = rect.width / 2;
    const canvasCenterY = rect.height / 2;

    setView({
      x: canvasCenterX - treeCenterX,
      y: canvasCenterY - treeCenterY,
      scale: 1,
    });
  }, [positions]);

  // Expose SVG element and view controls to parent
  useImperativeHandle(ref, () => ({
    getSvgElement: () => svgRef.current,
    resetView: centerTree,
  }), [centerTree]);

  // Load sample data on mount
  useEffect(() => {
    if (nodes.length === 0) {
      setDiagram(SAMPLE_NODES, SAMPLE_EDGES);
    }
  }, [nodes.length, setDiagram]);

  // Center tree in canvas on initial load
  useEffect(() => {
    if (hasInitializedView || positions.size === 0 || !svgRef.current) return;
    centerTree();
    setHasInitializedView(true);
  }, [positions, hasInitializedView, centerTree]);

  // Detect touch device for showing appropriate control hints
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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

  // Two-finger touch: pan + pinch-to-zoom (single finger scrolls page on mobile)
  const handleTouchStart = useCallback((e: TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsDragging(false);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setTouchStart({ x: midX - view.x, y: midY - view.y, dist, scale: view.scale });
    }
  }, [view.x, view.y, view.scale]);

  const handleTouchMove = useCallback((e: TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2 && touchStart) {
      e.preventDefault();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      // Pinch-to-zoom: scale proportional to finger distance change
      const newScale = Math.min(Math.max(touchStart.scale * (dist / touchStart.dist), 0.1), 5);

      // Get SVG rect for computing zoom center relative to canvas
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const pinchCenterX = midX - rect.left;
        const pinchCenterY = midY - rect.top;
        const scaleDiff = newScale - touchStart.scale;
        const newX = midX - touchStart.x - (pinchCenterX - (midX - touchStart.x)) * (scaleDiff / touchStart.scale);
        const newY = midY - touchStart.y - (pinchCenterY - (midY - touchStart.y)) * (scaleDiff / touchStart.scale);
        setView({ x: newX, y: newY, scale: newScale });
      } else {
        // Fallback: pan only
        setView((prev) => ({ ...prev, x: midX - touchStart.x, y: midY - touchStart.y }));
      }
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouchStart(null);
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
      className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-x"
      style={{ backgroundColor: '#0F172A' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

      {/* Labels rendered outside transform group for Safari foreignObject compatibility */}
      {/* Edge labels */}
      {edges.map((edge) => {
        const sourcePos = positions.get(edge.sourceId);
        const targetPos = positions.get(edge.targetId);
        if (!sourcePos || !targetPos || !edge.label) return null;

        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        // Rotate edge label position for horizontal layout
        const isHorizontal = settings.direction === 'horizontal';
        const edgeLabelPos = isHorizontal
          ? (HORIZONTAL_POSITION_MAP[edge.labelPosition] || edge.labelPosition)
          : edge.labelPosition;

        // Apply separate X and Y offset for edge labels
        const labelOffsetX = edge.labelOffsetX ?? 0;
        const labelOffsetY = edge.labelOffsetY ?? 0;

        // Map edge label position to LatexLabel anchor position
        const labelAnchor = edgeLabelPos;

        return (
          <LatexLabel
            key={`label-${edge.id}`}
            text={edge.label}
            x={midX + labelOffsetX}
            y={midY + labelOffsetY}
            position={labelAnchor as 'above' | 'below' | 'left' | 'right'}
            labelOffset={10}
            viewX={view.x}
            viewY={view.y}
            scale={view.scale}
          />
        );
      })}

      {/* Node labels */}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos || !node.label) return null;

        // Rotate node label position for horizontal layout (center stays center)
        const isHorizontal = settings.direction === 'horizontal';
        const nodeLabelPos = node.labelPosition === 'center'
          ? 'center'
          : isHorizontal
            ? (HORIZONTAL_POSITION_MAP[node.labelPosition] || node.labelPosition)
            : node.labelPosition;

        return (
          <LatexLabel
            key={`label-${node.id}`}
            text={node.label}
            x={pos.x}
            y={pos.y}
            position={nodeLabelPos as 'above' | 'below' | 'left' | 'right' | 'center'}
            labelOffset={node.labelOffset}
            viewX={view.x}
            viewY={view.y}
            scale={view.scale}
          />
        );
      })}

      {/* Indicators - dark mode */}
      <text
        x="12"
        y="24"
        fontSize="12"
        fontFamily="var(--font-geist-mono), monospace"
        fill="#64748B"
      >
        zoom: {Math.round(view.scale * 100)}%
      </text>
      <text
        x="12"
        y="40"
        fontSize="12"
        fontFamily="var(--font-geist-mono), monospace"
        fill="#64748B"
      >
        {isTouchDevice ? '1 finger: scroll page' : 'scroll: zoom'}
      </text>
      <text
        x="12"
        y="56"
        fontSize="12"
        fontFamily="var(--font-geist-mono), monospace"
        fill="#64748B"
      >
        {isTouchDevice ? '2 fingers: pan + zoom' : 'drag: pan'}
      </text>
    </svg>
  );
});
