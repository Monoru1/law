import type { Scene } from '../../../../engine';
export const septAnnees: Scene = {
  id: 't1.sept-annees',
  version: 1,
  timelineId: 't1',
  title: 'Sept années',
  regression: 0,
  contentFlags: ['death', 'sacrifice'],
  beats: [
    { text: 'Dix inconnus mourront ce soir.' },
    { text: 'Tu peux les sauver.' },
    { text: 'Il t’en coûtera sept années de ta propre vie.' },
    { text: '—', pauseMs: 1200 },
    { text: 'Tu ne sauras pas lesquelles.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'hold',
    options: [
      {
        id: 'sauver',
        label: 'Les sauver',
        evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: 1 }],
      },
      {
        id: 'ne-pas-sauver',
        label: 'Ne pas les sauver',
        evidence: [{ principleId: 'P_SACRIFICE_SOI', weight: -1 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'sauver' },
      beats: [
        { text: 'Dix personnes rentreront chez elles ce soir.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Il te reste sept ans de moins que ce que tu crois.' },
      ],
      effects: [
        { incVar: 'lifeYearsGiven', by: 7 },
        {
          schedule: {
            sceneId: 't1.le-retour',
            when: { visited: 't1.chirurgien' },
          },
        },
      ],
    },
    {
      when: { optionId: 'ne-pas-sauver' },
      beats: [
        { text: 'Dix personnes sont mortes ce soir.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Tu as gardé tes sept années.' },
      ],
      effects: [
        {
          schedule: {
            sceneId: 't1.le-retour',
            when: { visited: 't1.chirurgien' },
          },
        },
      ],
    },
  ],
  followUps: ['certainty'],
};
