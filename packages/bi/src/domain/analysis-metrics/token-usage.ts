import type { MetricSlice } from "../evolution/types";
import type { MetricAdapter } from "../evolution/metric-binding";

export const tokenUsage: MetricAdapter<readonly MetricSlice[]> = {
  metricId: "operational-token-usage",
  metricVersion: "2.0.0",
  project: (result) => result.slices,
};

export function tokens(
  slices: readonly MetricSlice[],
  direction: "total" | "input" | "output",
) {
  const selected = slices.filter(
    (s) => direction === "total" || s.slice_key.direction === direction,
  );
  if (!selected.length) return null;
  const cohorts = new Map<string, Set<string>>();
  let value = 0n;
  for (const slice of selected) {
    if (
      slice.state !== "AVAILABLE" ||
      slice.value?.kind !== "QUANTITY" ||
      slice.value.unit !== "tokens" ||
      slice.coverage?.state !== "FULL"
    )
      return null;
    const key = JSON.stringify([
      slice.slice_key.provider,
      slice.slice_key.model,
      slice.slice_key.role,
      slice.slice_key.runtime,
    ]);
    const directions = cohorts.get(key) ?? new Set<string>();
    directions.add(slice.slice_key.direction);
    cohorts.set(key, directions);
    if (!/^\d+$/.test(slice.value.value)) return null;
    value += BigInt(slice.value.value);
  }
  if (
    direction === "total" &&
    [...cohorts.values()].some((v) => !v.has("input") || !v.has("output"))
  )
    return null;
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}
