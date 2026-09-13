import { ObservationSources } from "../components/observation-layout-codec";
import { inObservationRange } from "../components/observation-time";
import type { MatrixData, View, WidgetData } from "../domain/widget-families";

// Illustrative usage and pricing only; no provider tariffs or billing claims.
export const overviewModels = [
  { provider: "DeepSeek", model: "V3", color: "#679efe", price: 1 },
  { provider: "DeepSeek", model: "R1", color: "#89b7ff", price: 1.8 },
  { provider: "OpenAI", model: "GPT-5", color: "#32bd91", price: 4.4 },
  { provider: "OpenAI", model: "GPT-5 mini", color: "#77d9b9", price: 1.5 },
  { provider: "Copilot", model: "Sonnet", color: "#ba92f5", price: 3.6 },
  { provider: "Copilot", model: "GPT-5", color: "#dfb7ff", price: 3.2 },
];
const roles = ["Engineer", "Reviewer", "Scout"];
export const overviewRecords = Array.from({ length: 30 }, (_, day) =>
  overviewModels.flatMap((m, model) =>
    roles.flatMap((role, r) =>
      ["implementation", "research"].map((workflow, w) => {
        const calls = 3 + ((day * 3 + model * 2 + r + w) % 9),
          input = calls * (1900 + model * 280 + r * 370 + day * 31),
          output = calls * (510 + r * 210 + day * 7);
        const date = new Date(Date.UTC(2026, 7, 11 + day))
          .toISOString()
          .slice(0, 10);
        return {
          ...m,
          role,
          workflow,
          date,
          day: date.slice(5).replace("-", "/"),
          calls,
          input,
          output,
          cached: Math.round(input * (0.32 + model * 0.075 + (day % 5) * 0.02)),
          money: Math.round(((input + output) * m.price) / 1000) / 100,
          duration: Math.round(
            (5 + model * 1.2 + r * 2 + w * 3 + (day % 4)) * calls,
          ),
          runs: 4 + ((day + model + r + w) % 5),
          reworks: (day + model * 2 + r + w) % 6 === 0 ? 1 : 0,
        };
      }),
    ),
  ),
).flat();
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0),
  round = (n: number) => Math.round(n * 100) / 100;
export interface OverviewFilters {
  group: "provider" | "model";
  workflow: string;
  role: string;
  tokens: "total" | "input" | "output";
}
export function overviewSources(
  period: string,
  filters: OverviewFilters,
): ObservationSources {
  const records = overviewRecords.filter((r) =>
    inObservationRange(r.date, period),
  );
  const days = [...new Set(records.map((r) => r.day))];
  const providers = [...new Set(overviewModels.map((m) => m.provider))];
  const quality = records.filter(
    (r) =>
      (filters.workflow === "all" || r.workflow === filters.workflow) &&
      (filters.role === "all" || r.role === filters.role),
  );
  const selectedRoles = filters.role === "all" ? roles : [filters.role];
  const groupName = (r: (typeof records)[number]) =>
    filters.group === "provider" ? r.provider : `${r.provider} / ${r.model}`;
  const groups = [
    ...new Set(
      overviewModels.map((m) =>
        filters.group === "provider"
          ? m.provider
          : `${m.provider} / ${m.model}`,
      ),
    ),
  ];
  const color = (name: string) =>
    overviewModels.find(
      (m) =>
        (filters.group === "provider"
          ? m.provider
          : `${m.provider} / ${m.model}`) === name,
    )?.color;
  const sources: ObservationSources = {};
  const put = (
    id: string,
    topic: "resources" | "quality",
    data: WidgetData,
    view: View,
    size = "2x3",
  ) => {
    sources[id] = {
      topic,
      data,
      view,
      size: size as ObservationSources[string]["size"],
    };
  };
  const scalar = (
    id: string,
    title: string,
    value: number,
    unit: string,
    extra = {},
  ) =>
    put(
      id,
      "resources",
      { family: "scalar", title, value, unit, ...extra },
      "number",
      "1x2",
    );
  const matrix = (
    title: string,
    unit: string,
    dimensions: string[],
    rows: MatrixData["rows"],
    ordered = true,
    stackable = false,
  ): MatrixData => ({
    family: "matrix",
    title,
    unit,
    dimensions,
    rows,
    ordered,
    stackable,
    domain: [
      0,
      Math.ceil(
        Math.max(
          1,
          ...rows.flatMap((r) =>
            r.values.filter((v): v is number => v !== null),
          ),
        ),
      ),
    ],
  });
  scalar(
    "spend",
    "按量实际费用",
    round(
      sum(records.filter((r) => r.provider !== "Copilot").map((r) => r.money)),
    ),
    "元",
  );
  scalar(
    "equivalent",
    "订阅用量等价估值",
    round(
      sum(records.filter((r) => r.provider === "Copilot").map((r) => r.money)),
    ),
    "元",
  );
  scalar("calls", "API 请求总数", sum(records.map((r) => r.calls)), "次", {
    identityIcon: "clock",
  });
  scalar(
    "input",
    "Tokens 总量",
    round(sum(records.map((r) => r.input + r.output)) / 1e6),
    "M",
  );
  providers.forEach((provider, i) => {
    const rs = records.filter((r) => r.provider === provider);
    put(
      `cache${i}`,
      "resources",
      {
        family: "scalar",
        title: `${provider} · 缓存命中率`,
        value: round(
          (100 * sum(rs.map((r) => r.cached))) /
            Math.max(1, sum(rs.map((r) => r.input))),
        ),
        unit: "%",
        domain: [0, 100],
      },
      "gauge",
      "1x1",
    );
  });
  put(
    "subscription",
    "resources",
    {
      family: "activity",
      title: "Copilot · 订阅",
      state: "订阅费 ¥160 / 月",
      headline: `¥${round(sum(records.filter((r) => r.provider === "Copilot").map((r) => r.money))).toFixed(2)}`,
      context: "所选期间按量等价估值 · 订阅 09/01—09/30",
    },
    "status",
    "1x2",
  );
  const daily = (
    pick: (r: (typeof records)[number]) => number,
    title: string,
    unit: string,
    stack = false,
  ) =>
    matrix(
      title,
      unit,
      days,
      groups.map((name) => ({
        name,
        color: color(name),
        values: days.map((day) =>
          round(
            sum(
              records
                .filter((r) => r.day === day && groupName(r) === name)
                .map(pick),
            ),
          ),
        ),
      })),
      true,
      stack,
    );
  put(
    "costTrend",
    "resources",
    daily((r) => r.money, "每日费用 · 订阅部分为估值", "元", true),
    "stacked-columns",
  );
  put(
    "callTrend",
    "resources",
    daily((r) => r.calls, "每日 API 请求", "次"),
    "multi-line",
  );
  const tokenTitle =
    filters.tokens === "total"
      ? "Tokens"
      : filters.tokens === "input"
        ? "输入 Tokens"
        : "输出 Tokens";
  put(
    "tokenTrend",
    "resources",
    daily(
      (r) =>
        (filters.tokens === "input"
          ? r.input
          : filters.tokens === "output"
            ? r.output
            : r.input + r.output) / 1000,
      `每日 ${tokenTitle}`,
      "k",
      true,
    ),
    "stacked-columns",
  );
  const modelRows = (calc: (rs: typeof records) => number) =>
    overviewModels.map((m) => ({
      name: `${m.provider} / ${m.model}`,
      color: m.color,
      values: selectedRoles.map((role) =>
        calc(
          quality.filter(
            (r) =>
              r.provider === m.provider &&
              r.model === m.model &&
              r.role === role,
          ),
        ),
      ),
    }));
  put(
    "roleDuration",
    "quality",
    matrix(
      "Role 平均执行时间",
      "秒",
      selectedRoles,
      modelRows((rs) =>
        round(
          sum(rs.map((r) => r.duration)) /
            Math.max(1, sum(rs.map((r) => r.runs))),
        ),
      ),
      false,
    ),
    "grouped-columns",
  );
  put(
    "roleCost",
    "quality",
    matrix(
      "同 Role · 各模型单位执行费用",
      "元 / 次",
      selectedRoles,
      modelRows((rs) =>
        round(
          sum(rs.map((r) => r.money)) / Math.max(1, sum(rs.map((r) => r.runs))),
        ),
      ),
      false,
    ),
    "value-table",
  );
  put(
    "roleRework",
    "quality",
    matrix(
      "Role × Model · 返工发生率",
      "%",
      selectedRoles,
      modelRows((rs) =>
        round(
          (100 * sum(rs.map((r) => r.reworks))) /
            Math.max(1, sum(rs.map((r) => r.runs))),
        ),
      ),
      false,
    ),
    "heatmap",
  );
  const autonomy = days.map((day, i) => {
    const rs = quality.filter((r) => r.day === day);
    return Math.round(35 + sum(rs.map((r) => r.duration)) / 120 + (i % 4) * 8);
  });
  put(
    "autonomy",
    "quality",
    {
      family: "series",
      title: `每日最长无人工介入 · 最长 ${Math.max(0, ...autonomy)} 分钟`,
      unit: "分钟",
      ordered: true,
      labels: days,
      values: autonomy,
    },
    "line",
  );
  const interventions = days.map((day, i) => {
    const rs = quality.filter((r) => r.day === day);
    return {
      day,
      planned: Math.max(1, Math.round(rs.length / 12)),
      repair: sum(rs.map((r) => r.reworks)),
      change: i % 3 === 0 ? 1 : 0,
    };
  });
  const reworkData = sources.roleRework.data as MatrixData;
  reworkData.legendLabel = "返工发生率";
  const totalInterventions = sum(
    interventions.map((r) => r.planned + r.repair + r.change),
  );
  put(
    "interventions",
    "quality",
    matrix(
      `每日人工介入 · 共 ${totalInterventions} 次`,
      "次",
      days,
      [
        {
          name: "计划内裁决",
          color: "#679efe",
          values: interventions.map((r) => r.planned),
        },
        {
          name: "纠偏",
          color: "#f0b85e",
          values: interventions.map((r) => r.repair),
        },
        {
          name: "主动变更",
          color: "#ba92f5",
          values: interventions.map((r) => r.change),
        },
      ],
      true,
      true,
    ),
    "stacked-columns",
  );
  put(
    "interventionKinds",
    "quality",
    {
      family: "series",
      title: "人工介入原因",
      unit: "次",
      ordered: false,
      labels: ["计划内裁决", "纠偏", "主动变更"],
      values: [
        sum(interventions.map((r) => r.planned)),
        sum(interventions.map((r) => r.repair)),
        sum(interventions.map((r) => r.change)),
      ],
    },
    "bars",
  );
  const icons = {
    spend: "coins",
    equivalent: "receipt",
    calls: "arrows-exchange",
    input: "binary",
  } as const;
  for (const [id, icon] of Object.entries(icons)) {
    const data = sources[id].data;
    if (data.family === "scalar") data.identityIcon = icon;
  }
  providers.forEach((provider, i) => {
    const data = sources[`cache${i}`].data;
    if (data.family === "scalar")
      data.color = overviewModels.find((m) => m.provider === provider)!.color;
  });
  const costData = sources.roleCost.data as MatrixData;
  costData.legendLabel = "单位执行费用 · 订阅为估值";
  costData.rows.forEach((row, i) => {
    const m = overviewModels[i];
    row.samples = selectedRoles.map((role) =>
      sum(
        quality
          .filter(
            (r) =>
              r.provider === m.provider &&
              r.model === m.model &&
              r.role === role,
          )
          .map((r) => r.runs),
      ),
    );
  });
  return sources;
}
