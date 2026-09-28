import { bytewiseCompare } from "../evidence/validation";
import { createPagedQuery } from "../../support/data/paged-query";
import { QueryError } from "../../support/data/query-error";
import {
  decodeRecordedComputeResponse,
  validRecordedSelection,
} from "./client";
import type {
  MetricResult,
  RecordedEvaluationContext,
  RecordedSelection,
} from "./types";
export interface RecordedEvaluationTransport {
  request(
    endpoint: "evaluations/compute",
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
export type RecordedRange = Omit<RecordedSelection, "selection_version">;
export function createRecordedEvaluationQuery(
  transport: RecordedEvaluationTransport,
  range: RecordedRange,
) {
  const selection: RecordedSelection = {
    selection_version: 2,
    ...range,
    ...(range.delivery_ids
      ? { delivery_ids: [...range.delivery_ids].sort(bytewiseCompare) }
      : {}),
  };
  if (!validRecordedSelection(selection))
    throw new QueryError(
      "INVALID_SELECTION",
      "需要有效的 Evidence 落库时间范围",
    );
  return createPagedQuery<
    unknown,
    MetricResult,
    never,
    RecordedEvaluationContext
  >({
    read: ({ signal }) =>
      transport.request(
        "evaluations/compute",
        { api_version: 1, mode: "SINGLE", selection },
        signal,
      ),
    resolver: {
      resolve(wire) {
        const result = decodeRecordedComputeResponse(wire);
        if (!result.ok)
          throw new QueryError(
            result.error.kind,
            "reason" in result.error
              ? result.error.reason
              : "指标响应不符合契约",
          );
        const receipt = result.value.result.receipt;
        const actual = receipt.selection;
        if (
          Date.parse(actual.recorded_from) !==
            Date.parse(selection.recorded_from) ||
          Date.parse(actual.recorded_to) !==
            Date.parse(selection.recorded_to) ||
          JSON.stringify(actual.delivery_ids ?? null) !==
            JSON.stringify(selection.delivery_ids ?? null)
        )
          throw new QueryError(
            "SELECTION_MISMATCH",
            "指标响应范围与请求不一致",
          );
        return {
          rows: result.value.result.metric_results,
          next: null,
          meta: receipt,
        };
      },
    },
  });
}
