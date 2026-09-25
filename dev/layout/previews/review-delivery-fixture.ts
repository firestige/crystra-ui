import type { GateProjection } from "../components/crystra-ui/task-workbench/gate";
import type { DeliveryProjection } from "../components/crystra-ui/task-workbench/delivery";
import type { ReviewResource } from "../components/crystra-ui/task-workbench/review-resource";
const resource = (
  id: string,
  title: string,
  content: string,
): ReviewResource => ({
  id: `preview-${id}`,
  revision: "example-r1",
  title,
  content,
});
const plan = resource(
  "plan-v4",
  "计划上下文",
  "Plan example-v4\nGate publish：公开发布前必须取得人工授权。\n当前候选：candidate-082 · revision sha-example-082。",
);
const trigger = resource(
  "trigger",
  "触发事实",
  "候选包签名和沙盒安装验证已完成，执行到公开发布门禁。尚未发起公开发布。",
);
const diff = resource(
  "diff",
  "拟议变更",
  "base: example-v0.8.1\ncandidate: example-v0.8.2\n新增沙盒安装检查；候选包版本固定为 sha-example-082。",
);
const validation = resource(
  "validation",
  "验证结果",
  "候选 sha-example-082\n签名检查：通过\n沙盒安装：通过\n市场实际发布：尚未执行",
);
const decision = resource(
  "decision",
  "已确认决定原始记录",
  "确认内容：只生成并验证候选，公开发布前再次询问。\n适用范围：本 Task 的当前发布候选。\n此记录为隔离预览数据，不是实际用户授权。",
);
export const gatePreview: GateProjection = {
  revision: "example-queue-r1",
  items: [
    {
      id: "gate-publish",
      revision: "example-gate-r1",
      question: "是否授权公开发布当前候选？",
      location: "计划 v4 · 发布前人工关口",
      trigger: "签名与沙盒验证已完成",
      impact: "当前发布分支等待人工决定",
      confirmed: [
        {
          id: "decision-1",
          quote: "只生成并验证候选，公开发布前再次询问。",
          scope: "当前 Task 的发布候选",
          receipt: decision,
        },
      ],
      interpretation:
        "仅授权当前候选 sha-example-082 的这一次发布，不包含后续版本自动发布。",
      delta: ["新增：当前候选已完成沙盒验证。", "保持：公开发布必须人工授权。"],
      effects: [
        "将本次明确授权绑定到当前候选版本。",
        "解除公开发布节点的等待；不授权其他候选。",
      ],
      boundaries: ["不扩大凭据权限。", "不修改已完成的执行结果。"],
      evidence: [
        { kind: "计划上下文", resource: plan },
        { kind: "触发事实", resource: trigger },
        { kind: "拟议变更", resource: diff },
        { kind: "验证结果", resource: validation },
        { kind: "既有决定", resource: decision },
      ],
    },
    {
      id: "gate-budget",
      revision: "example-budget-r2",
      question: "是否调整后续验证的预算边界？",
      location: "计划 v4 · 扩展验证",
      trigger: "新增兼容性验证需要额外预算",
      impact: "仅扩展验证分支等待，其余合法分支继续",
      confirmed: [],
      interpretation: "预算调整仅用于新增兼容性验证，不改变公开发布门禁。",
      delta: ["新增：兼容性验证范围尚待讨论。"],
      effects: ["经 Input 明确范围和预算后更新计划提案。"],
      boundaries: ["当前预算边界在新授权生效前保持不变。"],
      evidence: [{ kind: "计划上下文", resource: plan }],
    },
  ],
};
export const deliveryPreview: DeliveryProjection = {
  revision: "example-readiness-r1",
  status: "条件可交付 · 公开发布仍待授权",
  tone: "warning",
  source: "当前目标与候选验收快照",
  calculatedAt: "预览快照 r1",
  artifacts: [
    {
      resource: resource(
        "candidate",
        "publish-candidate-v0.8.2.tgz",
        "候选版本：sha-example-082\n签名与沙盒验证通过。\n此处展示候选摘要，未提供真实包下载。",
      ),
      status: "候选已验证，尚未公开发布",
    },
    {
      resource: resource(
        "report",
        "publish-path-report.md",
        "当前发布路径：候选准备 → 签名 → 沙盒安装 → 人工授权 → 公开发布。\n当前停在人工授权。",
      ),
      status: "当前报告",
    },
  ],
  acceptance: [
    {
      id: "a1",
      claim: "签名与安全检查",
      verdict: "通过",
      tone: "success",
      evidence: validation,
    },
    {
      id: "a2",
      claim: "沙盒安装验证",
      verdict: "通过",
      tone: "success",
      evidence: validation,
    },
    {
      id: "a3",
      claim: "公开发布授权",
      verdict: "待人工决定",
      tone: "warning",
      evidence: decision,
    },
  ],
  risks: [
    {
      id: "risk1",
      text: "公开发布尚未授权；当前可交付候选不代表已完成市场发布。",
      blocking: true,
      gate: "gate-publish",
    },
    {
      id: "risk2",
      text: "新版本运行环境兼容性仍需后续验证。",
      blocking: false,
    },
  ],
  economics: [
    { label: "Task 耗时", value: "31 分钟" },
    { label: "智能体成本", value: "¥18.60" },
    { label: "人的注意力", value: "未提供" },
  ],
};
