import type { WorkflowExplorerQuery } from "./workflow-explorer-model";
export interface WorkflowExplorerView {
  version: 1;
  query: string;
  filter: WorkflowExplorerQuery["filter"];
  sort: WorkflowExplorerQuery["sort"];
  versions: "latest" | "all";
  view: "gallery" | "list";
  grouping: "status" | "none";
  page: number;
  pageSize: 12 | 24 | 48;
  anchorId?: string;
}
const defaults: WorkflowExplorerView = {
  version: 1,
  query: "",
  filter: "all",
  sort: "updated",
  versions: "latest",
  view: "gallery",
  grouping: "none",
  page: 1,
  pageSize: 12,
};
export function restoreWorkflowExplorerView(
  encoded?: string,
): WorkflowExplorerView {
  try {
    if (!encoded || encoded.length > 2048) return { ...defaults };
    const value = JSON.parse(encoded);
    if (
      !value ||
      typeof value !== "object" ||
      value.version !== 1 ||
      typeof value.query !== "string" ||
      value.query.length > 256 ||
      !["all", "confirmed", "draft"].includes(value.filter) ||
      !["updated", "created", "name"].includes(value.sort) ||
      !["latest", "all"].includes(value.versions) ||
      !["gallery", "list"].includes(value.view) ||
      !["status", "none"].includes(value.grouping) ||
      !Number.isInteger(value.page) ||
      value.page < 1 ||
      value.page > 1000000 ||
      ![12, 24, 48].includes(value.pageSize) ||
      (value.anchorId !== undefined &&
        (typeof value.anchorId !== "string" ||
          !value.anchorId ||
          value.anchorId.length > 512))
    )
      return { ...defaults };
    return {
      version: 1,
      query: value.query,
      filter: value.filter,
      sort: value.sort,
      versions: value.versions,
      view: value.view,
      grouping: value.grouping,
      page: value.page,
      pageSize: value.pageSize,
      ...(value.anchorId ? { anchorId: value.anchorId } : {}),
    };
  } catch {
    return { ...defaults };
  }
}
