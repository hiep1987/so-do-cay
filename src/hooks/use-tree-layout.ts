// Hook to compute tree node positions from store state

import { useMemo } from 'react';
import { useTreeStore } from './use-tree-store';
import { computeTreeLayout } from '@/lib/tree-layout';

export function useTreeLayout(): Map<string, { x: number; y: number }> {
  const nodes = useTreeStore((state) => state.nodes);
  const settings = useTreeStore((state) => state.settings);

  const positionMap = useMemo(() => {
    const positions = computeTreeLayout(nodes, settings);
    const map = new Map<string, { x: number; y: number }>();

    for (const pos of positions) {
      map.set(pos.id, { x: pos.x, y: pos.y });
    }

    return map;
  }, [nodes, settings]);

  return positionMap;
}
