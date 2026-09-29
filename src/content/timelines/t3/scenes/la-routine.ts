import type { Scene } from '../../../../engine';

// T3 — Acte III, scène 3 : LA ROUTINE
// Montage. Premier plant discret du motif 417 : un nombre, sans emphase,
// jamais commenté.
export const laRoutine: Scene = {
  id: 't3.la-routine',
  version: 1,
  timelineId: 't3',
  title: 'La routine',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Les semaines passent plus vite qu’avant.' },
    {
      text: 'Le critère fonctionne. Personne ne le remet en question — c’est écrit, c’est appliqué.',
    },
    {
      text: 'Sur ton bureau, une pile de dossiers clos grandit chaque vendredi.',
    },
    { text: 'Quelqu’un a commencé à les numéroter. Tu ne sais pas qui.' },
    { text: 'Le dernier numéro, ce mois-ci : quatre cent dix-sept.' },
    { text: 'Tu tournes la page.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-3' },
};
