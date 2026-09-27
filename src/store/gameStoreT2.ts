'use client';
import { contentT2 } from '../content/t2';
import { replay } from '../engine';
import { createLocalStorageAdapter } from '../persistence/localStorageAdapter';
import { createGameStore } from './createGameStore';

export const t2Adapter = createLocalStorageAdapter('thelaw:save-t2');

export const useT2GameStore = createGameStore(t2Adapter, contentT2);

export const selectT2Game = (
  save: import('../persistence/SaveAdapter').SaveGame | null,
) => replay(save?.events ?? [], contentT2);
