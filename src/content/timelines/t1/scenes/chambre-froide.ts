import type { Scene } from '../../../../engine';

export const chambreFroide: Scene = {
  id: 't1.chambre-froide',
  version: 1,
  timelineId: 't1',
  title: 'Chambre froide',
  regression: 1,
  contentFlags: ['death', 'sacrifice'],
  beats: [
    { text: 'Deux dossiers ouverts sur la table.' },
    { text: 'Un seul organe disponible ce soir.' },
    {
      text: 'Dossier A\u00a0: quarante-trois ans. Trois enfants. En attente depuis dix-huit mois.',
    },
    {
      text: 'Dossier B\u00a0: dix-neuf ans. Compatible \u00e0 94\u00a0%. Probabilit\u00e9 de survie \u00e0 cinq ans\u00a0: 81\u00a0%.',
    },
    { text: 'Le protocole ne pr\u00e9voit pas ce cas.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'hold',
    options: [
      {
        id: 'dossier-a',
        label: 'Dossier A',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 0.5 },
          { principleId: 'P_NOMBRE', weight: -0.5 },
        ],
      },
      {
        id: 'dossier-b',
        label: 'Dossier B',
        evidence: [
          { principleId: 'P_NOMBRE', weight: 0.5 },
          { principleId: 'P_INNOCENT', weight: -0.5 },
        ],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'dossier-a' },
      beats: [
        { text: 'Le dossier A a \u00e9t\u00e9 transmis au bloc.' },
        { text: '\u2014', pauseMs: 1200 },
        { text: 'Le dossier B a \u00e9t\u00e9 referm\u00e9.' },
      ],
      fact: 'Tu as transmis le dossier A au bloc.',
      effects: [
        { setFlag: 'chose_attente' },
        {
          proposeLaw: {
            principleId: 'P_INNOCENT',
            statementId: 'innocent.default',
          },
        },
      ],
    },
    {
      when: { optionId: 'dossier-b' },
      beats: [
        { text: 'Le dossier B a \u00e9t\u00e9 transmis au bloc.' },
        { text: '\u2014', pauseMs: 1200 },
        { text: 'Le dossier A attendra.' },
        {
          text: 'Il n\u2019y aura peut-\u00eatre pas d\u2019autre organe disponible avant la fin de l\u2019ann\u00e9e.',
          style: 'whisper',
        },
      ],
      fact: 'Tu as transmis le dossier B au bloc.',
      effects: [
        { setFlag: 'chose_probabilite' },
        {
          proposeLaw: {
            principleId: 'P_NOMBRE',
            statementId: 'nombre.default',
          },
        },
      ],
    },
  ],
  followUps: ['lawProposal'],
};
