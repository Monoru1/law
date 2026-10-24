# 08 — Décisions

Statuts : **PRISE** (appliquée ou sans risque créatif, réversible), **À VALIDER** (décision créative ou produit qui engage la suite). Aucune décision « À VALIDER » ne doit être exécutée avant réponse.

## A. Décisions qui attendent votre validation

### D-01 — Direction narrative : « LE GREFFIER » (architecture C) — À VALIDER

- **Décision proposée.** Conserver T0 à T3 comme quatre dossiers d'une même audience ; écrire T4 « La Salle des absents » comme finale-procès ; relier l'ensemble par des graines de texte.
- **Pourquoi.** Le dépôt contient déjà ~7 000 mots, 80 scènes, leurs sauvegardes et leurs contrats ; ce qui lui manque est un cadre, un mystère et une fin. Voir `02-CREATIVE-DIRECTIONS.md`.
- **Écarté.** A (habillage seul : pas de thriller), B (quatre campagnes neuves : la validation humaine, pas l'écriture, ne tient pas en sept jours).
- **Si vous refusez.** Je m'arrête avant tout code narratif ; les lots « socle » restent utiles (sécurité, tests, tokens).

### D-02 — Mystère central — À VALIDER

- **Décision proposée.** LAW est un ancien convoqué resté à la place d'Aurore, l'ancienne greffière, qui avait écrit une note fausse sur lui. LAW a menti une fois (`t0.le-mensonge`) pour voir si quelqu'un contesterait un registre. Une des notes lues en T4 est fausse ; le joueur peut le prouver avec son propre journal.
- **Pourquoi.** Elle réutilise, sans les contredire, des phrases déjà écrites (« Je te demande de rester », « Un seul de vous deux repartira d'ici », « Je voulais savoir si ma parole suffisait », la promesse d'Aurore au prologue). Elle répond à la question centrale du brief sous forme jouable.
- **Risque.** Moyen : le retournement « LAW est quelqu'un » doit être préparé avec retenue. Alternative moins radicale, si elle vous semble trop appuyée : garder la note fausse et la règle « un entre, un sort », mais ne **jamais** dire ce qu'était LAW (fin ouverte).
- **Question pour vous.** Voulez-vous que LAW reste ambigu (alternative) ou soit explicitement un ancien convoqué (proposition) ?

### D-03 — Heure du Tribunal : 04 h 12 au lieu de 03 h 17 — À VALIDER

- **Pourquoi.** 04 h 12 est déjà présent trois fois dans le dépôt (naissance de Lou, sonnerie du téléphone de Mila, scène du distributeur). Une quatrième heure dilue le motif.
- **Impact sur la communication.** Si 03 h 17 a déjà été annoncée publiquement (Story), il suffit d'un seul mot dans la fiction : « Le Tribunal sonne à 04 h 12 ; ce que vous avez reçu à 03 h 17 n'était que l'avis. » Dites-moi si ce cas existe.

### D-04 — Périmètre de lancement : T4 s'ouvre après T0 seul — À VALIDER

- **Décision proposée.** T4 hérite de T0 (obligatoire) et enrichit ses dépositions de T1 à T3 si le joueur les a joués. Un joueur pressé a un chapitre complet.
- **Alternative.** Exiger T0 + T1 + T2 + T3 avant T4 : parcours de plus de deux heures, risque d'abandon avant la fin.
- **Dépend de** la faisabilité du multi-héritage (spike J1). Repli : T4 sur T0 seul.

### D-05 — Quatre fins, aucune « bonne » — À VALIDER

- E1 L'audience levée (vraie), E2 La relève, E3 La porte, E4 L'affaire reportée. Chacune dérivée de faits du journal ; aucune ne produit de note morale. Détail : `03-STORY-BIBLE.md` §10.

### D-06 — Palette et règle du rouge — À VALIDER

- **Décision proposée.** Adopter la palette du brief en redéfinissant les tokens existants. Le calcul montre que le **rouge sang `#8E302D` n'a que 2,49:1 sur fond abyssal** : il est inutilisable comme texte ou liseré. Il n'est permis que comme aplat portant du texte blanc verdict (6,03:1) ; un dérivé `#CF5B54` (5,02:1) sert aux rares traits rouges. Voir `04-ART-DIRECTION.md` §2.
- **Question pour vous.** Acceptez-vous un second rouge, plus clair, pour les traits ? Sinon le rouge doit rester strictement un aplat.

### D-07 — Reporting de playtest pour le public — À VALIDER (**bloquant**)

- **Constat.** Le jeu envoie par e-mail à l'éditeur (via Brevo, avec consentement) pseudo, décisions, hésitations, **texte libre**, lois. La checklist de mise en production (`docs/playtest-reporting.md`) liste des éléments **qui n'existent pas** : identité de l'éditeur, mentions légales, information de confidentialité, base légale, durées de conservation, procédure d'effacement.
- **Recommandation.** Pour le public du 31 octobre : **désactiver** l'envoi (l'API répond déjà 503 si les variables d'environnement manquent ; il reste à masquer l'écran de consentement) et ne le conserver que pour un groupe de testeurs identifiés. Si vous voulez le garder pour le public, il faut des textes validés par une personne compétente ; je n'en invente pas.

### D-08 — Suppression des cinq branches distantes entièrement fusionnées — À VALIDER

- Preuve : 0 commit d'avance sur `origin/main` pour chacune. Voir `07-CLEANUP-PLAN.md` §2.

### D-09 — Gel des contrats T0 — À VALIDER (recommandation : gel immédiat)

- **Constat.** Le compte Netlify contient un projet `thelaw0` (https://thelaw0.netlify.app), sans mot de passe, dont le déploiement courant est « ready ». C'est très probablement le jeu déployé depuis `main` (le lien avec ce dépôt n'a pas été vérifié). Si oui, T0 est déjà jouable publiquement et des sauvegardes réelles peuvent exister.
- **Proposition.** Traiter T0 comme T1 à T3 : registre de contrats append-only dès maintenant, toute modification de structure par nouvelle version de scène. `scripts/reset-t0-contracts.mjs` ne doit plus servir.
- **Conséquence.** Les graines restent possibles (texte seul).

## B. Décisions prises

### D-10 — Mise à jour de sécurité immédiate — PRISE

- `next` 16.3.6 est vulnérable à une exécution de code à distance non authentifiée (>= 16.0.0, <= 16.4.0). Mise à jour vers 16.4.3, plus les autres correctifs listés dans `07-CLEANUP-PLAN.md` §1. `pnpm audit` : aucune vulnérabilité après.
- **Réversible** (un commit) mais ne devrait pas l'être.

### D-11 — Nom accessible de chaque porte — PRISE

- `aria-label` « Commencer — LA PIÈCE » : le libellé visible reste en tête du nom accessible (critère WCAG 2.5.3). Les tests visent désormais le nom complet.

### D-12 — `.gitattributes` en LF et `format:check` en CI — PRISE

- Supprime un faux positif sous Windows et ferme l'écart avec ce que `PROGRESS.md` affirmait.

### D-13 — Aucune nouvelle dépendance, pas de Three.js — PRISE

- Confirme `docs/visual-research.md`. Le tribunal est une composition DOM/CSS/SVG. Le son reste procédural.

### D-14 — Les pièces sont des répliques conditionnées, pas un glisser-déposer — PRISE

- Réutilise `reply.requires`. Évite un nouveau moteur d'interaction, un coût d'accessibilité et un coût mobile. Détail : `05-GAMEPLAY-SYSTEMS.md` §3.

### D-15 — Aucun contrat T1 à T3 modifié — PRISE

- Les graines ne touchent que du texte (`lines`, `beats`). Toute modification de structure passe par une nouvelle version de scène (`src/engine/contract.ts`).

### D-16 — Noms de portes et IDs de scènes conservés — PRISE

- « L'EXAMEN », « LA PIÈCE », « LA MAISON », « LA VILLE », « LE TRIBUNAL » restent. Le brief les appelle « dossiers » ; c'est une présentation (le bureau), pas un renommage.

### D-17 — Le verdict ne contient aucun score — PRISE

- Il met face à face la loi déposée et les actes consignés, sans conclure à un accord ou un désaccord. Un fait manquant produit une ligne manquante.

### D-18 — Deux boutons distincts conservés (T0 et T1) — PRISE

- L'ambiguïté devient une fausse piste jouable (la note fausse porte sur celui de T0). Les deux restent.

### D-19 — La femme de l'abribus reçoit un nom en T4 : Aurore — À VALIDER (avec D-02)

- La bible T0 promettait « Nom révélé dans La Ville » ; cette promesse n'est tenue nulle part dans les scènes actuelles. Le prénom évoque le moment de la renaissance (REBIRTH).

## C. Décisions ultérieures — directive prioritaire et confirmation du 24 octobre

Cette section actualise les statuts de l'audit initial sans effacer la proposition de Claude.

- D-01, D-02, D-05 et D-19 : **VALIDÉES** par le propriétaire, réponse « Le Greffier, avec les trois corrections signalées (preuve disponible, fin choisie, occupation cohérente) ». Les corrections détaillées sont dans `06-RELEASE-PLAN.md`, section Exécution Codex. Cela n'atteste pas encore la livraison des scènes T4.
- D-06 : palette du brief appliquée aux tokens existants ; rouge sang réservé aux actions irréversibles. Aucun nouveau rouge de texte n'est nécessaire à l'accueil et au registre livrés.
- D-07 : **REMPLACÉE** par le retrait du reporting distant, conformément à l'interdiction de transmission de texte libre d'AGENTS.md et à la directive de nettoyage. Ancienne route 410, champs de sauvegarde historiques conservés.
- D-09 : **APPLIQUÉE** par conservation du registre historique et retrait du script de purge, suppression explicitement autorisée par la directive prioritaire.
- D-08 : aucune suppression de branche distante réalisée.
