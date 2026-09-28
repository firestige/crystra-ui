import { expect, it } from "vitest";
import response from "./evolution/fixtures/recorded-compute.json";
import { decodeRecordedComputeResponse } from "./evolution/client";
import { recordedAnalysisData } from "./analysis-recorded";
const filters = {
  group: "provider",
  workflow: "all",
  role: "all",
  tokens: "total",
} as const;
it("binds actual token slices, retaining unknown billing and cache values", () => {
  const decoded = decodeRecordedComputeResponse(response);
  if (!decoded.ok) throw Error("fixture invalid");
  const data = recordedAnalysisData(decoded.value.result.metric_results);
  const widgets = data.overview!("7d", filters);
  expect(widgets.input.data).toMatchObject({
    family: "scalar",
    value: 18,
    unit: "Token",
  });
  expect(widgets.spend.data).toMatchObject({ value: null });
  expect(widgets.cache0.data).toMatchObject({ value: null });
});
it("does not turn missing input direction into a zero total", () => {
  const decoded = decodeRecordedComputeResponse(response);
  if (!decoded.ok) throw Error("fixture invalid");
  const metrics = structuredClone(decoded.value.result.metric_results);
  metrics.find((m) => m.metric_id === "operational-token-usage")!.slices =
    metrics
      .find((m) => m.metric_id === "operational-token-usage")!
      .slices.filter((s) => s.slice_key.direction !== "output");
  expect(
    recordedAnalysisData(metrics).overview!("7d", filters).input.data,
  ).toMatchObject({ value: null });
});
it("builds comparison token series using existing metric cohorts", () => {
  const decoded = decodeRecordedComputeResponse(response);
  if (!decoded.ok) throw Error("fixture invalid");
  const matrix = recordedAnalysisData(decoded.value.result.metric_results)
    .matrix!(
    {
      id: "c",
      title: "Tokens",
      items: [
        { id: "i", name: "输入", metric: "input", operation: "sum" },
        { id: "o", name: "输出", metric: "output", operation: "sum" },
      ],
      primary: "provider",
      secondary: "",
    },
    [],
  );
  expect(matrix.dimensions).toEqual(["provider"]);
  expect(matrix.rows.map((r) => r.values)).toEqual([[11], [7]]);
});

it("does not interpret a new metric version using the old token semantics", () => {
  const decoded = decodeRecordedComputeResponse(response);
  if (!decoded.ok) throw Error("fixture invalid");
  const metrics = structuredClone(decoded.value.result.metric_results);
  metrics.find(
    (m) => m.metric_id === "operational-token-usage",
  )!.metric_version = "3.0.0";
  expect(
    recordedAnalysisData(metrics).overview!("7d", filters).input.data,
  ).toMatchObject({ value: null });
});
it("keeps existing token panels working when unrelated metrics are added or removed", () => {
  const decoded = decodeRecordedComputeResponse(response);
  if (!decoded.ok) throw Error("fixture invalid");
  const token = decoded.value.result.metric_results.find(
    (m) => m.metric_id === "operational-token-usage",
  )!;
  for (const metrics of [
    [token],
    [token, { ...token, metric_id: "future-metric" }],
  ]) {
    expect(
      recordedAnalysisData(metrics).overview!("7d", filters).input.data,
    ).toMatchObject({ value: 18 });
  }
  expect(
    recordedAnalysisData([]).overview!("7d", filters).input.data,
  ).toMatchObject({ value: null });
});
