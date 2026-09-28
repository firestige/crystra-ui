import type { MetricResult } from "./types";

/** Business-owned semantic adapter. T can be any chart interface or typed intermediate. */
export interface MetricAdapter<T> {
  readonly metricId: string;
  readonly metricVersion: string;
  readonly project: (result: MetricResult) => T | undefined;
}
export type MetricBinding<T> =
  { status: "available"; data: T } | { status: "missing" | "incompatible" };

/** Never substitute versions, change the query scope, or manufacture a missing result. */
export function bindMetric<T>(
  metrics: readonly MetricResult[],
  adapter: MetricAdapter<T>,
): MetricBinding<T> {
  const candidates = metrics.filter(
    (metric) => metric.metric_id === adapter.metricId,
  );
  if (!candidates.length) return { status: "missing" };
  const matches = candidates.filter(
    (metric) => metric.metric_version === adapter.metricVersion,
  );
  if (matches.length !== 1) return { status: "incompatible" };
  const data = adapter.project(matches[0]!);
  return data === undefined
    ? { status: "incompatible" }
    : { status: "available", data };
}
