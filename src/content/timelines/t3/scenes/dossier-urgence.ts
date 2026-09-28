import type { Scene } from '../../../../engine';

// T3 — Scène 4 : DOSSIER URGENCE
// Le second cas contredit le premier sans le nommer. Le joueur découvre par
// lui-même la tension entre deux critères qu'il vient d'utiliser au hasard.
export const dossierUrgence: Scene = {
  id: 't3.dossier-urgence',
  version: 1,
  timelineId: 't3',
  title: 'Dossier Urgence',
  regression: 0,
  contentFlags: [],
  beats: [
    { text: 'Un dossier déposé ce matin.' },
    { text: 'Une femme, deux enfants, une nuit dehors annoncée à moins deux.' },
    {
      text: 'Douze autres dossiers attendent depuis plus longtemps qu’elle.',
    },
    { text: 'Le formulaire ne demande pas depuis quand tu attends dehors.' },
  ],
  input: {
    kind: 'binary',
    confirm: 'tap',
    options: [
      { id: 'ordre', label: 'Respecter l’ordre d’arrivée' },
      { id: 'urgence', label: 'La faire passer avant les autres' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'ordre' },
      beats: [
        { text: 'Le dossier reprend sa place dans la file.' },
        { text: '—', pauseMs: 1200 },
        { text: 'Douze personnes attendaient plus longtemps. C’est vrai.' },
      ],
      fact: 'Tu as respecté l’ordre d’arrivée malgré l’urgence.',
    },
    {
      when: { optionId: 'urgence' },
      beats: [
        { text: 'Le dossier passe en tête.' },
        { text: '—', pauseMs: 1200 },
        {
          text: 'Personne ne t’a demandé si les douze autres avaient froid aussi.',
          style: 'whisper',
        },
      ],
      fact: 'Tu as fait passer un dossier urgent avant les autres.',
    },
  ],
  audio: { ambience: 'act-1' },
};
