# 05 — Systèmes de jeu

> Statut : **conception**. Les systèmes marqués EXISTE sont vérifiés dans le dépôt. Les systèmes marqués NOUVEAU dépendent de la validation de la direction C (`02-CREATIVE-DIRECTIONS.md`).

## 1. Principe

Chaque mécanique doit servir une question que le joueur se pose réellement. Pas de « fausse interaction ». Les contraintes du dépôt s'appliquent à tout : clavier et réduction des animations obligatoires, on peut toujours passer ou quitter, aucun score moral, aucune transmission réseau de texte libre (`AGENTS.md`).

## 2. Inventaire des mécaniques demandées

| Mécanique du brief                           | État                                                                                                                                                  | Décision                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Dialogues mis en scène                       | **EXISTE** : `input.kind = 'talk'`, graphe de nœuds, `held(ms)`, locuteurs (`law`, `femme`, `copie`, `jade`, `elias`, `nora`, `lou`, `year`, `notif`) | Réutiliser pour T4.                                                                  |
| Silence comme réponse                        | **EXISTE** : `silence()`, `ask.timeoutMs`/`onTimeout`, `line_chosen` mode `silence`/`timeout`, notes `silence`                                        | Utile à T4 : le silence devant le registre est un fait.                              |
| Choix qui modifient les relations            | **EXISTE** : `relationEvent` (`promise_made`, `lie_made`, `secret_told`, `chose_over`, …), `state.relations`                                          | Lu par T4 pour choisir les variantes de dépositions.                                 |
| Décisions sous pression narrative            | **EXISTE** : `clock` et `timeoutMs` (T0 `le-dernier-appel`, `le-bonheur`)                                                                             | Un seul usage en T4 : le dernier choix.                                              |
| Conséquences persistantes                    | **EXISTE** : journal d'événements, `Memory`, héritage                                                                                                 | Ne change pas.                                                                       |
| Témoignages contradictoires                  | **NOUVEAU (contenu)**                                                                                                                                 | Dépositions de T4, écrites avec `said`/`has`/`chose` : aucun changement de moteur.   |
| Confrontation preuve/témoignage              | **NOUVEAU (contenu + UI légère)**                                                                                                                     | Réponses « Montrer… » conditionnées par `requires` (cf. §3). Pas de glisser-déposer. |
| Inspection de preuves, documents interactifs | **NOUVEAU (UI)**                                                                                                                                      | Panneau « Ce que LAW a noté » (§5) et fiche de pièce.                                |
| Transitions de lieux / décors évolutifs      | **PARTIEL** : `World` (room/house/city), `Stage` T0                                                                                                   | Ajouter une composition `tribunal` (§8 de `04-ART-DIRECTION.md`).                    |
| Ambiances sonores contextuelles              | **EXISTE** : `actAudio` (act-1 à act-6), `AudioDirector`                                                                                              | Ajouter `act-7` « salle ».                                                           |

**Refusé pour le lancement** (justification dans `08-DECISIONS.md`) : glisser-déposer de pièces sur témoignages (coût mobile et accessibilité élevé pour un gain faible), minuteries punitives, QTE, jauge de confiance, arbre de compétences, collectibles « achievement ».

## 3. Pièces et confrontation (sans nouveau moteur)

**Problème.** Le brief veut qu'on puisse « confronter une preuve à un témoignage ». Le moteur sait déjà répondre à ce besoin en nœud de conversation : une réplique est visible si la condition est vraie.

**Mécanisme.** Dans un nœud `ask`, on liste les pièces que le joueur _possède_, sous la forme de répliques :

```ts
reply('p-bouton', 'Montrer : « Tu as appuyé sur le bouton. »', {
  requires: has('t0.bouton.appuie'),
  next: 'faux-prouve',
  effects: [note('declared', 't4-pièce-bouton')],
}),
reply('p-bouton-non', 'Montrer : « Tu n\'as pas appuyé sur le bouton. »', {
  requires: has('t0.bouton.laisse'),
  next: 'faux-prouve',
}),
reply('p-promesse', 'Montrer : « Tu avais promis. »', {
  requires: noted('promesse-verite'),
  next: 'faux-mauvaise-piece',
}),
```

**Garanties.**

- Une pièce n'apparaît que si elle est dans le journal : la condition l'exige.
- Chaque présentation est un `line_chosen` rejouable, avec `hesitationMs`.
- Pas de contenu dynamique inventé : le texte des pièces est écrit ; ce qui varie est leur disponibilité.

**Limite honnête.** La liste affichée est donc _authored_, pas générée depuis tout le journal. Le panneau « Ce que LAW a noté » (§5) est, lui, généré.

## 4. La note fausse (cœur du mystère)

**Objectif de design.** Que le joueur puisse, avec son propre journal, prouver qu'un document du registre est faux.

**Point de départ dans le dépôt.** `t0.le-mensonge` : LAW énonce l'inverse d'un fait du journal (bouton) et le reconnaît, ou le joueur ne le conteste pas. Dans les deux cas LAW écrit : _« Je la garde comme observation. »_ (nœud `laisse`) [CANON]. L'observation fausse reste donc au registre.

**Algorithme (déterministe, rejouable).** En T4, un nœud `route` choisit le premier candidat pour lequel le joueur possède le fait :

| Priorité | Fait du journal                         | Note fausse lue par LAW (inversion)                                                               |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1        | `t0.bouton.appuie` / `t0.bouton.laisse` | « Devant le bouton, tu as choisi de ne pas appuyer / d'appuyer. » (mot pour mot `t0.le-mensonge`) |
| 2        | `t0.anton.agi` / `laisse`               | « Pour Anton, tu as laissé faire / tu es intervenu. »                                             |
| 3        | `t0.projet.garde` / `retire`            | « Face à Mathis, tu as cédé / gardé ta place. »                                                   |
| 4        | `t0.annees.gardees` / `effacees`        | « Tu as effacé / gardé les années. »                                                              |
| 5        | `chose('t1.dix-mille', …)`              | inversion                                                                                         |
| 6        | `chose('t1.le-protocole', …)`           | inversion                                                                                         |

Tous les candidats 1 à 4 sont des drapeaux T0 : un joueur qui n'a fait que T0 a toujours au moins un candidat. Aucune horloge, aucun hasard : le choix dépend uniquement du journal, donc `replay` reste exact.

**Le joueur ne reçoit pas « une note fausse » : il en reçoit trois**, lues d'affilée. Deux sont vraies (dérivées d'autres faits) et une est fausse. Il doit déterminer laquelle. Les trois sont écrites avec le même ton.

**Issues.**

| Action                                          | Effet                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Présenter la bonne pièce                        | LAW : « Oui. C'était faux. » Dévoilement, scène 8.                                                     |
| Présenter une pièce vraie contre une note vraie | LAW : « Tu as raison de vérifier. Ce n'était pas celle-là. » La tentative est un fait pour le verdict. |
| Accepter les trois                              | LAW : « Merci. » Aucune explication. Le registre reste.                                                |
| Silence jusqu'à la fin de la lecture            | Fait noté : « n'a pas contesté ».                                                                      |

Après deux pièces présentées à tort, LAW clôt le registre. La fin E1 n'est alors plus atteignable dans cette partie. C'est volontairement non punitif : le joueur peut simplement rejouer.

## 5. Panneau « Ce que LAW a noté »

**Besoin.** `docs/t0-examen.md` §2.8 prévoyait cet onglet : « Le joueur peut le contrôler dans un onglet “Ce que LAW a noté” (journal lisible, jamais de score). » **Il n'est pas dans l'UI actuelle** (aucune occurrence dans `app/ma-loi/page.tsx`). Sans lui, le mystère de T4 n'est pas équitable : le joueur ne peut pas vérifier.

**Contenu.** Pour chaque note de `state.notes` : texte (pour les notes à texte), type, statut (fait / observation / inférence / déclaré), scène d'origine (titre de la scène), position de la note dans l'audience, posture du joueur (`stance`). Lecture seule. Jamais de total.

**Où.** Dans « Ma loi » (déjà accessible depuis l'accueil quand une sauvegarde existe) et comme tiroir pendant T4.

**Accessibilité.** Liste sémantique, navigation clavier, lisible au lecteur d'écran, aucun contenu transmis par la couleur seule.

## 6. Mémoire, héritage et mise en place de T4

**État actuel (vérifié dans `src/engine/validation.ts`, `reducer.ts`, `doors.ts`).**

- T2 hérite de T1, T3 hérite de T2 (la mémoire de T2 porte celle de T1), T0 est autonome.
- Le moteur accepte déjà **plusieurs sources** de mémoire (`Content.alsoInherits`) : copiées « avant la première scène, une fois par source, la source primaire en premier ».
- La porte d'une timeline héritière reste « présentation » tant que la source primaire n'est pas terminée.

**Choix pour T4.**

- Source primaire : **T0** (L'EXAMEN). T4 s'ouvre donc dès que T0 est terminé.
- Sources secondaires, par ordre de préférence, une seule : T3 (qui porte T1 et T2), sinon T2, sinon T1, sinon aucune.
- Conséquence : un joueur qui n'a fait que T0 a un T4 complet mais plus court (dépositions de T0 uniquement) ; plus de dossiers joués = plus de témoins.

**À vérifier avant d'écrire une ligne (spike J1).**

1. La validation actuelle exige que `memory.choices`/`justifications` ne contiennent que des scènes connues de la source (`known` dans `validation.ts`). Pour T3 comme source de T4, `sceneIds` doit inclure les scènes de T1, T2 et T3.
2. `store/gameStoreT*` est dupliqué par timeline : prévoir `gameStoreT4` et la clé `thelaw:save-t4`.
3. Le seuil d'entrée (équivalent de `Threshold` dans `ScenePlayerT2`) doit construire la mémoire depuis plusieurs sauvegardes et tolérer l'absence de certaines.
4. `schema.ts` : ajouter `t4` aux énumérations de timeline (déjà fait pour `t0`).

## 7. Structure de T4 — LA SALLE DES ABSENTS

Chaque ligne est une **scène** (`t4.<slug>`, `version: 1`). Durée visée : **20 à 25 minutes** à la vitesse de lecture du moteur.

| #   | Scène                   | Mécanique                                                                                    | Condition d'accès   | Durée   |
| --- | ----------------------- | -------------------------------------------------------------------------------------------- | ------------------- | ------- |
| 1   | `t4.convocation`        | Cinématique : couloir, porte, 04:12. LAW : « Bonsoir. » Deux verres sur le bureau.           | toujours            | 1,5 min |
| 2   | `t4.le-banc-vide`       | Conversation : « Il n'y a pas de juge. » Explication des pièces. Premier silence mesuré.     | toujours            | 2 min   |
| 3   | `t4.depositions-t0`     | Dépositions Elias / Nora / Jade / La Copie. Première contradiction honnête (perspective).    | toujours            | 4 min   |
| 4   | `t4.depositions-maison` | Sem, Mila, Omar, Camille. Variantes selon T1/T2.                                             | T1 et T2 joués      | 3 min   |
| 5   | `t4.deposition-ville`   | Farid, Nadia. Variantes selon la règle.                                                      | T3 joué             | 2 min   |
| 6   | `t4.le-registre`        | Lecture de trois notes. Le joueur présente une pièce (§3, §4).                               | toujours            | 3 min   |
| 7   | `t4.la-note-fausse`     | Résolution (4 issues de §4).                                                                 | toujours            | 2 min   |
| 8   | `t4.celui-qui-reste`    | LAW dit ce qu'il n'a jamais dit. Rien de spectaculaire.                                      | note fausse prouvée | 3 min   |
| 9   | `t4.aurore`             | Aurore entre dans la galerie. Une question permet de lui faire dire la première fausse note. | fin E1 possible     | 3 min   |
| 10  | `t4.un-entre-un-sort`   | Dernier choix (§9).                                                                          | toujours            | 2 min   |
| 11  | `t4.verdict`            | Document généré (§10), puis épilogue de la fin atteinte.                                     | toujours            | 2 min   |

Trois scènes conditionnelles (4, 5, 9) évitent qu'un joueur qui n'a fait que T0 voie des personnages qu'il ne connaît pas.

## 8. Silence

Le dépôt traite déjà le silence comme un fait (`line_chosen`, mode `silence`/`timeout`, notes `silence`). T4 l'emploie à trois endroits seulement :

1. Scène 2 : si le joueur ne répond pas à « Tu veux savoir pourquoi il n'y a pas de juge ? », LAW l'explique de toute façon, plus courtement. Fait noté.
2. Scène 7 : ne pas contester est un fait du verdict (« n'a pas contesté »).
3. Scène 10 : le dernier choix a un `timeoutMs` long (60 s, réglage accessibilité : désactivable) ; l'expiration est enregistrée comme `timeout` et mène à E3, ou E4 si aucune loi n'a été déposée.

Aucun silence n'est commenté comme une faute.

## 9. Dernier choix

Options conditionnelles (toutes avec confirmation à un clic, l'une en `signal`) :

| Option                              | Visible si                                                | Mène à              |
| ----------------------------------- | --------------------------------------------------------- | ------------------- |
| « Sortir »                          | toujours                                                  | E3                  |
| « Prendre la place de LAW »         | toujours                                                  | E2                  |
| « Faire rouvrir le dossier de LAW » | note fausse prouvée **et** Aurore interrogée sur la fiche | E1                  |
| « Ne rien dire » (silence)          | toujours                                                  | E3 (ou E4 sans loi) |

`confirm: 'tap'` partout, `hold` n'est pas utilisé (AGENTS.md : pas de geste maintenu). Le rouge `signal` n'est appliqué qu'à « Prendre la place de LAW », seul acte irréversible.

## 10. Verdict

**Un document judiciaire personnalisé**, généré depuis `GameState` (aucune nouvelle donnée à saisir). Il n'existe qu'à la fin de T4, mais une version « provisoire » est consultable depuis « Ma loi » dès que T0 est terminé.

| Rubrique                    | Source                                     | Exemple                                          |
| --------------------------- | ------------------------------------------ | ------------------------------------------------ |
| En-tête                     | Pseudo, date de la fin, numéro d'audience  | « Audience n° 2 — [Pseudo] »                     |
| Affaire examinée            | Dossiers joués                             | « Dossiers 0, I, II, III »                       |
| Éléments retenus            | Pièces présentées avec succès              | « Le bouton (T0, scène 15) »                     |
| Éléments écartés            | Notes non contestées                       | « Note 1, 3 »                                    |
| Témoignages contradictoires | Dépositions mises en regard                | « Elias : “…”. Nora : “…”. »                     |
| Décisions déterminantes     | 3 à 5 `fact` des outcomes                  | « Tu as appuyé sur le bouton. »                  |
| Loi déposée                 | Note `t0-loi-declaree` ou loi signée       | « Je refuse de… »                                |
| Verdict                     | Phrase selon la fin (E1–E4)                | « Audience levée. »                              |
| Conséquences                | Une ligne par absent                       | « Sem a vidé son bureau. »                       |
| Mystères ouverts            | 3 lignes tirées de `03-STORY-BIBLE.md` §13 | « Le nom de LAW n'a pas été porté au registre. » |

**Règles.**

- Aucun score, aucun pourcentage, aucun adjectif de valeur.
- Un fait manquant produit une ligne manquante, jamais une ligne inventée.
- La loi déposée et les actes sont mis face à face, sans phrase de conclusion sur leur accord.
- Export : copier le texte, imprimer (CSS `@media print`), exporter le JSON de sauvegarde existant. Pas de dépendance nouvelle.

## 11. Progression et état des dossiers (accueil)

L'état est **dérivé** de `getRunProgress` et `getTimelineDoors` (`src/engine/doors.ts`) : `available`, `in_progress`, `completed`, `presentation`. Les « indices découverts » sont des listes d'IDs fixes par dossier, chacune avec une condition `Condition` évaluée sur la sauvegarde. Aucun champ de sauvegarde nouveau.

Exemple pour le dossier 0 : _Promesse faite_, _Verre bu_, _Mensonge démasqué_, _Loi déposée_, _Années vues_.

## 12. Sauvegardes et migrations

| Sujet                    | Règle                                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version de schéma        | `CURRENT_SCHEMA_VERSION = 5` ; aucune évolution attendue pour T4 si la forme de `Memory` ne change pas.                                                                                              |
| Nouvelles scènes         | `pnpm contracts --write` enregistre les contrats `t4.*@1` dans `src/content/contracts.json` (registre append-only).                                                                                  |
| Scènes existantes        | Modifier **texte, titre, fact** est libre. Modifier **entrées, options, effets, outcomes, `next`, `route`, `once`, `requires`** exige une nouvelle version de scène (voir `src/engine/contract.ts`). |
| Graines                  | Ne touchent que des `lines` : aucune version à incrémenter.                                                                                                                                          |
| T0                       | Probablement déjà public (projet Netlify `thelaw0`) : traité comme append-only, voir D-09. `scripts/reset-t0-contracts.mjs` ne doit plus servir.                                                     |
| Nouvelle clé de stockage | `thelaw:save-t4` (isolée des autres).                                                                                                                                                                |
| Export/effacement        | « Ma loi » doit couvrir T4 (aujourd'hui seuls `thelaw:save` et `thelaw:save-t2` sont documentés dans le README).                                                                                     |

## 13. Validation automatique à ajouter

| Contrôle                                                                            | Où                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Toutes les scènes T4 atteignables sur 2 000 parcours seedés, y compris avec T0 seul | `scripts/validate-content.ts`, `scripts/simulation.ts` |
| Chacune des quatre fins atteinte au moins une fois                                  | idem                                                   |
| La note fausse est toujours l'inversion d'un fait présent dans le journal           | test unitaire                                          |
| Aucun nœud T4 ne lit un drapeau jamais écrit                                        | `scripts/audit-t0.ts` étendu                           |
| Parcours E2E T4 : clavier seul, `prefers-reduced-motion`, 360 / 390 / 768 / 1440 px | `tests/e2e/`                                           |
| Contrats T4 enregistrés                                                             | `pnpm contracts` (lecture seule) en CI                 |
