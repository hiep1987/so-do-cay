'use client';

// TikZ output panel - placeholder for Phase 6 implementation

import { useState } from 'react';

export function TikzOutput() {
  const [copied, setCopied] = useState(false);

  // Placeholder - actual TikZ generator in Phase 6
  const tikzCode = `% TikZ code will appear here
% This is a placeholder for Phase 6 implementation

\\begin{tikzpicture}
  % Tree diagram code
\\end{tikzpicture}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">TikZ Output</h3>
      <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono overflow-auto max-h-64 text-gray-700">
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
