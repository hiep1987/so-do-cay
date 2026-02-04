'use client';

// Export panel - placeholder for Phase 7 implementation

export function ExportPanel() {
  // Placeholder - actual export functionality in Phase 7
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Export Image</h3>
      <p className="text-sm text-gray-500">Export options will be available in Phase 7</p>
      <div className="flex gap-2">
        <button
          disabled
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-md
            cursor-not-allowed"
        >
          Export SVG
        </button>
        <button
          disabled
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-md
            cursor-not-allowed"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
}
