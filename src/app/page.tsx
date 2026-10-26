'use client';

import { useEffect, useState } from 'react';
import { App, Badge, Button, ConfigProvider, Layout, Menu, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import {
  ApiOutlined, BankOutlined, BarChartOutlined, BookOutlined, DashboardOutlined,
  IdcardOutlined, KeyOutlined, LinkedinOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  TeamOutlined, ThunderboltOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import { darkTheme, BRAND } from '@/lib/theme';
import { useDash } from '@/lib/store';
import { fetchJson } from '@/lib/client';
import { KpiCard } from '@/components/dashboard/ui';
import OverviewView from '@/components/dashboard/OverviewView';
import SearchView from '@/components/dashboard/SearchView';
import EnrichmentView from '@/components/dashboard/EnrichmentView';
import LibraryView from '@/components/dashboard/LibraryView';
import CollectionsView from '@/components/dashboard/CollectionsView';
import MonitoringView from '@/components/dashboard/MonitoringView';
import SetupView from '@/components/dashboard/SetupView';
import { getTool } from '@/lib/moltsets';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const MENU_ITEMS = [
  {
    key: 'group-analytics',
    type: 'group' as const,
    label: 'ANALYTICS',
    children: [
      { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
      { key: 'monitoring', icon: <BarChartOutlined />, label: 'Monitoring' },
    ],
  },
  {
    key: 'group-data',
    type: 'group' as const,
    label: 'DATA TOOLS',
    children: [
      { key: 'people', icon: <TeamOutlined />, label: 'People Search' },
      { key: 'companies', icon: <BankOutlined />, label: 'Company Search' },
      { key: 'enrichment', icon: <IdcardOutlined />, label: 'Enrichment Suite' },
      { key: 'collections', icon: <ApiOutlined />, label: 'Collections' },
    ],
  },
  {
    key: 'group-resources',
    type: 'group' as const,
    label: 'RESOURCES',
    children: [
      { key: 'library', icon: <BookOutlined />, label: 'Skills Library' },
      { key: 'setup', icon: <KeyOutlined />, label: 'API Key Setup' },
    ],
  },
];

export default function HomePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { view, setView, demoMode, setDemoMode, account, accountMode, refreshTick, bumpRefresh } = useDash();

  // start collapsed on small screens
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.innerWidth < 992) setCollapsed(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Pull account summary once at boot (works in demo mode too)
  useEffect(() => {
    if (!mounted) return;
    fetchJson<{ ok?: boolean; mode?: string; data?: { results?: Record<string, unknown> } }>('/api/account')
      .then((r) => {
        if (r.data?.results) {
          useDash.getState().setAccount(r.data.results as never);
          useDash.getState().setAccountMode(r.mode === 'demo' ? 'demo' : 'live');
        } else {
          useDash.getState().setAccount(null);
          useDash.getState().setAccountMode(null);
        }
      })
      .catch(() => {});
  }, [mounted, refreshTick]);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ThunderboltOutlined style={{ fontSize: 42, color: BRAND.orange, animation: 'pulse 1.2s infinite' }} />
      </div>
    );
  }

  const connected = (account?.status === 'active') && accountMode === 'live';
  const showDemoData = accountMode === 'demo';
  const plan = String(account?.plan || '');

  const content = (() => {
    switch (view) {
      case 'people': return <SearchView tool={getTool('search_people')!} />;
      case 'companies': return <SearchView tool={getTool('search_companies')!} />;
      case 'enrichment': return <EnrichmentView />;
      case 'library': return <LibraryView />;
      case 'collections': return <CollectionsView />;
      case 'monitoring': return <MonitoringView />;
      case 'setup': return <SetupView />;
      default: return <OverviewView />;
    }
  })();

  return (
    <ConfigProvider theme={darkTheme} locale={{ Modal: { okText: 'OK' } } as never}>
      <App>
        <Layout style={{ minHeight: '100vh', background: BRAND.bgBase }}>
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            onBreakpoint={(broken) => setCollapsed(broken)}
            width={224}
            style={{
              borderRight: `1px solid ${BRAND.border}`,
              background: BRAND.bgContainer,
              position: 'sticky', top: 0, height: '100vh', overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '18px 14px' : '18px 18px',
                borderBottom: `1px solid ${BRAND.border}`, cursor: 'pointer',
              }}
              onClick={() => setView('overview')}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
                <rect width="32" height="32" rx="7" fill="rgba(244,128,93,0.12)" />
                <path d="M8 22V10l8 6 8-6v12" stroke={BRAND.orange} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!collapsed && (
                <div>
                  <div style={{ color: BRAND.textPrimary, fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', lineHeight: 1.1 }}>
                    MoltSets<span style={{ color: BRAND.orange }}>.CC</span>
                  </div>
                  <div style={{ color: BRAND.textMuted, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Control Center</div>
                </div>
              )}
            </div>

            <Menu
              mode="inline"
              selectedKeys={[view]}
              items={MENU_ITEMS}
              onClick={({ key }) => setView(key)}
              style={{ borderInlineEnd: 'none', paddingTop: 8 }}
            />

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTop: `1px solid ${BRAND.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                {!collapsed && <Text type="secondary" style={{ fontSize: 11 }}><ExperimentOutlined /> Demo mode</Text>}
                <Switch
                  size="small"
                  checked={demoMode}
                  onChange={(v) => { setDemoMode(v); bumpRefresh(); }}
                  checkedChildren="on"
                  unCheckedChildren="off"
                />
              </div>
              <Tooltip title={connected ? `Connected — ${plan || 'unknown plan'}` : 'No active API key — open API Key Setup'}>
                <Button
                  block
                  size="small"
                  type={connected ? 'default' : 'primary'}
                  ghost={!connected}
                  icon={<KeyOutlined />}
                  onClick={() => setView('setup')}
                >
                  {!collapsed && (connected ? <span style={{ fontSize: 11 }}>{plan.replace('subscription_', '$') || 'connected'}</span> : 'Add API key')}
                </Button>
              </Tooltip>
            </div>
          </Sider>

          <Layout style={{ background: BRAND.bgBase }}>
            <Header
              style={{
                position: 'sticky', top: 0, zIndex: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', borderBottom: `1px solid ${BRAND.border}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Space size={12}>
                <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
                <Text className="header-label" style={{ color: BRAND.textMuted, fontSize: 12 }}>
                  {view === 'overview' ? 'Command Overview' : view === 'people' ? 'People Search — search_people' :
                    view === 'companies' ? 'Company Search — search_companies' : view === 'enrichment' ? 'Enrichment Suite' :
                      view === 'collections' ? 'Collections' : view === 'monitoring' ? 'Monitoring & Analytics' :
                        view === 'library' ? 'Skills Library' : 'API Key Setup'}
                </Text>
              </Space>
              <Space size={10}>
                <Tag
                  icon={<LinkedinOutlined />} style={{ borderColor: BRAND.border, color: BRAND.textSecondary, display: 'inline-flex' }}
                >
                  <a href="https://developer.moltsets.com" target="_blank" rel="noreferrer" style={{ color: BRAND.textSecondary, marginLeft: 4, fontSize: 12 }}>API Docs</a>
                </Tag>
                <Tooltip title={demoMode ? 'Demo mode — synthetic data' : showDemoData ? 'Demo data — no valid key yet' : connected ? 'Live data from api.moltsets.com' : 'No active API key'}>
                  <Badge
                    status={demoMode || showDemoData ? 'warning' : connected ? 'success' : 'error'}
                    text={
                      <span style={{ fontSize: 12, color: BRAND.textSecondary }}>
                        {demoMode ? 'DEMO' : showDemoData ? 'DEMO DATA' : connected ? 'LIVE' : 'NO KEY'}
                      </span>
                    }
                  />
                </Tooltip>
              </Space>
            </Header>

            <Content className="dash-content" style={{ padding: 20, maxWidth: 1560, margin: '0 auto', width: '100%' }}>
              {content}
              <div style={{ textAlign: 'center', padding: '28px 0 10px', color: BRAND.textMuted, fontSize: 11 }}>
                MoltSets Control Center · premium dark dashboard for the MoltSets API · data courtesy of api.moltsets.com
              </div>
            </Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
