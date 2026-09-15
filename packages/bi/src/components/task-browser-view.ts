import type { TaskBrowserQuery } from "./task-browser-model";
export interface TaskBrowserView {
  version: 1;
  query: string;
  filter: TaskBrowserQuery["filter"];
  sort: TaskBrowserQuery["sort"];
  view: "gallery" | "list";
  grouping: "workspace" | "status" | "none";
  page: number;
  pageSize: 12 | 24 | 48;
  anchorId?: string;
}
const defaults: TaskBrowserView = {
  version: 1,
  query: "",
  filter: "all",
  sort: "activity",
  view: "gallery",
  grouping: "workspace",
  page: 1,
  pageSize: 12,
};
export function restoreTaskBrowserView(encoded?: string): TaskBrowserView {
  try {
    if (!encoded || encoded.length > 2048) return { ...defaults };
    const value = JSON.parse(encoded);
    if (
      !value ||
      typeof value !== "object" ||
      value.version !== 1 ||
      typeof value.query !== "string" ||
      value.query.length > 256 ||
      !["all", "active", "attention"].includes(value.filter) ||
      !["activity", "created", "cost"].includes(value.sort) ||
      !["gallery", "list"].includes(value.view) ||
      !["workspace", "status", "none"].includes(value.grouping) ||
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
