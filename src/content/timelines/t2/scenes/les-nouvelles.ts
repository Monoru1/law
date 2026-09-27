import type { Scene } from '../../../../engine/types';

const tookMoney = { flag: 'took_money' } as const;
const transplanted = {
  chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-b' },
} as const;

// T2 — Scène 1 : LES NOUVELLES
// Le dernier dîner. Chaque personne porte un détail venu de la pièce, jamais
// expliqué. Le premier choix est aussi léger que le bouton : il revient à la fin.
export const lesNouvelles: Scene = {
  id: 't2.les-nouvelles',
  version: 2,
  timelineId: 't2',
  title: 'Les nouvelles',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Une maison. Des cartons dans l’entrée.' },
    { text: 'Une table. Cinq couverts.' },
    { text: 'Camille recompte les verres. Elle recompte toujours.' },
    {
      text: 'Sem est arrivé à midi. Il dit qu’il a posé sa journée.',
      requires: tookMoney,
    },
    {
      text: 'Sem arrive en dernier, son téléphone de bureau à la main.',
      requires: { not: tookMoney },
    },
    { text: 'Omar sort d’une garde de nuit. Il a oublié d’enlever son badge.' },
    {
      text: 'Mila porte un col roulé. Il fait vingt-huit degrés.',
      requires: transplanted,
    },
    {
      text: 'Mila pose son téléphone au milieu de la table. Sonnerie au maximum.',
      requires: { not: transplanted },
    },
    {
      text: '« La maison est vendue », dit Camille. « C’est le dernier dîner. »',
    },
    { text: 'Où t’assois-tu ?' },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [
      { id: 'camille', label: 'À côté de Camille' },
      { id: 'sem', label: 'À côté de Sem' },
      { id: 'omar', label: 'À côté d’Omar' },
      { id: 'mila', label: 'À côté de Mila' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'camille' },
      beats: [
        { text: 'Camille décale ton assiette d’un centimètre.' },
        { text: 'Maintenant, elle est droite.' },
      ],
      fact: 'Au dîner, tu t’es assis·e à côté de Camille.',
    },
    {
      when: { optionId: 'sem' },
      beats: [
        { text: 'Sem te sert avant de se servir.' },
        { text: 'Il remplit trop ton verre.' },
      ],
      fact: 'Au dîner, tu t’es assis·e à côté de Sem.',
    },
    {
      when: { optionId: 'omar' },
      beats: [
        { text: 'Omar se pousse sans lever les yeux.' },
        { text: 'Il sent l’hôpital.' },
      ],
      fact: 'Au dîner, tu t’es assis·e à côté d’Omar.',
    },
    {
      when: { optionId: 'mila' },
      beats: [
        {
          text: 'Mila tire sur son col. « Il fait chaud, hein. »',
          requires: transplanted,
        },
        {
          text: 'Mila retourne son téléphone, écran contre la table.',
          requires: { not: transplanted },
        },
        {
          text: 'Puis elle le remet à l’endroit.',
          requires: { not: transplanted },
        },
      ],
      fact: 'Au dîner, tu t’es assis·e à côté de Mila.',
    },
  ],
};
