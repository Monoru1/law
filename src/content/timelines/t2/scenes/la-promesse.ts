import type { Scene } from '../../../../engine/types';

// T2 — Scène 4 : LA PROMESSE
// Camille demande une promesse explicite. Pas une opinion — un engagement nommé.
export const laPromesse: Scene = {
  id: 't2.la-promesse',
  version: 1,
  timelineId: 't2',
  title: 'La promesse',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Camille veut que tu lui promettes quelque chose.' },
    { text: "Que si un jour elle te demande de l'aider, tu diras oui." },
    {
      text: '\u00ab\u00a0Je ne te demande pas de d\u00e9tails. Juste\u00a0: oui ou non.\u00a0\u00bb',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'promettre',
        label: 'Promettre',
        evidence: [{ principleId: 'P_PROCHE', weight: 1 }],
      },
      {
        id: 'refuser',
        label: "Refuser de promettre à l'aveugle",
        evidence: [{ principleId: 'P_INNOCENT', weight: 0.5 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'promettre' },
      beats: [
        {
          text: '\u00ab\u00a0Bien.\u00a0\u00bb Camille dit \u00e7a simplement.',
        },
        { text: 'Rien de plus.' },
        {
          text: "Tu as promis à quelqu'un que tu aideras sans savoir quoi.",
          style: 'whisper',
        },
      ],
      effects: [
        { setFlag: 't2.promesse-camille' },
        { relationEvent: { characterId: 'camille', kind: 'promise_made' } },
      ],
    },
    {
      when: { optionId: 'refuser' },
      beats: [
        { text: 'Camille hoche la tête.' },
        { text: '\u00ab\u00a0Je comprends.\u00a0\u00bb' },
        { text: "Ce n'est pas vrai.", style: 'whisper' },
      ],
    },
  ],
  followUps: ['certainty'],
};
