import type { Scene } from '../../../../engine/types';

const continued = {
  chose: { sceneId: 't1.le-protocole', optionId: 'continuer' },
} as const;
const stopped = {
  chose: { sceneId: 't1.le-protocole', optionId: 'arreter' },
} as const;
const opening = {
  text: 'Omar est sur le balcon. Il tient une cigarette qu’il n’allume pas.',
};
const brother = {
  text: '« Mon frère, Yanis. Il y a trois ans, il était dans un essai clinique. Chambre 14. »',
};

// T2 — Scène 5 : L'HISTOIRE D'OMAR
// La chambre 14 avait un nom. Omar pose au joueur la question que la pièce lui
// avait posée, sans savoir qui y avait répondu.
export const omarHistoire: Scene = {
  id: 't2.omar-histoire',
  version: 2,
  timelineId: 't2',
  title: 'L’histoire d’Omar',
  regression: 1,
  contentFlags: ['mort', 'essai-clinique'],
  beats: [
    opening,
    {
      text: '« Mon frère, Yanis, était dans un essai clinique. Chambre 14. Il y a eu un problème. »',
    },
    { text: '« Quelqu’un a dû choisir : continuer ou arrêter. »' },
    { text: '« Je ne sais toujours pas qui. »' },
    { text: '« Toi, tu aurais fait quoi ? »', style: 'emphasis' },
  ],
  variants: [
    {
      id: 'continue',
      when: continued,
      beats: [
        opening,
        brother,
        {
          text: '« Des symptômes que personne n’avait prévus. Ils ont continué. »',
        },
        {
          text: '« Le traitement est sorti cette année. Il marche. Soixante mille personnes, il paraît. »',
        },
        { text: '« Pas lui. »', style: 'emphasis' },
        { text: '« Toi, tu aurais continué ? »', style: 'emphasis' },
      ],
    },
    {
      id: 'arrete',
      when: stopped,
      beats: [
        opening,
        brother,
        {
          text: '« Des symptômes que personne n’avait prévus. Quelqu’un a arrêté l’essai. »',
        },
        { text: '« Il dort là-haut. »', style: 'emphasis' },
        {
          text: '« Le traitement n’existera jamais. J’ai un patient, chambre 9. Sur lui, il aurait marché. »',
        },
        { text: '« Toi, tu aurais arrêté ? »', style: 'emphasis' },
      ],
    },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [
      {
        id: 'aurais-continue',
        label: 'J’aurais continué',
        evidence: [
          { principleId: 'P_NOMBRE', weight: 1 },
          { principleId: 'P_INNOCENT', weight: -1 },
        ],
      },
      {
        id: 'aurais-arrete',
        label: 'J’aurais arrêté',
        evidence: [
          { principleId: 'P_INNOCENT', weight: 1 },
          { principleId: 'P_NOMBRE', weight: -1 },
        ],
      },
      { id: 'se-taire', label: 'Ne rien répondre' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'aurais-continue' },
      beats: [
        { text: 'Omar hoche la tête.' },
        { text: '« Moi aussi, j’aurais dit ça. Avant. »' },
        {
          text: 'Dans la pièce, tu as arrêté le protocole.',
          style: 'whisper',
          requires: stopped,
        },
      ],
      fact: 'Sur le balcon, tu as dit à Omar que tu aurais continué.',
    },
    {
      when: { optionId: 'aurais-arrete' },
      beats: [
        {
          text: 'Omar lève les yeux vers la fenêtre du haut.',
          requires: stopped,
        },
        { text: '« C’est facile, maintenant. »', requires: { not: stopped } },
        {
          text: 'Dans la pièce, tu as continué le protocole.',
          style: 'whisper',
          requires: continued,
        },
      ],
      fact: 'Sur le balcon, tu as dit à Omar que tu aurais arrêté.',
    },
    {
      when: { optionId: 'se-taire' },
      beats: [
        { text: 'Omar allume enfin sa cigarette.' },
        { text: '« Moi non plus, je ne sais pas. »' },
      ],
      fact: 'Sur le balcon, tu n’as rien répondu à Omar.',
    },
  ],
  followUps: ['certainty'],
};
