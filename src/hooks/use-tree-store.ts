// Zustand store for tree diagram state management

import { create } from 'zustand';
import { TreeNode, TreeEdge, TreeSettings, DEFAULT_SETTINGS } from '@/types/tree';

interface TreeStore {
  // State
  nodes: TreeNode[];
  edges: TreeEdge[];
  settings: TreeSettings;
  selectedId: string | null;
  selectedType: 'node' | 'edge' | null;
  isPreviewMode: boolean;

  // Smart node actions
  addNode: (parentId: string | null) => void;
  updateNode: (id: string, updates: Partial<TreeNode>) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  addEdge: (edge: TreeEdge) => void;
  updateEdge: (id: string, updates: Partial<TreeEdge>) => void;
  deleteEdge: (id: string) => void;

  // Selection
  setSelected: (id: string | null, type: 'node' | 'edge' | null) => void;

  // Settings
  updateSettings: (updates: Partial<TreeSettings>) => void;

  // Preview mode
  setPreviewMode: (isPreview: boolean) => void;

  // Bulk operations
  setDiagram: (nodes: TreeNode[], edges: TreeEdge[]) => void;
  clearDiagram: () => void;

  // Helpers
  hasRoot: () => boolean;
  getSelectedNode: () => TreeNode | undefined;
  getSelectedEdge: () => TreeEdge | undefined;
}

// Helper to generate unique IDs
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Helper to collect all descendant node IDs (for cascade delete)
const getDescendantIds = (nodeId: string, nodes: TreeNode[]): string[] => {
  const children = nodes.filter((n) => n.parentId === nodeId);
  return children.flatMap((child) => [child.id, ...getDescendantIds(child.id, nodes)]);
};

export const useTreeStore = create<TreeStore>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  settings: DEFAULT_SETTINGS,
  selectedId: null,
  selectedType: null,
  isPreviewMode: false,

  // Smart node actions - auto-creates edge when adding child
  addNode: (parentId) =>
    set((state) => {
      const newNodeId = generateId();
      const isVertical = state.settings.direction === 'vertical';
      const newNode: TreeNode = {
        id: newNodeId,
        parentId,
        label: parentId ? 'New' : '',
        // Default label positions: vertical=below, horizontal=right
        labelPosition: isVertical ? 'below' : 'right',
        labelOffset: isVertical ? 20 : 15,
        color: 'orange',
      };

      // If has parent, auto-create edge
      if (parentId) {
        // Edges from root get 10px offset in horizontal mode for readability
        const parentNode = state.nodes.find((n) => n.id === parentId);
        const isFromRoot = parentNode?.parentId === null;
        const isHorizontal = state.settings.direction === 'horizontal';
        const newEdge: TreeEdge = {
          id: `edge-${Date.now()}`,
          sourceId: parentId,
          targetId: newNodeId,
          label: '',
          // Default edge label positions: vertical=left, horizontal=above
          labelPosition: isHorizontal ? 'above' : 'left',
          labelOffsetX: isHorizontal && isFromRoot ? -10 : 0,
          labelOffsetY: 0,
        };
        return {
          nodes: [...state.nodes, newNode],
          edges: [...state.edges, newEdge],
          selectedId: newNodeId,
          selectedType: 'node' as const,
        };
      }

      return {
        nodes: [...state.nodes, newNode],
        selectedId: newNodeId,
        selectedType: 'node' as const,
      };
    }),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  // Cascade delete - removes node and all descendants
  deleteNode: (id) =>
    set((state) => {
      const idsToDelete = new Set([id, ...getDescendantIds(id, state.nodes)]);
      return {
        nodes: state.nodes.filter((n) => !idsToDelete.has(n.id)),
        edges: state.edges.filter(
          (e) => !idsToDelete.has(e.sourceId) && !idsToDelete.has(e.targetId)
        ),
        selectedId: idsToDelete.has(state.selectedId ?? '') ? null : state.selectedId,
        selectedType: idsToDelete.has(state.selectedId ?? '') ? null : state.selectedType,
      };
    }),

  // Edge actions
  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  updateEdge: (id, updates) =>
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  // Cascade delete - removes edge and target node with all descendants
  deleteEdge: (id) =>
    set((state) => {
      const edge = state.edges.find((e) => e.id === id);
      if (!edge) {
        return {
          selectedId: state.selectedId === id ? null : state.selectedId,
          selectedType: state.selectedId === id ? null : state.selectedType,
        };
      }

      // Get target node and all its descendants
      const targetId = edge.targetId;
      const idsToDelete = new Set([targetId, ...getDescendantIds(targetId, state.nodes)]);

      return {
        nodes: state.nodes.filter((n) => !idsToDelete.has(n.id)),
        edges: state.edges.filter(
          (e) => !idsToDelete.has(e.sourceId) && !idsToDelete.has(e.targetId)
        ),
        selectedId:
          state.selectedId === id || idsToDelete.has(state.selectedId ?? '')
            ? null
            : state.selectedId,
        selectedType:
          state.selectedId === id || idsToDelete.has(state.selectedId ?? '')
            ? null
            : state.selectedType,
      };
    }),

  // Selection with type tracking
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),

  // Settings
  updateSettings: (updates) =>
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      // When direction changes, adjust root edge labelOffset defaults
      if (updates.direction && updates.direction !== state.settings.direction) {
        // Rotate label positions 90° when direction toggles
        const rotatePos = (pos: string) => {
          const map: Record<string, string> = { left: 'above', right: 'below', above: 'left', below: 'right' };
          return map[pos] || pos;
        };
        const rootIds = new Set(state.nodes.filter((n) => n.parentId === null).map((n) => n.id));
        const newEdges = state.edges.map((e) => {
          const lp = rotatePos(e.labelPosition) as typeof e.labelPosition;
          if (!rootIds.has(e.sourceId)) return { ...e, labelPosition: lp };
          // Set -10px for horizontal, 0px for vertical on root edges
          const newOffset = updates.direction === 'horizontal' ? -10 : 0;
          return { ...e, labelPosition: lp, labelOffsetX: newOffset };
        });
        // Update node labelOffset defaults when direction changes
        const defaultOffset = updates.direction === 'vertical' ? 20 : 15;
        const newNodes = state.nodes.map((n) => {
          const currentDefault = state.settings.direction === 'vertical' ? 20 : 15;
          const lp = rotatePos(n.labelPosition) as typeof n.labelPosition;
          const newOffset = n.labelOffset === currentDefault ? defaultOffset : n.labelOffset;
          return { ...n, labelPosition: lp, labelOffset: newOffset };
        });
        return { settings: newSettings, edges: newEdges, nodes: newNodes };
      }
      return { settings: newSettings };
    }),

  // Preview mode
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),

  // Bulk operations
  setDiagram: (nodes, edges) => set({ nodes, edges }),

  clearDiagram: () => set({ nodes: [], edges: [], selectedId: null, selectedType: null }),

  // Helpers
  hasRoot: () => get().nodes.some((n) => n.parentId === null),
  getSelectedNode: () => {
    const { selectedId, selectedType, nodes } = get();
    if (selectedType !== 'node') return undefined;
    return nodes.find((n) => n.id === selectedId);
  },
  getSelectedEdge: () => {
    const { selectedId, selectedType, edges } = get();
    if (selectedType !== 'edge') return undefined;
    return edges.find((e) => e.id === selectedId);
  },
}));
