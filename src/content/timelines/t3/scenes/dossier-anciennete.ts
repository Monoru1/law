import type { Scene } from '../../../../engine';

// T3 — Scène 2 : DOSSIER ANCIENNETÉ
// Le premier cas. Encore un cas par cas, comme la pièce, comme la maison.
// Le joueur ne sait pas encore qu'il calibre un critère qu'on lui demandera
// bientôt d'écrire pour de bon.
export const dossierAnciennete: Scene = {
  id: 't3.dossier-anciennete',
  version: 1,
  timelineId: 't3',
  title: 'Dossier Ancienneté',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Une place en foyer d’urgence. Une seule, pour ce mois-ci.' },
    { text: 'Deux dossiers.' },
    {
      text: 'Le premier a été déposé il y a huit mois. Le second, hier après-midi.',
    },
    { text: 'Rien ne les distingue, sauf la date.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'premiere', label: 'La première demande' },
      { id: 'seconde', label: 'La seconde demande' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'premiere' },
      beats: [
        { text: 'Le dossier le plus ancien est validé.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Huit mois, ça compte pour quelque chose.' },
      ],
      fact: 'Tu as fait passer la demande la plus ancienne.',
    },
    {
      when: { optionId: 'seconde' },
      beats: [
        { text: 'Le dossier le plus récent est validé.' },
        { text: '—', pauseMs: 1200 },
        { text: 'La date sur le premier dossier ne change pas.' },
      ],
      fact: 'Tu as fait passer la demande la plus récente.',
    },
  ],
  audio: { ambience: 'act-1' },
};
