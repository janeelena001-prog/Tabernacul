'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Badge, Button, Card, Col, Descriptions, Empty, Input, Modal, Popconfirm, Row,
  Space, Spin, Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, CrownFilled, DeleteOutlined, ExperimentOutlined,
  KeyOutlined, RocketOutlined, SafetyOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { BRAND } from '@/lib/theme';
import { PLAN_TIERS, planName } from '@/lib/plans';
import { useDash, AccountInfo } from '@/lib/store';
import { MiniStat, PageHeader, FairUseMeter } from './ui';

const { Text } = Typography;

interface KeyRow {
  id: string; label: string; keyMasked: string; isDefault: boolean; status: string;
  plan: string | null; accountName: string | null; lastError: string | null; createdAt: string;
}
interface BillingInfo {
  plan?: string; subscription_status?: string; token_balance?: number; unlimited?: boolean;
  current_period_start?: string; current_period_end?: string;
  token_costs?: Record<string, number>;
}

const fU = (fu: Record<string, unknown> | undefined, path: string[]): { used: number; limit: number; resets: string | null } => {
  let node: unknown = fu;
  for (const p of path) node = (node as Record<string, unknown>)?.[p];
  const n = (node || {}) as Record<string, unknown>;
  return { used: Number(n.used || 0), limit: Number(n.limit || 0), resets: (n.resets_at as string) || null };
};

export default function SetupView() {
  const [keyInput, setKeyInput] = useState('');
  const [labelInput, setLabelInput] = useState('Primary Key');
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [acctLoading, setAcctLoading] = useState(false);
  const [mode, setMode] = useState<'auto' | 'demo'>('auto');
  const [msgApi, contextHolder] = message.useMessage();
  const { demoMode, setDemoMode, setKeyStatus, setAccount: setStoreAccount, setAccountMode } = useDash();

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      const json = await res.json();
      setKeys(json.keys || []);
      const active = (json.keys || []).some((k: KeyRow) => k.status === 'active' && k.isDefault);
      setKeyStatus((json.keys || []).length, active);
    } catch { /* ignore */ }
  }, [setKeyStatus]);

  const loadAccount = useCallback(async () => {
    setAcctLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch('/api/account'),
        fetch('/api/billing'),
      ]);
      const aj = await a.json();
      const bj = await b.json();
      if (aj.ok && aj.data?.results) {
        const acct: AccountInfo = aj.data.results;
        setAccount(acct);
        setStoreAccount(acct);
        setAccountMode('live');
      } else if (aj.mode === 'demo') {
        setAccount(aj.data?.results || null);
        setStoreAccount(aj.data?.results || null);
        setAccountMode('demo');
      } else {
        setAccount(null);
        setStoreAccount(null);
        setAccountMode(null);
      }
      if (bj.ok && bj.data?.results) setBilling(bj.data.results);
      else if (bj.mode === 'demo') setBilling(bj.data?.results || null);
      else setBilling(null);
      setMode(aj.mode || 'auto');
    } finally {
      setAcctLoading(false);
    }
  }, [setStoreAccount, setAccountMode]);

  useEffect(() => { loadKeys(); loadAccount(); }, [loadKeys, loadAccount]);

  const saveKey = useCallback(async () => {
    if (!keyInput.trim()) { msgApi.warning('Paste your MoltSets API key first'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput.trim(), label: labelInput.trim() || 'Primary Key' }),
      });
      const json = await res.json();
      if (!res.ok) {
        msgApi.error({ content: json.error || 'Validation failed', duration: 6 });
      } else {
        msgApi.success(`Key validated against get_account — account "${json.account?.name || 'unknown'}" is live. Welcome aboard!`);
        setKeyInput('');
        await loadKeys();
        await loadAccount();
      }
    } catch (e) {
      msgApi.error(e instanceof Error ? e.message : 'Failed to save key');
    } finally {
      setSaving(false);
    }
  }, [keyInput, labelInput, msgApi, loadKeys, loadAccount]);

  const setDefault = useCallback(async (id: string) => {
    await fetch('/api/keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadKeys();
    msgApi.success('Default key updated');
  }, [loadKeys, msgApi]);

  const deleteKey = useCallback(async (id: string) => {
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    loadKeys();
    loadAccount();
  }, [loadKeys, loadAccount]);

  const acct = account || {};
  const fu = (acct.fair_use || {}) as Record<string, unknown>;
  const enrichRec5h = fU(fu, ['enrich', 'records', '5h']);
  const enrichRec1w = fU(fu, ['enrich', 'records', '1w']);
  const searchRec5h = fU(fu, ['search', 'records', '5h']);
  const searchRec1w = fU(fu, ['search', 'records', '1w']);
  const enrichReq5h = fU(fu, ['enrich', 'requests', '5h']);

  const tokenCosts = Object.entries(billing?.token_costs || {}).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="API Key Setup"
        subtitle="Initialize your MoltSets API key to unlock live data. Keys follow the format ms_XXXXXXXXXXX and are validated against get_account before being stored locally."
        extra={
          <Space>
            <Tag icon={<SafetyOutlined />} style={{ borderColor: BRAND.border }}>Keys stay on this device</Tag>
            <Tag icon={demoMode ? <ExperimentOutlined /> : <RocketOutlined />} color={demoMode ? 'warning' : 'success'}>
              {demoMode ? 'DEMO MODE' : 'LIVE MODE'}
            </Tag>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={<Space><KeyOutlined style={{ color: BRAND.orange }} />Initialize API Key</Space>}
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              Grab a key from{' '}
              <a href="https://app.moltsets.com" target="_blank" rel="noreferrer" style={{ color: BRAND.orange }}>app.moltsets.com</a>{' '}
              — the free plan includes 1,000 API calls and 100 search records, no card required.
            </Text>
            <Input
              size="large"
              placeholder="ms_XXXXXXXXXXX"
              prefix={<KeyOutlined style={{ color: BRAND.textMuted }} />}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onPressEnter={saveKey}
              style={{ marginTop: 14, fontFamily: "'Geist Mono', monospace" }}
            />
            <Input
              placeholder="Key label (e.g. Primary Key)"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              style={{ marginTop: 10 }}
            />
            <Button
              type="primary" block size="large" loading={saving}
              onClick={saveKey}
              icon={<ThunderboltOutlined />}
              style={{ marginTop: 12 }}
            >
              Validate & Activate
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 14px', border: `1px solid ${BRAND.border}`, borderRadius: 8, background: BRAND.bgHover }}>
              <div>
                <div style={{ color: BRAND.textPrimary, fontWeight: 600, fontSize: 13 }}>Demo Mode</div>
                <Text type="secondary" style={{ fontSize: 12 }}>Explore every module with synthetic data — zero credits burned.</Text>
              </div>
              <Switch
                checked={demoMode}
                checkedChildren="DEMO"
                unCheckedChildren="LIVE"
                onChange={(v) => {
                  setDemoMode(v);
                  msgApi.info(v ? 'Demo mode on — all calls return synthetic data' : 'Demo mode off — live API when a key is active');
                }}
              />
            </div>

            {keys.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: BRAND.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Registered keys</div>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      border: `1px solid ${k.isDefault ? BRAND.orange : BRAND.border}`,
                      borderRadius: 8, marginBottom: 8, background: k.isDefault ? 'rgba(244,128,93,0.07)' : 'transparent',
                    }}
                  >
                    <Tooltip title={k.status === 'active' ? 'Verified against get_account' : k.lastError || 'Not verified'}>
                      {k.status === 'active'
                        ? <CheckCircleOutlined style={{ color: BRAND.green }} />
                        : k.status === 'invalid'
                          ? <CloseCircleOutlined style={{ color: BRAND.red }} />
                          : <Badge status="default" />}
                    </Tooltip>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: BRAND.textPrimary, fontSize: 13, fontWeight: 600 }}>
                        {k.label} {k.isDefault && <Tag color="orange" style={{ fontSize: 10, marginLeft: 4 }}>DEFAULT</Tag>}
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>{k.keyMasked}</Text>
                      {k.accountName && <Tag style={{ fontSize: 10, marginLeft: 6, borderColor: BRAND.border }}>{k.accountName} · {planName(k.plan)}</Tag>}
                    </div>
                    {!k.isDefault && <Button size="small" onClick={() => setDefault(k.id)}>Set default</Button>}
                    <Popconfirm title="Delete this key?" onConfirm={() => deleteKey(k.id)} okButtonProps={{ danger: true, size: 'small' }}>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<Space><CrownFilled style={{ color: BRAND.orange }} />Account & Fair-Use Standing</Space>}
            extra={acctLoading ? <Spin size="small" /> : mode === 'demo' ? <Tag color="warning">DEMO DATA</Tag> : null}
            style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
          >
            {!acct || Object.keys(acct).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: BRAND.textMuted }}>No active key — add one on the left, or flip Demo Mode to preview this panel.</span>}
              />
            ) : (
              <>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  <Col xs={12} md={6}>
                    <MiniStat label="Plan">{planName(acct.plan as string)}</MiniStat>
                  </Col>
                  <Col xs={12} md={6}>
                    <MiniStat label="Status">
                      <span style={{ color: acct.status === 'active' ? BRAND.green : BRAND.red }}>
                        {acct.status === 'active' ? '● Active' : `● ${String(acct.status || 'unknown')}`}
                      </span>
                    </MiniStat>
                  </Col>
                  <Col xs={12} md={6}>
                    <MiniStat label="Token balance">{acct.unlimited ? 'Unlimited' : String(acct.token_balance ?? '—')}</MiniStat>
                  </Col>
                  <Col xs={12} md={6}>
                    <MiniStat label="Phone tokens">{Number(acct.phone_token_balance || 0).toLocaleString()}</MiniStat>
                  </Col>
                </Row>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.orange, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Enrich fair use</div>
                    <FairUseMeter label="Records · 5h window" used={enrichRec5h.used} limit={enrichRec5h.limit} resetsAt={enrichRec5h.resets} />
                    <FairUseMeter label="Records · 1w window" used={enrichRec1w.used} limit={enrichRec1w.limit} resetsAt={enrichRec1w.resets} color={BRAND.green} />
                    <FairUseMeter label="Requests · 5h window" used={enrichReq5h.used} limit={enrichReq5h.limit} resetsAt={enrichReq5h.resets} color={BRAND.yellow} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.orange, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Search fair use</div>
                    <FairUseMeter label="Records · 5h window" used={searchRec5h.used} limit={searchRec5h.limit} resetsAt={searchRec5h.resets} />
                    <FairUseMeter label="Records · 1w window" used={searchRec1w.used} limit={searchRec1w.limit} resetsAt={searchRec1w.resets} color={BRAND.green} />
                  </div>
                </div>

                <Descriptions
                  size="small" column={{ xs: 1, sm: 2 }} style={{ marginTop: 8 }}
                  items={[
                    { key: 'name', label: 'Account', children: String(acct.name || '—') },
                    { key: 'pe', label: 'Personal email tools', children: acct.personal_email_available ? <Tag color="success">Included on plan</Tag> : <Tag color="error">Not on plan</Tag> },
                    { key: 'keys', label: 'API keys', children: String(acct.api_key_count ?? '—') },
                    { key: 'users', label: 'Users', children: String(acct.user_count ?? '—') },
                    { key: 'created', label: 'Member since', children: acct.created_at ? new Date(String(acct.created_at)).toLocaleDateString() : '—' },
                    { key: 'tokbal', label: 'Token balance', children: acct.unlimited ? 'Unlimited (fair use)' : String(acct.token_balance ?? '—') },
                  ]}
                />
              </>
            )}
          </Card>

          <Card
            title={<Space><SafetyOutlined style={{ color: BRAND.orange }} />Billing Snapshot</Space>}
            style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 16 }}
          >
            {billing ? (
              <>
                <Descriptions
                  size="small" column={{ xs: 1, sm: 3 }}
                  items={[
                    { key: 'plan', label: 'Plan', children: planName(billing.plan) },
                    { key: 'sub', label: 'Subscription', children: <Tag color={billing.subscription_status === 'active' ? 'success' : 'warning'}>{billing.subscription_status || '—'}</Tag> },
                    {
                      key: 'period', label: 'Current period',
                      children: billing.current_period_start
                        ? `${new Date(billing.current_period_start).toLocaleDateString()} → ${billing.current_period_end ? new Date(billing.current_period_end).toLocaleDateString() : '—'}`
                        : '—',
                    },
                  ]}
                />
                {tokenCosts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Token cost per tool</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tokenCosts.map(([tool, cost]) => (
                        <Tag key={tool} style={{ borderColor: BRAND.border }}>
                          <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.orange }}>{tool}</span>
                          <span style={{ color: BRAND.textMuted }}> · {cost} token{cost === 1 ? '' : 's'}</span>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Text type="secondary">Billing appears once a key is validated (or demo mode is on).</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={<Space><RocketOutlined style={{ color: BRAND.orange }} />What each tier unlocks</Space>}
        style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginTop: 16 }}
      >
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={PLAN_TIERS}
          columns={[
            {
              title: 'Plan', dataIndex: 'name', width: 140,
              render: (v, r) => (
                <Space>
                  <span style={{ fontWeight: 700, color: BRAND.textPrimary }}>{v}</span>
                  {r.highlight && <Tag color="orange" icon={<CrownFilled />} style={{ fontSize: 10 }}>POPULAR</Tag>}
                </Space>
              ),
            },
            { title: 'Price', dataIndex: 'price', width: 110, render: (v) => <span style={{ fontFamily: "'Geist Mono', monospace", color: BRAND.orange }}>{v}</span> },
            { title: 'Enrich records / 5h', dataIndex: 'enrichRecords5h', render: (v) => v.toLocaleString() },
            { title: 'Search records / 5h', dataIndex: 'searchRecords5h', render: (v) => v.toLocaleString() },
            { title: 'Concurrent searches', dataIndex: 'concurrency', width: 160 },
            {
              title: 'Personal email tools', dataIndex: 'personalEmail', width: 170,
              render: (v) => v ? <Tag color="success">Included</Tag> : <Tag color="error">Not included</Tag>,
            },
          ]}
        />
        <Alert
          type="info" showIcon style={{ marginTop: 12 }}
          title={<span style={{ color: BRAND.textSecondary }}>All paid plans are unlimited-data under the Fair Use Policy. Phone tokens are an add-on: 180 tokens for $27/mo, $0.15 per carrier-verified mobile found — misses cost nothing.</span>}
        />
      </Card>
    </div>
  );
}
