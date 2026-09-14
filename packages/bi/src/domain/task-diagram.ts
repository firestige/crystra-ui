export interface TaskDiagramNode {
  tag: string;
  props: Record<string, string>;
  children: (TaskDiagramNode | string)[];
}
const tags = new Set([
  "svg",
  "g",
  "path",
  "text",
  "tspan",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "pattern",
]);
const attributes = new Set([
  "id",
  "width",
  "height",
  "viewBox",
  "fill",
  "stroke",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeWidth",
  "strokeDasharray",
  "strokeDashoffset",
  "d",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "rx",
  "ry",
  "cx",
  "cy",
  "r",
  "points",
  "transform",
  "patternUnits",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "textAnchor",
  "dominantBaseline",
  "opacity",
  "aria-label",
  "aria-hidden",
  "data-iconify",
  "data-icon-role",
  "data-icon-kind",
  "data-color-scope",
  "data-section-id",
  "data-scale",
  "data-pan-x",
  "data-pan-y",
  "data-dag-node",
  "data-node-label",
  "data-type",
  "data-dag-ordinary-branch",
]);
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
/** Closed inert SVG vocabulary; never accepts scripts, HTML, event attributes or remote references. */
export function isTaskDiagram(value: unknown): value is TaskDiagramNode {
  if (
    !object(value) ||
    value.tag !== "svg" ||
    !object(value.props) ||
    typeof value.props.viewBox !== "string"
  )
    return false;
  const box = value.props.viewBox.trim().split(/[ ,]+/).map(Number);
  if (
    box.length !== 4 ||
    !box.every((n) => Number.isFinite(n) && Math.abs(n) <= 100000) ||
    box[2] <= 0 ||
    box[3] <= 0
  )
    return false;
  const stack: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  const ids = new Set<string>();
  let count = 0,
    characters = 0;
  while (stack.length) {
    const item = stack.pop()!;
    if (++count > 5000 || item.depth > 32) return false;
    const node: unknown = item.value;
    if (typeof node === "string") {
      if (node.length > 10000 || (characters += node.length) > 1000000)
        return false;
      continue;
    }
    if (
      !object(node) ||
      typeof node.tag !== "string" ||
      !tags.has(node.tag) ||
      !object(node.props) ||
      !Array.isArray(node.children)
    )
      return false;
    for (const [key, v] of Object.entries(node.props)) {
      if (
        !attributes.has(key) ||
        typeof v !== "string" ||
        v.length > (key === "d" ? 50000 : 4096) ||
        (characters += v.length) > 1000000
      )
        return false;
      if (
        (key === "fill" || key === "stroke") &&
        !/^(?:none|currentColor|transparent|#[0-9a-fA-F]{3,8}|[a-zA-Z]+|url\(#[A-Za-z][\w.-]*\))$/.test(
          v,
        )
      )
        return false;
      if (key === "id") {
        if (!/^[A-Za-z][\w.-]*$/.test(v) || ids.has(v)) return false;
        ids.add(v);
      }
    }
    if (stack.length + node.children.length > 5000) return false;
    for (const child of node.children)
      stack.push({ value: child, depth: item.depth + 1 });
  }
  return true;
}
