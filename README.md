# THE LAW — La Pièce

Une expérience narrative en français. Le joueur signe éventuellement ses propres principes ; ses décisions restent dans un journal local et peuvent le confronter à ces principes plus tard. Aucune note morale n'est calculée.

## Démarrer

Node 24 LTS et pnpm 10 ou plus récent :

```bash
pnpm install
pnpm dev
```

Ouvrir `http://localhost:3000`. L'interface est statique côté serveur et n'utilise pas de compte, d'API ni de base de données. Les réponses libres sont gardées dans `localStorage` sous `thelaw:save` et peuvent être exportées ou effacées dans « Ma loi ».

## Vérifier

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:content
pnpm build
pnpm test:e2e
```

Le formatage est normalisé par Prettier et vérifié en CI. `pnpm format` corrige tout le dépôt. Le commit de normalisation initiale est listé dans `.git-blame-ignore-revs` ; pour que `git blame` l'ignore en local (GitHub le fait déjà nativement) :

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Playwright nécessite Chromium pour les tests navigateur (`pnpm exec playwright install chromium`). Les scénarios unitaires couvrent la replayabilité, les conditions, les effets, les lois, les contradictions et la typographie. Le validateur joue 500 parties seedées et exige que chaque scène soit atteinte.

## Architecture

- `src/content/` : toutes les scènes et leurs textes, principes et observations.
- `src/engine/` : moteur pur ; `replay(events, content)` reconstruit les flags, variables, lois et choix à partir du journal.
- `src/persistence/` : format validé par Zod, migration et copie de secours en cas de sauvegarde invalide.
- `src/ui/` : lecteur, décor et composants accessibles ; aucune règle narrative dans React.
- `src/audio/` : interface prévue pour le son, implémentation silencieuse.

Les `sceneId` restent stables pour préserver les sauvegardes. Les futures timelines, entrées et sources de sauvegarde peuvent être ajoutées sans modifier le contrat du moteur.
