import { migrateSave } from './migrations';
import type { SaveAdapter, SaveGame } from './SaveAdapter';
export const SAVE_KEY = 'thelaw:save';
export class CorruptSaveError extends Error { constructor() { super('Sauvegarde illisible. Une copie de secours a été conservée.'); } }
export const localStorageAdapter: SaveAdapter = {
  async load() { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; try { return migrateSave(JSON.parse(raw)); } catch { localStorage.setItem(`thelaw:save:corrupt:${Date.now()}`,raw); localStorage.removeItem(SAVE_KEY); throw new CorruptSaveError(); } },
  async save(save:SaveGame) { localStorage.setItem(SAVE_KEY,JSON.stringify(save)); },
  async clear() { localStorage.removeItem(SAVE_KEY); },
};
