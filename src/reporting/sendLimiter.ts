// Best-effort, per server instance: there is no datastore behind the report
// endpoint. It stops accidental repeats and floods, not a determined sender.
export type SendDecision = 'send' | 'duplicate' | 'limited';

export function createSendLimiter({
  windowMs = 10 * 60_000,
  maxPerWindow = 20,
  now = () => Date.now(),
}: { windowMs?: number; maxPerWindow?: number; now?: () => number } = {}) {
  const delivered = new Map<string, number>();
  let recent: number[] = [];
  const prune = () => {
    const limit = now() - windowMs;
    recent = recent.filter((at) => at > limit);
    for (const [key, at] of delivered) if (at <= limit) delivered.delete(key);
  };
  return {
    check(key: string): SendDecision {
      prune();
      if (delivered.has(key)) return 'duplicate';
      if (recent.length >= maxPerWindow) return 'limited';
      recent.push(now());
      return 'send';
    },
    // Only a delivered report blocks a retry of the same run.
    delivered(key: string) {
      delivered.set(key, now());
    },
  };
}
