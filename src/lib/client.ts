'use client';

export interface CallResult {
  ok: boolean;
  httpStatus: number | null;
  data: Record<string, unknown> | null;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  records: number;
  durationMs: number;
  mode: 'live' | 'demo';
  fairUse?: Record<string, unknown>;
  toolMeta?: { id: string; name: string; category: string; docs: string };
}

export async function callTool(
  tool: string,
  payload: Record<string, unknown>,
  opts: { mode?: 'auto' | 'demo' | 'live'; batchCount?: number } = {},
): Promise<CallResult> {
  const res = await fetch('/api/moltsets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, payload, mode: opts.mode || 'auto', batchCount: opts.batchCount || 1 }),
  });
  const json = await res.json();
  if (!res.ok && json?.error && !json?.toolMeta) {
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }
  return json as CallResult;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

export function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

export function riskColor(grade: string | null | undefined): string {
  switch ((grade || '').toUpperCase()) {
    case 'A': return '#34D399';
    case 'B': return '#A3E635';
    case 'C': return '#FDE047';
    case 'D': return '#FB923C';
    case 'F': return '#F87171';
    default: return '#94A3B8';
  }
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Array.from(rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set<string>()));
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
