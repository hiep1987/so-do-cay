'use client';

// Property panel for editing selected node or edge properties

import { useTreeStore } from '@/hooks/use-tree-store';
import { PRESET_COLORS } from '@/constants/colors';

const NODE_LABEL_POSITIONS = ['above', 'below', 'left', 'right'] as const;
const EDGE_LABEL_POSITIONS = ['left', 'right'] as const;

export function PropertyPanel() {
  const {
    selectedId,
    selectedType,
    getSelectedNode,
    getSelectedEdge,
    updateNode,
    updateEdge,
    addNode,
  } = useTreeStore();

  const selectedNode = getSelectedNode();
  const selectedEdge = getSelectedEdge();

  // No selection
  if (!selectedId || !selectedType) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Properties</h3>
        <p className="text-sm text-gray-500">Select a node or edge to edit</p>
      </div>
    );
  }

  // Node selected
  if (selectedType === 'node' && selectedNode) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Node Properties</h3>

        {/* Label input */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-1">
            Label (supports LaTeX)
          </label>
          <input
            type="text"
            value={selectedNode.label}
            onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            placeholder="e.g., A or \overline{B}"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Label position */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-1">Label Position</label>
          <select
            value={selectedNode.labelPosition}
            onChange={(e) =>
              updateNode(selectedNode.id, {
                labelPosition: e.target.value as typeof selectedNode.labelPosition,
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {NODE_LABEL_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Color picker */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-1">Color</label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => updateNode(selectedNode.id, { color: color.name })}
                className={`w-7 h-7 rounded-full transition-all
                  ${
                    selectedNode.color === color.name
                      ? 'ring-2 ring-offset-2 ring-gray-400'
                      : 'hover:scale-110'
                  }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Add child button */}
        <button
          onClick={() => addNode(selectedNode.id)}
          className="w-full px-3 py-2 text-sm font-medium rounded-md
            bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Add Child
        </button>
      </div>
    );
  }

  // Edge selected
  if (selectedType === 'edge' && selectedEdge) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edge Properties</h3>

        {/* Label input */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-1">
            Label (probability)
          </label>
          <input
            type="text"
            value={selectedEdge.label}
            onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
            placeholder="e.g., 0.6 or P(A)"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Label position */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-1">Label Position</label>
          <select
            value={selectedEdge.labelPosition}
            onChange={(e) =>
              updateEdge(selectedEdge.id, {
                labelPosition: e.target.value as typeof selectedEdge.labelPosition,
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EDGE_LABEL_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return null;
}
