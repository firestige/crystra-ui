import { inObservationRange } from "../components/observation-time";
import type {
  ObservationMetric,
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

const resourceGroups = ["none", "provider", "model"] as const;
const qualityGroups = ["none", "provider", "model", "role"] as const;
const times = ["summary", "daily"] as const;
const metrics: readonly ObservationMetric[] = [
  {
    id: "spend",
    label: "按量实际费用",
    topic: "resources",
    description: "所选周期内的实际按量费用，不含订阅估值。",
    groups: resourceGroups,
    times,
    dimensions: true,
  },
  {
    id: "equivalent",
    label: "订阅用量等价估值",
    topic: "resources",
    description: "按用量折算的估值，用于与订阅费比较。",
    groups: resourceGroups,
    times,
    dimensions: true,
  },
  {
    id: "calls",
    label: "API 请求次数",
    topic: "resources",
    description: "请求总量，支持按 Provider 或 Model 比较与查看趋势。",
    groups: resourceGroups,
    times,
    dimensions: true,
  },
  {
    id: "tokens",
    label: "Tokens 用量",
    topic: "resources",
    description: "合计、输入或输出 Token，可按来源分组。",
    groups: resourceGroups,
    times,
    dimensions: true,
  },
  {
    id: "cache",
    label: "缓存命中率",
    topic: "resources",
    description:
      "缓存命中输入 Token / 输入 Token。合并时累计分子、分母后求比率。",
    groups: resourceGroups,
    times,
    dimensions: true,
  },
  {
    id: "subscription",
    label: "订阅信息",
    topic: "resources",
    description: "展示订阅费、周期与用量等价估值；当前样本为 Copilot。",
    groups: ["none"],
    times: ["summary"],
    dimensions: false,
  },
  {
    id: "roleDuration",
    label: "Role 平均执行时间",
    topic: "quality",
    description: "累计执行时间 / 执行次数，继承页面的 Workflow 与 Role 范围。",
    groups: qualityGroups,
    times,
    dimensions: true,
  },
  {
    id: "roleCost",
    label: "Role 单位执行费用",
    topic: "quality",
    description: "累计费用 / 执行次数；订阅部分为用量估值。",
    groups: qualityGroups,
    times,
    dimensions: true,
  },
  {
    id: "roleRework",
    label: "Role 返工发生率",
    topic: "quality",
    description:
      "发生返工的执行次数 / 执行次数，继承页面的 Workflow 与 Role 范围。",
    groups: qualityGroups,
    times,
    dimensions: true,
  },
  {
    id: "autonomy",
    label: "无人工介入运行时间",
    topic: "quality",
    description: "每日最长连续自主运行时长，继承页面的 Workflow 与 Role 范围。",
    groups: ["none"],
    times: ["daily"],
    dimensions: false,
  },
  {
    id: "interventions",
    label: "人工介入次数",
    topic: "quality",
    description:
      "按计划内裁决、纠偏与主动变更展示，继承页面的 Workflow 与 Role 范围。",
    groups: ["none"],
    times,
    dimensions: false,
  },
];
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
