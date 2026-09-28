# THE LAW — La Pièce

Une expérience narrative en français. Le joueur signe éventuellement ses propres principes ; ses décisions restent dans un journal local et peuvent le confronter à ces principes plus tard. Aucune note morale n'est calculée.

## Démarrer

Node 24 LTS et pnpm 10 ou plus récent :

```bash
pnpm install
pnpm dev
```

Ouvrir `http://localhost:3000`. Le gameplay n'utilise ni compte ni base de données : les journaux et réponses libres restent dans `localStorage` sous `thelaw:save` et `thelaw:save-t2`, puis peuvent être exportés ou effacés dans « Ma loi ». L'unique flux applicatif sortant est l'envoi volontaire d'un rapport de playtest via `/api/report` ; voir [`docs/playtest-reporting.md`](docs/playtest-reporting.md).

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

La vérification de release regroupe ces contrôles, le build, les E2E et l'audit de dépendances sans envoyer de rapport ni déployer :

```bash
pnpm release:check
```

Le formatage est normalisé par Prettier et vérifié en CI. `pnpm format` corrige tout le dépôt. Le commit de normalisation initiale est listé dans `.git-blame-ignore-revs` ; pour que `git blame` l'ignore en local (GitHub le fait déjà nativement) :

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Playwright nécessite Chromium pour les tests navigateur (`pnpm exec playwright install chromium`). Les scénarios unitaires couvrent la replayabilité, les conditions, les effets, les lois, les contradictions et la typographie. Le validateur joue 500 parties seedées et exige que chaque scène soit atteinte.

## Installation et réseau

Le manifest permet l'installation du shell web avec l'icône vectorielle existante. Une paire d'icônes raster finales 192×192 et 512×512, dont une variante maskable validée graphiquement, reste nécessaire pour une compatibilité d'installation maximale sur les plateformes qui n'acceptent pas l'icône SVG.

La partie en cours continue si la connexion disparaît après le chargement et l'interface signale alors que le rapport devra être réessayé. Aucun service worker n'est livré : un rechargement complet ou une première ouverture hors ligne ne sont donc pas garantis. Cette limite évite de mettre en cache une version périmée du moteur ou du contenu sans stratégie de migration testée.

## Configuration de production

- Node 24 est fixé dans `netlify.toml` ; pnpm 10.18.3 est fixé dans `package.json`.
- `SITE_URL` peut fournir l'URL canonique hors Netlify. Netlify fournit normalement `URL` pendant son build.
- Les secrets de reporting restent exclusivement dans les variables d'environnement serveur décrites dans la documentation de reporting.
- Aucun analytics, cookie, SaaS de monitoring ou synchronisation cloud n'est configuré.
- Les erreurs applicatives ont un écran de reprise. Les échecs d'envoi serveur ne journalisent qu'une catégorie stable, jamais le rapport, les adresses ou la clé provider.

## Architecture

- `src/content/` : toutes les scènes et leurs textes, principes et observations.
- `src/engine/` : moteur pur ; `replay(events, content)` reconstruit les flags, variables, lois et choix à partir du journal.
- `src/persistence/` : format validé par Zod, migration et copie de secours en cas de sauvegarde invalide.
- `src/ui/` : lecteur, décor et composants accessibles ; aucune règle narrative dans React.
- `src/audio/` : interface prévue pour le son, implémentation silencieuse.

Les `sceneId` restent stables pour préserver les sauvegardes. Les futures timelines, entrées et sources de sauvegarde peuvent être ajoutées sans modifier le contrat du moteur.
