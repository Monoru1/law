import { describe, expect, it } from 'vitest';
import { actFor, gainsForAct, ACT_AMBIENCE } from '../../src/audio/actAudio';

describe('act audio direction', () => {
  it('maps every declared ambience to its act, from near-silence to tension', () => {
    expect(ACT_AMBIENCE['act-1']).toBe(0);
    expect(ACT_AMBIENCE['act-5']).toBe(4);
    // Acte VI returns toward silence rather than continuing to climb.
    expect(ACT_AMBIENCE['act-6']).toBe(0);
  });

  it('keeps the current act when a scene declares none', () => {
    expect(actFor(undefined, 2)).toBe(2);
    expect(actFor('unknown-id', 2)).toBe(2);
    expect(actFor('act-3', 2)).toBe(2);
  });

  it('changes act only when the scene actually declares one', () => {
    expect(actFor('act-4', 1)).toBe(3);
  });

  it('brings in each layer gradually, never all three at once early on', () => {
    const act0 = gainsForAct(0);
    expect(act0.drone).toBe(0);
    expect(act0.pulse).toBe(0);
    expect(act0.texture).toBe(0);
    const act1 = gainsForAct(1);
    expect(act1.drone).toBeGreaterThan(0);
    expect(act1.pulse).toBe(0);
    expect(act1.texture).toBe(0);
    const act4 = gainsForAct(4);
    expect(act4.drone).toBeGreaterThan(0);
    expect(act4.pulse).toBeGreaterThan(0);
    expect(act4.texture).toBeGreaterThan(0);
  });

  it('stays within a quiet, non-clipping range at every act', () => {
    for (let act = 0; act <= 5; act++) {
      const gains = gainsForAct(act);
      for (const value of Object.values(gains)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(0.2);
      }
    }
  });

  it('clamps out-of-range acts instead of throwing', () => {
    expect(gainsForAct(-3)).toEqual(gainsForAct(0));
    expect(gainsForAct(99)).toEqual(gainsForAct(4));
  });
});
