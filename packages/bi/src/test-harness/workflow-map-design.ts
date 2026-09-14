import data from "./workflow-map-design.json";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import type { MapLayout } from "../domain/workflow-map-engine";
import type { WorkflowLayoutResolver } from "../components/workflow-map-viewer";
type RawEdge = { originalId: string; points: { x: number; y: number }[] };
type RawLayout = Omit<MapLayout, "edges"> & { edges: RawEdge[] };
const fixtures = data as unknown as {
  ir: WorkflowMapIR;
  groups: string[];
  layouts: Record<string, RawLayout>;
}[];
export const workflowDesignDefinitions = fixtures.map((entry) => entry.ir);
/** Literal projection from accepted workflow-map-candidate.js; never lays out changed definitions using sample coordinates. */
export const resolveWorkflowDesignLayout: WorkflowLayoutResolver = async (
  ir,
  expanded,
  direction,
) => {
  const entry = fixtures.find(
    (entry) => JSON.stringify(entry.ir) === JSON.stringify(ir),
  );
  if (!entry) throw new Error("定义未匹配定稿布局样本");
  const mask = entry.groups.reduce(
      (value, id, i) => value | (expanded.has(id) ? 1 << i : 0),
      0,
    ),
    layout = entry.layouts[direction + mask];
  if (!layout) throw new Error("展开状态未匹配定稿布局样本");
  return {
    ...layout,
    edges: layout.edges.map((edge, i) => {
      const semantic = ir.edges.find((value) => value.id === edge.originalId),
        last = edge.points.at(-1);
      if (!semantic || !last) throw new Error("布局关系未匹配定义");
      let targetId: string | undefined = semantic.to;
      while (targetId && !layout.nodes.some((node) => node.id === targetId))
        targetId = ir.nodes.find((node) => node.id === targetId)?.parent;
      const target = layout.nodes.find(
        (node) => node.id === targetId && !node.expanded,
      );
      return {
        ...edge,
        id: edge.originalId,
        segmentKey: edge.originalId + ":" + i,
        path: edge.points
          .map((point, index) => (index ? "L" : "M") + point.x + " " + point.y)
          .join(" "),
        arrow:
          !!target &&
          last.x >= target.x - 0.1 &&
          last.x <= target.x + target.width + 0.1 &&
          last.y >= target.y - 0.1 &&
          last.y <= target.y + target.height + 0.1,
      };
    }),
  };
};

export const workflowExplorationEntries = [
  {
    definitionId: "draft-workflow-implementation",
    revision: "v8-2eecd430",
    title: "Implementation",
    purpose: "草案探索 · 从需求与设计到经过验证的实现",
    isLatest: true,
  },
];
