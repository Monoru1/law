import type { Scene } from '../../../../engine/types';

const transplanted = {
  chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-b' },
} as const;
const stopped = {
  chose: { sceneId: 't1.le-protocole', optionId: 'arreter' },
} as const;

// T2 — Scène 6 : CE QU'ON PROTÈGE
// Deux dossiers sur une table, encore. Cette fois, tu connais les deux noms.
export const ceQuOnProtege: Scene = {
  id: 't2.ce-qu-on-protege',
  version: 2,
  timelineId: 't2',
  title: 'Ce qu’on protège',
  regression: 2,
  contentFlags: ['argent'],
  beats: [
    { text: 'Minuit. Camille pose une enveloppe sur la table.' },
    {
      text: '« L’argent de la maison. Il en reste assez pour aider quelqu’un. Une personne. Pas deux. »',
    },
    { text: '« Moi, je compte. Je ne choisis pas. »' },
    {
      text: 'Sem regarde ailleurs. « Pas moi. J’ai ce qu’il faut. »',
      requires: { flag: 't2.pret-sem' },
    },
    {
      text: 'Sem ne dit rien. Il est le seul à ne pas regarder l’enveloppe.',
      requires: {
        all: [{ flag: 'took_money' }, { not: { flag: 't2.pret-sem' } }],
      },
    },
    { text: 'Deux noms sur la table. Une seule enveloppe.', style: 'emphasis' },
    {
      text: 'Mila : les médicaments, à vie. Pas tous remboursés.',
      requires: transplanted,
    },
    {
      text: 'Mila : une clinique à l’étranger. Là-bas, la liste est plus courte.',
      requires: { not: transplanted },
    },
    {
      text: 'Omar : Yanis ne peut plus travailler depuis l’essai. Omar paie tout.',
      requires: stopped,
    },
    {
      text: 'Omar : trois ans de doubles gardes, depuis Yanis.',
      requires: { not: stopped },
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'mila', label: 'Mila' },
      { id: 'omar', label: 'Omar' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'mila' },
      beats: [
        { text: 'Camille glisse l’enveloppe vers Mila.' },
        { text: 'Omar se lève pour faire du café. Personne n’en veut.' },
      ],
      effects: [
        { setFlag: 't2.enveloppe-mila' },
        { relationEvent: { characterId: 'mila', kind: 'protected' } },
        { relationEvent: { characterId: 'omar', kind: 'sacrificed' } },
      ],
      fact: 'À minuit, tu as donné l’enveloppe à Mila plutôt qu’à Omar.',
    },
    {
      when: { optionId: 'omar' },
      beats: [
        { text: 'Camille glisse l’enveloppe vers Omar.' },
        { text: 'Mila sourit trop vite.' },
      ],
      effects: [
        { setFlag: 't2.enveloppe-omar' },
        { relationEvent: { characterId: 'omar', kind: 'protected' } },
        { relationEvent: { characterId: 'mila', kind: 'sacrificed' } },
      ],
      fact: 'À minuit, tu as donné l’enveloppe à Omar plutôt qu’à Mila.',
    },
  ],
  followUps: ['certainty'],
};
