'use client';

// Layout settings panel with sliders for tree spacing and node size

import { useTreeStore } from '@/hooks/use-tree-store';

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

function SliderSetting({ label, value, min, max, unit = 'px', onChange }: SliderSettingProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-gray-600">{label}</label>
        <span className="text-xs text-gray-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
          accent-blue-600"
      />
    </div>
  );
}

export function LayoutSettings() {
  const { settings, updateSettings } = useTreeStore();

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout Settings</h3>

      <SliderSetting
        label="Level Distance"
        value={settings.levelDistance}
        min={40}
        max={200}
        onChange={(levelDistance) => updateSettings({ levelDistance })}
      />

      <SliderSetting
        label="Sibling Distance"
        value={settings.siblingDistance}
        min={40}
        max={200}
        onChange={(siblingDistance) => updateSettings({ siblingDistance })}
      />

      <SliderSetting
        label="Node Size"
        value={settings.nodeSize}
        min={6}
        max={24}
        onChange={(nodeSize) => updateSettings({ nodeSize })}
      />
    </div>
  );
}
