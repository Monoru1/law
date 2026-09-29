import type { Scene } from '../../../../engine';

// T3 — Acte V, scène 4 : RETOUR CONNU
// La règle s'applique à quelqu'un que le joueur connaît, conditionnellement à
// ses choix de Timeline I. Sans jamais lire la structure de T1 — seulement le
// fait, transmis par la mémoire héritée.
export const retourConnu: Scene = {
  id: 't3.retour-connu',
  version: 1,
  timelineId: 't3',
  title: 'Retour connu',
  regression: 1,
  contentFlags: [],
  variants: [
    {
      id: 'sem',
      when: { chose: { sceneId: 't1.dix-mille', optionId: 'accepter' } },
      beats: [
        {
          text: 'Un nom, dans la pile du matin, te retient une seconde de trop.',
        },
        {
          text: 'Sem. Le dossier que tu avais accepté, il y a longtemps, dans une autre pièce.',
        },
        {
          text: 'Le critère s’applique à lui comme à n’importe qui d’autre, maintenant.',
        },
      ],
    },
  ],
  beats: [
    { text: 'Un nom, dans la pile du matin, te retient une seconde de trop.' },
    { text: 'Un inconnu, cette fois. Le critère ne fait pas de différence.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-5' },
};
