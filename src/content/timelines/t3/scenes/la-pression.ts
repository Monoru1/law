import type { Scene } from '../../../../engine';

// T3 — Acte V (Tenir), scène 1 : LA PRESSION
export const laPression: Scene = {
  id: 't3.la-pression',
  version: 1,
  timelineId: 't3',
  title: 'La pression',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'L’Adjointe convoque les responsables de bureau.' },
    {
      text: '« Deux exceptions signalées ce trimestre. Sur mille dossiers, ça semble peu. »',
    },
    {
      text: '« Mais ça remet en question tout ce qu’on a construit en réunion. »',
    },
    {
      text: '« Je ne vous demande pas de revenir dessus. Je vous demande de tenir. »',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'tenir', label: 'Garder le silence' },
      { id: 'signaler-le-doute', label: 'Signaler un doute' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'tenir' },
      beats: [
        { text: 'Tu ne dis rien. Elle prend ton silence pour un accord.' },
      ],
      fact: 'Tu as gardé le silence face à la pression de l’Adjointe.',
    },
    {
      when: { optionId: 'signaler-le-doute' },
      beats: [
        { text: '« Il y a des cas où le critère ne suffit pas. »' },
        { text: 'Elle te regarde longtemps. « Je sais », dit-elle enfin.' },
      ],
      fact: 'Tu as signalé tes doutes à l’Adjointe.',
    },
  ],
  audio: { ambience: 'act-5' },
};
