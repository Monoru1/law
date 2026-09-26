import type { Scene } from '../../../../engine';
const base = [
  { text: 'Cinq patients mourront cette nuit sans greffe.' },
  { text: 'Dans la salle d’attente, un homme en parfaite santé.' },
  { text: 'Compatible avec les cinq.' },
  { text: 'Il suffit de ton accord.' },
];
export const chirurgien: Scene = {
  id: 't1.chirurgien',
  version: 1,
  timelineId: 't1',
  title: 'Le chirurgien',
  regression: 2,
  contentFlags: ['death', 'sacrifice'],
  beats: base,
  variants: [
    {
      id: 'proche',
      when: { law: { principleId: 'P_INNOCENT', status: 'signed' } },
      beats: [
        ...base.slice(0, 3),
        { text: 'L’un des cinq est quelqu’un que tu aimes.' },
        { text: 'Pense à cette personne.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Maintenant.' },
        ...base.slice(3),
      ],
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'hold',
    options: [
      {
        id: 'autoriser',
        label: 'Autoriser',
        evidence: [
          { principleId: 'P_INNOCENT', weight: -1 },
          { principleId: 'P_NOMBRE', weight: 1 },
        ],
      },
      {
        id: 'refuser',
        label: 'Refuser',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 1 },
          { principleId: 'P_NOMBRE', weight: -1 },
        ],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'autoriser' },
      beats: [
        { text: 'Cinq patients se réveilleront.' },
        { text: '—', pauseMs: 1200 },
        { text: 'L’homme de la salle d’attente, non.' },
      ],
    },
    {
      when: { optionId: 'refuser' },
      beats: [
        { text: 'L’homme rentre chez lui. Il ne saura jamais.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Cinq lits se vident.' },
      ],
    },
  ],
};
