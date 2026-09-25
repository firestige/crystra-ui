import type { GrillingProjection } from "../components/crystra-ui/task-workbench/grilling";
/** Design sample only; not an Execution projection. */
export const grillingPreview: GrillingProjection = {
  revision: "design-r2",
  overview: {
    round: 2,
    known: 12,
    resolved: 7,
    unanswered: 3,
    conditional: 2,
    remainingTopics: 3,
    budget: 5,
  },
  topics: [
    {
      id: "goal",
      title: "目标与结果",
      status: "resolved",
      resolved: 3,
      total: 3,
    },
    {
      id: "scope",
      title: "范围与非目标",
      status: "resolved",
      resolved: 2,
      total: 2,
    },
    {
      id: "constraints",
      title: "约束与资源",
      status: "active",
      resolved: 2,
      total: 4,
    },
    {
      id: "acceptance",
      title: "验收与证据",
      status: "pending",
      resolved: 0,
      total: 2,
    },
    {
      id: "authority",
      title: "授权边界",
      status: "added",
      reason: "实际发布需要外部凭据，因此新增授权边界问题。",
      source: "设计稿示例消息",
    },
  ],
  fields: [
    {
      id: "goal",
      title: "目标",
      status: "confirmed",
      text: "验证 DSH 插件的完整市场发布路径，并形成可重放、可结晶的流程。",
    },
    {
      id: "constraints",
      title: "约束",
      status: "confirmed",
      text: "不修改 DSH 核心；优先复用宿主认证与 UI。",
    },
    {
      id: "excluded",
      title: "自动公开发布",
      status: "excluded",
      text: "必须由用户授权",
    },
    {
      id: "distribution",
      title: "私有分发",
      status: "unresolved",
      text: "等待本轮回答",
    },
    {
      id: "rollback",
      title: "回滚边界",
      status: "missing",
      text: "发布后的健康检查与失败恢复尚未定义。",
    },
  ],
  changes: [
    {
      id: "c1",
      kind: "added",
      text: "公开发布必须由用户授权",
      authority: "confirmed",
    },
    {
      id: "c2",
      kind: "removed",
      text: "Agent 可以自动完成整个发布流程",
      authority: "inferred",
    },
  ],
};
