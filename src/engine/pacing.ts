import type { Beat, GameEvent, InputSpec } from './types';

/**
 * decision: the beats lead to a control, available as soon as they are shown.
 * transition: the beats lead on by themselves after a reading hold.
 * rest: the beats are the consequence of a decision; they stay until the
 * player moves on, and only a short settle guards against a stray double click.
 */
export type BeatSequenceMode = 'decision' | 'transition' | 'rest';

/** Settle before the way on appears under a resting consequence. */
export const REST_SETTLE_MS = 600;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Delay before revealing the beat after this one. Pure so pacing stays testable. */
export function beatDelay(beat: Pick<Beat, 'text' | 'pauseMs'>): number {
  const readingDelay = clamp(420 + beat.text.length * 8, 420, 1150);
  return clamp(Math.max(readingDelay, beat.pauseMs ?? 0), 420, 3000);
}

/** A transition gets a short final reading hold; a decision becomes available now. */
export function completionDelay(
  beats: Pick<Beat, 'text'>[],
  mode: BeatSequenceMode,
): number {
  if (mode === 'decision') return 0;
  if (mode === 'rest') return REST_SETTLE_MS;
  const last = beats.at(-1);
  if (!last) return 120;
  return clamp(1200 + Math.max(0, last.text.length - 40) * 12, 1200, 2600);
}

/**
 * Hold before an automatic transition. When every beat appears at once
 * (reduced motion), the hold keeps the reading time the staggered reveal
 * would have given: reduced motion removes movement, not reading time.
 */
export function transitionHold(
  beats: Pick<Beat, 'text' | 'pauseMs'>[],
  mode: BeatSequenceMode,
  revealedAtOnce: boolean,
): number {
  const hold = completionDelay(beats, mode);
  // A resting consequence waits for the player: no reading time to protect.
  if (mode !== 'transition' || !revealedAtOnce || !beats.length) return hold;
  return (
    beats.slice(0, -1).reduce((total, beat) => total + beatDelay(beat), 180) +
    hold
  );
}

/**
 * Cadence after a committed decision. Narration flows; a decision rests: its
 * consequence stays on screen until the player chooses to move on. Only a
 * gesture that is itself a way out (a single option, such as leaving the room)
 * flows on, since asking for a second act would repeat the first.
 */
export type Cadence = 'flow' | 'rest';
export function outcomeCadence(input: InputSpec): Cadence {
  if (input.kind === 'passage') return 'flow';
  if ('options' in input && input.options.length <= 1) return 'flow';
  return 'rest';
}

/**
 * Where the current visit stands, read from the journal alone so that a reload
 * returns to the same place: before the decision, on its consequence, or on a
 * law that has just been signed or declined. Moving on writes nothing but the
 * next scene_entered, never a choice.
 */
export type VisitStage = 'deciding' | 'consequence' | 'sealed';
export function visitStage(events: GameEvent[], sceneId: string): VisitStage {
  const visit = events.slice(
    events.findLastIndex((event) => event.type === 'scene_entered') + 1,
  );
  const decided = visit.some(
    (event) => event.type === 'choice_locked' && event.sceneId === sceneId,
  );
  const sealed = visit.some(
    (event) => event.type === 'law_signed' || event.type === 'law_declined',
  );
  if (sealed) return 'sealed';
  return decided ? 'consequence' : 'deciding';
}
