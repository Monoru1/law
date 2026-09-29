// Pure mapping from a scene's declared ambience to an act intensity, and from
// that intensity to each procedural layer's target gain. No Web Audio here —
// this module is what makes the direction testable without a browser.

// La Ville's six acts, from "presque rien" to a return toward silence. A
// scene that declares no ambience keeps whatever act was last in force.
export const ACT_AMBIENCE: Record<string, number> = {
  'act-1': 0,
  'act-2': 1,
  'act-3': 2,
  'act-4': 3,
  'act-5': 4,
  'act-6': 0,
};

export function actFor(
  ambience: string | undefined,
  currentAct: number,
): number {
  if (!ambience) return currentAct;
  return ambience in ACT_AMBIENCE ? ACT_AMBIENCE[ambience]! : currentAct;
}

export type LayerGains = { drone: number; pulse: number; texture: number };
export type Soundscape = { act: number; gains: LayerGains };

// Each layer enters gradually and never all at once: the drone carries the
// whole piece, the pulse arrives at the rule, the texture only once the
// system is visibly running on its own.
const TABLE: LayerGains[] = [
  { drone: 0, pulse: 0, texture: 0 }, // 0 — presque rien
  { drone: 0.05, pulse: 0, texture: 0 }, // 1 — drone très léger
  { drone: 0.07, pulse: 0.04, texture: 0 }, // 2 — pulsation lente
  { drone: 0.08, pulse: 0.06, texture: 0.05 }, // 3 — texture basse
  { drone: 0.09, pulse: 0.09, texture: 0.08 }, // 4 — tension la plus présente
];

export function gainsForAct(act: number): LayerGains {
  return TABLE[Math.min(Math.max(act, 0), TABLE.length - 1)]!;
}

const SCENE_GAINS: Partial<Record<string, LayerGains>> = {
  // Human pauses leave more air than the act around them.
  't3.le-cafe': { drone: 0.034, pulse: 0.008, texture: 0.006 },
  't3.nadia': { drone: 0.038, pulse: 0.012, texture: 0.014 },
  // The false calm must actually sound calm, not merely less tense.
  't3.fausse-accalmie': { drone: 0.016, pulse: 0, texture: 0.003 },
  // An occupied system turned empty: room tone and distant material only.
  't3.la-greve': { drone: 0.025, pulse: 0, texture: 0.042 },
  // Signing and registration carry no musical verdict.
  't3.la-liste': { drone: 0.012, pulse: 0, texture: 0 },
  't3.le-registre': { drone: 0.018, pulse: 0, texture: 0.008 },
  // At 417 the filtered city texture enters, still below the reading voice.
  't3.quatre-cent-dix-sept': { drone: 0.045, pulse: 0.008, texture: 0.09 },
  't3.sortie': { drone: 0.012, pulse: 0, texture: 0.022 },
};

export function soundscapeFor(
  sceneId: string,
  ambience: string | undefined,
  currentAct: number,
): Soundscape {
  const act = actFor(ambience, currentAct);
  return { act, gains: SCENE_GAINS[sceneId] ?? gainsForAct(act) };
}
