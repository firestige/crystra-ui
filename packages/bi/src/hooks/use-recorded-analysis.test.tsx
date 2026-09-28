import { StrictMode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useRecordedAnalysis } from "./use-recorded-analysis";
import wire from "../domain/evolution/fixtures/recorded-compute.json";
import type { RecordedEvaluationTransport } from "../domain/evolution/recorded-query";
it("survives StrictMode cleanup and refreshes the coordinated scope", async () => {
  const request = vi.fn<RecordedEvaluationTransport["request"]>(async () =>
    structuredClone(wire),
  );
  const transport = { request };
  const onRefresh = vi.fn();
  const { result, unmount } = renderHook(
    () =>
      useRecordedAnalysis(
        transport,
        "custom:2026-09-01T08:00:00/2026-09-28T08:00:00",
        onRefresh,
      ),
    { wrapper: StrictMode },
  );
  await waitFor(() => expect(result.current.state.phase).toBe("ready"));
  expect(result.current.state.rows).toHaveLength(12);
  act(() => result.current.refresh());
  await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.state.phase).toBe("ready"));
  const signal = request.mock.calls.at(-1)![2];
  unmount();
  expect(signal.aborted).toBe(true);
});

it("does not query Evaluation while disabled", async () => {
  const request = vi.fn<RecordedEvaluationTransport["request"]>(async () =>
    structuredClone(wire),
  );
  const transport = { request };
  const { unmount } = renderHook(() =>
    useRecordedAnalysis(transport, "7d", undefined, null, false),
  );
  await act(async () => {});
  expect(request).not.toHaveBeenCalled();
  unmount();
});
it("moves a relative recorded range forward when refreshing after midnight", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-28T15:59:00Z"));
  const request = vi.fn<RecordedEvaluationTransport["request"]>(async () =>
    structuredClone(wire),
  );
  const transport = { request };
  const { result, unmount } = renderHook(() =>
    useRecordedAnalysis(transport, "7d"),
  );
  await waitFor(() => expect(request).toHaveBeenCalled());
  const before = request.mock.calls.at(-1)![1];
  vi.setSystemTime(new Date("2026-09-28T16:01:00Z"));
  act(() => result.current.refresh());
  await waitFor(() => expect(request.mock.calls.length).toBe(2));
  expect(request.mock.calls.at(-1)![1]).not.toEqual(before);
  unmount();
  vi.useRealTimers();
});
