import type { Scene } from '../../../../engine/types';

const promised = {
  relation: { characterId: 'camille', kind: 'promise_made' },
} as const;

// T2 — Scène 7 : LE MENSONGE
// Camille demande ce que Sem cache. Si tu lui as promis de dire oui, c'est le
// moment où la promesse sert.
export const leMensonge: Scene = {
  id: 't2.le-mensonge',
  version: 2,
  timelineId: 't2',
  title: 'Le mensonge',
  regression: 2,
  contentFlags: [],
  beats: [
    { text: 'Une heure du matin. Camille ne dort pas.' },
    { text: '« Sem me cache quelque chose. »' },
    { text: '« Tu sais ce que c’est. Je le vois. »' },
    {
      text: '« Tu as promis de dire oui. Je te demande de l’aide. »',
      style: 'emphasis',
      requires: promised,
    },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [
      {
        id: 'dire',
        label: 'Lui dire ce que Sem cache',
        evidence: [{ principleId: 'P_PAROLE', weight: 1, when: promised }],
      },
      {
        id: 'mentir',
        label: 'Lui dire que tu ne sais rien',
        evidence: [{ principleId: 'P_PAROLE', weight: -1, when: promised }],
      },
      {
        id: 'refuser',
        label: 'Lui dire que ce n’est pas à toi de le dire',
        evidence: [{ principleId: 'P_PAROLE', weight: -0.5, when: promised }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'dire' },
      beats: [
        {
          text: 'Tu lui dis : le bureau vidé en mars, les matins à huit heures.',
          requires: { flag: 'took_money' },
        },
        {
          text: 'Tu lui dis : le nom qu’on lui demande.',
          requires: { not: { flag: 'took_money' } },
        },
        { text: 'Camille ne dit rien.' },
        { text: 'Elle compte quelque chose, dans sa tête.' },
      ],
      effects: [
        { setFlag: 't2.camille-informee' },
        { relationEvent: { characterId: 'sem', kind: 'secret_told' } },
        { relationEvent: { characterId: 'camille', kind: 'truth_told' } },
        {
          if: promised,
          then: [
            { relationEvent: { characterId: 'camille', kind: 'promise_kept' } },
          ],
        },
      ],
      fact: 'À une heure du matin, tu as dit à Camille ce que Sem cachait.',
    },
    {
      when: { optionId: 'mentir' },
      beats: [
        { text: '« Je ne sais rien. »' },
        { text: 'Camille te regarde longtemps.' },
        { text: 'Elle te croit.', style: 'emphasis' },
      ],
      effects: [
        { setFlag: 't2.mensonge-camille' },
        { relationEvent: { characterId: 'camille', kind: 'lie_made' } },
        { relationEvent: { characterId: 'sem', kind: 'secret_kept' } },
        {
          if: promised,
          then: [
            {
              relationEvent: { characterId: 'camille', kind: 'promise_broken' },
            },
          ],
        },
      ],
      fact: 'À une heure du matin, tu as dit à Camille que tu ne savais rien.',
    },
    {
      when: { optionId: 'refuser' },
      beats: [
        { text: '« Donc il y a quelque chose. »' },
        { text: 'Elle éteint la lumière de la cuisine.' },
      ],
      effects: [
        { relationEvent: { characterId: 'sem', kind: 'secret_kept' } },
        {
          if: promised,
          then: [
            {
              relationEvent: { characterId: 'camille', kind: 'promise_broken' },
            },
          ],
        },
      ],
      fact: 'À une heure du matin, tu as refusé de répondre à Camille.',
    },
  ],
};
