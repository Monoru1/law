import type { Scene } from '../../../../engine/types';

// T2 — Scène 8 : SEM
// Sem pose une question directe sur la cohérence du joueur.
export const sem: Scene = {
  id: 't2.sem',
  version: 1,
  timelineId: 't2',
  title: 'Sem',
  regression: 2,
  contentFlags: [],
  beats: [
    { text: 'Sem s\u2019assoit en face de toi.' },
    { text: '\u00ab\u00a0Tu es coh\u00e9rent\u00a0?\u00a0\u00bb' },
    { text: 'Pas m\u00e9chamment.' },
    { text: 'Il veut juste savoir.' },
  ],
  variants: [
    {
      id: 'v-exception-faite',
      when: { flag: 't2.exception-sem' },
      beats: [
        { text: 'Sem s\u2019assoit en face de toi.' },
        {
          text: '\u00ab\u00a0Tu as fait une exception pour moi.\u00a0\u00bb',
          style: 'emphasis',
        },
        { text: 'Il attend.' },
        {
          text: "\u00ab\u00a0Tu l'aurais fait pour les autres aussi\u00a0?\u00a0\u00bb",
          style: 'emphasis',
        },
      ],
    },
  ],
  input: {
    kind: 'freeText',
    prompt: 'Ta r\u00e9ponse',
    placeholder: 'Dis-lui ce que tu penses vraiment\u2026',
    maxLength: 300,
    skippable: true,
  },
  outcomes: [
    {
      when: { any: true },
      beats: [
        { text: 'Sem \u00e9coute.' },
        { text: "\u00ab\u00a0D'accord.\u00a0\u00bb" },
        { text: "C'est tout ce qu'il dit.", style: 'whisper' },
      ],
    },
  ],
};
