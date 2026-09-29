import type { Scene } from '../../../../engine';

// T3 — Acte VI, scène 2 : 417
// Le motif aboutit : dossiers → nombre → espace → personne. Jamais
// verbalisé comme "motif" — seulement montré.
export const quatreCentDixSept: Scene = {
  id: 't3.quatre-cent-dix-sept',
  version: 1,
  timelineId: 't3',
  title: '417',
  regression: 1,
  contentFlags: [],
  beats: [
    {
      text: 'Dans le couloir de l’administration centrale, un tableau affiche un chiffre mensuel.',
    },
    { text: '« Dossiers traités — Bureau 4 : 417. »' },
    { text: 'Un chiffre parmi d’autres colonnes, d’autres bureaux.' },
    {
      text: 'Par la fenêtre du couloir, tu comptes les immeubles visibles jusqu’à l’horizon. Plus de quatre cents fenêtres, rien que sur ce pâté de maisons.',
    },
    { text: '417, ce n’est presque rien, à cette échelle.' },
    { text: '—', pauseMs: 1800 },
    {
      text: 'Puis tu repenses à un seul nom, sur un seul dossier, en bas d’une seule page.',
    },
    { text: 'Nadia B. — dossier numéro 417.' },
  ],
  input: { kind: 'passage' },
  outcomes: [{ when: { any: true }, beats: [] }],
  audio: { ambience: 'act-6' },
};
