import { NextResponse } from 'next/server';
import { callMoltsets } from '@/lib/moltsets-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await callMoltsets('get_billing', {}, { category: 'Account' });
  return NextResponse.json(result);
}
