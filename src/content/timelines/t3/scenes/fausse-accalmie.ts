import type { Scene } from '../../../../engine';

// T3 — Acte V, scène 2 : FAUSSE ACCALMIE
// Tension → relâchement → normalité, avant le retour. Vraie respiration, pas
// un décor vide.
export const fausseAccalmie: Scene = {
  id: 't3.fausse-accalmie',
  version: 1,
  timelineId: 't3',
  title: 'Fausse accalmie',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Une semaine ordinaire.' },
    {
      text: 'Le café. Le couloir. Farid qui raconte une blague déjà entendue deux fois.',
    },
    { text: 'Personne ne parle de Nadia. Personne ne parle de l’Adjointe.' },
    { text: 'Tu pourrais presque croire que c’est fini.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-5' },
};
