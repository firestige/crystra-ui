import type { MonitoringWidgetSize as Size } from "./widget-catalog";
export type View =
  | "status"
  | "number"
  | "range"
  | "bar"
  | "ring"
  | "gauge"
  | "line"
  | "columns"
  | "bars"
  | "stack"
  | "pie"
  | "donut"
  | "histogram"
  | "frequency-line"
  | "frequency-table"
  | "heatmap"
  | "area"
  | "multi-line"
  | "grouped-columns"
  | "stacked-columns"
  | "value-table"
  | "radar"
  | "grouped-bars";
export interface DistributionData {
  family: "distribution";
  title: string;
  unit: string;
  bins: { from: number; to: number; count: number }[];
  domain?: [number, number];
}
interface MatrixValues {
  xAxisLabel?: string;
  yAxisLabel?: string;
  legendPlacement?: "internal" | "external";
  title: string;
  unit: string;
  dimensions: string[];
  rows: {
    name: string;
    values: (number | null)[];
    color?: string;
    samples?: number[];
  }[];
  stackable?: boolean;
  rangeApplied?: boolean;
  legendLabel?: string;
  domain: [number, number];
  ordered: boolean;
}
export type MatrixData =
  | (MatrixValues & { family: "matrix" })
  | (MatrixValues & { family: "profile" });
export type WidgetData =
  | DistributionData
  | MatrixData
  | {
      family: "activity";
      title: string;
      state: string;
      headline?: string;
      context?: string;
    }
  | {
      family: "scalar";
      title: string;
      value: number;
      unit: string;
      identityIcon?:
        | "clock"
        | "clipboard-list"
        | "target"
        | "coins"
        | "receipt"
        | "arrows-exchange"
        | "binary";
      color?: string;
      normal?: [number, number];
      domain?: [number, number];
      target?: number;
      targetLabel?: string;
    }
  | {
      family: "series";
      domain?: [number, number];
      title: string;
      unit: string;
      ordered: boolean;
      labels: string[];
      values: number[];
    }
  | {
      family: "composition";
      title: string;
      unit: string;
      labels: string[];
      values: number[];
    };
export interface ViewRecipe {
  id: View;
  label: string;
  sizes: readonly Size[];
}
const recipe = (id: View, label: string, sizes: Size[]): ViewRecipe => ({
  id,
  label,
  sizes,
});
export function familyViews(data: WidgetData): ViewRecipe[] {
  switch (data.family) {
    case "distribution":
      return [
        recipe("histogram", "直方图", ["2x3"]),
        recipe("frequency-line", "频数折线", ["2x3"]),
        recipe("frequency-table", "频数表", ["2x3"]),
      ];
    case "matrix":
      return [
        ...(data.stackable &&
        data.rows.every((r) => r.values.every((v) => v !== null && v >= 0))
          ? [recipe("stacked-columns", "堆叠柱状图", ["2x3", "3x3"])]
          : []),
        recipe("heatmap", "热力图", ["2x3"]),
        ...(data.ordered
          ? [recipe("multi-line", "多序列折线图", ["2x3", "3x3"])]
          : []),
        recipe("grouped-columns", "分组柱状图", ["2x3", "3x3"]),
        recipe("grouped-bars", "分组条形图", ["2x3"]),
        recipe("value-table", "数值表", ["2x3"]),
      ];
    case "profile":
      return [
        ...(data.rows.every((r) => r.values.every((v) => v !== null))
          ? [recipe("radar", "雷达图", ["2x2"])]
          : []),
        recipe("grouped-bars", "分组条形图", ["2x3"]),
        recipe("heatmap", "热力图", ["2x3"]),
        recipe("value-table", "数值表", ["2x3"]),
      ];
    case "activity":
      return [recipe("status", "状态与活动", ["1x1", "1x2"])];
    case "scalar":
      return [
        recipe("number", "数字", ["1x1", "1x2"]),
        ...(data.normal ? [recipe("range", "区间指示", ["1x1"])] : []),
        ...(data.target && data.target > 0
          ? [recipe("bar", "条形", ["1x2"]), recipe("ring", "环形", ["2x2"])]
          : []),
        ...(data.domain && data.domain[1] > data.domain[0]
          ? [recipe("gauge", "仪表盘", ["1x1", "2x2"])]
          : []),
      ];
    case "series":
      return [
        ...(data.ordered ? [recipe("line", "折线图", ["2x3"])] : []),
        recipe("columns", "柱状图", ["2x3"]),
        recipe("bars", "横向条形图", ["2x3"]),
      ];
    case "composition":
      return [
        recipe("stack", "分段条", ["2x2"]),
        recipe("pie", "饼图", ["2x2"]),
        recipe("donut", "环形构成", ["2x2"]),
      ];
  }
}
/** Chart presets are shortcuts; only their minimum capacity constrains custom sizes. */
export function chartMinimumSize(
  data: WidgetData,
  view: View,
): { h: number; w: number } | undefined {
  if (["scalar", "activity"].includes(data.family)) return undefined;
  const recipe = familyViews(data).find((r) => r.id === view);
  if (!recipe) return undefined;
  const sizes = recipe.sizes.map((s) => s.split("x").map(Number));
  return {
    h: Math.min(...sizes.map((s) => s[0])),
    w: Math.min(...sizes.map((s) => s[1])),
  };
}
export function isWidgetSizeAllowed(
  data: WidgetData,
  view: View,
  size: string,
): boolean {
  const [h, w, ...rest] = size.split("x").map(Number);
  if (
    rest.length ||
    !Number.isSafeInteger(h) ||
    !Number.isSafeInteger(w) ||
    h < 1 ||
    w < 1
  )
    return false;
  const min = chartMinimumSize(data, view);
  return min
    ? h >= min.h && w >= min.w
    : !!familyViews(data)
        .find((r) => r.id === view)
        ?.sizes.includes(size as Size);
}
const activity: WidgetData = {
  family: "activity",
  title: "当前运行",
  state: "运行中",
  headline: "验证构建产物",
  context: "检查依赖与启动结果",
};
export const FAMILY_FIXTURES: Record<string, { data: WidgetData; view: View }> =
  {
    distribution: {
      data: {
        family: "distribution",
        title: "调用耗时分布",
        unit: "ms",
        bins: [2, 7, 12, 8, 5, 2, 1, 0].map((count, i) => ({
          from: i * 50,
          to: (i + 1) * 50,
          count,
        })),
      },
      view: "histogram",
    },
    matrix: {
      data: {
        family: "matrix",
        title: "Workflow 每日检查覆盖率",
        unit: "%",
        domain: [0, 100],
        ordered: true,
        dimensions: ["09/01", "09/02", "09/03", "09/04", "09/05"],
        rows: [
          { name: "构建验证", values: [100, 90, 80, 100, 95] },
          { name: "依赖检查", values: [75, 40, 20, 65, 90] },
          { name: "回归测试", values: [60, 80, null, 30, 85] },
          { name: "产物审阅", values: [0, 25, 50, 75, 100] },
        ],
      },
      view: "heatmap",
    },
    radar: {
      data: {
        family: "profile",
        title: "方案能力对比",
        unit: "分",
        domain: [0, 100],
        ordered: false,
        dimensions: ["质量", "速度", "成本效率", "稳定性", "可维护性"],
        rows: [
          { name: "方案 A", values: [92, 62, 55, 90, 78] },
          { name: "方案 B", values: [72, 91, 88, 65, 60] },
        ],
      },
      view: "radar",
    },
    state: { data: activity, view: "status" },
    text: { data: activity, view: "status" },
    value: {
      data: {
        family: "scalar",
        title: "调用耗时",
        value: 42,
        unit: "ms",
        normal: [40, 100],
        domain: [0, 200],
        target: 200,
        targetLabel: "参考上限",
      },
      view: "number",
    },
    range: {
      data: {
        family: "scalar",
        title: "调用耗时",
        value: 142,
        unit: "ms",
        normal: [40, 100],
        domain: [0, 200],
        target: 200,
        targetLabel: "参考上限",
      },
      view: "range",
    },
    gauge: {
      data: {
        family: "scalar",
        title: "调用耗时",
        value: 142,
        unit: "ms",
        normal: [40, 100],
        domain: [0, 200],
        target: 200,
        targetLabel: "参考上限",
      },
      view: "gauge",
    },
    "gauge-compact": {
      data: {
        family: "scalar",
        title: "调用耗时",
        value: 142,
        unit: "ms",
        normal: [40, 100],
        domain: [0, 200],
        target: 200,
        targetLabel: "参考上限",
      },
      view: "gauge",
    },
    progress: {
      data: {
        family: "scalar",
        title: "检查单完成",
        identityIcon: "clipboard-list",
        value: 6,
        unit: "项",
        target: 8,
        targetLabel: "总项数",
        domain: [0, 8],
      },
      view: "bar",
    },
    share: {
      data: {
        family: "scalar",
        title: "已覆盖样本",
        identityIcon: "target",
        value: 75,
        unit: "条",
        target: 100,
        targetLabel: "样本总数",
        domain: [0, 100],
      },
      view: "ring",
    },
    trend: {
      data: {
        family: "series",
        title: "调用耗时趋势",
        unit: "ms",
        ordered: true,
        labels: [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
        ],
        values: [65, 85, 60, 100, 70, 45, 55, 35],
      },
      view: "line",
    },
    categories: {
      data: {
        family: "series",
        title: "各阶段记录耗时",
        unit: "ms",
        ordered: true,
        labels: ["准备", "实现", "验证", "审阅"],
        values: [18, 84, 56, 32],
      },
      view: "bars",
    },
    period: {
      data: {
        family: "series",
        title: "每小时调用次数",
        unit: "次",
        ordered: true,
        labels: [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
        ],
        values: [3, 6, 4, 8, 7, 5, 9, 6],
      },
      view: "columns",
    },
    composition: {
      data: {
        family: "composition",
        title: "已记录调用构成",
        unit: "次",
        labels: ["完成", "失败", "取消"],
        values: [72, 30, 18],
      },
      view: "stack",
    },
  };
