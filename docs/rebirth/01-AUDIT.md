# 01 — Audit du dépôt `Monoru1/law`

Date : 24 octobre 2026. Base auditée : `main` au commit `5cc2b76`. Branche de travail : `chore/rebirth-baseline`.
Méthode : lecture de `README.md`, `AGENTS.md`, `PROGRESS.md`, `package.json`, `docs/`, du moteur, des magasins, de la persistance, de l'UI, de l'audio, des scènes représentatives de chaque timeline, des tests et des scripts ; exécution de tous les contrôles ; captures du build de production (accueil à 390 et 1440 px, première scène de T0 à 390 px).

**Limites de l'audit.** Je n'ai pas joué de partie complète à la main ni mesuré de durée humaine ; je n'ai pas lu chacune des ~80 scènes mot à mot (les trois timelines T1–T3 ont été lues par échantillon et par comptage) ; Lighthouse n'a pas été relancé ; rien n'a été testé sur téléphone réel ; je n'ai pas vérifié ce qui est actuellement déployé en production.

## 1. Résumé

Le dépôt n'est pas un prototype à jeter. C'est un **moteur narratif mature** (journal d'événements rejouable, sauvegardes avec contrats, conversations déterministes, mémoire héritée entre timelines) portant **cinq portes**, dont quatre jouables (T0 L'EXAMEN, T1 LA PIÈCE, T2 LA MAISON, T3 LA VILLE) et une annoncée mais absente (T4 LE TRIBUNAL).

Ce qui manque n'est pas du moteur : c'est **un cadre, un mystère et une fin**. Aucune scène ne contient de tribunal, de juge ni de verdict. L'ensemble n'a pas d'intrigue transversale ; la femme de l'abribus du prologue n'est jamais nommée ni expliquée.

Trois problèmes concrets ont été trouvés et corrigés :

1. **Sécurité.** `pnpm audit` : 21 vulnérabilités, dont 2 critiques (exécution de code à distance non authentifiée dans Next.js) et 6 hautes.
2. **`main` rouge.** 9 tests E2E sur 66 échouaient depuis l'ajout de la porte T0 (deux boutons « Commencer » indiscernables : un défaut d'accessibilité réel, pas seulement de test).
3. **Formatage.** 4 fichiers non conformes à Prettier ; `format:check` absent de la CI alors que `PROGRESS.md` disait le contraire.

## 2. Inventaire technique

| Élément                | Constat                                                                                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pile                   | Next.js 16 (16.4.3 après mise à jour), React 19.3.1, TypeScript strict, pnpm 10.18.3, Zustand 5, Zod 4.6.7, Vitest 4.1.12, Playwright 1.64.1, Tailwind 4                                                                                                                     |
| Taille                 | 237 fichiers suivis, ≈ 30 500 lignes (src, app, tests, scripts, docs)                                                                                                                                                                                                        |
| Moteur (`src/engine/`) | Pur, sans React ni DOM. `replay(events, content)` reconstruit flags, variables, lois, relations, règles, notes. Contrats de scène par version (`contract.ts`, registre append-only `contracts.json`). Portes (`doors.ts`). Cadence (`pacing.ts`). Conversations (`talk.ts`). |
| Persistance            | Schéma v5, migrations, copie de secours en cas de corruption, une sauvegarde par timeline, clé `localStorage` par timeline                                                                                                                                                   |
| UI                     | `ScenePlayer` (T1), `ScenePlayerT0` + `Stage` (conversations cinématiques), `ScenePlayerT2`, `ScenePlayerT3`, `World` (décors room / house / city), accueil, onboarding, « Ma loi », réglages                                                                                |
| Audio                  | Moteur Web Audio **procédural** (drone, porteuse, bruit filtré), déclenché après geste, coupé par `settings.sound`, aucun fichier tiers                                                                                                                                      |
| Reporting              | `/api/report` : e-mail de playtest via Brevo, avec consentement (voir D-07)                                                                                                                                                                                                  |
| Déploiement            | `netlify.toml` (Node 24, `pnpm build`) ; un projet Netlify public `thelaw0` existe sur le compte (lien avec ce dépôt non vérifié)                                                                                                                                            |
| CI                     | GitHub Actions (Ubuntu, Node 24) : install, lint, typecheck, test, validate:content, build, E2E, audit. `format:check` **ajouté** aujourd'hui.                                                                                                                               |

## 3. Résultats des contrôles

| Contrôle                            | Avant (`5cc2b76`)                                                   | Après (branche)                                           |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm lint`                         | ✓                                                                   | ✓                                                         |
| `pnpm typecheck`                    | ✓                                                                   | ✓                                                         |
| `pnpm test`                         | ✓ 178 / 178 (18 fichiers)                                           | ✓ 178 / 178                                               |
| `pnpm validate:content`             | ✓ (2 000 parcours T1→T2→T3 ; 500 parcours T0)                       | ✓                                                         |
| `pnpm build`                        | ✓                                                                   | ✓                                                         |
| `pnpm test:e2e`                     | ✗ **57 / 66** (9 échecs)                                            | ✓ 66 / 66 (voir note)                                     |
| `pnpm audit --audit-level=moderate` | ✗ 21 vulnérabilités (2 critiques, 6 hautes, 11 modérées, 2 faibles) | ✓ aucune                                                  |
| `pnpm format:check`                 | ✗ 225 fichiers signalés                                             | 4 fichiers réellement non conformes, corrigés (voir note) |

Note E2E : 66 / 66 avec 3 workers (2,3 min). Avec les 7 workers par défaut sur cette machine, des délais dépassés non reproductibles apparaissent (3 échecs différents sur une exécution, tous verts à la relance) : les attentes de cadence de lecture sont sensibles à la charge. À surveiller en CI ; ne pas confondre avec une régression.
Note format : 221 des 225 signalements sont un artefact de Windows (`core.autocrlf=true`, index en LF). Contrôle exact : `pnpm exec prettier --check --end-of-line auto .`.

## 4. Contenu existant

Comptage automatique des répliques et paragraphes écrits dans les scènes (hors libellés de choix). Ce sont des **bornes de texte**, pas des durées de jeu.

| Timeline           | Scènes | Texte                         | Lecture linéaire (borne haute)               | Forme                                                                      |
| ------------------ | ------ | ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| **T0 L'EXAMEN**    | 28     | 688 répliques, ≈ 4 490 mots   | ≈ 52 min dont ≈ 29 min de pauses scénarisées | Conversations ramifiées, silence enregistré, horloges, citations du joueur |
| **T1 LA PIÈCE**    | 12     | 55 paragraphes, ≈ 310 mots    | ≈ 2 min                                      | Choix secs, lois, confrontation                                            |
| **T2 LA MAISON**   | 12     | 116 paragraphes, ≈ 960 mots   | ≈ 5 min                                      | Scènes de groupe, relations, conséquences par personne                     |
| **T3 LA VILLE**    | 28     | 121 paragraphes, ≈ 1 240 mots | ≈ 6 min                                      | Règle collective, exceptions, motif 417                                    |
| **T4 LE TRIBUNAL** | 0      | —                             | —                                            | Porte « présentation » seulement                                           |

**Observation majeure.** `PROGRESS.md` vise 8 à 12 minutes pour T1 et 60 à 90 pour T3. À 310 et 1 240 mots, T1 et T3 sont **loin de ces cibles** en texte ; seul T0 est dense. Les quatre dossiers ne sont donc pas à égalité commerciale.

## 5. Ce qui fonctionne réellement

1. **Rejouabilité et sauvegardes.** Le journal immuable, les contrats par version de scène et les fixtures historiques byte-exact (`tests/fixtures/identity-*.json`) rendent les évolutions sûres.
2. **Conversations de T0.** Graphe de nœuds, silence comme fait, horloges, hésitation mesurée, notes typées (fait, observation, inférence, déclaré). Voix de LAW cohérente et documentée (`docs/t0-examen.md`).
3. **Mémoire héritée.** T2 hérite de T1, T3 de T2 ; le moteur accepte déjà plusieurs sources (`alsoInherits`).
4. **Contradictions.** Confrontation d'une loi signée et d'un acte (`confrontation_answered`) ; Reformuler / Maintenir / Abandonner.
5. **Validation automatique.** Simulation seedée de milliers de parcours, couverture de scènes et de variantes, audit des lectures de lignes non répondables (`scripts/audit-t0.ts`).
6. **Présentation de T0 à 390 px.** Pluie animée, feu rouge, locuteur, réponses numérotées : déjà cinématographique et lisible.
7. **Sécurité applicative.** En-têtes durcis, route de reporting JSON-only avec limite d'octets, aucun cookie, aucun analytics.

## 6. Ce qui est narrativement intéressant

- **« Ils n'avaient pas de nom. Ils avaient un nom. »** (fin de T1 → T2) : le meilleur mécanisme transversal du dépôt.
- **Le verre d'eau** qui apparaît sans qu'on l'ait vu arriver ; **la promesse** de ne pas dire ce que LAW veut entendre ; **le mensonge de LAW** (`t0.le-mensonge`) qu'elle avoue ensuite (« Je voulais savoir si ma parole suffisait »).
- **La Copie** (« Un seul de vous deux repartira d'ici »).
- **Le motif 417** (T3) et **04 h 12** (trois occurrences).
- **Le prologue** : « Tu es revenu. » / « Cette fois… essaie seulement de ne pas changer les règles quand elles commencent à te coûter quelque chose. »
- Un principe d'écriture clair : LAW perd des débats, ne juge pas, « note ».

## 7. Ce qui manque pour une expérience commercialement présentable

| Manque                              | Détail                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un cadre                            | Pas de tribunal dans la fiction ; accueil = menu typographique, pied de page périmé (« LA PIÈCE »), aucune entrée, aucun choix de son                             |
| Un mystère                          | Pas d'intrigue transversale ; promesses non tenues (nom de la femme « révélé dans La Ville » : jamais)                                                            |
| Une fin                             | T4 absent ; chaque timeline finit sur un « Sortir »                                                                                                               |
| Le verdict                          | Aucun document final personnalisé                                                                                                                                 |
| La vérifiabilité du mensonge de LAW | `docs/t0-examen.md` §2.8 prévoit un onglet « Ce que LAW a noté » : **absent de l'UI**                                                                             |
| Un pseudonyme dans T0               | Seul T1 demande pseudo et consentement                                                                                                                            |
| De la prose en T1–T3                | Voir §4                                                                                                                                                           |
| Conformité publique                 | Mentions légales, politique de confidentialité et procédure d'effacement inexistantes alors que le reporting envoie du texte libre (`docs/playtest-reporting.md`) |
| Validation humaine                  | Relevé de durée et relecture française toujours « à faire » pour T1–T3 (`PROGRESS.md`)                                                                            |
| Mobile                              | 320 px et paysage non testés ; Lighthouse relevé une seule fois en septembre (95 / 100)                                                                           |
| Icônes PWA raster                   | Absentes (README)                                                                                                                                                 |

## 8. Réutilisable / à réécrire / supprimable

| Catégorie                  | Éléments                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Réutilisable tel quel**  | Moteur, persistance, contrats, `talk`, notes, relations, règles, lois, confrontations, portes, audio procédural, lecteur T0, T0 en entier, structure de T1–T3, `docs/t0-examen.md`           |
| **À étendre**              | `World` (composition `tribunal`), `copy.doors` (fiction de T4), accueil, « Ma loi » (T0, T4, notes), seuil d'entrée (multi-source)                                                           |
| **À réécrire**             | Accueil et pied de page ; `copy.doors[t4].presentation` (« L'odeur de l'information revient ici. » n'a pas de sens apparent) ; avertissements de contenu (ajouter deuil et perte de mémoire) |
| **À enrichir (extension)** | Prose de T1, T2, T3                                                                                                                                                                          |
| **Supprimable**            | Rien aujourd'hui sans risque ; candidats prouvés et conditions dans `07-CLEANUP-PLAN.md` (script de réinitialisation T0, note de reprise, cinq branches distantes fusionnées)                |

## 9. Risques avant le 31 octobre

Détaillés dans `06-RELEASE-PLAN.md` §4. Les cinq plus graves :

1. **Confidentialité** du reporting (bloquant pour une ouverture publique).
2. **Exposition à la faille Next.js** tant que la correction n'est pas déployée.
3. **Durée d'écriture et de validation de T4** (≈ 3 500 mots, relecture humaine).
4. **Multi-héritage de mémoire** pour T4 (spike au premier jour).
5. **Modification de structure de T0** si le jeu est déjà public (contrats append-only).

## 10. Faits relevés à signaler

- Le dépôt ne contient aucune occurrence du mot « tribunal » dans le contenu narratif ; seule la porte `LE TRIBUNAL` de `copy.doors` y fait allusion.
- Cinq branches distantes (`claude/clever-feynman-k63n2k`, `claude/friendly-cannon-96ldmd`, `claude/playtest-reporting-wip`, `feat/t0-examen`, `ux/intensive-pass-20260927`) sont entièrement fusionnées dans `main`.
- Le compte Netlify contient `thelaw0` (public, sans mot de passe) et deux projets de préinscription (`law-inscription`, `the-law-inscription`). Le dépôt `law-inscription` n'a pas été modifié.
