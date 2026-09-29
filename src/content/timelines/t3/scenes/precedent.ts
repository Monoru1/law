import type { Scene } from '../../../../engine';

// T3 — Acte IV, scène 4 : LE PRÉCÉDENT
// Le coût collectif d'une exception — ou la cohérence achetée par un refus.
// Variante selon ce qui s'est réellement passé pour Nadia.
export const precedent: Scene = {
  id: 't3.precedent',
  version: 1,
  timelineId: 't3',
  title: 'Le précédent',
  regression: 1,
  contentFlags: [],
  variants: [
    {
      id: 'accordee',
      when: { flag: 'nadia-exception-accordee' },
      beats: [
        {
          text: 'Trois jours plus tard, un collègue passe la tête par la porte.',
        },
        {
          text: '« Tu as fait une exception pour B. ? Sam a un dossier presque identique. »',
        },
        { text: '« Pourquoi elle et pas lui ? »' },
      ],
    },
  ],
  beats: [
    { text: 'Trois jours plus tard, un collègue passe la tête par la porte.' },
    {
      text: '« Tu as tenu la ligne pour B. Sam va vouloir la même réponse, du coup. »',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'expliquer', label: 'Expliquer le critère' },
      { id: 'renvoyer-au-reglement', label: 'Renvoyer au règlement' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'expliquer' },
      beats: [
        {
          text: 'Tu essaies de dire pourquoi. Les mots sonnent plus faibles à voix haute que dans ta tête.',
        },
      ],
      fact: 'Tu as tenté d’expliquer le critère à un collègue.',
    },
    {
      when: { optionId: 'renvoyer-au-reglement' },
      beats: [{ text: '« Demande à l’Adjointe. » Tu retournes à ta pile.' }],
      fact: 'Tu as renvoyé un collègue au règlement plutôt que d’expliquer.',
    },
  ],
  audio: { ambience: 'act-4' },
};
