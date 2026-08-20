import type { ModelId, TokenUsage, CostInfo } from '@/types';

// Pricing per 1000 tokens (USD)
export const MODEL_PRICING: Record<ModelId, { input: number; output: number }> = {
  'seedream-5.0-pro': {
    input: 0.05,
    output: 0.15,
  },
  'seedream-5.0-lite': {
    input: 0.02,
    output: 0.08,
  },
  'qwen-image-3.0-pro': {
    input: 0.03,
    output: 0.10,
  },
  'gpt-image-2.0': {
    input: 0.01,
    output: 0.04,
  },
};

export function calculateCost(
  modelId: ModelId,
  tokenUsage: TokenUsage
): CostInfo {
  const pricing = MODEL_PRICING[modelId] || { input: 0, output: 0 };

  const inputCost = (tokenUsage.inputTokens / 1000) * pricing.input;
  const outputCost = (tokenUsage.outputTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCostPer1K: pricing.input,
    outputCostPer1K: pricing.output,
    totalCost,
  };
}

// Estimate tokens from prompt (rough estimation)
export function estimatePromptTokens(prompt: string): number {
  // Rough estimation: ~4 characters per token for English, ~2 for Chinese
  // Plus overhead for system instructions
  const avgCharsPerToken = 3;
  const overhead = 100; // System instructions, format tokens, etc.
  return Math.ceil(prompt.length / avgCharsPerToken) + overhead;
}

// Estimate tokens from image
export function estimateImageTokens(width: number, height: number): number {
  // Rough estimation based on image resolution
  // Standard: 1024x1024 ~= 85 tokens (base64 encoding overhead)
  const pixels = width * height;
  const baseTokens = Math.ceil(pixels / (1024 * 1024)) * 85;
  return baseTokens;
}

export function calculateEstimatedTokens(
  prompt: string,
  imageCount: number
): TokenUsage {
  const promptTokens = estimatePromptTokens(prompt);
  const imageTokens = imageCount * 85; // Average image token cost

  return {
    inputTokens: promptTokens + imageTokens,
    outputTokens: 0, // Will be updated after generation
    totalTokens: promptTokens + imageTokens,
  };
}
