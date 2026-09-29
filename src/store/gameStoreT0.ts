'use client';
import { contentT0 } from '../content/t0';
import { replay } from '../engine';
import { t0LocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

export const t0Adapter = t0LocalStorageAdapter;
export const useT0GameStore = createGameStore(t0LocalStorageAdapter, contentT0);
export const selectT0Game = (save: SaveGame | null) =>
  replay(save?.events ?? [], contentT0);
