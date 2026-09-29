import { expect, it } from 'vitest';
import { content } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import { getTimelineDoors, replay } from '../../src/engine';
import { event, played, saveFixture } from './fixtures';

const statuses = (
  t1: ReturnType<typeof replay>,
  t2: ReturnType<typeof replay>,
) =>
  getTimelineDoors({
    t1: { state: t1, content },
    t2: { state: t2, content: contentT2 },
  })
    .map((door) => door.status)
    // The examination door (t0) has its own test; these are the doors that
    // follow it.
    .slice(1);
const empty = replay([], content);
const finished = replay(
  saveFixture([
    ...played('t1.coda', 'sortir'),
    event({ type: 'run_completed', timelineId: 't1' }),
  ]).events,
  content,
);

it('opens the house only after the room, and never unlocks presentation doors', () => {
  expect(statuses(empty, empty)).toEqual([
    'available',
    'presentation',
    'presentation',
    'presentation',
  ]);
  expect(statuses(replay(saveFixture().events, content), empty)).toEqual([
    'in_progress',
    'presentation',
    'presentation',
    'presentation',
  ]);
  expect(statuses(finished, empty)).toEqual([
    'completed',
    'available',
    'presentation',
    'presentation',
  ]);
});

it('shows the examination door as a presentation until its content is provided', () => {
  const doors = getTimelineDoors({ t1: { state: empty, content } });
  expect(doors[0]).toMatchObject({ timelineId: 't0', status: 'presentation' });
});

it('keeps a started house resumable even if the room is erased later', () => {
  const house = replay(
    [event({ type: 'run_started', contentVersion: contentT2.version })],
    contentT2,
  );
  expect(statuses(empty, house)[1]).toBe('in_progress');
});
