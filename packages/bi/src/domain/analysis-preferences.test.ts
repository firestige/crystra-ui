import { expect, it } from "vitest";
import { decodeAnalysisPreferences } from "./analysis-preferences";
import { PRESET_LAYOUTS } from "./layout/layout";
it("validates persisted shape while retaining unavailable metric references", () => {
  const value = {
    settings: [{ id: "a", name: "研究", charts: [] }],
    layout: structuredClone(PRESET_LAYOUTS["default-overview@1"]),
  };
  value.layout.panels[0]!.metric_coordinate = "retired@1.0.0";
  expect(decodeAnalysisPreferences(value)).toEqual(value);
  expect(
    decodeAnalysisPreferences({ ...value, layout: { panels: null } }),
  ).toBeUndefined();
  expect(
    decodeAnalysisPreferences({
      ...value,
      settings: [{ id: "a", name: "坏", charts: [{}] }],
    }),
  ).toBeUndefined();
});
