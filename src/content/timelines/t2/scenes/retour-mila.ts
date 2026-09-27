import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : RETOUR MILA
// Déclenchée si le joueur a écouté Mila sans répondre.
export const retourMila: Scene = {
  id: 't2.retour-mila',
  version: 1,
  timelineId: 't2',
  title: 'Retour de Mila',
  regression: 0,
  contentFlags: [],
  when: {
    all: [
      { visited: 't2.mila-confie' },
      { chose: { sceneId: 't2.mila-confie', optionId: 'ecouter' } },
    ],
  },
  beats: [
    { text: 'Mila revient te voir.' },
    {
      text: "\u00ab\u00a0J'ai dit \u00e0 ma s\u0153ur \u00e0 quel point c'est lourd.\u00a0\u00bb",
      style: 'emphasis',
    },
    {
      text: "\u00ab\u00a0Elle a pleur\u00e9. Moi aussi. C'\u00e9tait mieux.\u00a0\u00bb",
      style: 'emphasis',
    },
    { text: 'Elle te regarde.' },
    {
      text: "\u00ab\u00a0C'est toi qui m'as aid\u00e9e \u00e0 d\u00e9cider. En ne disant rien.\u00a0\u00bb",
      style: 'emphasis',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'recevoir', label: 'Recevoir \u00e7a' },
      { id: 'minimiser', label: "Dire que tu n'as rien fait" },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'recevoir' },
      beats: [{ text: 'Tu re\u00e7ois.' }],
    },
    {
      when: { optionId: 'minimiser' },
      beats: [
        { text: "Tu dis que tu n'as rien fait." },
        { text: 'Mila sourit.' },
        {
          text: "\u00ab\u00a0C'est exactement \u00e7a que tu as fait.\u00a0\u00bb",
          style: 'whisper',
        },
      ],
    },
  ],
};
