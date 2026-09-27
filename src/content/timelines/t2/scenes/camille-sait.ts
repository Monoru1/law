import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : CAMILLE SAIT
// Le mensonge d'une heure du matin ne tient pas jusqu'au jour.
export const camilleSait: Scene = {
  id: 't2.camille-sait',
  version: 2,
  timelineId: 't2',
  title: 'Camille sait',
  regression: 2,
  contentFlags: [],
  when: { chose: { sceneId: 't2.le-mensonge', optionId: 'mentir' } },
  beats: [
    { text: 'Le matin. Camille est dans l’entrée, entre les cartons.' },
    {
      text: 'Elle tient une lettre ouverte. Licenciement. Datée de mars.',
      requires: { flag: 'took_money' },
    },
    {
      text: 'Sem lui a tout dit, à l’aube.',
      requires: { not: { flag: 'took_money' } },
    },
    { text: 'Elle sait.' },
    { text: '« Tu savais. »', style: 'emphasis' },
    {
      text: '« Je t’avais demandé de l’aide. Tu avais dit oui. »',
      requires: { relation: { characterId: 'camille', kind: 'promise_made' } },
    },
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
        { text: 'Camille écoute jusqu’au bout.' },
        { text: 'Puis elle recompte les cartons.' },
      ],
      effects: [
        { relationEvent: { characterId: 'camille', kind: 'lie_revealed' } },
      ],
      fact: 'Le matin, tu as répondu à Camille, qui savait.',
    },
    {
      when: { optionId: 'declined' },
      beats: [{ text: 'Tu ne dis rien.' }, { text: 'Camille non plus.' }],
      effects: [
        { relationEvent: { characterId: 'camille', kind: 'lie_revealed' } },
      ],
      fact: 'Le matin, tu n’as rien dit à Camille, qui savait.',
    },
  ],
};
