import { expect, it } from "vitest";
import { restoreTaskBrowserView } from "./task-browser-view";
it("restores bounded view preferences and exact return identity without semantic state", () => {
  const view = {
    version: 1,
    query: "签名",
    filter: "active",
    sort: "cost",
    view: "list",
    grouping: "workspace",
    page: 2,
    pageSize: 24,
    anchorId: "task-a",
  };
  expect(restoreTaskBrowserView(JSON.stringify(view))).toEqual(view);
  for (const patch of [
    { version: 2 },
    { page: -1 },
    { pageSize: 13 },
    { filter: "running" },
    { anchorId: "" },
  ])
    expect(
      restoreTaskBrowserView(JSON.stringify({ ...view, ...patch })).view,
    ).toBe("gallery");
  expect(restoreTaskBrowserView("broken").query).toBe("");
});
