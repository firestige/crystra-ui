import { singleResponse } from "../test/analysis-response";
import { describe, expect, it } from "vitest";
import { createAnalysisClient } from "./analysis-query";
import { projectEvaluationPanels } from "./analysis-projection";
import type { MetricResult } from "./evolution/types";

describe("analysis query and projection boundaries", () => {
  it("rejects invalid/expanded selections before transport and reuses the same Task set", () => {
    let calls = 0;
    const client = createAnalysisClient({
      request: async () => {
        calls++;
        return {};
      },
    });
    expect(() => client.evaluation([])).toThrow();
    expect(() => client.evaluation(["bad id"])).toThrow();
    expect(client.evaluation(["b", "a"])).toBe(client.evaluation(["a", "b"]));
    expect(calls).toBe(0);
    client.dispose();
  });
  it("keeps units, exact values, slice identity and missingness without inventing totals", () => {
    const metric: MetricResult = {
      metric_id: "operational-latency-ms",
      metric_version: "2.0.0",
      slices: [
        {
          slice_key: { provider: "p", model: "m" },
          state: "AVAILABLE",
          value: { kind: "DURATION_MS", value: "1/3", unit: "milliseconds" },
          measures: {},
          coverage: null,
          compatibility: {},
          exclusions: [],
          missing_inputs: [],
          provenance_refs: [],
        },
        {
          slice_key: { provider: "q" },
          state: "UNAVAILABLE",
          withholding_reason: "MISSING_INPUT",
          measures: {},
          coverage: null,
          compatibility: {},
          exclusions: [],
          missing_inputs: [],
          provenance_refs: [],
        },
      ],
    };
    const panels = projectEvaluationPanels([metric]);
    expect(panels).toHaveLength(2);
    expect(panels[0]?.chart).toMatchObject({
      type: "number",
      value: 1 / 3,
      unit: "milliseconds",
      exact: "1/3 milliseconds",
    });
    expect(panels[1]?.chart).toBeNull();
    expect(panels[0]?.title).toBe("平均调用耗时");
  });
});

it("preserves typed decode errors and rejects a mismatched receipt selection", async () => {
  const client = createAnalysisClient({
    request: async () => singleResponse("task-b"),
  });
  const query = client.evaluation(["task-a"]);
  await query.actions.load();
  expect(query.getSnapshot().rows).toEqual([]);
  expect(query.getSnapshot().error).toMatchObject({
    code: "SELECTION_MISMATCH",
  });
  client.dispose();
});
