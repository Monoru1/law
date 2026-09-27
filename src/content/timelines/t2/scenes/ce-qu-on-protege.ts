import type { Scene } from '../../../../engine/types';

// T2 — Scène 7 : CE QU'ON PROTÈGE
// Confrontation indirecte : Camille vs Omar pour une ressource limitée.
export const ceQuOnProtege: Scene = {
  id: 't2.ce-qu-on-protege',
  version: 1,
  timelineId: 't2',
  title: "Ce qu'on prot\u00e8ge",
  regression: 2,
  contentFlags: [],
  beats: [
    {
      text: 'Il y a une ressource. Limit\u00e9e. Pas de fa\u00e7on abstraite \u2014 vraiment.',
    },
    { text: 'Camille en a besoin. Omar aussi.' },
    { text: "Ils ne se disputent pas. Ils t'attendent." },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'camille',
        label: 'Camille',
        evidence: [{ principleId: 'P_PROCHE', weight: 0.5 }],
      },
      {
        id: 'omar',
        label: 'Omar',
        evidence: [{ principleId: 'P_PROCHE', weight: 0.5 }],
      },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'camille' },
      beats: [
        { text: 'Tu donnes à Camille.' },
        { text: 'Omar ne dit rien.' },
        {
          text: 'Camille te regarde comme si elle avait voulu perdre.',
          style: 'whisper',
        },
      ],
      effects: [
        { setFlag: 't2.protege-camille' },
        { relationEvent: { characterId: 'camille', kind: 'protected' } },
        { relationEvent: { characterId: 'omar', kind: 'sacrificed' } },
      ],
    },
    {
      when: { optionId: 'omar' },
      beats: [
        { text: 'Tu donnes à Omar.' },
        { text: 'Camille ne dit rien.' },
        {
          text: 'Omar te regarde comme si tu lui devais encore quelque chose.',
          style: 'whisper',
        },
      ],
      effects: [
        { setFlag: 't2.protege-omar' },
        { relationEvent: { characterId: 'omar', kind: 'protected' } },
        { relationEvent: { characterId: 'camille', kind: 'sacrificed' } },
      ],
    },
  ],
};
