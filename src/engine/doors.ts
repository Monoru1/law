import type { Content, GameState } from './types';

// Only t1 has an executable flow. Adding content alone must not unlock a door.
export const TIMELINE_IDS = ['t1', 't2', 't3', 't4'] as const;
export type TimelineId = (typeof TIMELINE_IDS)[number];
export type DoorStatus =
  'available' | 'in_progress' | 'completed' | 'presentation';
export type DoorEntry =
  | { kind: 'start'; timelineId: 't1' }
  | { kind: 'resume'; timelineId: 't1'; sceneId: string | null }
  | { kind: 'summary'; timelineId: 't1' }
  | { kind: 'presentation'; timelineId: TimelineId };

export type RunProgress = {
  currentScene: { sceneId: string; title: string; eventId: string } | null;
  visitedScenes: { sceneId: string; eventId: string }[];
  visitedSceneCount: number;
  // Branches, deferred returns and repeated confrontations prevent a fixed total.
  totalScenes: null;
  completionEventId: string | null;
};

type RecordedRun = Pick<GameState, 'events'>;

/** Derived display data only: every visit and completion carries its source event. */
export function getRunProgress(
  state: RecordedRun,
  content: Content,
): RunProgress {
  const scenes = new Map(content.scenes.map((scene) => [scene.id, scene]));
  const visited = new Map<string, string>();
  let currentScene: RunProgress['currentScene'] = null;
  let completionEventId: string | null = null;
  for (const event of state.events) {
    if (event.type === 'run_started') {
      visited.clear();
      currentScene = null;
      completionEventId = null;
    } else if (event.type === 'scene_entered' && !completionEventId) {
      const scene = scenes.get(event.sceneId);
      // Unknown historical content cannot supply an invented title or visit.
      currentScene =
        scene?.timelineId === 't1'
          ? { sceneId: scene.id, title: scene.title, eventId: event.id }
          : null;
      if (currentScene && !visited.has(event.sceneId)) {
        visited.set(event.sceneId, event.id);
      }
    } else if (event.type === 'run_completed' && event.timelineId === 't1') {
      completionEventId = event.id;
      currentScene = null;
    }
  }
  return {
    currentScene,
    visitedScenes: [...visited].map(([sceneId, eventId]) => ({
      sceneId,
      eventId,
    })),
    visitedSceneCount: visited.size,
    totalScenes: null,
    completionEventId,
  };
}

/** Navigation intent only; this function never creates or replaces a saved run. */
export function resolveDoorEntry(
  timelineId: TimelineId,
  state: RecordedRun,
  content: Content,
): DoorEntry {
  if (
    timelineId !== 't1' ||
    !content.order.some((id) =>
      content.scenes.some(
        (scene) => scene.id === id && scene.timelineId === 't1',
      ),
    )
  ) {
    return { kind: 'presentation', timelineId };
  }
  const progress = getRunProgress(state, content);
  if (progress.completionEventId) return { kind: 'summary', timelineId };
  // Even an incomplete legacy journal must not be silently replaced.
  if (state.events.length) {
    return {
      kind: 'resume',
      timelineId,
      sceneId: progress.currentScene?.sceneId ?? null,
    };
  }
  return { kind: 'start', timelineId };
}

export type TimelineDoor = {
  timelineId: TimelineId;
  status: DoorStatus;
  entry: DoorEntry;
};

export function getTimelineDoors(
  state: RecordedRun,
  content: Content,
): TimelineDoor[] {
  const statuses: Record<DoorEntry['kind'], DoorStatus> = {
    start: 'available',
    resume: 'in_progress',
    summary: 'completed',
    presentation: 'presentation',
  };
  return TIMELINE_IDS.map((timelineId) => {
    const entry = resolveDoorEntry(timelineId, state, content);
    return { timelineId, status: statuses[entry.kind], entry };
  });
}
