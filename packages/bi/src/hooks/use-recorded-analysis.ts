import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRecordedEvaluationQuery,
  type RecordedEvaluationTransport,
} from "../domain/evolution/recorded-query";
import type {
  MetricResult,
  RecordedEvaluationContext,
} from "../domain/evolution/types";
import { recordedAnalysisData } from "../domain/analysis-recorded";
import {
  currentObservationDate,
  observationRange,
  timestamp,
} from "../domain/observation-time";
import type { PagedQueryState } from "../support/data/paged-query";
const empty: PagedQueryState<MetricResult, RecordedEvaluationContext> = {
  phase: "idle",
  operation: null,
  rows: [],
  hasMore: false,
  error: null,
  meta: undefined,
};
export function useRecordedAnalysis(
  transport: RecordedEvaluationTransport,
  period: string,
  onRefresh?: () => void,
  deliverySubset: readonly string[] | null = null,
  enabled = true,
) {
  const refreshObserver = useRef(onRefresh);
  useEffect(() => {
    refreshObserver.current = onRefresh;
  }, [onRefresh]);
  const [cadence, setCadence] = useState("0");
  const [refreshCount, setRefreshCount] = useState(0);
  const [entry, setEntry] = useState<{ key: string; state: typeof empty }>({
    key: "",
    state: empty,
  });
  const current = useRef<{
    key: string;
    query: ReturnType<typeof createRecordedEvaluationQuery>;
  } | null>(null);
  const subsetKey = JSON.stringify(deliverySubset);
  const referenceDate = currentObservationDate();
  const key = JSON.stringify([period, subsetKey, referenceDate]);
  useEffect(() => {
    if (!enabled) return;
    const [start, end] = observationRange(period, referenceDate);
    const query = createRecordedEvaluationQuery(transport, {
      recorded_from: new Date(timestamp(start)).toISOString(),
      recorded_to: new Date(timestamp(end)).toISOString(),
      ...(subsetKey === "null"
        ? {}
        : { delivery_ids: JSON.parse(subsetKey) as string[] }),
    });
    current.current = { key, query };
    const unsubscribe = query.subscribe(() =>
      setEntry({ key, state: query.getSnapshot() }),
    );
    void query.actions.load();
    return () => {
      unsubscribe();
      query.dispose();
      if (current.current?.query === query) current.current = null;
    };
  }, [transport, period, key, subsetKey, enabled, refreshCount, referenceDate]);
  const refresh = useCallback(() => {
    setRefreshCount((v) => v + 1);
    refreshObserver.current?.();
  }, []);
  useEffect(() => {
    const seconds = Number(cadence);
    if (![15, 30, 60, 300].includes(seconds)) return;
    const timer = setInterval(refresh, seconds * 1000);
    return () => clearInterval(timer);
  }, [cadence, refresh]);
  const state = enabled && entry.key === key ? entry.state : empty;
  const data = useMemo(
    () => ({ ...recordedAnalysisData(state.rows), referenceDate }),
    [state.rows, referenceDate],
  );
  return { data, state, refresh, refreshCount, cadence, setCadence };
}
