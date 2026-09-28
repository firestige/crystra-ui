import { validRecordedRange } from "../recorded-range";
import { createPagedQuery } from "../../support/data/paged-query";
import { QueryError } from "../../support/data/query-error";
import { decodeEvidencePage, type TracesFilters } from "./client";
import type { TraceItem, TracesPage } from "./types";

export interface EvidenceQueryTransport {
  request(
    endpoint: "traces/read",
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
type TraceSelection<T> = T extends unknown ? Omit<T, "cursor"> : never;

export type TraceQueryMetadata = Omit<TracesPage, "items" | "next_cursor">;
/** Exact selected-record read, not a global directory scan or an Evaluation request.
 * Owner shares this resource across views and disposes it when the selection is evicted.
 */
export function createDeliveryTraceQuery(
  transport: EvidenceQueryTransport,
  scope: TraceSelection<TracesFilters> & {
    recorded_from?: string;
    recorded_to?: string;
  },
) {
  const { trace_id, delivery_id } = scope;
  const limit = scope.limit ?? 200;
  const ranged =
    scope.recorded_from !== undefined || scope.recorded_to !== undefined;
  if (
    (trace_id === undefined) === (delivery_id === undefined) ||
    (ranged && !validRecordedRange(scope)) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 200 ||
    Object.keys(scope).some(
      (key) =>
        ![
          "trace_id",
          "delivery_id",
          "limit",
          "recorded_from",
          "recorded_to",
        ].includes(key),
    ) ||
    (trace_id !== undefined && !/^[a-f0-9]{32}$/.test(trace_id)) ||
    (delivery_id !== undefined &&
      (typeof delivery_id !== "string" ||
        !delivery_id ||
        delivery_id.length > 256 ||
        Array.from(delivery_id).some(
          (character) =>
            character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )))
  )
    throw new QueryError("INVALID_FILTER", "需要精确的 Delivery 或 Trace 身份");
  const filters = {
    ...(ranged
      ? { recorded_from: scope.recorded_from, recorded_to: scope.recorded_to }
      : {}),
    ...(trace_id === undefined ? { delivery_id } : { trace_id }),
    limit,
  };
  return createPagedQuery<unknown, TraceItem, string, TraceQueryMetadata>({
    read: ({ signal, continuation }) =>
      transport.request(
        "traces/read",
        {
          ...filters,
          ...(continuation === undefined ? {} : { cursor: continuation }),
        },
        signal,
      ),
    resolver: {
      resolve(wire) {
        const result = decodeEvidencePage("traces", wire, limit);
        if (!result.ok) {
          const error = result.error;
          throw new QueryError(
            "code" in error ? error.code : error.kind,
            "reason" in error
              ? error.reason
              : "message" in error
                ? error.message
                : error.kind,
          );
        }
        if (!("trace_state" in result.value))
          throw new QueryError("INCOMPATIBLE", "Trace 响应类型不匹配");
        const { items, next_cursor, ...meta } = result.value;
        if (
          ranged &&
          items.some(
            (item) =>
              Date.parse(item.recorded_at) < Date.parse(scope.recorded_from!) ||
              Date.parse(item.recorded_at) > Date.parse(scope.recorded_to!),
          )
        )
          throw new QueryError(
            "RANGE_MISMATCH",
            "Trace 响应包含范围外的 Observation",
          );
        if (
          trace_id &&
          (items.some((item) => item.trace_id !== trace_id) ||
            meta.trace_summaries.some((item) => item.trace_id !== trace_id))
        )
          throw new QueryError(
            "TRACE_IDENTITY_MISMATCH",
            "响应不属于选中的 Trace",
          );
        return { rows: items, next: next_cursor, meta };
      },
    },
    mergeMeta(previous, next) {
      if (
        !previous ||
        !next ||
        previous.snapshot !== next.snapshot ||
        previous.trace_state !== next.trace_state ||
        JSON.stringify(previous.trace_summaries) !==
          JSON.stringify(next.trace_summaries)
      )
        throw new QueryError(
          "SNAPSHOT_CHANGED",
          "Trace 查询范围或快照发生变化，请刷新",
        );
      return next;
    },
  });
}
