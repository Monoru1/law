import type { Content } from '../engine';
import { principles } from './principles'; import { observationRules } from './observations'; import { scenes } from './timelines/t1'; import { timeline } from './timelines/t1/meta';
export const content: Content = {version:'1.0.0',scenes,principles,observations:observationRules,order:[...timeline.order]};
export const copy = {
  home:{tagline:'Chaque choix laisse une trace.',start:'Commencer',resume:'Reprendre',laws:'Ma loi'},
  onboarding:[{text:'Ceci n’est pas un test.'},{text:'Il n’y a pas de bonne réponse.'},{text:'Il n’y a que les tiennes.'},{text:'THE LAW est une fiction. Elle aborde la mort, le sacrifice et la culpabilité. Tu peux quitter une scène à tout moment.',style:'meta'}],
  end:[{text:'THE LAW'},{text:'Tu as pris {{count:decisions|0}} décisions.'},{text:'La première était un bouton.',requires:{flag:'pressed_button'}},{text:'—'},{text:'Elles étaient toutes les tiennes.'}],
  certainty:'Quelle est ta certitude ?',certaintyLow:'Aucune',certaintyHigh:'Absolue',skip:'Passer',lawIntro:'Ta première loi.',signed:'Signer',rephrase:'Reformuler',decline:'Ne pas signer',declined:[{text:'Tu n’as rien signé.'},{text:'—'},{text:'Tes décisions, elles, restent.'}],return:'Lire ma loi',soon:'Timeline II — La Maison · bientôt.',confirm:'Confirmer',continue:'Continuer',enter:'Entrer',quit:'Quitter',pause:'Pause',back:'Retour à l’accueil',settings:'Paramètres',simple:'Confirmation simple',reduce:'Réduire les animations',font:'Taille du texte',sound:'Son',export:'Exporter (JSON)',erase:'Effacer ma partie',absent:'Cette pièce n’existe pas.',
  confrontation:{maintain:'Maintenir',nuance:'Nuancer',abandon:'Abandonner',silence:'Ne pas répondre',unsignedSign:'Signer',unsignedNo:'Non'},
} as const;
