import type { GameEvent } from '../engine';
export type Settings = {
  // Deprecated: the hold-to-confirm interaction was removed in favour of a
  // single deliberate click. Retained in the schema so existing saves keep
  // migrating cleanly; no longer read by the UI.
  simpleConfirmation: boolean;
  reducedMotion: 'auto' | 'on' | 'off';
  textSize: 'small' | 'normal' | 'large';
  sound: boolean;
};
export const defaultSettings: Settings = {
  simpleConfirmation: false,
  reducedMotion: 'auto',
  textSize: 'normal',
  sound: false,
};
export type ReportingStatus = 'not_sent' | 'sending' | 'sent' | 'failed';
export type SaveGame = {
  schemaVersion: number;
  timelineId: 't1' | 't2' | 't3' | 't4';
  // Content release that started the run; informational only.
  contentVersion: string;
  runId: string;
  createdAt: number;
  updatedAt: number;
  events: GameEvent[];
  settings: Settings;
  pseudonym?: string;
  reportingConsent?: boolean;
  reportingStatus?: ReportingStatus;
};
export interface SaveAdapter {
  load(): Promise<SaveGame | null>;
  save(save: SaveGame): Promise<void>;
  clear(): Promise<void>;
}
export type RecoveryCopy = {
  key: string;
  createdAt: number;
  reason: 'corrupt' | 'replaced';
};
