import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Number(sp.get('limit')) || 100, 500);
  const tool = sp.get('tool') || undefined;
  const status = sp.get('status') || undefined;

  const logs = await db.requestLog.findMany({
    where: { ...(tool ? { tool } : {}), ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ logs });
}

export async function DELETE() {
  await db.requestLog.deleteMany({});
  return NextResponse.json({ ok: true });
}
