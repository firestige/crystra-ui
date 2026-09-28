import { renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useDeliveryTrace } from "./use-delivery-trace";
const wire = {
  contract: { name: "evidence.query", revision: "0.1.0" },
  observation_profile: "1.0.0",
  read_model_revision: "1.0.0",
  snapshot: "s",
  items: [],
  next_cursor: null,
  trace_state: "ABSENT",
  trace_summaries: [],
};
it("queries only a selected identity and cancels the previous selection", async () => {
  const request = vi.fn<
    import("../domain/evidence/analysis-query").EvidenceQueryTransport["request"]
  >(async () => wire);
  const transport = { request };
  const { result, rerender, unmount } = renderHook(
    ({ id }: { id: string | null }) => useDeliveryTrace(transport, id, "7d", 0),
    { initialProps: { id: null } as { id: string | null } },
  );
  expect(request).not.toHaveBeenCalled();
  rerender({ id: "a".repeat(32) });
  await waitFor(() => expect(result.current.state.phase).toBe("ready"));
  expect(request.mock.calls[0]?.[1]).toMatchObject({
    trace_id: "a".repeat(32),
    recorded_from: expect.any(String),
    recorded_to: expect.any(String),
  });
  const signal = request.mock.calls[0]?.[2] as AbortSignal;
  rerender({ id: "b".repeat(32) });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(signal.aborted).toBe(true);
  unmount();
});
