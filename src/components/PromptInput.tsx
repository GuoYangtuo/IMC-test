'use client';

import { useStore } from '@/lib/store';

export function PromptInput() {
  const { prompt, setPrompt } = useStore();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your image generation prompt..."
        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
      />
      <p className="text-sm text-gray-500">
        Describe what you want to generate or modify in the image.
      </p>
    </div>
  );
}
