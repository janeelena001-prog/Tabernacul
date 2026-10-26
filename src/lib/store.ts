'use client';

import { create } from 'zustand';

export interface FairUseInfo {
  records_remaining_5h?: number;
  records_reset_5h?: string;
  records_remaining_1w?: number;
  records_reset_1w?: string;
  [k: string]: unknown;
}

export interface AccountInfo {
  id?: string;
  name?: string;
  status?: string;
  plan?: string;
  token_balance?: number;
  unlimited?: boolean;
  fair_use?: Record<string, unknown>;
  phone_token_balance?: number;
  phone_token_allowance?: number;
  personal_email_available?: boolean;
  api_key_count?: number;
  user_count?: number;
  created_at?: string;
  [k: string]: unknown;
}

interface DashState {
  view: string;
  setView: (v: string) => void;

  demoMode: boolean;
  setDemoMode: (v: boolean) => void;

  keyCount: number;
  hasActiveKey: boolean;
  setKeyStatus: (count: number, active: boolean) => void;

  account: AccountInfo | null;
  setAccount: (a: AccountInfo | null) => void;

  fairUse: FairUseInfo | null;
  setFairUse: (f: FairUseInfo | null) => void;

  // bump counter to tell Overview/Monitoring to refresh
  refreshTick: number;
  bumpRefresh: () => void;
}

export const useDash = create<DashState>((set) => ({
  view: 'overview',
  setView: (v) => set({ view: v }),

  demoMode: false,
  setDemoMode: (v) => set({ demoMode: v }),

  keyCount: 0,
  hasActiveKey: false,
  setKeyStatus: (count, active) => set({ keyCount: count, hasActiveKey: active }),

  account: null,
  setAccount: (a) => set({ account: a }),

  fairUse: null,
  setFairUse: (f) => set({ fairUse: f }),

  refreshTick: 0,
  bumpRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}));
