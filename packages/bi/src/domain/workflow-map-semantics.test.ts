import { expect, it } from "vitest";
import { upstreamMap } from "./workflow-map-camera";
import { parseWorkflowMap, type WorkflowMapIR } from "./workflow-map-ir";
const fixture = () =>
  ({
    version: "0.2",
    title: "示例",
    nodes: [
      { id: "s", kind: "start", title: "开始" },
      { id: "a", kind: "activity", title: "执行" },
      { id: "e", kind: "end", title: "结束" },
    ],
    edges: [
      { id: "sa", from: "s", to: "a", intent: "expected" },
      { id: "ae", from: "a", to: "e", intent: "expected" },
    ],
  }) as WorkflowMapIR;
it("reports unclassified control flow instead of guessing from labels", () => {
  const ir = fixture();
  delete ir.edges[0].intent;
  const r = parseWorkflowMap(ir);
  expect(r.ok && r.issues.some((i) => i.code === "UNCLASSIFIED_FLOW")).toBe(
    true,
  );
});
it("blocks recovery without a trigger and missing expected completion", () => {
  const ir = fixture();
  ir.edges[1].intent = "recovery";
  const r = parseWorkflowMap(ir);
  expect(r.ok && r.issues.map((i) => i.code)).toEqual(
    expect.arrayContaining(["MISSING_TRIGGER", "NO_EXPECTED_COMPLETION"]),
  );
});
it("excludes declared rework but retains intentional iteration in expected upstream", () => {
  const ir = fixture();
  ir.nodes.push({ id: "r", kind: "activity", title: "修复" });
  ir.edges.push(
    { id: "ra", from: "r", to: "a", intent: "rework", trigger: "复核失败" },
    { id: "aa", from: "a", to: "a", intent: "expected", label: "下一项" },
  );
  expect(upstreamMap(ir, "e", "expected").nodes.has("r")).toBe(false);
  expect(upstreamMap(ir, "e", "expected").edges.has("aa")).toBe(true);
  expect(upstreamMap(ir, "e", "all").nodes.has("r")).toBe(true);
});
