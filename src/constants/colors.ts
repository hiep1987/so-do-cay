// Preset color palette for tree nodes

export const PRESET_COLORS = [
  { name: 'orange', hex: '#f97316' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'green', hex: '#22c55e' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'black', hex: '#374151' },
] as const;

export type PresetColorName = (typeof PRESET_COLORS)[number]['name'];

// Helper to get hex color by name
export function getColorHex(name: string): string {
  const color = PRESET_COLORS.find((c) => c.name === name);
  return color?.hex ?? PRESET_COLORS[0].hex;
}
