import fixtures from "../domain/workflow-crystallization-ir.json";
import generated from "../domain/workflow-crystallization-layouts.json";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import {
  WorkflowCrystallizationView,
  type CrystallizationProjection,
} from "./workflow-crystallization-view";
const { before, after } = fixtures as {
  before: WorkflowMapIR;
  after: WorkflowMapIR;
};
const details: Record<
  string,
  { change: string; body: string; input: string; output: string }
> = {
  extract: {
    change: "新增 · 确定性处理",
    body: "将字段提取、类型检查与缺失字段识别交给脚本。脚本不解释异常，也不作后续业务判断。",
    input: "原始报告、格式定义",
    output: "校验后的字段、缺口或不支持的格式",
  },
  valid: {
    change: "新增 · 适用性判断",
    body: "输入满足脚本约定时继续；不支持的格式和缺失材料转交 Agent，不把提取失败当作空结果。",
    input: "提取结果与校验状态",
    output: "继续判断 / 请求补齐",
  },
  review: {
    change: "调整 · 保留 Agent 判断",
    body: "保留异常解释、风险判断与后续行动选择。缩小 Agent 需要阅读和整理的内容，不删除判断职责。",
    input: "结构化字段或人工补齐材料",
    output: "异常解释、下一步建议",
  },
  repair: {
    change: "新增 · 恢复路径",
    body: "遇到未支持的格式，由 Agent 解释报告并补齐判断材料。此路径保留模型成本，不计为已消除的调用。",
    input: "原始报告、失败原因",
    output: "可用于判断的材料",
  },
  render: {
    change: "新增 · 结果成形",
    body: "通过模板排版已确认的判断与数据。模板只负责表达，不能补写尚未作出的结论。",
    input: "确认后的判断与字段",
    output: "结构化复核结果",
  },
};

const data: CrystallizationProjection = {
  id: "design-report-crystallization",
  baselineRevision: "基线设计样本",
  candidateRevision: "候选设计样本",
  scope: "复核与交付 / 报告处理",
  title: "拆出确定性处理，保留异常判断",
  notice: "草案探索 · 静态设计样本，未修改当前工作流",
  before,
  after,
  layouts: generated as unknown as CrystallizationProjection["layouts"],
  beforeSummary: "当前职责由 Agent 整体承担",
  afterSummary: "新增脚本与模板 · 保留判断 · 补充恢复路径",
  details: Object.fromEntries(
    Object.entries(details).map(([id, detail]) => [
      id,
      {
        ...detail,
        kind: id === "review" ? "adjusted" : "new",
        ...(id === "review"
          ? {
              beforeBody:
                "当前 Agent 同时负责读取、提取、解释和输出；候选将确定性部分拆出，保留判断。",
            }
          : {}),
      },
    ]),
  ),
  history: {
    sampleLabel: "设计样本 · 120 个 Delivery",
    costShare: "38%",
    criticalPathShare: "24%",
    summary: "重复处理集中在报告提取与排版。",
  },
  forecast: {
    costChange: "↓ 18–26%",
    latencyChange: "↓ 8–14%",
    summary: "考虑适用比例、保留判断、脚本开销与恢复路径。",
    assumptions: [
      "样本中的120个 Delivery、38%、24%和预测区间均为静态设计数据，不来自真实观测，也不是算法计算结果。",
    ],
  },
  validation: [
    "待生成并验证 report-extract 脚本。",
    "待绑定真实活动、输入输出接口与模板。",
    "待选择真实历史 Delivery，并验证正常和恢复路径。",
  ],
};
/** Accepted standalone design fixture; not runtime evidence. */
export function WorkflowCrystallization({
  quote,
}: {
  quote?: (text: string) => void;
}) {
  return (
    <WorkflowCrystallizationView
      data={data}
      onQuote={quote ? (reference) => quote(reference.text) : undefined}
    />
  );
}
