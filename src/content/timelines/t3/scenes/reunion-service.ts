import type { Scene } from '../../../../engine';

// T3 — Scène 5 : RÉUNION DE SERVICE
// L'Adjointe annonce le changement d'échelle. Elle a raison, en partie — le
// bureau ne peut plus fonctionner au cas par cas. Ce n'est pas la scène du
// choix ; c'est celle qui explique pourquoi il y en aura un.
export const reunionService: Scene = {
  id: 't3.reunion-service',
  version: 1,
  timelineId: 't3',
  title: 'Réunion de service',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Douze personnes autour d’une table trop petite pour douze.' },
    {
      text: '« On a traité trois cent de plus que l’an dernier », dit l’Adjointe. « À trois par jour, sans critère commun. »',
    },
    {
      text: '« Chacun de vous décide un peu différemment. Ce n’est la faute de personne. »',
    },
    { text: '« Mais on ne peut plus se le permettre. »' },
    { text: 'Elle repose son stylo. Elle a l’air fatiguée, pas autoritaire.' },
    {
      text: '« À partir d’aujourd’hui, chaque bureau applique un critère. Un seul. Écrit. »',
    },
    { text: '« Le vôtre, c’est vous qui le choisissez. »' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-2' },
};
