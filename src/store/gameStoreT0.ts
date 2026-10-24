'use client';
import { rebirthContent } from '../content/rebirth';
import { replay } from '../engine';
import { createLocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

// A new campaign never reads or replaces an old game's storage key.
export const REBIRTH_SAVE_KEY = 'thelaw:rebirth:save-t0';
export const t0Adapter = createLocalStorageAdapter(
  REBIRTH_SAVE_KEY,
  rebirthContent,
);
export const useT0GameStore = createGameStore(t0Adapter, rebirthContent);
export const selectT0Game = (save: SaveGame | null) =>
  replay(save?.events ?? [], rebirthContent);
