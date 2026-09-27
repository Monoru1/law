import type { Scene } from '../../../../engine/types';

// T2 — Scène conditionnelle : CAMILLE SAIT
// Déclenchée si la faveur d'Omar acceptée ET Camille protégée.
export const camilleSait: Scene = {
  id: 't2.camille-sait',
  version: 1,
  timelineId: 't2',
  title: 'Camille sait',
  regression: 1,
  contentFlags: [],
  when: {
    all: [
      { visited: 't2.la-faveur' },
      { flag: 't2.protege-camille' },
      { chose: { sceneId: 't2.la-faveur', optionId: 'oui' } },
    ],
  },
  beats: [
    { text: 'Camille te prend \u00e0 part.' },
    { text: 'Elle sait qu\u2019Omar t\u2019a demand\u00e9 quelque chose.' },
    {
      text: '\u00ab\u00a0Tu lui as dit oui\u00a0?\u00a0\u00bb',
      style: 'emphasis',
    },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'avouer', label: 'Lui dire la v\u00e9rit\u00e9' },
      { id: 'taire', label: 'Esquiver' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'avouer' },
      beats: [
        { text: 'Tu lui dis.' },
        { text: 'Camille hoche la t\u00eate lentement.' },
        { text: '\u00ab\u00a0Je comprends.\u00a0\u00bb', style: 'emphasis' },
        {
          text: "Elle n'est pas contente. Elle comprend quand m\u00eame.",
          style: 'whisper',
        },
      ],
      effects: [
        { relationEvent: { characterId: 'camille', kind: 'lie_revealed' } },
      ],
    },
    {
      when: { optionId: 'taire' },
      beats: [
        { text: 'Tu esquives.' },
        { text: 'Camille te regarde.' },
        { text: 'Elle sait.', style: 'whisper' },
      ],
      effects: [
        { relationEvent: { characterId: 'camille', kind: 'lie_made' } },
      ],
    },
  ],
};
