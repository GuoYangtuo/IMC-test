import type { ModelResult, ImageItem, ModelId } from '@/types';

export interface CallOptions {
  images: ImageItem[];
  prompt: string;
  modelId: ModelId;
  apiKey?: string;
  [key: string]: any;
}

export interface CallResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

export type ModelService = (options: CallOptions) => Promise<CallResponse>;