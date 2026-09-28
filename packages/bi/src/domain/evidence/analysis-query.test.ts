import { expect, it, vi } from "vitest";
import {
  createDeliveryTraceQuery,
  type EvidenceQueryTransport,
} from "./analysis-query";
const trace = "a".repeat(32);
const page = (snapshot = "s", next: string | null = null) => ({
  contract: { name: "evidence.query", revision: "0.1.0" },
  observation_profile: "1.0.0",
  read_model_revision: "1.0.0",
  snapshot,
  items: [],
  next_cursor: next,
  trace_state: "ABSENT",
  trace_summaries: [],
});
it("reads Evidence directly with immutable Delivery identity and does not issue Evaluation queries", async () => {
  const request = vi.fn<EvidenceQueryTransport["request"]>(async () => page());
  const query = createDeliveryTraceQuery(
    { request },
    { delivery_id: "delivery-a" },
  );
  await query.actions.load();
  expect(request.mock.calls[0]?.[0]).toBe("traces/read");
  expect(request.mock.calls[0]?.[1]).toEqual({
    delivery_id: "delivery-a",
    limit: 200,
  });
  expect(query.getSnapshot().meta).toMatchObject({
    snapshot: "s",
    trace_state: "ABSENT",
  });
  expect(query.getSnapshot().phase).toBe("ready");
  query.dispose();
});
it("rejects a response for a different exact Trace and preserves a typed error", async () => {
  const query = createDeliveryTraceQuery(
    {
      request: async () => ({
        ...page(),
        trace_state: "EXPIRED",
        trace_summaries: [{ trace_id: "b".repeat(32), state: "EXPIRED" }],
      }),
    },
    { trace_id: trace },
  );
  await query.actions.load();
  expect(query.getSnapshot().error).toMatchObject({
    code: "TRACE_IDENTITY_MISMATCH",
  });
  query.dispose();
});
it("rejects ambiguous scope before transport", () => {
  const request = vi.fn();
  expect(() =>
    createDeliveryTraceQuery({ request }, {
      delivery_id: "delivery-a",
      trace_id: trace,
    } as never),
  ).toThrow();
  expect(request).not.toHaveBeenCalled();
});

it("keeps pagination metadata stable and preserves accepted rows if the next snapshot drifts", async () => {
  let reads = 0;
  const request = vi.fn<EvidenceQueryTransport["request"]>(async () => {
    reads++;
    const span = (reads === 1 ? "c" : "d").repeat(16);
    return {
      ...page(
        reads === 1 ? "snapshot-1" : "snapshot-2",
        reads === 1 ? "next-page" : null,
      ),
      trace_state: "AVAILABLE",
      trace_summaries: [{ trace_id: trace, state: "AVAILABLE" }],
      items: [
        {
          id: `node-${span}`,
          trace_id: trace,
          kind: "NODE",
          source: { kind: "SPAN", trace_id: trace, span_id: span },
          recorded_at: "2026-09-28T00:00:00.000000Z",
          truth: {
            completeness: null,
            availability: "AVAILABLE",
            expiry: "ACTIVE",
            expires_at: "2027-09-28T00:00:00.000000Z",
          },
          node: {
            span_id: span,
            span_name: "chat",
            span_kind: "CLIENT",
            start_time_unix_nano: "1000000000",
            end_time_unix_nano: "2000000000",
            span_status: "OK",
            span_flags: 1,
            trace_state: null,
            fields: [],
          },
          edge: null,
        },
      ],
    };
  });
  const scope = { delivery_id: "delivery-a" };
  const query = createDeliveryTraceQuery({ request }, scope);
  scope.delivery_id = "changed-after-creation";
  await query.actions.load();
  expect(query.getSnapshot().rows).toHaveLength(1);
  await query.actions.loadMore();
  expect(request.mock.calls[1]?.[1]).toEqual({
    delivery_id: "delivery-a",
    limit: 200,
    cursor: "next-page",
  });
  expect(query.getSnapshot().error).toMatchObject({ code: "SNAPSHOT_CHANGED" });
  expect(query.getSnapshot().rows).toHaveLength(1);
  expect(query.getSnapshot().meta?.snapshot).toBe("snapshot-1");
  query.dispose();
});

it("keeps the selected trace inside the recorded-time range", async () => {
  const request = vi.fn<EvidenceQueryTransport["request"]>(async () => page());
  const range = {
    recorded_from: "2026-09-01T00:00:00Z",
    recorded_to: "2026-09-28T00:00:00Z",
  };
  const q = createDeliveryTraceQuery(
    { request },
    { trace_id: trace, ...range },
  );
  await q.actions.load();
  expect(request.mock.calls[0]?.[1]).toEqual({
    trace_id: trace,
    ...range,
    limit: 200,
  });
  q.dispose();
});
