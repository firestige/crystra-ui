import type { TaskRequirementsProjection } from "../components/task-requirements-panel";
/** Design samples from accepted v8 grilling-workbench, never real Task facts. */
export const taskRequirementsExploration: TaskRequirementsProjection = {
  heading: "需求澄清 · 第 2 轮",
  summary: "12 个已知问题 · 7 个已解决 · 3 个待回答 · 2 个条件问题",
  remaining: "还剩 3 个主题",
  budget: "问题预算：5",
  topics: [
    { id: "goal", title: "目标与结果", progress: "3/3", tone: "success" },
    { id: "scope", title: "范围与非目标", progress: "2/2", tone: "success" },
    {
      id: "constraints",
      title: "约束与资源",
      progress: "2/4",
      tone: "warning",
    },
    { id: "acceptance", title: "验收与证据", progress: "0/2", tone: "warning" },
    { id: "authority", title: "授权边界", progress: "新增", tone: "neutral" },
  ],
  reason: "实际发布需要外部凭据，因此新增授权边界问题。",
  briefSummary: "当前权威理解 · 增量编译",
  fields: [
    {
      id: "goal",
      title: "目标",
      status: "已确认",
      body: "验证 DSH 插件的完整市场发布路径，并形成可重放、可结晶的流程。",
      tone: "success",
    },
    {
      id: "constraints",
      title: "约束",
      status: "已确认",
      body: "不修改 DSH 核心；优先复用宿主认证与 UI。",
      tone: "success",
    },
    {
      id: "publish",
      title: "自动公开发布",
      status: "已排除",
      body: "必须由用户授权",
      tone: "neutral",
    },
    {
      id: "distribution",
      title: "私有分发",
      status: "未解决",
      body: "等待本轮回答",
      tone: "warning",
    },
    {
      id: "rollback",
      title: "回滚边界",
      status: "缺失",
      body: "发布后的健康检查与失败恢复尚未定义。",
      tone: "warning",
    },
  ],
  changes: [
    { id: "added", kind: "added", text: "公开发布必须由用户授权" },
    { id: "removed", kind: "removed", text: "Agent 可以自动完成整个发布流程" },
  ],
};
