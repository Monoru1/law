// Scene contract registry. `--write` registers new scene versions; it never
// rewrites or removes a registered one. Bump the scene version instead.
import { readFileSync, writeFileSync } from 'node:fs';
import { content } from '../src/content';
import { contentT2 } from '../src/content/t2';
import { contentT3 } from '../src/content/t3';
import { contentT0 } from '../src/content/t0';
import { contentContracts, registryDrift } from '../src/engine';

const path = new URL('../src/content/contracts.json', import.meta.url);
let registry: Record<string, string> = {};
try {
  registry = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
} catch {
  registry = {};
}
const contents = [contentT0, content, contentT2, contentT3];
const { missing, changed } = registryDrift(registry, contents);
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
const next = { ...registry };
for (const item of contents)
  for (const [key, contract] of Object.entries(contentContracts(item)))
    next[key] ??= contract;
const sorted = Object.fromEntries(
  Object.entries(next).sort(([a], [b]) => (a < b ? -1 : 1)),
);
writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(
  `${Object.keys(sorted).length} scene contracts registered${missing.length ? `, ${missing.length} added` : ''}.`,
);
