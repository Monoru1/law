import type { Scene } from '../../../../engine';

// T3 — Scène 7 : LA FENÊTRE
// Version 2 : ne clôt plus La Ville — c'est le pont vers l'Acte III. Premier
// plant du motif statistique → espace → personne : seulement l'espace, pour
// l'instant. Ni chiffre ni nom.
export const laFenetre: Scene = {
  id: 't3.la-fenetre',
  version: 2,
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
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-2' },
};
