import { it, expect, vi } from "vitest";
import { createRecordedTraceQuery } from "./recorded-query";
const range = {
  recorded_from: "2026-09-01T00:00:00Z",
  recorded_to: "2026-09-28T00:00:00Z",
};
const empty = {
  contract: { name: "evidence.query", revision: "0.1.0" },
  observation_profile: "1.0.0",
  read_model_revision: "1.0.0",
  snapshot: "s",
  items: [],
  next_cursor: null,
  trace_state: "ABSENT",
  trace_summaries: [],
};
it("passes only recorded range and reuses Evidence page", async () => {
  const request = vi.fn(async () => empty);
  const q = createRecordedTraceQuery({ request }, range);
  await q.actions.load();
  expect(q.getSnapshot().error).toBeNull();
  expect(request).toHaveBeenCalledWith(
    "traces/read",
    { ...range, limit: 200 },
    expect.any(AbortSignal),
  );
  q.dispose();
});
it("preserves more than 32 distinct traces in a global range without treating them as one Delivery", async () => {
  const trace_summaries = Array.from({ length: 33 }, (_, i) => ({
    trace_id: i.toString(16).padStart(32, "0"),
    state: "EXPIRED",
  }));
  const q = createRecordedTraceQuery(
    {
      request: async () => ({
        ...empty,
        trace_summaries,
        trace_state: "EXPIRED",
      }),
    },
    range,
  );
  await q.actions.load();
  expect(q.getSnapshot().error).toBeNull();
  expect(q.getSnapshot().meta?.trace_summaries).toHaveLength(33);
  q.dispose();
});
