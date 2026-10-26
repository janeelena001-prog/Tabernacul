import { NextRequest, NextResponse } from 'next/server';
import { callMoltsets } from '@/lib/moltsets-server';
import { getTool } from '@/lib/moltsets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tool = String(body?.tool || '');
  const payload = (body?.payload || {}) as Record<string, unknown>;
  const mode = body?.mode === 'demo' ? 'demo' : body?.mode === 'live' ? 'live' : 'auto';
  const batchCount = Number(body?.batchCount) || 1;

  const meta = getTool(tool);
  if (!meta) {
    return NextResponse.json({ error: { code: 'unknown_tool', message: `Unknown tool: ${tool}` } }, { status: 400 });
  }

  const result = await callMoltsets(tool, payload, {
    mode, category: meta.category, batchCount,
  });

  return NextResponse.json({
    ...result,
    toolMeta: { id: meta.id, name: meta.name, category: meta.category, docs: meta.docs },
  });
}
