'use client';

// Toolbar component with Add Root, Delete, Preview toggle

import { useTreeStore } from '@/hooks/use-tree-store';

export function Toolbar() {
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
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
      <button
        onClick={handleAddRoot}
        disabled={rootExists}
        className="px-3 py-1.5 text-sm font-medium rounded-md
          bg-blue-600 text-white hover:bg-blue-700
          disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors"
      >
        Add Root
      </button>

      <button
        onClick={handleDelete}
        disabled={!selectedId}
        className="px-3 py-1.5 text-sm font-medium rounded-md
          bg-red-600 text-white hover:bg-red-700
          disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors"
      >
        Delete
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button
        onClick={() => setPreviewMode(!isPreviewMode)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
          ${
            isPreviewMode
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        {isPreviewMode ? 'Preview On' : 'Preview Off'}
      </button>
    </div>
  );
}
