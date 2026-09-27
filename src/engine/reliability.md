# Contrat de fiabilité — THE-10

Lentilles : Event sourcing, Vérité historique, Déterminisme du replay, Compatibilité des sauvegardes, Totalité des transitions, Zod aux frontières et Validation par simulation.

## Texte et contradictions

Les jetons publics sont `{{law:N.number|01}}`, `{{law:N.statement|repli}}`, `{{law:N.origin|repli}}` (l’acte qui a fait naître la loi : le fait figé hérité, ou le `fact` de l’issue du choix qui l’a soutenue en dernier), `{{confrontation:fact|repli}}` (le `fact` du choix qui contredit la loi en attente) et `{{since:law:N|0}}`. Une confrontation place ainsi deux actes réels côte à côte, jamais un jugement. `N` désigne le numéro fourni à `renderText` ; un numéro explicite fonctionne aussi. `since` compte les décisions depuis la signature. `assertRenderedText` refuse chaque jeton vide, même inclus dans une phrase non vide.

`GameState.contradictions` contient `{ lawNumber, principleId, sceneId, choiceEventId, lawEventId, answerEventId?, raised }`. `lawEventId` désigne la signature, ou l’événement `memory_inherited` pour une loi signée dans une timeline précédente. Chaque contradiction provient d’un choix enregistré et d’une loi signée ; les identifiants pointent dans `state.events`. Une réponse ajoute son propre identifiant sans effacer la contradiction. Une scène passée conserve la preuve sans inventer une réponse. La contradiction de coda reste dans cette liste et n’ajoute aucune confrontation après le geste final.

Les confrontations en attente passent avant la suite. Une confrontation peut être visitée plusieurs fois ; seule la sélection courante est réinitialisée, les événements restent intacts. La coda clôt le parcours, y compris si elle est passée. Une loi abrogée ne fait pas apparaître la branche « Tu n’as signé aucune loi ».

## Sauvegardes et store

Schéma 4. Chaque timeline possède son journal (`thelaw:save` pour LA PIÈCE, `thelaw:save-t2` pour LA MAISON) et chaque journal est toujours relu avec le contenu de sa propre timeline (`timelineId` dans la sauvegarde). `migrateSave(raw, content)` exige ce contenu : il n’existe plus de contenu implicite.

La compatibilité se décide par **contrat de scène**, pas par identité du contenu entier. Le contrat d’une scène (`sceneContract`) est la projection qui interprète un événement : entrée, identifiants d’options, preuves, conditions de variantes, effets des issues. Les textes, titres, libellés et faits sont de la présentation : les modifier ne rend aucune sauvegarde incompatible. `src/content/contracts.json` est un registre en ajout seul `sceneId@version → contrat` ; `pnpm contracts --write` enregistre une nouvelle version, `validate:content` et les tests refusent tout contrat modifié sous une version déjà enregistrée. Changer une règle impose donc d’incrémenter la version de la scène et, si des journaux existants doivent rester lisibles, d’ajouter un convertisseur de scène.

Les convertisseurs de scène (`upgraders` dans `migrations.ts`) traduisent les événements enregistrés sous une version remplacée ; ils peuvent retirer ce que la nouvelle version ne demande plus (le « Continuer » passif de `t1.pas-encore@1`) mais n’inventent jamais de décision. Les schémas 2 et 3 embarquaient le contenu complet dans `contentIdentity` : la migration le relit et accepte la sauvegarde si chaque scène référencée y avait le contrat enregistré. Une sauvegarde de l’ère 84db105 qui s’arrête avant `t1.sept-annees` reprend ; une sauvegarde dont une scène a changé de règle sans changer de version, ou dont la scène n’existe plus, reste `IncompatibleSaveError`, conservée et exportable. Le schéma 1 n’avait pas d’identité : il est lu avec `legacy-content-v1.json`. Les identités exactes écrites par 84db105, 17c614d et fd2e163 sont figées dans `tests/fixtures/` et ne doivent jamais être reformatées.

Frontière de confiance au chargement, en plus de Zod et des références de contenu : `run_started` est le premier et seul départ ; une décision, une certitude, une justification ou un passage n’existent que dans la scène entrée ; une réponse de confrontation n’existe que dans la scène de confrontation ; `run_completed` suit le geste final (scène de coda visitée) de la même timeline ; aucun événement après l’achèvement. Une scène inconnue ou une version non enregistrée est une incompatibilité, pas une corruption. L’ordre des horodatages n’est pas vérifié : une horloge d’appareil peut reculer.

LA MAISON commence par `memory_inherited`, deuxième événement obligatoire : une copie figée de ce que LA PIÈCE a laissé (choix, justifications exactes, drapeaux, variables, preuves, lois avec leur phrase signée et le fait qui les a fait naître). Le journal de LA MAISON ne relit jamais celui de LA PIÈCE ; effacer ou remplacer LA PIÈCE ensuite ne réécrit pas la mémoire de LA MAISON. Les scènes citées par la mémoire doivent appartenir à `content.inherits.sceneIds`.

Les relations (`relations`) sont dérivées des effets `relationEvent` d’un choix enregistré : identifiant et horodatage sont ceux du choix, jamais une horloge. Une loi n’interrompt le joueur qu’une fois par journal ; les contradictions suivantes sont conservées (`raised: false`) sans nouvelle confrontation. `law_signed` porte la phrase exacte signée (`statementText`), y compris une formulation écrite par le joueur ; `lawStatement` la préfère au texte courant du contenu.

- `start(): Promise<void>` conserve ou recharge la sauvegarde présente, même terminée. Une erreur de chargement empêche un démarrage implicite.
- `start({ replaceExisting: true }): Promise<void>` remplace explicitement, après copie locale de l’original. SEUIL doit recueillir la confirmation du joueur avant cet appel.
- `start({ inherited: { fromRunId, memory } })` est obligatoire pour une timeline qui hérite d’une autre ; sans mémoire, le démarrage est refusé et l’erreur exposée par le store.
- `restore(key): Promise<void>` valide et restaure une copie, archive l’original actif et actualise le store. Une copie incompatible peut être exportée mais pas rejouée avec un autre contenu.
- `listRecoveryCopies(): RecoveryCopy[]` retourne `{ key, createdAt, reason: 'corrupt' | 'replaced' }`, du plus récent au plus ancien. Cinq copies maximum ; les rechargements d’un même original corrompu ne multiplient pas les copies.
- `exportRecoveryCopy(key): string` retourne les octets JSON sauvegardés. `exportStoredSave(): string | null` donne accès à l’original actif, même incompatible ou illisible. Ces fonctions sont exportées depuis `src/persistence/localStorageAdapter.ts` et ne transmettent rien sur le réseau.
- `clear()` efface le journal de son adaptateur et ses copies locales. « Effacer ma partie » efface les deux timelines. Une erreur de quota laisse l’original actif en place.

Les mutations du store sont sérialisées. Une écriture ordinaire de l’adaptateur doit prolonger le même journal ; remplacer une partie, tronquer ou modifier son historique exige l’opération explicite. `validateEvent(event, state, content)` vérifie la structure Zod, les références de scènes/versions/principes et les valeurs des choix avant persistance. Le réducteur bas niveau reste tolérant pour l’inspection de journaux ; le chargement validé constitue la frontière de confiance.

## Livraison et intégration

Fichiers THE-10 : `src/engine/{flow,reducer,schema,text,types,validation,index}.ts`, ce contrat, `src/persistence/{SaveAdapter,localStorageAdapter,migrations}.ts`, le contenu historique figé, `src/store/gameStore.ts`, `scripts/validate-content.ts` et `tests/engine/{confrontation,fixtures,persistence,store}.ts`.

Les portes de THE-14, le contenu narratif, les styles, les routes, les composants UI et les tests E2E restent aux tickets propriétaires. THE-16 (SEUIL) intègre la confirmation, la liste/export/restauration des copies et les contradictions issues des preuves, y compris celles de coda. Après `append(scene_skipped)`, le lecteur doit calculer la transition depuis l’état actualisé, notamment pour vider correctement une confrontation passée. PLUME n’a pas de jeton à réécrire. Toute nouvelle version de contenu nécessite une coordination de migration avec ARCHITECTE.

La simulation couvre les douze scènes, toutes leurs variantes, les quatre réponses de confrontation et la sortie par passage des scènes. Les tests couvrent aussi une file de confrontations multiples dans un contenu de test ; le contenu actuel ne produit naturellement qu’une confrontation avant la coda. Aucun build ni déploiement ne fait partie de cette livraison locale.
