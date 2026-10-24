import type { Content, Scene, TalkNode, TalkReply } from '../engine';

// THE TRIBUNAL: LA CONVOCATION
//
// The opening of the new canon (docs/rebirth/canon-2026/00-BIBLE-DU-TRIBUNAL.md).
// This file implements only the prologue the bible calls "L'audience est
// ouverte": the player sits in an almost-empty courtroom, the Clerk speaks
// twice, a first exchange is recorded (including silence), and a sealed
// dossier is set down. Dossiers I-III and the final trial are NOT written
// here — see docs/rebirth/canon-2026/AUDIT-PRODUCTION.md for what remains.
//
// Reuses the established `t0` namespace the way src/content/rebirth.ts does,
// so no closed enum (scene/save schema `timelineId`) needs to change. Scene
// IDs are isolated under `tribunal.*` and never collide with `rebirth.t0.*`
// or the historical `t0.*` IDs.
//
// Narration-only nodes (no `ask`/`write` of their own) may freely chain
// through `next`, including straight into a node that itself carries `end`:
// `src/engine/talk.ts`'s `visibleLines`/`visibleTrailNodes` fold every node
// narrated since the player's last answer into what the UI renders, so
// nothing here needs an answer-less filler step just to stay visible.

const line = (who: string, text: string) => ({ who, text });
const R = (
  id: string,
  label: string,
  next: string,
  rest: Partial<TalkReply> = {},
): TalkReply => ({ id, label, next, ...rest });
const scene = (slug: string, title: string, nodes: TalkNode[]): Scene => ({
  // Mirrors src/content/rebirth.ts's `rebirth.t0.<slug>` shape so the
  // existing sceneSchema id pattern (`^(?:rebirth\.)?t[0-4]\.[a-z-]+$`)
  // needs no change; see scripts/contracts.ts for the registry wiring.
  id: `tribunal.t0.${slug}`,
  version: 1,
  timelineId: 't0',
  title,
  regression: 0,
  contentFlags: ['convocation'],
  beats: [],
  input: { kind: 'talk', talk: { start: nodes[0]!.id, nodes } },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
});

const scenes: Scene[] = [
  scene('ouverture', 'L’audience est ouverte', [
    {
      id: 'noir',
      lines: [
        line('narrator', 'Noir complet.'),
        line('narrator', 'Un bruit de chaise, quelque part devant toi.'),
        line('narrator', 'Des pas, mesurés, qui s’arrêtent.'),
        line(
          'narrator',
          'Une respiration, très discrète. La tienne, ou une autre.',
        ),
      ],
      ask: { replies: [R('continue', 'Rester immobile', 'lumiere')] },
    },
    {
      id: 'lumiere',
      lines: [
        line(
          'narrator',
          'Une lumière s’allume, lentement, au-dessus d’un banc vide.',
        ),
        line(
          'narrator',
          'La salle d’audience est presque vide. Froide. Trop grande pour une seule personne.',
        ),
        line('greffier', 'Vous pouvez ouvrir les yeux.'),
      ],
      ask: { replies: [R('continue', 'Ouvrir les yeux', 'promesse')] },
    },
    {
      id: 'promesse',
      lines: [
        line('narrator', 'Silence.'),
        line(
          'greffier',
          'Nous n’allons pas vous demander ce que vous auriez fait.',
        ),
        line('narrator', 'Pause.'),
        line('greffier', 'Nous allons vous donner l’occasion de le faire.'),
      ],
      ask: {
        replies: [
          R('demander', 'Demander pourquoi vous êtes ici', 'r-demander'),
          R(
            'contester',
            'Contester : « Je n’ai rien à faire ici »',
            'r-contester',
          ),
          {
            id: 'silence',
            label: '…',
            next: 'r-silence',
            silent: true,
          },
        ],
      },
    },
    {
      id: 'r-demander',
      lines: [
        line(
          'greffier',
          'Vous le saurez au moment où ce sera utile de le savoir.',
        ),
        line(
          'narrator',
          'Il ne précise pas davantage. Un dossier glisse déjà vers toi.',
        ),
      ],
      effects: [
        {
          note: {
            kind: 'question',
            status: 'fact',
            tags: ['tribunal-ouverture'],
            text: 'A demandé pourquoi il était convoqué.',
          },
        },
      ],
      next: 'dossier',
    },
    {
      id: 'r-contester',
      lines: [
        line('greffier', 'Peut-être.'),
        line(
          'greffier',
          'Vous pourrez le dire, tout à l’heure, devant une preuve.',
        ),
      ],
      effects: [
        {
          note: {
            kind: 'refusal',
            status: 'fact',
            tags: ['tribunal-ouverture'],
            text: 'A contesté sa présence sans attendre de preuve.',
          },
        },
      ],
      next: 'dossier',
    },
    {
      id: 'r-silence',
      lines: [
        line('narrator', 'Rien ne vient.'),
        line('greffier', 'Ce n’est pas une faute.'),
      ],
      effects: [
        {
          note: {
            kind: 'silence',
            status: 'fact',
            tags: ['tribunal-ouverture'],
          },
        },
      ],
      next: 'dossier',
    },
    {
      id: 'dossier',
      lines: [
        line(
          'narrator',
          'Un dossier est posé devant toi. Une étiquette, à l’encre, sur la couverture.',
        ),
        line('narrator', 'LA SIXIÈME PLACE.'),
        line('greffier', 'L’audience est suspendue. Pas terminée.'),
      ],
      end: 'suite',
    },
  ]),
  scene('audience-suspendue', 'L’audience est suspendue', [
    {
      id: 'registre',
      lines: [
        line(
          'narrator',
          'Trois dossiers reposent sur le pupitre, chacun scellé.',
        ),
        line(
          'narrator',
          'Un seul porte une étiquette lisible : LA SIXIÈME PLACE.',
        ),
        line(
          'greffier',
          'Les deux autres ne sont pas encore instruits. Vous y reviendrez.',
        ),
        line(
          'narrator',
          'Le banc vide attend. Il attendra le temps qu’il faudra.',
        ),
      ],
      end: 'suite',
    },
  ]),
];

export const tribunalContent: Content = {
  timelineId: 't0',
  version: 'tribunal.1',
  scenes,
  principles: [],
  observations: [],
  order: scenes.map((item) => item.id),
  flow: {
    confrontationSceneId: '',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    codaSceneId: scenes.at(-1)!.id,
  },
};

export const speakers: Record<string, string> = {
  greffier: 'Le Greffier',
};

export const campaign = {
  title: 'THE LAW: REBIRTH — Le Tribunal',
  subtitle: 'Vous avez été convoqué. Chaque choix laisse une trace.',
  warning:
    'Fiction originale. Horreur psychologique humaine, sans surnaturel. Deuil, responsabilité, violence domestique rare mais marquante. Tu peux quitter ou passer une scène à tout moment.',
  next: 'Un dossier est scellé : LA SIXIÈME PLACE. Son instruction n’est pas encore jouable — voir le registre.',
};
