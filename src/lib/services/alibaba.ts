import axios from 'axios';
import type { CallOptions, CallResponse } from './types';

// Alibaba Cloud DashScope Qwen Image 3.0 API Service
// Endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
// Region: International (Singapore) with dashscope.aliyuncs.com base URL

interface QwenImageRequest {
  model: string;
  input: {
    messages: Array<{
      role: string;
      content: Array<{ image?: string; text?: string }>;
    }>;
  };
  parameters?: {
    size?: string;
    n?: number;
    prompt_extend?: boolean;
    watermark?: boolean;
    seed?: number;
    output_size?: string;
  };
}

export async function callQwenImagePro(options: CallOptions): Promise<CallResponse> {
  return callQwenImage({
    ...options,
    model: 'qwen-image-3.0-pro',
  });
}

export async function callQwenImageProSync(options: CallOptions): Promise<CallResponse> {
  return callQwenImagePro(options);
}

async function callQwenImage(options: CallOptions & { model: string }): Promise<CallResponse> {
  const { images, prompt, model, apiKey } = options;

  try {
    // International endpoint (Singapore region) — works with sk-ws-H.* keys
    const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';

    // Build messages content
    const content: Array<{ image?: string; text?: string }> = [];

    // For image editing (I2I), prepend images before text
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.base64) {
          // Format: data:{mime};base64,{data} — the API supports this
          content.push({ image: img.base64 });
        } else if (img.url && !img.url.startsWith('blob:')) {
          content.push({ image: img.url });
        } else {
          return {
            success: false,
            error: 'Image base64 data missing — please re-upload the image.',
          };
        }
      }
    }

    // Always include the text prompt
    content.push({ text: prompt });

    const requestBody: QwenImageRequest = {
      model,
      input: {
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      },
      parameters: {
        n: 1,
        prompt_extend: true,
        watermark: false,
      },
    };

    const response = await axios.post(
      `${baseUrl}/services/aigc/multimodal-generation/generation`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY}`,
        },
        timeout: 180000,
      }
    );

    // Correct response path for qwen-image-3.0-pro
    // { output: { choices: [{ message: { content: [{ image: "url" }] } }] } }
    const imageUrl =
      response.data?.output?.choices?.[0]?.message?.content?.[0]?.image;

    if (imageUrl) {
      return {
        success: true,
        imageUrl,
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
      error: 'No image URL in response',
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.response?.data?.code;
    if (message) {
      return { success: false, error: `${message} (${error.response?.status || 'no status'})` };
    }
    return { success: false, error: error.message || 'Qwen Image request failed' };
  }
}

function estimateTokens(prompt: string, imageCount: number): number {
  return Math.ceil(prompt.length / 3) + imageCount * 85 + 50;
}
