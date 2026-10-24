# 06 — Plan de livraison du 24 au 31 octobre 2026

> Statut : **proposition**. Le plan suppose la validation de la direction C (`02-CREATIVE-DIRECTIONS.md`) au plus tard le **dimanche 25 au matin**. Sans cette validation, seuls les lots « socle » (J0, J1 partiel) avancent.

## 1. Version de lancement et version étendue

**Version de lancement (31 octobre).** Un jeu complet, du début à la fin, jouable d'une traite ou en plusieurs sessions :

> Convocation → bureau de dossiers → **L'EXAMEN** (T0) → [**LA PIÈCE**, **LA MAISON**, **LA VILLE** au choix du joueur] → **LA SALLE DES ABSENTS** (T4) → verdict → une des quatre fins.

- T4 s'ouvre dès que T0 est terminé : un joueur pressé a donc **un chapitre complet avec un vrai dénouement** (≈ 1 h), sans avoir joué T1 à T3.
- T1 à T3 sont proposés comme **dossiers supplémentaires** : ils enrichissent T4 (témoins supplémentaires) sans être obligatoires.
- Durée estimée de lecture du contenu actuel : T0 ≈ 52 minutes en borne haute de lecture linéaire (688 répliques, ≈ 4 500 mots, toutes branches comptées, hors temps de réflexion), T1 ≈ 2, T2 ≈ 5, T3 ≈ 6 minutes de lecture pure. **Ces estimations sont des bornes de texte, pas des durées de jeu mesurées** : une mesure humaine reste à faire (liste en §6).

**Version étendue (novembre et après).** Voir §7.

**Refus explicite pour la sortie** : quatre campagnes neuves ; glisser-déposer de preuves ; voix ; images génératives ; service worker hors ligne ; archive « première vie / seconde vie » ; multilinguisme ; comptes et synchronisation.

## 2. Calendrier

Les journées sont des enveloppes de travail, pas des promesses horaires. P0 = nécessaire au lancement, P1 = souhaitable, P2 = étendu.

| Jour            | Objectif                  | Lots                                                                                                                                                                                                    | Priorité      |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Sam 24** (J0) | Fondations et proposition | Audit, documents `docs/rebirth/`, correctifs de sécurité des dépendances, E2E à nouveau verts, `format:check` en CI                                                                                     | P0 — **fait** |
| **Dim 25** (J1) | Socle T4                  | Spike multi-héritage (voir §4 R2) ; `t4` dans les schémas ; `gameStoreT4` ; route `/jouer/t4` ; seuil d'entrée ; migration des tokens de palette                                                        | P0            |
| **Lun 26** (J2) | T4 — première moitié      | Scènes 1 à 5 (`convocation`, `le-banc-vide`, `depositions-t0`, `depositions-maison`, `deposition-ville`) ; extension de l'audit et de la simulation                                                     | P0            |
| **Mar 27** (J3) | T4 — seconde moitié       | Scènes 6 à 11 (`le-registre`, `la-note-fausse`, `celui-qui-reste`, `aurore`, `un-entre-un-sort`, `verdict`) ; les quatre fins atteignables en simulation                                                | P0            |
| **Mer 28** (J4) | Cadre                     | Accueil « convocation », choix du son, pseudonyme ; bureau de dossiers ; panneau « Ce que LAW a noté » ; document de verdict ; sons de la salle                                                         | P0            |
| **Jeu 29** (J5) | Cohérence et qualité      | Graines de texte T0–T3 ; vérification que les contrats T0 sont inchangés ; passage mobile (320, paysage) ; audit accessibilité ; E2E T4 et accueil ; pages légales ou désactivation du reporting public | P0            |
| **Ven 30** (J6) | Playtest et gel           | Trois playtests humains sur téléphone (iPhone, Android) ; relecture française ; corrections bloquantes uniquement ; `pnpm release:check` ; aperçu Netlify ; plan de retour arrière                      | P0            |
| **Sam 31** (J7) | Lancement                 | Test de fumée en production ; publication ; surveillance ; correctifs critiques seulement                                                                                                               | P0            |

**Marge.** Si T4 prend un jour de plus, on coupe dans cet ordre : (1) `deposition-ville`, (2) `depositions-maison`, (3) panneau « Ce que LAW a noté » (reste dans « Ma loi » sans tiroir), (4) sons de la salle. On ne coupe jamais : la note fausse, la porte finale, le verdict.

## 3. Dépendances

```
 Validation créative (D-01…D-05)
        │
        ├── Spike multi-héritage ──► gameStoreT4, route, seuil ──► Scènes T4 1-5 ──► Scènes T4 6-11
        │                                                               │                 │
        │                                                               └──► audit/simulation ◄──┘
        ├── Tokens de palette ──► Accueil + bureau ──► Tests mobiles
        │
        └── Panneau « Ce que LAW a noté » ──► (dépendance forte) scène `la-note-fausse` équitable
```

Chemin critique : **spike multi-héritage → scènes T4 → simulation des quatre fins**.

## 4. Risques

| #   | Risque                                                                                                                                                                                                                               | Probabilité          | Impact                                   | Réponse                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Écriture de T4 (≈ 3 500 mots) plus longue que prévu                                                                                                                                                                                  | Moyenne              | Fort                                     | Modules coupables (voir marge). T4 minimal viable = scènes 1, 2, 3, 6, 7, 8, 10, 11.                                                                             |
| R2  | Le multi-héritage T0 + (T1/T2/T3) bute sur les invariants de `validation.ts`                                                                                                                                                         | Moyenne              | Fort                                     | Spike au J1. Repli : T4 hérite de T0 seulement ; T1–T3 n'enrichissent pas T4 au lancement.                                                                       |
| R3  | **Confidentialité** : le reporting de playtest envoie par e-mail pseudo, décisions et **texte libre** à l'éditeur ; les mentions légales et la politique de confidentialité n'existent pas (`docs/playtest-reporting.md`, checklist) | Certaine si inchangé | **Bloquant pour une ouverture publique** | D-07 : désactiver le reporting par défaut pour le public, ou publier des textes validés par une personne compétente. Je ne rédige pas de texte juridique fictif. |
| R4  | Dépendances vulnérables en production                                                                                                                                                                                                | **Constatée**        | Critique                                 | Corrigé sur la branche `chore/rebirth-baseline` (Next 16.3.6 → 16.4.3, Zod, Vite…) ; **à déployer sans attendre**.                                               |
| R5  | Sauvegardes T0 de joueurs réels incompatibles après une modification de structure (un projet Netlify public `thelaw0` existe, probablement ce jeu)                                                                                   | Moyenne              | Fort                                     | T0 traité comme append-only dès maintenant (D-09) ; graines de texte uniquement ; `reset-t0-contracts.mjs` à ne plus utiliser.                                   |
| R6  | Audio mobile (iOS : contexte audio sensible au geste)                                                                                                                                                                                | Moyenne              | Moyen                                    | Moteur déjà construit après geste ; test sur iPhone réel à J6. L'absence de son ne bloque rien.                                                                  |
| R7  | Goulot de validation humaine (relecture française, durée, playtest)                                                                                                                                                                  | Forte                | Fort                                     | Planifier J6 dès maintenant ; trois testeurs identifiés avant mardi.                                                                                             |
| R8  | Régression sur les sauvegardes existantes                                                                                                                                                                                            | Faible               | Fort                                     | `pnpm contracts` (lecture seule) en CI ; fixtures `identity-*.json` (tests `persistence`) ; aucune modification de contrat T1–T3.                                |
| R9  | `main` rouge (constaté : 9 E2E en échec avant correctifs)                                                                                                                                                                            | Constatée            | Moyen                                    | Corrigé ; `format:check` ajouté à la CI.                                                                                                                         |
| R10 | T0 n'a ni pseudonyme ni consentement (seul T1 les demande) ; le verdict en a besoin                                                                                                                                                  | Certaine             | Moyen                                    | Saisie du pseudonyme à la convocation, stockée localement ; aucun envoi.                                                                                         |

## 5. Critères d'acceptation

**Technique.**

- `pnpm release:check` vert (lint, typecheck, test, validate:content, build, E2E, audit) **et** `pnpm format:check`.
- Zéro vulnérabilité de niveau moderate ou plus.
- `pnpm contracts` : aucun contrat modifié ; seulement des `t4.*@1` ajoutés.
- Fixtures de sauvegarde historiques rejouées à l'identique.

**Parcours.**

- Un joueur nouveau peut aller de l'accueil à une fin sans aide, sur iPhone, sur Android, sur PC.
- Reprise après rechargement à tout point (y compris au milieu de T4).
- Quitter à tout moment ; passer toute séquence.
- Les quatre fins atteintes en simulation (2 000 parcours seedés) **et** une fois chacune par un humain.
- Clavier seul : T0 → T4 → verdict.
- Animations réduites : parcours complet, temps de lecture conservé.
- Aucun son avant un geste ; « sans le son » respecté partout.

**Qualité.**

- Lighthouse mobile ≥ 90 en performance, 100 en accessibilité, sur l'accueil et sur une scène de T4.
- Contrastes conformes au tableau de `04-ART-DIRECTION.md`.
- Relecture française de T4 par une personne francophone qui n'a pas écrit le texte.

**Conformité.**

- Soit mentions légales et information de confidentialité publiées après validation, soit reporting public désactivé.
- Aucun texte libre ne quitte l'appareil sans consentement explicite (invariant `AGENTS.md`).

## 6. Ce que seul un humain peut faire

- Valider la direction (D-01 à D-05) et trancher D-06 à D-09.
- Mesurer la durée réelle de T0 à T4 sur une partie normale.
- Faire relire le français par un éditeur.
- Tester sur de vrais iPhone et Android.
- Fournir identité de l'éditeur, hébergeur, contact confidentialité, base légale, durées de conservation (liste exacte dans `docs/playtest-reporting.md`).
- Donner la clé Brevo en production si le reporting reste activé.
- Décider de la suppression des branches distantes obsolètes (`07-CLEANUP-PLAN.md`).

## 7. Version étendue

| Élément                                                                            | Pourquoi pas avant le 31                                                      |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Enrichissement de la prose de T1, T2, T3 (aujourd'hui ≈ 300 / 960 / 1 240 mots)    | Demande une passe éditoriale par dossier et une relecture humaine par dossier |
| « La chambre du haut » (T2) : un téléphone sonne à 4 h 12 dans une pièce condamnée | Nouvelle scène avec version de contrat et conditions de reprise               |
| Archive « première vie / seconde vie » (rejeu comparé)                             | Nouveau stockage et migration                                                 |
| E2 jouable depuis l'autre côté (« la relève »)                                     | Nouveau parcours entier                                                       |
| Cas supplémentaire « Le dernier examen » (tricherie) et « 3 h 17 » (quartier)      | Nouvelles campagnes                                                           |
| Verdict exportable en image                                                        | Rendu canvas ou dépendance à évaluer                                          |
| Assets sonores enregistrés                                                         | Licences à valider un à un                                                    |
| Icônes PWA raster (déjà listées dans le README)                                    | Demande une validation graphique humaine                                      |
