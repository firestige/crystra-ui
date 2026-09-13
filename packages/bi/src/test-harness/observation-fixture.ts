import type { DeliverySearchRecord } from "../domain/delivery-search";
import type { TraceView } from "../public";
import { statisticsTrace } from "./statistics-fixture";
export const observationTasks = [
  { id: "demo-release", name: "发布插件市场方案" },
  { id: "demo-ui", name: "UI 工作台设计" },
] as const;
export const roles = ["Engineer", "Reviewer", "Scout"] as const;
export type ObservationRole = (typeof roles)[number];
export interface ObservationSample {
  task: string;
  day: string;
  date: string;
  version: string;
  role: ObservationRole;
  input: number;
  output: number;
  calls: number;
}
// Deliberate local fixtures for visual exploration, not an Evidence or metric adapter.
export const observationSamples: ObservationSample[] = observationTasks.flatMap(
  (task, t) =>
    Array.from({ length: 30 }, (_, i) =>
      ["v2", "v3"].flatMap((version, v) =>
        roles.map((role, r) => {
          const calls = 2 + ((i + r + t) % 4);
          const date = new Date(Date.UTC(2026, 7, 11 + i))
            .toISOString()
            .slice(0, 10);
          return {
            date,
            task: task.id,
            day: date.slice(5).replace("-", "/"),
            version,
            role,
            calls,
            input: calls * (2400 - r * 630 + t * 190 + i * 120 - v * 310),
            output: calls * (920 - r * 220 + t * 80 + i * 40 - v * 75),
          };
        }),
      ),
    ).flat(),
);
const labels = [
  "Implementation · 发布插件",
  "Planner · 确认输入",
  "Scout · 检索依赖",
  "Engineer · 修改实现",
  "读取文件",
  "执行类型检查",
  "Reviewer · 评估结果",
  "检查测试证据",
  "汇总变更",
  "Planner · 选择下一步",
  "记录决策",
  "导出调用记录",
];
export const observationTraceTime = (version: string) =>
  `2026-09-09T${version === "v3" ? "14:08" : "10:32"}:00Z`;
export function observationTrace(
  task: string,
  version: string,
  delivery?: DeliverySearchRecord,
): TraceView {
  const traceId =
    delivery?.traceId ??
    (task === "demo-release" ? "a" : "b").repeat(30) +
      (version === "v3" ? "03" : "02");
  const start =
    BigInt(Date.parse(delivery?.startedAt ?? observationTraceTime(version))) *
    1_000_000n;
  const oldIds = statisticsTrace.nodes.map((n) => n.id);
  const idFor = (id: string) =>
    String(oldIds.indexOf(id) + 1).padStart(16, "0");
  const nodes = statisticsTrace.nodes.map((node, i) => ({
    ...node,
    id: idFor(node.id),
    label:
      i === 0
        ? `${delivery?.workflowName ?? "Implementation"} · ${delivery?.taskName ?? (task === "demo-release" ? "发布插件" : "工作台设计")}`
        : labels[i],
    endpoint: { trace_id: traceId, span_id: idFor(node.id) },
    ...(node.parentId ? { parentId: idFor(node.parentId) } : {}),
    startTimeUnixNano: String(start + BigInt(node.startOffsetNano)),
    endTimeUnixNano: String(
      start + BigInt(node.startOffsetNano) + BigInt(node.durationNano),
    ),
    traceState: "fixture=observation-design",
    fields: [
      ...(delivery
        ? [{ field: "delivery_id", value: delivery.deliveryId }]
        : []),
      { field: "preview.task_id", value: task },
      { field: "preview.workflow_revision", value: version },
      { field: "preview.source", value: "设计示例" },
    ],
    status:
      version === "v2" && node.status === "ERROR"
        ? ("OK" as const)
        : node.status,
  }));
  return {
    ...statisticsTrace,
    traceId,
    startTimeUnixNano: String(start),
    endTimeUnixNano: String(start + BigInt(statisticsTrace.durationNano!)),
    nodes,
    parentEdges: statisticsTrace.parentEdges.map((edge) => ({
      ...edge,
      from: { trace_id: traceId, span_id: idFor(edge.from.span_id) },
      to: { trace_id: traceId, span_id: idFor(edge.to.span_id) },
    })),
    links: [],
  };
}
