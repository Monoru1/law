import type { Scene } from '../../../../engine';
export const coda: Scene = {
  id: 't1.coda',
  version: 1,
  timelineId: 't1',
  title: 'Choisis',
  regression: 3,
  contentFlags: ['death', 'sacrifice'],
  beats: [{ text: 'Choisis.' }],
  input: {
    kind: 'glyph',
    confirm: 'hold',
    options: [
      {
        id: 'un',
        label: 'Sauver une personne',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 0.5 },
          { principleId: 'P_NOMBRE', weight: -0.5 },
        ],
      },
      {
        id: 'cinq',
        label: 'Sauver cinq personnes',
        evidence: [
          { principleId: 'P_NOMBRE', weight: 0.5 },
          { principleId: 'P_INNOCENT', weight: -0.5 },
        ],
      },
    ],
  },
  outcomes: [{ when: { any: true }, beats: [] }],
};
