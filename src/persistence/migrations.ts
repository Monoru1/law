import {
  canonical,
  contentContracts,
  contractKey,
  initialState,
  reduce,
  validateEvent,
  type Content,
  type GameEvent,
} from '../engine';
import { legacySaveSchema, saveSchema } from '../engine/schema';
import registry from '../content/contracts.json';
import type { SaveGame } from './SaveAdapter';
import legacyContent from './legacy-content-v1.json';

export const CURRENT_SCHEMA_VERSION = 5;

// Kept for reading schema 2–3 saves, which embedded this canonical form.
export const contentIdentity = (data: unknown): string => canonical(data);

export class IncompatibleSaveError extends Error {
  constructor() {
    super(
      'Cette sauvegarde utilise une autre version. Elle reste conservée sur cet appareil.',
    );
  }
}

type Contracts = Record<string, string>;
export const contractRegistry: Contracts = registry;

type SceneEvent = Extract<GameEvent, { sceneVersion: number }>;
const isSceneEvent = (event: GameEvent): event is SceneEvent =>
  event.type === 'scene_entered' || event.type === 'choice_locked';
const referencedKeys = (events: GameEvent[]) =>
  new Set(
    events
      .filter(isSceneEvent)
      .map((event) => contractKey(event.sceneId, event.sceneVersion)),
  );

// Scene upgraders translate events recorded against a superseded scene
// version. They may only drop what the new version no longer asks the player
// for; they never invent a decision.
const upgraders: Record<string, (events: GameEvent[]) => GameEvent[]> = {
  // The passive "Continuer" of t1.pas-encore became a passage: the visit stays,
  // the fabricated decision goes.
  't1.pas-encore@1': (events) =>
    events
      .filter(
        (event) =>
          !(
            event.type === 'choice_locked' &&
            event.sceneId === 't1.pas-encore' &&
            event.sceneVersion === 1
          ),
      )
      .map((event) =>
        event.type === 'scene_entered' &&
        event.sceneId === 't1.pas-encore' &&
        event.sceneVersion === 1
          ? { ...event, sceneVersion: 2 }
          : event,
      ),
};

function upgrade(events: GameEvent[], content: Content): GameEvent[] {
  let upgraded = events;
  for (let pass = 0; pass < 20; pass++) {
    const stale = [...referencedKeys(upgraded)].find((key) => {
      const [sceneId, version] = key.split('@');
      const scene = content.scenes.find((s) => s.id === sceneId);
      return scene && scene.version !== Number(version) && upgraders[key];
    });
    if (!stale) return upgraded;
    upgraded = upgraders[stale]!(upgraded);
  }
  throw new IncompatibleSaveError();
}

/**
 * A schema 2–3 save embedded the exact content that recorded it. It is
 * accepted when every scene it references was interpreted by the contract
 * registered for that scene version: text edits since then are harmless,
 * changed rules are not.
 */
function assertEmbeddedContracts(
  events: GameEvent[],
  identity: string,
  contracts: Contracts,
): void {
  let embedded: Contracts;
  try {
    embedded = contentContracts(JSON.parse(identity) as Content);
  } catch {
    throw new IncompatibleSaveError();
  }
  for (const key of referencedKeys(events))
    if (!contracts[key] || embedded[key] !== contracts[key])
      throw new IncompatibleSaveError();
}

const legacyV1Schema = legacySaveSchema.omit({ contentIdentity: true });
const migrations: Record<number, (data: unknown) => unknown> = {
  1: (raw) => {
    const old = legacyV1Schema.parse(raw);
    // Schema 1 predates embedded identities; its content is the frozen copy.
    if (old.contentVersion !== legacyContent.version)
      throw new IncompatibleSaveError();
    return {
      ...old,
      schemaVersion: 2,
      contentIdentity: canonical(legacyContent),
    };
  },
  2: (raw) => fromEmbeddedIdentity(raw),
  3: (raw) => fromEmbeddedIdentity(raw),
  // Schema 5 adds conversations, notes and Timeline 0. An older journal has
  // none of them: its events replay unchanged, only the label moves.
  4: (raw) => ({ ...(raw as object), schemaVersion: 5 }),
};
function fromEmbeddedIdentity(raw: unknown) {
  const old = legacySaveSchema.parse(raw);
  assertEmbeddedContracts(old.events, old.contentIdentity, contractRegistry);
  const { contentIdentity: _embedded, ...rest } = old;
  void _embedded;
  // Only Timeline I could be saved before schema 4.
  return { ...rest, schemaVersion: 4, timelineId: 't1' };
}

export function migrateSave(raw: unknown, content: Content): SaveGame {
  let data = raw;
  let version: unknown =
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
  while ((version as number) < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version as number];
    if (!migrate) throw new IncompatibleSaveError();
    data = migrate(data);
    version = (data as { schemaVersion: number }).schemaVersion;
  }
  const parsed = saveSchema.parse(data) as SaveGame;
  if (parsed.timelineId !== content.timelineId)
    throw new IncompatibleSaveError();
  const save: SaveGame = { ...parsed, events: upgrade(parsed.events, content) };
  // A scene that no longer exists at the recorded version is a content
  // evolution, not a corrupt file: keep the original and say so.
  for (const key of referencedKeys(save.events)) {
    const [sceneId, recorded] = key.split('@');
    const scene = content.scenes.find((s) => s.id === sceneId);
    if (!scene || scene.version !== Number(recorded) || !contractRegistry[key])
      throw new IncompatibleSaveError();
  }
  let state = initialState();
  for (const event of save.events) {
    validateEvent(event, state, content);
    state = reduce(state, event, content);
  }
  return save;
}
