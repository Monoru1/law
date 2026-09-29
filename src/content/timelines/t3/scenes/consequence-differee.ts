import type { Scene } from '../../../../engine';

// T3 — Acte III, scène 4 : CONSÉQUENCE DIFFÉRÉE
// Premier retour d'un choix ancien (dossier-urgence). Rien n'explique la
// mécanique ; le joueur reconnaît, ou pas, tout seul.
export const consequenceDifferee: Scene = {
  id: 't3.consequence-differee',
  version: 1,
  timelineId: 't3',
  title: 'Conséquence différée',
  regression: 1,
  contentFlags: [],
  variants: [
    {
      id: 'ordre',
      when: { chose: { sceneId: 't3.dossier-urgence', optionId: 'ordre' } },
      beats: [
        {
          text: 'Un homme se présente au guichet. Tu le reconnais à peine — un nom, en bas d’un dossier, il y a des semaines.',
        },
        {
          text: 'C’était le dossier resté en tête de file, malgré l’urgence de la femme derrière lui.',
        },
        {
          text: '« Ça a pris six semaines de plus », dit-il. Pas de colère. Juste un fait.',
        },
      ],
    },
    {
      id: 'urgence',
      when: { chose: { sceneId: 't3.dossier-urgence', optionId: 'urgence' } },
      beats: [
        {
          text: 'Un homme se présente au guichet. Tu le reconnais à peine — un nom, en bas d’un dossier, il y a des semaines.',
        },
        {
          text: 'C’était l’un des douze qui avaient attendu plus longtemps que la femme passée avant eux.',
        },
        {
          text: '« Ça a pris six semaines de plus », dit-il. Pas de colère. Juste un fait.',
        },
      ],
    },
  ],
  beats: [
    {
      text: 'Un homme se présente au guichet. Tu le reconnais à peine — un nom, en bas d’un dossier, il y a des semaines.',
    },
    {
      text: '« Ça a pris six semaines de plus », dit-il. Pas de colère. Juste un fait.',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 's-excuser', label: 'S’excuser pour le délai' },
      { id: 'ne-rien-dire', label: 'Ne rien dire' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 's-excuser' },
      beats: [
        { text: '« Je suis désolé pour le délai. »' },
        { text: 'Il hausse les épaules. « C’est la règle. »' },
      ],
      fact: 'Tu t’es excusé pour un délai que la règle explique.',
    },
    {
      when: { optionId: 'ne-rien-dire' },
      beats: [
        { text: 'Tu tamponnes le dossier. Il repart sans un mot de plus.' },
      ],
      fact: 'Tu n’as rien dit du délai que la règle explique.',
    },
  ],
  audio: { ambience: 'act-3' },
};
