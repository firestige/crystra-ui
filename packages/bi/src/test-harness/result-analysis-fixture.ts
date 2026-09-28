// Synthetic call-level facts for interaction review, not provider quotes or production metrics.
import { deliveryDirectoryRecords } from "./delivery-directory-fixture";
export const analysisDeliveries = deliveryDirectoryRecords;
export const analysisFacts = analysisDeliveries.flatMap((delivery, d) =>
  Array.from({ length: 12 }, (_, i) => {
    const version = delivery.workflowVersion,
      cached = version === "v3" ? 720 : 240;
    return {
      date: delivery.startedAt.slice(0, 10),
      delivery: delivery.deliveryId,
      version,
      role: i % 2 ? "Reviewer" : "Engineer",
      model: i % 3 ? "Model A" : "Model B",
      provider: i % 4 ? "Provider A" : "Provider B",
      input: 1000 + i * 11 + d * 3,
      cached,
      output: 180 + i * 3,
      cost:
        (1000 + i * 11 + d * 3 - cached) * 0.000002 +
        cached * 0.0000002 +
        (180 + i * 3) * 0.000008,
      ttft: 350 + (i % 6) * 120 + d * 5 + (version === "v2" ? 140 : 0),
    };
  }),
);
export * from "../domain/analysis-catalog";
import {
  type AnalysisDimension,
  type AnalysisMetric,
  type AnalysisItem,
} from "../domain/analysis-catalog";
export function analyzeFacts(
  deliveries: string[],
  dimensions: AnalysisDimension[],
  metrics: AnalysisMetric[],
  operations: Partial<Record<AnalysisMetric, string>>,
) {
  const facts = analysisFacts.filter((row) =>
    deliveries.includes(row.delivery),
  );
  const groups = new Map<string, typeof facts>();
  for (const row of facts) {
    const key = dimensions.length
      ? dimensions.map((key) => row[key]).join(" · ")
      : "全部记录";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups].map(([name, rows]) => ({
    name,
    keys: dimensions.map((key) => rows[0][key]),
    count: rows.length,
    deliveryCount: new Set(rows.map((row) => row.delivery)).size,
    values: Object.fromEntries(
      metrics.map((metric) => {
        let value: number;
        if (metric === "cost") {
          value = rows.reduce((total, row) => total + row.cost, 0);
          if (operations.cost === "mean") value /= rows.length;
          if (operations.cost === "perDelivery")
            value /= new Set(rows.map((row) => row.delivery)).size;
        } else if (metric === "cache")
          value =
            (100 * rows.reduce((total, row) => total + row.cached, 0)) /
            rows.reduce((total, row) => total + row.input, 0);
        else if (metric === "calls") value = rows.length;
        else if (metric !== "ttft") {
          value = rows.reduce(
            (sum, row) =>
              sum +
              (metric === "tokens"
                ? row.input + row.output
                : metric === "uncached"
                  ? row.input - row.cached
                  : row[metric]),
            0,
          );
        } else {
          const values = rows.map((row) => row.ttft).sort((a, b) => a - b);
          value =
            operations.ttft === "mean"
              ? values.reduce((a, b) => a + b, 0) / values.length
              : values[
                  Math.ceil(
                    values.length * (operations.ttft === "p50" ? 0.5 : 0.95),
                  ) - 1
                ];
        }
        return [metric, value];
      }),
    ) as Record<AnalysisMetric, number>,
  }));
}

export function analyzeItems(
  deliveries: string[],
  dimensions: AnalysisDimension[],
  items: AnalysisItem[],
) {
  const base = analyzeFacts(deliveries, dimensions, [], {
    cost: "sum",
    cache: "ratio",
    calls: "count",
    ttft: "p95",
  });
  const values = items.map((item) =>
    analyzeFacts(deliveries, dimensions, [item.metric], {
      cost: "sum",
      cache: "ratio",
      calls: "count",
      ttft: "p95",
      [item.metric]: item.operation,
    }),
  );
  return base.map((row, index) => ({
    ...row,
    values: Object.fromEntries(
      items.map((item, i) => [item.id, values[i][index].values[item.metric]]),
    ),
  }));
}
