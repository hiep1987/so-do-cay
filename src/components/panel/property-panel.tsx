'use client';

// Property panel for editing selected node or edge properties - dark mode developer tool aesthetic

import { useTreeStore } from '@/hooks/use-tree-store';
import { PRESET_COLORS } from '@/constants/colors';

const NODE_LABEL_POSITIONS = ['above', 'below', 'left', 'right', 'center'] as const;
const EDGE_LABEL_POSITIONS = ['left', 'right', 'above', 'below'] as const;

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-semibold text-text-secondary">
            // properties
          </h3>
          <a
            href="https://www.facebook.com/hiep.lequoc.31/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-white bg-orange-500 px-2 py-0.5 rounded hover:bg-orange-600 transition-colors"
          >
            Le Quoc Hiep
          </a>
        </div>
        <p className="text-sm font-mono text-text-muted">
          select a node or edge
        </p>
      </div>
    );
  }

  // Node selected
  if (selectedType === 'node' && selectedNode) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-semibold text-text-secondary">
            // node.properties
          </h3>
          <a
            href="https://www.facebook.com/hiep.lequoc.31/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-white bg-orange-500 px-2 py-0.5 rounded hover:bg-orange-600 transition-colors"
          >
            Le Quoc Hiep
          </a>
        </div>

        {/* Label input */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            label <span className="text-text-muted">(LaTeX)</span>
          </label>
          <input
            type="text"
            value={selectedNode.label}
            onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            placeholder="e.g., A or \overline{B}"
            className="w-full px-3 py-2 text-sm font-mono
              bg-surface-elevated border border-border rounded-md
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors duration-150"
          />
        </div>

        {/* Label position */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            labelPosition
          </label>
          <select
            value={selectedNode.labelPosition}
            onChange={(e) =>
              updateNode(selectedNode.id, {
                labelPosition: e.target.value as typeof selectedNode.labelPosition,
              })
            }
            className="w-full px-3 py-2 text-sm font-mono
              bg-surface-elevated border border-border rounded-md
              text-text-primary cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {NODE_LABEL_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                &quot;{pos}&quot;
              </option>
            ))}
          </select>
        </div>

        {/* Label offset (distance from node) - hidden for center position */}
        {selectedNode.labelPosition !== 'center' && (
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            labelOffset <span className="text-text-muted">({selectedNode.labelOffset ?? 20}px)</span>
          </label>
          <input
            type="range"
            min="0"
            max="60"
            value={selectedNode.labelOffset ?? 20}
            onChange={(e) =>
              updateNode(selectedNode.id, { labelOffset: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>
        )}

        {/* Color picker - hidden for center position (no dot rendered) */}
        {selectedNode.labelPosition !== 'center' && (
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            color
          </label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => updateNode(selectedNode.id, { color: color.name })}
                className={`w-7 h-7 rounded-md cursor-pointer transition-all duration-150
                  ${
                    selectedNode.color === color.name
                      ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110'
                      : 'hover:scale-110'
                  }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>
        )}

        {/* Add child button */}
        <button
          onClick={() => addNode(selectedNode.id)}
          className="w-full px-3 py-2 text-sm font-mono font-medium rounded-md cursor-pointer
            bg-primary text-white hover:bg-primary-hover
            transition-colors duration-150"
        >
          + addChild()
        </button>
      </div>
    );
  }

  // Edge selected
  if (selectedType === 'edge' && selectedEdge) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-semibold text-text-secondary">
            // edge.properties
          </h3>
          <a
            href="https://www.facebook.com/hiep.lequoc.31/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-white bg-orange-500 px-2 py-0.5 rounded hover:bg-orange-600 transition-colors"
          >
            Le Quoc Hiep
          </a>
        </div>

        {/* Label input */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            label <span className="text-text-muted">(probability)</span>
          </label>
          <input
            type="text"
            value={selectedEdge.label}
            onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
            placeholder="e.g., 0.6 or P(A)"
            className="w-full px-3 py-2 text-sm font-mono
              bg-surface-elevated border border-border rounded-md
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors duration-150"
          />
        </div>

        {/* Label position */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            labelPosition
          </label>
          <select
            value={selectedEdge.labelPosition}
            onChange={(e) =>
              updateEdge(selectedEdge.id, {
                labelPosition: e.target.value as typeof selectedEdge.labelPosition,
              })
            }
            className="w-full px-3 py-2 text-sm font-mono
              bg-surface-elevated border border-border rounded-md
              text-text-primary cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {EDGE_LABEL_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                &quot;{pos}&quot;
              </option>
            ))}
          </select>
        </div>

        {/* Label offset X (horizontal shift) */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            labelOffsetX <span className="text-text-muted">({selectedEdge.labelOffsetX ?? 0}px)</span>
          </label>
          <input
            type="range"
            min="-60"
            max="60"
            value={selectedEdge.labelOffsetX ?? 0}
            onChange={(e) =>
              updateEdge(selectedEdge.id, { labelOffsetX: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>

        {/* Label offset Y (vertical shift) */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-text-muted mb-1.5">
            labelOffsetY <span className="text-text-muted">({selectedEdge.labelOffsetY ?? 0}px)</span>
          </label>
          <input
            type="range"
            min="-60"
            max="60"
            value={selectedEdge.labelOffsetY ?? 0}
            onChange={(e) =>
              updateEdge(selectedEdge.id, { labelOffsetY: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>
      </div>
    );
  }

  return null;
}
