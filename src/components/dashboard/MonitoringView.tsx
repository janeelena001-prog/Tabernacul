'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Empty, Popconfirm, Row, Segmented, Select, Space, Switch, Table, Tag, Tooltip, Typography, message } from 'antd';
import {
  AlertOutlined, ApiOutlined, CheckCircleOutlined, ClearOutlined, MinusCircleOutlined,
  ReloadOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Area } from '@ant-design/plots';
import { fetchJson, fmt } from '@/lib/client';
import { BRAND } from '@/lib/theme';
import { useDash } from '@/lib/store';
import { KpiCard, PageHeader } from './ui';

const { Text } = Typography;

interface Stats {
  total: number; last24h: number; okCount: number; notFoundCount: number; errorCount: number;
  successRate: number; avgLatency: number; maxLatency: number; totalRecords: number;
  byTool: Array<{ tool: string; calls: number; records: number }>;
  hourly: Array<{ hour: string; calls: number; records: number; avgLatency: number }>;
  lastCallAt: string | null;
}
interface LogRow {
  id: string; tool: string; category: string; mode: string; status: string;
  httpStatus: number | null; errorMessage: string | null; records: number;
  durationMs: number; batchCount: number; keyLabel: string | null; createdAt: string;
}

const STATUS_RENDER: Record<string, { color: string; icon: React.ReactNode }> = {
  ok: { color: BRAND.green, icon: <CheckCircleOutlined /> },
  not_found: { color: BRAND.yellow, icon: <MinusCircleOutlined /> },
  error: { color: BRAND.red, icon: <AlertOutlined /> },
};

export default function MonitoringView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { bumpRefresh } = useDash();
  const [msgApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        fetchJson<Stats>('/api/stats'),
        fetchJson<{ logs: LogRow[] }>(`/api/logs?limit=300${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`),
      ]);
      setStats(s);
      setLogs(l.logs);
    } catch { /* ignore */ }
  }, [statusFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial async data fetch
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      timer.current = setInterval(load, 5000);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
    if (timer.current) clearInterval(timer.current);
  }, [autoRefresh, load]);

  const hourlyData = (stats?.hourly || []).flatMap((h) => [
    { hour: h.hour, type: 'calls', value: h.calls },
    { hour: h.hour, type: 'records', value: h.records },
  ]);

  const columns: ColumnsType<LogRow> = [
    {
      title: 'Time', dataIndex: 'createdAt', width: 95,
      render: (v) => <Text type="secondary" style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>{new Date(String(v)).toLocaleTimeString('en-US', { hour12: false })}</Text>,
    },
    {
      title: 'Tool', dataIndex: 'tool', width: 200,
      render: (v, l) => (
        <Space size={6}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: BRAND.textPrimary }}>{String(v)}</span>
          {l.mode === 'demo' && <Tag color="warning" style={{ fontSize: 9, lineHeight: '14px' }}>demo</Tag>}
        </Space>
      ),
    },
    { title: 'Category', dataIndex: 'category', width: 120, render: (v) => <Tag style={{ fontSize: 10, borderColor: BRAND.border }}>{String(v)}</Tag> },
    {
      title: 'Status', dataIndex: 'status', width: 110,
      render: (v, l) => {
        const s = STATUS_RENDER[String(v)] || STATUS_RENDER.error;
        return (
          <Tooltip title={l.errorMessage || undefined}>
            <Space size={4}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 12, color: s.color }}>{String(v)}</span>
              {l.httpStatus ? <Text type="secondary" style={{ fontSize: 10 }}>{l.httpStatus}</Text> : null}
            </Space>
          </Tooltip>
        );
      },
    },
    { title: 'Records', dataIndex: 'records', width: 85, render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{String(v)}</span> },
    {
      title: 'Latency', dataIndex: 'durationMs', width: 100,
      render: (v) => {
        const ms = Number(v);
        const color = ms > 3000 ? BRAND.red : ms > 1200 ? BRAND.yellow : BRAND.green;
        return <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color }}>{ms} ms</span>;
      },
    },
    { title: 'Batch', dataIndex: 'batchCount', width: 65, render: (v) => Number(v) > 1 ? <Tag style={{ fontSize: 10 }}>{String(v)}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Key', dataIndex: 'keyLabel', width: 110, ellipsis: true, render: (v) => <Text type="secondary" style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>{String(v || '—')}</Text> },
  ];

  const maxToolCalls = Math.max(1, ...(stats?.byTool || []).map((t) => t.calls));

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="Monitoring & Analytics"
        subtitle="Zero-cost telemetry: every proxied call is logged locally with latency, outcome and record counts — combine it with the API's own get_usage for the full picture."
        extra={
          <Space>
            <span style={{ fontSize: 12, color: BRAND.textMuted }}>Auto-refresh</span>
            <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
            <Button icon={<ReloadOutlined />} onClick={() => { load(); bumpRefresh(); }}>Refresh</Button>
            <Popconfirm title="Clear all request logs?" onConfirm={async () => { await fetch('/api/logs', { method: 'DELETE' }); load(); msgApi.success('Logs cleared'); }} okButtonProps={{ danger: true }}>
              <Button danger icon={<ClearOutlined />}>Clear logs</Button>
            </Popconfirm>
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col xs={12} md={8} xl={4}><KpiCard title="Total calls" value={stats?.total || 0} icon={<ApiOutlined />} hint="since first run" /></Col>
        <Col xs={12} md={8} xl={4}><KpiCard title="Calls (24h)" value={stats?.last24h || 0} icon={<ThunderboltOutlined />} color={BRAND.orange} /></Col>
        <Col xs={12} md={8} xl={4}><KpiCard title="Success rate" value={0} precision={0} icon={<CheckCircleOutlined />} color={BRAND.green} hint={stats ? `${stats.okCount} with data · ${stats.notFoundCount} misses` : ''} /></Col>
        <Col xs={12} md={8} xl={4}><KpiCard title="Errors" value={stats?.errorCount || 0} icon={<AlertOutlined />} color={BRAND.red} hint={stats?.errorCount ? 'check log below' : 'zero errors — clean'} /></Col>
        <Col xs={12} md={8} xl={4}><KpiCard title="Avg latency" value={stats?.avgLatency || 0} suffix="ms" icon={<ClockCircleOutlined />} color={BRAND.yellow} hint={`peak ${fmt(stats?.maxLatency || 0)}ms`} /></Col>
        <Col xs={12} md={8} xl={4}><KpiCard title="Records" value={stats?.totalRecords || 0} icon={<ApiOutlined />} color={BRAND.green} hint="returned across calls" /></Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} xl={14}>
          <Card
            title="Activity — last 24 hours"
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
            styles={{ body: { padding: '8px 12px' } }}
          >
            {hourlyData.every((d) => d.value === 0) ? (
              <Empty style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No activity in the last 24h.</span>} />
            ) : (
              <Area
                data={hourlyData}
                xField="hour"
                yField="value"
                colorField="type"
                height={240}
                theme="classicDark"
                scale={{ color: { range: [BRAND.orange, BRAND.green] } }}
                axis={{ x: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10 }, y: { title: false, labelFill: BRAND.textMuted, labelFontSize: 10, gridColor: '#1A1C22' } }}
                legend={{ color: { position: 'top', itemLabelFill: BRAND.textSecondary } }}
                style={{ fillOpacity: 0.35 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title="Tool usage distribution"
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            {!stats?.byTool.length ? (
              <Empty style={{ padding: 24 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No calls yet.</span>} />
            ) : (
              <div style={{ maxHeight: 240, overflowY: 'auto' }} className="dash-scroll">
                {stats.byTool.map((t) => (
                  <div key={t.tool} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.textSecondary }}>{t.tool}</span>
                      <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.textMuted }}>
                        {t.calls} calls · {fmt(t.records)} rec
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#1E2028', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${(t.calls / maxToolCalls) * 100}%`,
                        background: BRAND.orange,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="Live request log"
        extra={
          <Space>
            <Segmented
              size="small" value={statusFilter}
              onChange={(v) => setStatusFilter(v as string)}
              options={[
                { label: 'All', value: 'all' },
                { label: '✓ ok', value: 'ok' },
                { label: '○ not found', value: 'not_found' },
                { label: '✕ errors', value: 'error' },
              ]}
            />
            <Select
              size="small" value={pageSize} onChange={setPageSize}
              options={[50, 100, 300].map((n) => ({ value: n, label: `${n} rows` }))}
              style={{ width: 90 }}
            />
          </Space>
        }
        style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 12 }}
        styles={{ body: { padding: '4px 8px 8px' } }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{ pageSize, showTotal: (t) => `${t} log entries` }}
          expandable={{
            rowExpandable: (l) => !!l.errorMessage,
            expandedRowRender: (l) => <Text type="danger" style={{ fontSize: 12 }}>{l.errorMessage}</Text>,
          }}
          locale={{ emptyText: <Empty style={{ padding: 30 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No log entries — make some calls or enable demo mode.</span>} /> }}
        />
      </Card>
    </div>
  );
}
