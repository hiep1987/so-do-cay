import { TreeCanvas } from '@/components/canvas/tree-canvas';
import { Toolbar } from '@/components/toolbar/toolbar';
import { RightPanelContainer } from '@/components/panel/right-panel-container';
import { CanvasErrorBoundary } from '@/components/error-boundary-canvas';

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Main area - toolbar + canvas */}
      <div className="flex-1 flex flex-col h-full">
        <Toolbar />
        <main className="flex-1 h-full overflow-hidden">
          <CanvasErrorBoundary>
            <TreeCanvas />
          </CanvasErrorBoundary>
        </main>
      </div>

      {/* Right panel - conditionally shows edit or preview panels */}
      <aside className="w-80 h-full border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <RightPanelContainer />
      </aside>
    </div>
  );
}
