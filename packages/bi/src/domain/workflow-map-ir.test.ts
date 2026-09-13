import { expect, it } from "vitest";
import { parseWorkflowMap, projectWorkflowMap } from "./workflow-map-ir";
const sample = () => ({
  version: "0.2",
  title: "示例",
  nodes: [
    { id: "s", kind: "start", title: "开始" },
    { id: "g", kind: "group", title: "处理" },
    { id: "a", kind: "activity", title: "处理材料", parent: "g" },
    { id: "e", kind: "end", title: "完成" },
  ],
  edges: [
    { id: "in", from: "s", to: "a" },
    { id: "out", from: "a", to: "e" },
  ],
});
it("rejects malformed input, unknown node kinds and cyclic hierarchy without throwing", () => {
  for (const value of [
    null,
    {},
    { ...sample(), version: "bad" },
    { ...sample(), nodes: [{ id: "x", kind: "magic", title: "x" }] },
  ])
    expect(parseWorkflowMap(value).ok).toBe(false);
  const s = sample();
  s.nodes[1] = { ...s.nodes[1], parent: "g" };
  expect(parseWorkflowMap(s).ok).toBe(false);
});
it("preserves original edge identities through collapse and expand", () => {
  const parsed = parseWorkflowMap(sample());
  if (!parsed.ok) throw Error("invalid");
  const before = JSON.stringify(parsed.ir);
  const collapsed = projectWorkflowMap(parsed.ir, new Set());
  expect(collapsed.edges.map((e) => [e.id, e.from, e.to])).toEqual([
    ["in", "s", "g"],
    ["out", "g", "e"],
  ]);
  expect(projectWorkflowMap(parsed.ir, new Set(["g"])).edges[0].to).toBe("a");
  expect(JSON.stringify(parsed.ir)).toBe(before);
});
it("keeps incomplete semantics drawable but prevents a clean publication result", () => {
  const s = sample();
  s.edges.pop();
  const p = parseWorkflowMap(s);
  expect(p.ok).toBe(true);
  if (p.ok)
    expect(
      p.issues.some((i) => i.severity === "blocking" && i.nodeId === "a"),
    ).toBe(true);
});
it("does not allow geometry authored by the Agent or ambiguous group endpoints", () => {
  const a = sample();
  Object.assign(a.nodes[2], { x: 300 });
  expect(parseWorkflowMap(a).ok).toBe(false);
  const b = sample();
  b.edges[0].to = "g";
  expect(parseWorkflowMap(b).ok).toBe(false);
});
it("collapsing retains distinct cross-boundary relationships and labels", () => {
  const s = sample();
  s.nodes.push({ id: "b", kind: "activity", title: "核对材料", parent: "g" });
  s.edges.push({ id: "other", from: "b", to: "e" });
  const p = parseWorkflowMap(s);
  if (!p.ok) throw Error("invalid");
  const v = projectWorkflowMap(p.ir, new Set());
  expect(
    v.edges.filter((e) => e.from === "g" && e.to === "e").map((e) => e.id),
  ).toEqual(["out", "other"]);
});
it("allows internal decisions and renders author-declared phase outcomes when collapsed", () => {
  const s = sample();
  s.nodes.push({ id: "d", kind: "decision", title: "验收通过？", parent: "g" });
  s.edges = [
    { id: "in", from: "s", to: "a" },
    { id: "check", from: "a", to: "d" },
    { id: "yes", from: "d", to: "e", label: "通过", summaryLabel: "阶段完成" },
    { id: "no", from: "d", to: "a", label: "返工" },
  ] as typeof s.edges;
  const p = parseWorkflowMap(s);
  if (!p.ok) throw Error("invalid");
  expect(p.issues.some((i) => i.code === "HIDDEN_BOUNDARY_DECISION")).toBe(
    false,
  );
  expect(
    projectWorkflowMap(p.ir, new Set()).edges.find((e) => e.id === "yes")
      ?.label,
  ).toBe("阶段完成");
  expect(
    projectWorkflowMap(p.ir, new Set(["g"])).edges.find((e) => e.id === "yes")
      ?.label,
  ).toBe("通过");
});
it("accepts explicit terminal outcomes only on end nodes", () => {
  const s = sample();
  Object.assign(s.nodes[3], { outcome: "terminated" });
  expect(parseWorkflowMap(s).ok).toBe(true);
  Object.assign(s.nodes[2], { outcome: "completed" });
  expect(parseWorkflowMap(s).ok).toBe(false);
});
