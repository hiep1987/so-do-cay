'use client';

// TikZ output panel - displays generated TikZ code with syntax highlighting and copy functionality

import { useState } from 'react';
import { useTreeStore } from '@/hooks/use-tree-store';
import { generateTikZ } from '@/lib/tikz-generator';

export function TikzOutput() {
  const [copied, setCopied] = useState(false);
  const { nodes, edges, settings } = useTreeStore();

  // Generate TikZ code from current tree state
  const tikzCode = generateTikZ({ nodes, edges, settings });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-semibold text-text-secondary text-sm">
          // tikz.output
        </h3>
        <span className="text-xs font-mono text-text-muted">.tex</span>
      </div>

      {/* Code block with syntax highlighting aesthetic */}
      <div className="relative rounded-md overflow-hidden border border-border">
        {/* Line numbers gutter */}
        <pre className="bg-background p-3 text-sm font-mono overflow-auto max-h-64">
          <code className="text-text-primary whitespace-pre">{tikzCode}</code>
        </pre>
      </div>

      <button
        onClick={handleCopy}
        className={`w-full px-3 py-2 text-sm font-mono font-medium rounded-md cursor-pointer
          transition-colors duration-150
          ${
            copied
              ? 'bg-success-muted text-success'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
      >
        {copied ? '✓ copied!' : 'copy()'}
      </button>
    </div>
  );
}
