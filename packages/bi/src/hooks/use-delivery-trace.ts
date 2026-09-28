import { useEffect, useMemo, useRef, useState } from "react";
import {
  createDeliveryTraceQuery,
  type EvidenceQueryTransport,
  type TraceQueryMetadata,
} from "../domain/evidence/analysis-query";
import {
  currentObservationDate,
  observationRange,
  timestamp,
} from "../domain/observation-time";
import { compileTraceView } from "../domain/trace/trace-view";
import type { TraceItem } from "../domain/evidence/types";
import type { PagedQueryState } from "../support/data/paged-query";
const empty: PagedQueryState<TraceItem, TraceQueryMetadata> = {
  phase: "idle",
  operation: null,
  rows: [],
  hasMore: false,
  error: null,
  meta: undefined,
};
/** Selected Trace has its own traversal; directory pagination never limits its contents. */
export function useDeliveryTrace(
  transport: EvidenceQueryTransport,
  traceId: string | null,
  period: string,
  refreshCount = 0,
) {
  const referenceDate = currentObservationDate();
  const key = JSON.stringify([traceId, period, referenceDate, refreshCount]);
  const [entry, setEntry] = useState({ key: "", state: empty });
  const current = useRef<ReturnType<typeof createDeliveryTraceQuery> | null>(
    null,
  );
  useEffect(() => {
    if (!traceId) return;
    const [start, end] = observationRange(period, referenceDate);
    const query = createDeliveryTraceQuery(transport, {
      trace_id: traceId,
      recorded_from: new Date(timestamp(start)).toISOString(),
      recorded_to: new Date(timestamp(end)).toISOString(),
    });
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
  }, [transport, traceId, period, referenceDate, key]);
  const state = entry.key === key ? entry.state : empty;
  const trace = useMemo(
    () => (state.rows.length ? compileTraceView(state.rows) : null),
    [state.rows],
  );
  return { state, trace, loadMore: () => current.current?.actions.loadMore() };
}
