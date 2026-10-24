import { afterEach, expect, it, vi } from 'vitest';
import { POST, GET } from '../../app/api/report/route';

afterEach(() => vi.unstubAllGlobals());

it('retires remote reporting without reading or forwarding a historical journal', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await POST();
  expect(response.status).toBe(410);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(fetch).not.toHaveBeenCalled();
});

it('rejects GET without collecting data', async () => {
  expect((await GET()).status).toBe(405);
});
