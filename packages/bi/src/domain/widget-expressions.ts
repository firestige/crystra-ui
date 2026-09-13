import type { MonitoringWidgetSize, WidgetCategory } from "./widget-catalog";
import { FAMILY_FIXTURES, familyViews } from "./widget-families";
export type Kind =
  | "state"
  | "value"
  | "text"
  | "pair"
  | "progress"
  | "share"
  | "compare"
  | "categories"
  | "composition"
  | "trend"
  | "period"
  | "distribution"
  | "matrix"
  | "history"
  | "range"
  | "gauge"
  | "gauge-compact"
  | "radar";
export interface Expression {
  id: Kind;
  name: string;
  question: string;
  rule: string;
  shape: string;
  category?: WidgetCategory;
  size: MonitoringWidgetSize;
  title: string;
}
export const EXPRESSIONS: Expression[] = [
  {
    id: "state",
    name: "单状态",
    question: "现在是什么状态？",
    rule: "中央短状态最突出；对象图标说明状态属于谁。",
    shape: "state + label",
    category: "status",
    size: "1x1",
    title: "当前运行",
  },
  {
    id: "value",
    name: "单量值",
    question: "现在是多少？",
    rule: "数值与单位居中；口径在标题说明，不混入第二个指标。",
    shape: "value + unit",
    category: "value",
    size: "1x1",
    title: "调用耗时",
  },
  {
    id: "text",
    name: "短文本",
    question: "现在在做什么？",
    rule: "突出一句可直接阅读的内容，不为文字强造图表。",
    shape: "headline + context",
    size: "1x2",
    title: "当前活动",
  },
  {
    id: "pair",
    name: "成对量值",
    question: "同一件事的两个量分别是多少？",
    rule: "平等呈现两个命名值；没有基准关系，不添加涨跌。",
    shape: "two named values",
    size: "1x2",
    title: "调用用量",
  },
  {
    id: "progress",
    name: "目标进度",
    question: "距目标还有多少？",
    rule: "数字、目标与线性长度一致；剩余量是辅助信息。",
    shape: "current + target",
    category: "progress",
    size: "1x2",
    title: "检查单完成",
  },
  {
    id: "share",
    name: "单一份额",
    question: "当前部分占总体多少？",
    rule: "环内比例最突出；环形只表达份额，不暗示执行进度。",
    shape: "part + whole",
    category: "progress",
    size: "2x2",
    title: "已覆盖样本",
  },
  {
    id: "compare",
    name: "基准比较",
    question: "相对明确基准变化多少？",
    rule: "基准、对照、变化共用一个外框；差值最突出。",
    shape: "before + after + delta",
    category: "comparison",
    size: "1x3",
    title: "调用耗时比较",
  },
  {
    id: "categories",
    name: "分类比较",
    question: "哪个类别更高、差多少？",
    rule: "共享零基线的横条；长名称清楚，末端提供精确值。",
    shape: "category → value",
    category: "breakdown",
    size: "2x3",
    title: "各阶段记录耗时",
  },
  {
    id: "composition",
    name: "总体构成",
    question: "一个总体由什么组成？",
    rule: "一个总量、完整的分段条、带数值图例；不用面积猜精确值。",
    shape: "exclusive parts + total",
    category: "breakdown",
    size: "2x2",
    title: "已记录调用构成",
  },
  {
    id: "trend",
    name: "连续趋势",
    question: "同一个量如何随时间变化？",
    rule: "线连接有序观测，强调变化形状；保留时间轴和单位。",
    shape: "time → value",
    category: "trend",
    size: "2x3",
    title: "调用耗时趋势",
  },
  {
    id: "period",
    name: "周期量",
    question: "每个时间段分别发生多少？",
    rule: "独立柱表示每期量；不把离散区间伪装为连续曲线。",
    shape: "time bucket → amount",
    category: "trend",
    size: "2x3",
    title: "每小时调用次数",
  },
  {
    id: "distribution",
    name: "数值分布",
    question: "大多数落在哪个区间，有没有长尾？",
    rule: "连续区间的直方柱表达频数；不是平均值或类别排行。",
    shape: "numeric bin → count",
    category: "breakdown",
    size: "2x3",
    title: "调用耗时分布",
  },
  {
    id: "matrix",
    name: "热力图",
    question: "哪个 Workflow 在哪一天覆盖不足？",
    rule: "单一量纲、共享色阶；行列含义与缺值必须可辨认。",
    shape: "row × column → value",
    category: "breakdown",
    size: "2x3",
    title: "Workflow 每日检查覆盖率",
  },
  {
    id: "history",
    name: "状态历史",
    question: "什么时候运行、等待或失败？",
    rule: "横轴时间，色块长度代表持续区间；状态无需转成数值。",
    shape: "start + end + state",
    category: "history",
    size: "2x3",
    title: "运行状态历史",
  },
  {
    id: "range",
    name: "数值与正常区间",
    question: "当前值是否偏离正常区间？",
    rule: "右侧箭头表示高低，颜色表示评价；与基准比较的涨跌分开。",
    shape: "value + unit + normalRange + assessment",
    category: "value",
    size: "1x1",
    title: "调用耗时 · 区间指示",
  },
  {
    id: "gauge",
    name: "仪表盘",
    question: "当前值位于哪个范围？",
    rule: "表盘分区提示范围，指针定位，数字用于精确读数。",
    shape: "value + domain + bands",
    category: "progress",
    size: "2x2",
    title: "调用耗时 · 范围定位",
  },
  {
    id: "gauge-compact",
    name: "仪表盘 · 紧凑",
    question: "当前数值位于哪个范围？",
    rule: "1×1 无指针；中央读数，表盘外侧三角定位，仅保留量程端点。",
    shape: "value + domain + bands",
    size: "1x1",
    title: "调用耗时 · 范围定位",
  },
  {
    id: "radar",
    name: "雷达图 · 双方案",
    question: "两个方案在多个维度上各有什么优势？",
    rule: "相同维度、量程和方向；两组轮廓叠加，颜色、线型与点形共同区分。",
    shape: "dimensions + shared scale + two series",
    size: "2x2",
    title: "方案能力对比",
  },
];

export function expressionSizes(id: Kind): readonly MonitoringWidgetSize[] {
  const fixture = FAMILY_FIXTURES[id];
  if (fixture)
    return familyViews(fixture.data).find((v) => v.id === fixture.view)!.sizes;
  return [EXPRESSIONS.find((e) => e.id === id)!.size];
}
