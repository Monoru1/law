import type { Scene } from '../../../../engine';

// T3 — Acte VI, scène 5 : SORTIE
// Vraie fin de T3. Pas de bilan, pas de score, pas de morale énoncée —
// seulement une question qui reste ouverte.
export const sortie: Scene = {
  id: 't3.sortie',
  version: 1,
  timelineId: 't3',
  title: 'Sortie',
  regression: 2,
  contentFlags: [],
  beats: [
    { text: 'Tu descends l’escalier. Le hall est vide à cette heure.' },
    { text: 'Dehors, il fait nuit depuis longtemps.' },
    { text: 'Tu repenses à la première fois où tu as rempli ce formulaire.' },
    { text: '« Ce que tu écris ici ne te sera plus jamais demandé. »' },
    { text: 'Tu étais sûr de toi, ce jour-là.' },
    { text: '—', pauseMs: 2200 },
    { text: 'L’es-tu encore ?' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-6' },
};
