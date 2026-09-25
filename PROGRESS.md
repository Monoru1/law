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

## Deviations and justifications
- The document describes ten scenes while the branching confrontation can produce three different scene IDs. Twelve content records implement the eight ordered scenes, three scene 8 branches and one deferred return.
- The `t1.pas-encore` interlude has a neutral Continue action so it can be advanced by keyboard and its visit can be recorded.
- A choice revealed on reload is reconstructed from the event journal; transient intra-beat animation progress is not persisted.
- The local browser initially crashed between tests with a serverless Chromium flag; removing that flag allowed the full suite to pass.
