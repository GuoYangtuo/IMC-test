import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ImageItem, ModelId, ModelResult } from '@/types';

interface AppState {
  // Images
  images: ImageItem[];
  addImage: (image: ImageItem) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;

  // Prompt
  prompt: string;
  setPrompt: (prompt: string) => void;

  // Negative Prompt
  negativePrompt: string;
  setNegativePrompt: (negativePrompt: string) => void;

  // Selected Models
  selectedModels: ModelId[];
  toggleModel: (modelId: ModelId) => void;
  selectAllModels: () => void;
  deselectAllModels: () => void;

  // Results
  results: ModelResult[];
  setResults: (results: ModelResult[]) => void;
  upsertResult: (result: ModelResult) => void;
  clearResults: () => void;

  // Pending models (currently in flight)
  pendingModels: ModelId[];
  setPendingModels: (ids: ModelId[]) => void;
  removePendingModel: (id: ModelId) => void;

  // Selection order — fixed list set at run start so results always render in model selection order
  selectionOrder: ModelId[];
  setSelectionOrder: (ids: ModelId[]) => void;

  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Running Models (for progress tracking)
  runningModels: ModelId[];
  addRunningModel: (modelId: ModelId) => void;
  removeRunningModel: (modelId: ModelId) => void;
}

const DEFAULT_MODELS: ModelId[] = [
  'seedream-5.0-pro',
  'seedream-5.0-lite',
  'doubao-seedream-4-5-251128',
  'qwen-image-3.0-pro',
  'gpt-image-2.0',
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Images
      images: [],
      addImage: (image) =>
        set((state) => ({ images: [...state.images, image] })),
      removeImage: (id) =>
        set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
      clearImages: () => set({ images: [] }),

      // Prompt
      prompt: '',
      setPrompt: (prompt) => set({ prompt }),

      // Negative Prompt
      negativePrompt: '',
      setNegativePrompt: (negativePrompt) => set({ negativePrompt }),

      // Selected Models
      selectedModels: DEFAULT_MODELS,
      toggleModel: (modelId) =>
        set((state) => ({
          selectedModels: state.selectedModels.includes(modelId)
            ? state.selectedModels.filter((id) => id !== modelId)
            : [...state.selectedModels, modelId],
        })),
      selectAllModels: () => set({ selectedModels: DEFAULT_MODELS }),
      deselectAllModels: () => set({ selectedModels: [] }),

      // Results
      results: [],
      setResults: (results) => set({ results }),
      upsertResult: (result) =>
        set((state) => {
          const idx = state.results.findIndex((r) => r.modelId === result.modelId);
          if (idx >= 0) {
            const next = state.results.slice();
            next[idx] = result;
            return { results: next };
          }
          return { results: [...state.results, result] };
        }),
      clearResults: () => set({ results: [] }),

      // Pending models
      pendingModels: [],
      setPendingModels: (ids) => set({ pendingModels: ids }),
      removePendingModel: (id) =>
        set((state) => ({ pendingModels: state.pendingModels.filter((m) => m !== id) })),

      // Selection order
      selectionOrder: [],
      setSelectionOrder: (ids) => set({ selectionOrder: ids }),

      // Loading State
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Running Models
      runningModels: [],
      addRunningModel: (modelId) =>
        set((state) => ({ runningModels: [...state.runningModels, modelId] })),
      removeRunningModel: (modelId) =>
        set((state) => ({
          runningModels: state.runningModels.filter((id) => id !== modelId),
        })),
    }),
    {
      name: 'imc-test-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist user-facing inputs — drop transient run state and File
      // references that can't be (de)serialized.
      partialize: (state) => ({
        images: state.images.map((img) => ({
          id: img.id,
          url: img.url,
          base64: img.base64,
          // `file` (File instance) is intentionally dropped — base64 is enough.
        })),
        prompt: state.prompt,
        negativePrompt: state.negativePrompt,
        selectedModels: state.selectedModels,
      }),
      // After rehydration, swap any persisted blob URLs (which are invalid
      // after a refresh) with the base64 data URI so thumbnails still render.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.images = state.images.map((img) => {
          if (img.base64 && (!img.url || img.url.startsWith('blob:'))) {
            return { ...img, url: img.base64 };
          }
          return img;
        });
      },
    }
  )
);
