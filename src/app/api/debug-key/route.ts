import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.VOLC_API_KEY || '';
  return NextResponse.json({
    length: key.length,
    prefix: key.slice(0, 6),
    suffix: key.slice(-4),
    startsWithSk: key.startsWith('sk-'),
    startsWithVx: key.startsWith('VxC'),
    looksLikeUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key),
  });
}
