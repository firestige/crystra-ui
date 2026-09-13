/** Design-tool samples. Never invokes an Action, script, model, or Definition writer. */
import type { WorkflowActivityIR } from "./workflow-activity-ir";
import catalog from "./workflow-projection-resources.example.json";
export type ProjectionResource = {
  id: string;
  kind: "role" | "prompt" | "skill" | "template" | "script";
  title: string;
  path: string;
  nodeIds: string[];
  description: string;
  content: string;
  provenance: string;
};
export const resources = catalog as ProjectionResource[];
export type ResourceBinding = {
  flowId: string;
  nodeId: string;
  resourceId: string;
};
export const resourceBindings: ResourceBinding[] = resources.flatMap((r) =>
  r.nodeIds
    .filter((id) => id !== "ladder")
    .map((nodeId) => ({ flowId: "ladder", nodeId, resourceId: r.id })),
);
export type ProjectionIssue = ResourceBinding & {
  id: string;
  title: string;
  detail: string;
};
export function inspectBindings(
  ir: WorkflowActivityIR,
  catalog: ProjectionResource[],
  bindings: ResourceBinding[],
): ProjectionIssue[] {
  return bindings
    .filter((b) => !catalog.some((r) => r.id === b.resourceId))
    .map((b) => ({
      ...b,
      id: "missing-" + b.resourceId + "-" + b.nodeId,
      title: "Missing resource: " + b.resourceId,
      detail: ir.nodes.find((n) => n.id === b.nodeId)?.title || b.nodeId,
    }));
}
export type RehearsalVisit = {
  nodeId: string;
  edgeId?: string;
  data: Record<string, string>;
};
export type Rehearsal = {
  flowId: string;
  visits: RehearsalVisit[];
  cursor: number;
};
export const startRehearsal = (): Rehearsal => ({
  flowId: "ladder",
  cursor: 0,
  visits: [
    {
      nodeId: "calibrate",
      data: {
        goal: "G-02",
        rung: "R2",
        oracle: "calibrated RED",
        candidate: "draft-01",
      },
    },
  ],
});
// One authored scenario. Other scenarios / LLM results can provide another choice envelope.
const scenarioEdges = [
  "tests-ready",
  "implementation-result",
  "rung-red",
  "rung-green",
  "coverage-ready",
  "refactor-ready",
  "next-rung",
  "ladder-complete",
];
export function rehearsalChoices(ir: WorkflowActivityIR, s: Rehearsal) {
  const visit = s.visits[s.cursor];
  return ir.flows
    .find((f) => f.id === s.flowId)!
    .edges.filter(
      (e) => e.from === visit.nodeId && scenarioEdges.includes(e.id),
    );
}
export function advanceRehearsal(
  ir: WorkflowActivityIR,
  s: Rehearsal,
  edgeId: string,
): Rehearsal {
  const edge = rehearsalChoices(ir, s).find((e) => e.id === edgeId);
  if (!edge) throw new Error("Edge is not available in this scenario");
  const data = { ...s.visits[s.cursor].data };
  if (edgeId === "rung-red") {
    data.test = "RED";
    data.diagnostic = "progress";
  }
  if (edgeId === "rung-green") {
    data.test = "GREEN";
    delete data.diagnostic;
  }
  if (edgeId === "implementation-result") data.test = "awaiting scenario input";
  if (edgeId === "coverage-ready") data.coverage = "closed";
  if (edgeId === "refactor-ready") data.refactor = "NO_REFACTOR_NEEDED";
  if (edgeId === "next-rung") {
    data.rung = "R" + (Number(data.rung.slice(1)) + 1);
    data.oracle = "calibrated RED";
    delete data.test;
    delete data.coverage;
    delete data.refactor;
  }
  if (edgeId === "ladder-complete") data.ladder = "verified";
  return {
    ...s,
    cursor: s.cursor + 1,
    visits: [
      ...s.visits.slice(0, s.cursor + 1),
      { nodeId: edge.to, edgeId, data },
    ],
  };
}
