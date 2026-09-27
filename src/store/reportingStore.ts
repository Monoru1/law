'use client';
import { create } from 'zustand';

export type ReportingStatus = 'not_sent' | 'sending' | 'sent' | 'failed';

type ReportingStore = {
  statuses: Map<string, ReportingStatus>;
  getStatus: (runId: string) => ReportingStatus;
  setSending: (runId: string) => void;
  setSent: (runId: string) => void;
  setFailed: (runId: string) => void;
};

export const useReportingStore = create<ReportingStore>((set, get) => ({
  statuses: new Map(),
  getStatus: (runId) => get().statuses.get(runId) ?? 'not_sent',
  setSending: (runId) =>
    set((s) => {
      const next = new Map(s.statuses);
      next.set(runId, 'sending');
      return { statuses: next };
    }),
  setSent: (runId) =>
    set((s) => {
      const next = new Map(s.statuses);
      next.set(runId, 'sent');
      return { statuses: next };
    }),
  setFailed: (runId) =>
    set((s) => {
      const next = new Map(s.statuses);
      next.set(runId, 'failed');
      return { statuses: next };
    }),
}));
