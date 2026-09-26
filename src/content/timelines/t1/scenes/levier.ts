import type { Scene } from '../../../../engine';
export const levier: Scene = {
  id: 't1.levier',
  version: 1,
  timelineId: 't1',
  title: 'Le levier',
  regression: 1,
  contentFlags: ['death', 'sacrifice'],
  beats: [
    { text: 'Un wagon lancé.' },
    { text: 'Cinq personnes sur la voie.' },
    { text: 'Un levier. Sur l’autre voie, une seule personne.' },
    { text: 'Elle ne t’a rien fait.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'hold',
    options: [
      {
        id: 'tirer',
        label: 'Tirer le levier',
        evidence: [
          { principleId: 'P_INNOCENT', weight: -1 },
          { principleId: 'P_NOMBRE', weight: 1 },
        ],
      },
      {
        id: 'rien',
        label: 'Ne rien faire',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 1 },
          { principleId: 'P_NOMBRE', weight: -1 },
        ],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'tirer' },
      beats: [
        { text: 'Cinq personnes vivent.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Une personne est morte parce que tu as tiré.' },
      ],
      effects: [
        {
          proposeLaw: {
            principleId: 'P_NOMBRE',
            statementId: 'nombre.default',
          },
        },
      ],
    },
    {
      when: { optionId: 'rien' },
      beats: [
        { text: 'Une personne vit.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Cinq personnes sont mortes pendant que tu regardais.' },
      ],
      effects: [
        {
          proposeLaw: {
            principleId: 'P_INNOCENT',
            statementId: 'innocent.default',
          },
        },
      ],
    },
  ],
  followUps: ['lawProposal'],
};
