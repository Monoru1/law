import { describe, expect, it } from 'vitest';
import { beatDelay, completionDelay, transitionHold } from '../../src/engine';

describe('narrative pacing', () => {
  it('keeps ordinary beat progression brisk and bounded', () => {
    expect(beatDelay({ text: 'Court.' })).toBeGreaterThanOrEqual(420);
    expect(beatDelay({ text: 'x'.repeat(400) })).toBeLessThanOrEqual(1150);
  });

  it('honours an authored pause without creating an unbounded wait', () => {
    expect(beatDelay({ text: '—', pauseMs: 2400 })).toBe(2400);
    expect(beatDelay({ text: '—', pauseMs: 20_000 })).toBe(3000);
  });

  it('only adds a reading hold to automatically transitioning passages', () => {
    expect(completionDelay([], 'decision')).toBe(0);
    expect(completionDelay([{ text: 'Conséquence.' }], 'transition')).toBe(
      1200,
    );
    expect(
      completionDelay([{ text: 'x'.repeat(400) }], 'transition'),
    ).toBeLessThanOrEqual(2600);
  });

  it('keeps the reading time of a consequence when reduced motion shows it at once', () => {
    const beats = [
      { text: '10 000 € ont été versés.' },
      { text: '—', pauseMs: 1200 },
      { text: 'Un homme de cinquante-deux ans vide son bureau.' },
    ];
    const staggered =
      180 +
      beatDelay(beats[0]!) +
      beatDelay(beats[1]!) +
      completionDelay(beats, 'transition');
    expect(transitionHold(beats, 'transition', true)).toBe(staggered);
    expect(transitionHold(beats, 'transition', false)).toBe(
      completionDelay(beats, 'transition'),
    );
    // A decision never waits: the player reads at their own pace.
    expect(transitionHold(beats, 'decision', true)).toBe(0);
  });
});
