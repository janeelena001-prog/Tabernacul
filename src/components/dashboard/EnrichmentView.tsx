'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Col, Drawer, Empty, Input, Menu, Radio, Row, Space, Spin,
  Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  BookOutlined, CaretRightFilled, CloudUploadOutlined, InfoCircleOutlined,
  PlayCircleOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { TOOLS, MoltTool, ToolCategory } from '@/lib/moltsets';
import { callTool, CallResult } from '@/lib/client';
import { BRAND } from '@/lib/theme';
import { useDash } from '@/lib/store';
import { DemoTag, KpiCard, PageHeader, RiskBadge } from './ui';

const { Text } = Typography;

const ENRICH_TOOLS = TOOLS.filter((t) => !['Search', 'Account'].includes(t.category));

interface ResultRow { key: string; input: string; primary: string; secondary: string; extra: Record<string, unknown>; found: boolean; raw: Record<string, unknown> }

function emailLike(r: Record<string, unknown>): { primary: string; secondary: string } {
  return { primary: String(r.email || '—'), secondary: String(r.type || '') };
}

function extractRows(tool: MoltTool, data: Record<string, unknown> | null): { rows: ResultRow[]; total: number } {
  if (!data) return { rows: [], total: 0 };
  const res = data.results as unknown;

  // batch shapes: array of {input, result} or array of raw records
  if (Array.isArray(res)) {
    const arr = res as Array<Record<string, unknown>>;
    if (arr.length && 'input' in arr[0]) {
      const rows = arr.map((item, i) => {
        const r = (item.result || {}) as Record<string, unknown>;
        let primary = '', secondary = '';
        if (tool.id.includes('email')) ({ primary, secondary } = emailLike(r));
        else if (tool.id.includes('mobile')) { primary = String(r.phone_number || '—'); secondary = String(r.carrier || r.line_type || ''); }
        else if (tool.id.startsWith('reverse')) { primary = String(r.full_name || '—'); secondary = `${r.title || ''} @ ${r.current_company || ''}`; }
        else { primary = JSON.stringify(r).slice(0, 80); }
        return {
          key: `${item.input}-${i}`, input: String(item.input || ''), primary, secondary,
          extra: r, found: !!item.result && Object.keys(r).length > 0, raw: item,
        };
      });
      return { rows, total: rows.length };
    }
    // email_to_maid array of devices
    const rows = arr.map((item, i) => ({
      key: `m${i}`, input: '—',
      primary: String(item.device_id || JSON.stringify(item).slice(0, 60)),
      secondary: String(item.device_type || ''),
      extra: item, found: true, raw: item,
    }));
    return { rows, total: rows.length };
  }

  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    // search_linkedin_profile
    if (tool.id === 'search_linkedin_profile') {
      if (typeof r.count === 'number') {
        return { rows: [{ key: 'count', input: 'count_only', primary: `${r.count} matches`, secondary: 'free count', extra: r, found: true, raw: r }], total: 1 };
      }
      const list = Array.isArray(r) ? r : [r];
      return {
        rows: list.map((p, i) => ({
          key: `lp${i}`, input: String(p.full_name || ''),
          primary: String(p.linkedin_url || '—'), secondary: String(p.company || ''),
          extra: p as Record<string, unknown>, found: true, raw: p as Record<string, unknown>,
        })),
        total: list.length,
      };
    }
    // single objects
    if (tool.id === 'email_to_maid') return { rows: [], total: 0 };
    if ('device_id' in r) {
      return { rows: [{ key: 'm', input: '—', primary: String(r.device_id), secondary: String(r.device_type || ''), extra: r, found: true, raw: r }], total: 1 };
    }
    if (tool.id.includes('sha256')) {
      const hash = String(r.personal_email_SHA256 || r.linkedin_SHA256 || '—');
      return { rows: [{ key: 'h', input: '—', primary: hash, secondary: 'SHA256', extra: r, found: hash !== '—', raw: r }], total: 1 };
    }
    if (tool.id === 'email_to_linkedin') {
      return { rows: [{ key: 'l', input: '—', primary: String(r.linkedin_url || '—'), secondary: 'LinkedIn URL', extra: r, found: !!r.linkedin_url, raw: r }], total: 1 };
    }
    if (tool.id === 'ip_to_company') {
      return {
        rows: [{
          key: 'ip', input: '—', primary: String(r.company_name || '—'),
          secondary: `${r.domain || ''} · ${r.industry || ''}`, extra: r, found: !!r.company_name, raw: r,
        }],
        total: 1,
      };
    }
    if (tool.id === 'search_business_email_by_name') {
      return { rows: [{ key: 'be', input: '—', primary: String(r.email || '—'), secondary: r.risk_score ? `risk ${r.risk_score}` : '', extra: r, found: !!r.email, raw: r }], total: 1 };
    }
    if (tool.id === 'search_business_profile_by_name') {
      return {
        rows: [{ key: 'bp', input: '—', primary: String(r.full_name || '—'), secondary: `${r.title || ''} @ ${((r.company || {}) as Record<string, unknown>).name || ''}`, extra: r, found: true, raw: r }],
        total: 1,
      };
    }
    // fallback: single key-value
    return {
      rows: Object.entries(r).slice(0, 20).map(([k, v], i) => ({
        key: `kv${i}`, input: k, primary: typeof v === 'object' ? JSON.stringify(v).slice(0, 100) : String(v),
        secondary: '', extra: r, found: true, raw: r,
      })),
      total: 1,
    };
  }
  return { rows: [], total: 0 };
}

export default function EnrichmentView() {
  const [selectedId, setSelectedId] = useState<string>('linkedin_to_best_email');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [countOnly, setCountOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const { demoMode } = useDash();

  const tool = useMemo(() => TOOLS.find((t) => t.id === selectedId)!, [selectedId]);

  const menuItems = useMemo(() => {
    const cats = Array.from(new Set(ENRICH_TOOLS.map((t) => t.category))) as ToolCategory[];
    return cats.map((cat) => ({
      key: cat,
      type: 'group' as const,
      label: <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{cat}</span>,
      children: ENRICH_TOOLS.filter((t) => t.category === cat).map((t) => ({
        key: t.id,
        label: <span style={{ fontSize: 13 }}>{t.name}</span>,
      })),
    }));
  }, []);

  const run = useCallback(async () => {
    const isBatch = mode === 'batch' && tool.supportsBatch;
    const lines = batchInput.split('\n').map((s) => s.trim()).filter(Boolean);
    if (isBatch && lines.length === 0) { msgApi.warning('Paste at least one value (one per line)'); return; }
    if (isBatch && lines.length > (tool.batchMax || 100)) { msgApi.error(`Maximum ${tool.batchMax} values per batch`); return; }
    if (!isBatch && !singleInput.trim()) { msgApi.warning('Enter a value first'); return; }

    const payload: Record<string, unknown> = {};
    if (tool.id === 'search_linkedin_profile' || tool.id === 'search_business_email_by_name' || tool.id === 'search_business_profile_by_name') {
      // name+company tools: accept "Name | domain" per line or plain
      if (isBatch) {
        msgApi.info('Tip: batch mode suits URL/email tools — running line 1 only for this tool');
      }
      const parts = singleInput.split('|').map((s) => s.trim());
      if (parts.length >= 2) {
        payload.name = parts[0];
        payload.company_domain = parts[1];
      } else {
        const [a, b] = parts[0].split(/\s+/);
        if (a && b && a.includes('.') === false && parts[0].includes('.')) {
          payload.name = a;
          payload.company_domain = b;
        } else if (parts[0].includes('.')) {
          payload.company_domain = parts[0];
        } else {
          payload.name = parts[0];
        }
      }
      if (tool.id === 'search_linkedin_profile' && countOnly) payload.count_only = true;
    } else if (tool.inputMode === 'linkedin') {
      if (isBatch) payload[tool.batchField!] = lines;
      else payload[tool.singleField!] = singleInput.trim();
    } else if (tool.inputMode === 'email') {
      if (isBatch) payload[tool.batchField!] = lines;
      else payload[tool.singleField!] = singleInput.trim();
    } else if (tool.inputMode === 'ip') {
      payload.ip = singleInput.trim();
    }

    setLoading(true);
    try {
      const r = await callTool(tool.id, payload, { mode: demoMode ? 'demo' : 'auto', batchCount: isBatch ? lines.length : 1 });
      setResult(r);
      if (r.status === 'not_found') msgApi.info('No match found — misses cost nothing.');
      else if (r.status === 'error') msgApi.error(r.errorMessage || 'Call failed');
      else msgApi.success(`${r.records} record${r.records === 1 ? '' : 's'} in ${r.durationMs}ms`);
    } catch (e) {
      msgApi.error(e instanceof Error ? e.message : 'Call failed');
    } finally {
      setLoading(false);
    }
  }, [mode, tool, batchInput, singleInput, countOnly, msgApi, demoMode]);

  const rows = useMemo(() => extractRows(tool, result?.data || null), [tool, result]);

  const saveAll = useCallback(async () => {
    const items = rows.rows
      .filter((r) => r.found)
      .map((r) => ({
        itemType: 'person',
        fullName: r.extra.full_name || r.primary,
        title: r.extra.title || r.secondary || null,
        company: r.extra.current_company || r.extra.company || null,
        domain: r.extra.domain || null,
        email: r.extra.email || (tool.inputMode === 'email' ? r.input : null),
        riskScore: r.extra.risk_score || r.extra.work_email_confirmed_risk_score || null,
        phone: r.extra.phone_number || null,
        linkedinUrl: r.extra.linkedin_url || r.extra.linkedinurl || (tool.inputMode === 'linkedin' ? r.input : null),
        country: r.extra.country || null,
        sourceTool: tool.id,
        data: r.raw,
      }))
      .filter((i) => i.fullName || i.email || i.phone || i.linkedinUrl);
    if (!items.length) { msgApi.warning('Nothing savable in results'); return; }
    const res = await fetch('/api/collections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items),
    });
    const json = await res.json();
    msgApi.success(`Saved ${json.created} records to collection`);
  }, [rows, tool, msgApi]);

  const columns: ColumnsType<ResultRow> = [
    {
      title: tool.inputMode === 'linkedin' ? 'LinkedIn input' : tool.inputMode === 'email' ? 'Email input' : 'Field',
      dataIndex: 'input', width: 240, ellipsis: true,
      render: (v, r) => <Text style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace" }}>{v || r.key}</Text>,
    },
    {
      title: 'Result', dataIndex: 'primary', ellipsis: true,
      render: (v, r) => (
        <Space size={6}>
          <span style={{ color: r.found ? BRAND.textPrimary : BRAND.textMuted, fontSize: 13, wordBreak: 'break-all' }}>{v}</span>
          {r.secondary && <Tag style={{ fontSize: 10, borderColor: BRAND.border }}>{r.secondary}</Tag>}
          {r.extra.risk_score && <RiskBadge grade={String(r.extra.risk_score)} />}
          {r.extra.work_email_confirmed_risk_score && <RiskBadge grade={String(r.extra.work_email_confirmed_risk_score)} />}
        </Space>
      ),
    },
    {
      title: '', width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" type="text" icon={<SaveOutlined />} disabled={!r.found} onClick={() => {
            fetch('/api/collections', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([{
                itemType: 'person', fullName: r.extra.full_name || r.primary, title: r.extra.title || r.secondary || null,
                company: r.extra.current_company || null, email: r.extra.email || (tool.inputMode === 'email' ? r.input : null),
                riskScore: r.extra.risk_score || null, phone: r.extra.phone_number || null,
                linkedinUrl: r.extra.linkedin_url || r.extra.linkedinurl || null, country: r.extra.country || null,
                sourceTool: tool.id, data: r.raw,
              }]),
            }).then(() => msgApi.success('Saved to collection'));
          }} title="Save to collection" />
        </Space>
      ),
    },
  ];

  const gateWarning = tool.planGate === 'personal_email_available';
  const phoneMetered = tool.metered === 'phone_tokens';

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="Enrichment Suite"
        subtitle="Every identity, email, phone and ad-audience tool in one console — run single lookups or paste a batch of up to 100 URLs / emails per call."
        extra={result && <DemoTag mode={result.mode} />}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={7} lg={6} xl={5}>
          <Card
            size="small"
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
            styles={{ body: { padding: '8px 4px' } }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedId]}
              items={menuItems}
              onClick={({ key }) => { setSelectedId(key); setResult(null); setMode(TOOLS.find((t) => t.id === key)?.supportsBatch ? 'single' : 'single'); }}
              style={{ background: 'transparent', borderInlineEnd: 'none', maxHeight: 640, overflowY: 'auto' }}
              className="dash-scroll"
            />
          </Card>
        </Col>

        <Col xs={24} md={17} lg={18} xl={19}>
          <Card
            title={<Space><CaretRightFilled style={{ color: BRAND.orange }} />{tool.name}</Space>}
            extra={
              <Space>
                <Tooltip title={tool.description}>
                  <InfoCircleOutlined style={{ color: BRAND.textMuted }} />
                </Tooltip>
                <Tag icon={<BookOutlined />} style={{ borderColor: BRAND.border }}>
                  <a href={tool.docs} target="_blank" rel="noreferrer" style={{ color: BRAND.orange }}>Docs</a>
                </Tag>
              </Space>
            }
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
          >
            {gateWarning && (
              <Alert
                type="warning" showIcon style={{ marginBottom: 12 }}
                title={<span style={{ color: BRAND.yellow }}>Plan-gated tool</span>}
                description={<span style={{ color: BRAND.textMuted, fontSize: 12 }}>Personal email tools require the personal-email entitlement — available on Free, Solo ($27) and Pro ($97) plans. Check Account Setup → personal_email_available.</span>}
              />
            )}
            {phoneMetered && (
              <Alert
                type="info" showIcon style={{ marginBottom: 12 }}
                title={<span style={{ color: BRAND.textSecondary }}>Metered with phone tokens — $0.15 per number found, misses are free. Check your balance in Account Setup.</span>}
              />
            )}

            {tool.supportsBatch && (
              <Radio.Group
                value={mode} onChange={(e) => setMode(e.target.value)}
                optionType="button" buttonStyle="solid"
                style={{ marginBottom: 12 }}
                options={[
                  { label: 'Single lookup', value: 'single' },
                  { label: `Batch (${tool.batchMax} max)`, value: 'batch' },
                ]}
              />
            )}

            {tool.id === 'search_linkedin_profile' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Switch size="small" checked={countOnly} onChange={setCountOnly} />
                <Text type="secondary" style={{ fontSize: 12 }}>count_only — free match count, no tokens charged</Text>
              </div>
            )}

            {mode === 'single' || !tool.supportsBatch ? (
              <Input
                size="large"
                placeholder={
                  tool.inputMode === 'linkedin' ? 'https://linkedin.com/in/username'
                    : tool.inputMode === 'email' ? 'person@company.com'
                      : tool.inputMode === 'ip' ? '203.0.113.42'
                        : 'John Smith | acme.com'
                }
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                onPressEnter={run}
                style={{ fontFamily: "'Geist Mono', monospace" }}
              />
            ) : (
              <Input.TextArea
                rows={6}
                placeholder={`${tool.inputMode === 'linkedin' ? 'https://linkedin.com/in/user1\nhttps://linkedin.com/in/user2' : 'person1@company.com\nperson2@company.com'}\n(Up to ${tool.batchMax} lines)`}
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                style={{ fontFamily: "'Geist Mono', monospace" }}
              />
            )}

            <Space style={{ marginTop: 12 }}>
              <Button type="primary" icon={<PlayCircleOutlined />} loading={loading} onClick={run}>
                Run {tool.name}
              </Button>
              {result && (
                <>
                  <Button onClick={() => setJsonOpen(true)}>Raw JSON</Button>
                  <Button icon={<SaveOutlined />} onClick={saveAll} disabled={!rows.rows.length}>Save to collection</Button>
                </>
              )}
              {result && <DemoTag mode={result.mode} />}
            </Space>
          </Card>

          {result && (
            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
              <Col xs={12} md={6}>
                <KpiCard title="Records" value={result.records} icon={<CaretRightFilled />} hint={`${result.status}`} color={BRAND.green} />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard title="Latency" value={result.durationMs} suffix="ms" icon={<PlayCircleOutlined />} color={BRAND.yellow} hint={`HTTP ${result.httpStatus ?? '—'}`} />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard title="Batch size" value={rows.rows.length || 1} icon={<CloudUploadOutlined />} color={BRAND.orange} hint="inputs this call" />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard title="Found" value={rows.rows.filter((r) => r.found).length} icon={<CaretRightFilled />} color={BRAND.green} hint="rows with data" />
              </Col>
            </Row>
          )}

          <Card
            title="Results"
            style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 12 }}
            styles={{ body: { padding: '4px 8px 8px' } }}
          >
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>
            ) : !result ? (
              <Empty style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>Run a lookup to see results here.</span>} />
            ) : (
              <Table
                rowKey="key"
                columns={columns}
                dataSource={rows.rows}
                size="middle"
                pagination={rows.rows.length > 20 ? { pageSize: 20 } : false}
                expandable={{
                  rowExpandable: (r) => Object.keys(r.extra).length > 0,
                  expandedRowRender: (r) => (
                    <pre style={{ margin: 0, fontSize: 11, maxHeight: 260, overflow: 'auto', color: BRAND.textSecondary }} className="dash-scroll">
                      {JSON.stringify(r.raw, null, 2)}
                    </pre>
                  ),
                }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No data — status: {result.status}</span>} /> }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title="Raw API response"
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        width={520}
      >
        <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: BRAND.textSecondary }}>
          {JSON.stringify(result?.data, null, 2)}
        </pre>
      </Drawer>
    </div>
  );
}
