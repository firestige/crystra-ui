import type { MetricResult, MetricSlice } from "./evolution/types";
import { presentExactValue } from "./visualization/presentation";

/** First connected chart. Other charts will have their own interfaces and literal type. */
export interface NumberChartData {
  type: "number";
  value: number;
  unit: string;
  exact: string;
}
export interface EvaluationPanel {
  id: string;
  title: string;
  label: string;
  chart: NumberChartData | null;
  slice: MetricSlice;
}
const titles: Record<string, string> = {
  "operational-token-usage": "已记录 Token 用量",
  "operational-latency-ms": "平均调用耗时",
  "operational-attributable-cost": "已记录可归属费用",
};
/** Project each authoritative slice without inventing totals, time buckets or missing values. */
export function projectEvaluationPanels(
  metrics: readonly MetricResult[],
): EvaluationPanel[] {
  return metrics
    .filter((m) => titles[m.metric_id])
    .flatMap((metric) =>
      metric.slices.map((slice) => {
        const entries = Object.entries(slice.slice_key).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        );
        let chart: NumberChartData | null = null;
        if (
          (slice.state === "AVAILABLE" || slice.state === "LOWER_BOUND") &&
          slice.value &&
          slice.value.kind !== "BOOLEAN"
        ) {
          const [n, d = "1"] = slice.value.value.split("/");
          const value = Number(n) / Number(d);
          if (Number.isFinite(value))
            chart = {
              type: "number",
              value,
              unit: slice.value.unit,
              exact: presentExactValue(slice.value).exact,
            };
        }
        return {
          id: JSON.stringify([
            metric.metric_id,
            metric.metric_version,
            entries,
          ]),
          title: titles[metric.metric_id]!,
          label:
            entries.map(([k, v]) => `${k}: ${v}`).join(" · ") ||
            "当前 Task 范围",
          chart,
          slice,
        };
      }),
    );
}
