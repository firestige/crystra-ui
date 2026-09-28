import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { PagedQuery } from "./paged-query";

/** A thin subscription to a host-owned shared query. No per-panel fetch/cache. */
export function usePagedQuery<Row, Meta>(
  resource: PagedQuery<Row, Meta>,
  enabled = true,
) {
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );
  useEffect(() => {
    if (enabled) void resource.actions.load();
  }, [resource, enabled]);
  return { ...snapshot, actions: resource.actions };
}

/** Select/group/aggregate loaded data; changing project never changes the query. */
export function useQueryProjection<Row, Result>(
  rows: readonly Row[],
  project: (rows: readonly Row[]) => Result,
): Result {
  return useMemo(() => project(rows), [rows, project]);
}
