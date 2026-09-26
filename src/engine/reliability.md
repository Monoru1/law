# Contrat de fiabilité — THE-10

Lentilles : Event sourcing, Vérité historique, Déterminisme du replay, Compatibilité des sauvegardes, Totalité des transitions, Zod aux frontières et Validation par simulation.

## Texte et contradictions

Les jetons publics sont `{{law:N.number|01}}`, `{{law:N.statement|repli}}` et `{{since:law:N|0}}`. `N` désigne le numéro fourni à `renderText` ; un numéro explicite fonctionne aussi. `since` compte les décisions depuis la signature. `assertRenderedText` refuse chaque jeton vide, même inclus dans une phrase non vide.

`GameState.contradictions` contient `{ lawNumber, principleId, sceneId, choiceEventId, lawEventId, answerEventId? }`. Chaque contradiction provient d’un choix enregistré et d’une loi signée ; les identifiants pointent dans `state.events`. Une réponse ajoute son propre identifiant sans effacer la contradiction. Une scène passée conserve la preuve sans inventer une réponse. La contradiction de coda reste dans cette liste et n’ajoute aucune confrontation après le geste final.

Les confrontations en attente passent avant la suite. Une confrontation peut être visitée plusieurs fois ; seule la sélection courante est réinitialisée, les événements restent intacts. La coda clôt le parcours, y compris si elle est passée. Une loi abrogée ne fait pas apparaître la branche « Tu n’as signé aucune loi ».

## Sauvegardes et store

Le schéma v2 ajoute `contentIdentity`, une représentation canonique exacte du contenu interprétant le journal. La migration v1 utilise `src/persistence/legacy-content-v1.json`, copie du contenu v1.0.0, et préserve événements, réglages, dates et identifiant de partie. Ne pas modifier cette copie lors d’une évolution du contenu : ajouter une migration explicite. Les versions inconnues, les modifications de contenu et les événements invalides sont refusés sans suppression de l’original. La vérification de contenu est volontairement stricte, y compris pour une modification textuelle ou un changement sans incrément de version.

- `start(): Promise<void>` conserve ou recharge la sauvegarde présente, même terminée. Une erreur de chargement empêche un démarrage implicite.
- `start({ replaceExisting: true }): Promise<void>` remplace explicitement, après copie locale de l’original. SEUIL doit recueillir la confirmation du joueur avant cet appel.
- `restore(key): Promise<void>` valide et restaure une copie, archive l’original actif et actualise le store. Une copie incompatible peut être exportée mais pas rejouée avec un autre contenu.
- `listRecoveryCopies(): RecoveryCopy[]` retourne `{ key, createdAt, reason: 'corrupt' | 'replaced' }`, du plus récent au plus ancien. Cinq copies maximum ; les rechargements d’un même original corrompu ne multiplient pas les copies.
- `exportRecoveryCopy(key): string` retourne les octets JSON sauvegardés. `exportStoredSave(): string | null` donne accès à l’original actif, même incompatible ou illisible. Ces fonctions sont exportées depuis `src/persistence/localStorageAdapter.ts` et ne transmettent rien sur le réseau.
- `clear()` efface la partie et ses copies locales. Une erreur de quota laisse l’original actif en place.

Les mutations du store sont sérialisées. Une écriture ordinaire de l’adaptateur doit prolonger le même journal ; remplacer une partie, tronquer ou modifier son historique exige l’opération explicite. `validateEvent(event, state, content)` vérifie la structure Zod, les références de scènes/versions/principes et les valeurs des choix avant persistance. Le réducteur bas niveau reste tolérant pour l’inspection de journaux ; le chargement validé constitue la frontière de confiance.

## Livraison et intégration

Fichiers THE-10 : `src/engine/{flow,reducer,schema,text,types,validation,index}.ts`, ce contrat, `src/persistence/{SaveAdapter,localStorageAdapter,migrations}.ts`, le contenu historique figé, `src/store/gameStore.ts`, `scripts/validate-content.ts` et `tests/engine/{confrontation,fixtures,persistence,store}.ts`.

Les portes de THE-14, le contenu narratif, les styles, les routes, les composants UI et les tests E2E restent aux tickets propriétaires. THE-16 (SEUIL) intègre la confirmation, la liste/export/restauration des copies et les contradictions issues des preuves, y compris celles de coda. Après `append(scene_skipped)`, le lecteur doit calculer la transition depuis l’état actualisé, notamment pour vider correctement une confrontation passée. PLUME n’a pas de jeton à réécrire. Toute nouvelle version de contenu nécessite une coordination de migration avec ARCHITECTE.

La simulation couvre les douze scènes, toutes leurs variantes, les quatre réponses de confrontation et la sortie par passage des scènes. Les tests couvrent aussi une file de confrontations multiples dans un contenu de test ; le contenu actuel ne produit naturellement qu’une confrontation avant la coda. Aucun build ni déploiement ne fait partie de cette livraison locale.
