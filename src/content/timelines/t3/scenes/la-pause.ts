import type { Scene } from '../../../../engine';

// T3 — Scène 3 : LA PAUSE
// Fausse tranquillité assumée. Farid existe pour lui-même, pas pour poser une
// question morale. Aucun dilemme, aucune conséquence, aucun effet.
export const laPause: Scene = {
  id: 't3.la-pause',
  version: 1,
  timelineId: 't3',
  title: 'La pause',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'La machine à café affiche « HS » depuis trois semaines.' },
    { text: 'Farid tape dessus une fois, par principe, puis renonce.' },
    { text: '« Mon chat a vomi sur le clavier de ma femme. Mon ex-femme. »' },
    { text: 'Il ne précise pas depuis quand.' },
    { text: '« Elle a gardé le chat. Je la comprends. »' },
    { text: 'Il regarde par la fenêtre. Il ne dit rien pendant un moment.' },
    { text: '« Bon. Bureau 4. »' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-1' },
};
