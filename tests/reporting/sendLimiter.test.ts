import { expect, it } from 'vitest';
import { createSendLimiter } from '../../src/reporting/sendLimiter';

it('blocks a repeat of a delivered run and floods, then recovers', () => {
  let now = 0;
  const limiter = createSendLimiter({
    windowMs: 1000,
    maxPerWindow: 2,
    now: () => now,
  });
  expect(limiter.check('t1:a')).toBe('send');
  // A failed delivery may be retried.
  expect(limiter.check('t1:a')).toBe('send');
  limiter.delivered('t1:a');
  expect(limiter.check('t1:a')).toBe('duplicate');
  expect(limiter.check('t1:b')).toBe('limited');
  now = 1500;
  expect(limiter.check('t1:b')).toBe('send');
  expect(limiter.check('t1:a')).toBe('send');
});
