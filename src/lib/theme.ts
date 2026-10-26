'use client';

import { theme } from 'antd';

// MoltSets brand language: near-black base, ember orange accent,
// mono numerals, dashed borders.
export const BRAND = {
  orange: '#F4805D',
  orangeDeep: '#F97316',
  green: '#34D399',
  yellow: '#FDE047',
  red: '#F87171',
  bgBase: '#0A0B0E',
  bgContainer: '#0F1116',
  bgElevated: '#14161C',
  bgCard: '#101218',
  border: '#23252D',
  borderDashed: 'rgba(244,128,93,0.35)',
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
};

export const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: BRAND.orange,
    colorInfo: BRAND.orange,
    colorSuccess: BRAND.green,
    colorWarning: BRAND.yellow,
    colorError: BRAND.red,
    colorBgBase: BRAND.bgBase,
    colorBgContainer: BRAND.bgContainer,
    colorBgElevated: BRAND.bgElevated,
    colorBgLayout: BRAND.bgBase,
    colorBorder: BRAND.border,
    colorBorderSecondary: '#1A1C22',
    colorText: BRAND.textPrimary,
    colorTextSecondary: BRAND.textSecondary,
    colorTextTertiary: BRAND.textMuted,
    borderRadius: 8,
    fontFamily:
      "'Geist', -apple-system, 'Segoe UI', 'Inter', system-ui, sans-serif",
    fontSize: 14,
    controlHeight: 36,
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: '#0C0D12',
      headerBg: 'rgba(10,11,14,0.85)',
      bodyBg: BRAND.bgBase,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(244,128,93,0.12)',
      itemSelectedColor: BRAND.orange,
      itemHoverBg: 'rgba(244,128,93,0.06)',
      itemMarginInline: 10,
      itemBorderRadius: 6,
      subMenuItemBg: 'transparent',
      groupTitleFontSize: 11,
    },
    Card: {
      colorBgContainer: BRAND.bgCard,
      colorBorderSecondary: BRAND.border,
    },
    Table: {
      headerBg: '#14161C',
      headerColor: BRAND.orange,
      rowHoverBg: 'rgba(244,128,93,0.05)',
      borderColor: BRAND.border,
      cellPaddingBlock: 12,
    },
    Button: {
      primaryShadow: '0 0 18px rgba(244,128,93,0.35)',
      defaultBorderColor: '#2A2D36',
    },
    Statistic: {
      contentFontSize: 26,
    },
    Tag: {
      defaultBg: 'rgba(244,128,93,0.08)',
    },
    Progress: {
      defaultColor: BRAND.orange,
    },
  },
};
