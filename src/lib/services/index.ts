import type { CallOptions, CallResponse, ModelService } from './types';
import { callSeedreamPro, callSeedreamLite, callSeedream45 } from './bytedance';
import { callGPTImage2, callNanoBanana2, callQwenImage3Pro, callMaiImage25Pro, callFlux2Max, callGrokImagineImage2 } from './openrouter';
import type { ModelId } from '@/types';

// Adapter to wrap the legacy service signatures into the new ModelService interface
function adaptService(fn: (req: any, config: any) => Promise<any>): ModelService {
  return async (options: CallOptions): Promise<CallResponse> => {
    const result = await fn(
      {
        prompt: options.prompt,
        images: options.images?.map((img) => img.base64 || img.url),
      },
      { apiKey: options.apiKey }
    );
    return {
      success: !result.error,
      imageUrl: result.imageUrl,
      error: result.error,
      tokenUsage: result.tokens
        ? {
            inputTokens: result.tokens.input,
            outputTokens: result.tokens.output,
            totalTokens: result.tokens.input + result.tokens.output,
          }
        : undefined,
    };
  };
}

// Direct adapters (use the new CallOptions interface)
const seedreamProService: ModelService = async (options) => callSeedreamPro(options);
const seedreamLiteService: ModelService = async (options) => callSeedreamLite(options);
const seedream45Service: ModelService = async (options) => callSeedream45(options);
const qwenImageService: ModelService = async (options) => callQwenImage3Pro(options);
const gptImageService: ModelService = async (options) => callGPTImage2(options);
const nanoBananaService: ModelService = async (options) => callNanoBanana2(options);
const maiImageService: ModelService = async (options) => callMaiImage25Pro(options);
const flux2MaxService: ModelService = async (options) => callFlux2Max(options);
const grokImagineService: ModelService = async (options) => callGrokImagineImage2(options);

export const MODEL_SERVICES: Record<ModelId, ModelService> = {
  'seedream-5.0-pro': seedreamProService,
  'seedream-5.0-lite': seedreamLiteService,
  'doubao-seedream-4-5-251128': seedream45Service,
  'qwen-image-3.0-pro': qwenImageService,
  'gpt-image-2.0': gptImageService,
  'nano-banana-2': nanoBananaService,
  'mai-image-2.5-pro': maiImageService,
  'flux-2-max': flux2MaxService,
  'grok-imagine-image-2': grokImagineService,
};

export { callSeedreamPro, callSeedreamLite, callSeedream45 } from './bytedance';
export { callGPTImage2, callNanoBanana2, callQwenImage3Pro, callMaiImage25Pro, callFlux2Max, callGrokImagineImage2 } from './openrouter';
export type { CallOptions, CallResponse, ModelService } from './types';
