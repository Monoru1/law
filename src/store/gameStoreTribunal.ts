'use client';
import { tribunalContent } from '../content/tribunal';
import { familyContent } from '../content/sixieme-place';
import { replay } from '../engine';
import { createLocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { SaveGame } from '../persistence/SaveAdapter';
import { createGameStore } from './createGameStore';

// The Tribunal opening is its own campaign: it never reads or replaces the
// rebirth prologue's or the historical timelines' storage keys.
export const TRIBUNAL_SAVE_KEY = 'thelaw:tribunal:save-t0';
export const tribunalAdapter = createLocalStorageAdapter(
  TRIBUNAL_SAVE_KEY,
  tribunalContent,
);
export const useTribunalGameStore = createGameStore(
  tribunalAdapter,
  tribunalContent,
);
export const selectTribunalGame = (save: SaveGame | null) =>
  replay(save?.events ?? [], tribunalContent);

// A completed opening remains immutable. The dossier continues in its own journal.
export const FAMILY_SAVE_KEY = 'thelaw:tribunal:family-save-t0';
export const useFamilyGameStore = createGameStore(
  createLocalStorageAdapter(FAMILY_SAVE_KEY, familyContent),
  familyContent,
);
