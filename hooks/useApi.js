'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetch-on-mount with loading, error and refetch.
 *
 * `deps` decides when to refetch. A stale-response guard drops results from a
 * request that was superseded while in flight, which otherwise makes rapid
 * filter changes flicker between old and new data.
 */
export function useApi(fetcher, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, loading, error, refetch: run, setData };
}

/** Imperative calls (create/update/delete) with their own pending flag. */
export function useMutation(mutator) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      return await mutator(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutator]);

  return { mutate, loading, error, setError };
}
