import type { Scene } from '../../../../engine';

// T3 — Acte VI, scène 3 : CE QUI RESTE
// Montre, ne raconte pas. Certaines conséquences restent personnelles,
// d'autres sont devenues institutionnelles.
export const ceQuiReste: Scene = {
  id: 't3.ce-qui-reste',
  version: 1,
  timelineId: 't3',
  title: 'Ce qui reste',
  regression: 1,
  contentFlags: [],
  variants: [
    {
      id: 'sem',
      when: { chose: { sceneId: 't1.dix-mille', optionId: 'accepter' } },
      beats: [
        {
          text: 'Farid est toujours là, à la machine à café, gobelet trop petit à la main.',
        },
        {
          text: 'L’Adjointe a affiché la liste au tableau du service, sans commentaire.',
        },
        {
          text: 'Sem n’est jamais revenu te voir. Tu ne sauras pas ce que le critère a décidé pour lui, au juste.',
        },
        { text: 'Certaines choses ont changé sans que tu aies rien signé.' },
      ],
    },
  ],
  beats: [
    {
      text: 'Farid est toujours là, à la machine à café, gobelet trop petit à la main.',
    },
    {
      text: 'L’Adjointe a affiché la liste au tableau du service, sans commentaire.',
    },
    { text: 'Certaines choses ont changé sans que tu aies rien signé.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-6' },
};
