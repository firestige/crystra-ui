import type { TaskDeliveryProjection } from "../components/task-delivery-panel";
/** Accepted v8 delivery-workbench design sample; not a real completion claim. */
export const taskDeliveryExploration: TaskDeliveryProjection = {
  readiness: {
    title: "当前可交付",
    description:
      "当前目标的必要验收条件已有证据支持；这是一项实时判断，不会关闭任务。",
    coverage: "4 / 4 已满足",
    tone: "success",
  },
  recalculation:
    "继续在输入流中追加目标或要求 Replan 后，系统会更新计划，并重新计算这里的可交付状态。最近计算：2 分钟前",
  artifacts: [
    {
      id: "package",
      name: "publish-candidate-v0.8.2.tgz",
      detail: "已签名 · 已通过沙盒验证",
      status: "当前有效",
    },
    {
      id: "report",
      name: "publish-path-report.md",
      detail: "当前报告",
      status: "当前有效",
    },
    {
      id: "workflows",
      name: "workflow-candidates.md",
      detail: "3 个结晶候选",
      status: "当前有效",
    },
  ],
  acceptance: [
    { id: "path", label: "发布路径完整且可重放", status: "已覆盖" },
    { id: "signature", label: "签名与安全扫描通过", status: "已覆盖" },
    { id: "sandbox", label: "沙盒安装验证成功", status: "已覆盖" },
    { id: "authority", label: "公开发布保持人工授权", status: "已覆盖" },
  ],
  risk: "Node 22 的长期兼容性仍需在真实市场环境验证；追加兼容性目标后将重新进入计划与执行。",
  economics: [
    { label: "耗时", value: "31 分钟" },
    { label: "智能体成本", value: "¥18.60" },
    { label: "你的注意力", value: "7 分钟" },
  ],
};
