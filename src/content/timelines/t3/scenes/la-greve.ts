import type { Scene } from '../../../../engine';

// T3 — Acte V, scène 3 : LA GRÈVE
export const laGreve: Scene = {
  id: 't3.la-greve',
  version: 1,
  timelineId: 't3',
  title: 'La grève',
  regression: 1,
  contentFlags: [],
  beats: [
    {
      text: 'Un tract circule dans les casiers. Conditions de travail. Charge de dossiers.',
    },
    { text: 'Personne ne cite le critère directement.' },
    { text: '« Demain, neuf heures. Devant le bâtiment. »' },
    { text: 'Farid l’a signé. Il ne te demande pas de faire pareil.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'rejoindre', label: 'Rejoindre la grève' },
      { id: 'rester-au-poste', label: 'Rester au poste' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'rejoindre' },
      beats: [
        {
          text: 'Tu descends devant le bâtiment. Farid ne dit rien, mais se pousse pour te faire une place.',
        },
      ],
      effects: [{ setFlag: 'greve-soutenue' }],
      fact: 'Tu as rejoint la grève devant le bâtiment.',
    },
    {
      when: { optionId: 'rester-au-poste' },
      beats: [
        {
          text: 'Tu restes à ton bureau. Le couloir, en bas, est étrangement calme.',
        },
      ],
      effects: [{ setFlag: 'greve-non-soutenue' }],
      fact: 'Tu es resté à ton poste pendant la grève.',
    },
  ],
  audio: { ambience: 'act-5' },
};
