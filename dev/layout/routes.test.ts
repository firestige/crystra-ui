import { describe, expect, it } from "vitest";
import { resolveRoute } from "./routes";

describe("layout routes", () => {
  it("separates five pages and the new-task state", () => {
    expect(resolveRoute("/tasks").page).toBe("tasks");
    expect(resolveRoute("/tasks/task-a")).toMatchObject({
      page: "task",
      taskId: "task-a",
    });
    expect(resolveRoute("/tasks/new").page).toBe("new-task");
    expect(resolveRoute("/workflows").page).toBe("workflows");
    expect(
      resolveRoute("/workflows/build?revision=v3&from_task_id=task-a"),
    ).toMatchObject({
      page: "workflow",
      definitionId: "build",
      revision: "v3",
      fromTaskId: "task-a",
    });
    expect(resolveRoute("/analysis?view=traces")).toMatchObject({
      page: "analysis",
      view: "traces",
    });
  });
  it("does not substitute a fixture for unknown routes or missing revisions", () => {
    expect(resolveRoute("/unknown").page).toBe("not-found");
    expect(resolveRoute("/tasks/a/extra").page).toBe("not-found");
    expect(resolveRoute("/workflows/build")).toMatchObject({
      page: "workflow",
      revision: null,
    });
    expect(resolveRoute("/tasks/%E0%A4%A").page).toBe("not-found");
  });
  it("keeps the default task preview and validates analysis views", () => {
    expect(resolveRoute("/")).toMatchObject({
      page: "task",
      taskId: "task-market-release",
    });
    expect(resolveRoute("/analysis?view=bogus").page).toBe("not-found");
  });
});
