import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : RETOUR DE MILA
// Le secret gardé dans l'escalier revient à trois heures du matin, avec un prix.
export const retourMila: Scene = {
  id: 't2.retour-mila',
  version: 2,
  timelineId: 't2',
  title: 'Trois heures',
  regression: 2,
  contentFlags: ['maladie'],
  when: { chose: { sceneId: 't2.mila-confie', optionId: 'garder' } },
  beats: [
    { text: 'Trois heures du matin. On frappe à ta porte.' },
    { text: 'Mila. Elle tremble. Elle rit quand même.' },
    { text: '« Ça va passer. »' },
    {
      text: '« Ne réveille pas Omar. Il appellerait l’hôpital. Et je redescendrais sur la liste. »',
      style: 'emphasis',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'reveiller',
        label: 'Réveiller Omar',
        evidence: [{ principleId: 'P_PAROLE', weight: -1 }],
      },
      {
        id: 'rester',
        label: 'Rester avec elle',
        evidence: [{ principleId: 'P_PAROLE', weight: 0.5 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'reveiller' },
      beats: [
        { text: 'Tu frappes chez Omar.' },
        { text: 'Il est debout avant que tu aies fini ta phrase.' },
        { text: 'Mila ne te regarde pas quand ils descendent.' },
      ],
      effects: [
        { setFlag: 't2.omar-reveille' },
        { relationEvent: { characterId: 'mila', kind: 'promise_broken' } },
        { relationEvent: { characterId: 'mila', kind: 'secret_told' } },
      ],
      fact: 'À trois heures, tu as réveillé Omar malgré ta promesse à Mila.',
    },
    {
      when: { optionId: 'rester' },
      beats: [
        { text: 'Tu restes.' },
        {
          text: 'Elle s’endort vers cinq heures, la main sur son téléphone.',
        },
      ],
      effects: [
        { setFlag: 't2.nuit-mila' },
        { relationEvent: { characterId: 'mila', kind: 'promise_kept' } },
      ],
      fact: 'À trois heures, tu es resté·e avec Mila sans réveiller Omar.',
    },
  ],
};
