import { content } from '../content';
import { contentT2 } from '../content/t2';
import { contentT3 } from '../content/t3';
import type { Content } from '../engine';
import { IncompatibleSaveError, migrateSave } from './migrations';
import type { RecoveryCopy, SaveAdapter, SaveGame } from './SaveAdapter';
export const SAVE_KEY = 'thelaw:save';
export const SAVE_KEY_T2 = 'thelaw:save-t2';
export const SAVE_KEY_T3 = 'thelaw:save-t3';
export const MAX_RECOVERY_COPIES = 5;

// Each timeline owns its journal and is always read with its own content.
export function createLocalStorageAdapter(
  saveKey: string,
  timeline: Content,
): SaveAdapter & {
  replace(save: SaveGame): Promise<void>;
  restore(key: string): Promise<SaveGame>;
} {
  const migrate = (raw: unknown) => migrateSave(raw, timeline);
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
        return migrate(JSON.parse(raw));
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
      const valid = migrate(save);
      const raw = localStorage.getItem(saveKey);
      if (raw !== null) {
        const previous = migrate(JSON.parse(raw));
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
      const valid = migrate(save);
      const raw = localStorage.getItem(saveKey);
      if (raw !== null) backup(raw, 'replaced');
      localStorage.setItem(saveKey, JSON.stringify(valid));
    },
    async restore(key) {
      const copies = listCopies();
      if (!copies.some((copy) => copy.key === key))
        throw new Error('Copie de secours introuvable.');
      const save = migrate(JSON.parse(localStorage.getItem(key)!));
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
export function listRecoveryCopies(saveKey = SAVE_KEY): RecoveryCopy[] {
  const copies: RecoveryCopy[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const match = key?.startsWith(`${saveKey}:`)
      ? key.slice(saveKey.length + 1).match(/^(corrupt|replaced):(\d+)$/)
      : null;
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
  if (
    ![SAVE_KEY, SAVE_KEY_T2, SAVE_KEY_T3].some((saveKey) =>
      listRecoveryCopies(saveKey).some((copy) => copy.key === key),
    )
  )
    throw new Error('Copie de secours introuvable.');
  return localStorage.getItem(key)!;
}
export function exportStoredSave(saveKey = SAVE_KEY): string | null {
  return localStorage.getItem(saveKey);
}
export const localStorageAdapter = createLocalStorageAdapter(SAVE_KEY, content);
export const t2LocalStorageAdapter = createLocalStorageAdapter(
  SAVE_KEY_T2,
  contentT2,
);
export const t3LocalStorageAdapter = createLocalStorageAdapter(
  SAVE_KEY_T3,
  contentT3,
);
