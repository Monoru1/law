import type { Scene } from '../../../../engine';

// T3 — Acte IV (Le Dossier), scène 1 : NADIA
// Elle existe comme personne avant d'exister comme dilemme. Aucune détresse
// jouée, aucun levier émotionnel appuyé.
export const nadia: Scene = {
  id: 't3.nadia',
  version: 1,
  timelineId: 't3',
  title: 'Nadia',
  regression: 0,
  contentFlags: [],
  beats: [
    {
      text: 'Nadia B. s’assoit face à toi. Une trentaine d’années, un dossier fin sous le bras.',
    },
    { text: 'Elle ne sourit pas, ne s’excuse pas d’être là.' },
    { text: '« On m’a dit de revenir vous voir directement. »' },
    { text: 'Elle attend, les mains posées sur la table, sans les tordre.' },
    { text: 'Rien, pour l’instant, ne dit qu’elle est différente des autres.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-4' },
};
