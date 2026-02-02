// Zustand store for tree diagram state management

import { create } from 'zustand';
import { TreeNode, TreeEdge, TreeSettings, DEFAULT_SETTINGS } from '@/types/tree';

interface TreeStore {
  // State
  nodes: TreeNode[];
  edges: TreeEdge[];
  settings: TreeSettings;
  selectedId: string | null;
  isPreviewMode: boolean;

  // Node actions
  addNode: (node: TreeNode) => void;
  updateNode: (id: string, updates: Partial<TreeNode>) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  addEdge: (edge: TreeEdge) => void;
  updateEdge: (id: string, updates: Partial<TreeEdge>) => void;
  deleteEdge: (id: string) => void;

  // Selection
  setSelectedId: (id: string | null) => void;

  // Settings
  updateSettings: (updates: Partial<TreeSettings>) => void;

  // Preview mode
  setPreviewMode: (isPreview: boolean) => void;

  // Bulk operations
  setDiagram: (nodes: TreeNode[], edges: TreeEdge[]) => void;
  clearDiagram: () => void;
}

export const useTreeStore = create<TreeStore>((set) => ({
  // Initial state
  nodes: [],
  edges: [],
  settings: DEFAULT_SETTINGS,
  selectedId: null,
  isPreviewMode: false,

  // Node actions
  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  // Edge actions
  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  updateEdge: (id, updates) =>
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    })),

  // Selection
  setSelectedId: (id) => set({ selectedId: id }),

  // Settings
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  // Preview mode
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),

  // Bulk operations
  setDiagram: (nodes, edges) => set({ nodes, edges }),

  clearDiagram: () => set({ nodes: [], edges: [], selectedId: null }),
}));
