# T0 — L’EXAMEN : audit, plan, bible de LAW, structure

Document de travail. Le dépôt reste la source de vérité technique ; ce texte fixe les décisions avant le code.

## 1. Audit (état réel du dépôt)

- **Branches.** La Ville (T3) n’est pas sur `main`. Elle vit sur `codex/t3-final-experience` (T3 complet, actes I à VI, mondes visuels, harnais QA, coque de production). T0 est construite depuis cette branche (`feat/t0-examen`) ; `main` reçoit le tout à la fin, une fois propre.
- **Moteur** (`src/engine`, pur, événementiel). Un journal d’événements immuables rejoué par `reduce`. Une scène = beats + un `input` + des `outcomes` (effets). Conditions, effets, lois (`Law`, révisions), contradictions (`pendingConfrontations`), preuves (`evidence` par principe), relations (`RelationRecord`, dont `promise_made/kept/broken`, `lie_*`), observations, portes, `contract.ts` (contrat par scène et version, registre append-only `contracts.json`).
- **Chaînage.** `Content.inherits` + événement `memory_inherited` : copie figée de la timeline précédente (choix, justifications, drapeaux, lois avec phrase signée). T3 hérite de T2, qui porte T1. Un seul héritage par timeline aujourd’hui ; la validation impose exactement un `memory_inherited` en 2e événement.
- **Persistance.** `SaveAdapter`, un slot par timeline, `CURRENT_SCHEMA_VERSION = 4`, migrations, `IncompatibleSaveError`, upgraders par version de scène. Une save ne doit jamais être corrompue en silence.
- **UI.** `ScenePlayer` (1 057 lignes, inputs binary/choice/slider/freeText/glyph/passage/lawProposal/confrontation), `BeatRenderer` (cadence `pacing.ts` : decision / transition / rest), `World` (décors par acte), `AudioDirector` + `actAudio`, accueil à portes.
- **Outils.** `validate-content` (références de scènes/options/lois, simulation de parcours), `contracts`, harnais QA, vitest (engine, content, persistence, fuzz), Playwright (journey, layout, a11y, city, world).
- **Conventions** (`AGENTS.md`) : français typographié, pas de score moral, pas de réseau pour le texte libre, moteur pur, IDs de scène stables, clavier et reduced-motion obligatoires, on peut toujours quitter ou passer.
- **Constat produit.** T1 est déjà une salle avec LAW, mais LAW n’y parle pas : il affiche. Le manque n’est pas de contenu, c’est de **conversation, de mémoire fine et de silence**.

## 2. Décisions d’architecture

1. **T0 est une timeline `t0`**, première porte de l’accueil. T1 et T2 restent intacts (saves, contrats). **T3 hérite aussi de T0** : `inherits` accepte une liste ; T3 garde T2 comme source principale. Une save T3 existante (sans T0) reste valide : l’héritage de T0 est optionnel à l’ouverture de la porte, et T0 devient recommandée.
2. **Conversation déterministe.** Un nouveau type d’`input` : `talk`. La scène contient un graphe de nœuds (`say` de LAW ou d’un personnage, `reply` proposant 1 à 4 répliques, `wait`, `goto`). Chaque réplique choisie écrit un événement `line_chosen {sceneId, nodeId, optionId, hesitationMs}`. Le reducer applique les effets du nœud. Aucun LLM, rien de non rejouable.
3. **Le silence est un choix enregistré.** Un nœud `wait {ms, onTimeout}` écrit `line_chosen` avec `optionId: 'silence'` à l’expiration. La valeur est dans le journal : le replay reste exact. Ne rien faire = choisir.
4. **Mémoire narrative.** `state.notes` : entrées `{id, kind, tags[], sceneId, eventId, at, text?}`. Types : `justification`, `intention`, `silence`, `promise`, `question`, `reversal`, `curiosity`, `refusal`, `quote`. Effets `note`, condition `noted`. On réutilise l’existant : justifications (texte libre), `certainty`, `hesitationMs`, `selectionChanges`, relations, preuves. Rien n’est « compris » : un texte libre est **conservé et cité tel quel** ; l’usage intelligent passe par des **intentions choisies** (puces) posées avant ou à côté du texte.
5. **Callbacks.** Un callback est une variante de beat ou un nœud avec `requires` + un marqueur `callbackUsed` (pour ne pas répéter). Ils sont planifiés par les `schedule` existants et par des `due` en distance de scènes.
6. **Contradictions de décisions.** Les contradictions existantes sont liées à une loi signée. T0 Acte III compare **deux décisions** portant des preuves opposées sur un même principe (`evidence` déjà calculé). Réponse du joueur : ACCEPTER / REFORMULER / REFUSER ; la reformulation écrit une loi (`Law.customText`) via les événements de loi existants. LAW peut répondre « D’accord ».
7. **Loi déclarée.** Scène `ta-loi` : texte libre → `Law` avec `principleId: 'P_DECLARED'`, héritée par T3 via la mémoire (déjà supporté par `InheritedLaw.customText`).
8. **Le mensonge de LAW est vérifiable.** LAW affirme un fait sur le comportement du joueur fabriqué à partir d’un événement réel altéré (ex. « tu as changé d’avis à la scène X » alors que `selectionChanges = 0`). Le joueur peut le contrôler dans un onglet « Ce que LAW a noté » (journal lisible, jamais de score).
9. **Environnements.** `scene.env` (`ville`, `salle`, `couloir`, `maison`, `noir`) piloté par `World` ; sons via `actAudio` (pluie, ventilation, néon, téléphone, pas, porte, silence).
10. **Migrations.** Schéma 4 → 5 : ajout de `notes`, `line_chosen`, et de la liste `inherits`. Les journaux existants se rejouent à l’identique (les nouveaux champs ont un défaut vide). Les nouvelles scènes sont enregistrées dans `contracts.json` (append-only). Test de non-régression sur les fixtures `identity-*.json`.
11. **Composabilité.** Une scène `t0` = données (`Scene` + nœuds), aucun code par scène. Les pools, seeds et ordres conditionnels se brancheront sur `content.order`/`schedules` sans les remplacer.

## 3. Bible de LAW

**Qui est LAW.** Une présence patiente, polie, précise. Elle ne menace jamais, elle attend. Elle n’est pas un système qui joue l’inquiétant : elle est quelqu’un qui a l’habitude de poser des questions et qui déteste les réponses faciles.

- **Voix.** Phrases courtes, souvent sous 12 mots. Vouvoiement jamais : tutoiement sobre. Pas de métaphore, pas de « conscience », pas d’« abîme ». Vocabulaire concret (pièce, dossier, nom, table, heure).
- **Questions.** « Pourquoi ? » suffit. Jamais deux questions à la suite. Elle laisse la réponse exister avant de relancer.
- **Silence.** Un silence de 2 à 5 s après une réponse importante. Elle ne remplit pas. Jamais de silence au premier échange (il faut d’abord qu’elle soit polie).
- **Humour.** Un trait sec, toutes les 25 minutes au plus (« C’était une formule de politesse. »). Jamais sur la douleur.
- **Vérité.** LAW ne ment que sur ce qui concerne le joueur, une fois, en fin de T0. Elle omet souvent (« Ce n’est pas encore pertinent »), et le dit.
- **Limites.** Elle refuse : de dire pourquoi le joueur est là, qui est l’original, ce que dit le futur en dehors de ce qu’elle montre, et de prolonger une vision quand elle a décidé qu’elle était finie. Le refus est une phrase : « Non. »
- **Objection valable.** « Tu as raison. » ou « D’accord. » — puis on avance, sans commentaire. Elle perd des débats ; c’est ce qui la rend crédible.
- **Contradiction.** Toujours formulée comme une observation, avec la citation du joueur : « Tout à l’heure tu as dit : “…”. » Puis : « Est-ce toujours vrai ? » Jamais « erreur », jamais « incohérent ».
- **Rapport au joueur.** Acte I : cérémonieuse, presque clinique. Acte II : moins de protocole, elle dit « je ». Acte III : elle discute. Acte IV : elle tient une position ambiguë (« Je suis censé être honnête avec toi. »). À la porte : fatiguée, presque tendre.
- **À ne jamais dire.** Scores, pourcentages de morale, « bon/mauvais », « tu es » suivi d’un trait. Uniquement « j’ai observé », « tu sembles », « dans trois situations ».
- **Tests d’écriture.** Lire à voix haute. Si une réplique de LAW ressemble à un chatbot serviable, la couper de moitié.

**Personnages** (voix distinctes).
- **La Femme de l’abribus.** Sèche, elliptique, avance des phrases qu’elle ne finit pas. Nom révélé dans La Ville.
- **Elias.** Chaleureux, se défend par l’humour, ment par pudeur. Accusé, sympathique.
- **Nora.** Précise, factuelle, ne se plaint pas. La vérité qui innocente Elias détruit sa vie.
- **La Copie.** Parle comme le joueur : mêmes tics, moins de contrôle. Panique, argumente, blesse.
- **Jade.** La personne à l’autre bout du téléphone (sœur), ordinaire, drôle, vivante.
- **Lou.** La fille dans « Ton autre vie » (6 ans) puis dans « Les vingt années ». Toujours concrète : un dessin, une dent, une dispute idiote.

## 4. Structure de T0 (rythme : tension, respiration, conversation, étrangeté, dilemme, banalité, attachement, rupture)

Fonctions : **L** caractériser LAW, **J** caractériser le joueur, **R** relation, **Loi** établir une loi, **A** attachement, **CB** préparer un callback, **C** contradiction, **V** construire La Ville, **F** timeline future, **M** mécanique, **Myst** mystère.

| # | Scène | Mécanique | Fonctions | Écho / callback |
|---|-------|-----------|-----------|-----------------|
| P | La Ville, pluie | dialogue à 3 répliques | V, Myst, L | rejoué à la fin |
| 01 | Bonsoir | dialogue libre, eau, promesse | L, R, CB | verre d’eau (~50 min) ; **promesse** « ne me dis pas ce que tu crois que je veux entendre » |
| 02 | L’Innocent | interrogatoire + bouton maintenu + « pourquoi » (puces + texte court) | J, Loi, CB | la justification est citée en 11, 14, 19 |
| 03 | Le silence | rien (LAW se tait, la lumière change) | L, M, J | attente = mesurée, jamais commentée |
| 04 | Le Pardon | vitre, effacer ou non, « pourquoi ? » | J, Loi, A | « certaines souffrances appartiennent à celui qui les porte » → 16, 17 |
| 05 | La Copie | débat à trois, choix de qui sort | L, J, Myst, C | continuité de la personne → 15, 23 |
| 06 | Le Dernier Appel | téléphone, horloge 10:00, texte libre/silence | A, J, CB | Jade ; qui annonce ? → 12, 19 |
| 07 | Un dimanche | banalité : ranger, LAW ne demande rien | A, CB | objets cités en 13 |
| 08 | Le Bonheur | voir ou non, maintenu, « je repose la question » | J, A, Loi | attachement → sacrifice |
| 09 | L’Homme parfait | choisir un défaut ; analyse plus tard | J, CB, Myst | reprise en 14 |
| 10 | Le Témoin (Elias, Nora) | questions libres, ils peuvent mentir | R, A, C | Elias/Nora reviennent en 12, 20, 21 |
| 11 | La Promesse (Elias) | tenir la promesse coûte à Elias | R, C, L | « Je croyais que tu avais promis. » |
| 12 | Le Traître | LAW prend position | L, R, Loi | « Je suis censé être honnête avec toi. » |
| — | Interlude : la pause | couloir, distributeur, fenêtre | V, Myst, M | « C’est la ville. » — « Quelle ville ? » |
| 13 | Ton autre vie | visite de dix minutes, objets, Lou (6 ans), LAW refuse de prolonger | A, L, J, CB | prépare 19 |
| 14 | Le Sacrifice invisible | cite la justification de 02 | J, C, CB | « Est-ce toujours vrai ? » |
| 15 | Le Bouton inutile | 51 %, regret ? | J, M, C | dépend de 05 |
| 16 | La Seconde Chance | texte libre, disparition de personnes | J, A, F | écho de 04 |
| 17 | L’Oubli (question) | « ce qu’une douleur peut apporter » | J, CB | piège posé pour 19 |
| 18 | Un trajet | banalité, Jade rappelle | A, R | respiration avant la scène centrale |
| 19 | Les vingt années | fragments 2031→2045, Lou de 6 à 26 ans, cut brutal, « Elle n’existe pas », GARDER / TOUT EFFACER | A, J, CB, F, Myst | l’oubli (17) devient le bouton ; **la décision est rappelée dans La Ville** |
| 20 | La Contradiction | LAW choisit deux décisions, le joueur se défend, ACCEPTER / REFORMULER / REFUSER | C, Loi, L | LAW peut dire « D’accord. » |
| 21 | L’Exception | situation bâtie contre la loi la plus stable | C, J, L | dépend du profil |
| 22 | Le Mensonge | LAW a tort volontairement | L, J, Myst | teste l’autorité |
| 23 | Ta loi | texte libre, comparaison avec l’historique | Loi, C, F | la loi voyage vers La Ville |
| 24 | La Porte | questions au choix, refus, un mensonge | L, Myst | « Je n’ai jamais dit qu’il y avait un résultat. » |
| E | La Ville, la pluie | prologue rejoué, notifications | V, F | « …voyons ce que tu fais lorsque personne ne te pose la question. » |

Chaque scène a au moins deux fonctions. Aucune n’existe « pour le dilemme ». Les enjeux sont l’amour, l’oubli, l’identité, la loyauté, la vérité, le pardon, la honte : presque personne ne meurt.

**Ce que LAW retient (pour les callbacks).** Choix et hésitation, changements d’avis, intention choisie, justification écrite, silences, questions posées (curiosité), refus, promesse, principe invoqué, personne favorisée, coût accepté, certitude, regret, comportement après révélation, verre d’eau.

## 5. Plan d’implémentation

1. `feat(engine): narrative memory primitives` — `notes`, `line_chosen`, `talk` (types, schéma zod, reducer, conditions), héritage multiple, schéma 5, tests.
2. `feat(t0): prologue and act I opening` — prologue + scènes 01 à 03 + contrats + validation + un callback complet.
3. Validation technique et narrative du premier segment (tests, E2E, mobile).
4. `feat(t0): layered dilemmas` — scènes 04 à 12, interlude.
5. `feat(t0): twenty-years sequence` — 13 à 19.
6. `feat(t0): trial` — 20 à 24, mensonge, loi déclarée.
7. `feat(t0): connect examination to city` — héritage de T0 dans T3, prologue retourné, notifications, porte d’accueil.
8. Audit narratif automatisé (scènes inaccessibles, callbacks impossibles, personnages ou lois inexistants, variables jamais lues/écrites, branches mortes) en extension de `validate-content`.
9. Polish (rythme, silence, sons, responsive 360/390/430, tablette, 1366×768, grand écran), puis E2E, build, `git diff --check`, audit final.
10. Fusion dans `main` uniquement quand l’ensemble est propre et jouable.
