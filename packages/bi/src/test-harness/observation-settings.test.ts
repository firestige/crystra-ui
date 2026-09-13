import { expect, it } from "vitest";
import {
  exportObservationSetting,
  importObservationSetting,
  initialObservationSettings,
} from "./observation-settings";
it("roundtrips per-chart settings without temporary data scope", () => {
  const text = exportObservationSetting(initialObservationSettings[0]);
  expect(importObservationSetting(text)).toEqual(initialObservationSettings[0]);
  expect(text).not.toContain("delivery-");
  expect(importObservationSetting(text).charts.map((c) => c.primary)).toEqual([
    "version",
    "provider",
  ]);
});
it("rejects unsupported metric operations and duplicate chart identities", () => {
  const data = JSON.parse(
    exportObservationSetting(initialObservationSettings[0]),
  );
  data.setting.charts[0].items[0].operation = "bad";
  expect(() => importObservationSetting(JSON.stringify(data))).toThrow();
  data.setting.charts[0].items[0].operation = "sum";
  data.setting.charts.push(data.setting.charts[0]);
  expect(() => importObservationSetting(JSON.stringify(data))).toThrow();
  expect(() => importObservationSetting("{")).toThrow();
});

it("requires a shared unit including denominator for a single chart", async () => {
  const { compatibleChartItem } = await import("./observation-settings");
  expect(
    compatibleChartItem(initialObservationSettings[1].charts[0].items, {
      metric: "ttft",
      operation: "mean",
    }),
  ).toBe(true);
  expect(
    compatibleChartItem(initialObservationSettings[1].charts[0].items, {
      metric: "cost",
      operation: "sum",
    }),
  ).toBe(false);
  expect(
    compatibleChartItem(initialObservationSettings[0].charts[0].items, {
      metric: "cost",
      operation: "sum",
    }),
  ).toBe(false);
  const file = JSON.parse(
    exportObservationSetting(initialObservationSettings[1]),
  );
  file.setting.charts[0].items.push({
    id: "bad",
    metric: "cost",
    operation: "sum",
    name: "费用",
  });
  expect(() => importObservationSetting(JSON.stringify(file))).toThrow(
    /不兼容/,
  );
});

it("pivots one metric into field rows and columns", async () => {
  const { observationMatrix } = await import("./observation-settings");
  const { analysisDeliveries } = await import("./result-analysis-fixture");
  const chart = {
    ...initialObservationSettings[0].charts[0],
    primary: "model" as const,
    secondary: "role" as const,
  };
  const matrix = observationMatrix(
    chart,
    analysisDeliveries.map((d) => d.deliveryId),
  );
  expect(matrix.dimensions).toEqual(["Model A", "Model B"]);
  expect(matrix.rows.map((r) => r.name)).toEqual(["Engineer", "Reviewer"]);
  expect(matrix.rows.every((r) => r.values.length === 2)).toBe(true);
  expect(matrix.rows.flatMap((r) => r.values).every((v) => v !== null)).toBe(
    true,
  );
});

it("keeps absent field intersections empty and uses data columns as radar axes", async () => {
  const { observationMatrix } = await import("./observation-settings");
  const { analysisDeliveries } = await import("./result-analysis-fixture");
  const ids = analysisDeliveries.map((d) => d.deliveryId);
  const matrix = observationMatrix(
    {
      ...initialObservationSettings[0].charts[0],
      primary: "provider",
      secondary: "role",
    },
    ids,
  );
  expect(matrix.rows.find((r) => r.name === "Reviewer")!.values[1]).toBeNull();
  const radar = observationMatrix(initialObservationSettings[2].charts[1], ids);
  expect(radar.dimensions.length).toBe(3);
  expect(radar.rows.map((r) => r.name).sort()).toEqual(["Model A", "Model B"]);
});

it("roundtrips value mappings and only renders mapped series", async () => {
  const { observationMatrix } = await import("./observation-settings");
  const { analysisDeliveries } = await import("./result-analysis-fixture");
  const setting = structuredClone(initialObservationSettings[1]);
  setting.charts[0].valueItemIds = ["p95"];
  expect(importObservationSetting(exportObservationSetting(setting))).toEqual(
    setting,
  );
  const withoutSplit = { ...setting.charts[0], secondary: "" as const };
  expect(
    observationMatrix(
      withoutSplit,
      analysisDeliveries.map((d) => d.deliveryId),
    ).rows.map((row) => row.name),
  ).toEqual(["P95"]);
  setting.charts[0].valueItemIds = ["missing"];
  expect(() =>
    importObservationSetting(exportObservationSetting(setting)),
  ).toThrow("数值轴映射无效");
});
it("computes token series from existing facts without substituting latency", async () => {
  const { analysisDeliveries, analyzeItems } =
    await import("./result-analysis-fixture");
  const rows = analyzeItems(
    [analysisDeliveries[0].deliveryId],
    [],
    [
      { id: "input", metric: "input", operation: "sum", name: "输入" },
      { id: "output", metric: "output", operation: "sum", name: "输出" },
      { id: "total", metric: "tokens", operation: "sum", name: "总量" },
      { id: "cached", metric: "cached", operation: "sum", name: "缓存" },
      { id: "uncached", metric: "uncached", operation: "sum", name: "未缓存" },
    ],
  );
  const v = rows[0].values;
  expect(v.total).toBe(v.input + v.output);
  expect(v.input).toBe(v.cached + v.uncached);
});
it("rejects multiple heatmap values including implicit mappings", () => {
  const setting = structuredClone(initialObservationSettings[2]);
  const chart = setting.charts[0];
  chart.items.push({ ...chart.items[0], id: "second" });
  expect(() =>
    importObservationSetting(exportObservationSetting(setting)),
  ).toThrow(/热力图/);
  chart.valueItemIds = [chart.items[0].id];
  expect(importObservationSetting(exportObservationSetting(setting))).toEqual(
    setting,
  );
  chart.valueItemIds = chart.items.map((item) => item.id);
  expect(() =>
    importObservationSetting(exportObservationSetting(setting)),
  ).toThrow(/热力图/);
});
