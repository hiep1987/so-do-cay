'use client';

// Right panel container - conditionally renders edit or preview panels based on mode

import { useTreeStore } from '@/hooks/use-tree-store';
import { PropertyPanel } from './property-panel';
import { LayoutSettings } from './layout-settings';
import { TikzOutput } from './tikz-output';
import { ExportPanel } from './export-panel';

export function RightPanelContainer() {
  const isPreviewMode = useTreeStore((state) => state.isPreviewMode);

  if (isPreviewMode) {
    return (
      <>
        <TikzOutput />
        <div className="border-t border-gray-200 pt-4 mt-4">
          <ExportPanel />
        </div>
      </>
    );
  }

  return (
    <>
      <PropertyPanel />
      <div className="border-t border-gray-200 pt-4 mt-2">
        <LayoutSettings />
      </div>
    </>
  );
}
