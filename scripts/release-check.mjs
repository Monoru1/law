import { spawnSync } from 'node:child_process';

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
  console.error('release:check doit être lancé avec pnpm.');
  process.exit(1);
}

function pnpm(args, env = process.env) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], {
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const script of [
  'lint',
  'typecheck',
  'test',
  'validate:content',
  'build',
]) {
  pnpm(['run', script]);
}

pnpm(['run', 'test:e2e'], {
  ...process.env,
  CI: '1',
  LAW_E2E_PORT: process.env.LAW_E2E_PORT ?? '3101',
});
pnpm(['audit', '--audit-level=moderate']);
