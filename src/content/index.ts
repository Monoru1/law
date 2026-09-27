import type { Content } from '../engine';
import { principles } from './principles';
import { observationRules } from './observations';
import { scenes } from './timelines/t1';
import { timeline } from './timelines/t1/meta';
export const content: Content = {
  timelineId: 't1',
  version: '1.1.0',
  scenes,
  principles,
  observations: observationRules,
  order: [...timeline.order],
  flow: {
    confrontationSceneId: 't1.confrontation',
    pasEncoreSceneId: 't1.pas-encore',
    confrontationUnsignedSceneId: 't1.confrontation-non-signee',
    checkpointSceneId: 't1.le-protocole',
    codaSceneId: 't1.coda',
  },
};
export const copy = {
  home: {
    tagline: 'Chaque choix laisse une trace.',
    start: 'Commencer',
    resume: 'Reprendre',
    summary: 'Revoir la fin',
    laws: 'Ma loi',
  },
  doors: [
    {
      timelineId: 't1' as const,
      index: 'I',
      name: 'LA PIÈCE',
      promise: 'Des inconnus. Des principes. Un bilan.',
      presentation: null as null,
    },
    {
      timelineId: 't2' as const,
      index: 'II',
      name: 'LA MAISON',
      promise: 'Des visages. Des promesses. Une nuit.',
      presentation:
        'Ici, les choix ont un visage.\n\nTu les connais. Pas bien. Assez.',
    },
    {
      timelineId: 't3' as const,
      index: 'III',
      name: 'LA VILLE',
      promise: 'Tes décisions ont une échelle.',
      presentation:
        'Ce que tu as décidé seul prend une autre dimension quand d\u2019autres en portent les conséquences.',
    },
    {
      timelineId: 't4' as const,
      index: 'IV',
      name: 'LE TRIBUNAL',
      promise: 'Tu plaides devant toi-même.',
      presentation:
        'L\u2019odeur de l\u2019information revient ici.\n\nUne confrontation avec l\u2019ensemble de tes décisions — et avec ce que tu en fais aujourd\u2019hui.',
    },
  ] as const,
  onboarding: [
    { text: 'Ceci n’est pas un test.' },
    { text: 'Il n’y a pas de bonne réponse.' },
    { text: 'Il n’y a que les tiennes.' },
    {
      text: 'THE LAW est une fiction. Elle aborde la mort, le sacrifice et la culpabilité. Tu peux quitter une scène à tout moment.',
      style: 'meta',
    },
  ],
  end: [
    { text: 'THE LAW' },
    { text: 'Tu as pris {{count:decisions|0}} décisions.' },
    {
      text: 'La première était un bouton.',
      requires: { flag: 'pressed_button' },
    },
    { text: '—' },
    { text: 'Elles étaient toutes les tiennes.' },
  ],
  // The house ends on the people, not on a count of completed content.
  endT2: [
    { text: 'LA MAISON' },
    { text: 'Tu as pris {{count:decisions|0}} décisions.' },
    {
      text: 'La première, c’était une chaise.',
      requires: { visited: 't2.les-nouvelles' },
    },
    { text: '—' },
    { text: 'Eux aussi s’en souviennent.' },
  ],
  certainty: 'Quelle est ta certitude ?',
  certaintyLow: 'Aucune',
  certaintyHigh: 'Absolue',
  recordNote: 'Consigné au dossier',
  skip: 'Passer',
  signed: 'Signer',
  rephrase: 'Reformuler',
  decline: 'Ne pas signer',
  declined: [
    { text: 'Tu n’as rien signé.' },
    { text: '—' },
    { text: 'Tes décisions, elles, restent.' },
  ],
  return: 'Lire ma loi',
  toHouse: 'Entrer dans la maison',
  confirm: 'Confirmer',
  resume: 'Reprendre',
  recordConfirm: 'Consigner',
  enter: 'Entrer',
  quit: 'Quitter',
  pause: 'Pause',
  back: 'Retour à l’accueil',
  settings: 'Paramètres',
  reduce: 'Réduire les animations',
  font: 'Taille du texte',
  sound: 'Son',
  export: 'Exporter (JSON)',
  exportHouse: 'Exporter La Maison (JSON)',
  erase: 'Effacer ma partie',
  eraseConfirm: 'Confirmer l’effacement',
  absent: 'Cette pièce n’existe pas.',
  confrontation: {
    maintain: 'Maintenir',
    nuance: 'Nuancer',
    abandon: 'Abandonner',
    silence: 'Ne pas répondre',
    unsignedSign: 'Signer',
    unsignedNo: 'Non',
  },
  playtestIntro: {
    pseudoLabel: 'Ton nom ou pseudonyme',
    pseudoPlaceholder: 'ex. Atlas, Marie D., un prénom…',
    pseudoHint: 'Pseudonyme recommandé.',
    consentTitle: 'Ce que nous enregistrons',
    consentBody:
      "Le playtest enregistre tes décisions, le temps de réflexion et les changements de sélection, ta certitude quand elle est demandée, tes justifications écrites, ainsi que les lois que tu signes et les confrontations qui s'ensuivent. Un rapport factuel est transmis automatiquement au créateur à la fin de la partie. Aucun diagnostic psychologique n'est produit.",
    consentAccept: 'J\u2019accepte et je commence',
    consentDecline: 'Retour',
  },
  people: {
    camille: 'Camille',
    sem: 'Sem',
    omar: 'Omar',
    mila: 'Mila',
  } as Record<string, string>,
  // Factual names of what the player did toward someone. Never a score.
  relations: {
    promise_made: 'Promesse faite',
    promise_kept: 'Promesse tenue',
    promise_broken: 'Promesse non tenue',
    lie_made: 'Mensonge',
    lie_revealed: 'Mensonge découvert',
    truth_told: 'Vérité dite',
    secret_kept: 'Secret gardé',
    secret_told: 'Secret révélé',
    chose_over: 'Choisi·e',
    protected: 'Aidé·e',
    sacrificed: 'Pas choisi·e',
  } as Record<string, string>,
  threshold: {
    locked: 'La maison s’ouvre après la pièce.',
    toRoom: 'Aller à la pièce',
    enter: 'Entrer dans la maison',
    enterWithoutReport: 'Entrer sans rapport',
    reportNote:
      'Comme pour La Pièce, un rapport factuel sera transmis à la fin de La Maison.',
    unreadable:
      'La pièce n’a pas pu être relue. La maison attend qu’elle le soit.',
  },
} as const;
