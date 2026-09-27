# Progress

## Done

- Next.js App Router, TypeScript strict, Tailwind CSS v4, design tokens, local fonts, ESLint, Prettier, Vitest, Playwright configuration and GitHub Actions.
- Pure event-sourced engine, Zod content and save schemas, deterministic replay, conditions, effects, flow, laws, contradictions, text templating and observations.
- Full Timeline I content with branch-dependent return, law proposal, confrontation and coda. Seeded validator simulates 500 complete runs and checks reachability.
- Home, onboarding, player, outcome, certainty, law, pause, settings, end, history, export and erase screens; local autosave and corrupt-save backup.
- Unit tests for engine and corrupt saves; Playwright journeys for a complete run, full keyboard play, saved resume, reduced motion, privacy and layouts at 360, 768 and 1440 px.
- Lighthouse mobile on the production home page: Performance 95, Accessibility 100 (single local run).

## Decisions

- The three possible scene 8 screens are one dramatic slot after the surgeon. A signed law without a contradiction sees `t1.pas-encore`; without a signed law, a strong positive evidence trend can see `t1.confrontation-non-signee`.
- Narrative text is rendered as a React text node, so free text is escaped by React instead of HTML entity encoding, avoiding double-escaped player input.
- Local font packages are bundled with `next/font/local`, avoiding runtime requests to third-party font hosts.

## Remaining

- Conduct a human timing check for the 8–12 minute target.
- Playtest Reporting V1 (pseudo + consent → automatic factual report emailed via Brevo on `run_completed`) is implemented; see `docs/playtest-reporting.md`. A first real local send (with a live Brevo key) has not been performed yet.

## Deviations and justifications

- THE-9 — Diffabilité : les sources sont normalisées par Prettier et `format:check` précède le lint en CI. Les fichiers générés `next-env.d.ts` et `pnpm-lock.yaml` restent exclus du formatage.
- THE-9 — Le diff ignorant les espaces ne peut pas être vide après découpage des lignes et ajout du contrôle CI. La vérification compare les sources à la sortie exacte de Prettier sur le commit initial, puis les AST JavaScript émis, en normalisant les parenthèses et les fragments textuels JSX adjacents. Aucun contrat public ni format de sauvegarde ne change.
- THE-9 — Le SHA du commit de formatage est enregistré dans `.git-blame-ignore-revs` par un second commit documentaire : un commit ne peut pas contenir son propre SHA. Aucun historique n'est réécrit.
- The document describes ten scenes while the branching confrontation can produce three different scene IDs. Twelve content records implement the eight ordered scenes, three scene 8 branches and one deferred return.
- Experience pass — `t1.pas-encore` is now a first-class `passage`: its visit remains event-sourced, but the engine advances after the authored beats without fabricating a `choice_locked` event. Schema version 3 migrates the exact former content identity so existing saves remain readable.
- Experience pass — `BeatRenderer` owns bounded, testable narrative pacing. Beats reveal automatically, consequences retain a short reading hold and then lead to the next meaningful control; no Space/click-to-reveal primitive or generic outcome “Continuer” remains. Reduced motion removes movement, not reading time.
- A choice revealed on reload is reconstructed from the event journal; transient intra-beat animation progress is not persisted.
- The local browser initially crashed between tests with a serverless Chromium flag; removing that flag allowed the full suite to pass.
- Playtest Reporting V1 — `reportingStatus` (not_sent/sending/sent/failed) is a persisted field on `SaveGame`, not an in-memory store: an ephemeral store cannot satisfy the requirement that a refresh or a navigation to "Ma loi" and back must not cause a duplicate send. A `sending` status found at load time (interrupted session) is downgraded to `failed` rather than left to block silently forever with no retry.
- Playtest Reporting V1 — there is no server-side idempotency or deduplication by `runId`: the API route has no datastore to check against, and a Brevo idempotency key would have nothing to be checked against without one. If the client's connection drops after the server has received the request but before the response reaches the browser, a retry can produce a genuine duplicate email. This is documented, not hidden, in `docs/playtest-reporting.md`.
- Playtest Reporting V1 — `confrontation_answered` events carry no `sceneId`. The report correlates each one to its scene by pairing it positionally, in event order, with the `choice_locked(input:'confrontation')` event the player flow always appends immediately after it — not a change to the event schema itself.
- Playtest Reporting V1 — a `law_declined` event for a principle that is later signed is not reported as a separate "declined" record; only the eventual signature is kept, since it supersedes the earlier decline.
- Experience pass — hold-to-confirm was removed as the standard interaction. Every in-game decision now commits on a single deliberate click (or one click on a distinct "Confirmer"/"Signer" for two-stage inputs: slider, glyph, laws). The `HoldButton` primitive and its `simpleConfirmation` setting are gone from the UI; `settings.simpleConfirmation` is kept in the schema/defaults (deprecated) so existing saves migrate unchanged. Telemetry (`hesitationMs`, `selectionChanges`, `choice_locked`) is unaffected.
- Experience pass — the interface deepens through shared tokens and primitives rather than per-page styling: a layered surface/ink palette that carries its own contrast in daylight and darkness, a deliberate `.choice` control (raised surface, left index rule, strong hover/focus/selected), a `.commit` act, and a `.signal` variant reserved for the irreversible erase. The room accumulates one identical mark per committed decision (history, not judgment) and a restrained top-boundary pulse acknowledges each commit; both respect `prefers-reduced-motion`.
- Experience pass — the erase action in "Ma loi" moved from a hold gesture to an explicit two-click confirm (Effacer → Confirmer l'effacement), keeping a safety step for the one irreversible action without reintroducing hold.
