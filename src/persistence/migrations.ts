import { content } from '../content';
import { initialState, reduce, validateEvent, type Content } from '../engine';
import { saveSchema } from '../engine/schema';
import type { SaveGame } from './SaveAdapter';
import legacyContent from './legacy-content-v1.json';

export const CURRENT_SCHEMA_VERSION = 2;

// Exact canonical identity, without probabilistic hashes or browser globals.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export const contentIdentity = (data: Content): string => canonical(data);

export class IncompatibleSaveError extends Error {
  constructor() {
    super(
      'Cette sauvegarde utilise une autre version. Elle reste conservée sur cet appareil.',
    );
  }
}

const legacySchema = saveSchema.omit({ contentIdentity: true });
const migrations: Record<number, (data: unknown) => unknown> = {
  1: (raw) => {
    const old = legacySchema.parse(raw);
    // Migration before refactor: never bless legacy data with today's content.
    if (old.contentVersion !== legacyContent.version)
      throw new IncompatibleSaveError();
    return {
      ...old,
      schemaVersion: 2,
      contentIdentity: canonical(legacyContent),
    };
  },
};

export function migrateSave(
  raw: unknown,
  currentContent: Content = content,
): SaveGame {
  let data = raw;
  let version =
    typeof data === 'object' && data !== null && 'schemaVersion' in data
      ? data.schemaVersion
      : undefined;
  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 1 ||
    version > CURRENT_SCHEMA_VERSION
  )
    throw new IncompatibleSaveError();
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new IncompatibleSaveError();
    data = migrate(data);
    version++;
  }
  const save = saveSchema.parse(data) as SaveGame;
  if (
    save.contentVersion !== currentContent.version ||
    save.contentIdentity !== contentIdentity(currentContent)
  )
    throw new IncompatibleSaveError();
  let state = initialState();
  for (const event of save.events) {
    validateEvent(event, state, currentContent);
    state = reduce(state, event, currentContent);
  }
  return save;
}
