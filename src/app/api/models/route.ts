import { NextResponse } from 'next/server';
import { MODELS } from '@/lib/models';
import { getPricing } from '@/lib/pricing';

export async function GET() {
  const models = MODELS.map((model) => ({
    ...model,
    pricing: getPricing(model.id),
  }));

  return NextResponse.json({
    models,
    providers: ['bytedance', 'alibaba', 'openai'],
  });
}