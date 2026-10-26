import { NextRequest, NextResponse } from 'next/server';
import { callMoltsets } from '@/lib/moltsets-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const period = new URL(req.url).searchParams.get('period') || 'month';
  const result = await callMoltsets('get_usage', { period }, { category: 'Account' });
  return NextResponse.json(result);
}
