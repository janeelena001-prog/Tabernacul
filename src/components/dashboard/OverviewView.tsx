'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Empty, Row, Segmented, Space, Spin, Tag, Typography, message } from 'antd';
import {
  ApiOutlined, ArrowRightOutlined, BellOutlined, CheckCircleOutlined, CrownFilled,
  DashboardOutlined, DatabaseOutlined, MinusCircleOutlined, TeamOutlined,
  ThunderboltOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';
import { fmt, fetchJson } from '@/lib/client';
import { BRAND } from '@/lib/theme';
import { useDash } from '@/lib/store';
import { KpiCard, FairUseMeter, PageHeader, DemoTag } from './ui';

const { Text } = Typography;

interface Stats {
  total: number; last24h: number; okCount: number; notFoundCount: number; errorCount: number;
  successRate: number; avgLatency: number; maxLatency: number; totalRecords: number;
  byTool: Array<{ tool: string; calls: number; records: number }>;
  hourly: Array<{ hour: string; calls: number; records: number; avgLatency: number }>;
  lastCallAt: string | null;
}
interface UsageResp {
  ok: boolean; mode: 'live' | 'demo';
  data: { results?: { period: string; days: Array<{ date: string; calls: number; tokens: number; with_data: number; without_data: number; failed: number }>; totals: Record<string, number> } } | null;
}
interface LogRow {
  id: string; tool: string; mode: string; status: string; httpStatus: number | null;
  records: number; durationMs: number; createdAt: string;
}

const fU = (fu: Record<string, unknown> | undefined, path: string[]): { used: number; limit: number; resets: string | null } => {
  let node: unknown = fu;
  for (const p of path) node = (node as Record<string, unknown>)?.[p];
  const n = (node || {}) as Record<string, unknown>;
  return { used: Number(n.used || 0), limit: Number(n.limit || 0), resets: (n.resets_at as string) || null };
};

export default function OverviewView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<UsageResp | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [period, setPeriod] = useState<string>('week');
  const [loading, setLoading] = useState(true);
  const { account, setView, bumpRefresh, refreshTick, demoMode } = useDash();
  const [msgApi, contextHolder] = message.useMessage();

  const load = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const [s, u, l] = await Promise.all([
        fetchJson<Stats>('/api/stats').catch(() => null),
        fetchJson<UsageResp>(`/api/usage?period=${p}`).catch(() => null),
        fetchJson<{ logs: LogRow[] }>('/api/logs?limit=8').catch(() => null),
      ]);
      if (s) setStats(s);
      if (u) setUsage(u);
      if (l) setLogs(l.logs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period, refreshTick]);

  const fu = (account?.fair_use || {}) as Record<string, unknown>;
  const searchRec5h = fU(fu, ['search', 'records', '5h']);
  const enrichRec5h = fU(fu, ['enrich', 'records', '5h']);
  const hasFairUse = searchRec5h.limit > 0;

  const usageDays = usage?.data?.results?.days || [];
  const totals = usage?.data?.results?.totals;

  const usageData = usageDays.flatMap((d) => [
    { date: d.date.slice(5), type: 'Calls', value: d.calls },
    { date: d.date.slice(5), type: 'With data', value: d.with_data },
    { date: d.date.slice(5), type: 'No data', value: d.without_data },
  ]);

  const outcomeData = stats ? [
    { type: 'With data', value: stats.okCount, color: BRAND.green },
    { type: 'Not found', value: stats.notFoundCount, color: BRAND.yellow },
    { type: 'Errors', value: stats.errorCount, color: BRAND.red },
  ].filter((d) => d.value > 0) : [];

  const toolData = (stats?.byTool || []).slice(0, 8).map((t) => ({ tool: t.tool.replace(/_/g, ' '), calls: t.calls }));

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="Command Overview"
        subtitle="Live pulse of your MoltSets workspace — local call analytics, remote fair-use standing and consumption trends in one place."
        extra={
          <Space>
            {usage && <DemoTag mode={usage.mode} />}
            <Button icon={<DashboardOutlined />} onClick={() => { bumpRefresh(); msgApi.success('Refreshed'); }}>Refresh</Button>
          </Space>
        }
      />

      {loading && !stats ? (
        <div style={{ padding: 120, textAlign: 'center' }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title="Calls (24h)" value={stats?.last24h || 0} icon={<ApiOutlined />} hint={`${fmt(stats?.total || 0)} all time`} onClick={() => setView('monitoring')} />
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title="Success rate" value={stats?.successRate || 0} suffix="%" precision={1} icon={<CheckCircleOutlined />} color={BRAND.green}
                hint={stats ? `${fmt(stats.okCount)} with data · ${fmt(stats.notFoundCount)} miss` : ''}
                delta={stats && stats.successRate >= 95 ? 'healthy' : undefined}
                onClick={() => setView('monitoring')} />
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title="Avg latency" value={stats?.avgLatency || 0} suffix="ms" icon={<ClockCircleOutlined />} color={BRAND.yellow} hint={`peak ${fmt(stats?.maxLatency || 0)}ms`} onClick={() => setView('monitoring')} />
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title="Records found" value={stats?.totalRecords || 0} icon={<DatabaseOutlined />} color={BRAND.green} hint="all local calls" onClick={() => setView('collections')} />
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title={`Usage · ${period}`} value={totals?.calls || 0} icon={<BellOutlined />} color={BRAND.orange}
                hint={totals ? `${fmt(totals.with_data)} with data · ${fmt(totals.failed)} failed` : 'no usage data yet'} />
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard title="Phone tokens" value={Number(account?.phone_token_balance || 0)} icon={<ThunderboltOutlined />} color={BRAND.yellow}
                hint={account ? `plan allowance ${account.phone_token_allowance ?? '—'}` : 'connect a key'} onClick={() => setView('setup')} />
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={24} xl={16}>
              <Card
                title={<Space><DashboardOutlined style={{ color: BRAND.orange }} />Consumption trend</Space>}
                extra={<Segmented size="small" value={period} onChange={(v) => setPeriod(v as string)} options={['today', 'week', 'month', 'billing_cycle']} />}
                style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
                styles={{ body: { padding: '8px 12px' } }}
              >
                {usageData.length === 0 ? (
                  <Empty style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>Usage appears after your first calls.</span>} />
                ) : (
                  <Line
                    data={usageData}
                    xField="date"
                    yField="value"
                    colorField="type"
                    height={260}
                    theme="classicDark"
                    scale={{ color: { range: [BRAND.orange, BRAND.green, '#64748B'] } }}
                    axis={{
                      x: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10, labelFontFamily: "'Geist Mono', monospace" },
                      y: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10, gridColor: '#1A1C22' },
                    }}
                    legend={{ color: { position: 'top', itemLabelFill: BRAND.textSecondary, itemMarkerSize: 8 } }}
                    style={{ inset: 6, lineWidth: 2 }}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title={<Space><CheckCircleOutlined style={{ color: BRAND.green }} />Outcome mix (local)</Space>}
                style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
                styles={{ body: { padding: '8px 12px' } }}
              >
                {outcomeData.length === 0 ? (
                  <Empty style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>Run some calls first.</span>} />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Pie
                      data={outcomeData}
                      angleField="value"
                      colorField="type"
                      height={260}
                      theme="classicDark"
                      scale={{ color: { range: [BRAND.green, BRAND.yellow, BRAND.red] } }}
                      legend={{ color: { position: 'bottom', itemLabelFill: BRAND.textSecondary } }}
                      innerRadius={0.62}
                      style={{ stroke: BRAND.bgCard, strokeWidth: 2 }}
                    />
                    <div
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 224,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 26, fontWeight: 700, color: BRAND.textPrimary }}>
                        {stats?.successRate ?? 0}%
                      </span>
                      <span style={{ fontSize: 11, color: BRAND.textMuted }}>hit-or-miss</span>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={24} xl={16}>
              <Card
                title={<Space><ApiOutlined style={{ color: BRAND.orange }} />Calls by tool</Space>}
                style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
                styles={{ body: { padding: '8px 12px' } }}
              >
                {toolData.length === 0 ? (
                  <Empty style={{ padding: 32 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No tool activity yet.</span>} />
                ) : (
                  <Column
                    data={toolData}
                    xField="tool"
                    yField="calls"
                    height={230}
                    theme="classicDark"
                    axis={{
                      x: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10, labelAutoHide: true, labelFontFamily: "'Geist Mono', monospace" },
                      y: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10, gridColor: '#1A1C22' },
                    }}
                    style={{ maxWidth: 36, fill: BRAND.orange, radiusTopLeft: 4, radiusTopRight: 4 }}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title={<Space><CrownFilled style={{ color: BRAND.orange }} />Fair-use standing</Space>}
                extra={hasFairUse ? <Tag color="success">live</Tag> : null}
                style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
              >
                {hasFairUse ? (
                  <>
                    <FairUseMeter label="Search · records 5h" used={searchRec5h.used} limit={searchRec5h.limit} resetsAt={searchRec5h.resets} />
                    <FairUseMeter label="Enrich · records 5h" used={enrichRec5h.used} limit={enrichRec5h.limit} resetsAt={enrichRec5h.resets} color={BRAND.green} />
                  </>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Connect an API key (or enable demo mode) to see live 5-hour and 1-week fair-use windows from get_account.
                  </Text>
                )}
                <Space style={{ marginTop: 14 }} wrap>
                  <Button size="small" type="primary" ghost onClick={() => setView('people')}>People search <ArrowRightOutlined /></Button>
                  <Button size="small" type="primary" ghost onClick={() => setView('enrichment')}>Enrichment <ArrowRightOutlined /></Button>
                  <Button size="small" type="primary" ghost onClick={() => setView('setup')}>API key <ArrowRightOutlined /></Button>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card
            title={<Space><TeamOutlined style={{ color: BRAND.orange }} />Recent activity</Space>}
            extra={<Button size="small" type="text" onClick={() => setView('monitoring')}>Full log <ArrowRightOutlined /></Button>}
            style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 12 }}
            styles={{ body: { padding: '4px 16px 8px' } }}
          >
            {logs.length === 0 ? (
              <Empty style={{ padding: 24 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No calls logged yet — start with a search or flip on Demo Mode.</span>} />
            ) : (
              <div>
                {logs.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 0', borderBottom: `1px solid ${BRAND.border}` }}>
                    <Space size={8}>
                      {l.status === 'ok' ? <CheckCircleOutlined style={{ color: BRAND.green }} /> : l.status === 'not_found' ? <MinusCircleOutlined style={{ color: BRAND.yellow }} /> : <BellOutlined style={{ color: BRAND.red }} />}
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: BRAND.textPrimary }}>{l.tool}</span>
                      {l.mode === 'demo' && <Tag color="warning" style={{ fontSize: 10 }}>demo</Tag>}
                    </Space>
                    <Space size={10}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{l.records} rec · {l.durationMs}ms</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{new Date(l.createdAt).toLocaleTimeString()}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
