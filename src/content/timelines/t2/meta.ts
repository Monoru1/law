import type { TimelineConfig } from '../../../engine/flow';

export const timeline = {
  id: 't2',
  title: 'La Maison',
  order: [
    't2.les-nouvelles',
    't2.la-faveur',
    't2.mila-confie',
    't2.la-promesse',
    't2.omar-histoire',
    't2.l-exception',
    't2.ce-qu-on-protege',
    't2.sem',
    't2.le-mensonge',
    't2.la-maison',
  ],
} as const;

export const t2FlowConfig: TimelineConfig = {
  confrontationSceneId: '',
  pasEncoreSceneId: '',
  confrontationUnsignedSceneId: '',
  codaSceneId: 't2.la-maison',
};
