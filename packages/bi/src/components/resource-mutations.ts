import { resourceCatalog, type CatalogResource } from "./resource-catalog";
export type ResourceWorkspace = {
  title: string;
  root: string;
  version: string;
  files: {
    path: string;
    content: string;
    internal: boolean;
    truncated: boolean;
    displayName?: string;
  }[];
  nodes: {
    id: string;
    label: string;
    kind: string;
    file?: string;
    detail?: string;
  }[];
  edges: { from: string; to: string; label: string }[];
};
export type ResourceMutation = {
  kind: "add" | "rename" | "delete";
  group: string;
  resourceKind?: string;
  resource?: CatalogResource;
};
export type ResourceEvent = {
  id: string;
  workspace: string;
  resourceId: string;
  operation: string;
  path: string;
  name: string;
  previousName?: string;
  affectedRefs: string[];
  status: "pending-runtime";
};
export function resourceDependents(
  workspace: ResourceWorkspace,
  resource: CatalogResource,
) {
  const ids = new Set([
    ...resource.aliases,
    ...resource.files.map((f) => "file:" + f.path),
  ]);
  if (resource.refs)
    return {
      ids,
      refs: resource.refs.map((ref) => ({ ...ref, to: resource.id })),
    };
  for (const n of workspace.nodes)
    if (
      n.kind === "resource" &&
      workspace.edges.some((e) => e.from === n.id && ids.has(e.to))
    )
      ids.add(n.id);
  const refs = workspace.edges.filter((e) => ids.has(e.to) && !ids.has(e.from));
  for (const file of workspace.files) {
    if (ids.has("file:" + file.path) || !file.path.endsWith(".md")) continue;
    for (const match of file.content.matchAll(/\]\(([^\s)#]+)(?:#[^)]*)?\)/g)) {
      try {
        const url = new URL(match[1], "https://workspace/" + file.path),
          to = "file:" + decodeURIComponent(url.pathname.slice(1));
        if (
          url.host === "workspace" &&
          ids.has(to) &&
          !refs.some((e) => e.from === "file:" + file.path && e.to === to)
        )
          refs.push({ from: "file:" + file.path, to, label: "文档链接" });
      } catch {
        /* Unresolvable links are handled by validation. */
      }
    }
  }
  return { ids, refs };
}
