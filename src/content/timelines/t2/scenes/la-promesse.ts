import type { Scene } from '../../../../engine/types';

// T2 — Scène 2 : LA PROMESSE
// Camille demande une promesse à l'aveugle. Ce qu'elle a déjà donné, ou reçu,
// dans la pièce n'est jamais dit : seulement un soir, ou un souffle court.
export const laPromesse: Scene = {
  id: 't2.la-promesse',
  version: 2,
  timelineId: 't2',
  title: 'La promesse',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Dans la cuisine, Camille essuie les verres. Un par un.' },
    {
      text: 'Il y a trois ans, un soir, elle a failli ne pas rentrer chez elle. Elle n’en parle jamais.',
      requires: { chose: { sceneId: 't1.sept-annees', optionId: 'sauver' } },
    },
    {
      text: 'Elle s’essouffle dans l’escalier, depuis quelques années. Elle dit que c’est l’âge.',
      requires: {
        chose: { sceneId: 't1.sept-annees', optionId: 'ne-pas-sauver' },
      },
    },
    { text: '« Promets-moi un truc. »' },
    {
      text: '« Si un jour je te demande de l’aide, tu dis oui. Sans demander pourquoi. »',
    },
    { text: '« Oui ou non. »', style: 'emphasis' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      {
        id: 'promettre',
        label: 'Promettre',
        evidence: [{ principleId: 'P_PAROLE', weight: 1 }],
      },
      { id: 'refuser', label: 'Ne pas promettre sans savoir' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'promettre' },
      beats: [{ text: '« Bien. »' }, { text: 'Elle range le dernier verre.' }],
      effects: [
        { setFlag: 't2.promesse-camille' },
        { relationEvent: { characterId: 'camille', kind: 'promise_made' } },
        {
          proposeLaw: {
            principleId: 'P_PAROLE',
            statementId: 'parole.default',
          },
        },
      ],
      fact: 'Dans la cuisine, tu as promis à Camille de dire oui.',
    },
    {
      when: { optionId: 'refuser' },
      beats: [
        { text: '« D’accord. »' },
        { text: 'Elle recompte les verres qu’elle vient de compter.' },
      ],
      fact: 'Dans la cuisine, tu as refusé de promettre à Camille.',
    },
  ],
  followUps: ['lawProposal'],
};
