import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import {
  buildMemory,
  replay,
  type Content,
  type GameEvent,
} from '../../src/engine';
import {
  CURRENT_SCHEMA_VERSION,
  migrateSave,
} from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';

let serial = 0;
type Draft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
const at = (draft: Draft) =>
  ({ ...draft, id: `e2e-${++serial}`, at: 1_000 + serial }) as GameEvent;
const version = (timeline: Content, sceneId: string) =>
  timeline.scenes.find((s) => s.id === sceneId)!.version;
export const enter = (sceneId: string, timeline: Content = content) =>
  at({
    type: 'scene_entered',
    sceneId,
    sceneVersion: version(timeline, sceneId),
  });
export const decide = (
  sceneId: string,
  value: string | number,
  timeline: Content = content,
) => {
  const scene = timeline.scenes.find((s) => s.id === sceneId)!;
  const variant = scene.variants?.find((v) =>
    v.input && 'options' in v.input
      ? v.input.options?.some((o) => o.id === value)
      : false,
  );
  return [
    enter(sceneId, timeline),
    at({
      type: 'choice_locked',
      sceneId,
      sceneVersion: scene.version,
      input: variant?.input?.kind ?? scene.input.kind,
      value,
      hesitationMs: 1200,
      selectionChanges: 0,
    }),
  ];
};

export const WORDS = 'Je ne dois rien à des inconnus.';

/** A finished room: took the money, kept the years, signed the innocent. */
export function roomEvents(): GameEvent[] {
  return [
    at({ type: 'run_started', contentVersion: content.version }),
    ...decide('t1.bouton', 'appuyer'),
    ...decide('t1.dix-mille', 'accepter'),
    ...decide('t1.sept-annees', 'ne-pas-sauver'),
    enter('t1.pourquoi'),
    at({ type: 'justification_given', sceneId: 't1.pourquoi', text: WORDS }),
    at({
      type: 'choice_locked',
      sceneId: 't1.pourquoi',
      sceneVersion: version(content, 't1.pourquoi'),
      input: 'freeText',
      value: 'written',
      hesitationMs: 5000,
      selectionChanges: 0,
    }),
    ...decide('t1.chambre-froide', 'dossier-a'),
    at({
      type: 'law_signed',
      lawNumber: 1,
      principleId: 'P_INNOCENT',
      statementId: 'innocent.default',
      statementText:
        'Une personne innocente ne doit pas être sacrifiée pour en sauver d’autres.',
    }),
    ...decide('t1.combien', 0),
    ...decide('t1.le-protocole', 'arreter'),
    enter('t1.pas-encore'),
    ...decide('t1.le-retour', 'non'),
    ...decide('t1.coda', 'sortir'),
    at({ type: 'run_completed', timelineId: 't1' }),
  ];
}

export function saveOf(
  timeline: Content,
  events: GameEvent[],
  extra: Record<string, unknown> = {},
) {
  const save = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    timelineId: timeline.timelineId,
    contentVersion: timeline.version,
    runId: `e2e-${timeline.timelineId}`,
    createdAt: 1,
    updatedAt: 2,
    events,
    settings: defaultSettings,
    pseudonym: 'Testeur',
    ...extra,
  };
  // A seed the game would refuse would only test the refusal.
  migrateSave(save, timeline);
  return save;
}

export function houseEvents(history: GameEvent[] = []): GameEvent[] {
  const room = roomEvents();
  return [
    at({ type: 'run_started', contentVersion: contentT2.version }),
    at({
      type: 'memory_inherited',
      fromTimelineId: 't1',
      fromRunId: 'e2e-t1',
      memory: buildMemory(replay(room, content), content, 'Dans la pièce'),
    }),
    ...history,
  ];
}

export { content, contentT2 };
