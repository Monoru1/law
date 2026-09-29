import type { Scene } from '../../../../engine';

// T3 — Acte VI (La Sortie), scène 1 : APRÈS LA LISTE
// Silence obligatoire après le moment majeur. Aucune explication immédiate.
export const apresLaListe: Scene = {
  id: 't3.apres-la-liste',
  version: 1,
  timelineId: 't3',
  title: 'Après la liste',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Le lendemain, rien.' },
    { text: 'Le bureau ouvre à l’heure. Le café a le même goût.' },
    {
      text: 'Ce que tu as signé — ou renvoyé — continue d’exister, quelque part, sans toi.',
    },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-5' },
};
