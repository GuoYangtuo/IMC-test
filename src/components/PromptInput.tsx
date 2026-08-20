'use client';

import { useStore } from '@/lib/store';

export function PromptInput() {
  const { prompt, setPrompt, negativePrompt, setNegativePrompt } = useStore();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Prompt
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image to generate..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm resize-none outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Negative Prompt <span className="text-gray-400 normal-case">(optional)</span>
        </p>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Things to avoid, e.g. blurry, low quality, extra fingers"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm resize-none outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="text-[11px] text-gray-400">
          Supported by Seedream (ByteDance) and Qwen Image (Alibaba). Ignored for GPT Image.
        </p>
      </div>
    </div>
  );
}
