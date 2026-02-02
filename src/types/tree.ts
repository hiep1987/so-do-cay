// Tree diagram data model types

export interface TreeNode {
  id: string;
  parentId: string | null;
  label: string;
  labelPosition: 'above' | 'below' | 'left' | 'right';
  color: string;
}

export interface TreeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  labelPosition: 'left' | 'right';
}

export interface TreeSettings {
  levelDistance: number;
  siblingDistance: number;
  nodeSize: number;
}

export interface TreeDiagram {
  nodes: TreeNode[];
  edges: TreeEdge[];
  settings: TreeSettings;
}

export const DEFAULT_SETTINGS: TreeSettings = {
  levelDistance: 120,
  siblingDistance: 100,
  nodeSize: 8,
};
