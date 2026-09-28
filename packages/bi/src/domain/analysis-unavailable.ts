import type { ObservationSources, OverviewFilters } from "./analysis-overview";
import type {
  ObservationQueryCatalog,
  ObservationQueryResult,
} from "./observation-query";
import type { WidgetData, View } from "./widget-families";
import { observationMetrics } from "./observation-metrics";

export const analysisUnavailableReason = "时间范围数据尚未接入";
// Presentation definitions only: no provider identities, samples, metrics or prices are fabricated.
const matrix = (
  title: string,
  unit: string,
  ordered = true,
  stackable = false,
): WidgetData => ({
  family: "matrix",
  title,
  unit,
  ordered,
  stackable,
  dimensions: [],
  rows: [],
  domain: [0, 1],
});
function unavailable(
  topic: "resources" | "quality",
  data: WidgetData,
  view: View,
  size: ObservationQueryResult["size"] = "2x3",
): ObservationQueryResult {
  return {
    topic,
    data,
    view,
    size,
    empty: true,
    unavailableReason: analysisUnavailableReason,
  };
}
export function unavailableOverview(
  _period: string,
  filters: OverviewFilters,
): ObservationSources {
  const scalar = (title: string, unit: string) =>
    unavailable(
      "resources",
      { family: "scalar", title, value: null, unit },
      "number",
      "1x2",
    );
  return {
    spend: scalar("按量实际费用", "元"),
    equivalent: scalar("订阅用量等价估值", "元"),
    calls: scalar("API 请求总数", "次"),
    input: scalar("Tokens 总量", "Token"),
    costTrend: unavailable(
      "resources",
      matrix("每日费用 · 订阅部分为估值", "元", true, true),
      "stacked-columns",
    ),
    callTrend: unavailable(
      "resources",
      matrix("每日 API 请求", "次"),
      "multi-line",
    ),
    tokenTrend: unavailable(
      "resources",
      matrix(
        `每日 ${filters.tokens === "input" ? "输入 " : filters.tokens === "output" ? "输出 " : ""}Tokens`,
        "Token",
        true,
        true,
      ),
      "stacked-columns",
    ),
    cache0: unavailable(
      "resources",
      {
        family: "scalar",
        title: "Provider 缓存命中率",
        value: null,
        unit: "%",
        domain: [0, 100],
      },
      "gauge",
      "1x1",
    ),
    subscription: unavailable(
      "resources",
      {
        family: "activity",
        title: "订阅费用与覆盖周期",
        state: analysisUnavailableReason,
      },
      "status",
      "1x2",
    ),
    roleDuration: unavailable(
      "quality",
      matrix("Role 平均执行时间", "秒", false),
      "grouped-columns",
    ),
    roleCost: unavailable(
      "quality",
      matrix("同 Role · 各模型单位执行费用", "元 / 次", false),
      "value-table",
    ),
    roleRework: unavailable(
      "quality",
      matrix("Role × Model · 返工发生率", "%", false),
      "heatmap",
    ),
    autonomy: unavailable(
      "quality",
      {
        family: "series",
        title: "每日最长无人工介入运行时间",
        unit: "分钟",
        ordered: true,
        labels: [],
        values: [],
      },
      "line",
    ),
    interventions: unavailable(
      "quality",
      matrix("每日人工介入", "次", true, true),
      "stacked-columns",
    ),
    interventionKinds: unavailable(
      "quality",
      {
        family: "series",
        title: "人工介入原因",
        unit: "次",
        ordered: false,
        labels: [],
        values: [],
      },
      "bars",
    ),
  };
}
export function unavailableQueries(): ObservationQueryCatalog {
  return {
    metrics: observationMetrics,
    providers: [],
    models: [],
    resolve(query) {
      const metric = observationMetrics.find(
        (item) => item.id === query.metric,
      );
      if (!metric) throw Error("未知观察指标");
      if (query.metric === "subscription")
        return unavailable(
          "resources",
          {
            family: "activity",
            title: metric.label,
            state: analysisUnavailableReason,
          },
          "status",
          "1x2",
        );
      if (query.time === "summary" && query.groupBy === "none")
        return unavailable(
          metric.topic,
          { family: "scalar", title: metric.label, value: null, unit: "" },
          "number",
          "1x2",
        );
      return unavailable(
        metric.topic,
        matrix(metric.label, "", query.time === "daily"),
        query.time === "daily" ? "multi-line" : "grouped-columns",
      );
    },
  };
}
