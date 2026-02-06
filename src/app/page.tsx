'use client';

import { useRef, useCallback } from 'react';
import { TreeCanvas, type TreeCanvasRef } from '@/components/canvas/tree-canvas';
import { Toolbar } from '@/components/toolbar/toolbar';
import { RightPanelContainer } from '@/components/panel/right-panel-container';
import { CanvasErrorBoundary } from '@/components/error-boundary-canvas';

export default function Home() {
  const canvasRef = useRef<TreeCanvasRef>(null);

  const handleResetView = useCallback(() => {
    canvasRef.current?.resetView();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Main area - toolbar + canvas */}
      <div className="flex-1 flex flex-col h-full">
        <Toolbar onResetView={handleResetView} />
        <main className="flex-1 h-full overflow-hidden">
          <CanvasErrorBoundary>
            <TreeCanvas ref={canvasRef} />
          </CanvasErrorBoundary>
        </main>
      </div>

      {/* Right panel - conditionally shows edit or preview panels */}
      <aside className="w-80 h-full border-l border-border bg-surface p-4 overflow-y-auto">
        <RightPanelContainer canvasRef={canvasRef} />
      </aside>
    </div>
  );
}
