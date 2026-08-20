'use client';

import { useStore } from '@/lib/store';
import { ImageUploader } from './ImageUploader';
import { PromptInput } from './PromptInput';
import { ModelSelector } from './ModelSelector';
import { ActionButtons } from './ActionButtons';
import { ResultsPanel } from './ResultsPanel';
import { HistoryPanel } from './HistoryPanel';

export function MainPanel() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Controls — 25% */}
      <aside className="w-[25%] flex-shrink-0 flex flex-col overflow-y-auto border-r border-gray-200 bg-gray-50/50">
        <section className="p-3 border-b border-gray-200">
          <ImageUploader />
        </section>
        <section className="p-3 border-b border-gray-200">
          <PromptInput />
        </section>
        <section className="p-3 border-b border-gray-200">
          <ModelSelector />
        </section>
        <section className="p-3">
          <ActionButtons />
        </section>
      </aside>

      {/* Right: Results — 72% */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-4 space-y-6">
          <ResultsPanel />
          <HistoryPanel />
        </div>
      </main>
    </div>
  );
}