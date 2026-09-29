// T0 is unreleased: its contracts may be regenerated until it ships. Never use
// this for a scene version a player could already have recorded.
import { readFileSync, writeFileSync } from 'node:fs';
const path = new URL('../src/content/contracts.json', import.meta.url);
const registry = JSON.parse(readFileSync(path, 'utf8'));
for (const key of Object.keys(registry))
  if (key.startsWith('t0.')) delete registry[key];
writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
