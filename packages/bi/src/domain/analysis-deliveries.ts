import type { AnalysisData } from "./analysis-data";
import type { TraceItem } from "./evidence/types";
import type { DeliverySearchRecord } from "./delivery-search";
import { compileTraceView } from "./trace/trace-view";
/** Metadata comes only from recorded Evidence fields; no local Execution catalog join. */
export function recordedDeliveryData(
  items: readonly TraceItem[],
): Partial<AnalysisData> {
  const groups = new Map<string, TraceItem[]>();
  for (const item of items) {
    const group = groups.get(item.trace_id) ?? [];
    group.push(item);
    groups.set(item.trace_id, group);
  }
  const deliveries: DeliverySearchRecord[] = [];
  const views = new Map<string, ReturnType<typeof compileTraceView>>();
  for (const [traceId, records] of groups) {
    const nodes = records.filter(
      (r): r is Extract<TraceItem, { kind: "NODE" }> => r.kind === "NODE",
    );
    const values = (field: string) => [
      ...new Set(
        nodes.flatMap((n) =>
          n.node.fields
            .filter((f) => f.field === field && typeof f.value === "string")
            .map((f) => String(f.value)),
        ),
      ),
    ];
    const ids = values("C01");
    if (ids.length !== 1) continue;
    const one = (field: string) => {
      const valuesForField = values(field);
      return valuesForField.length === 1 ? valuesForField[0] : "";
    };
    const started = nodes
      .map((n) => BigInt(n.node.start_time_unix_nano))
      .reduce((a, b) => (a < b ? a : b));
    const recordedAt = records
      .map((r) => r.recorded_at)
      .sort()
      .at(-1)!;
    const task = one("C02"),
      workflow = one("C03");
    deliveries.push({
      deliveryId: ids[0],
      traceId,
      taskId: task,
      taskName: task,
      workflowId: workflow,
      workflowName: workflow,
      workflowVersion: one("C04"),
      startedAt: new Date(Number(started / 1000000n)).toISOString(),
      recordedAt,
    });
    views.set(ids[0], compileTraceView(records));
  }
  // Ambiguous Delivery/Trace identity is not presented as multiple traces for one Delivery.
  const counts = new Map<string, number>();
  for (const row of deliveries)
    counts.set(row.deliveryId, (counts.get(row.deliveryId) ?? 0) + 1);
  return {
    ...deliveryDirectoryData(
      deliveries.filter((d) => counts.get(d.deliveryId) === 1),
    ),
    trace: (delivery) => views.get(delivery.deliveryId) ?? null,
  };
}
export function deliveryDirectoryData(
  deliveries: readonly DeliverySearchRecord[],
): Partial<AnalysisData> {
  return {
    deliveries: [...deliveries],
    tasks: [...new Set(deliveries.map((d) => d.taskId).filter(Boolean))].map(
      (id) => ({ id, name: id }),
    ),
    workflows: [
      ...new Set(deliveries.map((d) => d.workflowId).filter(Boolean)),
    ].map((id) => ({ id, label: id })),
    searchFields: [
      {
        key: "taskName",
        label: "Task 名称",
        placeholder: "Task 名称关键字",
        match: "contains",
      },
      {
        key: "deliveryId",
        label: "Delivery ID",
        placeholder: "精确 Delivery ID",
        match: "exact",
      },
      {
        key: "taskId",
        label: "Task ID",
        placeholder: "精确 Task ID",
        match: "exact",
      },
      {
        key: "workflowId",
        label: "Workflow ID",
        placeholder: "精确 Workflow ID",
        match: "exact",
      },
    ],
  };
}
