import type { MatrixData } from "../domain/widget-families";
import {
  analysisMetrics,
  analyzeItems,
  type AnalysisDimension,
  type AnalysisItem,
} from "./result-analysis-fixture";
import {
  analysisItemUnit,
  type ObservationChart,
  type ObservationSetting,
} from "../domain/observation-settings";
export * from "../domain/observation-settings";
export const initialObservationSettings: ObservationSetting[] = [
  {
    id: "versions",
    name: "版本变更观察",
    charts: [
      {
        id: "cost",
        title: "版本费用",
        items: [
          {
            id: "cost-value",
            metric: "cost",
            operation: "perDelivery",
            name: "实际费用",
          },
        ],
        primary: "version",
        secondary: "role",
        chartType: "grouped-columns",
      },
      {
        id: "cache",
        title: "Provider 缓存表现",
        items: [
          {
            id: "cache-value",
            metric: "cache",
            operation: "ratio",
            name: "缓存命中率",
          },
        ],
        primary: "provider",
        secondary: "",
        chartType: "grouped-bars",
      },
    ],
  },
  {
    id: "models",
    name: "模型与 Role 表现",
    charts: [
      {
        id: "latency",
        title: "模型延时",
        items: [
          { id: "p50", metric: "ttft", operation: "p50", name: "P50" },
          { id: "p95", metric: "ttft", operation: "p95", name: "P95" },
        ],
        primary: "model",
        secondary: "role",
      },
    ],
  },
  {
    id: "shapes",
    name: "矩阵与多系列观察",
    charts: [
      {
        id: "matrix",
        title: "模型 × Role 缓存命中率",
        items: [
          {
            id: "heat-cache",
            metric: "cache",
            operation: "ratio",
            name: "缓存命中率",
          },
        ],
        primary: "model",
        secondary: "role",
        chartType: "heatmap",
      },
      {
        id: "radar",
        title: "模型延时分布",
        items: [
          { id: "r50", metric: "ttft", operation: "p50", name: "P50" },
          { id: "r95", metric: "ttft", operation: "p95", name: "P95" },
          { id: "rmean", metric: "ttft", operation: "mean", name: "平均延时" },
        ],
        primary: "model",
        secondary: "",
        chartType: "radar",
      },
      {
        id: "area",
        title: "每日费用",
        items: [
          {
            id: "daily-cost",
            metric: "cost",
            operation: "sum",
            name: "总费用",
          },
        ],
        primary: "date",
        secondary: "provider",
        chartType: "area",
      },
    ],
  },
];
/** Pivot grouped facts into real axes; absence stays null rather than becoming zero. */
export function observationMatrix(
  chart: ObservationChart,
  deliveries: string[],
): MatrixData {
  chart = {
    ...chart,
    items: chart.items.filter(
      (item) => !chart.valueItemIds || chart.valueItemIds.includes(item.id),
    ),
  };
  const radar = chart.chartType === "radar";
  const dimensions = [
    chart.primary,
    ...(!radar && chart.secondary ? [chart.secondary] : []),
  ] as AnalysisDimension[];
  const groups = analyzeItems(deliveries, dimensions, chart.items);
  const itemLabel = (item: AnalysisItem) =>
    item.name || analysisMetrics.find((m) => m.key === item.metric)!.label;
  const axis = [...new Set(groups.map((g) => g.keys[0]))].sort();
  const splits =
    chart.secondary && !radar
      ? [...new Set(groups.map((g) => g.keys[1]))].sort()
      : [""];
  const rows = radar
    ? groups.map((group) => ({
        name: group.name,
        values: chart.items.map((item) => group.values[item.id]),
      }))
    : chart.items.flatMap((item) =>
        splits.map((split) => ({
          name: split
            ? chart.items.length === 1
              ? split
              : `${split} · ${itemLabel(item)}`
            : itemLabel(item),
          values: axis.map((value) => {
            const group = groups.find(
              (g) =>
                g.keys[0] === value &&
                (!chart.secondary || g.keys[1] === split),
            );
            return group ? group.values[item.id] : null;
          }),
        })),
      );
  return {
    family: "matrix",
    title: chart.title,
    unit: chart.items.length ? analysisItemUnit(chart.items[0]) : "",
    dimensions: radar ? chart.items.map(itemLabel) : axis,
    rows,
    ordered: chart.primary === "date",
    domain:
      chart.items[0]?.metric === "cache"
        ? [0, 100]
        : [
            0,
            Math.max(0.01, ...rows.flatMap((r) => r.values.map((v) => v ?? 0))),
          ],
  };
}
