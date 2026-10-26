import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Local analytics aggregate over the RequestLog table — powers the
// monitoring counters without spending API credits.
export async function GET() {
  const since24h = new Date(Date.now() - 24 * 3600000);
  const [total, last24h, okCount, notFoundCount, errorCount, byToolRaw, latency, recent] = await Promise.all([
    db.requestLog.count(),
    db.requestLog.count({ where: { createdAt: { gte: since24h } } }),
    db.requestLog.count({ where: { status: 'ok' } }),
    db.requestLog.count({ where: { status: 'not_found' } }),
    db.requestLog.count({ where: { status: 'error' } }),
    db.requestLog.groupBy({
      by: ['tool'],
      _count: { _all: true },
      _sum: { records: true },
    }),
    db.requestLog.aggregate({ _avg: { durationMs: true }, _max: { durationMs: true }, _sum: { records: true } }),
    db.requestLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
  ]);

  // per-hour buckets for last 24h activity chart
  const logs = await db.requestLog.findMany({
    where: { createdAt: { gte: since24h } },
    select: { createdAt: true, status: true, durationMs: true, records: true },
  });
  const hourly: Array<{ hour: string; calls: number; records: number; avgLatency: number }> = [];
  for (let i = 23; i >= 0; i--) {
    const start = new Date(Date.now() - i * 3600000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 3600000);
    const bucket = logs.filter((l) => l.createdAt >= start && l.createdAt < end);
    hourly.push({
      hour: `${String(start.getHours()).padStart(2, '0')}:00`,
      calls: bucket.length,
      records: bucket.reduce((a, b) => a + b.records, 0),
      avgLatency: bucket.length ? Math.round(bucket.reduce((a, b) => a + b.durationMs, 0) / bucket.length) : 0,
    });
  }

  const byTool = byToolRaw
    .map((t) => ({ tool: t.tool, calls: t._count._all, records: t._sum.records || 0 }))
    .sort((a, b) => b.calls - a.calls);

  const successRate = total > 0 ? Math.round(((okCount + notFoundCount) / total) * 1000) / 10 : 0;

  return NextResponse.json({
    total, last24h, okCount, notFoundCount, errorCount, successRate,
    avgLatency: Math.round(latency._avg.durationMs || 0),
    maxLatency: latency._max.durationMs || 0,
    totalRecords: latency._sum.records || 0,
    byTool, hourly,
    lastCallAt: recent[0]?.createdAt || null,
  });
}
