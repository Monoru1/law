import type { Scene } from '../../../../engine/types';

// T2 — Scène 6 : L'EXCEPTION
// Sem demande au joueur de faire une exception à sa propre loi — pour lui.
export const lException: Scene = {
  id: 't2.l-exception',
  version: 1,
  timelineId: 't2',
  title: "L'exception",
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Sem vient te voir avec quelque chose de précis.' },
    { text: 'Il sait ce que tu as décidé dans La Pièce.' },
    { text: 'Il te demande de faire une exception.' },
    { text: "Pas pour quelqu'un d'abstrait. Pour lui.", style: 'emphasis' },
  ],
  variants: [
    {
      id: 'v-loi-signee',
      when: {
        any: [
          { law: { principleId: 'P_INNOCENT', status: 'signed' } },
          { law: { principleId: 'P_NOMBRE', status: 'signed' } },
          { law: { principleId: 'P_SACRIFICE_SOI', status: 'signed' } },
          { law: { principleId: 'P_ARGENT', status: 'signed' } },
        ],
      },
      beats: [
        { text: 'Sem vient te voir avec quelque chose de précis.' },
        { text: 'Il a lu ta loi.' },
        {
          text: "\u00ab\u00a0Je sais ce que tu as sign\u00e9. Mais c'est moi.\u00a0\u00bb",
          style: 'emphasis',
        },
        { text: 'Il attend.' },
      ],
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'exception',
        label: "Faire l'exception",
        evidence: [{ principleId: 'P_PROCHE', weight: 1 }],
      },
      {
        id: 'tenir',
        label: 'Tenir ta position',
        evidence: [{ principleId: 'P_INNOCENT', weight: 0.5 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'exception' },
      beats: [
        { text: "Tu fais l'exception." },
        { text: 'Sem ne dit pas merci.' },
        { text: "\u00ab\u00a0C'est normal.\u00a0\u00bb" },
        { text: "Tu ne sais pas si ça t'arrange ou pas.", style: 'whisper' },
      ],
      effects: [
        { setFlag: 't2.exception-sem' },
        { relationEvent: { characterId: 'sem', kind: 'chose_over' } },
      ],
    },
    {
      when: { optionId: 'tenir' },
      beats: [
        { text: 'Tu tiens.' },
        { text: 'Sem te regarde.' },
        { text: "\u00ab\u00a0D'accord.\u00a0\u00bb" },
        { text: 'Il part.', style: 'whisper' },
      ],
    },
  ],
  followUps: ['certainty'],
};
