'use client';
import { contentT3 } from '../content/t3';
import { replay } from '../engine';
import { t3LocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

export const t3Adapter = t3LocalStorageAdapter;
export const useT3GameStore = createGameStore(t3LocalStorageAdapter, contentT3);
export const selectT3Game = (save: SaveGame | null) =>
  replay(save?.events ?? [], contentT3);
