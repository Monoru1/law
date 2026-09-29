import type { Scene } from '../../../../engine';

// T3 — Acte IV, scène 5 : FARID LE SAIT
// Ferme l'Acte IV. Loyauté/transparence avec le seul collègue développé comme
// personne — pas comme dispositif narratif.
export const faridLeSait: Scene = {
  id: 't3.farid-le-sait',
  version: 1,
  timelineId: 't3',
  title: 'Farid le sait',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Farid ferme la porte du bureau, ce qu’il ne fait jamais.' },
    { text: '« C’est vrai, ce qu’on dit ? Pour B. ? »' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'dire-la-verite', label: 'Dire la vérité' },
      { id: 'deflecter', label: 'Éluder' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'dire-la-verite' },
      beats: [
        {
          text: 'Tu lui racontes, sans rien enjoliver. Il écoute jusqu’au bout.',
        },
      ],
      effects: [
        { relationEvent: { characterId: 'farid', kind: 'truth_told' } },
      ],
      fact: 'Tu as dit la vérité à Farid sur le dossier de Nadia.',
    },
    {
      when: { optionId: 'deflecter' },
      beats: [
        { text: '« Un cas particulier. Rien d’important. »' },
        { text: 'Il te regarde une seconde de trop avant de sortir.' },
      ],
      effects: [{ relationEvent: { characterId: 'farid', kind: 'lie_made' } }],
      fact: 'Tu as éludé la question de Farid sur le dossier de Nadia.',
    },
  ],
  audio: { ambience: 'act-4' },
};
