import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTtlCache } from './ttlCache.ts';

describe('ttlCache', () => {
  it('returns a cached value without calling the loader again', async () => {
    const cache = createTtlCache<number>(60_000);
    let calls = 0;
    const first = await cache.get(async () => {
      calls += 1;
      return 1;
    });
    const second = await cache.get(async () => {
      calls += 1;
      return 2;
    });
    assert.equal(first, 1);
    assert.equal(second, 1);
    assert.equal(calls, 1);
  });

  it('shares one in-flight request', async () => {
    const cache = createTtlCache<string>(60_000);
    let calls = 0;
    let release: (value: string) => void = () => {};
    const loader = () => {
      calls += 1;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    };
    const a = cache.get(loader);
    const b = cache.get(loader);
    release('ok');
    assert.deepEqual(await Promise.all([a, b]), ['ok', 'ok']);
    assert.equal(calls, 1);
  });

  it('keeps the last good value when a refresh fails', async () => {
    const cache = createTtlCache<string>(1);
    await cache.get(async () => 'ready');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const value = await cache.get(async () => {
      throw new Error('offline');
    });
    assert.equal(value, 'ready');
  });
});
