import type { Scene } from '../../../../engine';

// T3 — Scène 1 : PREMIER JOUR
// Aucun dilemme. Un lieu, une routine, une personne qui existe avant d'être
// utile à quoi que ce soit. Le ton de La Ville se calibre ici.
export const premierJour: Scene = {
  id: 't3.premier-jour',
  version: 1,
  timelineId: 't3',
  title: 'Premier jour',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Un open space. Lumière de janvier.' },
    { text: 'Ton badge ne fonctionne pas du premier coup.' },
    {
      text: '« Il faut le frotter contre la hanche. Tout le monde fait ça. »',
    },
    { text: 'Farid ne lève pas les yeux de son écran en le disant.' },
    { text: '« Bureau 4. Les dossiers du jour sont dans le bac du haut. »' },
    { text: 'Il y en a beaucoup.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-1' },
};
