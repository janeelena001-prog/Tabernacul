'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Tag, Tooltip, Progress } from 'antd';
import { riskColor } from '@/lib/client';
import { BRAND } from '@/lib/theme';

/** Smoothly animated counter */
export function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    prev.current = target;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function KpiCard({
  title, value, suffix, icon, color = BRAND.orange, precision = 0, hint, delta, onClick,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
  precision?: number;
  hint?: string;
  delta?: string;
  onClick?: () => void;
}) {
  const animated = useCountUp(Math.round(value));
  const display = precision > 0 ? (value).toFixed(precision) : animated.toLocaleString('en-US');
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderColor: BRAND.border,
        background: BRAND.bgCard,
        cursor: onClick ? 'pointer' : 'default',
      }}
      styles={{ body: { padding: '16px 18px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: `${color}1A`, color, fontSize: 15,
        }}>
          {icon}
        </span>
        <span style={{ color: BRAND.textMuted, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: BRAND.textPrimary, lineHeight: 1.1 }}>
          {display}
        </span>
        {suffix && <span style={{ color: BRAND.textMuted, fontSize: 13 }}>{suffix}</span>}
        {delta && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: BRAND.green }}>{delta}</span>
        )}
      </div>
      {hint && <div style={{ color: BRAND.textMuted, fontSize: 12, marginTop: 6 }}>{hint}</div>}
    </Card>
  );
}

/** Compact label/value row for text-first stats (plan, status, balance…) */
export function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${BRAND.border}`, borderRadius: 8,
      background: BRAND.bgCard, padding: '12px 14px', minWidth: 0,
    }}>
      <div style={{ color: BRAND.textMuted, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: BRAND.textPrimary, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
        {children}
      </div>
    </div>
  );
}

export function RiskBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return <Tag style={{ color: BRAND.textMuted, borderColor: BRAND.border }}>—</Tag>;
  const color = riskColor(grade);
  return (
    <Tooltip title={`Deliverability risk grade: ${grade}`}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 26, height: 22, padding: '0 6px', borderRadius: 5,
        fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: 12,
        color, background: `${color}1A`,
      }}>
        {grade.toUpperCase()}
      </span>
    </Tooltip>
  );
}

export function FairUseMeter({
  label, used, limit, resetsAt, color = BRAND.orange,
}: {
  label: string;
  used: number;
  limit: number;
  resetsAt?: string | null;
  color?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const reset = resetsAt ? new Date(resetsAt) : null;
  const resetStr = reset ? reset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
  const stroke = pct > 90 ? BRAND.red : pct > 75 ? BRAND.yellow : color;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: BRAND.textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: BRAND.textMuted, textAlign: 'right' }}>
          {used.toLocaleString()} / {limit.toLocaleString()}{resetStr ? ` · resets ${resetStr}` : ''}
        </span>
      </div>
      <Progress percent={pct} showInfo={false} strokeColor={stroke} railColor="#1C1C22" size={{ height: 6 }} />
    </div>
  );
}

export function DemoTag({ mode }: { mode: 'live' | 'demo' }) {
  return mode === 'demo' ? (
    <Tooltip title="Demo mode — synthetic data, no API credits spent">
      <Tag color="warning" style={{ fontSize: 11 }}>DEMO</Tag>
    </Tooltip>
  ) : (
    <Tooltip title="Live data from api.moltsets.com">
      <Tag color="success" style={{ fontSize: 11 }}>LIVE</Tag>
    </Tooltip>
  );
}

export function PageHeader({
  title, subtitle, extra,
}: {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
      <div>
        <h1 style={{ color: BRAND.textPrimary, fontSize: 21, fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: BRAND.textMuted, margin: '6px 0 0', fontSize: 13, maxWidth: 720 }}>{subtitle}</p>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extra}</div>}
    </div>
  );
}

export function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderColor: BRAND.border,
    background: BRAND.bgCard,
    ...extra,
  };
}
