import type {
  Content,
  Effect,
  Scene,
  TalkNode,
  TalkReply,
  Condition,
  GameState,
} from '../engine';
import { familyContent, type FamilyStaging } from './sixieme-place';
const line = (who: string, text: string) => ({ who, text });
const flag = (name: string): Effect => ({ setFlag: `family.${name}` });
const has = (name: string): Condition => ({ flag: `family.${name}` });
const noted = (tag: string): Condition => ({ noted: { tag } });
const note = (tag: string, text: string): Effect => ({
  note: { kind: 'quote', status: 'fact', tags: [tag, 'family'], text },
});
const reply = (
  id: string,
  label: string,
  next: string,
  rest: Partial<TalkReply> = {},
): TalkReply => ({ id, label, next, ...rest });
const back = { replies: [reply('retour', 'Revenir à la pièce', 'explorer')] };
const end = (text: string): TalkNode => ({
  id: 'fin',
  lines: [line('narrator', text)],
  end: 'suite',
});
const scene = (slug: string, title: string, nodes: TalkNode[]): Scene => ({
  id: `tribunal.t0.${slug}`,
  timelineId: 't0',
  version: 1,
  title,
  regression: 0,
  contentFlags: ['deuil', 'secret-familial', 'violence'],
  beats: [],
  input: { kind: 'talk', talk: { start: nodes[0]!.id, nodes } },
  outcomes: [{ when: { optionId: 'suite' }, beats: [] }],
});

const scenes = [
  scene('traces-retrouvees', 'Ce qu’Éliane avait gardé', [
    {
      id: 'explorer',
      lines: [
        line(
          'narrator',
          'La maison ne dort pas. Sur la console, une cassette dépasse de l’album. Un tiroir ferme mal. À côté de l’escalier, une chemise porte la mention « Entretien ». Tu peux encore décider de ne pas chercher.',
        ),
      ],
      ask: {
        replies: [
          reply('cassette', 'Écouter la cassette près de l’album', 'cassette', {
            once: true,
          }),
          reply('entretien', 'Lire la fiche d’entretien', 'entretien', {
            once: true,
          }),
          reply('lettre', 'Examiner le fond du tiroir', 'lettre', {
            once: true,
            requires: { any: [noted('FAM-03'), noted('family.sarah-key')] },
          }),
          reply('suivre', 'Retrouver Mireille', 'fin'),
        ],
      },
    },
    {
      id: 'cassette',
      lines: [
        line(
          'narrator',
          'La bande porte au crayon : « Un dimanche ». Le lecteur ralentit quand tu appuies sur la touche. Sur l’enregistrement, une voix d’enfant appelle « Maman ». Une autre compte six assiettes. Aucun visage ne permet de donner un nom à ces voix.',
        ),
        line(
          'narrator',
          'La courroie patine sous le couvercle. Tu notes la déformation mécanique et la provenance de la bande, sans la prendre pour une présence dans la maison.',
        ),
      ],
      effects: [
        note(
          'FAM-03',
          'FAM-03 — Cassette « Un dimanche », conservée dans l’album de la console. Six assiettes évoquées ; voix non identifiées ; vitesse du lecteur instable.',
        ),
      ],
      ask: back,
    },
    {
      id: 'entretien',
      lines: [
        line(
          'narrator',
          'La fiche est datée de la semaine précédente. Elle mentionne une vérification du palier, pas une fuite. Elle ne dit pas pourquoi la porte est fermée. Tu conserves les deux formulations, sans faire dire au papier ce qu’il ne dit pas.',
        ),
      ],
      effects: [
        note(
          'FAM-06',
          'FAM-06 — Fiche d’entretien du palier, semaine précédant les funérailles. Aucune fuite mentionnée ; motif du verrouillage non établi.',
        ),
      ],
      ask: back,
    },
    {
      id: 'lettre',
      lines: [
        line(
          'narrator',
          'Sous le fond décollé du tiroir, une enveloppe adressée à Éliane, cachet d’il y a deux ans. Le courrier est signé Lucie. « Je ne veux pas revenir tant qu’il faudra faire comme si rien ne s’était passé. Si tu veux me parler, tu sais comment me joindre. »',
        ),
        line(
          'narrator',
          'L’adresse, le cachet et la signature sont visibles. Tu ne sais pas qui a placé la lettre ici, ni si Éliane l’a lue.',
        ),
      ],
      effects: [
        note(
          'FAM-04',
          'FAM-04 — Lettre signée Lucie, adressée à Éliane, cachet de deux ans avant les funérailles. Trouvée sous le fond du tiroir de la console. Elle refuse un retour qui effacerait le passé ; auteur de la dissimulation inconnu.',
        ),
      ],
      ask: back,
    },
    end(
      'Mireille est près du vestibule. Tu peux lui demander ce qu’elle sait, ou la laisser partir.',
    ),
  ]),
  scene('mireille-procedure', 'La copie de Mireille', [
    {
      id: 'mireille',
      lines: [
        line(
          'mireille',
          'Je savais où écrire. C’est ça, le pire. Je ne peux pas dire que je ne savais rien.',
        ),
        line(
          'narrator',
          'Elle tient une chemise pliée dans son sac. Ses doigts restent sur la fermeture.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'demander',
            'Lui demander ce qu’elle a conservé, à voix basse',
            'copie',
          ),
          reply(
            'accuser',
            'L’accuser d’avoir choisi le silence devant la famille',
            'depart',
          ),
          reply('laisser', 'La laisser partir sans l’interroger', 'silence'),
        ],
      },
    },
    {
      id: 'copie',
      lines: [
        line(
          'mireille',
          'Une copie. Une procédure familiale, après l’accident. Une accusation est devenue une séparation. Le document n’établit pas que Lucie a provoqué l’accident. Henri a raconté le reste comme une certitude.',
        ),
        line(
          'narrator',
          'Elle te laisse la copie, pas une explication complète. Tu notes que c’est Mireille qui la fournit et que l’original manque.',
        ),
      ],
      effects: [
        note(
          'FAM-05',
          'FAM-05 — Copie de procédure fournie par Mireille. Séparation après une accusation familiale ; responsabilité de Lucie non établie par cette copie. Original non consulté.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'depart',
      lines: [
        line(
          'mireille',
          'Tu as raison de me le reprocher. Mais je ne vais pas faire ça ici, devant lui.',
        ),
        line(
          'narrator',
          'Elle referme son sac et part avec la chemise. Tu n’as pas reçu le document.',
        ),
      ],
      effects: [
        flag('mireille-left'),
        note(
          'family.mireille-left',
          'Alex a accusé Mireille devant la famille. Elle est partie sans remettre sa copie.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'silence',
      lines: [
        line(
          'narrator',
          'Tu lui ouvres la porte. La chemise reste dans son sac.',
        ),
      ],
      effects: [
        note(
          'family.mireille-unasked',
          'Alex a laissé partir Mireille sans demander sa copie.',
        ),
      ],
      next: 'fin',
    },
    end(
      'Sarah t’attend près de la cuisine. Elle a entendu le moteur de la voiture de Mireille.',
    ),
  ]),
  scene('sarah-limites', 'Ce que Sarah peut dire', [
    {
      id: 'sarah',
      lines: [
        line(
          'sarah',
          'Si tu veux savoir, pose une question. Si tu veux un coupable pour ce soir, je ne peux rien pour toi.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'ecouter',
            'Lui demander ce que Lucie souhaite aujourd’hui',
            'confidence',
            { requires: { any: [has('private'), noted('FAM-05')] } },
          ),
          reply(
            'montrer',
            'Présenter la lettre sans la lire à voix haute',
            'confidence',
            { requires: noted('FAM-04') },
          ),
          reply(
            'exiger',
            'Exiger qu’elle explique son silence devant tous',
            'fermeture',
          ),
          reply('attendre', 'Respecter sa demande d’attendre', 'attente'),
        ],
      },
    },
    {
      id: 'confidence',
      lines: [
        line(
          'sarah',
          'Elle est vivante. Je l’ai vue l’année dernière. Elle m’a demandé de ne pas la ramener ici comme une preuve. Je l’ai promis à elle. Pas à papa.',
        ),
        line(
          'narrator',
          'Sarah te donne un numéro et te demande de ne pas le transmettre. Ce témoignage n’est pas un consentement de Lucie.',
        ),
      ],
      effects: [
        flag('lucie-number'),
        note(
          'FAM-07',
          'FAM-07 — Sarah déclare avoir rencontré Lucie l’année précédente. Selon Sarah, Lucie refuse d’être ramenée publiquement dans la maison. Numéro confié à Alex, non divulgué.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'fermeture',
      lines: [
        line(
          'sarah',
          'Non. Tu ne décideras pas pour elle en me forçant à parler.',
        ),
        line(
          'narrator',
          'Elle ferme la porte de la cuisine. Tu n’as pas obtenu de numéro ni de témoignage détaillé.',
        ),
      ],
      effects: [
        flag('sarah-closed'),
        note(
          'family.sarah-closed',
          'Alex a exigé une explication publique de Sarah. Elle a refusé et fermé la porte.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'attente',
      lines: [
        line(
          'sarah',
          'Merci. Ça ne répare rien. Mais merci de l’avoir entendu.',
        ),
      ],
      effects: [flag('waited-sarah')],
      next: 'fin',
    },
    end(
      'Le téléphone est sur la console. Henri n’est plus dans la salle à manger.',
    ),
  ]),
  scene('lucie-appel', 'Une personne, pas une pièce', [
    {
      id: 'telephone',
      lines: [
        line(
          'narrator',
          'Tu peux choisir de laisser Lucie en dehors de cette nuit. Un nom sur une lettre n’autorise personne à parler à sa place.',
        ),
      ],
      ask: {
        replies: [
          reply('appeler', 'Appeler Lucie en privé', 'lucie', {
            requires: has('lucie-number'),
          }),
          reply('attendre', 'Ne pas appeler cette nuit', 'attente'),
        ],
      },
    },
    {
      id: 'lucie',
      lines: [
        line(
          'lucie',
          'Alex. Sarah m’a prévenue que tu étais là. Je veux bien parler. Je ne veux pas que ma voix serve à le coincer sans que je le sache.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'consentement',
            'Demander ce qu’elle autorise à transmettre',
            'accord',
          ),
          reply(
            'haut-parleur',
            'Lui demander de témoigner tout de suite devant Henri',
            'refus',
          ),
          reply(
            'respecter',
            'Ne rien lui demander de plus cette nuit',
            'respect',
          ),
        ],
      },
    },
    {
      id: 'accord',
      lines: [
        line(
          'lucie',
          'Tu peux dire que je suis vivante et que je refuse ce silence. Je t’enverrai mes mots. Pas une réconciliation. Pas un pardon.',
        ),
        line('narrator', 'Tu lui relis exactement ces limites. Elle confirme.'),
      ],
      effects: [
        flag('lucie-consent'),
        note(
          'family.lucie-permission',
          'Lucie autorise Alex à transmettre qu’elle est vivante et refuse le silence. Elle n’autorise ni visite imposée ni promesse de réconciliation.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'refus',
      lines: [
        line(
          'lucie',
          'Non. Ce n’est pas à moi de faire votre scène de famille. Bonne nuit, Alex.',
        ),
        line('narrator', 'Elle raccroche. Aucun témoignage ne t’a été confié.'),
      ],
      effects: [
        flag('lucie-refused'),
        note(
          'family.lucie-refused',
          'Alex a demandé un témoignage immédiat devant Henri. Lucie a refusé et interrompu l’appel.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'respect',
      lines: [line('lucie', 'Alors laisse-moi choisir quand rappeler.')],
      effects: [flag('lucie-boundary')],
      next: 'fin',
    },
    {
      id: 'attente',
      lines: [
        line(
          'narrator',
          'Le téléphone reste posé. Aucun appel à Lucie n’est consigné.',
        ),
      ],
      effects: [
        note('family.no-call', 'Alex n’a pas appelé Lucie pendant la nuit.'),
      ],
      next: 'fin',
    },
    end('Dans la cuisine, un tiroir se ferme. Il est 02 h 14.'),
  ]),
  scene('cuisine-risque', 'Avant le geste', [
    {
      id: 'palier',
      lines: [
        line(
          'narrator',
          'Henri se tient près de la porte de cave. La première marche est juste derrière lui. Un coin du tapis est relevé. Il avance la main vers tes documents. La sortie vers le couloir reste libre.',
        ),
        line(
          'henri',
          'Donne-moi ça. Tu ne sais pas ce que tu es en train de faire.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'distance',
            'Reculer dans le couloir et garder une distance',
            'distance',
          ),
          reply(
            'tapis',
            'Lui demander de s’écarter pour remettre le tapis à plat',
            'tapis',
          ),
          reply(
            'sarah',
            'Appeler Sarah pour ne pas rester seul avec lui',
            'sarah',
            { requires: { not: has('sarah-closed') } },
          ),
          reply('approcher', 'Rester près de lui, devant l’escalier', 'proche'),
          reply(
            'demain',
            'Quitter la cuisine et remettre la discussion à demain',
            'demain',
          ),
        ],
      },
    },
    {
      id: 'distance',
      lines: [
        line(
          'narrator',
          'Tu recules jusqu’au couloir. Le passage est dégagé entre vous.',
        ),
      ],
      effects: [flag('safe-distance')],
      next: 'fin',
    },
    {
      id: 'tapis',
      lines: [
        line(
          'narrator',
          'Henri fait un pas de côté. Tu remets le coin du tapis à plat, puis tu te relèves à distance de la cave.',
        ),
      ],
      effects: [flag('safe-distance'), flag('rug-flat')],
      next: 'fin',
    },
    {
      id: 'sarah',
      lines: [
        line(
          'narrator',
          'Sarah vient à la porte. Henri s’écarte de l’escalier pour la regarder.',
        ),
      ],
      effects: [flag('sarah-witness'), flag('safe-distance')],
      next: 'fin',
    },
    {
      id: 'proche',
      lines: [
        line(
          'narrator',
          'Tu restes à portée de ses mains. Le tapis est toujours relevé. Derrière lui, l’escalier descend sans palier intermédiaire.',
        ),
      ],
      effects: [flag('near-stairs')],
      next: 'fin',
    },
    {
      id: 'demain',
      lines: [
        line(
          'narrator',
          'Tu sors sans le toucher. Tu gardes ce que tu as trouvé, mais tu ne lui poses pas tes questions cette nuit.',
        ),
      ],
      effects: [
        flag('avoided'),
        note(
          'family.avoided',
          'Alex a quitté la cuisine sans confronter Henri cette nuit.',
        ),
      ],
      next: 'fin',
    },
    end('La prochaine parole ne sera pas effacée par le silence de la maison.'),
  ]),
  scene('henri-confrontation', 'Ce que tu voulais obtenir', [
    {
      id: 'entree',
      route: [{ when: has('avoided'), next: 'evitee' }],
      next: 'henri',
    },
    {
      id: 'henri',
      lines: [
        line(
          'henri',
          'Tu arrives après quinze ans et tu veux tout juger en une nuit.',
        ),
        line(
          'narrator',
          'Tu peux poser les documents à distance, demander à quelqu’un de rester, ou mettre fin à l’échange. Repousser Henri est un geste physique : près de la cave, il peut le faire tomber.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'lettre',
            'Présenter la lettre sans avancer vers Henri',
            'aveu',
            { requires: noted('FAM-04') },
          ),
          reply(
            'procedure',
            'Lui opposer la copie remise par Mireille',
            'aveu',
            { requires: noted('FAM-05') },
          ),
          reply(
            'rendre',
            'Lui rendre l’original de la lettre pour arrêter l’échange',
            'brulee',
            { requires: noted('FAM-04') },
          ),
          reply(
            'repousser',
            'Repousser Henri pour garder la lettre — risque de chute',
            'geste',
            { requires: noted('FAM-04') },
          ),
          reply('arreter', 'Ne pas prolonger la confrontation', 'arretee'),
        ],
      },
    },
    {
      id: 'aveu',
      lines: [
        line(
          'henri',
          'J’ai gardé les courriers. Au début, je pensais éviter que ça recommence. Ensuite, je ne savais plus comment revenir sur ce que j’avais dit.',
        ),
        line(
          'narrator',
          'Il reconnaît les courriers retenus. Il ne prouve pas que son accusation d’autrefois était vraie.',
        ),
      ],
      effects: [
        flag('henri-admitted'),
        note(
          'family.henri-admission',
          'Henri a reconnu avoir retenu des courriers. Il n’a fourni aucune preuve nouvelle de la responsabilité de Lucie.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'brulee',
      lines: [
        line(
          'narrator',
          'Tu lui remets la lettre. Henri la déchire puis en laisse les morceaux dans le feu du poêle. Tu avais consigné son contenu, mais l’original ne sera plus consultable.',
        ),
        line('henri', 'Ça n’aurait dû arriver à personne.'),
      ],
      effects: [
        flag('letter-destroyed'),
        note(
          'family.letter-destroyed',
          'Alex a rendu la lettre à Henri ; Henri a détruit l’original. Le relevé d’Alex reste une transcription, pas un original.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'geste',
      effects: [
        flag('pushed'),
        note(
          'family.push',
          'Alex a choisi de repousser Henri pour garder la lettre.',
        ),
      ],
      route: [
        {
          when: { all: [has('near-stairs'), { not: has('safe-distance') }] },
          next: 'chute',
        },
      ],
      next: 'blesse',
    },
    {
      id: 'blesse',
      lines: [
        line(
          'narrator',
          'Henri heurte le chambranle. Il reste debout, une main contre son bras. L’escalier était plus loin de vous. Sarah l’entend jurer.',
        ),
        line('narrator', 'Il n’est pas tombé ; cela n’a pas annulé ton geste.'),
      ],
      effects: [flag('injury-minor')],
      next: 'fin',
    },
    {
      id: 'chute',
      lines: [
        line(
          'narrator',
          'Son talon prend le coin relevé. Il recule dans l’escalier. Un choc, puis le bruit d’un objet qui roule. Tu n’avais pas le contrôle de ce qui suivrait la poussée.',
        ),
      ],
      effects: [
        flag('fall'),
        note(
          'family.fall',
          'Après la poussée d’Alex près de la cave et du tapis relevé, Henri a chuté dans l’escalier.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'arretee',
      lines: [
        line(
          'narrator',
          'Tu cesses de répondre. Henri reste près de la porte. La conversation s’arrête ; aucune preuve n’a été présentée par ce silence.',
        ),
      ],
      effects: [
        flag('avoided'),
        note(
          'family.avoided',
          'Alex a arrêté la confrontation sans toucher Henri ni présenter de pièce.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'evitee',
      lines: [
        line(
          'narrator',
          'La cuisine reste derrière toi. Tu n’y retournes pas pour provoquer une réponse. Henri n’a pas été confronté cette nuit.',
        ),
      ],
      next: 'fin',
    },
    end(
      'Le silence qui suit n’a pas le même sens selon ce que tu viens de faire.',
    ),
  ]),
  scene('apres-le-choc', 'Rester ou appeler', [
    {
      id: 'entree',
      route: [
        { when: has('fall'), next: 'cave' },
        { when: has('injury-minor'), next: 'bras' },
      ],
      next: 'sans-choc',
    },
    {
      id: 'cave',
      lines: [
        line(
          'narrator',
          'Henri est au bas de l’escalier. Tu ne peux pas savoir de là quelle est la gravité de ses blessures. Le téléphone est dans ta poche. Aucun compte à rebours ne décide à ta place.',
        ),
      ],
      ask: {
        replies: [
          reply('secours', 'Appeler les secours et décrire la chute', 'appel'),
          reply(
            'toucher',
            'Descendre et rester auprès de lui en touchant son épaule',
            'contact',
          ),
          reply(
            'sarah',
            'Faire venir Sarah et lui demander d’appeler',
            'appel',
          ),
          reply(
            'attendre',
            'Rester à distance sans appeler pour le moment',
            'attente',
          ),
        ],
      },
    },
    {
      id: 'contact',
      lines: [
        line(
          'narrator',
          'Tu t’agenouilles près d’Henri. Du sang a traversé le tissu à son épaule ; ta main s’en tache quand tu le touches. Tu appelles Sarah. Elle arrive en entendant ta voix. Tu peux lui raconter le geste, mais pas l’effacer.',
        ),
      ],
      effects: [
        flag('blood-contact'),
        note(
          'family.blood-contact',
          'Alex a touché l’épaule blessée d’Henri après la chute ; sa main a été tachée de sang à ce moment-là.',
        ),
      ],
      ask: {
        replies: [
          reply('secours', 'Appeler les secours auprès d’Henri', 'appel'),
          reply('sarah', 'Demander à Sarah d’appeler', 'appel'),
        ],
      },
    },
    {
      id: 'appel',
      lines: [
        line(
          'narrator',
          'Tu donnes l’adresse et décris ce que tu as vu. La personne au téléphone demande que quelqu’un reste sur place. Tu attends avec Sarah. Au loin, une sirène finit par se rapprocher.',
        ),
        line(
          'narrator',
          'À l’arrivée de l’équipe, l’appel et la chute sont consignés dans le relevé d’intervention. Ce relevé ne dit pas à lui seul qui a poussé Henri, ni comment il se remettra de ses blessures.',
        ),
      ],
      effects: [
        flag('help-called'),
        note(
          'FAM-09',
          'FAM-09 — Relevé d’intervention consécutif à l’appel après la chute. Chute et appel consignés ; cause du geste à établir par les dépositions.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'attente',
      lines: [
        line(
          'narrator',
          'Tu restes en haut. Sarah finit par te rejoindre. Aucun appel n’est consigné dans ton journal à ce stade ; tu ne peux pas présenter un rapport de secours que tu n’as pas reçu.',
        ),
      ],
      effects: [
        note(
          'family.no-help-call',
          'Alex est resté à distance après la chute sans consigner d’appel aux secours.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'bras',
      lines: [
        line('henri', 'Ne me touche pas.'),
        line(
          'narrator',
          'Tu peux appeler une aide, mais personne n’est tombé dans l’escalier. Aucun rapport de chute n’est ajouté au carnet.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'sans-choc',
      lines: [
        line(
          'narrator',
          'Personne n’est tombé. Le prix de cette nuit se lit ailleurs : dans la lettre, les portes fermées et les personnes qui ont accepté ou refusé de parler.',
        ),
      ],
      next: 'fin',
    },
    end('Au petit matin, on te demande de dire ce qui s’est passé.'),
  ]),
  scene('declaration-alex', 'Tes mots, maintenant', [
    {
      id: 'entree',
      route: [{ when: has('pushed'), next: 'geste' }],
      next: 'sans-geste',
    },
    {
      id: 'geste',
      lines: [
        line(
          'narrator',
          'Une déclaration peut décrire ton geste ou l’omettre. L’omission sera conservée à côté du journal de la poussée. Elle ne réécrira pas la scène.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'exact',
            '« Je l’ai repoussé pour garder la lettre. »',
            'exact',
          ),
          reply(
            'omission',
            '« Il a perdu l’équilibre. » — omettre la poussée',
            'omission',
          ),
          reply(
            'silence',
            'Ne pas faire de déclaration pour le moment',
            'silence',
            { silent: true },
          ),
        ],
      },
    },
    {
      id: 'exact',
      lines: [
        line('narrator', 'Tu relis les mots avant qu’ils soient consignés.'),
      ],
      effects: [
        note(
          'FAM-08',
          'FAM-08 — Déclaration d’Alex : « Je l’ai repoussé pour garder la lettre. »',
        ),
        flag('declaration-exact'),
      ],
      next: 'fin',
    },
    {
      id: 'omission',
      lines: [
        line(
          'narrator',
          'La phrase est consignée. Le geste que tu as choisi reste enregistré séparément.',
        ),
      ],
      effects: [
        note(
          'FAM-08',
          'FAM-08 — Déclaration d’Alex : « Il a perdu l’équilibre. » La poussée n’est pas mentionnée dans cette déclaration.',
        ),
        flag('declaration-omission'),
      ],
      next: 'fin',
    },
    {
      id: 'silence',
      lines: [
        line(
          'narrator',
          'Aucun témoignage d’Alex n’est fabriqué à la place de ce silence.',
        ),
      ],
      effects: [
        note(
          'family.declaration-silence',
          'Alex n’a pas fait de déclaration à ce stade de la nuit.',
        ),
      ],
      next: 'fin',
    },
    {
      id: 'sans-geste',
      lines: [
        line(
          'narrator',
          'Tu n’as pas repoussé Henri. Tu peux consigner ce que tu as effectivement choisi de faire.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'consigner',
            'Consigner l’absence de geste physique',
            'nonviolent',
          ),
          reply('silence', 'Ne pas ajouter de déclaration', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'nonviolent',
      lines: [
        line(
          'narrator',
          'Cette déclaration n’est pas un jugement sur le reste de la nuit.',
        ),
      ],
      effects: [
        note(
          'FAM-08',
          'FAM-08 — Déclaration d’Alex : aucun geste physique envers Henri pendant cette nuit.',
        ),
      ],
      next: 'fin',
    },
    end('La table attend encore. Les assiettes n’ont pas été rangées.'),
  ]),
  scene('chaise-apres', 'Les places qui restent', [
    {
      id: 'table',
      lines: [
        line(
          'narrator',
          'Même table. Six assiettes. Henri n’est plus à sa chaise. Son absence ne raconte pas à elle seule ce qui lui est arrivé.',
        ),
      ],
      route: [
        { when: has('fall'), next: 'absence' },
        { when: has('letter-destroyed'), next: 'cendres' },
        { when: has('lucie-consent'), next: 'lettre-lucie' },
      ],
      next: 'attente',
    },
    {
      id: 'absence',
      lines: [
        line(
          'sarah',
          'Je veux entendre comment il s’est retrouvé en bas. Pas seulement où nous l’avons trouvé.',
        ),
        line(
          'narrator',
          'Le dossier conserve la chute, ton geste, l’appel s’il a eu lieu et ta déclaration si tu en as fait une. Aucune conclusion sur l’état médical d’Henri n’est ajoutée.',
        ),
      ],
      next: 'permission',
    },
    {
      id: 'cendres',
      lines: [
        line(
          'narrator',
          'L’original de la lettre manque. Ton relevé subsiste. Le poêle est froid ; cela ne rend pas le papier.',
        ),
      ],
      next: 'permission',
    },
    {
      id: 'lettre-lucie',
      lines: [
        line(
          'narrator',
          'Un message écrit de Lucie arrive. Ses mots ne promettent pas de revenir dans cette maison.',
        ),
      ],
      next: 'permission',
    },
    {
      id: 'attente',
      lines: [
        line(
          'narrator',
          'Tu as laissé certaines questions ouvertes. Les personnes qui n’ont pas parlé ne deviennent pas coupables de ce silence.',
        ),
      ],
      next: 'permission',
    },
    {
      id: 'permission',
      route: [{ when: has('lucie-consent'), next: 'temoignage' }],
      next: 'fin',
    },
    {
      id: 'temoignage',
      lines: [
        line(
          'lucie',
          'Je suis vivante. J’ai demandé qu’on cesse de raconter ma vie sans moi. Vous pouvez transmettre ces deux phrases, et seulement elles.',
        ),
      ],
      effects: [
        note(
          'FAM-10',
          'FAM-10 — Déclaration écrite de Lucie, transmise avec son accord : « Je suis vivante. J’ai demandé qu’on cesse de raconter ma vie sans moi. » Aucune promesse de visite ou de pardon.',
        ),
      ],
      next: 'fin',
    },
    end(
      'La convocation est posée près de ton carnet. Les pièces qui manquent ne sont pas ajoutées au dossier.',
    ),
  ]),
  scene('deposition-retour', 'Première déposition', [
    {
      id: 'greffier',
      lines: [
        line(
          'greffier',
          'Nous allons reprendre ce qui a été consigné. Vous pouvez contester ma formulation. Les pièces ne changeront pas pour me donner raison.',
        ),
      ],
      route: [
        { when: has('declaration-omission'), next: 'contradiction' },
        { when: has('fall'), next: 'chute' },
        { when: has('letter-destroyed'), next: 'lettre' },
        { when: has('lucie-consent'), next: 'consentement' },
        { when: has('avoided'), next: 'evitement' },
      ],
      next: 'traces',
    },
    {
      id: 'contradiction',
      lines: [
        line(
          'greffier',
          'Vous avez déclaré : « Il a perdu l’équilibre. » Le journal conserve aussi votre choix de le repousser pour garder la lettre. Que souhaitez-vous rectifier ?',
        ),
      ],
      ask: {
        replies: [
          reply(
            'rectifier',
            'Rectifier la déposition en nommant la poussée',
            'rectifiee',
          ),
          reply(
            'maintenir',
            'Maintenir la déposition sans ajouter le geste',
            'maintenue',
          ),
          reply('silence', 'Garder le silence devant cet écart', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'chute',
      lines: [
        line(
          'greffier',
          'Henri est tombé après votre poussée, près de l’escalier et du tapis relevé. Je n’en déduis pas que vous vouliez sa chute. Je vous demande de répondre du geste consigné.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'assumer',
            'Assumer le geste sans revendiquer la chute',
            'assumee',
          ),
          reply(
            'contexte',
            'Demander que le contexte reste joint au geste',
            'contexte',
          ),
          reply('silence', 'Ne pas répondre maintenant', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'lettre',
      lines: [
        line(
          'greffier',
          'Vous avez rendu la lettre. Henri l’a détruite. Nous avons votre relevé, pas l’original. Que peut-il encore prouver selon vous ?',
        ),
      ],
      ask: {
        replies: [
          reply(
            'limites',
            'Reconnaître la limite d’une transcription',
            'contexte',
          ),
          reply(
            'attribuer',
            'Distinguer ton choix de rendre et son acte de détruire',
            'assumee',
          ),
          reply('silence', 'Ne pas ajouter de réponse', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'consentement',
      lines: [
        line(
          'greffier',
          'Lucie a autorisé deux phrases. Elle n’a pas promis de revenir ni pardonné à la famille. Souhaitez-vous que son refus d’aller plus loin reste dans votre déposition ?',
        ),
      ],
      ask: {
        replies: [
          reply('limites', 'Joindre ses limites à sa déclaration', 'contexte'),
          reply('silence', 'Ne rien ajouter à ses mots', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'evitement',
      lines: [
        line(
          'greffier',
          'Vous avez interrompu ou évité la confrontation. Aucune poussée ne sera inscrite à votre place. Les questions laissées sans réponse restent ouvertes.',
        ),
      ],
      ask: {
        replies: [
          reply('assumer', 'Assumer ce qui est resté sans réponse', 'assumee'),
          reply('silence', 'Laisser les questions ouvertes', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'traces',
      lines: [
        line(
          'greffier',
          'Nous ne possédons que les actes et les pièces que vous avez laissés entrer dans ce dossier. Leur absence ne me permet pas d’inventer ce que vous auriez fait.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'relire',
            'Demander à relire les traces de la nuit',
            'contexte',
          ),
          reply('silence', 'Ne pas ajouter de déclaration', 'silence', {
            silent: true,
          }),
        ],
      },
    },
    {
      id: 'rectifiee',
      lines: [
        line(
          'greffier',
          'La première version reste lisible. Votre rectification lui est jointe.',
        ),
      ],
      effects: [
        flag('deposition-corrected'),
        note(
          'family.deposition-corrected',
          'Au Tribunal, Alex a rectifié sa déclaration en nommant la poussée omise.',
        ),
      ],
      next: 'table',
    },
    {
      id: 'maintenue',
      lines: [
        line(
          'greffier',
          'Les deux formulations restent au dossier. Je ne vais pas les fusionner.',
        ),
      ],
      effects: [
        note(
          'family.deposition-maintained',
          'Alex a maintenu une déclaration omettant la poussée malgré la présentation du journal.',
        ),
      ],
      next: 'table',
    },
    {
      id: 'assumee',
      lines: [
        line(
          'greffier',
          'Cette réponse est consignée comme votre déclaration, pas comme un verdict.',
        ),
      ],
      effects: [
        note(
          'family.deposition-assumed',
          'Alex a assumé l’acte ou l’absence d’acte présenté au Tribunal, sans réclamer une conclusion générale.',
        ),
      ],
      next: 'table',
    },
    {
      id: 'contexte',
      lines: [
        line(
          'greffier',
          'Le contexte restera joint. Il n’efface ni le geste ni la limite de la pièce.',
        ),
      ],
      effects: [
        note(
          'family.deposition-context',
          'Alex a demandé que le contexte et les limites des pièces restent joints à sa déposition.',
        ),
      ],
      next: 'table',
    },
    {
      id: 'silence',
      lines: [
        line(
          'narrator',
          'Le Greffier attend, puis tourne une page. Aucun motif n’est attribué à ton silence.',
        ),
      ],
      effects: [
        note(
          'family.deposition-silence',
          'Alex a gardé le silence devant la question du Tribunal.',
        ),
      ],
      next: 'table',
    },
    {
      id: 'table',
      route: [{ when: has('public'), next: 'erreur' }],
      next: 'fin',
    },
    {
      id: 'erreur',
      lines: [
        line(
          'greffier',
          'Je note ici : aucune question posée devant la famille au repas.',
        ),
      ],
      ask: {
        replies: [
          reply(
            'contester',
            'Contester avec la question déjà consignée à table',
            'corriger',
            { requires: noted('family.table-choice') },
          ),
          reply('laisser', 'Ne pas corriger cette formulation', 'fin'),
        ],
      },
    },
    {
      id: 'corriger',
      lines: [
        line(
          'narrator',
          '{{note:family.table-choice|La question est consignée dans le carnet.}}',
        ),
        line(
          'greffier',
          'Vous avez raison. La question a bien été posée. Ma formulation est retirée ; votre acte reste consigné.',
        ),
      ],
      effects: [
        note(
          'family.tribunal-corrected',
          'Alex a opposé sa question consignée à une formulation erronée du Greffier. Le Greffier a retiré cette formulation.',
        ),
      ],
      next: 'fin',
    },
    end(
      'Première déposition consignée. Le dossier I a été instruit jusqu’à ce retour. Les autres dossiers et le procès final ne sont pas ouverts.',
    ),
  ]),
];

export const familyContinuationContent: Content = {
  timelineId: 't0',
  version: 'family.continuation.1',
  scenes,
  principles: [],
  observations: [],
  order: scenes.map((item) => item.id),
  inherits: {
    timelineId: 't0',
    sceneIds: familyContent.scenes.map((item) => item.id),
    place: 'la maison Delcourt',
  },
  flow: {
    confrontationSceneId: '',
    pasEncoreSceneId: '',
    confrontationUnsignedSceneId: '',
    checkpointSceneId: '',
    codaSceneId: scenes.at(-1)!.id,
  },
};
export const continuationCopy = {
  missingSource: 'Termine le premier chapitre pour poursuivre cette nuit.',
  resumeSource: 'Reprendre le premier chapitre',
  continueNight: 'Poursuivre la nuit',
  completed: 'La déposition est consignée.',
  lucie: 'Lucie',
};
export const continuationCampaign = {
  title: 'THE LAW: REBIRTH — La Sixième Place, la nuit',
  subtitle: 'La nuit et la première déposition',
  warning:
    'Deuil, conflit familial et violence conditionnelle. Tu peux quitter ou passer toute scène.',
  next: 'La première déposition est consignée. Les décisions et les limites des preuves restent au dossier. Les dossiers II et III et le procès final restent à produire.',
};
export function continuationStaging(
  sceneId?: string,
  nodeId?: string,
  state?: GameState,
): FamilyStaging & { tribunal?: boolean } {
  if (sceneId?.endsWith('deposition-retour'))
    return {
      room: 'hall',
      tribunal: true,
      cue: 'paper',
      caption: 'Papier sur le bureau. Les actes du journal restent lisibles.',
    };
  if (sceneId?.endsWith('chaise-apres'))
    return {
      room: 'table',
      caption: state?.flags.includes('family.fall')
        ? 'La chaise d’Henri reste vide après la chute.'
        : 'La sixième place reste dressée.',
    };
  if (
    sceneId?.endsWith('henri-confrontation') ||
    sceneId?.endsWith('cuisine-risque') ||
    sceneId?.endsWith('apres-le-choc')
  )
    return {
      room: 'hall',
      cue: nodeId === 'chute' ? 'door' : undefined,
      caption:
        'Escalier visible, passage vers le couloir dégagé. Tous les gestes restent explicites.',
    };
  return {
    room: nodeId === 'lettre' || nodeId === 'cassette' ? 'album' : 'hall',
    cue: nodeId === 'lettre' ? 'paper' : undefined,
    caption:
      'La maison garde les traces de la nuit. Les voix restent transcrites.',
  };
}
