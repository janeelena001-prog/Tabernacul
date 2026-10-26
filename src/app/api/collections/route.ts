import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const format = sp.get('format');
  const itemType = sp.get('type') || undefined;

  if (format === 'csv') {
    const items = await db.collectionItem.findMany({
      where: itemType ? { itemType } : {},
      orderBy: { createdAt: 'desc' },
    });
    const cols = ['fullName', 'title', 'company', 'domain', 'email', 'riskScore', 'phone', 'linkedinUrl', 'country', 'itemType', 'sourceTool', 'createdAt'];
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = items.map((i) => cols.map((c) => (c === 'createdAt' ? i.createdAt.toISOString() : esc(i[c as keyof typeof i]))).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="moltsets-collection-${Date.now()}.csv"`,
      },
    });
  }

  const items = await db.collectionItem.findMany({
    where: itemType ? { itemType } : {},
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body) ? body : [body];
  const created = [];
  for (const item of items) {
    if (!item?.sourceTool) continue;
    created.push(
      await db.collectionItem.create({
        data: {
          itemType: String(item.itemType || 'person'),
          fullName: item.fullName ?? null,
          title: item.title ?? null,
          company: item.company ?? null,
          domain: item.domain ?? null,
          email: item.email ?? null,
          riskScore: item.riskScore ?? null,
          phone: item.phone ?? null,
          linkedinUrl: item.linkedinUrl ?? null,
          country: item.country ?? null,
          score: typeof item.score === 'number' ? item.score : null,
          sourceTool: String(item.sourceTool),
          dataJson: JSON.stringify(item.data || item),
        },
      }),
    );
  }
  return NextResponse.json({ created: created.length, items: created });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (id === 'all') {
    await db.collectionItem.deleteMany({});
    return NextResponse.json({ ok: true });
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.collectionItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
