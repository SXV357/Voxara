import { useEffect, useState } from 'react';

interface UsePollingResult<T> {
  data: T | null;
  error: unknown;
}

/**
 * Polls `fetcher` on a `setTimeout` chain (never overlapping requests),
 * stopping automatically once `shouldContinue(data)` returns false. Both
 * `fetcher` and `shouldContinue` must be referentially stable across
 * renders (module-level functions, or wrapped in `useCallback`) since they
 * drive the effect's dependencies.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  shouldContinue: (data: T) => boolean,
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const result = await fetcher();
        if (cancelled) return;
        setData(result);
        setError(null);
        if (shouldContinue(result)) {
          timer = setTimeout(tick, intervalMs);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err);
        timer = setTimeout(tick, intervalMs);
      }
    }

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetcher, intervalMs, shouldContinue]);

  return { data, error };
}
