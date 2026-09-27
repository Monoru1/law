import { evaluate } from './conditions';
import type { Content, GameState, Scene, TimelineConfig } from './types';
export type { TimelineConfig } from './types';
export function nextScene(
  state: GameState,
  content: Content,
  config: TimelineConfig = content.flow,
): Scene | null {
  // Totality of transitions: the final gesture never reopens the room.
  if (
    state.completed ||
    (config.codaSceneId && state.visited.includes(config.codaSceneId))
  )
    return null;
  const available = (id: string) => {
    const scene = content.scenes.find((s) => s.id === id);
    return scene &&
      !state.visited.includes(id) &&
      (!scene.when || evaluate(scene.when, state))
      ? scene
      : null;
  };
  if (config.confrontationSceneId && state.pendingConfrontations.length)
    return (
      content.scenes.find((s) => s.id === config.confrontationSceneId) ?? null
    );
  // A fixed dramatic beat after the checkpoint precedes deferred consequences.
  if (
    config.pasEncoreSceneId &&
    config.confrontationUnsignedSceneId &&
    config.checkpointSceneId &&
    state.visited.includes(config.checkpointSceneId)
  ) {
    const law = state.laws.some((l) => l.status === 'signed');
    if (law) {
      const scene = available(config.pasEncoreSceneId);
      if (
        scene &&
        !state.visited.includes(config.confrontationSceneId) &&
        !state.visited.includes(config.confrontationUnsignedSceneId)
      )
        return scene;
    } else if (
      state.laws.length === 0 &&
      Object.values(state.evidence).some((value) => value >= 1.5)
    ) {
      const scene = available(config.confrontationUnsignedSceneId);
      if (scene) return scene;
    }
  }
  const scheduled = state.schedules
    .map((s) => ({ scene: available(s.sceneId), when: s.when }))
    .filter(
      (x): x is { scene: Scene; when: typeof x.when } =>
        !!x.scene && (!x.when || evaluate(x.when, state)),
    )
    .sort((a, b) => (b.scene.priority ?? 0) - (a.scene.priority ?? 0));
  if (scheduled[0]) return scheduled[0].scene;
  for (const id of content.order) {
    const scene = available(id);
    if (scene) return scene;
  }
  return null;
}
export function resolveScene(scene: Scene, state: GameState): Scene {
  const variant = scene.variants?.find((v) => evaluate(v.when, state));
  return variant
    ? {
        ...scene,
        beats: variant.beats ?? scene.beats,
        input: { ...scene.input, ...variant.input } as Scene['input'],
      }
    : scene;
}
/** Every option a scene can present, across its variants, by ID. */
export function sceneOptions(scene: Scene) {
  const options = new Map<string, { id: string; label: string }>();
  const inputs = [scene.input, ...(scene.variants ?? []).map((v) => v.input)];
  for (const input of inputs)
    if (input && 'options' in input && Array.isArray(input.options))
      for (const option of input.options)
        if (!options.has(option.id)) options.set(option.id, option);
  return options;
}
