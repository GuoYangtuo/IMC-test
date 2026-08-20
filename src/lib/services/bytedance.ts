import axios from 'axios';
import crypto from 'crypto';

// ByteDance Volcengine Seedream API Service

interface VolcConfig {
  accessKey: string;
  secretKey: string;
  region: string;
}

interface SeedreamRequest {
  prompt: string;
  images: string[]; // Base64 encoded images
}

interface SeedreamResponse {
  image_url?: string;
  error?: string;
  request_id?: string;
}

function signRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  queries: Record<string, string>,
  body: string,
  secretKey: string
): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const signedHeaders = 'content-type;host;x-date';
  
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex');
  
  const canonicalRequest = [
    method,
    path,
    Object.entries(queries).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'),
    `content-type:${headers['content-type']}\nhost:${headers['host']}\nx-date:${headers['x-date']}`,
    signedHeaders,
    bodyHash,
  ].join('\n');

  const credentialScope = `${date}/cn-north-1/image_gen/request`;
  const stringToSign = [
    'HMAC-SHA256',
    headers['x-date'],
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const signingKey = `HMAC-SHA256\n${date}\n${credentialScope}\n${stringToSign}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signingKey).digest('hex');

  return `HMAC-SHA256 Credential=${secretKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

export async function callSeedreamPro(
  request: SeedreamRequest,
  config: VolcConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  const startTime = Date.now();
  
  try {
    const host = 'visual.volcengineapi.com';
    const path = '/api/v1/seedream5.0/pro';
    const region = config.region || 'cn-beijing';

    const now = new Date();
    const xDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const body = JSON.stringify({
      model: 'seedream5.0-pro',
      prompt: request.prompt,
      image_urls: request.images,
      aspect_ratio: '1:1',
      return_url: true,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Host: host,
      'X-Date': xDate,
    };

    const queries: Record<string, string> = {
      Action: 'Seedream5.0Pro',
      Version: '2024-01-01',
    };

    const signature = signRequest('POST', path, headers, queries, body, config.secretKey);
    const authHeader = `HMAC-SHA256 Credential=${config.accessKey}/${region}/image_gen/request, SignedHeaders=content-type;host;x-date, Signature=${signature}`;

    const response = await axios.post(
      `https://${host}${path}`,
      body,
      {
        headers: {
          ...headers,
          Authorization: authHeader,
        },
        params: queries,
      }
    );

    const duration = Date.now() - startTime;

    if (response.data.code === 0 || response.data.success) {
      return {
        imageUrl: response.data.data?.image_url || response.data.data?.url,
        tokens: {
          input: response.data.data?.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.data?.usage?.output_tokens || 100,
        },
      };
    } else {
      return {
        error: response.data.message || response.data.error || 'Unknown error',
      };
    }
  } catch (error: any) {
    return {
      error: error.response?.data?.message || error.message || 'Request failed',
    };
  }
}

export async function callSeedreamLite(
  request: SeedreamRequest,
  config: VolcConfig
): Promise<{ imageUrl?: string; error?: string; tokens?: { input: number; output: number } }> {
  const startTime = Date.now();
  
  try {
    const host = 'visual.volcengineapi.com';
    const path = '/api/v1/seedream5.0/lite';
    const region = config.region || 'cn-beijing';

    const now = new Date();
    const xDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const body = JSON.stringify({
      model: 'seedream5.0-lite',
      prompt: request.prompt,
      image_urls: request.images,
      aspect_ratio: '1:1',
      return_url: true,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Host: host,
      'X-Date': xDate,
    };

    const queries: Record<string, string> = {
      Action: 'Seedream5.0Lite',
      Version: '2024-01-01',
    };

    const signature = signRequest('POST', path, headers, queries, body, config.secretKey);
    const authHeader = `HMAC-SHA256 Credential=${config.accessKey}/${region}/image_gen/request, SignedHeaders=content-type;host;x-date, Signature=${signature}`;

    const response = await axios.post(
      `https://${host}${path}`,
      body,
      {
        headers: {
          ...headers,
          Authorization: authHeader,
        },
        params: queries,
      }
    );

    if (response.data.code === 0 || response.data.success) {
      return {
        imageUrl: response.data.data?.image_url || response.data.data?.url,
        tokens: {
          input: response.data.data?.usage?.input_tokens || Math.ceil(request.prompt.length / 3) + 100,
          output: response.data.data?.usage?.output_tokens || 100,
        },
      };
    } else {
      return {
        error: response.data.message || response.data.error || 'Unknown error',
      };
    }
  } catch (error: any) {
    return {
      error: error.response?.data?.message || error.message || 'Request failed',
    };
  }
}
