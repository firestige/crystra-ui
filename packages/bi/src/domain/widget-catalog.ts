export const WIDGET_CATALOG = {
  status: { label: "状态信号", sizes: ["1x1"] },
  value: { label: "当前量值", sizes: ["1x1"] },
  progress: { label: "进度与容量", sizes: ["1x1", "1x2", "1x3", "2x2"] },
  comparison: { label: "基准对比", sizes: ["1x2", "1x3"] },
  trend: { label: "时间趋势", sizes: ["1x2", "1x3", "2x3", "3x3"] },
  breakdown: { label: "组成与分布", sizes: ["2x2", "2x3", "3x3"] },
  history: { label: "状态历史", sizes: ["2x3", "3x3"] },
  records: { label: "记录明细", sizes: ["2x3", "3x3"] },
} as const;
export type WidgetCategory = keyof typeof WIDGET_CATALOG;
export type MonitoringWidgetSize = `${number}x${number}`;

export const WIDGET_UNIT = 160;
export const WIDGET_GAP = 16;
export const widgetSpan = (span: number) =>
  span * WIDGET_UNIT + (span - 1) * WIDGET_GAP;

/** Renderer recipes refine semantic capacity; e.g. a linear bar does not render a ring. */
export const MONITORING_RENDERERS = {
  "numeric-card@1": { category: "value" },
  "badge@1": { category: "status" },
  "ratio-bar@1": { category: "progress", sizes: ["1x1", "1x2", "1x3"] },
  "table@1": { category: "records" },
} as const;
export function monitoringSizes(
  visualizer: keyof typeof MONITORING_RENDERERS,
): readonly MonitoringWidgetSize[] {
  const recipe = MONITORING_RENDERERS[visualizer];
  const sizes: readonly MonitoringWidgetSize[] =
    WIDGET_CATALOG[recipe.category].sizes;
  return "sizes" in recipe
    ? sizes.filter((size) => (recipe.sizes as readonly string[]).includes(size))
    : sizes;
}
