import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await db.savedSearch.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.tool) {
    return NextResponse.json({ error: 'name and tool required' }, { status: 400 });
  }
  const item = await db.savedSearch.create({
    data: {
      name: String(body.name).slice(0, 120),
      tool: String(body.tool),
      paramsJson: JSON.stringify(body.params || {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.savedSearch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
