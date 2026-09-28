import { expect, it, vi } from "vitest";
import wire from "./fixtures/recorded-compute.json";
import { decodeRecordedComputeResponse } from "./client";
import { createRecordedEvaluationQuery } from "./recorded-query";
const range = {
  recorded_from: "2026-09-01T00:00:00Z",
  recorded_to: "2026-09-28T00:00:00Z",
};
it("decodes the actual Evaluation recorded-range serialization", () => {
  expect(decodeRecordedComputeResponse(wire).ok).toBe(true);
});
it("requests one global range and reuses existing MetricResult without Task selection", async () => {
  const request = vi.fn<
    import("./recorded-query").RecordedEvaluationTransport["request"]
  >(async () => structuredClone(wire));
  const query = createRecordedEvaluationQuery({ request }, range);
  await query.actions.load();
  expect(query.getSnapshot().error).toBeNull();
  expect(query.getSnapshot().rows).toHaveLength(12);
  expect(request.mock.calls[0]).toEqual([
    "evaluations/compute",
    {
      api_version: 1,
      mode: "SINGLE",
      selection: { selection_version: 2, ...range },
    },
    expect.any(AbortSignal),
  ]);
  query.dispose();
});
it("rejects response for a different interval", async () => {
  const response = structuredClone(wire);
  response.result.receipt.selection.recorded_from = "2026-09-02T00:00:00Z";
  const query = createRecordedEvaluationQuery(
    { request: async () => response },
    range,
  );
  await query.actions.load();
  expect(query.getSnapshot().error).not.toBeNull();
  expect(query.getSnapshot().rows).toEqual([]);
  query.dispose();
});
it("preserves an explicit empty Delivery subset", async () => {
  const request = vi.fn<
    import("./recorded-query").RecordedEvaluationTransport["request"]
  >(async () => structuredClone(wire));
  const query = createRecordedEvaluationQuery(
    { request },
    { ...range, delivery_ids: [] },
  );
  await query.actions.load();
  expect(request.mock.calls[0]?.[1]).toMatchObject({
    selection: { delivery_ids: [] },
  });
  expect(query.getSnapshot().error).not.toBeNull();
  query.dispose();
});
it("permits Evidence attribution reads only within the same global recorded interval", () => {
  const response = structuredClone(wire);
  const binding = response.result.receipt.evidence_bindings[0];
  response.result.receipt.evidence_bindings.push({
    ...binding,
    canonical_filter: {
      ...binding.canonical_filter,
      delivery_id: "delivery-a",
    },
  } as typeof binding);
  expect(decodeRecordedComputeResponse(response).ok).toBe(true);
  response.result.receipt.evidence_bindings.at(
    -1,
  )!.canonical_filter.recorded_from = "2026-08-01T00:00:00.000000Z";
  expect(decodeRecordedComputeResponse(response).ok).toBe(false);
});

it.each(["add", "remove", "upgrade", "empty"])(
  "keeps the query independent of metric catalog changes: %s",
  async (change) => {
    const response = structuredClone(wire);
    response.result.receipt.catalog.version = "3.0.0";
    response.result.receipt.catalog.semantic_digest = "a".repeat(64);
    if (change === "add")
      response.result.metric_results.push({
        ...response.result.metric_results[0]!,
        metric_id: "future-metric",
        metric_version: "1.0.0",
      });
    if (change === "remove") response.result.metric_results.pop();
    if (change === "upgrade")
      response.result.metric_results[0]!.metric_version = "3.0.0";
    if (change === "empty") response.result.metric_results = [];
    const query = createRecordedEvaluationQuery(
      { request: async () => response },
      range,
    );
    await query.actions.load();
    expect(query.getSnapshot().error).toBeNull();
    expect(query.getSnapshot().rows).toEqual(response.result.metric_results);
    query.dispose();
  },
);
it("still rejects duplicate coordinates and malformed metric values", () => {
  const response = structuredClone(wire);
  response.result.metric_results.push(response.result.metric_results[0]!);
  expect(decodeRecordedComputeResponse(response).ok).toBe(false);
  response.result.metric_results.pop();
  response.result.metric_results[0]!.metric_version = "";
  expect(decodeRecordedComputeResponse(response).ok).toBe(false);
});
