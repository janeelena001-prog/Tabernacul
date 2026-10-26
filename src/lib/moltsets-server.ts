import { db } from '@/lib/db';
import { demoResponse } from '@/lib/demo';

const API_BASE = 'https://api.moltsets.com/api/v1/tools';
const USER_AGENT = 'MoltSets-Dashboard/1.0 (Next.js)';

export interface MoltCallResult {
  ok: boolean;
  httpStatus: number | null;
  data: Record<string, unknown> | null;
  status: string; // ok | not_found | error
  errorCode?: string;
  errorMessage?: string;
  records: number;
  durationMs: number;
  mode: 'live' | 'demo';
  fairUse?: Record<string, unknown>;
}

export async function getDefaultKey() {
  return db.apiKey.findFirst({
    where: { isDefault: true, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

export function countRecords(data: Record<string, unknown> | null): number {
  if (!data) return 0;
  const r = data.results as Record<string, unknown> | null | undefined;
  if (!r) return 0;
  if (Array.isArray(r)) return r.length;
  if (Array.isArray((r as Record<string, unknown>).results)) {
    return ((r.results as unknown[]).length);
  }
  if (typeof r.total === 'number') return r.total;
  if (typeof r.count === 'number') return r.count;
  if (r) return 1;
  return 0;
}

export async function callMoltsets(
  tool: string,
  payload: Record<string, unknown>,
  opts: { mode?: 'live' | 'demo' | 'auto'; keyId?: string; keyOverride?: string; category?: string; batchCount?: number } = {},
): Promise<MoltCallResult> {
  const started = Date.now();
  const batchCount = opts.batchCount ?? 1;

  let mode: 'live' | 'demo';
  let key: { id: string; key: string; keyMasked: string } | null = null;
  if (opts.mode === 'demo') {
    mode = 'demo';
  } else if (opts.keyOverride) {
    mode = 'live';
    key = { id: 'override', key: opts.keyOverride, keyMasked: opts.keyOverride.slice(0, 5) + '***' };
  } else {
    const found = opts.keyId
      ? await db.apiKey.findUnique({ where: { id: opts.keyId } })
      : await getDefaultKey();
    key = found ? { id: found.id, key: found.key, keyMasked: found.keyMasked } : null;
    mode = key ? 'live' : 'demo';
  }

  if (mode === 'demo') {
    const data = demoResponse(tool, payload);
    const result: MoltCallResult = {
      ok: true,
      httpStatus: 200,
      data,
      status: String(data.status || 'ok'),
      records: countRecords(data),
      durationMs: Date.now() - started,
      mode: 'demo',
      fairUse: (data.metadata as Record<string, unknown>)?.fair_use as Record<string, unknown> | undefined,
    };
    await db.requestLog.create({
      data: {
        tool, category: opts.category || 'Account', mode: 'demo', status: result.status,
        httpStatus: 200, records: result.records, durationMs: result.durationMs, batchCount,
        keyLabel: 'demo',
      },
    }).catch(() => {});
    return result;
  }

  try {
    const res = await fetch(`${API_BASE}/${tool}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key!.key}`,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    const err = (data as Record<string, Record<string, unknown>> | null)?.error;
    const result: MoltCallResult = {
      ok: res.ok,
      httpStatus: res.status,
      data,
      status: res.ok ? String((data as Record<string, unknown>)?.status || 'ok') : 'error',
      errorCode: err?.code ? String(err.code) : undefined,
      errorMessage: err?.message ? String(err.message) : res.ok ? undefined : `HTTP ${res.status}`,
      records: res.ok ? countRecords(data) : 0,
      durationMs: Date.now() - started,
      mode: 'live',
      fairUse: (data as Record<string, Record<string, unknown>> | null)?.metadata?.fair_use as Record<string, unknown> | undefined,
    };

    await db.requestLog.create({
      data: {
        tool, category: opts.category || 'Account', mode: 'live', status: result.status,
        httpStatus: res.status,
        errorMessage: result.errorMessage ? result.errorMessage.slice(0, 500) : null,
        records: result.records, durationMs: result.durationMs, batchCount,
        keyLabel: key!.keyMasked,
      },
    }).catch(() => {});

    if (res.status === 401 && key && key.id !== 'override') {
      await db.apiKey.update({ where: { id: key.id }, data: { status: 'invalid', lastError: 'Invalid API key (401)' } }).catch(() => {});
    } else if (key && key.id !== 'override' && res.ok) {
      await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    }
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const result: MoltCallResult = {
      ok: false, httpStatus: null, data: null, status: 'error', errorCode: 'network_error',
      errorMessage: message, records: 0, durationMs: Date.now() - started, mode: 'live',
    };
    await db.requestLog.create({
      data: {
        tool, category: opts.category || 'Account', mode: 'live', status: 'error',
        errorMessage: message.slice(0, 500), records: 0, durationMs: result.durationMs,
        batchCount, keyLabel: key?.keyMasked || null,
      },
    }).catch(() => {});
    return result;
  }
}
