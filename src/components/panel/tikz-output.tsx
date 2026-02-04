'use client';

// TikZ output panel - displays generated TikZ code with copy functionality

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
      <h3 className="font-semibold text-gray-900">TikZ Output</h3>
      <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono overflow-auto max-h-64 text-gray-700 whitespace-pre">
        {tikzCode}
      </pre>
      <button
        onClick={handleCopy}
        className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md
          hover:bg-blue-700 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  );
}
