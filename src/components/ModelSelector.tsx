'use client';

import { Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { MODELS } from '@/lib/models';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const { selectedModels, toggleModel } = useStore();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Models
      </p>
      {MODELS.map((model) => {
        const isSelected = selectedModels.includes(model.id);
        return (
          <button
            key={model.id}
            onClick={() => toggleModel(model.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left text-sm transition-colors',
              isSelected
                ? 'bg-primary-50 text-primary-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                isSelected
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 bg-white'
              )}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </span>
            <span className="truncate">{model.name}</span>
          </button>
        );
      })}
    </div>
  );
}
