import type { Scene } from '../../../../engine/types';

// T2 — Scène 10 : LA MAISON (coda)
// R3. Inventaire sans jugement. Un seul geste de sortie.
export const laMaison: Scene = {
  id: 't2.la-maison',
  version: 1,
  timelineId: 't2',
  title: 'La maison',
  regression: 3,
  contentFlags: [],
  beats: [
    { text: 'La maison est silencieuse.' },
    { text: 'Les gens que tu connais sont toujours l\u00e0.' },
    { text: 'Ils ne savent pas tout ce que tu as d\u00e9cid\u00e9.' },
    { text: 'Toi oui.', style: 'emphasis' },
    {
      text: 'Tu as promis \u00e0 Camille.',
      requires: { flag: 't2.promesse-camille' },
    },
    {
      text: 'Tu as fait une exception pour Sem.',
      requires: { flag: 't2.exception-sem' },
    },
    {
      text: 'Tu as prot\u00e9g\u00e9 Camille.',
      requires: { flag: 't2.protege-camille' },
    },
    {
      text: 'Tu as prot\u00e9g\u00e9 Omar.',
      requires: { flag: 't2.protege-omar' },
    },
    {
      text: 'Tu as gard\u00e9 le secret de Mila.',
      requires: { flag: 't2.garde-secret-mila' },
    },
    {
      text: 'Tu as pouss\u00e9 Mila \u00e0 dire la v\u00e9rit\u00e9.',
      requires: { flag: 't2.pousse-mila-verite' },
    },
    { text: '\u2014' },
    {
      text: 'Les personnes que tu connais ne sont pas des abstractions.',
      style: 'emphasis',
    },
    { text: "C'est pour \u00e7a que c'\u00e9tait plus difficile." },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'sortir', label: 'Sortir de la maison' },
      { id: 'rester', label: 'Rester encore un moment' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'sortir' },
      beats: [{ text: 'Tu sors.' }],
    },
    {
      when: { optionId: 'rester' },
      beats: [
        { text: 'Tu restes.' },
        { text: 'Puis tu sors.', style: 'whisper' },
      ],
    },
  ],
};
