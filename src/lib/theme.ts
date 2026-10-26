'use client';

import { theme } from 'antd';

// MoltSets design language — SIMPLE premium dark:
// flat surfaces, solid hairline borders, one ember accent.
export const BRAND = {
  orange: '#F4805D',
  orangeDeep: '#E86A3F',
  green: '#34D399',
  yellow: '#FBBF24',
  red: '#F87171',
  purple: '#C084FC',
  bgBase: '#0B0B0F',
  bgContainer: '#101014',
  bgElevated: '#16161C',
  bgCard: '#111116',
  bgHover: '#18181F',
  border: '#232329',
  borderStrong: '#2E2E36',
  textPrimary: '#F4F4F5',
  textSecondary: '#C4C4CC',
  textMuted: '#8B8B96',
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
    colorBorderSecondary: BRAND.border,
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
      siderBg: BRAND.bgContainer,
      headerBg: 'rgba(11,11,15,0.88)',
      bodyBg: BRAND.bgBase,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(244,128,93,0.14)',
      itemSelectedColor: BRAND.orange,
      itemHoverBg: BRAND.bgHover,
      itemMarginInline: 10,
      itemBorderRadius: 8,
      subMenuItemBg: 'transparent',
      groupTitleFontSize: 11,
    },
    Card: {
      colorBgContainer: BRAND.bgCard,
      colorBorderSecondary: BRAND.border,
    },
    Table: {
      headerBg: BRAND.bgCard,
      headerColor: BRAND.textMuted,
      rowHoverBg: BRAND.bgHover,
      borderColor: BRAND.border,
      cellPaddingBlock: 12,
    },
    Button: {
      primaryShadow: 'none',
      defaultBorderColor: BRAND.borderStrong,
      defaultBg: BRAND.bgContainer,
    },
    Statistic: {
      contentFontSize: 26,
    },
    Tag: {
      defaultBg: BRAND.bgHover,
    },
    Progress: {
      defaultColor: BRAND.orange,
    },
    Segmented: {
      itemSelectedBg: BRAND.bgHover,
      trackBg: BRAND.bgCard,
    },
    Input: {
      colorBgContainer: BRAND.bgBase,
    },
    Select: {
      colorBgContainer: BRAND.bgBase,
    },
    DatePicker: {
      colorBgContainer: BRAND.bgBase,
    },
  },
};
