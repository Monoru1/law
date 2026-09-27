import type { Content } from '../engine';
import { observationRulesT2 } from './observations';
import { principlesT2 } from './principles';
import { scenes as t1Scenes } from './timelines/t1';
import { scenes } from './timelines/t2';
import { timeline } from './timelines/t2/meta';

export const contentT2: Content = {
  timelineId: 't2',
  version: '2.0.0',
  scenes,
  principles: principlesT2,
  observations: observationRulesT2,
  order: [...timeline.order],
  flow: {
    confrontationSceneId: 't2.confrontation-proche',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    codaSceneId: 't2.la-maison',
  },
  // The house begins from what the room left behind.
  inherits: {
    timelineId: 't1',
    sceneIds: t1Scenes.map((scene) => scene.id),
    place: 'Dans la pièce',
  },
};
