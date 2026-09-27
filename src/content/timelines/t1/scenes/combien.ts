import type { Scene } from '../../../../engine';
export const combien: Scene = {
  id: 't1.combien',
  version: 1,
  timelineId: 't1',
  title: 'Combien',
  regression: 1,
  contentFlags: ['death', 'sacrifice'],
  beats: [
    { text: 'Un enfant que tu ne connais pas va mourir.' },
    { text: 'Tu peux lui donner des années de ta vie. Autant que tu veux.' },
    { text: 'Aucune ne sera perdue. Elles seront toutes à lui.' },
    { text: 'Combien ?' },
  ],
  input: {
    kind: 'slider',
    min: 0,
    max: 40,
    step: 1,
    unit: 'ans',
    labelTemplate: 'Donner {{n}} ans',
    zeroLabel: 'Ne rien donner',
    confirm: 'hold',
  },
  outcomes: [
    {
      when: { range: [0, 0] },
      beats: [{ text: 'Il n’a rien reçu.' }],
      fact: 'Tu n’as rien donné à l’enfant.',
    },
    {
      when: { range: [1, 40] },
      beats: [
        { text: 'Il vivra {{value:t1.combien|0}} ans de plus.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Toi, {{value:t1.combien|0}} de moins.' },
      ],
      effects: [
        { incVar: 'lifeYearsGiven', by: { fromValueOf: 't1.combien' } },
      ],
      fact: 'Tu as donné {{value:t1.combien|0}} ans de ta vie à un enfant.',
    },
  ],
};
