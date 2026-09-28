import { bindMetric } from "./evolution/metric-binding";
import { tokenUsage, tokens } from "./analysis-metrics/token-usage";
import type { AnalysisData } from "./analysis-data";
import type { MetricResult } from "./evolution/types";
import type { OverviewFilters } from "./analysis-overview";
import type { ObservationQuery } from "./observation-query";
import {
  unavailableOverview,
  unavailableQueries,
} from "./analysis-unavailable";

export function recordedAnalysisData(
  metrics: readonly MetricResult[],
): Partial<AnalysisData> {
  const binding = bindMetric(metrics, tokenUsage);
  const slices = binding.status === "available" ? binding.data : [];
  const scoped = (filters: OverviewFilters) =>
    filters.workflow !== "all"
      ? []
      : slices.filter(
          (s) => filters.role === "all" || s.slice_key.role === filters.role,
        );
  const missing = "当前范围未提供该面板所需的指标或维度";
  return {
    roles: [...new Set(slices.map((s) => s.slice_key.role).filter(Boolean))],
    overview: (period, filters) => {
      const widgets = unavailableOverview(period, filters);
      for (const widget of Object.values(widgets))
        widget.unavailableReason = missing;
      const value = tokens(scoped(filters), filters.tokens);
      widgets.input = {
        ...widgets.input,
        data: {
          family: "scalar",
          title:
            filters.tokens === "total"
              ? "Tokens 总量"
              : filters.tokens === "input"
                ? "输入 Tokens"
                : "输出 Tokens",
          value,
          unit: "Token",
        },
        empty: value === null,
        unavailableReason:
          value === null ? "缺少完整的 Token 指标样本" : undefined,
      };
      return widgets;
    },
    // The business hook has already queried the selected Delivery intersection.
    // This projection never initiates a query from a chart render.
    matrix: (chart) => {
      const empty = {
        family: "matrix" as const,
        title: chart.title,
        unit: "Token",
        dimensions: [],
        rows: [],
        ordered: false,
        domain: [0, 1] as [number, number],
      };
      if (
        [chart.primary, chart.secondary].some(
          (d) => d === "date" || d === "version",
        )
      )
        return {
          ...empty,
          unavailableReason: "当前指标未提供日期或 Workflow 版本切片",
        };
      if (
        !chart.items.length ||
        chart.items.some(
          (item) =>
            !["input", "output", "tokens"].includes(item.metric) ||
            item.operation !== "sum",
        )
      )
        return {
          ...empty,
          unavailableReason: "当前查询未提供该图表所需的指标或样本",
        };
      const dimensions = [
        ...new Set(
          slices.map((s) => s.slice_key[chart.primary]).filter(Boolean),
        ),
      ];
      const secondary = chart.secondary;
      const groups = secondary
        ? [
            ...new Set(
              slices.map((s) => s.slice_key[secondary]).filter(Boolean),
            ),
          ]
        : [""];
      const rows = groups.flatMap((group) =>
        chart.items.map((item) => ({
          name: group ? `${group} · ${item.name}` : item.name,
          values: dimensions.map((d) =>
            tokens(
              slices.filter(
                (s) =>
                  s.slice_key[chart.primary] === d &&
                  (!secondary || s.slice_key[secondary] === group),
              ),
              item.metric === "input"
                ? "input"
                : item.metric === "output"
                  ? "output"
                  : "total",
            ),
          ),
        })),
      );
      const values = rows
        .flatMap((r) => r.values)
        .filter((v): v is number => v !== null);
      return {
        ...empty,
        dimensions,
        rows,
        domain: [0, Math.max(1, ...values)] as [number, number],
        ...(!values.length
          ? { unavailableReason: "所选范围缺少完整的 Token 指标样本" }
          : {}),
      };
    },
    queries: (_period, filters) => {
      const fallback = unavailableQueries();
      const filtered = scoped(filters);
      return {
        ...fallback,
        providers: [
          ...new Set(filtered.map((s) => s.slice_key.provider).filter(Boolean)),
        ],
        models: [
          ...new Map(
            filtered
              .filter((s) => s.slice_key.model)
              .map((s) => [
                `${s.slice_key.provider}/${s.slice_key.model}`,
                {
                  id: s.slice_key.model,
                  provider: s.slice_key.provider,
                  label: s.slice_key.model,
                },
              ]),
          ).values(),
        ],
        resolve(query: ObservationQuery) {
          if (query.metric !== "tokens" || query.time !== "summary")
            return { ...fallback.resolve(query), unavailableReason: missing };
          const selected = filtered.filter(
            (s) =>
              (query.providers === "all" ||
                query.providers.includes(s.slice_key.provider)) &&
              (query.models === "all" ||
                query.models.includes(s.slice_key.model)),
          );
          const value = tokens(selected, query.tokens);
          if (query.groupBy === "none")
            return {
              topic: "resources",
              data: {
                family: "scalar",
                title: "Tokens 用量",
                value,
                unit: "Token",
              },
              view: "number",
              size: "1x2",
              empty: value === null,
              unavailableReason:
                value === null ? "缺少完整的 Token 指标样本" : undefined,
            };
          const dimension = query.groupBy;
          const groups = [
            ...new Set(
              selected.map((s) => s.slice_key[dimension]).filter(Boolean),
            ),
          ];
          const values = groups.map((group) =>
            tokens(
              selected.filter((s) => s.slice_key[dimension] === group),
              query.tokens,
            ),
          );
          return {
            topic: "resources",
            data: {
              family: "matrix",
              title: "Tokens 用量",
              unit: "Token",
              dimensions: groups,
              rows: [{ name: "Tokens", values }],
              ordered: false,
              domain: [
                0,
                Math.max(1, ...values.filter((v): v is number => v !== null)),
              ],
            },
            view: "grouped-columns",
            size: "2x3",
            empty: values.every((v) => v === null),
          };
        },
      };
    },
  };
}
