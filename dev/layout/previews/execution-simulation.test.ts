import { expect, it } from "vitest";
import { executionFrame } from "./execution-simulation";
it("advances the same Delivery without changing graph identity and stops motion at failure", () => {
  const a = executionFrame(1, "normal"),
    b = executionFrame(18, "normal"),
    failed = executionFrame(18, "error");
  const ar = a.waves.find((w) => w.id === "w2")!.run!,
    br = b.waves.find((w) => w.id === "w2")!.run!;
  expect(ar.identity.deliveryId).toBeTruthy();
  expect(ar.graph).toBe(br.graph);
  expect(ar.frontier).not.toEqual(br.frontier);
  expect(failed.waves.find((w) => w.id === "w2")!.run!.motion?.pace).toBe(
    "error",
  );
});
it("preserves concurrent calls and the join without recording trace payloads", () => {
  const run = executionFrame(25, "normal").waves.find(
    (w) => w.id === "w2",
  )!.run!;
  expect(
    run.calls?.filter((c) => c.sequence === 2).map((c) => c.actionId),
  ).toEqual(["signature", "scan"]);
  expect(
    run.calls?.find((c) => c.actionId === "install")?.predecessors,
  ).toEqual(["call-signature-1", "call-scan-1"]);
  expect(run.identity).not.toHaveProperty("traceId");
  expect(
    executionFrame(60, "normal").waves.find((w) => w.id === "w2")!.run!
      .frontier,
  ).toEqual([]);
});
