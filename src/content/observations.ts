import type { ObservationRule } from '../engine';

export const observationRules: ObservationRule[] = [
  {
    id: 'o-sept-vs-enfant',
    when: {
      all: [
        { chose: { sceneId: 't1.sept-annees', optionId: 'ne-pas-sauver' } },
        { value: { sceneId: 't1.combien', op: '>=', value: 7 } },
      ],
    },
    text: 'Tu as refusé sept années pour dix inconnus. Tu en as donné {{value:t1.combien|0}} pour un seul enfant.',
  },
  {
    id: 'o-dossiers',
    when: {
      all: [
        { chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-b' } },
        { chose: { sceneId: 't1.le-protocole', optionId: 'arreter' } },
      ],
    },
    text: 'Face aux chiffres, tu as choisi la personne présente. Deux fois.',
  },
  {
    id: 'o-distance',
    when: {
      all: [
        { chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-b' } },
        { chose: { sceneId: 't1.le-protocole', optionId: 'continuer' } },
      ],
    },
    text: 'Un dossier optimisé. Un participant maintenu dans le protocole. Le calcul n’a pas toujours le même nom.',
  },
  {
    id: 'o-constance',
    when: {
      all: [
        { chose: { sceneId: 't1.chambre-froide', optionId: 'dossier-a' } },
        { chose: { sceneId: 't1.le-protocole', optionId: 'arreter' } },
      ],
    },
    text: 'Face au sacrifice d’un innocent, tu as fait le même choix deux fois.',
  },
  {
    id: 'o-hesitation',
    when: { all: [] },
    minDecisions: 5,
    text: 'Ta plus longue hésitation : {{scène}}, {{secondes}} secondes.',
  },
  {
    id: 'o-changements',
    when: { flag: 'law_changed' },
    text: 'Tu as modifié une loi après avoir été confronté à ses conséquences.',
  },
  {
    id: 'o-don-total',
    when: { var: 'lifeYearsGiven', op: '>', value: 0 },
    text: 'Au total, tu as donné {{var:lifeYearsGiven|0}} années de ta vie.',
  },
];
