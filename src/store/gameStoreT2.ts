'use client';
import { contentT2 } from '../content/t2';
import { replay } from '../engine';
import { t2LocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

export const t2Adapter = t2LocalStorageAdapter;
export const useT2GameStore = createGameStore(t2LocalStorageAdapter, contentT2);
export const selectT2Game = (save: SaveGame | null) =>
  replay(save?.events ?? [], contentT2);
