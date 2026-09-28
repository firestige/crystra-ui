import {
  analysisDimensions,
  analysisMetrics,
  type AnalysisDimension,
  type AnalysisItem,
} from "./analysis-catalog";
export const observationChartTypes = [
  { value: "grouped-columns", label: "柱状图" },
  { value: "grouped-bars", label: "条形图" },
  { value: "multi-line", label: "折线图" },
  { value: "heatmap", label: "热力图" },
  { value: "radar", label: "雷达图" },
  { value: "area", label: "面积图" },
] as const;
export type ObservationChartType =
  (typeof observationChartTypes)[number]["value"];
export interface ObservationChart {
  id: string;
  title: string;
  items: AnalysisItem[];
  primary: AnalysisDimension;
  secondary: AnalysisDimension | "";
  chartType?: ObservationChartType;
  valueItemIds?: string[];
}
/** Current facts share call grain and chart-wide grouping; derived denominator remains part of the unit. */
export function analysisItemUnit(
  item: Pick<AnalysisItem, "metric" | "operation">,
) {
  if (item.metric === "cost")
    return item.operation === "perDelivery"
      ? "USD/Delivery"
      : item.operation === "mean"
        ? "USD/调用"
        : "USD";
  return analysisMetrics.find((metric) => metric.key === item.metric)!.unit;
}
export function compatibleChartItem(
  items: AnalysisItem[],
  candidate: Pick<AnalysisItem, "metric" | "operation">,
) {
  return items.every(
    (item) => analysisItemUnit(item) === analysisItemUnit(candidate),
  );
}
export interface ObservationSetting {
  id: string;
  name: string;
  charts: ObservationChart[];
}
export function exportObservationSetting(setting: ObservationSetting) {
  return JSON.stringify(
    { kind: "crystra-observation-setting", version: 1, setting },
    null,
    2,
  );
}
export function importObservationSetting(text: string): ObservationSetting {
  const envelope = JSON.parse(text);
  if (
    envelope?.kind !== "crystra-observation-setting" ||
    envelope.version !== 1
  )
    throw Error("不支持的观察设置文件或版本");
  const s = envelope.setting;
  if (
    !s ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    !Array.isArray(s.charts) ||
    s.charts.length > 40
  )
    throw Error("观察设置结构不完整");
  const ids = new Set<string>();
  const dim = (v: unknown) => analysisDimensions.some((d) => d.key === v);
  const charts = s.charts.map((c: ObservationChart) => {
    if (
      !c ||
      typeof c.id !== "string" ||
      ids.has(c.id) ||
      typeof c.title !== "string" ||
      !dim(c.primary) ||
      (c.secondary !== "" &&
        (!dim(c.secondary) || c.secondary === c.primary)) ||
      !Array.isArray(c.items) ||
      c.items.length > 30
    )
      throw Error("图表配置无效");
    ids.add(c.id);
    const itemIds = new Set<string>();
    const items = c.items.map((i: AnalysisItem) => {
      const metric = analysisMetrics.find((m) => m.key === i?.metric);
      if (
        !metric ||
        typeof i.id !== "string" ||
        itemIds.has(i.id) ||
        typeof i.name !== "string" ||
        !metric.operations.some((op) => op.key === i.operation)
      )
        throw Error("指标或计算口径不受支持");
      itemIds.add(i.id);
      return {
        id: i.id,
        name: i.name,
        metric: i.metric,
        operation: i.operation,
      };
    });
    if (items.some((item: AnalysisItem) => !compatibleChartItem(items, item)))
      throw Error("同一图表的指标单位或统计粒度不兼容，请拆成不同图表");
    if (
      c.chartType !== undefined &&
      !observationChartTypes.some((type) => type.value === c.chartType)
    )
      throw Error("图形类型不受支持");
    if (
      c.valueItemIds !== undefined &&
      (!Array.isArray(c.valueItemIds) ||
        c.valueItemIds.some((id: unknown) => !itemIds.has(id as string)) ||
        new Set(c.valueItemIds).size !== c.valueItemIds.length)
    )
      throw Error("数值轴映射无效");
    if (
      c.chartType === "heatmap" &&
      (c.valueItemIds ?? items.map((item: AnalysisItem) => item.id)).length > 1
    )
      throw Error("热力图颜色只能映射一个指标");
    return {
      ...(c.valueItemIds ? { valueItemIds: c.valueItemIds } : {}),
      ...(c.chartType ? { chartType: c.chartType } : {}),
      id: c.id,
      title: c.title,
      primary: c.primary,
      secondary: c.secondary,
      items,
    };
  });
  return {
    id: typeof s.id === "string" ? s.id : "imported",
    name: s.name,
    charts,
  };
}
