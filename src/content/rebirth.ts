import type {
  Content,
  Effect,
  GameState,
  Scene,
  TalkNode,
  TalkReply,
} from '../engine';

export type LocationId =
  | 'apartment'
  | 'school'
  | 'archives'
  | 'interview'
  | 'station'
  | 'court'
  | 'verdict';
export type EvidenceDocument = {
  id: string;
  title: string;
  source: string;
  date: string;
  paragraphs: string[];
  image?: string;
  audio?: string;
  transcript?: string;
};
export const documents: EvidenceDocument[] = [
  {
    id: 'RB-001',
    title: 'La photographie d’Élise',
    source: 'Enveloppe anonyme · tirage non daté',
    date: 'Élise Moreau, 17 ans · 2009',
    image: '/rebirth/elise.svg',
    paragraphs: [
      'Au bord du tirage, une annotation de sa main : « Ce n’est pas parce que je veux partir que je veux disparaître. »',
      'Une adolescente devant un distributeur, un cahier plié sous le bras. Elle regarde quelqu’un hors du cadre. Le dos porte un numéro : VM / 09 / B-17.',
    ],
  },
  {
    id: 'RB-002',
    title: 'La déposition signée',
    source: 'Copie carbone conservée par le déposant',
    date: '26 octobre 2009 · 08 h 42',
    paragraphs: [
      'Déposante : Élise Moreau. Objet : signalement relatif au couloir B du lycée Saint-Just.',
      '« Je n’ai pas vu qui était dans la salle. J’ai entendu un adulte demander qu’on éteigne le téléphone. La porte B-17 était ouverte à 18 h 10. »',
      'Réception et conformité de la copie certifiées par Gabriel Varenne, auxiliaire de greffe. Signature à l’encre, traversant le bord de la feuille carbone.',
    ],
  },
  {
    id: 'RB-003',
    title: 'La version versée au registre',
    source: 'Registre municipal · référence VM / 09 / B-17',
    date: 'Indexation du 27 octobre 2009 · 11 h 06',
    paragraphs: [
      '« Je n’ai vu personne dans la salle. Je n’ai entendu aucun adulte. La porte B-17 était fermée à 18 h 10. »',
      'Sous la transcription figure la reproduction de la signature de Gabriel Varenne.',
      'La rubrique « rectification demandée par la déposante » est vide. L’indexation est postérieure de plus de vingt-six heures à la réception de la copie carbone. Le nom de l’opérateur n’apparaît pas sur cet extrait.',
    ],
  },
  {
    id: 'RB-004',
    title: 'Le fichier E_M_261009',
    source: 'Carte mémoire jointe à l’enveloppe · voix non authentifiée',
    date: 'Fichier daté du 26 octobre 2009',
    audio: '/rebirth/message.wav',
    transcript:
      'Si vous écoutez ceci, c’est qu’ils ont recommencé. Ne cherchez pas mon nom dans le registre. Cherchez ce qu’ils ont changé après la signature. B-dix-sept. La lumière était encore allumée.',
    paragraphs: [
      'Le début est audible. Le canal droit contient la suite, masquée par un bruit électrique. Le rétablir permet une écoute plus intelligible.',
      'La date du fichier est un indice, pas une authentification de la voix. La transcription reste consultable sans lecture audio.',
    ],
  },
  {
    id: 'RB-005',
    title: 'La convocation',
    source: 'Enveloppe anonyme · destinataire Gabriel Varenne',
    date: 'Audience du 31 octobre 2026',
    paragraphs: [
      'TRIBUNAL DE VALOMBRE. Gabriel Varenne est invité à produire les pièces qu’il a certifiées.',
      '« Vous avez certifié les faits. Vous allez maintenant les vérifier. »',
      'La signature imprimée ressemble à la sienne. Aucune référence de greffe ni preuve d’expédition ne permet d’authentifier la convocation.',
    ],
  },
  {
    id: 'RB-006',
    title: 'Le journal de maintenance',
    source: 'Photocopie photographiée par Nora Delmas',
    date: '14 novembre 2018 · 22 h 19',
    paragraphs: [
      'Lycée Saint-Just, aile B. Remplacement d’un cylindre, porte B-17. Intervention demandée par le service municipal des archives.',
      'La ligne de remise des clés porte les initiales S. V. La présence d’une intervention ne prouve pas qui a utilisé la salle.',
      'Nora a gardé cette copie hors de son article. Elle refuse encore d’expliquer qui la lui a remise.',
    ],
  },
  {
    id: 'RB-007',
    title: 'La fiche d’accès de Keller',
    source: 'Message d’Adrien Keller · réseau de service',
    date: '24 octobre 2026 · 23 h 58',
    paragraphs: [
      'Accès exceptionnel au lycée Saint-Just : entrée par la cour technique. Porte B-17 indiquée « inaccessible depuis 2009 ».',
      'La fiche est marquée CONSULTATION NOTIFIÉE AU SERVICE DES ARCHIVES.',
      'Keller écrit : « Je vous ouvre le bâtiment. Ne confondez pas une porte ouverte avec un dossier rouvert. »',
    ],
  },
  {
    id: 'RB-008',
    title: 'La serrure et le scellé',
    source: 'Constat de Gabriel · photographie prise au couloir B',
    date: '25 octobre 2026 · 00 h 17',
    paragraphs: [
      'Le scellé porte la date du 28 octobre 2009. Un trait de poussière s’interrompt devant le cylindre de la serrure.',
      'Sur la tranche du cylindre, un marquage industriel lisible : 2018. Les vis sont récentes, les charnières anciennes.',
      'La porte a pu être ouverte ou entretenue après la fermeture annoncée. Cela ne permet pas de conclure au sort d’Élise.',
    ],
  },
  {
    id: 'RB-009',
    title: 'La photographie récente',
    source: 'Glissée sous la porte B-17 · auteur inconnu',
    date: 'Le panneau d’évacuation visible porte la révision 2026',
    image: '/rebirth/corridor-photo.svg',
    paragraphs: [
      'Le même couloir. Une silhouette debout devant B-17. Le visage est hors champ ; rien ne permet de l’identifier.',
      'La photo contient le panneau de sécurité posé après la réfection de 2026. Ce détail est vérifiable ; la date de prise de vue ne l’est pas.',
      'Au dos : « Cette fois, regardez jusqu’au bout. »',
    ],
  },
];
export const evidenceFlag = (id: string) => `rebirth.proof.${id}`;
export const collectedDocuments = (state: GameState) =>
  documents.filter((doc) => state.flags.includes(evidenceFlag(doc.id)));
const proof = (id: string): Effect[] => [
  { setFlag: evidenceFlag(id) },
  {
    note: {
      kind: 'quote',
      status: 'fact',
      tags: [id],
      text: documents.find((doc) => doc.id === id)!.title,
    },
  },
];
const has = (id: string) => ({ flag: evidenceFlag(id) });
const line = (who: string, text: string) => ({ who, text });
const R = (
  id: string,
  label: string,
  next: string,
  rest: Partial<TalkReply> = {},
): TalkReply => ({ id, label, next, ...rest });
const scene = (slug: string, title: string, nodes: TalkNode[]): Scene => ({
  id: `rebirth.t0.${slug}`,
  version: 1,
  timelineId: 't0',
  title,
  regression: 0,
  contentFlags: ['disparition', 'souvenirs'],
  beats: [],
  input: { kind: 'talk', talk: { start: nodes[0]!.id, nodes } },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
});
const end: TalkNode = { id: 'end', end: 'suite' };
const inspect = (id: string, next: string): TalkNode => ({
  id,
  lines: [
    line(
      'narrator',
      'Tu déplies la pièce. Les bords ont conservé le pli de l’enveloppe.',
    ),
  ],
  ask: {
    replies: [
      R('collect', 'Consigner cette pièce', next, { effects: proof(id) }),
      R('back', 'Revenir sans consigner', next),
    ],
  },
});
const scenes: Scene[] = [
  scene('vingt-trois-quarante-six', '23 h 46 — Le retour', [
    {
      id: 'arrival',
      lines: [
        line(
          'narrator',
          'Valombre, 24 octobre 2026. La pluie a traversé les dix années de ton absence.',
        ),
        line(
          'gabriel',
          'Gabriel Varenne. Trente-quatre ans. Ancien greffier. Les clés tournent encore dans la serrure de mon appartement.',
        ),
        line(
          'narrator',
          'Le plafond porte la même auréole. Au bord de la fenêtre, la chaise que tu n’avais pas emportée. Tu poses ta valise sans allumer le plafonnier.',
        ),
        line(
          'narrator',
          'Sous la porte, un frottement. Une enveloppe vient de s’arrêter contre ta chaussure.',
        ),
      ],
      ask: {
        replies: [
          R('window', 'Regarder par la fenêtre', 'window'),
          R('envelope', 'Ramasser l’enveloppe', 'envelope'),
        ],
      },
    },
    {
      id: 'window',
      lines: [
        line(
          'narrator',
          'Le tramway ne circule plus sur cette ligne. Au bout de la rue, le tribunal est éclairé à un seul étage. Une voiture quitte le trottoir sans mettre ses phares.',
        ),
      ],
      ask: { replies: [R('envelope', 'Ramasser l’enveloppe', 'envelope')] },
    },
    {
      id: 'envelope',
      lines: [
        line(
          'gabriel',
          'Pas de timbre. Mon nom, écrit avec une règle. À l’intérieur, cinq choses que je n’aurais jamais dû recevoir ensemble.',
        ),
      ],
      ask: { replies: [R('open', 'Ouvrir l’enveloppe sur le bureau', 'end')] },
    },
    end,
  ]),
  scene('lenveloppe', 'Les pièces de l’enveloppe', [
    {
      id: 'desk',
      lines: [
        line(
          'narrator',
          'Une photographie. Deux versions d’une même déposition. Une carte mémoire et une convocation. La lampe de bureau hésite, puis tient.',
        ),
        line(
          'gabriel',
          'Élise Moreau. Ce nom, je le connais. Je ne me souviens pas de son visage.',
        ),
      ],
      ask: {
        replies: [
          R('photo', 'Examiner la photographie d’Élise', 'RB-001'),
          R('signed', 'Examiner la déposition signée', 'RB-002'),
          R('summons', 'Examiner la convocation', 'RB-005'),
          R('listen', 'Brancher la carte mémoire', 'end'),
        ],
      },
    },
    inspect('RB-001', 'desk'),
    inspect('RB-002', 'desk'),
    inspect('RB-005', 'desk'),
    end,
  ]),
  scene('le-message', 'Le canal droit', [
    {
      id: 'broken',
      lines: [
        line(
          'narrator',
          'Le fichier dure dix-sept secondes. La piste de gauche s’interrompt après les premiers mots.',
        ),
        line(
          'recording',
          '« Si vous écoutez ceci, c’est qu’ils ont recommencé. »',
        ),
        line(
          'gabriel',
          'Il y a deux canaux. Sur le second, le signal est encore là, sous le grésillement.',
        ),
      ],
      ask: {
        replies: [
          R('restore', 'Isoler le canal droit', 'RB-004'),
          R('leave', 'Garder le fichier sans le restaurer', 'end'),
        ],
      },
    },
    {
      id: 'RB-004',
      lines: [
        line(
          'narrator',
          'Tu sépares les canaux. Les mots ne sont plus coupés ; leur origine reste incertaine.',
        ),
      ],
      ask: {
        replies: [
          R('collect', 'Conserver la transcription restaurée', 'end', {
            effects: proof('RB-004'),
          }),
          R('back', 'Refermer le lecteur sans consigner', 'end'),
        ],
      },
    },
    end,
  ]),
  scene('apres-la-signature', 'Après la signature', [
    {
      id: 'register',
      lines: [
        line(
          'narrator',
          'La référence VM / 09 / B-17 mène au fac-similé d’un ancien registre public, téléchargé avant ton départ. Tu le retrouves sur le disque de ton ordinateur.',
        ),
        line(
          'gabriel',
          'La copie versée au dossier n’est pas celle que j’ai reçue. Mon nom est au même endroit.',
        ),
      ],
      ask: {
        replies: [
          R('original', 'Relire la déposition signée', 'RB-002'),
          R('filed', 'Ouvrir la version du registre', 'RB-003'),
          R('compare', 'Comparer les deux versions', 'comparison', {
            requires: { all: [has('RB-002'), has('RB-003')] },
          }),
          R('leave', 'Poursuivre sans conclure sur la modification', 'end'),
        ],
      },
    },
    inspect('RB-002', 'register'),
    inspect('RB-003', 'register'),
    {
      id: 'comparison',
      lines: [
        line(
          'gabriel',
          '« Je n’ai pas vu qui » est devenu « Je n’ai vu personne ». « Ouverte » est devenu « fermée ».',
        ),
        line(
          'narrator',
          'La signature certifie une réception à 08 h 42. L’autre texte n’entre au registre que le lendemain. Cette copie ne prouve pas qui a fait la modification.',
        ),
        line(
          'gabriel',
          'En 2009, j’avais dix-sept ans. J’étais auxiliaire, pas greffier titulaire. J’ai signé la copie. Qui a signé le reste à ma place ?',
        ),
      ],
      ask: {
        replies: [
          R(
            'record',
            'Consigner la modification postérieure à la réception',
            'end',
            {
              effects: [
                { setFlag: 'rebirth.altered' },
                {
                  note: {
                    kind: 'interpretation',
                    status: 'inference',
                    tags: ['rebirth.altered'],
                    text: 'Les deux textes diffèrent ; l’indexation est postérieure à la réception certifiée. L’auteur de la modification est inconnu.',
                  },
                },
              ],
            },
          ),
        ],
      },
    },
    end,
  ]),
  scene('qui-prevenir', 'Le premier appel', [
    {
      id: 'contact',
      lines: [
        line(
          'narrator',
          'Le téléphone affiche encore le numéro de Nora Delmas, sous un article vieux de quatre ans. Celui d’Adrien Keller n’a pas changé.',
        ),
        line(
          'gabriel',
          'Prévenir quelqu’un, c’est aussi lui dire où je vais. Je ne pourrai pas reprendre cet appel.',
        ),
      ],
      ask: {
        replies: [
          R('nora', 'Contacter Nora Delmas', 'nora', {
            effects: [
              { setFlag: 'rebirth.contact.nora' },
              {
                relationEvent: {
                  characterId: 'nora-delmas',
                  kind: 'promise_made',
                },
              },
            ],
          }),
          R('keller', 'Prévenir Adrien Keller', 'keller', {
            effects: [
              { setFlag: 'rebirth.contact.keller' },
              { setFlag: 'rebirth.archives.warned' },
              {
                relationEvent: {
                  characterId: 'adrien-keller',
                  kind: 'secret_told',
                },
              },
            ],
          }),
          R('alone', 'Garder les documents et enquêter seul', 'alone', {
            effects: [{ setFlag: 'rebirth.contact.alone' }],
          }),
        ],
      },
    },
    {
      id: 'nora',
      lines: [
        line(
          'nora-delmas',
          'Ne m’envoie pas les originaux. Je vais te faire entrer par la cour. Et Gabriel… ne prends pas une absence de dossier pour une absence de faits.',
        ),
        line('gabriel', 'Tu savais pour B-17 ?'),
        line('nora-delmas', 'Je savais pour la serrure. C’est différent.'),
      ],
      ask: {
        replies: [R('copy', 'Examiner la copie que Nora transmet', 'RB-006')],
      },
    },
    inspect('RB-006', 'depart'),
    {
      id: 'keller',
      lines: [
        line(
          'adrien-keller',
          'Je n’ai pas oublié ce couloir. Je vais vous autoriser l’accès. La demande laissera une trace au service des archives.',
        ),
        line('gabriel', 'Et la déposition ?'),
        line(
          'adrien-keller',
          'Apportez les deux copies. Une différence de texte n’est pas encore une preuve de falsification intentionnelle.',
        ),
      ],
      ask: {
        replies: [R('access', 'Examiner l’autorisation de Keller', 'RB-007')],
      },
    },
    inspect('RB-007', 'depart'),
    {
      id: 'alone',
      lines: [
        line(
          'narrator',
          'Tu glisses les originaux dans la doublure de ta veste. Personne ne sait que tu es revenu. Personne ne t’attendra si tu ne ressors pas.',
        ),
        line(
          'gabriel',
          'La grille de livraison fermait mal. Je vais commencer par là.',
        ),
      ],
      ask: {
        replies: [R('leave', 'Prendre la lampe et les copies', 'depart')],
      },
    },
    {
      id: 'depart',
      lines: [
        line(
          'narrator',
          'La pluie a changé de direction. Tu laisses une lumière dans l’appartement, pour donner l’impression que quelqu’un t’attend.',
        ),
      ],
      ask: { replies: [R('go', 'Rejoindre le lycée Saint-Just', 'end')] },
    },
    end,
  ]),
  scene('le-couloir-b', 'Le couloir B', [
    {
      id: 'corridor',
      lines: [
        line(
          'narrator',
          '00 h 17. Sous l’auvent du lycée, la pluie disparaît d’un coup. La ventilation a continué de tourner dans un bâtiment déclaré vide.',
        ),
        {
          ...line(
            'narrator',
            'Nora t’attend devant la grille. Elle a un double de la clé et garde les mains dans ses poches quand tu lui demandes d’où il vient.',
          ),
          requires: { flag: 'rebirth.contact.nora' },
        },
        {
          ...line(
            'narrator',
            'Ton nom est déjà inscrit au poste de garde. Une consigne fraîche exige que tu laisses ton téléphone à l’entrée. Keller a tenu parole ; les archives savent aussi que tu es ici.',
          ),
          requires: { flag: 'rebirth.contact.keller' },
        },
        {
          ...line(
            'narrator',
            'La grille de livraison est condamnée. Il faut contourner le préau et entrer par une fenêtre basse. De la poussière claire reste sur ta manche.',
          ),
          requires: { flag: 'rebirth.contact.alone' },
        },
        line('gabriel', 'B-17. Le scellé a dix-sept ans. La serrure, non.'),
      ],
      ask: {
        replies: [
          R('lock', 'Examiner la serrure de B-17', 'RB-008'),
          R(
            'timeline',
            'Reconstituer la chronologie de la porte',
            'chronology',
            { requires: has('RB-008') },
          ),
          R('leave', 'Avancer sans examiner la porte', 'end'),
        ],
      },
    },
    inspect('RB-008', 'corridor'),
    {
      id: 'chronology',
      lines: [
        line(
          'narrator',
          'Le scellé est daté de 2009. Le cylindre porte 2018. Ce sont deux dates matérielles, pas deux souvenirs.',
        ),
      ],
      ask: {
        replies: [
          R(
            'reopened',
            'La fermeture de 2009 n’exclut pas une intervention en 2018',
            'reopened',
            {
              effects: [
                { setFlag: 'rebirth.door.reopened' },
                {
                  note: {
                    kind: 'interpretation',
                    status: 'inference',
                    tags: ['rebirth.door.reopened'],
                    text: 'Un cylindre daté de 2018 contredit l’absence de toute intervention depuis 2009.',
                  },
                },
              ],
            },
          ),
          R('alive', 'La serrure prouve qu’Élise est revenue', 'uncertain', {
            effects: [
              { setFlag: 'rebirth.hypothesis.elise' },
              {
                note: {
                  kind: 'interpretation',
                  status: 'inference',
                  tags: ['rebirth.hypothesis.elise'],
                  text: 'Gabriel suppose qu’Élise est revenue. La serrure seule ne permet pas de le démontrer.',
                },
              },
            ],
          }),
        ],
      },
    },
    {
      id: 'reopened',
      lines: [
        line(
          'gabriel',
          'Quelqu’un entretient une porte qu’on dit ne plus ouvrir. Je veux le nom sur le bon d’intervention.',
        ),
      ],
      ask: {
        replies: [R('follow', 'Suivre la trace de l’intervention', 'end')],
      },
    },
    {
      id: 'uncertain',
      lines: [
        line(
          'gabriel',
          'Non. Une serrure ne témoigne pas. Elle ne me donne ni un visage ni une date de retour. Je garde cette idée comme hypothèse, pas comme fait.',
        ),
      ],
      ask: {
        replies: [
          R(
            'revise',
            'Revenir à ce que les pièces permettent d’établir',
            'end',
            { effects: [{ setFlag: 'rebirth.hypothesis.revised' }] },
          ),
        ],
      },
    },
    end,
  ]),
  scene('jusquau-bout', 'Regarder jusqu’au bout', [
    {
      id: 'photo',
      lines: [
        line(
          'narrator',
          'Quelque chose passe sous B-17. Pas une ombre : un tirage encore humide sur sa tranche.',
        ),
        line('gabriel', 'Ce panneau d’évacuation n’existait pas en 2009.'),
        line(
          'narrator',
          'Au dos, une phrase : « Cette fois, regardez jusqu’au bout. »',
        ),
      ],
      ask: {
        replies: [
          R('photo', 'Examiner la photographie récente', 'RB-009'),
          R('leave', 'Quitter le lycée sans prendre le tirage', 'end'),
        ],
      },
    },
    inspect('RB-009', 'decision'),
    {
      id: 'decision',
      lines: [
        line(
          'narrator',
          'Derrière la porte, un siège racle le sol. La poignée ne bouge pas.',
        ),
        line(
          'gabriel',
          'Il y a quelqu’un. Je n’ai pas de preuve que c’est elle. Mais quelqu’un attendait ma visite.',
        ),
      ],
      ask: {
        replies: [
          R('preserve', 'Garder l’original à l’abri', 'preserved', {
            effects: [{ setFlag: 'rebirth.photo.preserved' }],
          }),
          R('send-nora', 'Envoyer une copie à Nora', 'shared', {
            requires: { flag: 'rebirth.contact.nora' },
            effects: [
              { setFlag: 'rebirth.photo.shared' },
              {
                relationEvent: {
                  characterId: 'nora-delmas',
                  kind: 'promise_kept',
                },
              },
            ],
          }),
          R('send-keller', 'Signaler la photographie à Keller', 'reported', {
            requires: { flag: 'rebirth.contact.keller' },
            effects: [
              { setFlag: 'rebirth.photo.reported' },
              {
                relationEvent: {
                  characterId: 'adrien-keller',
                  kind: 'truth_told',
                },
              },
            ],
          }),
        ],
      },
    },
    {
      id: 'preserved',
      lines: [
        line(
          'narrator',
          'Tu ranges le tirage entre les deux dépositions. À l’aube, tu chercheras le registre des interventions. Ce qui t’a ramené à Valombre attendra de l’autre côté de cette porte.',
        ),
      ],
      ask: {
        replies: [
          R('close', 'Clore le prologue et conserver le dossier', 'end'),
        ],
      },
    },
    {
      id: 'shared',
      lines: [
        line(
          'nora-delmas',
          'Je garde la copie hors ligne. Ne touche pas à la porte. Demain, demande le registre des interventions à Samuel Veyre. Dis-lui seulement que tu as vu la date.',
        ),
      ],
      ask: {
        replies: [
          R('close', 'Clore le prologue et conserver le dossier', 'end'),
        ],
      },
    },
    {
      id: 'reported',
      lines: [
        line(
          'adrien-keller',
          'Éloignez-vous. Je fais constater la présence du tirage. Il entrera sous votre nom dans le registre.',
        ),
        line(
          'narrator',
          'Un accusé de réception arrive immédiatement. Les archives auront une nouvelle pièce, et sauront que tu l’as trouvée.',
        ),
      ],
      ask: {
        replies: [
          R('close', 'Clore le prologue et conserver le dossier', 'end'),
        ],
      },
    },
    end,
  ]),
];
export const rebirthContent: Content = {
  timelineId: 't0',
  version: 'rebirth.1',
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
export const scenePlaces: Record<
  string,
  {
    location: LocationId;
    ambience: 'apartment' | 'school' | 'silence';
    time: string;
    name: string;
  }
> = Object.fromEntries(
  scenes.map((item, index) => [
    item.id,
    {
      location: index < 5 ? 'apartment' : 'school',
      ambience: index === 6 ? 'silence' : index < 5 ? 'apartment' : 'school',
      time:
        index < 5 ? '24 octobre 2026 · 23 h 46' : '25 octobre 2026 · 00 h 17',
      name: index < 5 ? 'Appartement de Gabriel' : 'Lycée Saint-Just · aile B',
    },
  ]),
);
export const speakers: Record<string, string> = {
  gabriel: 'Gabriel Varenne',
  'nora-delmas': 'Nora Delmas',
  'adrien-keller': 'Adrien Keller',
  recording: 'Voix de l’enregistrement',
};
export const campaign = {
  title: 'Les Archives du silence',
  subtitle:
    'Valombre. Trois affaires classées. Une signature qui ne devrait pas être là.',
  chapter: 'La Fille du couloir B',
  prologue: 'Prologue · Le retour à Valombre',
  warning:
    'Fiction originale. Disparition d’une adolescente, deuil et dissimulation institutionnelle. Tu peux passer une scène ou quitter à tout moment. Aucun dossier réel n’est reproduit.',
  next: 'La suite du dossier est en cours d’écriture. Le prologue est terminé ; tes pièces et tes choix restent conservés.',
  chapters: [
    'La Fille du couloir B',
    'L’Appel de 03 h 17',
    'Les 19 minutes',
    'Le Dernier Greffier',
    'Le Verdict',
  ],
};
export function prologueConclusion(state: GameState): string[] {
  return [
    state.flags.includes('rebirth.altered')
      ? 'Les deux dépositions ont été comparées. Leur différence est consignée ; son auteur reste à identifier.'
      : 'La différence entre les dépositions reste à établir dans ce dossier.',
    state.flags.includes('rebirth.door.reopened')
      ? 'L’hypothèse d’une porte restée intacte depuis 2009 ne tient pas face au cylindre de 2018.'
      : 'La chronologie de B-17 reste ouverte.',
    state.flags.includes('rebirth.contact.nora')
      ? 'Nora possède une trace d’intervention. Elle tait encore l’identité de sa source.'
      : state.flags.includes('rebirth.contact.keller')
        ? 'Keller a ouvert l’accès. Le service des archives a été averti de ton retour.'
        : 'Tu as enquêté sans prévenir d’allié. Aucun témoin ne peut attester ton entrée.',
    state.flags.includes(evidenceFlag('RB-009'))
      ? 'La photographie récente est conservée. La silhouette reste non identifiée.'
      : 'Tu n’as pas conservé la photographie récente.',
  ];
}
