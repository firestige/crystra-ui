import { createPagedQuery, type PagedQuery } from "../support/data/paged-query";
import { QueryError } from "../support/data/query-error";
import { decodeComputeResponse } from "./evolution/client";
import type {
  MetricResult,
  ResolvedEvaluationContext,
} from "./evolution/types";
import { decodeTaskPage } from "./evidence/task-client";

export interface AnalysisTransport {
  request(
    endpoint:
      | "deliveries/list"
      | "tasks/list"
      | "evaluations/compute"
      | "traces/read"
      | "tasks/membership",
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
function decodedError(error: {
  kind: string;
  reason?: string;
  code?: string;
  message?: string;
}) {
  return new QueryError(
    error.code ?? error.kind,
    error.message ?? error.reason ?? error.kind,
  );
}
/** One active evaluation scope, shared across all panels. Host owns this client's lifetime. */
export function createAnalysisClient(transport: AnalysisTransport) {
  let disposed = false;
  const tasks = createPagedQuery({
    read: ({
      signal,
      continuation,
    }: {
      signal: AbortSignal;
      continuation: string | undefined;
    }) =>
      transport.request(
        "tasks/list",
        {
          limit: 100,
          ...(continuation === undefined ? {} : { cursor: continuation }),
        },
        signal,
      ),
    resolver: {
      resolve(wire: unknown) {
        const decoded = decodeTaskPage(wire, 100);
        if (!decoded.ok) throw decodedError(decoded.error);
        return {
          rows: decoded.value.items,
          next: decoded.value.next_cursor,
          meta: decoded.value.snapshot,
        };
      },
    },
    mergeMeta(previous, next) {
      if (previous !== next)
        throw new QueryError("SNAPSHOT_CHANGED", "查询快照发生变化，请刷新");
      return next;
    },
  });
  let active:
    | {
        key: string;
        resource: PagedQuery<MetricResult, ResolvedEvaluationContext>;
      }
    | undefined;
  return {
    tasks,
    evaluation(taskIds: readonly string[]) {
      if (disposed) throw new QueryError("DISPOSED", "分析数据作用域已关闭");
      const ids = [...taskIds].sort();
      if (
        ids.length < 1 ||
        ids.length > 24 ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/.test(id))
      )
        throw new QueryError(
          "INVALID_SELECTION",
          "请选择 1–24 个不同的 Evidence Task",
        );
      const key = JSON.stringify(ids);
      if (active?.key === key) return active.resource;
      active?.resource.dispose();
      const resource = createPagedQuery<
        unknown,
        MetricResult,
        never,
        ResolvedEvaluationContext
      >({
        read: ({ signal }) =>
          transport.request(
            "evaluations/compute",
            {
              api_version: 1,
              mode: "SINGLE",
              selection: { selection_version: 1, task_ids: ids },
            },
            signal,
          ),
        resolver: {
          resolve(wire) {
            const decoded = decodeComputeResponse(wire);
            if (!decoded.ok) throw decodedError(decoded.error);
            if (
              decoded.value.mode !== "SINGLE" ||
              JSON.stringify(
                decoded.value.result.receipt.selection.task_ids,
              ) !== key
            )
              throw new QueryError(
                "SELECTION_MISMATCH",
                "返回数据的 Task 范围与请求不一致",
              );
            return {
              rows: decoded.value.result.metric_results,
              next: null,
              meta: decoded.value.result.receipt,
            };
          },
        },
      });
      active = { key, resource };
      return resource;
    },
    dispose() {
      disposed = true;
      tasks.dispose();
      active?.resource.dispose();
    },
  };
}
export type AnalysisClient = ReturnType<typeof createAnalysisClient>;
