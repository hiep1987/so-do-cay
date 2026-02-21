'use client';

// Clickable LaTeX suggestion chips for quick-inserting common patterns into label inputs

import { useRef, useState, useEffect } from 'react';

export interface LatexSuggestion {
  /** Display label for the chip */
  display: string;
  /** LaTeX template to insert */
  template: string;
  /** Cursor offset from end of template (e.g. 1 = place before last char) */
  cursorOffsetFromEnd?: number;
}

interface LatexAutocompleteProps {
  suggestions: LatexSuggestion[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: React.ReactNode;
}

export const EDGE_SUGGESTIONS: LatexSuggestion[] = [
  { display: '\\dfrac{}{}', template: '\\dfrac{}{}', cursorOffsetFromEnd: 3 },
];

export const NODE_SUGGESTIONS: LatexSuggestion[] = [
  { display: '\\text{}', template: '\\text{}', cursorOffsetFromEnd: 1 },
  { display: '\\overline{}', template: '\\overline{}', cursorOffsetFromEnd: 1 },
];

export function LatexAutocomplete({
  suggestions,
  value,
  onChange,
  placeholder,
  label,
}: LatexAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Insert suggestion at cursor position or append
  const insertSuggestion = (suggestion: LatexSuggestion) => {
    const input = inputRef.current;
    if (!input) {
      onChange(suggestion.template);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue =
      value.substring(0, start) + suggestion.template + value.substring(end);
    onChange(newValue);

    // Set cursor position after React re-render
    const cursorPos = suggestion.cursorOffsetFromEnd
      ? start + suggestion.template.length - suggestion.cursorOffsetFromEnd
      : start + suggestion.template.length;

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-latex-autocomplete]')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  return (
    <div className="mb-4 relative" data-latex-autocomplete>
      <label className="block text-xs font-mono text-text-muted mb-1.5">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm
          bg-surface-elevated border border-border rounded-md
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-colors duration-150"
      />
      {showSuggestions && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {suggestions.map((s) => (
            <button
              key={s.display}
              type="button"
              onClick={() => insertSuggestion(s)}
              className="px-2 py-0.5 text-xs font-mono rounded
                bg-surface border border-border text-text-secondary
                hover:bg-surface-elevated hover:text-text-primary hover:border-primary
                transition-colors duration-150 cursor-pointer"
            >
              {s.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
