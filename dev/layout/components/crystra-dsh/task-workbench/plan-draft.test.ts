import { expect, it } from "vitest";
import example from "../../../../../../wsr-contracts/docs/proposals/plan-json-ir/example.json";
import { projectPlanDraft } from "./plan-draft";
it("projects free chapter titles and exact identities without inventing runtime state", () => {
  const result = projectPlanDraft(example);
  expect(result.key).toBe(JSON.stringify(example.identity));
  expect(result.plan.document?.map((s) => s.title)).toEqual(
    example.document.sections.map((s) => s.title),
  );
  expect(result.plan.readiness).toBeUndefined();
  expect(result.graph.nodes.find((n) => n.id === "node-approval")?.rank).toBe(
    2,
  );
  expect(
    result.graph.nodes.find((n) => n.id === "node-approval")?.details.join(" "),
  ).toContain("gate-publish");
});
it("rejects cycles, dangling edges and unsupported formats", () => {
  const cyclic = structuredClone(example);
  cyclic.graph.edges.push({
    id: "back",
    from: "node-result",
    to: "node-implement",
    conditionRef: "cond-candidate",
  });
  expect(() => projectPlanDraft(cyclic)).toThrow(/无环/);
  const dangling = structuredClone(example);
  dangling.graph.edges[0].to = "missing";
  expect(() => projectPlanDraft(dangling)).toThrow(/引用/);
  expect(() => projectPlanDraft({ ...example, format: "future" })).toThrow(
    /格式/,
  );
});
it("preserves nested free sections and rejects invalid hierarchy or IDs", () => {
  const nested = structuredClone(example);
  nested.document.sections[1].parentId = "section-intro" as never;
  expect(projectPlanDraft(nested).plan.document?.[1].depth).toBe(1);
  nested.document.sections[0].parentId = "section-work" as never;
  expect(() => projectPlanDraft(nested)).toThrow(/父级/);
  const duplicate = structuredClone(example);
  duplicate.graph.nodes.push(duplicate.graph.nodes[0]);
  expect(() => projectPlanDraft(duplicate)).toThrow(/重复/);
});
