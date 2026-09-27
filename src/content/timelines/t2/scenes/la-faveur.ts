import type { Scene } from '../../../../engine/types';

// T2 — Scène 3 : LA FAVEUR
// Sem a cinquante-deux ans. Ce que tu as fait des dix mille euros décide de ce
// qu'il est devenu, et donc de ce qu'il te demande ce soir.
export const laFaveur: Scene = {
  id: 't2.la-faveur',
  version: 2,
  timelineId: 't2',
  title: 'La faveur',
  regression: 1,
  contentFlags: ['argent'],
  beats: [
    { text: 'Sem fume dans le jardin. Il avait arrêté.' },
    {
      text: 'Cinquante-deux ans. L’an dernier, sa boîte a vidé la moitié de l’étage. Pas lui.',
    },
    { text: 'Cette année, on lui demande un nom.' },
    { text: '« Si je n’en donne pas, ce sera le mien. »' },
    { text: '« Toi, tu ferais quoi ? »', style: 'emphasis' },
  ],
  variants: [
    {
      id: 'sans-travail',
      when: { flag: 'took_money' },
      beats: [
        { text: 'Sem fume dans le jardin. Il avait arrêté.' },
        { text: 'Cinquante-deux ans. Il a vidé son bureau en mars.' },
        {
          text: 'Il part quand même tous les matins à huit heures. Camille ne sait pas.',
        },
        { text: '« Il me faudrait de quoi tenir jusqu’à l’été. »' },
        { text: '« Tu as de l’argent de côté, non ? »', style: 'emphasis' },
      ],
      input: {
        kind: 'binary',
        options: [
          { id: 'preter', label: 'Lui prêter l’argent' },
          { id: 'refuser', label: 'Refuser' },
        ],
      },
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'nom',
        label: 'Lui dire de donner un nom',
        evidence: [{ principleId: 'P_ARGENT', weight: -1 }],
      },
      {
        id: 'pas-de-nom',
        label: 'Lui dire de n’en donner aucun',
        evidence: [{ principleId: 'P_ARGENT', weight: 1 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'nom' },
      beats: [
        { text: 'Sem hoche la tête. Il avait déjà choisi.' },
        { text: 'Tu le vois à la façon dont il ne dit pas le nom.' },
        { text: '« Pas un mot à Camille. »', style: 'emphasis' },
      ],
      effects: [{ setFlag: 't2.sem-nom' }],
      fact: 'Dans le jardin, tu as dit à Sem de donner un nom.',
    },
    {
      when: { optionId: 'pas-de-nom' },
      beats: [
        { text: '« Facile à dire. »' },
        { text: 'Il ne dit pas ce qu’il va faire.' },
        { text: '« Pas un mot à Camille. »', style: 'emphasis' },
      ],
      fact: 'Dans le jardin, tu as dit à Sem de n’en donner aucun.',
    },
    {
      when: { optionId: 'preter' },
      beats: [
        { text: 'Tu fais le virement depuis ton téléphone.' },
        { text: '10 000 € ont été versés.' },
        { text: 'Sem ne demande pas d’où ils viennent.', style: 'whisper' },
        { text: '« Pas un mot à Camille. »', style: 'emphasis' },
      ],
      effects: [
        { setFlag: 't2.pret-sem' },
        { relationEvent: { characterId: 'sem', kind: 'protected' } },
      ],
      fact: 'Dans le jardin, tu as prêté dix mille euros à Sem.',
    },
    {
      when: { optionId: 'refuser' },
      beats: [
        { text: '« T’inquiète. »' },
        { text: 'Il écrase sa cigarette. Il en rallume une.' },
        { text: '« Pas un mot à Camille. »', style: 'emphasis' },
      ],
      fact: 'Dans le jardin, tu as refusé de prêter de l’argent à Sem.',
    },
  ],
};
