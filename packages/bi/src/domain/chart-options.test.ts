import { expect, it } from "vitest";
import { applyChartRange } from "./chart-range";
import type { MatrixData } from "./widget-families";
import { chartMinimumSize, isWidgetSizeAllowed } from "./widget-families";
const data: MatrixData = {
  family: "matrix",
  title: "命中率",
  unit: "%",
  domain: [0, 100],
  ordered: true,
  dimensions: ["a", "b"],
  rows: [
    { name: "A", values: [82, 84] },
    { name: "B", values: [83, 85] },
  ],
};
it("chart sizes have a minimum but no finite set or upper bound", () => {
  expect(chartMinimumSize(data, "multi-line")).toEqual({ h: 2, w: 3 });
  expect(isWidgetSizeAllowed(data, "multi-line", "1x3")).toBe(false);
  expect(isWidgetSizeAllowed(data, "multi-line", "2x2")).toBe(false);
  expect(isWidgetSizeAllowed(data, "multi-line", "4x5")).toBe(true);
  expect(isWidgetSizeAllowed(data, "multi-line", "30x40")).toBe(true);
  expect(isWidgetSizeAllowed(data, "multi-line", "2.5x3")).toBe(false);
});
it("auto range exposes small differences, zero and full remain explicit choices", () => {
  expect(applyChartRange(data, "multi-line", { mode: "auto" }).domain).toEqual([
    81.7, 85.3,
  ]);
  expect(applyChartRange(data, "heatmap", { mode: "full" }).domain).toEqual([
    0, 100,
  ]);
  expect(applyChartRange(data, "heatmap", { mode: "zero" }).domain?.[0]).toBe(
    0,
  );
  expect(
    applyChartRange(data, "heatmap", { mode: "custom", min: 80, max: 90 })
      .domain,
  ).toEqual([80, 90]);
  expect(() =>
    applyChartRange(data, "heatmap", { mode: "custom", min: 90, max: 80 }),
  ).toThrow();
});
it("constant and missing data do not produce a zero-width or invalid domain", () => {
  const constant = { ...data, rows: [{ name: "A", values: [83, 83] }] };
  const ranged = applyChartRange(constant, "multi-line", {
    mode: "auto",
  }).domain!;
  expect(ranged[1]).toBeGreaterThan(ranged[0]);
  const missing = { ...data, rows: [{ name: "A", values: [null, null] }] };
  expect(applyChartRange(missing, "heatmap", { mode: "auto" }).domain).toEqual([
    0, 100,
  ]);
});
it("applies the same range contract to frequency charts", () => {
  const histogram = {
    family: "distribution" as const,
    title: "耗时分布",
    unit: "ms",
    bins: [
      { from: 0, to: 10, count: 80 },
      { from: 10, to: 20, count: 82 },
    ],
  };
  expect(
    applyChartRange(histogram, "frequency-line", { mode: "auto" }).domain,
  ).toEqual([79.8, 82.2]);
  expect(
    applyChartRange(histogram, "histogram", { mode: "zero" }).domain?.[0],
  ).toBe(0);
});
