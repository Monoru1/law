import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: [
      'tests/engine/**/*.test.ts',
      'tests/content/**/*.test.ts',
      'tests/reporting/**/*.test.ts',
      'tests/api/**/*.test.ts',
      'tests/audio/**/*.test.ts',
      'tests/qa/**/*.test.ts',
    ],
  },
});
