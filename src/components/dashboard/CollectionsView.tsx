'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Input, Popconfirm, Row, Segmented, Space, Table, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { BRAND } from '@/lib/theme';
import { downloadCsv } from '@/lib/client';
import { KpiCard, PageHeader, RiskBadge } from './ui';

const { Text } = Typography;

interface Item {
  id: string; itemType: string; fullName: string | null; title: string | null;
  company: string | null; domain: string | null; email: string | null;
  riskScore: string | null; phone: string | null; linkedinUrl: string | null;
  country: string | null; score: number | null; sourceTool: string; createdAt: string;
}

export default function CollectionsView() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [msgApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/collections');
      const json = await res.json();
      setItems(json.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((i) => {
    if (type !== 'all' && i.itemType !== type) return false;
    if (query) {
      const hay = `${i.fullName} ${i.title} ${i.company} ${i.domain} ${i.email} ${i.country}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [items, type, query]);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
    load();
    msgApi.success('Record removed');
  }, [load, msgApi]);

  const clearAll = useCallback(async () => {
    await fetch('/api/collections?id=all', { method: 'DELETE' });
    load();
    msgApi.success('Collection cleared');
  }, [load, msgApi]);

  const columns: ColumnsType<Item> = [
    {
      title: 'Name / Company', dataIndex: 'fullName', width: 220,
      render: (_, i) => (
        <div>
          <div style={{ color: BRAND.textPrimary, fontWeight: 600, fontSize: 13 }}>{i.fullName || '—'}</div>
          {i.linkedinUrl && (
            <a href={i.linkedinUrl.startsWith('http') ? i.linkedinUrl : `https://${i.linkedinUrl}`} target="_blank" rel="noreferrer" style={{ color: BRAND.orange, fontSize: 12 }}>
              in ↗
            </a>
          )}
        </div>
      ),
    },
    { title: 'Title / Industry', dataIndex: 'title', width: 180, ellipsis: true, render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{String(v || '—')}</Text> },
    {
      title: 'Company', dataIndex: 'company', width: 170, ellipsis: true,
      render: (_, i) => (
        <div>
          <div style={{ color: BRAND.textSecondary, fontSize: 13 }}>{i.company || '—'}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{String(i.domain || '')}</Text>
        </div>
      ),
    },
    {
      title: 'Email', dataIndex: 'email', width: 220, ellipsis: true,
      render: (_, i) => i.email ? (
        <Space size={6}>
          <Text copyable={{ text: i.email }} style={{ fontSize: 12 }}>{i.email}</Text>
          <RiskBadge grade={i.riskScore} />
        </Space>
      ) : <Text type="secondary">—</Text>,
    },
    { title: 'Phone', dataIndex: 'phone', width: 130, render: (v) => v ? <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12 }}>{String(v)}</span> : <Text type="secondary">—</Text> },
    { title: 'Country', dataIndex: 'country', width: 120, ellipsis: true, render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{String(v || '—')}</Text> },
    { title: 'Source', dataIndex: 'sourceTool', width: 150, render: (v) => <Tag style={{ fontSize: 10, borderColor: BRAND.border, fontFamily: "'Geist Mono', monospace" }}>{String(v).replace(/_/g, ' ')}</Tag> },
    { title: 'Added', dataIndex: 'createdAt', width: 100, render: (v) => <Text type="secondary" style={{ fontSize: 11 }}>{new Date(String(v)).toLocaleDateString()}</Text> },
    {
      title: '', width: 60,
      render: (_, i) => (
        <Popconfirm title="Remove record?" onConfirm={() => remove(i.id)} okButtonProps={{ danger: true, size: 'small' }}>
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const peopleCount = items.filter((i) => i.itemType === 'person').length;
  const companyCount = items.filter((i) => i.itemType === 'company').length;
  const withEmail = items.filter((i) => i.email).length;

  return (
    <div>
      {contextHolder}
      <PageHeader
        title="Collections"
        subtitle="Every record you saved from searches and enrichment runs — deduplicate, filter, and export to CSV for your CRM or outbound tooling."
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
            <Button
              type="primary" ghost icon={<CloudDownloadOutlined />}
              disabled={!filtered.length}
              onClick={() => { downloadCsv(`moltsets-collection-${Date.now()}.csv`, filtered as unknown as Record<string, unknown>[]); msgApi.success('CSV exported'); }}
            >
              Export CSV
            </Button>
            <Popconfirm title="Delete ALL collected records?" onConfirm={clearAll} okButtonProps={{ danger: true }}>
              <Button danger icon={<DeleteOutlined />} disabled={!items.length}>Clear all</Button>
            </Popconfirm>
          </Space>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} md={6}><KpiCard title="People" value={peopleCount} icon={<DatabaseOutlined />} color={BRAND.orange} /></Col>
        <Col xs={12} md={6}><KpiCard title="Companies" value={companyCount} icon={<DatabaseOutlined />} color={BRAND.green} /></Col>
        <Col xs={12} md={6}><KpiCard title="With email" value={withEmail} icon={<DatabaseOutlined />} color={BRAND.yellow} hint={items.length ? `${Math.round((withEmail / items.length) * 100)}% coverage` : ''} /></Col>
        <Col xs={12} md={6}><KpiCard title="Total records" value={items.length} icon={<DatabaseOutlined />} /></Col>
      </Row>

      <Card
        extra={
          <Space>
            <Segmented
              size="small" value={type}
              onChange={(v) => setType(v as string)}
              options={[{ label: 'All', value: 'all' }, { label: 'People', value: 'person' }, { label: 'Companies', value: 'company' }]}
            />
            <Input
              size="small" placeholder="Search records…" allowClear prefix={<SearchOutlined style={{ color: BRAND.textMuted }} />}
              value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }}
            />
          </Space>
        }
        style={{ borderColor: BRAND.border, background: BRAND.bgCard }}
        styles={{ body: { padding: '4px 8px 8px' } }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} records` }}
          locale={{
            emptyText: (
              <Empty style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: BRAND.textMuted }}>Nothing collected yet — save records from People Search, Company Search or the Enrichment Suite.</span>} />
            ),
          }}
        />
      </Card>
    </div>
  );
}
