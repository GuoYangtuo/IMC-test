'use client';

import { useStore } from '@/lib/store';
import { ImageUploader } from './ImageUploader';
import { PromptInput } from './PromptInput';
import { ModelSelector } from './ModelSelector';
import { ActionButtons } from './ActionButtons';
import { ResultsPanel } from './ResultsPanel';

export function MainPanel() {
  const { isLoading } = useStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Image Model Comparison Test
        </h1>
        <p className="text-gray-600 mt-2">
          Test and compare image generation models from different providers
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Input Images
            </h2>
            <ImageUploader />
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Prompt
            </h2>
            <PromptInput />
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Models
            </h2>
            <ModelSelector />
          </section>

          <ActionButtons />

          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="loading-spinner" />
              <span className="text-gray-600">
                Sending requests to selected models...
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Results
            </h2>
            <ResultsPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
