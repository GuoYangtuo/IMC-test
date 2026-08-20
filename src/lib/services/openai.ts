import axios from 'axios';

// OpenAI GPT Image API Service

interface OpenAIConfig {
  apiKey: string;
}

interface GPTImageRequest {
  prompt: string;
  images?: string[]; // Base64 encoded images for editing
}

export async function callGPTImage2(
  request: GPTImageRequest,
  config: OpenAIConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  try {
    const baseUrl = 'https://api.openai.com/v1';
    
    // Prepare image array if provided
    const imageArray = request.images?.map((img) => ({
      type: 'base64',
      data: img.split(',')[1] || img, // Remove data URL prefix if present
    })) || [];

    const response = await axios.post(
      `${baseUrl}/images/generations`,
      {
        model: 'gpt-image-2',
        prompt: request.prompt,
        n: 1,
        size: '1024x1024',
        ...(imageArray.length > 0 && {
          image: imageArray[0],
        }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 120000,
      }
    );

    if (response.data.data?.[0]?.url) {
      return {
        imageUrl: response.data.data[0].url,
        tokens: {
          input: response.data.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.usage?.output_tokens || 100,
        },
      };
    }

    if (response.data.data?.[0]?.b64_json) {
      // Return as data URL
      const b64 = response.data.data[0].b64_json;
      return {
        imageUrl: `data:image/png;base64,${b64}`,
        tokens: {
          input: response.data.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.usage?.output_tokens || 100,
        },
      };
    }

    return {
      error: 'No image URL or base64 data in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { error: error.response.data.error.message };
    }
    return { error: error.message || 'Request failed' };
  }
}

// Alternative endpoint for image editing
export async function callGPTImageEdit(
  request: GPTImageRequest,
  config: OpenAIConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  try {
    const baseUrl = 'https://api.openai.com/v1';
    
    if (!request.images || request.images.length === 0) {
      return callGPTImage2(request, config);
    }

    const response = await axios.post(
      `${baseUrl}/images/edits`,
      {
        model: 'gpt-image-2',
        image: request.images[0].split(',')[1] || request.images[0],
        prompt: request.prompt,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 120000,
      }
    );

    if (response.data.data?.[0]?.url) {
      return {
        imageUrl: response.data.data[0].url,
        tokens: {
          input: Math.ceil(request.prompt.length / 3) + 100,
          output: 100,
        },
      };
    }

    if (response.data.data?.[0]?.b64_json) {
      const b64 = response.data.data[0].b64_json;
      return {
        imageUrl: `data:image/png;base64,${b64}`,
        tokens: {
          input: Math.ceil(request.prompt.length / 3) + 100,
          output: 100,
        },
      };
    }

    return {
      error: 'No image URL or base64 data in response',
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      return { error: error.response.data.error.message };
    }
    return { error: error.message || 'Request failed' };
  }
}
