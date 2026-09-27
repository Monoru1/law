import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : CONFRONTATION PROCHE
// Déclenchée si exception faite pour Sem ET une loi signée.
export const confrontationProche: Scene = {
  id: 't2.confrontation-proche',
  version: 1,
  timelineId: 't2',
  title: 'Confrontation',
  regression: 2,
  contentFlags: [],
  when: {
    all: [
      { flag: 't2.exception-sem' },
      {
        any: [
          { law: { principleId: 'P_INNOCENT', status: 'signed' } },
          { law: { principleId: 'P_NOMBRE', status: 'signed' } },
          { law: { principleId: 'P_SACRIFICE_SOI', status: 'signed' } },
          { law: { principleId: 'P_ARGENT', status: 'signed' } },
        ],
      },
    ],
  },
  beats: [
    { text: 'Ta loi dit une chose.' },
    { text: 'Ce que tu as fait pour Sem en dit une autre.' },
    { text: 'Tu le sais.' },
    {
      text: "La question n'est pas\u00a0: avais-tu tort\u00a0?",
      style: 'emphasis',
    },
    {
      text: "La question est\u00a0: qu'est-ce que \u00e7a dit de toi\u00a0?",
      style: 'emphasis',
    },
  ],
  input: {
    kind: 'freeText',
    prompt: 'Ta r\u00e9ponse',
    placeholder: "Qu'est-ce que \u00e7a dit de toi\u00a0?",
    maxLength: 300,
    skippable: true,
  },
  outcomes: [
    {
      when: { any: true },
      beats: [
        {
          text: "Il n'y a pas de bonne r\u00e9ponse.",
          style: 'whisper',
        },
        { text: 'Il y a la tienne.', style: 'emphasis' },
      ],
    },
  ],
};
