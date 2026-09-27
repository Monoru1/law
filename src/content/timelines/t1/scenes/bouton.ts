import type { Scene } from '../../../../engine';
export const bouton: Scene = {
  id: 't1.bouton',
  version: 1,
  timelineId: 't1',
  title: 'Le bouton',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Une pièce.' },
    { text: 'Un bouton.' },
    { text: 'Si tu appuies, il ne se passera rien.' },
    { text: '—', pauseMs: 1200 },
    { text: 'Probablement.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'appuyer', label: 'Appuyer' },
      { id: 'ne-pas-appuyer', label: 'Ne pas appuyer' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'appuyer' },
      beats: [
        { text: 'Il ne s’est rien passé.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Cette fois.' },
      ],
      effects: [{ setFlag: 'pressed_button' }],
      fact: 'Tu as appuyé sur le bouton.',
    },
    {
      when: { optionId: 'ne-pas-appuyer' },
      beats: [{ text: 'Tu ne sauras jamais.' }],
      fact: 'Tu n’as pas appuyé sur le bouton.',
    },
  ],
};
