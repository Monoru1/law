import { IncompatibleSaveError, migrateSave } from './migrations';
import type { RecoveryCopy, SaveAdapter, SaveGame } from './SaveAdapter';
export const SAVE_KEY = 'thelaw:save';
export const MAX_RECOVERY_COPIES = 5;

export function createLocalStorageAdapter(saveKey: string): SaveAdapter & {
  replace(save: SaveGame): Promise<void>;
  restore(key: string): Promise<SaveGame>;
} {
  function listCopies(): RecoveryCopy[] {
    const copies: RecoveryCopy[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const match = key?.match(
        new RegExp(
          `^${saveKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(corrupt|replaced):(\\d+)$`,
        ),
      );
      if (key && match)
        copies.push({
          key,
          reason: match[1] as RecoveryCopy['reason'],
          createdAt: Number(match[2]),
        });
    }
    return copies.sort((a, b) => b.createdAt - a.createdAt);
  }
  function backup(raw: string, reason: RecoveryCopy['reason']): void {
    const copies = listCopies();
    if (!copies.some((copy) => localStorage.getItem(copy.key) === raw)) {
      const timestamp = Math.max(Date.now(), (copies[0]?.createdAt ?? 0) + 1);
      localStorage.setItem(`${saveKey}:${reason}:${timestamp}`, raw);
    }
    for (const copy of listCopies().slice(MAX_RECOVERY_COPIES))
      localStorage.removeItem(copy.key);
  }
  return {
    async load() {
      const raw = localStorage.getItem(saveKey);
      if (raw === null) return null;
      try {
        return migrateSave(JSON.parse(raw));
      } catch (error) {
        if (error instanceof IncompatibleSaveError) throw error;
        try {
          backup(raw, 'corrupt');
        } catch {
          /* keep original */
        }
        throw new CorruptSaveError();
      }
    },
    async save(save) {
      const valid = migrateSave(save);
      const raw = localStorage.getItem(saveKey);
      if (raw !== null) {
        const previous = migrateSave(JSON.parse(raw));
        if (
          previous.runId !== valid.runId ||
          previous.events.length > valid.events.length ||
          previous.events.some(
            (event, index) =>
              JSON.stringify(event) !== JSON.stringify(valid.events[index]),
          )
        )
          throw new SaveConflictError();
      }
      localStorage.setItem(saveKey, JSON.stringify(valid));
    },
    async replace(save) {
      const valid = migrateSave(save);
      const raw = localStorage.getItem(saveKey);
      if (raw !== null) backup(raw, 'replaced');
      localStorage.setItem(saveKey, JSON.stringify(valid));
    },
    async restore(key) {
      const copies = listCopies();
      if (!copies.some((copy) => copy.key === key))
        throw new Error('Copie de secours introuvable.');
      const save = migrateSave(JSON.parse(localStorage.getItem(key)!));
      const raw = localStorage.getItem(saveKey);
      if (raw !== null) backup(raw, 'replaced');
      localStorage.setItem(saveKey, JSON.stringify(save));
      return save;
    },
    async clear() {
      for (const copy of listCopies()) localStorage.removeItem(copy.key);
      localStorage.removeItem(saveKey);
    },
  };
}
// Keep these classes before the factory so they're available inside it.
export class CorruptSaveError extends Error {
  constructor() {
    super(
      'Sauvegarde illisible. Les données originales restent conservées sur cet appareil.',
    );
  }
}
export class SaveConflictError extends Error {
  constructor() {
    super(
      'Une partie existe déjà ou a changé. Recharge-la avant de continuer.',
    );
  }
}
export function listRecoveryCopies(): RecoveryCopy[] {
  const copies: RecoveryCopy[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const match = key?.match(/^thelaw:save:(corrupt|replaced):(\d+)$/);
    if (key && match)
      copies.push({
        key,
        reason: match[1] as RecoveryCopy['reason'],
        createdAt: Number(match[2]),
      });
  }
  return copies.sort((a, b) => b.createdAt - a.createdAt);
}
export function exportRecoveryCopy(key: string): string {
  if (!listRecoveryCopies().some((copy) => copy.key === key))
    throw new Error('Copie de secours introuvable.');
  return localStorage.getItem(key)!;
}
export function exportStoredSave(): string | null {
  return localStorage.getItem(SAVE_KEY);
}
export const localStorageAdapter = createLocalStorageAdapter(SAVE_KEY);
