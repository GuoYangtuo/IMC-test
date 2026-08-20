import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import axios from 'axios';
import type { ModelResult } from '@/types';

export const dynamic = 'force-dynamic';

interface SavePayload {
  results: ModelResult[];
  prompt: string;
  negativePrompt?: string;
  timestamp: number;
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: Buffer; ext: string }> {
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        // Treat 4xx/5xx as errors so we don't save a 1KB error page as the image
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const contentType = String(response.headers?.['content-type'] ?? '');
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      return { buffer: Buffer.from(response.data), ext };
    } catch (err) {
      lastErr = err;
      // Only retry on transient network errors; bail on 4xx
      const status = (err as any)?.response?.status;
      if (status && status >= 400 && status < 500) break;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function POST(request: NextRequest) {
  try {
    const body: SavePayload = await request.json();
    const { results, prompt, negativePrompt, timestamp } = body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'No results to save' }, { status: 400 });
    }

    const runDir = path.join(process.cwd(), 'runs', String(timestamp));
    await mkdir(runDir, { recursive: true });

    const meta = {
      prompt,
      negativePrompt: negativePrompt ?? null,
      timestamp,
      totalModels: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };

    // Save JSON metadata
    await writeFile(
      path.join(runDir, 'results.json'),
      JSON.stringify({ meta, results }, null, 2),
      'utf-8'
    );

    // Save images
    const savedImages: Record<string, string> = {};
    for (const result of results) {
      if (result.success && result.imageUrl) {
        try {
          let ext = 'png';
          let buffer: Buffer;

          if (result.imageUrl.startsWith('data:')) {
            const parts = result.imageUrl.split(',');
            ext = parts[0].includes('png') ? 'png' : 'jpg';
            buffer = Buffer.from(parts[1], 'base64');
          } else {
            const fetched = await fetchImageAsBuffer(result.imageUrl);
            ext = fetched.ext;
            buffer = fetched.buffer;
          }

          const filename = `${result.modelId}.${ext}`;
          await writeFile(path.join(runDir, filename), buffer);
          savedImages[result.modelId] = filename;
        } catch (imgErr) {
          console.warn(`Failed to save image for ${result.modelId}:`, imgErr);
          savedImages[result.modelId] = `ERROR: ${(imgErr as Error).message}`;
        }
      }
    }

    return NextResponse.json({ success: true, runDir, savedImages });
  } catch (error: any) {
    console.error('Save results error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save results' },
      { status: 500 }
    );
  }
}
