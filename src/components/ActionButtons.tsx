'use client';

import { Play, Square } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { ImageItem, ModelResult, ModelId } from '@/types';

function sanitizeImages(images: ImageItem[]) {
  return images.map((img) => ({ id: img.id, url: img.url, base64: img.base64 }));
}

export function ActionButtons() {
  const {
    selectedModels,
    images,
    prompt,
    negativePrompt,
    isLoading,
    setIsLoading,
    clearResults,
    setPendingModels,
    setSelectionOrder,
  } = useStore();

  const allReady = images.length > 0 && images.every((img) => !!img.base64);
  const canRun = selectedModels.length > 0 && images.length > 0 && prompt.trim() !== '' && allReady;

  const handleRun = async () => {
    if (!canRun || isLoading) return;

    setIsLoading(true);
    clearResults();

    const modelIds = selectedModels as ModelId[];
    setPendingModels(modelIds);
    setSelectionOrder(modelIds);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: sanitizeImages(images),
          prompt,
          negativePrompt: negativePrompt.trim() ? negativePrompt : undefined,
          selectedModels,
        }),
      });

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => 'Request failed');
        console.error('Generation failed:', errText);
        setPendingModels([]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const lines = part.split('\n');
          let eventName = 'message';
          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine);
            if (eventName === 'result') {
              // upsertResult handles both success and failure — card stays in selection order
              useStore.getState().upsertResult(payload as ModelResult);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload:', e, dataLine);
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setPendingModels([]);
      setIsLoading(false);

      // Save results to files after everything finishes
      const { results } = useStore.getState();
      if (results.length > 0) {
        fetch('/api/save-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results, prompt, negativePrompt: useStore.getState().negativePrompt, timestamp: Date.now() }),
        })
          .then(() => useStore.getState().bumpHistoryVersion())
          .catch((err) => console.warn('Failed to save results:', err));
      }
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleRun}
        disabled={!canRun || isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Square className="w-4 h-4" />
            Running…
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Test
            {selectedModels.length > 0 && (
              <span className="ml-1 text-primary-200">({selectedModels.length})</span>
            )}
          </>
        )}
      </button>

      {images.length > 0 && !allReady && (
        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-center">
          Processing images…
        </p>
      )}
      {images.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Upload images to begin</p>
      )}
    </div>
  );
}
