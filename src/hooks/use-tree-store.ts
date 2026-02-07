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
      const newNode: TreeNode = {
        id: newNodeId,
        parentId,
        label: parentId ? 'New' : '',
        labelPosition: 'below',
        labelOffset: 15,
        color: 'orange',
      };

      // If has parent, auto-create edge
      if (parentId) {
        const newEdge: TreeEdge = {
          id: `edge-${Date.now()}`,
          sourceId: parentId,
          targetId: newNodeId,
          label: '',
          labelPosition: 'left',
          labelOffset: 15,
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
    set((state) => ({ settings: { ...state.settings, ...updates } })),

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
