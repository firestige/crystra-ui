import { expect, it } from "vitest";
import type { WorkflowActivityIR } from "./workflow-activity-ir";
import fixture from "./workflow-activity-ir.example.json";
import {
  advanceRehearsal,
  inspectBindings,
  rehearsalChoices,
  resourceBindings,
  resources,
  startRehearsal,
} from "./workflow-projection-tools";
const ir = fixture as WorkflowActivityIR;
it("uses declared edges, preserves repeated visits and can fork from an earlier step", () => {
  let s = startRehearsal();
  s = advanceRehearsal(ir, s, "tests-ready");
  s = advanceRehearsal(ir, s, "implementation-result");
  expect(rehearsalChoices(ir, s).map((e) => e.id)).toEqual([
    "rung-red",
    "rung-green",
  ]);
  expect(() => advanceRehearsal(ir, s, "terminal")).toThrow();
  s = advanceRehearsal(ir, s, "rung-red");
  s = advanceRehearsal(ir, s, "implementation-result");
  expect(s.visits.filter((v) => v.nodeId === "implement")).toHaveLength(2);
  const fork = advanceRehearsal(ir, { ...s, cursor: 2 }, "rung-green");
  expect(fork.visits.map((v) => v.nodeId)).toEqual([
    "calibrate",
    "implement",
    "rung-result",
    "coverage",
  ]);
  expect(s.visits).toHaveLength(5);
});
it("finds a missing resource at its owning graph node without changing the definition", () => {
  const before = JSON.stringify(ir);
  expect(inspectBindings(ir, resources, resourceBindings)).toEqual([]);
  const issues = inspectBindings(
    ir,
    resources.filter((r) => r.kind !== "skill"),
    resourceBindings,
  );
  expect(issues).toEqual([
    expect.objectContaining({
      flowId: "ladder",
      nodeId: "implement",
      resourceId: "tdd-skill",
    }),
  ]);
  expect(JSON.stringify(ir)).toBe(before);
});
