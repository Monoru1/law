import type { TalkReply } from '../engine';
import {
  visibleTrailNodes,
  talkOf,
  evaluate,
  type Scene,
  type GameState,
} from '../engine';
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
  cue?: 'paper' | 'door' | 'steps';
  reaction?: 'inspect' | 'approach' | 'talk';
};

// Only replies already resolved by the engine may become physical interactions.
const bindings: Record<EnvironmentRoom, Record<string, string>> = {
  outside: { entrer: 'entrance', fenetre: 'window', attendre: 'car' },
  table: { assiette: 'sixth-plate', pain: 'bread', henri: 'soup' },
  hall: {
    cassette: 'cassette',
    entretien: 'maintenance',
    lettre: 'letter',
    appeler: 'phone',
    tapis: 'rug',
    approcher: 'door',
    distance: 'threshold',
    demain: 'threshold',
    demander: 'vestibule',
    ecouter: 'kitchen',
    montrer: 'letter',
    procedure: 'maintenance',
    rendre: 'letter',
    secours: 'phone',
    toucher: 'door',
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
  sceneId?: string,
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
    return id
      ? [
          {
            id,
            label: reply.label,
            replyId: reply.id,
            kind: (['cassette'].includes(reply.id)
              ? 'listen'
              : ['entretien', 'lettre', 'procedure'].includes(reply.id)
                ? 'read'
                : [
                      'sarah',
                      'thomas',
                      'mireille',
                      'ecouter',
                      'demander',
                    ].includes(reply.id)
                  ? 'talk'
                  : ['entrer', 'distance', 'demain', 'approcher'].includes(
                        reply.id,
                      )
                    ? 'move'
                    : 'examine') as StageAction['kind'],
            narrativeId: `${sceneId ?? room}/${reply.id}`,
            cue: (['lettre', 'entretien', 'procedure'].includes(reply.id)
              ? 'paper'
              : reply.id === 'entrer'
                ? 'door'
                : 'steps') as StageAction['cue'],
            reaction: 'inspect' as const,
            maxDistance: 12,
          },
        ]
      : [];
  });
}

export function stageViews(room: EnvironmentRoom) {
  if (room === 'hall')
    return [
      { id: 'album', label: 'Approcher de la console' },
      { id: 'door', label: 'Approcher du palier' },
    ];
  if (room === 'table')
    return [{ id: 'sixth-plate', label: 'Approcher de la sixième place' }];
  if (room === 'tribunal')
    return [{ id: 'dossier', label: 'Approcher du bureau' }];
  return [];
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

export type DialogueRecording = {
  src: `/voices/${string}`;
  durationMs: number;
  position: [number, number, number];
};
// Actor recordings can be added by stable authored line ID. No synthetic filler.
export const dialogueRecordings: Record<string, DialogueRecording> = {};
export const dialogueLineId = (
  sceneId: string,
  nodeId: string,
  index: number,
) => `${sceneId}/${nodeId}/${index}`;
export function voiceSequence(
  scene: Scene | undefined,
  state: GameState,
): DialogueRecording[] {
  if (!scene) return [];
  const talk = talkOf(scene);
  const track = state.talk[scene.id];
  if (!talk || !track) return [];
  return visibleTrailNodes(talk, track).flatMap((node) =>
    (node.lines ?? []).flatMap((line, index) => {
      const recording =
        dialogueRecordings[dialogueLineId(scene.id, node.id, index)];
      return recording && (!line.requires || evaluate(line.requires, state))
        ? [recording]
        : [];
    }),
  );
}
