'use client';

// Right panel container - conditionally renders edit or preview panels based on mode

import { useTreeStore } from '@/hooks/use-tree-store';
import type { TreeCanvasRef } from '@/components/canvas/tree-canvas';
import { PropertyPanel } from './property-panel';
import { LayoutSettings } from './layout-settings';
import { TikzOutput } from './tikz-output';
import { ExportPanel } from './export-panel';

interface RightPanelContainerProps {
  canvasRef: React.RefObject<TreeCanvasRef | null>;
}

export function RightPanelContainer({ canvasRef }: RightPanelContainerProps) {
  const isPreviewMode = useTreeStore((state) => state.isPreviewMode);

  if (isPreviewMode) {
    return (
      <>
        <TikzOutput />
        <div className="border-t border-border pt-4 mt-4">
          <ExportPanel canvasRef={canvasRef} />
        </div>
      </>
    );
  }

  return (
    <>
      <PropertyPanel />
      <div className="border-t border-border pt-4 mt-2">
        <LayoutSettings />
      </div>
    </>
  );
}
