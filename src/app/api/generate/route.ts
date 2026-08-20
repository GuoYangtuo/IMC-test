import { NextRequest } from 'next/server';
import { MODEL_SERVICES } from '@/lib/services';
import { calculateCost, getPricing } from '@/lib/pricing';
import { getModelInfo } from '@/lib/models';
import type { GenerationRequest, ModelResult } from '@/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: GenerationRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { images, prompt, negativePrompt, selectedModels } = body;

  if (!images || images.length === 0) {
    return new Response(JSON.stringify({ error: 'No images provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!prompt || prompt.trim() === '') {
    return new Response(JSON.stringify({ error: 'No prompt provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!selectedModels || selectedModels.length === 0) {
    return new Response(JSON.stringify({ error: 'No models selected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const missing = images.filter((img) => !img.base64);
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error:
          'Some images are still being processed (missing base64). Please re-upload and try again.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Use a ReadableStream so we can push SSE events as each model finishes.
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Announce which models are in flight right away so the UI can render
      // placeholder cards with spinners.
      send('start', { modelIds: selectedModels });

      // Run all selected models in parallel; emit a "result" event for each
      // one as soon as it resolves.
      const settledAt: number[] = [];
      const startTime = Date.now();

      const promises = selectedModels.map(async (modelId) => {
        const modelStart = Date.now();
        const modelInfo = getModelInfo(modelId);
        const service = MODEL_SERVICES[modelId];

        let result: ModelResult;

        if (!service) {
          result = {
            modelId,
            modelName: modelInfo?.name || modelId,
            success: false,
            error: `Model service not found: ${modelId}`,
            duration: Date.now() - modelStart,
            timestamp: Date.now(),
          };
        } else {
          try {
            const response = await service({
              modelId,
              prompt,
              negativePrompt,
              images,
            });

            const duration = Date.now() - modelStart;
            const inputTokens = response.tokenUsage?.inputTokens || 0;
            const outputTokens = response.tokenUsage?.outputTokens || 0;
            const pricing = getPricing(modelId);
            const cost = calculateCost(modelId, inputTokens, outputTokens);

            result = {
              modelId,
              modelName: modelInfo?.name || modelId,
              success: response.success,
              imageUrl: response.imageUrl,
              error: response.error,
              tokenUsage: response.tokenUsage || {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
              cost: {
                inputCostPer1K: pricing.inputCostPer1K,
                outputCostPer1K: pricing.outputCostPer1K,
                totalCost: cost.totalCost,
              },
              duration,
              timestamp: Date.now(),
            };
          } catch (error: any) {
            result = {
              modelId,
              modelName: modelInfo?.name || modelId,
              success: false,
              error: error.message || 'Unknown error',
              duration: Date.now() - modelStart,
              timestamp: Date.now(),
            };
          }
        }

        // Push this model result to the client immediately.
        send('result', result);
        settledAt.push(Date.now());
        return result;
      });

      await Promise.all(promises);

      send('done', {
        totalDuration: Date.now() - startTime,
        count: settledAt.length,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}