import axios from 'axios';
import type { CallOptions, CallResponse } from './types';

// OpenAI GPT Image API Service
// Compatible with gpt-image-1 and gpt-image-2
// Base URL can be overridden via OPENAI_BASE_URL to support relay/proxy endpoints.

export async function callGPTImage2(options: CallOptions): Promise<CallResponse> {
  return callGPTImageGenerate(options);
}

// Image editing endpoint
export async function callGPTImageEdit(options: CallOptions): Promise<CallResponse> {
  return callGPTImageEditInternal(options);
}

function resolveOpenAI(): { baseUrl: string; apiKey: string | undefined } {
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const apiKey = process.env.OPENAI_API_KEY;
  return { baseUrl, apiKey };
}

async function callGPTImageGenerate(options: CallOptions): Promise<CallResponse> {
  const { images, prompt, apiKey: providedKey } = options;
  const { baseUrl, apiKey: envKey } = resolveOpenAI();
  const apiKey = providedKey || envKey;

  try {
    const requestBody: any = {
      model: 'gpt-image-1', // Fallback if gpt-image-2 not available
      prompt,
      n: 1,
      size: '1024x1024',
    };

    // If images provided, use edit endpoint instead
    if (images && images.length > 0) {
      return callGPTImageEditInternal(options);
    }

    const response = await axios.post(
      `${baseUrl}/images/generations`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 180000,
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
      error: 'No image URL or base64 data in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { success: false, error: error.response.data.error.message };
    }
    return { success: false, error: error.message || 'OpenAI request failed' };
  }
}

async function callGPTImageEditInternal(options: CallOptions): Promise<CallResponse> {
  const { images, prompt, apiKey: providedKey } = options;
  const { baseUrl, apiKey: envKey } = resolveOpenAI();
  const apiKey = providedKey || envKey;

  try {
    if (!images || images.length === 0) {
      return callGPTImageGenerate(options);
    }

    const firstImage = images[0];
    let imageData: string;

    if (firstImage.base64) {
      imageData = firstImage.base64.includes(',')
        ? firstImage.base64.split(',')[1]
        : firstImage.base64;
    } else {
      return {
        success: false,
        error: 'Image data required for editing (base64 needed)',
      };
    }

    const response = await axios.post(
      `${baseUrl}/images/edits`,
      {
        model: 'gpt-image-1',
        image: imageData,
        prompt,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 180000,
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
      error: 'No image URL or base64 data in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { success: false, error: error.response.data.error.message };
    }
    return { success: false, error: error.message || 'OpenAI edit request failed' };
  }
}

function estimateTokens(prompt: string, imageCount: number): number {
  // Rough estimate: 1 token per ~3 characters, plus 85 tokens per image
  return Math.ceil(prompt.length / 3) + imageCount * 85 + 50;
}
