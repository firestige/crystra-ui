import { createPagedQuery } from "../../support/data/paged-query";
import { QueryError } from "../../support/data/query-error";
import { validRecordedRange } from "../recorded-range";
import { record, closed } from "./validation";
import type {
  DeliverySearchRecord,
  DeliverySearchCondition,
} from "../delivery-search";
export interface DirectoryTransport {
  request(
    endpoint: "deliveries/list",
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
export interface DirectoryMetadata {
  snapshot: string;
  total: number;
}
export function directoryFilters(
  conditions: readonly DeliverySearchCondition[],
) {
  const keys: Record<string, string> = {
    deliveryId: "delivery_id",
    taskId: "task_id",
    taskName: "task_name",
    workflowId: "workflow_id",
    workflowVersion: "workflow_version",
  };
  return Object.fromEntries(
    conditions.map((c) => {
      const key = keys[c.field];
      if (!key) throw new QueryError("INVALID_FILTER", "目录不支持该检索字段");
      return [key, c.value];
    }),
  );
}
export function createDeliveryDirectoryQuery(
  transport: DirectoryTransport,
  range: { recorded_from: string; recorded_to: string },
  conditions: readonly DeliverySearchCondition[] = [],
) {
  if (!validRecordedRange(range))
    throw new QueryError("INVALID_FILTER", "需要有效的 Evidence 落库时间范围");
  const filters = { ...range, ...directoryFilters(conditions), limit: 100 };
  return createPagedQuery<
    unknown,
    DeliverySearchRecord,
    string,
    DirectoryMetadata
  >({
    read: ({ signal, continuation }) =>
      transport.request(
        "deliveries/list",
        { ...filters, ...(continuation ? { cursor: continuation } : {}) },
        signal,
      ),
    resolver: {
      resolve(wire) {
        if (
          !record(wire) ||
          !closed(wire, [
            "contract",
            "snapshot",
            "total",
            "next_cursor",
            "items",
          ]) ||
          !record(wire.contract) ||
          wire.contract.name !== "evidence.delivery-directory" ||
          wire.contract.revision !== "1.0.0" ||
          typeof wire.snapshot !== "string" ||
          !wire.snapshot ||
          !Number.isSafeInteger(wire.total) ||
          (wire.total as number) < 0 ||
          !(
            wire.next_cursor === null || typeof wire.next_cursor === "string"
          ) ||
          !Array.isArray(wire.items) ||
          wire.items.length > 100
        )
          throw new QueryError("INCOMPATIBLE", "Delivery 目录响应不符合契约");
        const rows = wire.items.map((item): DeliverySearchRecord => {
          if (
            !record(item) ||
            !closed(item, [
              "delivery_id",
              "trace_id",
              "task_id",
              "task_name",
              "workflow_id",
              "workflow_version",
              "started_at",
              "recorded_at",
            ]) ||
            typeof item.delivery_id !== "string" ||
            !item.delivery_id ||
            ![
              "trace_id",
              "task_id",
              "task_name",
              "workflow_id",
              "workflow_version",
              "started_at",
            ].every((k) => item[k] === null || typeof item[k] === "string") ||
            typeof item.recorded_at !== "string" ||
            !Number.isFinite(Date.parse(item.recorded_at)) ||
            Date.parse(item.recorded_at) < Date.parse(range.recorded_from) ||
            Date.parse(item.recorded_at) > Date.parse(range.recorded_to) ||
            (item.trace_id !== null &&
              !/^[a-f0-9]{32}$/.test(item.trace_id as string)) ||
            (item.started_at !== null &&
              !Number.isFinite(Date.parse(item.started_at as string)))
          )
            throw new QueryError(
              "INCOMPATIBLE",
              "Delivery 元数据无效或超出查询范围",
            );
          return {
            deliveryId: item.delivery_id,
            traceId: (item.trace_id as string) ?? "",
            taskId: (item.task_id as string) ?? "",
            taskName: (item.task_name ?? item.task_id ?? "") as string,
            workflowId: (item.workflow_id as string) ?? "",
            workflowName: (item.workflow_id as string) ?? "",
            workflowVersion: (item.workflow_version as string) ?? "",
            startedAt: (item.started_at as string) ?? "",
            recordedAt: item.recorded_at,
          };
        });
        if (
          new Set(rows.map((r) => r.deliveryId)).size !== rows.length ||
          rows.length > (wire.total as number)
        )
          throw new QueryError("INCOMPATIBLE", "目录身份或总数不一致");
        return {
          rows,
          next: wire.next_cursor as string | null,
          meta: { snapshot: wire.snapshot, total: wire.total as number },
        };
      },
    },
    mergeMeta(previous, next) {
      if (
        !previous ||
        !next ||
        previous.snapshot !== next.snapshot ||
        previous.total !== next.total
      )
        throw new QueryError("SNAPSHOT_CHANGED", "目录快照已变更，请刷新");
      return next;
    },
  });
}
