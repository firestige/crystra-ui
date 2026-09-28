import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { observationRange } from "./observation-time";
const read = (file: string) =>
  readFileSync(resolve(import.meta.dirname, file), "utf8");
it("keeps analysis display modules independent of fixtures and host navigation", () => {
  for (const file of [
    "analysis-observation-study.tsx",
    "result-analysis-preview.tsx",
    "observation-layout-editor.tsx",
    "observation-layout-codec.ts",
    "analysis-data.tsx",
  ]) {
    const code = read(file);
    expect(code, file).not.toMatch(/from ["'][^"']*test-harness/);
    expect(code, file).not.toMatch(/\b(?:history|location)\./);
  }
});
it("uses shared form primitives in analysis editors", () => {
  for (const file of [
    "analysis-observation-study.tsx",
    "observation-layout-editor.tsx",
    "observation-time-controls.tsx",
  ]) {
    expect(read(file), file).not.toMatch(/<(?:select|input)\b/);
  }
});
it("resolves relative ranges against the caller's clock", () => {
  expect(observationRange("7d", "2030-01-10")).toEqual([
    "2030-01-04T00:00:00",
    "2030-01-10T23:59:59",
  ]);
});
