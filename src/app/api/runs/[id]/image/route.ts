import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = request.nextUrl.searchParams.get('file');
  if (!file) return NextResponse.json({ error: 'missing file param' }, { status: 400 });

  // Security: reject path traversal
  if (file.includes('/') || file.includes('\\') || file.includes('..')) {
    return NextResponse.json({ error: 'invalid file' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'runs', params.id, file);
    const buffer = await readFile(filePath);
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext] ?? 'application/octet-stream';
    return new NextResponse(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'file not found' }, { status: 404 });
  }
}