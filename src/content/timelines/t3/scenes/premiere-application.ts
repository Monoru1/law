import type { Scene } from '../../../../engine';

// T3 — Acte III, scène 2 : PREMIÈRE APPLICATION
// La règle fonctionne pendant que le joueur fait autre chose. Premier
// glissement : le joueur cesse d'être l'acteur de chaque décision.
export const premiereApplication: Scene = {
  id: 't3.premiere-application',
  version: 1,
  timelineId: 't3',
  title: 'Première application',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Le lendemain, un dossier passe sans toi.' },
    {
      text: 'Farid l’a traité seul, selon ton critère. Il ne t’a rien demandé.',
    },
    { text: 'C’est normal. C’est pour ça que tu l’as écrit.' },
    {
      text: 'Le journal du bureau garde une ligne : nom du dossier, critère appliqué, décision.',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'consulter', label: 'Consulter le journal' },
      { id: 'ne-pas-consulter', label: 'Ne pas consulter' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'consulter' },
      beats: [
        {
          text: 'Tu lis la ligne. Un nom que tu ne connais pas. Une décision que tu n’as pas prise.',
        },
        { text: '—', pauseMs: 1200 },
        { text: 'La règle a fait exactement ce qu’elle devait faire.' },
      ],
      effects: [{ setFlag: 'consulte-journal' }],
      fact: 'Tu as consulté le journal des décisions appliquées en ton absence.',
    },
    {
      when: { optionId: 'ne-pas-consulter' },
      beats: [
        { text: 'Tu refermes l’écran.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Ce n’est plus vraiment à toi de vérifier.' },
      ],
      fact: 'Tu n’as pas consulté le journal des décisions appliquées en ton absence.',
    },
  ],
  audio: { ambience: 'act-3' },
};
