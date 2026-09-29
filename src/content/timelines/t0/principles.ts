import type { Principle } from '../../../engine';

// What the examination measures against. Never shown as a score: they only
// let a reply lean, and let LAW find where two of the player's acts pull apart.
export const principlesT0: Principle[] = [
  {
    id: 'P_SOUFFRANCE',
    statements: [
      {
        id: 'souffrance.default',
        text: 'Certaines souffrances appartiennent à celui qui les porte.',
        isDefault: true,
      },
    ],
  },
  {
    id: 'P_VERITE',
    statements: [
      {
        id: 'verite.default',
        text: 'Je ne mens pas, même pour épargner quelqu’un.',
        isDefault: true,
      },
    ],
  },
  {
    id: 'P_AUTRUI',
    statements: [
      {
        id: 'autrui.default',
        text: 'Je ne décide pas à la place des autres.',
        isDefault: true,
      },
    ],
  },
  {
    id: 'P_PAROLE',
    statements: [
      {
        id: 'parole.default',
        text: 'Je tiens ma parole quand elle me coûte.',
        isDefault: true,
      },
    ],
  },
  {
    id: 'P_DECLARED',
    statements: [
      {
        id: 'declared.default',
        text: 'Une règle que je refuse de violer.',
        isDefault: true,
      },
    ],
  },
];
