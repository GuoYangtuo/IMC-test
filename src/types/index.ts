// Model Types
export type ModelProvider = 'bytedance' | 'alibaba' | 'openai';

export type ModelId =
  | 'seedream-5.0-pro'
  | 'seedream-5.0-lite'
  | 'doubao-seedream-4-5-251128'
  | 'qwen-image-3.0-pro'
  | 'gpt-image-2.0';

export interface ModelInfo {
  id: ModelId;
  name: string;
  provider: ModelProvider;
  providerName: string;
  description: string;
}

export interface ModelConfig {
  enabled: boolean;
}

// Request/Response Types
export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  base64?: string;
}

export interface GenerationRequest {
  images: ImageItem[];
  prompt: string;
  negativePrompt?: string;
  selectedModels: ModelId[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostInfo {
  inputCostPer1K: number;
  outputCostPer1K: number;
  totalCost: number;
}

export interface ModelResult {
  modelId: ModelId;
  modelName: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
  tokenUsage?: TokenUsage;
  cost?: CostInfo;
  duration: number; // milliseconds
  timestamp: number;
}

export interface GenerationResponse {
  results: ModelResult[];
  totalDuration: number;
}
