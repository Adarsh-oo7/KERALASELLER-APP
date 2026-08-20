type Entry<T> = { at: number; value: T };

export function createTtlCache<T>(ttlMs: number) {
  let entry: Entry<T> | null = null;
  let inflight: Promise<T> | null = null;

  return {
    peek(): T | null {
      return entry?.value ?? null;
    },
    fresh(): boolean {
      return Boolean(entry && Date.now() - entry.at < ttlMs);
    },
    invalidate() {
      entry = null;
    },
    seed(value: T, at = 0) {
      entry = { at, value };
    },
    async get(loader: () => Promise<T>, fresh = false): Promise<T> {
      if (!fresh && entry && Date.now() - entry.at < ttlMs) return entry.value;
      if (!fresh && inflight) return inflight;
      const pending = loader().then((value) => {
        entry = { at: Date.now(), value };
        return value;
      });
      inflight = pending.finally(() => {
        if (inflight === pending) inflight = null;
      });
      try {
        return await inflight;
      } catch (error) {
        if (entry) return entry.value;
        throw error;
      }
    },
  };
}
