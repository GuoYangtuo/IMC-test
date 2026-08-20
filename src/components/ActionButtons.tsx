'use client';

import { Play, Square } from 'lucide-react';
import { useStore } from '@/lib/store';

export function ActionButtons() {
  const { selectedModels, images, prompt, isLoading, setIsLoading, clearResults, setResults } =
    useStore();

  const canRun = selectedModels.length > 0 && images.length > 0 && prompt.trim() !== '';

  const handleRun = async () => {
    if (!canRun || isLoading) return;

    setIsLoading(true);
    clearResults();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          prompt,
          selectedModels,
        }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleRun}
        disabled={!canRun || isLoading}
        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Square className="w-5 h-5" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Run Test
          </>
        )}
      </button>
    </div>
  );
}
