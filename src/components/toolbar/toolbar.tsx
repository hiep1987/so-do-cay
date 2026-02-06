'use client';

// Toolbar component with Add Root, Delete, Preview toggle, Reset View - dark mode developer tool aesthetic

import { useTreeStore } from '@/hooks/use-tree-store';

interface ToolbarProps {
  onResetView?: () => void;
}

export function Toolbar({ onResetView }: ToolbarProps) {
  const {
    selectedId,
    selectedType,
    isPreviewMode,
    hasRoot,
    addNode,
    deleteNode,
    deleteEdge,
    setPreviewMode,
  } = useTreeStore();

  const rootExists = hasRoot();

  const handleAddRoot = () => {
    addNode(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (selectedType === 'node') {
      deleteNode(selectedId);
    } else if (selectedType === 'edge') {
      deleteEdge(selectedId);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
      {/* Logo / App name */}
      <span className="text-sm font-mono font-semibold text-text-secondary mr-2">
        tree-builder
      </span>

      <div className="w-px h-5 bg-border" />

      <button
        onClick={handleAddRoot}
        disabled={rootExists}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer
          bg-primary text-white hover:bg-primary-hover
          disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed
          transition-colors duration-150"
      >
        + root
      </button>

      <button
        onClick={handleDelete}
        disabled={!selectedId}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer
          bg-danger-muted text-danger hover:bg-danger hover:text-white
          disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed
          transition-colors duration-150"
      >
        delete
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        onClick={() => setPreviewMode(!isPreviewMode)}
        className={`px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer
          transition-colors duration-150
          ${
            isPreviewMode
              ? 'bg-success-muted text-success hover:bg-success hover:text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
      >
        {isPreviewMode ? '● preview' : '○ preview'}
      </button>

      <button
        onClick={onResetView}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer
          transition-colors duration-150
          bg-surface-elevated text-text-secondary hover:text-text-primary"
      >
        reset view
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicator */}
      <span className="text-xs font-mono text-text-muted">
        {selectedId ? `selected: ${selectedType}` : 'no selection'}
      </span>
    </div>
  );
}
