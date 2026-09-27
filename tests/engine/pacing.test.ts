import { describe, expect, it } from 'vitest';
import { beatDelay, completionDelay } from '../../src/engine';

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
});
