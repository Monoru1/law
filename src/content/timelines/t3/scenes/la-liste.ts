import type { Scene } from '../../../../engine';

// T3 — Acte V, scène 6 : LA LISTE DÉFINITIVE
// Moment majeur, irréversible. Aucune confirmation, aucun undo. Ferme
// l'Acte V.
export const laListe: Scene = {
  id: 't3.la-liste',
  version: 1,
  timelineId: 't3',
  title: 'La liste définitive',
  regression: 2,
  contentFlags: [],
  beats: [
    {
      text: 'Un document arrive : la liste définitive des critères et précédents du bureau, à valider pour l’année.',
    },
    {
      text: 'Une fois signée, elle devient la référence. Aucune révision manuelle, aucun retour en arrière — seulement une nouvelle version, plus tard, si quelqu’un le demande.',
    },
    { text: 'Aucune case ne demande si tu es sûr.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'signer', label: 'Signer la liste' },
      { id: 'renvoyer-pour-revision', label: 'Renvoyer pour révision' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'signer' },
      beats: [
        { text: 'Tu signes. Le document part au registre central.' },
        { text: '—', pauseMs: 1800 },
        { text: 'C’est fait.' },
      ],
      effects: [{ setFlag: 'liste-signee' }],
      fact: 'Tu as signé la liste définitive des critères et précédents.',
    },
    {
      when: { optionId: 'renvoyer-pour-revision' },
      beats: [
        { text: 'Tu renvoies le document, annoté d’une remarque.' },
        { text: 'Il reviendra, inchangé ou presque, dans deux semaines.' },
      ],
      effects: [{ setFlag: 'liste-renvoyee' }],
      fact: 'Tu as renvoyé la liste définitive pour révision.',
    },
  ],
  audio: { ambience: 'act-5' },
};
