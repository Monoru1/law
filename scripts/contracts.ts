// Separate append-only registries: new content cannot rewrite historical contracts.
import { readFileSync, writeFileSync } from 'node:fs';
import { content } from '../src/content';
import { contentT0 } from '../src/content/t0';
import { contentT2 } from '../src/content/t2';
import { contentT3 } from '../src/content/t3';
import { rebirthContent } from '../src/content/rebirth';
import { tribunalContent } from '../src/content/tribunal';
import { familyContent } from '../src/content/sixieme-place';
import { familyContinuationContent } from '../src/content/sixieme-place-suite';
import { contentContracts, registryDrift } from '../src/engine';

for (const group of [
  {
    file: '../src/content/contracts.json',
    contents: [contentT0, content, contentT2, contentT3],
  },
  { file: '../src/content/rebirth-contracts.json', contents: [rebirthContent] },
  {
    file: '../src/content/tribunal-contracts.json',
    contents: [tribunalContent, familyContent, familyContinuationContent],
  },
]) {
  const path = new URL(group.file, import.meta.url);
  const registry = JSON.parse(readFileSync(path, 'utf8')) as Record<
    string,
    string
  >;
  const { missing, changed } = registryDrift(registry, group.contents);
  if (changed.length) {
    console.error(
      `Scene contracts changed without a version bump: ${changed.join(', ')}`,
    );
    process.exit(1);
  }
  if (missing.length && !process.argv.includes('--write')) {
    console.error(
      `Unregistered scene versions: ${missing.join(', ')}. Run pnpm contracts --write.`,
    );
    process.exit(1);
  }
  if (missing.length && process.argv.includes('--write')) {
    const next = { ...registry };
    for (const item of group.contents)
      for (const [key, value] of Object.entries(contentContracts(item)))
        next[key] ??= value;
    writeFileSync(
      path,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(next).sort(([a], [b]) => a.localeCompare(b)),
        ),
        null,
        2,
      ) + '\n',
    );
  }
  console.log(
    `${group.file}: ${Object.keys(registry).length + missing.length} registered contracts; ${changed.length} changed.`,
  );
}
