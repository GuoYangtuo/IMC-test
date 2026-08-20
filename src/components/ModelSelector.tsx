'use client';

import { Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { MODELS } from '@/lib/models';
import { cn } from '@/lib/utils';

const PROVIDER_COLORS = {
  bytedance: 'bg-violet-100 text-violet-800 border-violet-200',
  alibaba: 'bg-orange-100 text-orange-800 border-orange-200',
  openai: 'bg-green-100 text-green-800 border-green-200',
};

export function ModelSelector() {
  const { selectedModels, toggleModel, selectAllModels, deselectAllModels } =
    useStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select Models
        </label>
        <div className="flex gap-2">
          <button
            onClick={selectAllModels}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={deselectAllModels}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODELS.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const providerColor = PROVIDER_COLORS[model.provider];

          return (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={cn(
                'model-card text-left',
                isSelected && 'selected'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{model.name}</h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        providerColor
                      )}
                    >
                      {model.providerName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {model.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500">
        {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}{' '}
        selected
      </p>
    </div>
  );
}
