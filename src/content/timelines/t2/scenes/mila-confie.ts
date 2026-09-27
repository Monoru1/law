import type { Scene } from '../../../../engine/types';

// T2 — Scène 3 : MILA SE CONFIE
// Mila révèle quelque chose de personnel. L'écoute active vs le conseil non demandé.
export const milaConfie: Scene = {
  id: 't2.mila-confie',
  version: 1,
  timelineId: 't2',
  title: 'Mila se confie',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Mila te parle.' },
    { text: "Pas de la procédure. Pas du protocole. D'elle." },
    {
      text: 'Sa sœur est malade. Les traitements sont lourds. Elle hésite à lui dire à quel point.',
    },
    {
      text: 'Elle te dit ça comme si elle attendait quelque chose \u2014 elle ne sait pas quoi.',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'ecouter', label: "L'écouter sans répondre" },
      { id: 'conseiller', label: 'Lui dire ce que tu ferais à sa place' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'ecouter' },
      beats: [
        { text: 'Tu restes là.' },
        {
          text: '\u00ab\u00a0Merci de ne pas avoir eu de r\u00e9ponse.\u00a0\u00bb',
          style: 'emphasis',
        },
      ],
      effects: [{ relationEvent: { characterId: 'mila', kind: 'protected' } }],
    },
    {
      when: { optionId: 'conseiller' },
      beats: [
        { text: 'Tu lui dis ce que tu ferais.' },
        { text: 'Elle écoute.' },
        { text: '\u00ab\u00a0Ouais.\u00a0\u00bb' },
        { text: 'Ça ne ressemble pas à un accord.' },
      ],
    },
  ],
};
