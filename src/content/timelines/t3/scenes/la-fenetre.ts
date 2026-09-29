import type { Scene } from '../../../../engine';

// T3 — Scène 7 : LA FENÊTRE
// Version 2 : ne clôt plus La Ville — c'est le pont vers l'Acte III. Reste un
// choix (pas un passage) : "Sortir du bureau" est le geste concret qui
// referme le premier chapitre avant Le Rouage. Premier plant du motif
// statistique → espace → personne : seulement l'espace, pour l'instant. Ni
// chiffre ni nom.
export const laFenetre: Scene = {
  id: 't3.la-fenetre',
  version: 3,
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
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'sortir', label: 'Sortir du bureau' },
      { id: 'rester-un-instant', label: 'Rester un instant' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'sortir' },
      beats: [{ text: 'Tu éteins ta lampe et descends.' }],
      fact: 'Tu es sorti du bureau sans t’attarder.',
    },
    {
      when: { optionId: 'rester-un-instant' },
      beats: [{ text: 'Tu restes un instant, seul, avant de descendre.' }],
      fact: 'Tu es resté un instant seul avant de sortir du bureau.',
    },
  ],
  audio: { ambience: 'act-2' },
};
