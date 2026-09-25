import type { PlanProjection } from "../components/crystra-ui/task-workbench/plan";
export const planPreview: PlanProjection = {
  revision: "v4",
  status: "等待审核",
  source: "设计稿样本 · abc123",
  goal: "生成经过沙盒验证、可由用户授权发布的插件候选。",
  criteria: ["安装与运行验证通过", "产物可重放", "失败恢复可验证"],
  excluded: ["自动公开发布", "修改 DSH 核心"],
  previousApprovedRevision: "v3",
  readiness: {
    control: {
      status: "准备就绪",
      tone: "success",
      items: [
        { label: "进入条件", value: "4/4 已就绪" },
        { label: "退出条件", value: "3 项已定义" },
        { label: "人工关口", value: "2" },
        { label: "预算", value: "¥30 · 3 次循环" },
      ],
    },
    proof: {
      status: "1 个缺口",
      tone: "warning",
      items: [
        { label: "主张映射", value: "5/5" },
        { label: "证据方法", value: "5 项已定义" },
        { label: "验证者分离", value: "通过" },
        { label: "覆盖缺口", value: "1" },
      ],
    },
    context: {
      status: "需检查",
      tone: "warning",
      items: [
        { label: "已固定来源", value: "6" },
        { label: "过期来源", value: "1" },
        { label: "产出保管", value: "已定义" },
        { label: "对象身份", value: "精确" },
      ],
    },
  },
  attention: ["市场规则来源尚未固定版本", "签名环境与沙盒运行时版本不同"],
  changes: ["+ 沙盒安装验证", "+ 公开发布人工关口", "预算 ¥20 → ¥30"],
  document: [
    {
      id: "goal",
      title: "目标与完成判定",
      content:
        "生成经过沙盒验证的插件候选。\n安装、运行和失败恢复均需要可重放证据。",
    },
    {
      id: "scope",
      title: "范围与授权",
      content: "不修改 DSH 核心。公开发布必须由用户明确授权。",
    },
    {
      id: "recovery",
      title: "恢复与退出",
      content:
        "验证失败时返回实现阶段。达到循环或预算上限时交由用户确认后续路径。",
    },
  ],
};
