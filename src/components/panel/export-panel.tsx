'use client';

// Export panel - SVG and PNG image export buttons - dark mode developer tool aesthetic

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
      <h3 className="font-mono font-semibold text-text-secondary text-sm">
        // export.image
      </h3>
      <div className="flex gap-2">
        <button
          onClick={handleExportSvg}
          className="flex-1 px-3 py-2 text-sm font-mono font-medium rounded-md cursor-pointer
            bg-[#166534] text-[#4ADE80] hover:bg-success hover:text-white
            transition-colors duration-150"
        >
          .svg
        </button>
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex-1 px-3 py-2 text-sm font-mono font-medium rounded-md cursor-pointer
            bg-[#581c87] text-[#A78BFA] hover:bg-[#7C3AED] hover:text-white
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'exporting...' : '.png'}
        </button>
      </div>
    </div>
  );
}
