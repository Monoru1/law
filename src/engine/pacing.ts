import type { Beat } from './types';

export type BeatSequenceMode = 'decision' | 'transition';

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
  const last = beats.at(-1);
  if (!last) return 120;
  return clamp(1200 + Math.max(0, last.text.length - 40) * 12, 1200, 2600);
}
