import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { ModelResult } from '@/types';

export const dynamic = 'force-dynamic';

interface SavePayload {
  results: ModelResult[];
  prompt: string;
  negativePrompt?: string;
  timestamp: number;
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: Buffer; ext: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${url}`);

  const contentType = response.headers.get('content-type') ?? '';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), ext };
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
