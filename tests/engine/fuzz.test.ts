import { describe, expect, it } from 'vitest';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import { replay, type Content, type GameEvent } from '../../src/engine';
import {
  IncompatibleSaveError,
  migrateSave,
} from '../../src/persistence/migrations';
import { defaultSettings } from '../../src/persistence/SaveAdapter';
import { seeded, simulateJourney } from '../../scripts/simulation';

const asSave = (timeline: Content, events: GameEvent[]) => ({
  schemaVersion: 4,
  timelineId: timeline.timelineId,
  contentVersion: timeline.version,
  runId: 'fuzz',
  createdAt: 1,
  updatedAt: 1,
  events,
  settings: defaultSettings,
});

type Mutation = (events: GameEvent[], rand: () => number) => GameEvent[];
const at = (events: GameEvent[], rand: () => number) =>
  1 + Math.floor(rand() * (events.length - 1));
// Each mutation produces a history the player flow cannot produce.
const impossible: Record<string, Mutation> = {
  duplicate: (events, rand) => {
    const i = at(events, rand);
    return [...events.slice(0, i + 1), events[i]!, ...events.slice(i + 1)];
  },
  'choice before its scene': (events) => {
    const i = events.findIndex((e) => e.type === 'choice_locked');
    const entry = events.findLastIndex(
      (e, j) => j < i && e.type === 'scene_entered',
    );
    return events.filter((_, j) => j !== entry);
  },
  'premature completion': (events) => {
    const completed = events.at(-1)!;
    const i = events.findIndex((e) => e.type === 'choice_locked');
    return [...events.slice(0, i + 1), completed];
  },
  'events after completion': (events) => [
    ...events,
    { ...events.find((e) => e.type === 'scene_entered')!, id: 'late' },
  ],
  'second start': (events) => [
    events[0]!,
    { ...events[0]!, id: 'again' },
    ...events.slice(1),
  ],
  'unknown scene version': (events) =>
    events.map((e) =>
      e.type === 'choice_locked' ? { ...e, sceneVersion: 77 } : e,
    ),
};

describe('replay fuzzing over generated journeys', () => {
  const rand = seeded(20260927);
  const clock = { at: 0 };
  const journeys = Array.from({ length: 120 }, () =>
    simulateJourney(content, contentT2, rand, clock),
  );

  it('accepts every generated journey and replays it identically', () => {
    for (const { room, house } of journeys) {
      expect(migrateSave(asSave(content, room.events), content).events).toEqual(
        room.events,
      );
      expect(
        migrateSave(asSave(contentT2, house.events), contentT2).events,
      ).toEqual(house.events);
      expect(replay(house.events, contentT2)).toEqual(house.state);
    }
  });

  it.each(Object.keys(impossible))('refuses %s', (name) => {
    for (const { room, house } of journeys.slice(0, 40))
      for (const [timeline, events] of [
        [content, room.events],
        [contentT2, house.events],
      ] as const)
        expect(() =>
          migrateSave(
            asSave(timeline, impossible[name]!(events, rand)),
            timeline,
          ),
        ).toThrow();
  });

  it('keeps an interrupted journey loadable at every prefix, without inventing its end', () => {
    for (const { room, house } of journeys.slice(0, 25))
      for (const [timeline, events] of [
        [content, room.events],
        [contentT2, house.events],
      ] as const)
        for (let length = 1; length < events.length; length++) {
          const prefix = events.slice(0, length);
          const save = migrateSave(asSave(timeline, prefix), timeline);
          expect(save.events).toEqual(prefix);
          expect(replay(prefix, timeline).completed).toBe(false);
        }
  });

  it('classifies a timeline mix-up as incompatible, never as silently valid', () => {
    const { room } = journeys[0]!;
    expect(() => migrateSave(asSave(content, room.events), contentT2)).toThrow(
      IncompatibleSaveError,
    );
  });
});
