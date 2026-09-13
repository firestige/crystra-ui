import { describe, expect, it } from "vitest";
import { frameMap, upstreamMap } from "./workflow-map-camera";
import type { WorkflowMapIR } from "./workflow-map-ir";
describe("map camera and upstream semantics", () => {
  it("centers bounds with breathing room", () => {
    const c = frameMap(
      { x: 800, y: 300, width: 900, height: 400 },
      { width: 1200, height: 700 },
    );
    expect(c.x + 1250 * c.scale).toBeCloseTo(600);
    expect(c.y + 500 * c.scale).toBeCloseTo(350);
    expect(c.scale * 900).toBeLessThanOrEqual(1104);
    expect(c.scale * 900).toBeGreaterThan(900);
  });
  it("caps enlargement", () => {
    expect(
      frameMap(
        { x: 0, y: 0, width: 48, height: 48 },
        { width: 1800, height: 900 },
      ).scale,
    ).toBeLessThanOrEqual(1.4);
  });
  it("traverses predecessors with cycles without downstream or material links", () => {
    const ir = {
      version: "0.2",
      title: "any",
      nodes: ["a", "b", "c", "d", "x"].map((id) => ({
        id,
        kind: "activity",
        title: id,
      })),
      edges: [
        { id: "ab", from: "a", to: "b" },
        { id: "bc", from: "b", to: "c" },
        { id: "cb", from: "c", to: "b" },
        { id: "cd", from: "c", to: "d" },
        { id: "xc", from: "x", to: "c", kind: "material" },
      ],
    } as WorkflowMapIR;
    const r = upstreamMap(ir, "c");
    expect([...r.nodes].sort()).toEqual(["a", "b", "c"]);
    expect([...r.edges].sort()).toEqual(["ab", "bc", "cb"]);
  });
});
