import { expect, it } from "vitest";
import { recordedDeliveryData } from "./analysis-deliveries";
import { searchDeliveries } from "./delivery-search";
import type { TraceItem } from "./evidence/types";
function node(trace: string, delivery: string): TraceItem {
  return {
    id: `node-${trace}`,
    kind: "NODE",
    trace_id: trace,
    source: { kind: "SPAN", trace_id: trace, span_id: "a".repeat(16) },
    recorded_at: "2026-09-20T00:00:00.000000Z",
    truth: {
      completeness: null,
      availability: "AVAILABLE",
      expiry: "ACTIVE",
      expires_at: null,
    },
    edge: null,
    node: {
      span_id: "a".repeat(16),
      span_name: "invoke_workflow",
      span_kind: "INTERNAL",
      start_time_unix_nano: "1000000000",
      end_time_unix_nano: "2000000000",
      span_status: "OK",
      span_flags: 1,
      trace_state: null,
      fields: [
        { field: "C01", value: delivery },
        { field: "C02", value: "task-a" },
        { field: "C03", value: "workflow-a" },
        { field: "C04", value: "1.0" },
      ],
    },
  };
}
it("uses recorded time for range membership, retaining native execution time for display", () => {
  const data = recordedDeliveryData([node("a".repeat(32), "delivery-a")]);
  expect(data.deliveries).toHaveLength(1);
  expect(
    searchDeliveries(
      data.deliveries!,
      [],
      ["2026-09-01T00:00:00Z", "2026-09-28T00:00:00Z"],
      data.searchFields!,
    ),
  ).toHaveLength(1);
  expect(data.deliveries![0].startedAt).toBe("1970-01-01T00:00:01.000Z");
  expect(data.trace!(data.deliveries![0])?.nodes).toHaveLength(1);
});
it("does not silently pick a trace when two traces claim one Delivery", () => {
  expect(
    recordedDeliveryData([node("a".repeat(32), "d"), node("b".repeat(32), "d")])
      .deliveries,
  ).toEqual([]);
});
