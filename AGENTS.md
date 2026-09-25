# THE LAW conventions

- All visible interface and narrative text is French, with narrow no-break spaces for French punctuation. Code identifiers and comments are English.
- No moral scores, praise, diagnostic claims, analytics, or network transmission of free text.
- Narrative text and conditions belong in `src/content/`. UI consumes resolved scene data.
- `src/engine/` is pure and independent of React, DOM and browser globals. State is derived from immutable events.
- Keep every scene ID stable. Add migrations for saved data changes. Validate content and run tests before committing.
- Keyboard and reduced-motion support are required for every new interaction. The player can always leave or skip.
- Keep dependencies light, the signal red reserved for irreversible actions, and document deviations in PROGRESS.md.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
