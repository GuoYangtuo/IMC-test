import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runsDir = path.join(process.cwd(), 'runs');
    const entries = await readdir(runsDir, { withFileTypes: true });
    const runDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => Number(b) - Number(a)); // newest first

    const runs = await Promise.all(
      runDirs.map(async (id) => {
        try {
          const runDir = path.join(runsDir, id);
          const jsonPath = path.join(runDir, 'results.json');
          const raw = await readFile(jsonPath, 'utf-8');
          const { meta, results } = JSON.parse(raw);

          // Inspect actual files on disk so filenames reflect real extensions
          // (some models return JPEG instead of PNG).
          const files = await readdir(runDir);
          const fileByModel: Record<string, string> = {};
          const images: string[] = [];
          for (const result of results) {
            if (!result.success) continue;
            const match = files.find((f) => f.startsWith(`${result.modelId}.`));
            if (match) {
              fileByModel[result.modelId] = match;
              images.push(match);
            }
          }

          return {
            id,
            timestamp: meta.timestamp,
            createdAt: new Date(meta.timestamp).toISOString(),
            prompt: meta.prompt ?? '',
            negativePrompt: meta.negativePrompt ?? null,
            totalModels: meta.totalModels,
            succeeded: meta.succeeded,
            failed: meta.failed,
            images,
            savedImages: fileByModel,
            results: results.map((r: any) => ({
              modelId: r.modelId,
              modelName: r.modelName,
              success: r.success,
              error: r.error ?? null,
              duration: r.duration,
              tokenUsage: r.tokenUsage,
              cost: r.cost,
              timestamp: r.timestamp,
            })),
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ runs: runs.filter(Boolean) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
