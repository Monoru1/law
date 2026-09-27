import type { Scene } from '../../../../engine/types';

// T2 — Scène 2 : LA FAVEUR
// Omar demande que le joueur témoigne en sa faveur — sans contexte.
export const laFaveur: Scene = {
  id: 't2.la-faveur',
  version: 1,
  timelineId: 't2',
  title: 'La faveur',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Omar te demande une faveur.' },
    { text: 'Témoigner. Dire que tu le connais, que tu lui fais confiance.' },
    {
      text: "Il n'explique pas pourquoi. Tu n'as pas besoin de savoir, dit-il.",
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'oui',
        label: 'Accepter',
        evidence: [{ principleId: 'P_PROCHE', weight: 1 }],
      },
      {
        id: 'non',
        label: 'Refuser sans explication',
        evidence: [{ principleId: 'P_INNOCENT', weight: 0.5 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'oui' },
      beats: [
        { text: 'Omar dit merci sans te regarder.' },
        { text: "C'est la façon dont il dit merci quand il est soulagé." },
      ],
      effects: [
        { relationEvent: { characterId: 'omar', kind: 'promise_made' } },
      ],
    },
    {
      when: { optionId: 'non' },
      beats: [
        { text: 'Omar hoche la tête.' },
        { text: 'Il ne demande pas de raison.' },
        { text: "C'est pire." },
      ],
    },
  ],
};
