import { mapAncestors, type WorkflowMapIR } from "./workflow-map-ir";
export type MapCamera = { x: number; y: number; scale: number };
export function frameMap(
  rect: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): MapCamera {
  const scale = Math.max(
    0.02,
    Math.min(
      1.4,
      Math.max(1, viewport.width - 96) / Math.max(1, rect.width),
      Math.max(1, viewport.height - 96) / Math.max(1, rect.height),
    ),
  );
  return {
    scale,
    x: viewport.width / 2 - (rect.x + rect.width / 2) * scale,
    y: viewport.height / 2 - (rect.y + rect.height / 2) * scale,
  };
}
/** Structural reachability, not a claim that execution conditions will be satisfied. */
export function upstreamMap(
  ir: WorkflowMapIR,
  target: string,
  mode: "expected" | "all" = "all",
) {
  const nodes = new Set<string>([target]),
    edges = new Set<string>();
  if (ir.nodes.find((n) => n.id === target)?.kind === "group")
    for (const n of ir.nodes)
      if (mapAncestors(ir, n.id).includes(target)) nodes.add(n.id);
  const pending = [...nodes];
  while (pending.length) {
    const id = pending.pop()!;
    for (const edge of ir.edges) {
      if (
        edge.kind === "material" ||
        (mode === "expected" && edge.intent !== "expected") ||
        edge.to !== id
      )
        continue;
      edges.add(edge.id);
      if (!nodes.has(edge.from)) {
        nodes.add(edge.from);
        pending.push(edge.from);
      }
    }
  }
  return { nodes, edges };
}
