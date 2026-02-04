'use client';

// Layout settings panel with sliders for tree spacing and node size - dark mode developer tool aesthetic

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
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-mono text-text-muted">{label}</label>
        <span className="text-xs font-mono text-primary">
          {value}
          <span className="text-text-muted">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

export function LayoutSettings() {
  const { settings, updateSettings } = useTreeStore();

  return (
    <div>
      <h3 className="text-sm font-mono font-semibold text-text-secondary mb-3">
        // layout.settings
      </h3>

      <SliderSetting
        label="levelDistance"
        value={settings.levelDistance}
        min={40}
        max={200}
        onChange={(levelDistance) => updateSettings({ levelDistance })}
      />

      <SliderSetting
        label="siblingDistance"
        value={settings.siblingDistance}
        min={40}
        max={200}
        onChange={(siblingDistance) => updateSettings({ siblingDistance })}
      />

      <SliderSetting
        label="nodeSize"
        value={settings.nodeSize}
        min={6}
        max={24}
        onChange={(nodeSize) => updateSettings({ nodeSize })}
      />
    </div>
  );
}
