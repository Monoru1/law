import type { Content } from '../engine';
import { principles } from './principles';
import { principlesT0 } from './timelines/t0/principles';
import { scenes } from './timelines/t0';
import { timeline } from './timelines/t0/meta';

// L’Examen. The first timeline: it asks who the player claims to be, and
// listens. It inherits nothing; La Ville inherits it (see t3.ts).
export const contentT0: Content = {
  timelineId: 't0',
  version: '0.1.0',
  scenes,
  principles: [...principles, ...principlesT0],
  observations: [],
  order: [...timeline.order],
  flow: {
    confrontationSceneId: '',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    // The last scene of the order ends the examination.
    codaSceneId: timeline.order.at(-1)!,
  },
};
