import type { Scene } from '../../../../engine';

// T3 — Scène 7 : LA FENÊTRE
// Clôture de ce premier chapitre de La Ville, pas de la timeline entière.
// Premier plant du motif statistique → espace → personne : seulement l'espace,
// pour l'instant. Ni chiffre ni nom.
export const laFenetre: Scene = {
  id: 't3.la-fenetre',
  version: 1,
  timelineId: 't3',
  title: 'La fenêtre',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Dix-neuf heures. Le bureau se vide.' },
    { text: 'Farid éteint son écran. « À demain. Peut-être. »' },
    { text: 'Dehors, il fait déjà nuit.' },
    { text: 'La ville a beaucoup de fenêtres.' },
    { text: 'Certaines sont éclairées.' },
    { text: '—', pauseMs: 1800 },
    { text: 'Tu ne sais pas encore combien.' },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [{ id: 'sortir', label: 'Sortir du bureau' }],
  },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-2' },
};
