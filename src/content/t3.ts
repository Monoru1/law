import type { Content } from '../engine';
import { observationRulesT2 } from './observations';
import { principlesT2 } from './principles';
import { scenes as t1Scenes } from './timelines/t1';
import { scenes as t2Scenes } from './timelines/t2';
import { scenes } from './timelines/t3';
import { timeline } from './timelines/t3/meta';

// La Ville — Actes I (Le Guichet) et II (La Règle) seulement. See
// PROGRESS.md for exactly what ships and what remains (Actes III-VI).
export const contentT3: Content = {
  timelineId: 't3',
  version: '3.0.0',
  scenes,
  // No new principle is proposed to the player in Actes I-II: the personal
  // law/confrontation mechanic is untouched here. Reused so an inherited
  // memory's laws (signed in T1 or T2) still resolve against known statements.
  principles: principlesT2,
  observations: observationRulesT2,
  order: [...timeline.order],
  flow: {
    confrontationSceneId: '',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    codaSceneId: 't3.la-fenetre',
  },
  // The city begins from what the house left behind, which already carries
  // what the room left behind — the chain composes without La Ville ever
  // reading Timeline I or II's content directly.
  inherits: {
    timelineId: 't2',
    sceneIds: [...t1Scenes, ...t2Scenes].map((scene) => scene.id),
    place: 'Dans la maison',
  },
};
