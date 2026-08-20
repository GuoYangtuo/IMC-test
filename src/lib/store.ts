import { create } from 'zustand';
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

  // Selected Models
  selectedModels: ModelId[];
  toggleModel: (modelId: ModelId) => void;
  selectAllModels: () => void;
  deselectAllModels: () => void;

  // Results
  results: ModelResult[];
  setResults: (results: ModelResult[]) => void;
  clearResults: () => void;

  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Running Models (for progress tracking)
  runningModels: ModelId[];
  addRunningModel: (modelId: ModelId) => void;
  removeRunningModel: (modelId: ModelId) => void;
}

export const useStore = create<AppState>((set) => ({
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

  // Selected Models
  selectedModels: ['seedream-5.0-pro', 'seedream-5.0-lite', 'qwen-image-3.0-pro', 'gpt-image-2.0'],
  toggleModel: (modelId) =>
    set((state) => ({
      selectedModels: state.selectedModels.includes(modelId)
        ? state.selectedModels.filter((id) => id !== modelId)
        : [...state.selectedModels, modelId],
    })),
  selectAllModels: () =>
    set({
      selectedModels: ['seedream-5.0-pro', 'seedream-5.0-lite', 'qwen-image-3.0-pro', 'gpt-image-2.0'],
    }),
  deselectAllModels: () => set({ selectedModels: [] }),

  // Results
  results: [],
  setResults: (results) => set({ results }),
  clearResults: () => set({ results: [] }),

  // Loading State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Running Models
  runningModels: [],
  addRunningModel: (modelId) =>
    set((state) => ({
      runningModels: [...state.runningModels, modelId],
    })),
  removeRunningModel: (modelId) =>
    set((state) => ({
      runningModels: state.runningModels.filter((id) => id !== modelId),
    })),
}));
