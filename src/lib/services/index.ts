import type { CallOptions, CallResponse, ModelService } from './types';
import { callSeedreamPro, callSeedreamLite, callSeedream45 } from './bytedance';
import { callQwenImagePro } from './alibaba';
import { callGPTImage2 } from './openai';
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
const qwenImageService: ModelService = async (options) => callQwenImagePro(options);
const gptImageService: ModelService = async (options) => callGPTImage2(options);

export const MODEL_SERVICES: Record<ModelId, ModelService> = {
  'seedream-5.0-pro': seedreamProService,
  'seedream-5.0-lite': seedreamLiteService,
  'doubao-seedream-4-5-251128': seedream45Service,
  'qwen-image-3.0-pro': qwenImageService,
  'gpt-image-2.0': gptImageService,
};

export { callSeedreamPro, callSeedreamLite, callSeedream45 } from './bytedance';
export { callQwenImagePro, callQwenImageProSync } from './alibaba';
export { callGPTImage2, callGPTImageEdit } from './openai';
export type { CallOptions, CallResponse, ModelService } from './types';
