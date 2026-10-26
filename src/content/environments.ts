import type { TalkReply } from '../engine';
import type { FamilyRoom } from './sixieme-place';

export type EnvironmentRoom = FamilyRoom | 'tribunal';
export type EnvironmentQuality = 'high' | 'standard' | 'economy';
export type StageAction = {
  id: string;
  label: string;
  replyId?: string;
  href?: string;
  detail?: string;
  kind?:
    | 'examine'
    | 'open'
    | 'read'
    | 'take'
    | 'listen'
    | 'talk'
    | 'choose'
    | 'move'
    | 'return';
  narrativeId?: string;
  maxDistance?: number;
};

// Only replies already resolved by the engine may become physical interactions.
const bindings: Record<EnvironmentRoom, Record<string, string>> = {
  outside: { entrer: 'entrance', fenetre: 'window', attendre: 'car' },
  table: { assiette: 'sixth-plate', pain: 'bread', henri: 'soup' },
  hall: {
    cadres: 'photographs',
    album: 'album',
    porte: 'door',
    sarah: 'kitchen',
    thomas: 'threshold',
    mireille: 'vestibule',
  },
  album: { negatif: 'negative', consigner: 'photograph' },
  tribunal: {},
};

export function stageActions(
  room: EnvironmentRoom,
  replies: readonly TalkReply[],
  completed: boolean,
): StageAction[] {
  if (room === 'tribunal')
    return [
      {
        id: 'bench',
        label: 'Examiner le banc vide',
        detail:
          'Le bois porte des marques anciennes. Personne n’est assis sur ce banc.',
      },
      {
        id: 'lamp',
        label: 'Regarder la lampe',
        detail:
          'La lumière s’arrête au bord du bureau. Le reste de la salle demeure dans la pénombre.',
      },
      completed
        ? {
            id: 'dossier',
            label: 'Ouvrir La Sixième Place',
            href: '/jouer/sixieme-place',
          }
        : {
            id: 'dossier',
            label: 'Examiner les dossiers scellés',
            detail:
              'Trois dossiers sont posés sur le bureau. Le Greffier n’a pas encore achevé l’ouverture de l’audience.',
          },
    ];
  return replies.flatMap((reply) => {
    const id = bindings[room][reply.id];
    return id ? [{ id, label: reply.label, replyId: reply.id }] : [];
  });
}

export const environmentCopy = {
  labels: {
    album: 'ALBUM',
    dossier: 'LA SIXIÈME PLACE',
    photograph: 'UN REPAS EN FAMILLE',
  },
  quality: 'Qualité du décor',
  high: 'Élevée',
  standard: 'Standard',
  economy: 'Économique',
  flat: 'Utiliser le décor 2D',
  depth: 'Revenir au décor 3D',
  loading: 'Installation du décor… Les actions restent disponibles.',
  unavailable:
    'Le décor 3D est indisponible. Le décor 2D et toutes les actions restent accessibles.',
  look: 'Regarder autour de soi',
  help: 'Faites glisser le regard, ou utilisez les flèches dans la vue. Les mêmes objets sont accessibles ci-dessous au clavier.',
  reset: 'Recentrer le regard',
  accessible: 'Accès aux objets au clavier',
  explore: 'Explorer la pièce',
  dialogue: 'Afficher les dialogues',
  objects: 'Explorer le lieu',
  back: 'Revenir à la vue d’ensemble',
  rooms: {
    tribunal: 'Salle du Tribunal',
    outside: 'Devant la maison',
    hall: 'Couloir de la maison',
    table: 'Salle à manger',
    album: 'Album familial',
  },
  chair:
    'Une lumière au-dessus du bureau. Les paroles du Greffier restent transcrites à l’écran.',
};
