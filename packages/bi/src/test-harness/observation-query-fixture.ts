import { inObservationRange } from "./observation-clock";
import type {
  ObservationQuery,
  ObservationQueryCatalog,
  ObservationQueryResult,
} from "../domain/observation-query";
import type { WidgetData } from "../domain/widget-families";
import {
  overviewRecords,
  overviewSources,
  type OverviewFilters,
} from "./observation-overview-fixture";

import { observationMetrics as metrics } from "../domain/observation-metrics";
type RecordRow = (typeof overviewRecords)[number];
const sum = (
  rows: RecordRow[],
  key:
    | "money"
    | "calls"
    | "input"
    | "output"
    | "cached"
    | "duration"
    | "runs"
    | "reworks",
) => rows.reduce((n, r) => n + r[key], 0);
const round = (n: number) => Math.round(n * 100) / 100;
export function createObservationQueryCatalog(
  period: string,
  filters: OverviewFilters = {
    group: "provider",
    workflow: "all",
    role: "all",
    tokens: "total",
  },
  allRecords = overviewRecords,
): ObservationQueryCatalog {
  const providers = [...new Set(allRecords.map((r) => r.provider))];
  const models = [
    ...new Map(
      allRecords.map((r) => [
        `${r.provider} / ${r.model}`,
        {
          id: `${r.provider} / ${r.model}`,
          provider: r.provider,
          label: r.model,
        },
      ]),
    ).values(),
  ];
  return {
    metrics,
    providers,
    models,
    resolve(q: ObservationQuery): ObservationQueryResult {
      const m = metrics.find((m) => m.id === q?.metric);
      if (
        !m ||
        !m.groups.includes(q.groupBy) ||
        !m.times.includes(q.time) ||
        !["total", "input", "output"].includes(q.tokens)
      )
        throw new Error("指标配置不兼容");
      for (const selection of [q.providers, q.models])
        if (
          selection !== "all" &&
          (!Array.isArray(selection) ||
            selection.length === 0 ||
            selection.some((x) => typeof x !== "string"))
        )
          throw new Error("至少选择一个来源");
      if (!m.dimensions && (q.providers !== "all" || q.models !== "all"))
        throw new Error("该指标不支持来源筛选");
      if (!m.dimensions) {
        const presets = overviewSources(period, filters);
        return {
          ...presets[
            m.id === "interventions" && q.time === "summary"
              ? "interventionKinds"
              : m.id
          ],
          topic: m.topic,
        };
      }
      const matches = (r: RecordRow) =>
        (q.providers === "all" || q.providers.includes(r.provider)) &&
        (q.models === "all" ||
          q.models.includes(`${r.provider} / ${r.model}`)) &&
        (m.topic !== "quality" ||
          ((filters.workflow === "all" || filters.workflow === r.workflow) &&
            (filters.role === "all" || filters.role === r.role))) &&
        (m.id !== "spend" || r.provider !== "Copilot") &&
        (m.id !== "equivalent" || r.provider === "Copilot");
      const universe = allRecords.filter(matches);
      const rows = universe.filter((r) => inObservationRange(r.date, period));
      const unit =
        m.id === "cache" || m.id === "roleRework"
          ? "%"
          : m.id === "tokens"
            ? "Tokens"
            : m.id === "calls"
              ? "次"
              : m.id === "roleDuration"
                ? "秒"
                : m.id === "roleCost"
                  ? "元 / 次"
                  : "元";
      const ratio = m.id === "cache" || m.id === "roleRework";
      const additive = ["spend", "equivalent", "calls", "tokens"].includes(
        m.id,
      );
      const value = (rs: RecordRow[]): number | null => {
        if (!rs.length) return additive ? 0 : null;
        if (m.id === "cache")
          return sum(rs, "input") > 0
            ? round((100 * sum(rs, "cached")) / sum(rs, "input"))
            : null;
        if (m.id === "roleRework")
          return sum(rs, "runs") > 0
            ? round((100 * sum(rs, "reworks")) / sum(rs, "runs"))
            : null;
        if (m.id === "roleDuration" || m.id === "roleCost")
          return sum(rs, "runs") > 0
            ? round(
                sum(rs, m.id === "roleDuration" ? "duration" : "money") /
                  sum(rs, "runs"),
              )
            : null;
        if (m.id === "tokens")
          return (
            (q.tokens === "output" ? 0 : sum(rs, "input")) +
            (q.tokens === "input" ? 0 : sum(rs, "output"))
          );
        return round(sum(rs, m.id === "calls" ? "calls" : "money"));
      };
      const group = (r: RecordRow) =>
        q.groupBy === "provider"
          ? r.provider
          : q.groupBy === "model"
            ? `${r.provider} / ${r.model}`
            : q.groupBy === "role"
              ? r.role
              : "合计";
      const groups =
        q.groupBy === "none" ? ["合计"] : [...new Set(universe.map(group))];
      const days = [
        ...new Set(
          allRecords
            .filter((r) => inObservationRange(r.date, period))
            .map((r) => r.day),
        ),
      ];
      const title =
        m.label +
        (q.time === "daily" ? " · 每日" : "") +
        (q.groupBy !== "none"
          ? ` · 按 ${q.groupBy === "role" ? "Role" : q.groupBy === "model" ? "Model" : "Provider"}`
          : "");
      const getColor = (g: string) =>
        universe.find((r) => group(r) === g)?.color;
      let data: WidgetData,
        view: ObservationQueryResult["view"],
        size: ObservationQueryResult["size"] = "2x3";
      if (q.time === "summary" && q.groupBy === "none") {
        data = {
          family: "scalar",
          title,
          value: value(rows) ?? 0,
          unit,
          ...(ratio
            ? {
                domain: [0, 100] as [number, number],
                target: 100,
                targetLabel: "100%",
              }
            : {}),
          identityIcon:
            m.id === "tokens"
              ? "binary"
              : m.id === "calls"
                ? "arrows-exchange"
                : m.id === "spend"
                  ? "coins"
                  : m.id === "equivalent"
                    ? "receipt"
                    : "clock",
        };
        view = ratio ? "gauge" : "number";
        size = ratio ? "1x1" : "1x2";
      } else {
        const dimensions = q.time === "daily" ? days : ["所选周期"];
        const series = groups.map((g) => ({
          name: g,
          color: getColor(g),
          values: dimensions.map((day) =>
            value(
              rows.filter(
                (r) => group(r) === g && (q.time !== "daily" || r.day === day),
              ),
            ),
          ),
        }));
        data = {
          family: "matrix",
          title,
          unit,
          dimensions,
          rows: series,
          ordered: q.time === "daily",
          domain: [
            0,
            ratio
              ? 100
              : Math.max(
                  1,
                  ...series.flatMap((r) =>
                    r.values.filter((v): v is number => v !== null),
                  ),
                ),
          ],
          stackable: additive && q.time === "daily",
          legendLabel: m.label,
        };
        view =
          q.time === "daily"
            ? additive &&
              m.id !== "calls" &&
              series.every((r) => r.values.every((v) => v !== null))
              ? "stacked-columns"
              : "multi-line"
            : "grouped-columns";
      }
      return {
        topic: m.topic,
        data,
        view,
        size,
        empty: !rows.length || value(rows) === null,
      };
    },
  };
}
