import {
  TaskPlanPanel,
  type TaskPlanProjection,
} from "../components/task-plan-panel";
import { TaskDesignGraph, TaskPlanDagExploration } from "./task-design-graph";
import "./task-plan-exploration.css";
const data: TaskPlanProjection = {
  identity: "计划 v4",
  status: "等待审核",
  question: "这条路径是否可信，并可授权进行自治执行？",
  goal: "生成经过沙盒验证、可由用户授权发布的插件候选。",
  completion: "5 · 全部已定义",
  nonGoals: "2 · 已明确；公开发布不在本次执行范围内。",
  readiness: [
    {
      id: "control",
      title: "控制边界",
      status: "准备就绪",
      items: [
        { label: "进入条件", value: "4/4 已就绪" },
        { label: "退出条件", value: "3 项已定义" },
        { label: "人工关口", value: "2" },
        { label: "预算", value: "¥30 · 3 次循环" },
      ],
    },
    {
      id: "proof",
      title: "证明准备度",
      status: "1 个缺口",
      items: [
        { label: "主张映射", value: "5/5" },
        { label: "证据方法", value: "5 项已定义" },
        { label: "验证者分离", value: "通过" },
        { label: "覆盖缺口", value: "1" },
      ],
    },
    {
      id: "context",
      title: "权威上下文",
      status: "需检查",
      items: [
        { label: "已固定来源", value: "6" },
        { label: "过期来源", value: "1" },
        { label: "产出保管", value: "已定义" },
        { label: "对象身份", value: "精确" },
      ],
    },
  ],
  attention: ["市场规则来源尚未固定版本", "签名环境与沙盒运行时版本不同"],
  changes: ["+ 沙盒安装验证", "+ 公开发布人工关口", "预算 ¥20 → ¥30"],
};
export function TaskPlanExploration() {
  return (
    <TaskPlanPanel
      data={data}
      summaryGraph={<TaskDesignGraph name="summary" />}
      renderDag={() => <TaskPlanDagExploration />}
      renderDocument={() => (
        <article className="crystra-design-plan-document">
          <h2>发布插件市场方案 — 执行计划</h2>
          <p>修订版 4 · 源提交 abc123 · 设计样本</p>
          <h3>1. 目标与完成判定</h3>
          <p>
            生成经过沙盒验证、可由用户授权发布的插件候选。完成要求包括构建、签名、安全扫描、沙盒安装和发布路径重放。
          </p>
          <h3>3. 范围、非目标与授权</h3>
          <p>
            可自主执行构建、测试与沙盒安装；新增生产依赖、修改公开契约或使用发布凭据必须请示。
          </p>
          <h3>4. 影响与依赖</h3>
          <p>
            wave0 → wave1A / wave1B → wave2 →
            发布关口。签名与沙盒环境版本差异构成当前主要风险。
          </p>
          <TaskDesignGraph name="summary" />
          <h3>5. 执行批次</h3>
          <p>
            每个批次包含外部可验证的验收项、退出条件、失败注记与证据指针。完整内容在权威计划文档中保存，不在摘要工作面重复。
          </p>
        </article>
      )}
    />
  );
}
