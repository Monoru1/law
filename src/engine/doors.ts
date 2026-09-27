import type { Content, GameState } from './types';

// A timeline is playable only when content provides it; adding scenes alone
// never unlocks a door. Timeline II also needs a completed Timeline I.
export const TIMELINE_IDS = ['t1', 't2', 't3', 't4'] as const;
export type TimelineId = (typeof TIMELINE_IDS)[number];
export type DoorStatus =
  'available' | 'in_progress' | 'completed' | 'presentation';
export type DoorEntry =
  | { kind: 'start'; timelineId: TimelineId }
  | { kind: 'resume'; timelineId: TimelineId; sceneId: string | null }
  | { kind: 'summary'; timelineId: TimelineId }
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
export type TimelineRun = { state: RecordedRun; content: Content };
export type TimelineRuns = Partial<Record<TimelineId, TimelineRun>>;

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
        scene?.timelineId === content.timelineId
          ? { sceneId: scene.id, title: scene.title, eventId: event.id }
          : null;
      if (currentScene && !visited.has(event.sceneId)) {
        visited.set(event.sceneId, event.id);
      }
    } else if (
      event.type === 'run_completed' &&
      event.timelineId === content.timelineId
    ) {
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

const playable = (timelineId: TimelineId, run: TimelineRun | undefined) =>
  !!run &&
  run.content.timelineId === timelineId &&
  run.content.order.some((id) =>
    run.content.scenes.some(
      (scene) => scene.id === id && scene.timelineId === timelineId,
    ),
  );

/** Navigation intent only; this function never creates or replaces a saved run. */
export function resolveDoorEntry(
  timelineId: TimelineId,
  runs: TimelineRuns,
): DoorEntry {
  const run = runs[timelineId];
  if (!run || !playable(timelineId, run))
    return { kind: 'presentation', timelineId };
  const progress = getRunProgress(run.state, run.content);
  if (progress.completionEventId) return { kind: 'summary', timelineId };
  // Even an incomplete legacy journal must not be silently replaced.
  if (run.state.events.length) {
    return {
      kind: 'resume',
      timelineId,
      sceneId: progress.currentScene?.sceneId ?? null,
    };
  }
  // A timeline that inherits another opens once that one is complete.
  const inherited = run.content.inherits?.timelineId as TimelineId | undefined;
  if (inherited) {
    const source = runs[inherited];
    if (
      !source ||
      !getRunProgress(source.state, source.content).completionEventId
    )
      return { kind: 'presentation', timelineId };
  }
  return { kind: 'start', timelineId };
}

export type TimelineDoor = {
  timelineId: TimelineId;
  status: DoorStatus;
  entry: DoorEntry;
};

export function getTimelineDoors(runs: TimelineRuns): TimelineDoor[] {
  const statuses: Record<DoorEntry['kind'], DoorStatus> = {
    start: 'available',
    resume: 'in_progress',
    summary: 'completed',
    presentation: 'presentation',
  };
  return TIMELINE_IDS.map((timelineId) => {
    const entry = resolveDoorEntry(timelineId, runs);
    return { timelineId, status: statuses[entry.kind], entry };
  });
}
