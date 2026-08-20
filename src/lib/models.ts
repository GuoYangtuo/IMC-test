import type { ModelInfo } from '@/types';

export const MODELS: ModelInfo[] = [
  {
    id: 'seedream-5.0-pro',
    name: 'Seedream 5.0 Pro',
    provider: 'bytedance',
    providerName: 'ByteDance (Volcengine)',
    description: 'High-quality image generation with enhanced accuracy and aesthetics',
  },
  {
    id: 'seedream-5.0-lite',
    name: 'Seedream 5.0 Lite',
    provider: 'bytedance',
    providerName: 'ByteDance (Volcengine)',
    description: 'Lightweight version for faster results with good quality',
  },
  {
    id: 'qwen-image-3.0-pro',
    name: 'Qwen Image 3.0 Pro',
    provider: 'alibaba',
    providerName: 'Alibaba Cloud',
    description: 'Alibaba\'s advanced image generation model with strong comprehension',
  },
  {
    id: 'gpt-image-2.0',
    name: 'GPT Image 2.0',
    provider: 'openai',
    providerName: 'OpenAI',
    description: 'OpenAI\'s latest image generation model with high fidelity',
  },
];

export const getModelInfo = (modelId: string): ModelInfo | undefined => {
  return MODELS.find((m) => m.id === modelId);
};

export const getModelProvider = (modelId: string): string => {
  const model = getModelInfo(modelId);
  return model?.provider || 'unknown';
};
