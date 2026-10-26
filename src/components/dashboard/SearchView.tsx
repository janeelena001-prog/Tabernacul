'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Button, Card, Col, Divider, Empty, Form, Input, InputNumber,
  Modal, Popconfirm, Row, Select, Space, Spin, Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  ApiOutlined, BookOutlined, ClearOutlined, CloudDownloadOutlined, DownOutlined,
  SaveOutlined, SearchOutlined, StarFilled, UpOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MoltTool, buildPayload } from '@/lib/moltsets';
import { callTool, downloadCsv, fmt, CallResult } from '@/lib/client';
import { BRAND } from '@/lib/theme';
import { DemoTag, KpiCard, PageHeader, RiskBadge } from './ui';

const { Text } = Typography;

interface SavedSearchItem { id: string; name: string; tool: string; paramsJson: string; createdAt: string }

function personToRecord(r: Record<string, unknown>, tool: string) {
  const c = (r.company || {}) as Record<string, unknown>;
  return {
    itemType: 'person',
    fullName: r.full_name, title: r.title,
    company: c.name, domain: c.domain,
    email: r.business_email,
    riskScore: r.business_email_risk_score,
    linkedinUrl: r.linkedin_url,
    country: r.country,
    score: r._score,
    sourceTool: tool,
    data: r,
  };
}
function companyToRecord(r: Record<string, unknown>, tool: string) {
  return {
    itemType: 'company',
    fullName: r.name, title: r.industry,
    company: r.name, domain: r.domain,
    email: null, riskScore: null,
    linkedinUrl: r.linkedin_url,
    country: r.country,
    score: r._score,
    sourceTool: tool,
    data: r,
  };
}

export default function SearchView({ tool }: { tool: MoltTool }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown>>({});
  const [expanded, setExpanded] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [saveName, setSaveName] = useState('');
  const [msgApi, contextHolder] = message.useMessage();

  const pageSize = 10;

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/saved-searches');
      const json = await res.json();
      setSavedSearches((json.items || []).filter((s: SavedSearchItem) => s.tool === tool.id));
    } catch { /* ignore */ }
  }, [tool.id]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const runSearch = useCallback(async (offset = 0) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const payload = buildPayload(tool, values);
      payload.limit = pageSize;
      payload.offset = offset;
      setLastPayload(payload);
      const r = await callTool(tool.id, payload);
      setResult(r);
      const results = (r.data?.results || {}) as Record<string, unknown>;
      const inner = Array.isArray(results.results) ? results.results : (Array.isArray(r.data?.results) ? r.data.results : []);
      setRows((inner as Record<string, unknown>[]).map((row, i) => ({ ...row, __key: `${i}` })));
      setTotal(typeof results.total === 'number' ? results.total : inner.length);
      setPage(Math.floor(offset / pageSize) + 1);
      if (r.status === 'not_found' || inner.length === 0) {
        msgApi.info('No matches found — try relaxing filters (a miss costs no records).');
      }
    } catch (e) {
      msgApi.error(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [form, tool, msgApi]);

  const saveToCollection = useCallback(async (records: Record<string, unknown>[]) => {
    if (!records.length) return;
    const mapper = tool.id === 'search_companies' ? companyToRecord : personToRecord;
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records.map((r) => mapper(r, tool.id))),
      });
      const json = await res.json();
      msgApi.success(`Saved ${json.created} record${json.created === 1 ? '' : 's'} to collection`);
      setSelectedKeys([]);
    } catch {
      msgApi.error('Failed to save to collection');
    }
  }, [tool.id, msgApi]);

  const exportCsv = useCallback(() => {
    if (!rows.length) { msgApi.warning('Nothing to export'); return; }
    const flat = rows.map((r) => {
      const c = (r.company || {}) as Record<string, unknown>;
      return {
        full_name: r.full_name, title: r.title, seniority: r.seniority,
        company: c.name || r.name, domain: c.domain || r.domain,
        industry: c.industry || r.industry, employee_range: c.size || r.employee_range,
        revenue_range: r.revenue_range, email: r.business_email || r.email,
        risk_score: r.business_email_risk_score, city: r.city, state: r.state, country: r.country,
        linkedin_url: r.linkedin_url, score: r._score,
      };
    });
    downloadCsv(`moltsets-${tool.id}-${Date.now()}.csv`, flat);
    msgApi.success('CSV exported');
  }, [rows, tool.id, msgApi]);

  const saveSearch = useCallback(async () => {
    if (!saveName.trim()) { msgApi.warning('Give the search a name'); return; }
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), tool: tool.id, params: form.getFieldsValue() }),
      });
      setSaveModalOpen(false);
      setSaveName('');
      loadSaved();
      msgApi.success('Search saved');
    } catch { msgApi.error('Could not save search'); }
  }, [saveName, tool.id, form, loadSaved, msgApi]);

  const loadSavedSearch = useCallback((s: SavedSearchItem) => {
    try {
      form.setFieldsValue(JSON.parse(s.paramsJson));
      setExpanded(true);
      msgApi.info(`Loaded "${s.name}" — hit Search to run it`);
    } catch { /* ignore */ }
  }, [form, msgApi]);

  const deleteSaved = useCallback(async (id: string) => {
    await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' });
    loadSaved();
  }, [loadSaved]);

  const columns: ColumnsType<Record<string, unknown>> = useMemo(() => {
    if (tool.id === 'search_companies') {
      return [
        {
          title: 'Company', dataIndex: 'name', width: 220,
          render: (_, r) => (
            <div>
              <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>{String(r.name || '—')}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{String(r.domain || '')}</Text>
            </div>
          ),
        },
        { title: 'Industry', dataIndex: 'industry', width: 190, ellipsis: true, render: (v) => <Tag style={{ borderColor: BRAND.border }}>{String(v || '—')}</Tag> },
        { title: 'Employees', dataIndex: 'employee_range', width: 110, render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace" }}>{String(v || '—')}</span> },
        { title: 'Revenue', dataIndex: 'revenue_range', width: 130, render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace" }}>{String(v || '—')}</span> },
        {
          title: 'Location', width: 190, ellipsis: true,
          render: (_, r) => <Text type="secondary">{[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}</Text>,
        },
        { title: 'Score', dataIndex: '_score', width: 90, sorter: (a, b) => Number(a._score || 0) - Number(b._score || 0), render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.orange, fontWeight: 600 }}>{v ? Number(v).toFixed(2) : '—'}</span> },
        {
          title: '', width: 90,
          render: (_, r) => (
            <Button size="small" type="text" icon={<SaveOutlined />} onClick={() => saveToCollection([r])} title="Save to collection" />
          ),
        },
      ];
    }
    return [
      {
        title: 'Person', dataIndex: 'full_name', width: 210,
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>
              {String(r.full_name || '—')}
              {r.linkedin_url ? (
                <a href={String(r.linkedin_url)} target="_blank" rel="noreferrer" style={{ marginLeft: 6, color: BRAND.orange }} title="Open LinkedIn">
                  in↗
                </a>
              ) : null}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{String(r.headline || '').slice(0, 60)}</Text>
          </div>
        ),
      },
      { title: 'Title', dataIndex: 'title', width: 180, ellipsis: true, render: (v) => String(v || '—') },
      {
        title: 'Company', width: 180, ellipsis: true,
        render: (_, r) => {
          const c = (r.company || {}) as Record<string, unknown>;
          return (
            <div>
              <div style={{ color: BRAND.textSecondary, fontWeight: 500 }}>{String(c.name || '—')}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{String(c.domain || '')}</Text>
            </div>
          );
        },
      },
      {
        title: 'Location', width: 170, ellipsis: true,
        render: (_, r) => <Text type="secondary">{[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}</Text>,
      },
      { title: 'Seniority', dataIndex: 'seniority', width: 100, render: (v) => (v ? <Tag style={{ borderColor: BRAND.border }}>{String(v)}</Tag> : '—') },
      {
        title: 'Business Email', width: 210, ellipsis: true,
        render: (_, r) => (
          <Space size={6}>
            <Text copyable={{ text: r.business_email ? String(r.business_email) : undefined }} style={{ fontSize: 12 }}>
              {String(r.business_email || '—')}
            </Text>
            <RiskBadge grade={r.business_email_risk_score as string | undefined} />
          </Space>
        ),
      },
      { title: 'Score', dataIndex: '_score', width: 85, sorter: (a, b) => Number(a._score || 0) - Number(b._score || 0), render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.orange, fontWeight: 600 }}>{v ? Number(v).toFixed(2) : '—'}</span> },
      {
        title: '', width: 90,
        render: (_, r) => (
          <Button size="small" type="text" icon={<SaveOutlined />} onClick={() => saveToCollection([r])} title="Save to collection" />
        ),
      },
    ];
  }, [tool.id, saveToCollection]);

  const meta = result?.data?.metadata as { fair_use?: Record<string, number | string> } | undefined;
  const fair = meta?.fair_use;

  return (
    <div>
      {contextHolder}
      <PageHeader
        title={tool.name}
        subtitle={tool.description}
        extra={
          <>
            <Tag icon={<BookOutlined />} style={{ borderColor: BRAND.border }}>
              <a href={tool.docs} target="_blank" rel="noreferrer" style={{ color: BRAND.orange }}>Docs</a>
            </Tag>
            {result && <DemoTag mode={result.mode} />}
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9} xl={7}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: BRAND.orange }} />
                <span>Filters</span>
                <Badge count={Object.keys(lastPayload).filter((k) => k !== 'limit' && k !== 'offset').length} color={BRAND.orange} />
              </Space>
            }
            extra={
              <Button type="text" size="small" icon={expanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setExpanded(!expanded)} />
            }
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
            styles={{ body: { padding: '16px 20px 20px' } }}
          >
            {expanded && (
              <Form form={form} layout="vertical" size="middle" style={{ maxHeight: 640, overflowY: 'auto', paddingRight: 6 }} className="dash-scroll">
                {tool.params.map((p) => (
                  <Form.Item
                    key={p.name}
                    name={p.name}
                    label={
                      <Tooltip title={p.help || p.name}>
                        <span style={{ fontSize: 12, color: BRAND.textSecondary }}>{p.label}</span>
                      </Tooltip>
                    }
                    style={{ marginBottom: 12 }}
                  >
                    {p.type === 'multiselect' ? (
                      <Select
                        mode="multiple" allowClear showSearch maxTagCount={2}
                        placeholder="Any"
                        options={(p.options || []).map((o) => ({ value: o, label: o }))}
                      />
                    ) : p.type === 'textarea' ? (
                      <Input.TextArea rows={2} placeholder={p.placeholder || 'One value per line (OR)'} />
                    ) : p.type === 'number' ? (
                      <InputNumber min={p.min} max={p.max} style={{ width: '100%' }} />
                    ) : p.type === 'switch' ? (
                      <Switch />
                    ) : p.type === 'select' ? (
                      <Select options={(p.options || []).map((o) => ({ value: o, label: o }))} />
                    ) : (
                      <Input placeholder={p.placeholder} allowClear />
                    )}
                  </Form.Item>
                ))}
              </Form>
            )}
            <Divider style={{ margin: '12px 0', borderColor: BRAND.border }} />
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={() => runSearch(0)}
                style={{ flex: 1 }}
              >
                Search
              </Button>
              <Button icon={<ClearOutlined />} onClick={() => { form.resetFields(); setResult(null); setRows([]); setTotal(0); }} />
            </Space>
          </Card>

          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}><StarFilled style={{ color: BRAND.orange, marginRight: 6 }} />Saved searches</span>}
            style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 16 }}
          >
            {savedSearches.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No saved searches yet — configure filters and save them for reuse.</Text>}
            {savedSearches.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${BRAND.border}` }}>
                <a style={{ color: BRAND.textSecondary, fontSize: 13 }} onClick={() => loadSavedSearch(s)}>{s.name}</a>
                <Popconfirm title="Delete saved search?" onConfirm={() => deleteSaved(s.id)} okButtonProps={{ danger: true, size: 'small' }}>
                  <Button size="small" type="text" danger>✕</Button>
                </Popconfirm>
              </div>
            ))}
            <Button block size="small" icon={<SaveOutlined />} style={{ marginTop: 10 }} onClick={() => setSaveModalOpen(true)}>
              Save current filters
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={15} xl={17}>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={12} md={6}>
              <KpiCard title="Total matches" value={total} icon={<SearchOutlined />} hint={`page ${page} · ${pageSize} / page`} />
            </Col>
            <Col xs={12} md={6}>
              <KpiCard title="Shown" value={rows.length} icon={<SearchOutlined />} color={BRAND.green} hint="ranked by relevance" />
            </Col>
            <Col xs={12} md={6}>
              <KpiCard title="Latency" value={result?.durationMs || 0} suffix="ms" icon={<ApiOutlined />} color={BRAND.yellow} hint={result ? `${result.httpStatus} ${result.status}` : 'no call yet'} />
            </Col>
            <Col xs={12} md={6}>
              <KpiCard title="Search records left" value={fair ? Number(fair.records_remaining_5h ?? 0) : 0} icon={<ApiOutlined />} color={BRAND.orange} hint={fair?.records_reset_5h ? `resets ${new Date(String(fair.records_reset_5h)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'after first call'} />
            </Col>
          </Row>

          <Card
            title={<span>Results</span>}
            extra={
              <Space>
                <Button size="small" icon={<SaveOutlined />} disabled={!rows.length} onClick={() => saveToCollection(rows)}>Save all</Button>
                <Button size="small" icon={<SaveOutlined />} disabled={!selectedKeys.length} onClick={() => saveToCollection(rows.filter((_, i) => selectedKeys.includes(i)))}>
                  Save selected ({selectedKeys.length})
                </Button>
                <Button size="small" icon={<CloudDownloadOutlined />} disabled={!rows.length} onClick={exportCsv}>CSV</Button>
              </Space>
            }
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
            styles={{ body: { padding: '4px 8px 8px' } }}
          >
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 12, color: BRAND.textMuted, fontSize: 13 }}>Querying MoltSets…</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                style={{ padding: 48 }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: BRAND.textMuted }}>
                    {result?.status === 'not_found' ? 'No matches — refine your filters and search again.' : 'Configure filters and run your first search.'}
                  </span>
                }
              />
            ) : (
              <Table
                rowKey="__key"
                columns={columns}
                dataSource={rows}
                size="middle"
                scroll={{ x: 1100 }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: false,
                  onChange: (p) => runSearch((p - 1) * pageSize),
                }}
                rowSelection={{
                  selectedRowKeys: selectedKeys,
                  onChange: setSelectedKeys,
                  columnWidth: 36,
                }}
              />
            )}
          </Card>

          {result?.status === 'error' && (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              title={`API error${result.errorCode ? `: ${result.errorCode}` : ''}`}
              description={result.errorMessage}
            />
          )}
        </Col>
      </Row>

      <Modal
        title="Save current search"
        open={saveModalOpen}
        onOk={saveSearch}
        onCancel={() => setSaveModalOpen(false)}
        okText="Save"
      >
        <Input
          placeholder={`e.g. "US VPs of Sales"`}
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onPressEnter={saveSearch}
        />
      </Modal>
    </div>
  );
}
