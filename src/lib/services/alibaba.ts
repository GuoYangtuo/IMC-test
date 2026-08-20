import axios from 'axios';

// Alibaba Cloud Qwen Image API Service

interface AlibabaConfig {
  apiKey: string;
  region: string;
}

interface QwenImageRequest {
  prompt: string;
  images: string[]; // Base64 encoded images
}

export async function callQwenImagePro(
  request: QwenImageRequest,
  config: AlibabaConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  try {
    const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
    
    const response = await axios.post(
      `${baseUrl}/services/aigc/text2image/image-synthesis`,
      {
        model: 'qwen-vl-plus',
        input: {
          prompt: request.prompt,
          images: request.images,
        },
        parameters: {
          size: '1024*1024',
          n: 1,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'X-DashScope-Async': 'disable',
        },
      }
    );

    if (response.data.output?.image_url) {
      return {
        imageUrl: response.data.output.image_url,
        tokens: {
          input: response.data.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.usage?.output_tokens || 100,
        },
      };
    }

    // Check for async job
    if (response.data.output?.task_id) {
      const taskId = response.data.output.task_id;
      // Poll for result
      const result = await pollQwenImageResult(taskId, config);
      return result;
    }

    return {
      error: response.data.error?.message || 'No image URL in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { error: error.response.data.error.message };
    }
    return { error: error.message || 'Request failed' };
  }
}

async function pollQwenImageResult(
  taskId: string,
  config: AlibabaConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  const maxRetries = 30;
  const retryDelay = 2000;
  const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(
        `${baseUrl}/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        }
      );

      const status = response.data.output?.task_status;
      
      if (status === 'SUCCEEDED') {
        return {
          imageUrl: response.data.output?.results?.[0]?.image_url,
          tokens: {
            input: response.data.usage?.input_tokens || 0,
            output: response.data.usage?.output_tokens || 0,
          },
        };
      } else if (status === 'FAILED') {
        return {
          error: response.data.output?.error?.message || 'Task failed',
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    } catch (error) {
      // Continue polling
    }
  }

  return { error: 'Task polling timeout' };
}

// Alternative: Direct image generation without async
export async function callQwenImageProSync(
  request: QwenImageRequest,
  config: AlibabaConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  try {
    const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
    
    const response = await axios.post(
      `${baseUrl}/services/aigc/text2image/image-synthesis`,
      {
        model: 'qwen-vl-max',
        input: {
          prompt: request.prompt,
        },
        parameters: {
          size: '1024*1024',
          n: 1,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 120000,
      }
    );

    if (response.data.output?.image_url) {
      return {
        imageUrl: response.data.output.image_url,
        tokens: {
          input: response.data.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.usage?.output_tokens || 100,
        },
      };
    }

    return {
      error: response.data.error?.message || 'No image URL in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { error: error.response.data.error.message };
    }
    return { error: error.message || 'Request failed' };
  }
}
