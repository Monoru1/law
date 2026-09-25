import { saveSchema } from '../engine/schema';
import type { SaveGame } from './SaveAdapter';
export const CURRENT_SCHEMA_VERSION = 1;
const migrations: Record<number,(data:unknown)=>unknown> = {};
export function migrateSave(raw: unknown): SaveGame {
  let data = raw;
  let version = typeof data === 'object' && data !== null && 'schemaVersion' in data ? Number(data.schemaVersion) : 0;
  if (version > CURRENT_SCHEMA_VERSION) throw new Error('Save version is newer than this app');
  while (version < CURRENT_SCHEMA_VERSION) { const migrate = migrations[version]; if (!migrate) throw new Error(`Missing save migration ${version}`); data = migrate(data); version++; }
  return saveSchema.parse(data) as SaveGame;
}
