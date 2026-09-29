import type { Scene } from '../../../../engine';

// T3 — Acte III (Le Rouage), scène 1 : LE CAFÉ
// Une vraie scène humaine, sans dilemme. Farid existe pour lui-même avant
// d'exister pour le mécanisme de la règle.
export const leCafe: Scene = {
  id: 't3.le-cafe',
  version: 1,
  timelineId: 't3',
  title: 'Le café',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'La machine à café crache un liquide gris.' },
    { text: 'Farid attend son tour derrière toi.' },
    {
      text: '« Ils ont changé le gobelet. Plus petit. Économies, paraît-il. »',
    },
    { text: 'Il regarde le tien. « Le tien a l’air pareil. »' },
    { text: 'Vous buvez en silence, appuyés contre le mur du couloir.' },
    { text: '« Ma fille a eu son bac », dit-il enfin. « Hier soir. »' },
    { text: 'Tu ne savais même pas qu’il avait une fille.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-3' },
};
