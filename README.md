# THE LAW: REBIRTH — Les Archives du silence

Thriller interactif en français. Valombre, octobre 2026 : Gabriel Varenne reçoit deux dépositions incompatibles portant sa signature et revient au lycée où Élise Moreau a disparu en 2009.

## Jouer

Le premier lot livre un prologue complet de sept scènes sur `/jouer/t0` : appartement, documents examinables, enregistrement restaurable, choix Nora/Keller/solitaire, couloir B, contradiction matérielle et photographie récente. Les neuf pièces ont des identifiants stables ; leur collecte est explicite. Les conclusions du carnet dépendent du journal. Les dossiers suivants sont annoncés comme non jouables, sans faux déverrouillage.

Le son s'active uniquement par une commande volontaire. Pluie, ventilation, musique synthétique composée, papier, téléphone, pas et porte sont des fichiers locaux. L'enregistrement est une voix française de synthèse accompagnée d'une transcription. Volume et mute sont mémorisés ; après rechargement une nouvelle activation est nécessaire. Aucun son n'est indispensable à l'enquête.

## Développement

Node 24, pnpm 10.18.3 :

```bash
pnpm install --frozen-lockfile
pnpm dev
```

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:content
pnpm contracts
pnpm build
pnpm test:e2e
```

`pnpm contracts` ne modifie aucun fichier. `--write` ajoute uniquement les contrats manquants à leur registre respectif. Prettier est vérifié en CI ; sous Windows un contrôle avec `pnpm exec prettier --check --end-of-line auto .` évite les faux écarts de fins de ligne.

## Sauvegardes et confidentialité

- La nouvelle campagne utilise uniquement `thelaw:rebirth:save-t0`. Ses scènes commencent par `rebirth.t0.` et ses contrats sont dans `src/content/rebirth-contracts.json`.
- Les anciennes clés `thelaw:save`, `thelaw:save-t0`, `thelaw:save-t2` et `thelaw:save-t3` restent intactes. Le carnet permet de télécharger leurs octets sans rejouer l'ancienne histoire.
- Un journal incompatible trouvé sur la nouvelle clé n'est pas écrasé silencieusement : le joueur peut l'exporter ou demander une nouvelle partie après archivage vérifié.
- Aucun compte, analytics, synchronisation ou envoi de texte libre. L'ancienne API de rapport reste retirée (410).
- Export et effacement de l'enquête sont explicites. L'effacement n'affecte pas les anciennes éditions. Les fonctions de récupération et leurs tests historiques restent disponibles.

## Architecture

`src/content/rebirth.ts` contient le scénario public, les pièces, les conditions, les conséquences et les conclusions. Le moteur événementiel `src/engine/` reste pur. `src/ui/t0/` présente le contenu résolu ; `src/audio/AudioManager.ts` gère les fichiers locaux et les transitions après activation. Les ressources sont dans `public/rebirth/` ; leur provenance et leurs limites sont dans `docs/visual-research.md` et `docs/audio-direction.md`.

Les contenus historiques T0–T3 restent uniquement pour la validation et la compatibilité des anciennes sauvegardes. Leurs anciens lecteurs et décors publics ont été retirés ; `/jouer`, `/jouer/t2` et `/jouer/t3` redirigent vers le nouveau prologue.

La suite du dossier Élise, les deux autres enquêtes, le Tribunal et le verdict restent à produire. Les limites précises et le résumé pour Claude sont consignés dans `PROGRESS.md`.
