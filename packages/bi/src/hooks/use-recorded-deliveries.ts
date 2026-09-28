import { useEffect, useMemo, useRef, useState } from "react";
import {
  createDeliveryDirectoryQuery,
  type DirectoryTransport,
  type DirectoryMetadata,
} from "../domain/evidence/directory-query";
import type {
  DeliverySearchRecord,
  DeliverySearchCondition,
} from "../domain/delivery-search";
import type { PagedQueryState } from "../support/data/paged-query";
import {
  currentObservationDate,
  observationRange,
  timestamp,
} from "../domain/observation-time";
import { deliveryDirectoryData } from "../domain/analysis-deliveries";
const empty: PagedQueryState<DeliverySearchRecord, DirectoryMetadata> = {
  phase: "idle",
  operation: null,
  rows: [],
  hasMore: false,
  error: null,
  meta: undefined,
};
export function useRecordedDeliveries(
  transport: DirectoryTransport,
  period: string,
  enabled: boolean,
  conditions: readonly DeliverySearchCondition[] = [],
) {
  const [refreshCount, setRefreshCount] = useState(0);
  const referenceDate = currentObservationDate();
  const conditionKey = JSON.stringify(conditions);
  const key = JSON.stringify([period, referenceDate, conditionKey]);
  const [entry, setEntry] = useState({ key: "", state: empty });
  const current = useRef<ReturnType<
    typeof createDeliveryDirectoryQuery
  > | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const [start, end] = observationRange(period, referenceDate);
    const query = createDeliveryDirectoryQuery(
      transport,
      {
        recorded_from: new Date(timestamp(start)).toISOString(),
        recorded_to: new Date(timestamp(end)).toISOString(),
      },
      JSON.parse(conditionKey) as DeliverySearchCondition[],
    );
    current.current = query;
    const unsubscribe = query.subscribe(() =>
      setEntry({ key, state: query.getSnapshot() }),
    );
    void query.actions.load();
    return () => {
      unsubscribe();
      query.dispose();
      current.current = null;
    };
  }, [
    transport,
    period,
    enabled,
    refreshCount,
    referenceDate,
    key,
    conditionKey,
  ]);
  const state = enabled && entry.key === key ? entry.state : empty;
  const data = useMemo(() => deliveryDirectoryData(state.rows), [state.rows]);
  return {
    data,
    state,
    loadMore: () => current.current?.actions.loadMore(),
    refresh: () => setRefreshCount((value) => value + 1),
  };
}
