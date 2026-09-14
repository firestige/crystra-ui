import { expect, it } from "vitest";
import {
  queryBrowserTasks,
  taskProgress,
  type BrowserTaskRecord,
} from "./task-browser-model";
const task = (
  id: string,
  patch: Partial<BrowserTaskRecord> = {},
): BrowserTaskRecord => ({ id, title: id, ...patch });
it("unknown activity and attention are never promoted to active or zero", () => {
  const tasks = [
    task("unknown"),
    task("active", { active: true, attention: { count: 0, severity: null } }),
    task("attention", {
      active: false,
      attention: { count: 2, severity: "warning" },
    }),
  ];
  expect(
    queryBrowserTasks(tasks, {
      query: "",
      filter: "active",
      sort: "activity",
    }).map((t) => t.id),
  ).toEqual(["active"]);
  expect(
    queryBrowserTasks(tasks, {
      query: "",
      filter: "attention",
      sort: "activity",
    }).map((t) => t.id),
  ).toEqual(["attention"]);
  expect(tasks[0].attention).toBeUndefined();
});
it("sorts unknown costs last and searches title goal and workspace without workflow guessing", () => {
  const tasks = [
    task("missing"),
    task("cheap", { cost: 0, goal: "签名" }),
    task("expensive", {
      cost: 12,
      workspace: { name: "workspace", path: "/tmp/build" },
    }),
  ];
  expect(
    queryBrowserTasks(tasks, { query: "", filter: "all", sort: "cost" }).map(
      (t) => t.id,
    ),
  ).toEqual(["expensive", "cheap", "missing"]);
  expect(
    queryBrowserTasks(tasks, {
      query: "/tmp/build",
      filter: "all",
      sort: "activity",
    }).map((t) => t.id),
  ).toEqual(["expensive"]);
});
it("requires an explicit valid current execution scope before drawing progress", () => {
  expect(
    taskProgress(
      task("bad", {
        active: true,
        progress: { completed: 2, total: 0, scope: "run" },
      }),
    ),
  ).toBeNull();
  expect(
    taskProgress(
      task("unknown", { progress: { completed: 2, total: 5, scope: "run" } }),
    ),
  ).toBeNull();
  expect(
    taskProgress(
      task("valid", {
        active: true,
        progress: { completed: 2, total: 5, scope: "run" },
      }),
    ),
  ).toBe(40);
});
