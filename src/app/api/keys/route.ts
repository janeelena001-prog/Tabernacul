import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callMoltsets } from '@/lib/moltsets-server';

export const dynamic = 'force-dynamic';

function maskKey(key: string): string {
  if (key.length <= 8) return 'ms_***';
  return `${key.slice(0, 5)}${'•'.repeat(Math.max(4, key.length - 9))}${key.slice(-4)}`;
}

export async function GET() {
  const keys = await db.apiKey.findMany({
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id, label: k.label, keyMasked: k.keyMasked, isDefault: k.isDefault,
      status: k.status, plan: k.plan, accountName: k.accountName, lastError: k.lastError,
      createdAt: k.createdAt, lastUsedAt: k.lastUsedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const key = String(body?.key || '').trim();
  const label = String(body?.label || 'My API Key').trim() || 'My API Key';

  if (!/^ms_[A-Za-z0-9_\-]{6,}$/.test(key)) {
    return NextResponse.json(
      { error: 'Invalid key format. Keys look like ms_XXXXXXXXXXX (get one at app.moltsets.com).' },
      { status: 400 },
    );
  }

  // Validate by calling get_account live with this key
  const existing = await db.apiKey.findFirst({ where: { key } });
  const probe = await callMoltsets('get_account', {}, { mode: 'live', keyOverride: key, category: 'Account' });
  if (!probe.ok) {
    return NextResponse.json(
      { error: probe.errorMessage || 'Validation failed', code: probe.errorCode },
      { status: 400 },
    );
  }

  const acct = (probe.data?.results || {}) as Record<string, unknown>;
  const count = await db.apiKey.count();

  if (existing) {
    const updated = await db.apiKey.update({
      where: { id: existing.id },
      data: {
        label, status: 'active', plan: acct.plan ? String(acct.plan) : null,
        accountName: acct.name ? String(acct.name) : null, lastError: null,
        keyMasked: maskKey(key),
      },
    });
    return NextResponse.json({ key: updated, account: acct, mode: probe.mode });
  }

  const created = await db.apiKey.create({
    data: {
      label,
      key,
      keyMasked: maskKey(key),
      isDefault: count === 0,
      status: 'active',
      plan: acct.plan ? String(acct.plan) : null,
      accountName: acct.name ? String(acct.name) : null,
    },
  });
  return NextResponse.json({ key: created, account: acct, mode: probe.mode });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = String(body?.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.apiKey.updateMany({ data: { isDefault: false } });
  const updated = await db.apiKey.update({ where: { id }, data: { isDefault: true } });
  return NextResponse.json({ key: updated });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const existing = await db.apiKey.findUnique({ where: { id } });
  await db.apiKey.delete({ where: { id } });
  if (existing?.isDefault) {
    const next = await db.apiKey.findFirst({ orderBy: { createdAt: 'desc' } });
    if (next) await db.apiKey.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ ok: true });
}
