import axios from 'axios';
import type { CallOptions, CallResponse } from './types';
import { REQUEST_TIMEOUT_MS } from './config';

// ByteDance Volcengine Ark — cn-beijing region (国内账户在国内 control panel 创建 key)
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

interface SeedreamRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  image?: string; // Base64/data-URI or public URL for image editing
  size?: string; // "1K" | "2K" | "3K" | "4K"
  output_format?: 'png' | 'jpeg';
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
}

export async function callSeedreamPro(options: CallOptions): Promise<CallResponse> {
  return callSeedream({
    ...options,
    model: 'doubao-seedream-5-0-pro-260628',
    size: '2K',
  });
}

export async function callSeedreamLite(options: CallOptions): Promise<CallResponse> {
  return callSeedream({
    ...options,
    model: 'doubao-seedream-5-0-260128',
    size: '2K',
  });
}

export async function callSeedream45(options: CallOptions): Promise<CallResponse> {
  return callSeedream({
    ...options,
    model: 'doubao-seedream-4-5-251128',
    size: '2K',
    modelOpts: {
      supportsOutputFormat: false,
      supportsNegativePrompt: true,
    },
  });
}

interface SeedreamModelOptions {
  outputFormat?: 'png' | 'jpeg';
  supportsNegativePrompt?: boolean;
  supportsOutputFormat?: boolean; // some models (e.g. 4.5) don't accept this field
}

async function callSeedream(
  options: CallOptions & { model: string; size?: string; modelOpts?: SeedreamModelOptions }
): Promise<CallResponse> {
  const { images, prompt, negativePrompt, model, size, apiKey, modelOpts = {} } = options;
  const {
    outputFormat = 'png',
    supportsNegativePrompt = true,
    supportsOutputFormat = true,
  } = modelOpts;

  try {
    const requestBody: SeedreamRequest = {
      model,
      prompt,
      response_format: 'url',
      watermark: false,
    };

    if (supportsOutputFormat) {
      requestBody.output_format = outputFormat;
    }

    if (supportsNegativePrompt && typeof negativePrompt === 'string' && negativePrompt.trim() !== '') {
      requestBody.negative_prompt = negativePrompt;
    }

    if (size) {
      requestBody.size = size;
    }

    // For image editing (I2I), pass the image as `image` field
    if (images && images.length > 0) {
      const firstImage = images[0];
      if (firstImage.base64) {
        requestBody.image = firstImage.base64;
      } else if (firstImage.url && !firstImage.url.startsWith('blob:')) {
        requestBody.image = firstImage.url;
      } else {
        return {
          success: false,
          error: 'Image base64 data missing — please re-upload the image.',
        };
      }
    }

    const resolvedApiKey = apiKey || process.env.VOLC_API_KEY;
    if (!resolvedApiKey) {
      return { success: false, error: 'VOLC_API_KEY is not set in environment variables.' };
    }

    const response = await axios.post(
      `${BASE_URL}/images/generations`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resolvedApiKey}`,
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    if (response.data.data?.[0]?.url) {
      return {
        success: true,
        imageUrl: response.data.data[0].url,
        tokenUsage: {
          inputTokens: response.data.usage?.input_tokens || estimateTokens(prompt, images?.length || 0),
          outputTokens: response.data.usage?.output_tokens || 100,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
        raw: response.data,
      };
    }

    if (response.data.data?.[0]?.b64_json) {
      const b64 = response.data.data[0].b64_json;
      return {
        success: true,
        imageUrl: `data:image/png;base64,${b64}`,
        tokenUsage: {
          inputTokens: response.data.usage?.input_tokens || estimateTokens(prompt, images?.length || 0),
          outputTokens: response.data.usage?.output_tokens || 100,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
        raw: response.data,
      };
    }

    return {
      success: false,
      error: `Unexpected response shape: ${JSON.stringify(response.data).slice(0, 200)}`,
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { success: false, error: error.response.data.error.message };
    }
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'API key authentication failed. Make sure VOLC_API_KEY is set to a valid Ark API Key.',
      };
    }
    if (error.response?.status === 404) {
      return {
        success: false,
        error: `404 Not Found — check the model ID. Response: ${JSON.stringify(error.response?.data || '').slice(0, 300)}`,
      };
    }
    return {
      success: false,
      error: error.response?.data
        ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 300)}`
        : error.message || 'Seedream request failed',
    };
  }
}

function estimateTokens(prompt: string, imageCount: number): number {
  return Math.ceil(prompt.length / 3) + imageCount * 85 + 50;
}
