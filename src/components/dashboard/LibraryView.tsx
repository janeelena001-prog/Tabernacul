'use client';

import { useMemo, useState } from 'react';
import { Card, Col, Empty, Input, Row, Segmented, Space, Tag, Typography } from 'antd';
import { BookOutlined, ExperimentOutlined, GithubOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { LIBRARY_SKILLS, LIBRARY_CATEGORIES, LIBRARY_DIFFICULTIES } from '@/lib/plans';
import { BRAND } from '@/lib/theme';
import { PageHeader } from './ui';

const { Text, Paragraph } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  Enrichment: BRAND.green,
  Prospecting: BRAND.orange,
  'Ad Audience': BRAND.yellow,
  'IP Intelligence': '#C084FC',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: BRAND.green,
  Intermediate: BRAND.yellow,
  Advanced: BRAND.red,
};

export default function LibraryView() {
  const [category, setCategory] = useState<string>('All');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => LIBRARY_SKILLS.filter((s) => {
    if (category !== 'All' && s.category !== category) return false;
    if (difficulty !== 'All' && s.difficulty !== difficulty) return false;
    if (query && !`${s.title} ${s.description} ${s.outcome}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [category, difficulty, query]);

  return (
    <div>
      <PageHeader
        title="Skills Library"
        subtitle="Pre-built playbooks that wire the MoltSets API into Claude, ChatGPT, Sheets, HubSpot and more — organized by outcome and difficulty. A curated mirror of the 82-skill library at moltsets.com/library."
        extra={
          <Tag icon={<BookOutlined />} style={{ borderColor: BRAND.border, padding: '4px 10px' }}>
            <a href="https://moltsets.com/library" target="_blank" rel="noreferrer" style={{ color: BRAND.orange, fontWeight: 600 }}>Open full library ↗</a>
          </Tag>
        }
      />

      <Card style={{ borderColor: BRAND.border, background: BRAND.bgCard, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Segmented
              value={category}
              onChange={(v) => setCategory(v as string)}
              options={['All', ...LIBRARY_CATEGORIES]}
            />
            <Segmented
              value={difficulty}
              onChange={(v) => setDifficulty(v as string)}
              options={['All', ...LIBRARY_DIFFICULTIES]}
            />
            <Input
              placeholder="Search skills…"
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 240, marginLeft: 'auto' }}
              prefix={<ExperimentOutlined style={{ color: BRAND.textMuted }} />}
            />
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { icon: <ThunderboltOutlined style={{ color: BRAND.orange }} />, text: 'Get verified emails & carrier-verified mobile numbers' },
              { icon: <ExperimentOutlined style={{ color: BRAND.green }} />, text: 'Find new prospects and decision makers' },
              { icon: <BookOutlined style={{ color: BRAND.yellow }} />, text: 'Build ad audiences for Meta, Google & TikTok' },
              { icon: <GithubOutlined style={{ color: BRAND.textMuted }} />, text: 'Turn website visitors into pipeline contacts' },
            ].map((o, i) => (
              <Space key={i} size={6}>
                {o.icon}
                <Text type="secondary" style={{ fontSize: 12 }}>{o.text}</Text>
              </Space>
            ))}
          </div>
        </Space>
      </Card>

      {filtered.length === 0 ? (
        <Empty style={{ padding: 80 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: BRAND.textMuted }}>No skills match those filters.</span>} />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((s) => (
            <Col xs={24} sm={12} xl={8} key={s.title}>
              <Card
                hoverable
                style={{ borderColor: BRAND.border, background: BRAND.bgCard, height: '100%' }}
                styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', height: '100%' } }}
                onClick={() => window.open('https://moltsets.com/library', '_blank')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Tag color="transparent" style={{ color: CATEGORY_COLORS[s.category], border: `1px solid ${CATEGORY_COLORS[s.category]}44`, background: `${CATEGORY_COLORS[s.category]}14` }}>
                    {s.category}
                  </Tag>
                  <span style={{ fontSize: 11, color: DIFFICULTY_COLORS[s.difficulty], fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {s.difficulty}
                  </span>
                </div>
                <div style={{ color: BRAND.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
                <Paragraph style={{ color: BRAND.textMuted, fontSize: 12.5, flex: 1, marginBottom: 10 }}>
                  {s.description}
                </Paragraph>
                <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {s.platforms.map((p) => (
                    <Tag key={p} style={{ fontSize: 10, borderColor: BRAND.border, color: BRAND.textSecondary }}>{p}</Tag>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
