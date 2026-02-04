'use client';

// Export panel - SVG and PNG image export buttons

import { useState } from 'react';
import type { TreeCanvasRef } from '@/components/canvas/tree-canvas';
import { exportSvg } from '@/lib/export-svg';
import { exportPng } from '@/lib/export-png';

interface ExportPanelProps {
  canvasRef: React.RefObject<TreeCanvasRef | null>;
}

export function ExportPanel({ canvasRef }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSvg = () => {
    const svg = canvasRef.current?.getSvgElement();
    if (svg) {
      exportSvg(svg);
    }
  };

  const handleExportPng = async () => {
    const svg = canvasRef.current?.getSvgElement();
    if (svg) {
      setIsExporting(true);
      try {
        await exportPng(svg);
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Export Image</h3>
      <div className="flex gap-2">
        <button
          onClick={handleExportSvg}
          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md
            hover:bg-green-600 transition-colors"
        >
          Export SVG
        </button>
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-md
            hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>
    </div>
  );
}
