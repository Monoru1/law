import type { CSSProperties } from 'react';
import type { GameEvent } from '../../engine';

type Decision = Extract<GameEvent, { type: 'choice_locked' }>;
type RoomStyle = CSSProperties & {
  '--memory-bias': string;
  '--memory-depth': string;
};
type TraceStyle = CSSProperties & {
  '--trace-x': string;
  '--trace-y': string;
  '--trace-length': string;
  '--trace-angle': string;
};

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

// The chamber is a factual projection of the run. Every locked decision alters
// the light axis and leaves a unique but neutral incision: memory, not score.
export function Room({
  decisions,
  regression,
}: {
  decisions: Decision[];
  regression: 0 | 1 | 2 | 3;
}) {
  const visible = decisions.slice(-14);
  const last = visible.at(-1);
  const lastHash = last ? hash(`${last.sceneId}:${String(last.value)}`) : 0;
  const roomStyle: RoomStyle = {
    '--memory-bias': `${last ? (lastHash % 17) - 8 : 0}%`,
    '--memory-depth': String(Math.min(visible.length, 12) / 12),
  };

  return (
    <>
      <div
        className="room"
        aria-hidden="true"
        data-memory={visible.length}
        data-regression={regression}
        style={roomStyle}
      >
        <div className="room-light" />
        <div className="room-ceiling" />
        <div className="room-wall room-wall-left" />
        <div className="room-wall room-wall-right" />
        <div className="room-threshold" />
        <div className="room-floor" />
        <div className="room-traces" data-count={visible.length}>
          {visible.map((decision, index) => {
            const seed = hash(
              `${decision.sceneId}:${decision.input}:${String(decision.value)}`,
            );
            const style: TraceStyle = {
              '--trace-x': `${9 + (seed % 81)}%`,
              '--trace-y': `${14 + ((seed >>> 7) % 68)}%`,
              '--trace-length': `${12 + ((seed >>> 13) % 23)}px`,
              '--trace-angle': `${((seed >>> 18) % 17) - 8}deg`,
            };
            return (
              <span
                key={decision.id}
                className="room-trace"
                data-latest={index === visible.length - 1 ? 'true' : undefined}
                style={style}
              />
            );
          })}
        </div>
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
