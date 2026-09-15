import {
  TaskExecutionPanel,
  type TaskExecutionProjection,
} from "../components/task-execution-panel";
import { TaskDesignGraph } from "./task-design-graph";
const data: TaskExecutionProjection = {
  title: "计划执行总览",
  summary: "计划 v4 · 运行 #08 · 展示 Wave 级执行状态与当前前沿",
  metrics: [
    { label: "计划健康", value: "正常推进" },
    { label: "完成", value: "2 / 5 Wave" },
    { label: "当前前沿", value: "批次 1B" },
    { label: "阻塞", value: "0" },
    { label: "累计消耗", value: "18 分钟 · ¥12.40" },
  ],
  frontier:
    "Wave 1B · 构建与签名 · 执行中，偏慢。退出条件 3 / 5；生成签名候选、校验摘要，并把可安装包交给 Wave 2。",
  waves: [
    {
      id: "execution-plan-wave-1b",
      title: "构建与签名验证",
      status: "运行偏慢",
      identity: {
        planRun: "plan-v4/run-08",
        wave: "wave-1b",
        workflow: "build-sign@v3",
        workflowRun: "workflow-v3/run-08",
        traceRoot: "trace-7f42a",
      },
      progress: "68% · 已运行 4 分 18 秒 · 预计慢 28%",
      output: "publish-candidate-v0.8.2.tgz · 12.8 MB · 36 秒前更新",
      boundary:
        "约 8 分钟进入沙盒验证；若失败则沿活动图回路返回本节点，最多重试 3 次。",
    },
  ],
};
/** Static design run; no real run navigation or command is synthesized. */
export function TaskExecutionExploration() {
  return (
    <TaskExecutionPanel
      data={data}
      renderPlanGraph={(select) => (
        <TaskDesignGraph name="execution" onSelect={select} />
      )}
      renderWaveGraph={() => <TaskDesignGraph name="workflow" />}
    />
  );
}
