import type { WidgetData, View } from "./widget-families";
export type ChartRange = {
  mode: "auto" | "zero" | "full" | "custom";
  min?: number;
  max?: number;
};
export const supportsChartRange = (data: WidgetData, view: View) =>
  !["scalar", "activity", "composition"].includes(data.family) &&
  !["value-table", "frequency-table"].includes(view);
export const defaultChartRange = (view: View): ChartRange => ({
  mode: ["line", "multi-line", "heatmap", "frequency-line"].includes(view)
    ? "auto"
    : "zero",
});
export function validateChartRange(range: ChartRange) {
  if (!range || !["auto", "zero", "full", "custom"].includes(range.mode))
    throw new Error("数值范围模式无效");
  if (
    range.mode === "custom" &&
    (!Number.isFinite(range.min) ||
      !Number.isFinite(range.max) ||
      range.min! >= range.max!)
  )
    throw new Error("请填写有限数值，且下限必须小于上限");
}
export function applyChartRange<T extends WidgetData>(
  data: T,
  view: View,
  range: ChartRange = defaultChartRange(view),
): T & { domain?: [number, number]; rangeApplied?: boolean } {
  validateChartRange(range);
  if (!supportsChartRange(data, view)) return data;
  let values: (number | null)[] = [];
  if (data.family === "matrix" || data.family === "profile")
    values =
      view === "stacked-columns"
        ? data.dimensions.map((_, i) =>
            data.rows.reduce((n, r) => n + (r.values[i] ?? 0), 0),
          )
        : data.rows.flatMap((r) => r.values);
  else if (data.family === "series") values = data.values;
  else if (data.family === "distribution")
    values = data.bins.map((b) => b.count);
  const finite = values.filter(
    (n): n is number => n !== null && Number.isFinite(n),
  );
  let domain: [number, number];
  if (range.mode === "custom") domain = [range.min!, range.max!];
  else if (range.mode === "full") {
    if ("unit" in data && data.unit === "%") domain = [0, 100];
    else
      domain = ("domain" in data && data.domain) || [0, Math.max(1, ...finite)];
  } else if (!finite.length)
    domain = ("domain" in data && data.domain) || [0, 1];
  else {
    const low = Math.min(...finite),
      high = Math.max(...finite);
    const pad =
      high === low ? Math.max(Math.abs(high) * 0.05, 1) : (high - low) * 0.1;
    domain =
      range.mode === "zero"
        ? [Math.min(0, low - pad), Math.max(0, high + pad)]
        : [low - pad, high + pad];
    if (range.mode === "auto" && "unit" in data && data.unit === "%")
      domain = [Math.max(0, domain[0]), Math.min(100, domain[1])];
    if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
    domain = domain.map((n) => Number(n.toFixed(6))) as [number, number];
  }
  return { ...data, domain, rangeApplied: true };
}
