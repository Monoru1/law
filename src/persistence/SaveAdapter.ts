import type { GameEvent } from '../engine';
export type Settings = {
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
export type SaveGame = {
  schemaVersion: number;
  contentVersion: string;
  runId: string;
  createdAt: number;
  updatedAt: number;
  events: GameEvent[];
  settings: Settings;
};
export interface SaveAdapter {
  load(): Promise<SaveGame | null>;
  save(save: SaveGame): Promise<void>;
  clear(): Promise<void>;
}
