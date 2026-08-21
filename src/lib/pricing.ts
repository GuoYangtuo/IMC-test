// Pricing configuration for different models (per 1K tokens in USD)
export interface ModelPricing {
  inputCostPer1K: number;
  outputCostPer1K: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'seedream-5.0-pro': {
    inputCostPer1K: 0.003, // Estimated
    outputCostPer1K: 0.015,
  },
  'seedream-5.0-lite': {
    inputCostPer1K: 0.0015,
    outputCostPer1K: 0.0075,
  },
  'doubao-seedream-4-5-251128': {
    inputCostPer1K: 0.0025,
    outputCostPer1K: 0.0125,
  },
  'qwen-image-3.0-pro': {
    inputCostPer1K: 0.0035,
    outputCostPer1K: 0.0175,
  },
  'gpt-image-2.0': {
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.025,
  },
  'nano-banana-2': {
    inputCostPer1K: 0.002,
    outputCostPer1K: 0.01,
  },
  'mai-image-2.5-pro': {
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.025,
  },
  'flux-2-max': {
    inputCostPer1K: 0.07,
    outputCostPer1K: 0,
  },
  'grok-imagine-image-2': {
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.025,
  },
};

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = MODEL_PRICING[modelId] || {
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.025,
  };

  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1K;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function getPricing(modelId: string): ModelPricing {
  return MODEL_PRICING[modelId] || { inputCostPer1K: 0.005, outputCostPer1K: 0.025 };
}