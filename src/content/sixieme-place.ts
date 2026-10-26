import type { Content, Effect, Scene, TalkNode, TalkReply } from '../engine';

// Chapter one only. These observations do not establish Lucie's identity.
const line = (who: string, text: string) => ({ who, text });
const flag = (name: string): Effect => ({ setFlag: `family.${name}` });
const note = (tag: string, text: string): Effect => ({
  note: { kind: 'observation', status: 'fact', tags: [tag, 'family'], text },
});
const reply = (
  id: string,
  label: string,
  next: string,
  rest: Partial<TalkReply> = {},
): TalkReply => ({ id, label, next, ...rest });
const back = (next: string) => ({
  replies: [reply('retour', 'Revenir dans la pièce', next)],
});
const scene = (slug: string, title: string, nodes: TalkNode[]): Scene => ({
  id: `tribunal.t0.${slug}`,
  version: 1,
  timelineId: 't0',
  title,
  regression: 0,
  contentFlags: ['deuil', 'secret-familial'],
  beats: [],
  input: { kind: 'talk', talk: { start: nodes[0]!.id, nodes } },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
});

const scenes = [
  scene('maison-retour', 'La maison Delcourt', [
    {
      id: 'voiture',
      lines: [
        line(
          'narrator',
          'La pluie a repris après le cimetière. Quinze ans sans revenir. La lumière de la salle à manger traverse les volets.',
        ),
        line(
          'narrator',
          'Tu es Alex Delcourt. À l’intérieur, ton père, ta sœur, ton frère et ta tante attendent.',
        ),
      ],
      ask: {
        replies: [
          reply('attendre', 'Rester un instant dans la voiture', 'attente', {
            once: true,
          }),
          reply('fenetre', 'Observer la fenêtre éclairée', 'fenetre', {
            once: true,
          }),
          reply('entrer', 'Traverser le gravier et entrer', 'seuil'),
        ],
      },
    },
    {
      id: 'attente',
      lines: [
        line(
          'narrator',
          'La clé est encore dans ta main. Personne ne vient te chercher. Dans le pare-brise, la maison se brouille avec la pluie.',
        ),
      ],
      effects: [
        note('family.waited', 'Alex est resté dans la voiture avant d’entrer.'),
      ],
      ask: { replies: [reply('revenir', 'Regarder la maison', 'voiture')] },
    },
    {
      id: 'fenetre',
      lines: [
        line(
          'narrator',
          'Henri redresse une assiette près de la fenêtre. Sarah lui parle, dos à toi. Il lui répond sans lever la tête. Tu n’entends pas les mots.',
        ),
      ],
      effects: [
        note(
          'family.window',
          'Depuis la voiture, Alex a vu Henri redresser une assiette, sans entendre sa conversation avec Sarah.',
        ),
      ],
      ask: {
        replies: [reply('revenir', 'Se détourner de la fenêtre', 'voiture')],
      },
    },
    {
      id: 'seuil',
      lines: [
        line(
          'narrator',
          'Une odeur de café réchauffé. Tes chaussures font une tache sombre sur les carreaux. Sarah s’interrompt au milieu d’une phrase.',
        ),
        line('sarah', 'Alex. Tu as trouvé la route.'),
      ],
      ask: {
        replies: [
          reply('questionner', '« De quoi vous parliez ? »', 'sarah-seuil', {
            effects: [flag('threshold-question')],
          }),
          reply('laisser', 'Poser ton manteau sans la questionner', 'manteau', {
            effects: [flag('threshold-quiet')],
          }),
        ],
      },
    },
    {
      id: 'sarah-seuil',
      lines: [
        line('sarah', 'Du repas. Pas maintenant, s’il te plaît.'),
        line(
          'narrator',
          'Elle prend ton manteau mais garde les yeux sur la poignée de la salle à manger.',
        ),
      ],
      effects: [
        note(
          'family.threshold',
          'Alex a interrogé Sarah sur la conversation interrompue à son arrivée.',
        ),
      ],
      next: 'manteau',
    },
    {
      id: 'manteau',
      lines: [
        line(
          'narrator',
          'Au portemanteau, un imperméable bleu que tu ne reconnais pas. Mireille vient reprendre son écharpe dans une poche.',
        ),
        line(
          'mireille',
          'C’est le mien. Ta mère me l’avait donné. J’aurais dû le mettre plus souvent.',
        ),
        line(
          'narrator',
          'Thomas apparaît dans l’encadrement, une corbeille de pain à la main.',
        ),
        line(
          'thomas',
          'Tu peux m’aider ? Je ne sais jamais où elle rangeait les couteaux.',
        ),
      ],
      ask: {
        replies: [reply('aider', 'Prendre la corbeille avec Thomas', 'fin')],
      },
    },
    {
      id: 'fin',
      lines: [
        line(
          'narrator',
          'Henri vous attend déjà à table. Il a laissé une chaise pour toi.',
        ),
      ],
      end: 'suite',
    },
  ]),
  scene('maison-table', 'Six couverts', [
    {
      id: 'table',
      lines: [
        line(
          'narrator',
          'Cinq personnes. Six assiettes. La place près de la fenêtre est dressée comme les autres.',
        ),
        line(
          'thomas',
          'Elle faisait toujours trop de café. On va encore en boire pendant trois jours.',
        ),
      ],
      ask: {
        replies: [
          reply('pain', 'Passer le pain à Mireille', 'mireille', {
            once: true,
          }),
          reply('henri', 'Demander à Henri ce qu’il a préparé', 'soupe', {
            once: true,
          }),
          reply('assiette', 'Examiner la sixième place', 'place'),
        ],
      },
    },
    {
      id: 'mireille',
      lines: [
        line(
          'mireille',
          'Merci. Ta mère coupait les croûtons beaucoup trop gros. Henri râlait, puis il les finissait.',
        ),
        line(
          'narrator',
          'Un sourire traverse la table. Henri abaisse les yeux vers son bol.',
        ),
      ],
      effects: [
        note(
          'family.bread',
          'Alex a passé le pain à Mireille et entendu son souvenir d’Éliane.',
        ),
      ],
      ask: back('table'),
    },
    {
      id: 'soupe',
      lines: [
        line('henri', 'La soupe de ta mère. Enfin, j’ai essayé.'),
        line(
          'thomas',
          'Il a appelé Sarah trois fois pour savoir combien de pommes de terre.',
        ),
        line('henri', 'Deux fois.'),
        line(
          'narrator',
          'Il rapproche la soupière de toi. Le couvercle tremble légèrement contre la faïence.',
        ),
      ],
      effects: [
        note(
          'family.soup',
          'Henri a préparé la soupe d’Éliane avec l’aide de Sarah.',
        ),
      ],
      ask: back('table'),
    },
    {
      id: 'place',
      lines: [
        line(
          'narrator',
          'Un verre propre. Une serviette pliée. Aucun nom. Tu avances la main vers l’assiette.',
        ),
        line('henri', 'Laisse-la.'),
        line(
          'thomas',
          'Même les assiettes ont droit à leur minute de silence ?',
        ),
        line(
          'narrator',
          'Sarah cesse de couper son pain. Le petit bruit du couteau disparaît.',
        ),
      ],
      effects: [
        note(
          'family.six-settings',
          'Six couverts étaient dressés pour cinq convives. Henri a demandé de laisser la sixième assiette en place.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'public',
            '« Pour qui est cette place ? » — demander devant tous',
            'public',
            {
              effects: [
                flag('public'),
                {
                  relationEvent: { characterId: 'sarah', kind: 'secret_told' },
                },
              ],
            },
          ),
          reply(
            'observe',
            'Retirer ta main et observer sans insister',
            'observe',
            { effects: [flag('observe')] },
          ),
          reply(
            'private',
            'Proposer à Sarah de l’aider à la cuisine pour lui parler seul à seul',
            'private',
            {
              effects: [
                flag('private'),
                { relationEvent: { characterId: 'sarah', kind: 'protected' } },
              ],
            },
          ),
        ],
      },
    },
    {
      id: 'public',
      lines: [
        line(
          'henri',
          'Ta mère la mettait. Je ne vais pas changer ça aujourd’hui.',
        ),
        line('sarah', 'On vient de l’enterrer. Tu peux attendre une soirée.'),
        line('thomas', 'Attends. Ce n’est pas une réponse.'),
        line(
          'narrator',
          'Thomas te regarde désormais, pas l’assiette. Sarah emporte les bols sans te demander le tien.',
        ),
      ],
      effects: [
        note(
          'family.table-choice',
          'Alex a demandé publiquement à qui était destinée la sixième place. Thomas a relevé l’absence de réponse ; Sarah a interrompu l’échange.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'observe',
      lines: [
        line(
          'narrator',
          'Henri reprend sa cuillère. Sarah laisse échapper son souffle. Le verre de la sixième place reste vide.',
        ),
        line(
          'mireille',
          'Je vais chercher un peu d’air. Dans le couloir, si tu as besoin.',
        ),
      ],
      effects: [
        note(
          'family.table-choice',
          'Alex n’a pas insisté à table. Mireille lui a proposé de la retrouver dans le couloir.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'private',
      lines: [
        line(
          'narrator',
          'Tu prends deux bols et suis Sarah jusqu’à la cuisine.',
        ),
        line(
          'sarah',
          'Merci de ne pas l’avoir fait devant lui. Cette place, c’était maman. Je ne peux pas tout expliquer ce soir.',
        ),
        line('alex', 'Tout ?'),
        line(
          'sarah',
          'Regarde les photos, dans le couloir. Ensuite on parlera.',
        ),
      ],
      effects: [
        note(
          'family.table-choice',
          'Alex a parlé à Sarah en privé. Elle lui a indiqué les photographies du couloir sans expliquer la sixième place.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'fin',
      lines: [
        line(
          'narrator',
          'Le repas se termine sans que personne touche au sixième couvert. Tu te lèves. Le couloir est encore éclairé.',
        ),
      ],
      end: 'suite',
    },
  ]),
  scene('maison-couloir', 'Ce qui manque au mur', [
    {
      id: 'couloir',
      lines: [
        line(
          'narrator',
          'Derrière toi, la vaisselle. Devant toi, l’escalier. Le mur des photos paraît plus nu que dans ton souvenir.',
        ),
      ],
      ask: {
        replies: [
          reply('cadres', 'Approcher les marques des cadres', 'cadres', {
            once: true,
          }),
          reply('album', 'Ouvrir l’album sur la console', 'album', {
            once: true,
          }),
          reply('porte', 'Examiner la porte de l’étage', 'porte', {
            once: true,
          }),
          reply('sarah', 'Retrouver Sarah près de la cuisine', 'sarah', {
            once: true,
          }),
          reply('thomas', 'Écouter Thomas sur le seuil', 'thomas', {
            once: true,
          }),
          reply(
            'mireille',
            'Rejoindre Mireille près du vestibule',
            'mireille',
            { once: true },
          ),
          reply('arreter', 'Fermer le carnet pour ce soir', 'fin'),
        ],
      },
    },
    {
      id: 'cadres',
      lines: [
        line(
          'narrator',
          'Trois rectangles plus clairs dans le papier peint. Les pointes sont encore en place. La poussière s’arrête net là où les cadres étaient suspendus.',
        ),
        line(
          'narrator',
          'Cela indique des cadres retirés. Pas encore quand, ni par qui.',
        ),
      ],
      effects: [
        note(
          'family.frames',
          'Trois marques rectangulaires et leurs pointes sont visibles au mur du couloir.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'album',
      lines: [
        line(
          'narrator',
          'L’album s’ouvre sur un repas dans cette maison. À droite, le papier a été coupé aux ciseaux. Un bras demeure près du bord.',
        ),
        line(
          'narrator',
          'Une pochette de négatifs est glissée derrière la page. Tu peux rapprocher la bande de la lampe, sans en déduire une identité.',
        ),
      ],
      ask: {
        replies: [
          reply('negatif', 'Tenir le négatif devant la lampe', 'negatif'),
          reply(
            'consigner',
            'Consigner seulement la photographie découpée',
            'photo',
          ),
        ],
      },
    },
    {
      id: 'negatif',
      lines: [
        line(
          'narrator',
          'Six silhouettes autour de la table sur cette vue du négatif. Leurs visages sont trop petits pour une identification fiable. Le bord du tirage présente le même motif de nappe.',
        ),
        line(
          'narrator',
          'Tu remets la bande dans sa pochette et notes exactement ce que tu as vu.',
        ),
      ],
      effects: [
        note(
          'FAM-02',
          'FAM-02 — Négatif trouvé derrière la photographie dans l’album du couloir, non daté. Six silhouettes visibles ; identités non établies. Même motif de nappe que le tirage découpé.',
        ),
      ],
      next: 'photo',
    },
    {
      id: 'photo',
      lines: [
        line(
          'narrator',
          'Tu consignes la découpe et sa provenance. Une image manquante ne donne pas encore son nom à une personne.',
        ),
      ],
      effects: [
        note(
          'FAM-01',
          'FAM-01 — Photographie découpée, album sur la console du couloir, non datée. Un bras subsiste au bord droit. Auteur et date de la découpe inconnus.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'porte',
      lines: [
        line(
          'narrator',
          'La poignée s’abaisse, la porte ne cède pas. Henri apparaît au pied de l’escalier.',
        ),
        line('henri', 'Une fuite. On a fermé en attendant les travaux.'),
        line(
          'narrator',
          'Tu ne vois ni eau ni travaux depuis le palier. Cela ne suffit pas à contredire son explication.',
        ),
      ],
      effects: [
        note(
          'family.locked-room',
          'La porte de l’étage est verrouillée. Henri a invoqué une fuite ; Alex n’a pas de relevé d’entretien pour vérifier.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'sarah',
      route: [{ when: { flag: 'family.private' }, next: 'sarah-prive' }],
      next: 'sarah-fermee',
    },
    {
      id: 'sarah-prive',
      lines: [
        line(
          'sarah',
          'Petite, je détestais rester assise pour les photos. Maman promettait qu’on pourrait sortir après.',
        ),
        line(
          'narrator',
          'Elle regarde l’album. Une petite clé dépasse de sa poche. Tu ne sais pas quelle porte elle ouvre.',
        ),
        line('sarah', 'Demain. Laisse-moi jusqu’à demain.'),
      ],
      effects: [
        note(
          'family.sarah-key',
          'Après leur échange privé, Alex a vu une petite clé dans la poche de Sarah. Sa serrure n’est pas identifiée.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'sarah-fermee',
      lines: [
        line('sarah', 'Je range. Pas ce soir, Alex.'),
        line(
          'narrator',
          'Elle rentre dans la cuisine. Tu restes de l’autre côté de la porte.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'thomas',
      route: [{ when: { flag: 'family.public' }, next: 'thomas-allie' }],
      next: 'thomas-souvenir',
    },
    {
      id: 'thomas-allie',
      lines: [
        line(
          'thomas',
          'Tu as entendu ? Il a parlé de maman. Jamais de la personne qui devait s’asseoir.',
        ),
        line(
          'narrator',
          'Il baisse la voix pour que la cuisine ne l’entende pas.',
        ),
        line(
          'thomas',
          'Si tu trouves quelque chose, viens me voir avant de le laisser tout expliquer.',
        ),
      ],
      effects: [
        note(
          'family.thomas-offer',
          'Après la question publique, Thomas a proposé de confronter une éventuelle découverte avec Alex.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'thomas-souvenir',
      lines: [
        line(
          'thomas',
          'Quand tu es parti, elle gardait encore ta tasse. Celle avec l’anse recollée. Je crois qu’elle est toujours en haut.',
        ),
        line('narrator', 'Il ne te demande pas pourquoi tu n’es pas revenu.'),
      ],
      ask: back('couloir'),
    },
    {
      id: 'mireille',
      route: [{ when: { flag: 'family.observe' }, next: 'mireille-proche' }],
      next: 'mireille-fatiguee',
    },
    {
      id: 'mireille-proche',
      lines: [
        line(
          'mireille',
          'Merci de ne pas avoir crié. Ici, quand on crie, personne n’écoute plus les mots.',
        ),
        line('narrator', 'Elle replie son écharpe très lentement.'),
        line(
          'mireille',
          'Il faudra parler. À tête reposée. Je ne repars pas avant demain.',
        ),
      ],
      effects: [
        note(
          'family.mireille-stays',
          'Après le silence à table, Mireille a proposé une conversation le lendemain et annoncé qu’elle restait.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'mireille-fatiguee',
      lines: [
        line(
          'mireille',
          'Elle aurait été contente de vous avoir tous ici. Excuse-moi. C’est une phrase qu’on dit quand on ne sait pas quoi dire.',
        ),
      ],
      ask: back('couloir'),
    },
    {
      id: 'fin',
      lines: [
        line(
          'narrator',
          'La lumière du couloir reste allumée. À table, personne n’a retiré l’assiette.',
        ),
        line(
          'narrator',
          'Fin du premier chapitre jouable. L’enquête, la cassette, la lettre et la confrontation avec Henri ne sont pas encore disponibles. Le dossier n’est pas clos.',
        ),
      ],
      end: 'suite',
    },
  ]),
];

export const familyContent: Content = {
  timelineId: 't0',
  version: 'family.1',
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
export const familyCampaign = {
  title: 'THE LAW: REBIRTH — La Sixième Place',
  subtitle: 'La maison Delcourt · Premier chapitre',
  warning:
    'Deuil et secret familial. Tu peux quitter ou passer une scène à tout moment.',
  next: 'Premier chapitre consigné. Le dossier reste ouvert. La suite de l’enquête et la confrontation avec Henri ne sont pas encore jouables.',
};
export const familySpeakers: Record<string, string> = {
  alex: 'Alex',
  henri: 'Henri · ton père',
  sarah: 'Sarah · ta sœur',
  thomas: 'Thomas · ton frère',
  mireille: 'Mireille · ta tante',
};
export type FamilyRoom = 'outside' | 'hall' | 'table' | 'album';
export type FamilyStaging = {
  room: FamilyRoom;
  anchors?: Record<string, [number, number]>;
  cue?: 'door' | 'steps' | 'paper';
  caption: string;
};
// Spatial layout and sound cues are authored with the narrative, never inferred by the UI.
export function familyStaging(
  sceneId: string | undefined,
  nodeId: string | undefined,
): FamilyStaging {
  if (sceneId?.endsWith('maison-retour')) {
    if (['voiture', 'attente', 'fenetre'].includes(nodeId ?? ''))
      return {
        room: 'outside',
        caption:
          'Pluie légère sur le pare-brise. Voix indistinctes à l’intérieur.',
        anchors:
          nodeId === 'voiture'
            ? { attendre: [22, 78], fenetre: [72, 38], entrer: [48, 65] }
            : undefined,
      };
    return {
      room: 'hall',
      caption: 'Gravier sous les pas, puis un bruit de porte.',
      cue: nodeId === 'seuil' ? 'door' : undefined,
    };
  }
  if (sceneId?.endsWith('maison-table'))
    return {
      room: 'table',
      caption:
        nodeId === 'place' ||
        ['public', 'observe', 'private'].includes(nodeId ?? '')
          ? 'Le bruit du couteau s’est arrêté. La pluie continue.'
          : 'Pluie contre la fenêtre. La vaisselle vient de la cuisine.',
      anchors:
        nodeId === 'table'
          ? { pain: [18, 40], henri: [50, 30], assiette: [74, 73] }
          : undefined,
    };
  if (['album', 'negatif', 'photo'].includes(nodeId ?? ''))
    return {
      room: 'album',
      caption: 'Papier froissé sous les doigts. La lampe reste fixe.',
      cue: 'paper',
    };
  return {
    room: 'hall',
    caption: 'La pluie derrière les vitres. De la vaisselle dans la cuisine.',
    anchors:
      nodeId === 'couloir'
        ? {
            cadres: [20, 28],
            album: [29, 68],
            porte: [62, 32],
            sarah: [83, 53],
            thomas: [46, 70],
            mireille: [10, 60],
            arreter: [73, 85],
          }
        : undefined,
  };
}
