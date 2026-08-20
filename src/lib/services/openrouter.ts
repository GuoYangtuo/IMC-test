import axios from 'axios';
import type { CallOptions, CallResponse } from './types';
import { REQUEST_TIMEOUT_MS } from './config';

const BASE_URL = 'https://openrouter.ai/api/v1';

export async function callGPTImage2(options: CallOptions): Promise<CallResponse> {
  return callOpenRouterImage(options, 'openai/gpt-image-2');
}

export async function callNanoBanana2(options: CallOptions): Promise<CallResponse> {
  return callOpenRouterImage(options, 'google/gemini-3.1-flash-image');
}

export async function callQwenImage3Pro(options: CallOptions): Promise<CallResponse> {
  return callOpenRouterImage(options, 'qwen/qwen-image-3-pro');
}

async function callOpenRouterImage(options: CallOptions, modelSlug: string): Promise<CallResponse> {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'OPENROUTER_API_KEY is not set' };
  }

  const { images, prompt } = options;

  try {
    const requestBody: Record<string, any> = {
      model: modelSlug,
      prompt,
      n: 1,
    };

    // Reference images for edit mode
    if (images && images.length > 0) {
      requestBody.input_references = images.map((img) => {
        if (img.base64) {
          const b64 = img.base64.includes(',') ? img.base64 : `data:image/png;base64,${img.base64}`;
          return { type: 'image_url', image_url: { url: b64 } };
        }
        return { type: 'image_url', image_url: { url: img.url } };
      });
    }

    const response = await axios.post(`${BASE_URL}/images`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://example.com',
        'X-Title': process.env.OPENROUTER_SITE_TITLE || 'IMC-test',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    // OpenRouter Image API returns { data: [{ b64_json, url, ... }] }
    const data = response.data?.data?.[0];
    if (!data) {
      return { success: false, error: 'No image data in response' };
    }

    let imageUrl: string;
    if (data.b64_json) {
      imageUrl = `data:image/png;base64,${data.b64_json}`;
    } else if (data.url) {
      imageUrl = data.url;
    } else {
      return { success: false, error: 'No b64_json or url in response data' };
    }

    const usage = response.data.usage;
    return {
      success: true,
      imageUrl,
      tokenUsage: usage
        ? {
            inputTokens: usage.prompt_tokens || estimateTokens(prompt),
            outputTokens: usage.completion_tokens || 100,
            totalTokens: usage.total_tokens || 0,
          }
        : undefined,
      raw: response.data,
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { success: false, error: error.response.data.error.message };
    }
    return { success: false, error: error.message || 'OpenRouter request failed' };
  }
}

function estimateTokens(prompt: string): number {
  return Math.ceil(prompt.length / 3) + 50;
}
