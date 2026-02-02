import { TreeCanvas } from '@/components/canvas/tree-canvas';

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Canvas area - takes remaining space */}
      <main className="flex-1 h-full">
        <TreeCanvas />
      </main>

      {/* Right panel placeholder - fixed width */}
      <aside className="w-80 h-full border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-sm text-gray-500">
          Select a node to edit its properties
        </p>
      </aside>
    </div>
  );
}
