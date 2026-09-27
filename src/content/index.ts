import type { Content } from '../engine';
import { principles } from './principles';
import { observationRules } from './observations';
import { scenes } from './timelines/t1';
import { timeline } from './timelines/t1/meta';
export const content: Content = {
  version: '1.0.0',
  scenes,
  principles,
  observations: observationRules,
  order: [...timeline.order],
};
export const copy = {
  home: {
    tagline: 'Chaque choix laisse une trace.',
    start: 'Commencer',
    resume: 'Reprendre',
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
      promise: 'Les personnes que tu connais ne sont pas des abstractions.',
      presentation:
        'Ici, les choix ont un visage.\n\nLes mêmes questions — adressées cette fois à ceux que tu reconnais.',
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
  certainty: 'Quelle est ta certitude ?',
  certaintyLow: 'Aucune',
  certaintyHigh: 'Absolue',
  recordNote: 'Consigné au dossier',
  skip: 'Passer',
  lawIntro: 'Ta première loi.',
  signed: 'Signer',
  rephrase: 'Reformuler',
  decline: 'Ne pas signer',
  declined: [
    { text: 'Tu n’as rien signé.' },
    { text: '—' },
    { text: 'Tes décisions, elles, restent.' },
  ],
  return: 'Lire ma loi',
  soon: 'Timeline II — La Maison · bientôt.',
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
} as const;
