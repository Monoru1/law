import type { Scene } from '../../../../engine';

// T3 — Acte V, scène 5 : RETOUR INCONNU
// Contraste : la règle appliquée à des gens que le joueur ne connaît pas.
export const retourInconnu: Scene = {
  id: 't3.retour-inconnu',
  version: 1,
  timelineId: 't3',
  title: 'Retour inconnu',
  regression: 1,
  contentFlags: [],
  beats: [
    {
      text: 'La plupart des noms ne te disent rien. C’est là, précisément, que le critère devait servir.',
    },
    {
      text: 'Un par un, presque sans exception, les dossiers suivent la règle que tu as écrite.',
    },
    {
      text: 'Ça fonctionne. C’est même, d’une certaine manière, ce que tu voulais.',
    },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-5' },
};
