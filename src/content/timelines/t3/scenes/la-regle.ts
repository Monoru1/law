import type { Scene } from '../../../../engine';

// T3 — Scène 6 : LA RÈGLE
// Le geste qui fait basculer T3 : non plus « que ferais-tu ? » mais « quelle
// réponse doit s'appliquer, sans toi, à des gens que tu ne verras jamais ? ».
// Aucune confirmation, aucun retour en arrière — seulement une révision
// possible plus tard, qui coexistera avec ce choix sans jamais l'effacer.
export const laRegle: Scene = {
  id: 't3.la-regle',
  version: 1,
  timelineId: 't3',
  title: 'La règle',
  regression: 1,
  contentFlags: [],
  beats: [
    { text: 'Un formulaire d’une page. Une seule case à remplir.' },
    { text: '« Critère d’attribution — Bureau 4. »' },
    { text: 'En dessous, une ligne vide attend une réponse permanente.' },
    { text: 'Ce que tu écris ici ne te sera plus jamais demandé.' },
    { text: 'Ce sera simplement appliqué.' },
  ],
  input: {
    kind: 'choice',
    confirm: 'tap',
    options: [
      { id: 'anciennete', label: 'Par ordre d’arrivée' },
      { id: 'urgence', label: 'Par degré d’urgence' },
      { id: 'tirage', label: 'Par tirage au sort' },
    ],
  },
  outcomes: [
    {
      when: { optionId: 'anciennete' },
      beats: [
        { text: 'Enregistré.' },
        { text: '—', pauseMs: 1400 },
        { text: 'Le premier arrivé sera le premier servi. Toujours.' },
      ],
      effects: [
        { ruleEnacted: { ruleId: 'attribution', criterionId: 'anciennete' } },
      ],
      fact: 'Tu as fixé le critère d’attribution du bureau à l’ancienneté.',
    },
    {
      when: { optionId: 'urgence' },
      beats: [
        { text: 'Enregistré.' },
        { text: '—', pauseMs: 1400 },
        { text: 'Le plus urgent passera en premier. Toujours.' },
      ],
      effects: [
        { ruleEnacted: { ruleId: 'attribution', criterionId: 'urgence' } },
      ],
      fact: 'Tu as fixé le critère d’attribution du bureau à l’urgence.',
    },
    {
      when: { optionId: 'tirage' },
      beats: [
        { text: 'Enregistré.' },
        { text: '—', pauseMs: 1400 },
        { text: 'Personne ne pourra plus dire que c’était injuste.' },
        { text: 'Personne ne pourra plus dire que c’était juste non plus.' },
      ],
      effects: [
        { ruleEnacted: { ruleId: 'attribution', criterionId: 'tirage' } },
      ],
      fact: 'Tu as fixé le critère d’attribution du bureau au tirage au sort.',
    },
  ],
  followUps: ['certainty'],
  audio: { ambience: 'act-2' },
};
