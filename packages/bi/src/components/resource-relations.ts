import { resourceCatalog, type CatalogFile } from "./resource-catalog";
export type Node = {
  id: string;
  label: string;
  kind: string;
  file?: string;
  typeLabel?: string;
};
export type Edge = {
  from: string;
  to: string;
  label: string;
  kind?: "call" | "reference";
};
export type Source = { nodes: Node[]; edges: Edge[]; files?: CatalogFile[] };
export const kinds: Record<string, string> = {
  activity: "活动",
  role: "职责",
  file: "资源文件",
  artifact: "产出",
  external: "外部资源",
};
export function projectRelations(
  source: Source,
  root: string,
  expanded: string[] = [],
) {
  const catalog = resourceCatalog(
    source.files || [],
    source.nodes,
    source.edges,
  );
  const aliases = new Map<string, string>(),
    visible = new Map<string, Node>();
  for (const resource of catalog) {
    for (const alias of resource.aliases) aliases.set(alias, resource.id);
    visible.set(resource.id, {
      id: resource.id,
      label: resource.name,
      kind: resource.group === "角色（Role）" ? "role" : "file",
      file: resource.path,
      typeLabel: resource.group.replace(/（.*）/, ""),
    });
  }
  for (const node of source.nodes) {
    if (aliases.has(node.id) || !kinds[node.kind]) continue;
    if (
      node.kind === "file" &&
      (source.files?.find((f) => f.path === node.file)?.internal ||
        node.file?.startsWith("definition/"))
    )
      continue;
    visible.set(node.id, node);
    aliases.set(node.id, node.id);
  }
  const projected: Edge[] = [];
  for (const node of visible.values()) {
    const visit = (id: string, trail: Edge[], seen: Set<string>) => {
      for (const edge of source.edges.filter((e) => e.from === id)) {
        if (seen.has(edge.to)) continue;
        const next = [...trail, edge],
          target = aliases.get(edge.to);
        if (target && target !== node.id && visible.has(target)) {
          const call =
            node.kind === "activity" &&
            visible.get(target)?.kind === "role" &&
            next.some((e) => e.label === "可用执行配置");
          projected.push({
            from: node.id,
            to: target,
            kind: call ? "call" : "reference",
            label: call
              ? "调用（配置允许）"
              : next
                  .map((e) => e.label)
                  .filter(
                    (l) => !["活动定义", "资源定义", "职责指令"].includes(l),
                  )
                  .join(" · ") || "引用",
          });
        } else visit(edge.to, next, new Set([...seen, edge.to]));
      }
    };
    for (const [alias, id] of aliases)
      if (id === node.id) visit(alias, [], new Set([alias]));
  }
  const rootId = aliases.get(root) || root;
  const edges = projected.filter(
    (e, i, a) =>
      a.findIndex(
        (x) => x.from === e.from && x.to === e.to && x.label === e.label,
      ) === i,
  );
  const ids = new Set([rootId, ...expanded]);
  let frontier = [...ids];
  for (let depth = 0; depth < 2; depth++) {
    const next: string[] = [];
    for (const id of frontier)
      for (const e of edges) {
        const other = e.from === id ? e.to : e.to === id ? e.from : null;
        if (other && !ids.has(other)) {
          ids.add(other);
          next.push(other);
        }
      }
    frontier = next;
  }
  return {
    rootId,
    nodes: [...visible.values()].filter((n) => ids.has(n.id)),
    edges: edges.filter((e) => ids.has(e.from) && ids.has(e.to)),
  };
}
