import type { GameEvent } from '../../engine';
import { World } from '../world/World';

type Decision = Extract<GameEvent, { type: 'choice_locked' }>;
export function Room({
  timelineId,
  sceneId,
  phase,
  ambience,
  decisions,
  regression,
}: {
  timelineId: string;
  sceneId: string;
  phase: string;
  ambience?: string;
  decisions: Decision[];
  regression: 0 | 1 | 2 | 3;
}) {
  return (
    <World
      timelineId={timelineId}
      sceneId={sceneId}
      phase={phase}
      ambience={ambience}
      decisions={decisions}
      regression={regression}
    />
  );
}
