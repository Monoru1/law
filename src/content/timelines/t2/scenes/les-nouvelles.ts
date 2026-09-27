import type { Scene } from '../../../../engine/types';

// T2 — Scène 1 : LES NOUVELLES
// Le joueur retrouve Camille, Omar et Mila — trois personnes qu'il connaît depuis LA PIÈCE.
// Callback T1 : si P_INNOCENT signé → Camille dit qu'elle savait.
export const lesNouvelles: Scene = {
  id: 't2.les-nouvelles',
  version: 1,
  timelineId: 't2',
  title: 'Les nouvelles',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'La pièce est la même.' },
    { text: 'Mais cette fois, il y a des gens dedans.' },
    { text: 'Camille, Omar, Mila.' },
    {
      text: 'Tu les connais. Pas bien \u2014 mais assez pour que \u00e7a change quelque chose.',
    },
  ],
  variants: [
    {
      id: 'v-innocent-signed',
      when: { law: { principleId: 'P_INNOCENT', status: 'signed' } },
      beats: [
        { text: 'La pièce est la même.' },
        { text: 'Mais cette fois, il y a des gens dedans.' },
        { text: 'Camille, Omar, Mila.' },
        {
          text: '\u00ab\u00a0Je savais que tu d\u00e9fendais les innocents.\u00a0\u00bb Camille dit \u00e7a en te regardant.',
          style: 'emphasis',
        },
        {
          text: "Tu ne sais pas encore si c'est un compliment ou une attente.",
        },
      ],
    },
    {
      id: 'v-nombre-signed',
      when: { law: { principleId: 'P_NOMBRE', status: 'signed' } },
      beats: [
        { text: 'La pièce est la même.' },
        { text: 'Mais cette fois, il y a des gens dedans.' },
        { text: 'Camille, Omar, Mila.' },
        {
          text: '\u00ab\u00a0Tu as sign\u00e9 pour le plus grand nombre.\u00a0\u00bb Camille dit \u00e7a doucement.',
          style: 'emphasis',
        },
        { text: "Comme si elle voulait voir si tu t'en souviens." },
      ],
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'rester', label: 'Rester dans la pièce' },
      { id: 'sortir', label: 'Demander à parler à Camille seule' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'rester' },
      beats: [
        { text: 'Vous restez tous les quatre.' },
        { text: "C'est plus difficile." },
      ],
    },
    {
      when: { optionId: 'sortir' },
      beats: [
        { text: 'Camille te suit dans le couloir.' },
        { text: 'Elle attend.' },
        { text: "Tu n'avais rien de particulier à dire." },
      ],
      effects: [{ setFlag: 't2.camille-solo-ouverture' }],
    },
  ],
};
