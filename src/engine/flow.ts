import { evaluate } from './conditions';
import type { Content, GameState, Scene } from './types';
export type TimelineConfig = {
  /** Scene ID that handles confrontation resolution. Empty string = no confrontation mechanic. */
  confrontationSceneId: string;
  /** Scene shown after le-protocole equivalent when a law is signed but confrontation hasn't happened. */
  pasEncoreSceneId: string;
  /** Scene shown when evidence is high but no law was signed. */
  confrontationUnsignedSceneId: string;
  /** Scene that ends the timeline (visited = no further scenes). */
  codaSceneId: string;
};
export const t1Config: TimelineConfig = {
  confrontationSceneId: 't1.confrontation',
  pasEncoreSceneId: 't1.pas-encore',
  confrontationUnsignedSceneId: 't1.confrontation-non-signee',
  codaSceneId: 't1.coda',
};
export const t2Config: TimelineConfig = {
  confrontationSceneId: '',
  pasEncoreSceneId: '',
  confrontationUnsignedSceneId: '',
  codaSceneId: 't2.la-maison',
};
export function nextScene(
  state: GameState,
  content: Content,
  config: TimelineConfig = t1Config,
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
  // T1 specific: a fixed dramatic beat after le-protocole precedes deferred consequences.
  if (
    config.pasEncoreSceneId &&
    config.confrontationUnsignedSceneId &&
    state.visited.includes('t1.le-protocole')
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
