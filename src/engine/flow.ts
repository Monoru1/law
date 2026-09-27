import { evaluate } from './conditions';
import type { Content, GameState, Scene } from './types';
export function nextScene(state: GameState, content: Content): Scene | null {
  // Totality of transitions: the final gesture never reopens the room.
  if (state.completed || state.visited.includes('t1.coda')) return null;
  const available = (id: string) => {
    const scene = content.scenes.find((s) => s.id === id);
    return scene &&
      !state.visited.includes(id) &&
      (!scene.when || evaluate(scene.when, state))
      ? scene
      : null;
  };
  if (state.pendingConfrontations.length)
    return content.scenes.find((s) => s.id === 't1.confrontation') ?? null;
  // A fixed dramatic beat immediately after the surgeon precedes deferred consequences.
  if (state.visited.includes('t1.le-protocole')) {
    const law = state.laws.some((l) => l.status === 'signed');
    if (law) {
      const scene = available('t1.pas-encore');
      if (
        scene &&
        !state.visited.includes('t1.confrontation') &&
        !state.visited.includes('t1.confrontation-non-signee')
      )
        return scene;
    } else if (
      state.laws.length === 0 &&
      Object.values(state.evidence).some((value) => value >= 1.5)
    ) {
      const scene = available('t1.confrontation-non-signee');
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
