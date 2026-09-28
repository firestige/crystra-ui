export const analysisDimensions = [
  { key: "date", label: "日期" },
  { key: "version", label: "Workflow 版本" },
  { key: "role", label: "Role" },
  { key: "model", label: "模型" },
  { key: "provider", label: "Provider" },
] as const;
export type AnalysisDimension = (typeof analysisDimensions)[number]["key"];
export const analysisMetrics = [
  {
    key: "cost",
    label: "实际费用",
    unit: "USD",
    operations: [
      { key: "sum", label: "总费用" },
      { key: "perDelivery", label: "每 Delivery 平均费用" },
      { key: "mean", label: "每次调用平均费用" },
    ],
  },
  {
    key: "cache",
    label: "输入 Token 缓存命中率",
    unit: "%",
    operations: [{ key: "ratio", label: "缓存输入 Token / 全部输入 Token" }],
  },
  {
    key: "calls",
    label: "API 调用次数",
    unit: "次",
    operations: [{ key: "count", label: "调用记录计数" }],
  },
  {
    key: "ttft",
    label: "首次输出延时",
    unit: "ms",
    operations: [
      { key: "p50", label: "P50" },
      { key: "p95", label: "P95" },
      { key: "mean", label: "算术平均" },
    ],
  },
  {
    key: "input",
    label: "输入 Token 数",
    unit: "Token",
    operations: [{ key: "sum", label: "求和" }],
  },
  {
    key: "output",
    label: "输出 Token 数",
    unit: "Token",
    operations: [{ key: "sum", label: "求和" }],
  },
  {
    key: "cached",
    label: "缓存命中 Token 数",
    unit: "Token",
    operations: [{ key: "sum", label: "求和" }],
  },
  {
    key: "uncached",
    label: "未命中缓存 Token 数",
    unit: "Token",
    operations: [{ key: "sum", label: "求和" }],
  },
  {
    key: "tokens",
    label: "总 Token 数",
    unit: "Token",
    operations: [{ key: "sum", label: "求和" }],
  },
] as const;
export type AnalysisMetric = (typeof analysisMetrics)[number]["key"];

export interface AnalysisItem {
  id: string;
  metric: AnalysisMetric;
  operation: string;
  name: string;
}
