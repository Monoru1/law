import type { Scene } from '../../../../engine';

const base = [
  { text: 'L’essai clinique dure depuis trois ans.' },
  {
    text: 'Un participant développe des symptômes que le protocole n’avait pas anticipés.',
  },
  { text: 'Il est dans la chambre 14. Il sait ce qu’il a signé.' },
  {
    text: 'Continuer : les données restent intactes. Le traitement, s’il fonctionne, pourrait concerner soixante mille personnes.',
  },
  {
    text: 'Arrêter : le participant de la chambre 14 reçoit un traitement conventionnel.',
  },
  { text: 'Les données de trois ans deviennent inutilisables.' },
];

export const leProtocole: Scene = {
  id: 't1.le-protocole',
  version: 1,
  timelineId: 't1',
  title: 'Le protocole',
  regression: 2,
  contentFlags: ['death', 'sacrifice'],
  beats: base,
  variants: [
    {
      id: 'proche',
      when: { law: { principleId: 'P_INNOCENT', status: 'signed' } },
      beats: [
        ...base.slice(0, 3),
        {
          text: 'Il a l’âge que tu avais quand tu as signé ta première chose importante.',
        },
        { text: '—', pauseMs: 1000 },
        ...base.slice(3),
      ],
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'hold',
    options: [
      {
        id: 'continuer',
        label: 'Continuer le protocole',
        evidence: [
          { principleId: 'P_INNOCENT', weight: -1 },
          { principleId: 'P_NOMBRE', weight: 1 },
        ],
      },
      {
        id: 'arreter',
        label: 'Arrêter le protocole',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 1 },
          { principleId: 'P_NOMBRE', weight: -1 },
        ],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'continuer' },
      beats: [
        { text: 'Le protocole continue.' },
        { text: '—', pauseMs: 1200 },
        { text: 'La chambre 14 reste occupée.' },
      ],
      effects: [{ setFlag: 'protocole_continue' }],
    },
    {
      when: { optionId: 'arreter' },
      beats: [
        { text: 'Le protocole est arrêté.' },
        {
          text: 'Le participant de la chambre 14 reçoit le traitement conventionnel.',
        },
        { text: '—', pauseMs: 1200 },
        { text: 'Trois ans de données sont classées sans suite.' },
      ],
      effects: [{ setFlag: 'protocole_arrete' }],
    },
  ],
};
