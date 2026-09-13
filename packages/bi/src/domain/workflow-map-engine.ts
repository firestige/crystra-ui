import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import ELK from "elkjs/lib/elk.bundled.js";
import { projectWorkflowMap, type WorkflowMapIR } from "./workflow-map-ir";
export type MapLayout = {
  width: number;
  height: number;
  nodes: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    expanded: boolean;
    caption?: {
      x: number;
      y: number;
      width: number;
      height: number;
      baseline: number;
    };
  }[];
  edges: {
    id: string;
    path: string;
    segmentKey?: string;
    scope?: string;
    arrow?: boolean;
    label?: {
      x: number;
      y: number;
      text: string;
      width: number;
      height: number;
    };
  }[];
  boundaries?: {
    id: string;
    group: string;
    edgeId: string;
    external: string;
    target: string;
    direction: string;
    side: string;
    x: number;
    y: number;
  }[];
};
const elk = new ELK();
/** Engine owns every pixel. No workflow names, activity IDs or business-specific layout branches. */
export async function layoutWorkflowMap(
  ir: WorkflowMapIR,
  expanded: ReadonlySet<string>,
  direction: "RIGHT" | "DOWN" = "RIGHT",
  viewport = { width: 1200, height: 800 },
): Promise<MapLayout> {
  const projection = projectWorkflowMap(ir, expanded);
  // Spacing is configured on every compound graph; root options are not a blanket inheritance contract.
  const spacing = (parent?: string) => {
    const count = projection.nodes.filter((n) => n.parent === parent).length;
    const available = direction === "RIGHT" ? viewport.width : viewport.height;
    const gap = Math.round(
      Math.max(
        32,
        Math.min(80, (available - 96 - count * 160) / Math.max(1, count - 1)),
      ),
    );
    return {
      "elk.layered.mergeEdges": "false",
      "elk.layered.mergeHierarchyEdges": "false",
      "elk.spacing.nodeNode": String(Math.max(32, gap * 0.7)),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(gap),
      "elk.spacing.edgeNode": "28",
      "elk.layered.spacing.edgeNodeBetweenLayers": "28",
      "elk.spacing.edgeEdge": "20",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
      "elk.spacing.portPort": "28",
    };
  };
  const labelBox = (text: string) => {
    const measure = (value: string) =>
      [...value].reduce(
        (sum, c) => sum + (c.codePointAt(0)! < 128 ? 7 : 14),
        0,
      );
    const target = Math.min(
      98,
      Math.ceil(measure(text) / Math.ceil(measure(text) / 98) / 14) * 14,
    );
    const lines: string[] = [];
    let line = "";
    for (const char of text) {
      if (measure(line + char) > target && line) {
        lines.push(line);
        line = "";
      }
      line += char;
    }
    if (line) lines.push(line);
    return {
      text: lines.join("\n"),
      width: Math.max(...lines.map(measure)) + 12,
      height: lines.length * 20 + 8,
    };
  };
  type Side = "NORTH" | "SOUTH" | "WEST" | "EAST";
  const sides = new Map<string, Side>();
  const portId = (id: string, endpoint: string) =>
    JSON.stringify(["port", id, endpoint]);
  const children = (parent?: string): ElkNode[] =>
    projection.nodes
      .filter((n) => n.parent === parent)
      .sort(
        (a, b) =>
          (a.kind === "start" ? -1 : a.kind === "end" ? 1 : 0) -
          (b.kind === "start" ? -1 : b.kind === "end" ? 1 : 0),
      )
      .map((n): ElkNode => {
        if (n.expanded)
          return {
            id: n.id,
            children: children(n.id),
            layoutOptions: {
              ...spacing(n.id),
              "elk.padding": "[top=52,left=28,bottom=28,right=28]",
              "elk.direction": direction,
            },
          };
        const width =
          n.kind === "start" || n.kind === "end"
            ? 48
            : n.kind === "fork" || n.kind === "join"
              ? direction === "RIGHT"
                ? 14
                : 144
              : Math.min(360, Math.max(160, n.title.length * 16 + 40));
        const height =
          n.kind === "decision"
            ? 136
            : n.kind === "start" || n.kind === "end"
              ? 48
              : n.kind === "fork" || n.kind === "join"
                ? direction === "RIGHT"
                  ? 96
                  : 14
                : 88;
        // One port per edge endpoint. Spread within the silhouette, leaving corners clear.
        const endpoints = (["from", "to"] as const).flatMap((endpoint) =>
          projection.edges
            .filter((e) => e[endpoint] === n.id)
            .map((edge) => ({
              edge,
              endpoint,
              side:
                sides.get(portId(edge.id, endpoint)) ??
                ((direction === "RIGHT"
                  ? endpoint === "from"
                    ? "EAST"
                    : "WEST"
                  : endpoint === "from"
                    ? "SOUTH"
                    : "NORTH") as Side),
            })),
        );
        const ports = (["NORTH", "SOUTH", "WEST", "EAST"] as const).flatMap(
          (side) => {
            const incident = endpoints.filter((e) => e.side === side),
              horizontal = side === "EAST" || side === "WEST";
            const extent = horizontal ? height : width;
            const step = Math.min(
              28,
              Math.max(0, extent - 32) / Math.max(1, incident.length - 1),
            );
            return incident.map(({ edge, endpoint }, index) => {
              const offset = (index - (incident.length - 1) / 2) * step,
                across = extent / 2 + offset;
              const outward = side === "EAST" || side === "SOUTH",
                depth = horizontal ? width : height;
              const contour =
                n.kind === "decision"
                  ? 1 - Math.abs(offset) / (extent / 2)
                  : n.kind === "start" || n.kind === "end"
                    ? Math.sqrt(1 - (offset / (extent / 2)) ** 2)
                    : 1;
              const along =
                depth / 2 + (((outward ? 1 : -1) * depth) / 2) * contour;
              return {
                id: portId(edge.id, endpoint),
                width: 0,
                height: 0,
                x: horizontal ? along : across,
                y: horizontal ? across : along,
                layoutOptions: {
                  "elk.port.borderOffset": String((-depth / 2) * (1 - contour)),
                  "elk.port.side": side,
                },
              };
            });
          },
        );
        return {
          id: n.id,
          width,
          height,
          ...(["fork", "join"].includes(n.kind)
            ? {
                labels: [
                  { text: n.title, width: n.title.length * 17, height: 24 },
                ],
              }
            : {}),
          layoutOptions: {
            "elk.portConstraints": "FIXED_POS",
            "elk.nodeLabels.placement": "OUTSIDE V_BOTTOM H_CENTER",
          },
          ports,
        };
      });
  const graph: ElkNode = {
    id: "$root",
    layoutOptions: {
      ...spacing(),
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.randomSeed": "17",
      "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
    },
    children: children(),
    edges: projection.edges.map((e) => ({
      id: e.id,
      sources: [JSON.stringify(["port", e.id, "from"])],
      targets: [JSON.stringify(["port", e.id, "to"])],
      ...(e.label ? { labels: [labelBox(e.label)] } : {}),
    })),
  };
  // A first ELK pass supplies relative positions; a second pass routes four-sided ports.
  // This is a geometric adapter policy, not workflow-specific coordinates or hand-drawn routes.
  const preliminary = await elk.layout(structuredClone(graph));
  const centers = new Map<string, { x: number; y: number }>();
  const collect = (parent: ElkNode, ox = 0, oy = 0) => {
    for (const n of parent.children || []) {
      const x = ox + (n.x || 0),
        y = oy + (n.y || 0);
      centers.set(n.id, { x: x + n.width! / 2, y: y + n.height! / 2 });
      collect(n, x, y);
    }
  };
  collect(preliminary);
  for (const e of projection.edges) {
    const from = centers.get(e.from)!,
      to = centers.get(e.to)!;
    const forward = direction === "RIGHT" ? to.x - from.x : to.y - from.y;
    const transverse = direction === "RIGHT" ? to.y - from.y : to.x - from.x;
    if (forward <= 0) {
      const side: Side =
        direction === "RIGHT"
          ? transverse < 0
            ? "NORTH"
            : "SOUTH"
          : transverse < 0
            ? "WEST"
            : "EAST";
      sides.set(portId(e.id, "from"), side);
      sides.set(portId(e.id, "to"), side);
    } else if (Math.abs(transverse) > forward * 0.5) {
      sides.set(
        portId(e.id, "from"),
        direction === "RIGHT"
          ? transverse < 0
            ? "NORTH"
            : "SOUTH"
          : transverse < 0
            ? "WEST"
            : "EAST",
      );
      sides.set(
        portId(e.id, "to"),
        direction === "RIGHT"
          ? transverse < 0
            ? "SOUTH"
            : "NORTH"
          : transverse < 0
            ? "EAST"
            : "WEST",
      );
    }
  }
  const result = await elk.layout({ ...graph, children: children() });
  const nodes: MapLayout["nodes"] = [],
    edges: MapLayout["edges"] = [];
  const offsets = new Map<string, { x: number; y: number }>([
      ["$root", { x: 0, y: 0 }],
    ]),
    pending: { edge: ElkExtendedEdge; ox: number; oy: number }[] = [];
  const visit = (parent: ElkNode, ox: number, oy: number) => {
    for (const edge of parent.edges || []) pending.push({ edge, ox, oy });
    for (const n of parent.children || []) {
      const x = ox + (n.x || 0),
        y = oy + (n.y || 0);
      offsets.set(n.id, { x, y });
      nodes.push({
        id: n.id,
        x,
        y,
        width: n.width!,
        height: n.height!,
        expanded: !!n.children?.length,
      });
      visit(n, x, y);
    }
  };
  visit(result, 0, 0);
  for (const item of pending) {
    const e = item.edge;
    if (!e.sections?.length) throw Error("缺少连线布局：" + e.id);
    const container = (e as ElkExtendedEdge & { container?: string }).container;
    const offset = container
      ? offsets.get(container)
      : { x: item.ox, y: item.oy };
    if (!offset) throw Error("连线容器不存在：" + e.id);
    const { x: ox, y: oy } = offset;
    const paths = e.sections.map((s) =>
      [s.startPoint, ...(s.bendPoints || []), s.endPoint]
        .map((p, i) => (i ? "L" : "M") + (p.x + ox) + " " + (p.y + oy))
        .join(" "),
    );
    const label = e.labels?.[0];
    edges.push({
      id: e.id,
      path: paths.join(" "),
      ...(label
        ? {
            label: {
              x: (label.x || 0) + ox,
              y: (label.y || 0) + oy,
              text: label.text || "",
              width: label.width || 0,
              height: label.height || 0,
            },
          }
        : {}),
    });
  }
  if (nodes.some((n) => ![n.x, n.y, n.width, n.height].every(Number.isFinite)))
    throw Error("布局返回了无效几何");
  return { width: result.width!, height: result.height!, nodes, edges };
}
