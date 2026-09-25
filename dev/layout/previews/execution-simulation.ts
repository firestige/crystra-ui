import { executionPreview } from "./execution-fixture";
import type {
  ExecutionProjection,
  ExecutionMotion,
} from "../components/crystra-ui/task-workbench/execution";
import type { WorkflowMapIR } from "crystra-ui-core";
export type PreviewPace = ExecutionMotion["pace"];
const ids = ["prepare", "signature", "scan", "install", "checks", "receipt"];
const titles = [
  "准备候选",
  "验证签名",
  "安全扫描",
  "沙盒安装",
  "运行验收检查",
  "生成 Delivery 回执",
];
const levels = [0, 1, 1, 2, 3, 4];
const graph: WorkflowMapIR = {
  version: "0.2",
  title: "Delivery · 沙盒验证运行",
  nodes: ids.map((id, i) => ({ id, kind: "activity", title: titles[i] })),
  edges: [
    { id: "flow-0", from: "prepare", to: "signature" },
    { id: "flow-1", from: "prepare", to: "scan" },
    { id: "flow-2", from: "signature", to: "install" },
    { id: "flow-3", from: "scan", to: "install" },
    { id: "flow-4", from: "install", to: "checks" },
    { id: "flow-5", from: "checks", to: "receipt" },
  ],
};
/** Deterministic dev frames; does not mutate or impersonate Execution state. */
export function executionFrame(
  tick: number,
  pace: PreviewPace,
): ExecutionProjection {
  const duration = pace === "slow" ? 24 : pace === "fast" ? 7 : 12;
  const stage = Math.min(4, Math.floor(tick / duration));
  const done = tick >= duration * 5;
  const progress = done
    ? 100
    : Math.min(99, Math.round(((tick % duration) / duration) * 100));
  const currentIndex = levels.indexOf(stage);
  const activeIds = ids.filter((_, i) => levels[i] === stage);
  const state = pace === "error" ? "执行异常" : done ? "已完成" : "执行中";
  const run = {
    identity: {
      taskId: "preview-task",
      planRunId: executionPreview.planRunId,
      waveId: "w2",
      runId: "preview-workflow-run-1b",
      deliveryId: "preview-delivery-1b",
    },
    graph,
    traversedEdgeIds: graph.edges
      .filter((e) => levels[ids.indexOf(e.to)] <= stage || done)
      .map((e) => e.id),
    calls: ids.flatMap((id, i) =>
      levels[i] <= stage || done
        ? [
            {
              id: `call-${id}-1`,
              actionId: id,
              label: titles[i],
              status: levels[i] < stage || done ? "已完成" : state,
              predecessors: graph.edges
                .filter((e) => e.to === id)
                .map((e) => `call-${e.from}-1`),
              sequence: levels[i] + 1,
            },
          ]
        : [],
    ),
    observed: ids.filter((_, i) => levels[i] < stage || done),
    frontier: done ? [] : activeIds,
    candidates: done ? [] : ids.filter((_, i) => levels[i] === stage + 1),
    motion: done
      ? undefined
      : {
          nodeId: ids[currentIndex],
          edgeIds: graph.edges
            .filter((e) => activeIds.includes(e.to))
            .map((e) => e.id),
          pace,
        },
    nodes: ids.map((id, i) => ({
      id,
      title: titles[i],
      status:
        levels[i] < stage || done
          ? "已完成"
          : levels[i] === stage
            ? state
            : "未开始",
      tone: (levels[i] < stage || done
        ? "success"
        : levels[i] === stage
          ? pace === "error"
            ? "danger"
            : "primary"
          : "neutral") as "success" | "danger" | "primary" | "neutral",
      elapsed:
        levels[i] <= stage
          ? `${Math.min(duration, tick - levels[i] * duration)} 秒`
          : undefined,
      progress:
        levels[i] < stage || done
          ? 100
          : levels[i] === stage
            ? progress
            : undefined,
      output:
        levels[i] < stage || done
          ? `${titles[i]}结果已记录`
          : levels[i] === stage
            ? pace === "error"
              ? "进程返回非零退出码，保留现场等待处理"
              : `${titles[i]} · 已处理 ${progress}%`
            : "尚无产出",
      checks:
        levels[i] === stage
          ? [
              pace === "error" ? "当前检查未通过" : "正在收集检查结果",
              "候选版本保持固定",
            ]
          : undefined,
      nextBoundary:
        i === 5
          ? "写入回执，等待发布授权"
          : graph.edges
              .filter((e) => e.from === id)
              .map((e) => titles[ids.indexOf(e.to)])
              .join("、"),
    })),
  };
  return {
    ...executionPreview,
    monitor: { revision: tick + 1, status: "live" },
    summary: done
      ? "批次 1B 完成 · 等待发布授权"
      : pace === "error"
        ? "批次 1B 异常 · 等待处理"
        : `批次 1B · ${titles[currentIndex]}`,
    motion: done ? undefined : { nodeId: "w2", edgeIds: ["e2"], pace },
    facts: [
      { label: "完成", value: `${done ? 3 : 2} / 5 Wave` },
      { label: "当前前沿", value: done ? "发布授权" : "批次 1B" },
      { label: "阻塞", value: pace === "error" ? "1" : "0" },
      { label: "累计耗时", value: `${tick} 秒` },
    ],
    waves: executionPreview.waves.map((w) =>
      w.id === "w2"
        ? {
            ...w,
            status: state,
            tone: done ? "success" : pace === "error" ? "danger" : "primary",
            outcome: done
              ? "Delivery 回执已生成"
              : run.nodes[currentIndex].output,
            run,
          }
        : w,
    ),
  };
}
