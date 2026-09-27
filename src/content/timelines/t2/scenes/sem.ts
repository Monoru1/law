import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : SEM
// La vérité dite à Camille avait un autre destinataire.
export const sem: Scene = {
  id: 't2.sem',
  version: 2,
  timelineId: 't2',
  title: 'Sem',
  regression: 2,
  contentFlags: [],
  when: { chose: { sceneId: 't2.le-mensonge', optionId: 'dire' } },
  beats: [
    { text: 'Le matin. Sem charge des cartons dans sa voiture.' },
    { text: 'Il ne te regarde pas.' },
    { text: '« Elle m’a dit que c’était toi. »' },
    { text: '« Je t’avais dit : pas un mot. »', style: 'emphasis' },
  ],
  input: {
    kind: 'freeText',
    prompt: 'Qu’est-ce que tu lui dis ?',
    placeholder: 'Ce que tu lui dis. Ou rien.',
    maxLength: 280,
    skippable: true,
  },
  outcomes: [
    {
      when: { optionId: 'written' },
      beats: [
        { text: 'Sem ferme le coffre.' },
        { text: 'Il garde la main dessus une seconde de trop.' },
      ],
      fact: 'Le matin, tu as répondu à Sem.',
    },
    {
      when: { optionId: 'declined' },
      beats: [{ text: 'Sem ferme le coffre.' }],
      fact: 'Le matin, tu n’as rien dit à Sem.',
    },
  ],
};
