import { NextRequest, NextResponse } from 'next/server';
import { rm } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate id is a numeric timestamp to prevent path traversal
  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'invalid run id' }, { status: 400 });
  }

  try {
    const runDir = path.join(process.cwd(), 'runs', params.id);
    await rm(runDir, { recursive: true, force: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete run' },
      { status: 500 }
    );
  }
}
