# Récupération du chantier T0 de Claude

Date de reconstruction : 30 septembre 2026.

## État Git retrouvé

- Worktree : `C:\Users\sakry\Desktop\law\.worktrees\t3-final-experience`
- Branche : `feat/t0-examen`
- Dernier HEAD Claude : `fca85d50a41579aa0c65d659db7de2e43e3abfaf`
- Base T0 : `cdfcf9873ee2ca3ee7e1abcad530ab30b190b23d`
- Base amont intégrée : `469eb6b2bee92df555eed68972739868a7852fd8`

Le dépôt principal `C:\Users\sakry\Desktop\law` est resté sur un ancien `main` avec des modifications locales indépendantes. Il n’a pas été modifié. Le worktree nommé historiquement `t3-final-experience` est bien celui que Claude a réaffecté à T0.

## Commits Claude retrouvés après la conception

1. `8e99a81` — conversations, notes narratives, silence enregistré, schéma de sauvegarde 5 ;
2. `0bb48df` — prologue, premières scènes et audit narratif ;
3. `ab47913` — lecteur cinématique T0, porte et ambiance ;
4. `0d4b5f8` — horloge de conversation, conditions temporelles et lois déclarées ;
5. `c6544e9` — scènes jusqu’à Le Bonheur ;
6. `efdff55` — voix et états visuels téléphone/année/notification ;
7. `dc875cd` — audit des lectures de lignes non répondables et simulation des scènes passées ;
8. `fca85d5` — scènes 09 à 18 et première construction de Lou.

## Changements non commités retrouvés

- `src/content/contracts.json` : contrat de `t0.la-promesse@1` régénéré après correction de la condition lue ;
- `src/content/timelines/t0/scenes/les-vingt-annees.ts` : scène 19 complète dans un fichier encore non indexé, non contracté et non testé ;
- `scripts/release-check.mjs` et `scripts/simulation.ts` apparaissaient modifiés dans `git status`, mais leur contenu est byte-identique à HEAD. Il s’agit d’un artefact de fins de ligne Windows, pas d’un changement fonctionnel.

## Dernière correction et dernière opération

L’audit a été renforcé pour refuser une condition `said` visant un nœud qui ne reçoit jamais de réponse. `La Promesse` lisait `t0.le-temoin/e-savais`, une ligne de narration, au lieu de la réponse réelle `t0.le-temoin/elias-hub/savais`. Claude a corrigé la scène, puis supprimé uniquement les contrats T0 non publiés avec `scripts/reset-t0-contracts.mjs` avant de les réenregistrer.

État reconstruit du registre : 79 contrats, dont 21 contrats T0 ; aucune version manquante ou modifiée. Le script de reset existe parce que T0 n’est pas publié : il permet de réécrire ses contrats pendant le développement sans toucher aux contrats T1–T3 append-only déjà distribués.

## Fonctionnalités déjà présentes

- graphe de conversation déterministe et événement `line_chosen` ;
- silences explicites et expirations enregistrés ;
- horloge et conditions de temps/hésitation ;
- notes séparant faits, observations, inférences et déclarations ;
- citations de texte libre sans analyse réseau ;
- lois déclarées, relations, promesses, mensonges, regrets et renversements ;
- callbacks par conditions, notes et lignes antérieures ;
- schéma de sauvegarde 5 avec migration 4 → 5 sans réécriture des journaux ;
- héritage de mémoire existant, avec T0 comme timeline autonome ;
- audit statique, simulation seedée, replay et lecteur T0 responsive.

## Cartographie au point d’arrêt

Les 21 scènes indexées, testées par simulation et contractées vont de `t0.prologue` à `t0.le-trajet`. Elles couvrent le prologue et les scènes 01 à 18 de la structure actuelle, avec certains titres de travail remplacés par leurs titres finaux (`Ce qui est noté`, `Quelques questions`, `Un défaut`, `L’analyse`, `Une douleur`).

`Les vingt années` est le premier point incomplet : le fichier existe, mais la scène n’est pas encore importée dans `index.ts`, ne possède pas de contrat, et n’est donc pas parcourue par l’audit ou la simulation.

Restent ensuite à implémenter selon `docs/t0-examen.md` : La Contradiction, L’Exception, Le Mensonge, Ta loi, La Porte et l’épilogue pluvieux.

## Validations initiales de récupération

- audit T0 : `audit: clean` ;
- test T0 ciblé : 11/11 verts, 500 simulations seedées incluant des scènes passées ;
- persistence/migrations : 27/27 verts ;
- dérive des contrats, vérification en lecture seule : aucune scène manquante ou modifiée ;
- TypeScript : vert ;
- format ciblé : vert.

## Point de reprise

Stabiliser et enregistrer ce checkpoint, puis raccorder `les-vingt-annees.ts` à T0. Écrire d’abord le test qui exige sa présence dans le parcours, exécuter l’audit et la simulation, enregistrer son contrat T0 non publié, puis continuer avec la scène 20 sans revenir sur les scènes déjà livrées.

## Ambiguïtés conservées

- Le document de conception annonce Lou jusqu’à 26 ans, tandis que le brouillon retrouvé de `Les vingt années` s’arrête actuellement à ses 16 ans. Ce décalage doit être résolu lors du raccordement de la scène, sans remplacer Lou ni son attachement par un résumé.
- L’héritage multiple existe déjà dans le moteur via `alsoInherits`, mais le store et l’interface T3 ne raccordent encore que T2. Les anciennes sauvegardes T3 ne doivent pas devenir incompatibles ; le raccordement optionnel de T0 reste à traiter séparément.
