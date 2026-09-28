import { expect, it } from "vitest";
import { bindMetric, type MetricAdapter } from "./metric-binding";
import type { MetricResult } from "./types";
const adapter: MetricAdapter<number> = {
  metricId: "sample-count",
  metricVersion: "1.0.0",
  project: (result) => result.slices.length,
};
const metric: MetricResult = {
  metric_id: "sample-count",
  metric_version: "1.0.0",
  slices: [],
};
it("binds only the supported metric version without depending on other metrics", () => {
  expect(bindMetric([metric], adapter)).toEqual({
    status: "available",
    data: 0,
  });
  expect(
    bindMetric([{ ...metric, metric_id: "other" }, metric], adapter),
  ).toEqual({ status: "available", data: 0 });
  expect(bindMetric([], adapter)).toEqual({ status: "missing" });
  expect(bindMetric([{ ...metric, metric_version: "2.0.0" }], adapter)).toEqual(
    { status: "incompatible" },
  );
});
it("keeps semantic failures local to the adapter", () => {
  expect(
    bindMetric([metric], { ...adapter, project: () => undefined }),
  ).toEqual({ status: "incompatible" });
  expect(bindMetric([metric, metric], adapter)).toEqual({
    status: "incompatible",
  });
});
