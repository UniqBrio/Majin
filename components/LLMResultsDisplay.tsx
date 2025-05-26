'use client';

import React, { useState } from 'react';
import { Clipboard, Check } from 'lucide-react'; // Using lucide-react for icons

interface LLMResult {
  id: string; // A unique ID for each result, useful for keys and state
  modelName: string;
  completion: string;
}

interface LLMResultsDisplayProps {
  results: LLMResult[];
}

const LLMResultsDisplay: React.FC<LLMResultsDisplayProps> = ({ results }) => {
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState<boolean>(false);

  const handleCopyIndividual = async (textToCopy: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedItemId(itemId);
      setTimeout(() => setCopiedItemId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy individual text:', err);
      alert('Failed to copy text. Please try again.');
    }
  };

  const handleCopyAll = async () => {
    if (results.length === 0) return;

    const allOutputsText = results
      .map(result => `Model: ${result.modelName}\nOutput:\n${result.completion}\n---`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(allOutputsText);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy all texts:', err);
      alert('Failed to copy all outputs. Please try again.');
    }

  };

  if (!results || results.length === 0) {
    return <p className="text-muted-foreground">No results to display.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleCopyAll}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center transition-colors"
          disabled={results.length === 0}
        >
          {allCopied ? (
            <>
              <Check size={18} className="mr-2 text-green-400" /> Copied All
            </>
          ) : (
            <>
              <Clipboard size={18} className="mr-2" /> Copy All Outputs
            </>
          )}
        </button>
      </div>

      {results.map((result) => (
        <div key={result.id} className="p-4 border rounded-lg shadow bg-card text-card-foreground">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-primary">{result.modelName}</h3>
            <button
              onClick={() => handleCopyIndividual(result.completion, result.id)}
              title="Copy output"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedItemId === result.id ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <Clipboard size={20} />
              )}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
            {result.completion}
          </pre>
        </div>
      ))}
    </div>
  );
};

export default LLMResultsDisplay;

// How you might use this component in a page (e.g., d:\Majin2\Majin\app\my-page\page.tsx):
/*
import LLMResultsDisplay from '@/app/components/LLMResultsDisplay'; // Adjust path

export default function MyPage() {
  // Assume 'fetchedResults' is populated by your API calls
  // Each item should have a unique 'id', 'modelName', and 'completion'
  const fetchedResults = [
    { id: '1', modelName: 'gpt-4', completion: 'This is a sample output from GPT-4.' },
    { id: '2', modelName: 'gemini-pro', completion: 'And this is one from Gemini Pro.' },
  ];

  return (
    <main className="container mx-auto py-8">
      <LLMResultsDisplay results={fetchedResults} />
    </main>
  );
}
*/