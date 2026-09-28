import { createPagedQuery } from "../../support/data/paged-query";
import { QueryError } from "../../support/data/query-error";
import { decodeEvidencePage } from "./client";
import type { TraceItem } from "./types";
import type {
  EvidenceQueryTransport,
  TraceQueryMetadata,
} from "./analysis-query";
import { validRecordedRange } from "../recorded-range";
export function createRecordedTraceQuery(
  transport: EvidenceQueryTransport,
  range: { recorded_from: string; recorded_to: string },
) {
  const filters = {
    recorded_from: range.recorded_from,
    recorded_to: range.recorded_to,
    limit: 200,
  };
  if (!validRecordedRange(range))
    throw new QueryError("INVALID_FILTER", "需要有效的 Evidence 落库时间范围");
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
        const decoded = decodeEvidencePage("traces", wire, 200, 500);
        if (!decoded.ok)
          throw new QueryError(
            "code" in decoded.error ? decoded.error.code : decoded.error.kind,
            "reason" in decoded.error
              ? decoded.error.reason
              : "Evidence 查询失败",
          );
        if (!("trace_state" in decoded.value))
          throw new QueryError("INCOMPATIBLE", "Trace 响应类型错误");
        const { items, next_cursor, ...meta } = decoded.value;
        if (
          items.some(
            (i) =>
              Date.parse(i.recorded_at) < Date.parse(filters.recorded_from) ||
              Date.parse(i.recorded_at) > Date.parse(filters.recorded_to),
          )
        )
          throw new QueryError(
            "RANGE_MISMATCH",
            "Evidence 返回范围外的 Observation",
          );
        return { rows: items, next: next_cursor, meta };
      },
    },
    mergeMeta(previous, next) {
      if (
        !previous ||
        !next ||
        JSON.stringify(previous) !== JSON.stringify(next)
      )
        throw new QueryError(
          "SNAPSHOT_CHANGED",
          "Evidence 分页快照发生变化，请刷新",
        );
      return next;
    },
  });
}
