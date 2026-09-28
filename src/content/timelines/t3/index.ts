import { premierJour } from './scenes/premier-jour';
import { dossierAnciennete } from './scenes/dossier-anciennete';
import { laPause } from './scenes/la-pause';
import { dossierUrgence } from './scenes/dossier-urgence';
import { reunionService } from './scenes/reunion-service';
import { laRegle } from './scenes/la-regle';
import { laFenetre } from './scenes/la-fenetre';

// Actes I (Le Guichet) et II (La Règle) seulement. Actes III-VI restent à
// écrire : voir PROGRESS.md pour l'état exact de ce qui est livré.
export const scenes = [
  premierJour,
  dossierAnciennete,
  laPause,
  dossierUrgence,
  reunionService,
  laRegle,
  laFenetre,
];
