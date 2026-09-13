import { describe, expect, it } from "vitest";
import { familyViews } from "../domain/widget-families";
import { overviewRecords } from "./observation-overview-fixture";
import { createObservationQueryCatalog } from "./observation-query-fixture";
const base = {
  metric: "cache",
  providers: "all",
  models: "all",
  groupBy: "provider",
  time: "summary",
  tokens: "total",
} as const;
describe("observation metric queries", () => {
  it("adds providers as dimensions, keeps the metric catalog stable, and follows all versus explicit selection", () => {
    const before = createObservationQueryCatalog("7d");
    const after = createObservationQueryCatalog("7d", undefined, [
      ...overviewRecords,
      {
        ...overviewRecords.at(-1)!,
        provider: "New provider",
        model: "New model",
      },
    ]);
    expect(after.metrics).toEqual(before.metrics);
    expect(after.providers).toContain("New provider");
    const all = after.resolve(base).data;
    expect(all.family === "matrix" && all.rows.map((r) => r.name)).toContain(
      "New provider",
    );
    const selected = after.resolve({ ...base, providers: ["DeepSeek"] }).data;
    expect(
      selected.family === "matrix" && selected.rows.map((r) => r.name),
    ).toEqual(["DeepSeek"]);
  });
  it("computes cache ratios from summed tokens rather than averaging provider percentages", () => {
    const row = overviewRecords.at(-1)!;
    const catalog = createObservationQueryCatalog("7d", undefined, [
      { ...row, provider: "A", input: 100, cached: 80 },
      { ...row, provider: "B", input: 900, cached: 90 },
    ]);
    const result = catalog.resolve({ ...base, groupBy: "none" }).data;
    expect(result.family === "scalar" && result.value).toBe(17);
    const comparison = catalog.resolve(base).data;
    expect(
      comparison.family === "matrix" && comparison.rows.map((r) => r.values[0]),
    ).toEqual([80, 10]);
    expect(familyViews(comparison).map((v) => v.id)).not.toContain(
      "stacked-columns",
    );
    const trend = catalog.resolve({ ...base, time: "daily" }).data;
    expect(trend.family === "matrix" && trend.rows.map((r) => r.name)).toEqual([
      "A",
      "B",
    ]);
    expect(familyViews(trend).map((v) => v.id)).toContain("multi-line");
    expect(familyViews(trend).map((v) => v.id)).not.toContain(
      "stacked-columns",
    );
  });
  it("keeps an empty period distinct from zero and preserves comparison shape", () => {
    const catalog = createObservationQueryCatalog(
      "custom:2027-01-01T00:00:00/2027-01-02T23:59:59",
    );
    const comparison = catalog.resolve(base);
    expect(comparison.empty).toBe(true);
    expect(comparison.data.family).toBe("matrix");
    expect(
      comparison.data.family === "matrix" &&
        comparison.data.rows.every((r) => r.values.every((v) => v === null)),
    ).toBe(true);
    expect(catalog.resolve({ ...base, groupBy: "none" }).empty).toBe(true);
  });
  it("rejects unsupported dimensions and empty explicit selections", () => {
    const catalog = createObservationQueryCatalog("7d");
    expect(() => catalog.resolve({ ...base, providers: [] })).toThrow();
    expect(() =>
      catalog.resolve({ ...base, metric: "subscription", groupBy: "provider" }),
    ).toThrow();
  });
});
