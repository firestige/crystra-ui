import fixtures from "../../../packages/bi/src/domain/workflow-crystallization-ir.json";
import generated from "../../../packages/bi/src/domain/workflow-crystallization-layouts.json";
import type { WorkflowCrystallizationData } from "crystra-ui-core";
export const details: Record<
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
export const crystallizationData = {
  ...fixtures,
  generated,
  details,
  context: "复核与交付 / 报告处理",
  title: "拆出确定性处理，保留异常判断",
  status: "候选方案",
  summaries: {
    before: "当前职责由 Agent 整体承担",
    after: "新增脚本与模板 · 保留判断 · 补充恢复路径",
  },
  notice: "基于设计样本 · 未修改当前工作流",
  benefitsNotice: "演示数据 · 基线版本 → 候选版本",
  changes: {
    review: "adjusted",
    extract: "new",
    valid: "new",
    repair: "new",
    render: "new",
  },
  metrics: [
    {
      title: "历史依据",
      subtitle: "基线样本 · 120 个 Delivery",
      rows: [
        ["拟替代部分的模型费用占比", "38%"],
        ["关键路径时间占比", "24%"],
      ],
      description: "重复处理集中在报告提取与排版。",
      action: "在 Chat 中查看依据",
      quote: "请解释报告提取与排版的历史占用，列出样本范围、覆盖率与重复模式。",
    },
    {
      title: "收益预测",
      subtitle: "预测展示样本 · 非实测结果",
      rows: [
        ["单次运行费用", "↓ 18–26%"],
        ["端到端延迟", "↓ 8–14%"],
      ],
      description: "考虑适用比例、保留判断、脚本开销与恢复路径。",
      action: "查看预测假设",
    },
    {
      title: "实测对比",
      subtitle: "候选版本尚无运行数据",
      rows: [["费用 / Token / 延迟", "—"]],
      description:
        "形成新版本并积累运行数据后，用 Evaluation 的正常指标与基线比较。",
      footnote: "保留原预测，后续对照实测偏差",
    },
  ],
  checks: [
    "这是用于评审布局与交互的拆分方案，不是对当前工作流的真实分析结论。",
    "120 个 Delivery、38%、24%和预测区间均为静态设计数据，不来自真实观测。",
    "待生成并验证 report-extract 脚本。",
    "待绑定真实活动、输入输出接口与模板。",
    "待选择真实历史 Delivery，并验证正常和恢复路径。",
    "检查完成后才能应用到工作流草稿；发布仍需通过版本门禁。当前不会写入包文件。",
  ],
  continuePrompt:
    "请继续完善报告处理结晶方案，先确认脚本接口、历史依据与版本对比范围。",
} as unknown as WorkflowCrystallizationData;
