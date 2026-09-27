import type { Scene } from '../../../../engine/types';

// T2 — Scène 9 : LE MENSONGE
// Mila a menti à Omar sur quelque chose d'important. Elle dit ça au joueur.
export const leMensonge: Scene = {
  id: 't2.le-mensonge',
  version: 1,
  timelineId: 't2',
  title: 'Le mensonge',
  regression: 2,
  contentFlags: [],
  beats: [
    { text: 'Mila t\u2019avoue quelque chose.' },
    { text: 'Elle a menti \u00e0 Omar.' },
    { text: 'Pas un petit mensonge.' },
    {
      text: '\u00ab\u00a0Il ne le sait pas. Je ne sais pas si je dois lui dire.\u00a0\u00bb',
      style: 'emphasis',
    },
    { text: 'Elle te regarde.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'lui-dire',
        label: 'L\u2019encourager \u00e0 dire la v\u00e9rit\u00e9 \u00e0 Omar',
      },
      {
        id: 'garder',
        label: "Lui dire que c'est sa d\u00e9cision \u00e0 elle",
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'lui-dire' },
      beats: [
        { text: 'Tu lui dis qu\u2019Omar m\u00e9rite de savoir.' },
        { text: 'Mila reste silencieuse.' },
        { text: '\u00ab\u00a0Peut-\u00eatre.\u00a0\u00bb', style: 'emphasis' },
        { text: 'Elle ne dit pas si elle le fera.', style: 'whisper' },
      ],
      effects: [
        { setFlag: 't2.pousse-mila-verite' },
        { relationEvent: { characterId: 'mila', kind: 'lie_revealed' } },
      ],
    },
    {
      when: { optionId: 'garder' },
      beats: [
        { text: "Tu lui dis que c'est \u00e0 elle de d\u00e9cider." },
        { text: 'Mila hoche la t\u00eate.' },
        { text: '\u00ab\u00a0Merci.\u00a0\u00bb', style: 'emphasis' },
        { text: 'Tu portes quelque chose maintenant.', style: 'whisper' },
      ],
      effects: [
        { setFlag: 't2.garde-secret-mila' },
        { relationEvent: { characterId: 'mila', kind: 'lie_made' } },
      ],
    },
  ],
};
