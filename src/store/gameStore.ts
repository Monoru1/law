'use client';
import { content } from '../content';
import { replay } from '../engine';
import { localStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

export const useGameStore = createGameStore(localStorageAdapter, content);
export const selectGame = (save: SaveGame | null) =>
  replay(save?.events ?? [], content);
