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
    settings,
    addNode,
    deleteNode,
    deleteEdge,
    setPreviewMode,
    updateSettings,
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

  const handleToggleDirection = () => {
    updateSettings({
      direction: settings.direction === 'vertical' ? 'horizontal' : 'vertical',
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface overflow-x-auto">
      {/* Logo / App name */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon.svg`} alt="logo" className="w-15 h-15 shrink-0" />
      <span className="text-sm font-mono font-semibold text-text-secondary mr-2 shrink-0">
        tree-builder
      </span>

      <div className="w-px h-5 bg-border shrink-0" />

      <button
        onClick={handleAddRoot}
        disabled={rootExists}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer shrink-0
          bg-primary text-white hover:bg-primary-hover
          disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed
          transition-colors duration-150"
      >
        + root
      </button>

      <button
        onClick={handleDelete}
        disabled={!selectedId}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer shrink-0
          bg-danger-muted text-danger hover:bg-danger hover:text-white
          disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed
          transition-colors duration-150"
      >
        delete
      </button>

      <div className="w-px h-5 bg-border mx-1 shrink-0" />

      <button
        onClick={() => setPreviewMode(!isPreviewMode)}
        className={`px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer shrink-0
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
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer shrink-0
          transition-colors duration-150
          bg-surface-elevated text-text-secondary hover:text-text-primary"
      >
        reset view
      </button>

      <button
        onClick={handleToggleDirection}
        className="px-3 py-1.5 text-sm font-medium font-mono rounded-md cursor-pointer shrink-0
          transition-colors duration-150
          bg-surface-elevated text-text-secondary hover:text-text-primary"
      >
        {settings.direction === 'vertical' ? '↓ vertical' : '→ horizontal'}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicator */}
      <span className="text-xs font-mono text-text-muted whitespace-nowrap shrink-0">
        {selectedId ? `selected: ${selectedType}` : 'no selection'}
      </span>
    </div>
  );
}
