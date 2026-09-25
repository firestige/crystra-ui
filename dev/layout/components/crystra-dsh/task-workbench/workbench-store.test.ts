import { expect, it } from "vitest";
import { createWorkbenchStore } from "./workbench-store";
it("restores independent workbench choices by exact task id within the host instance", () => {
  const store = createWorkbenchStore().create();
  store.actions.select("task-a", "gate");
  store.actions.select("task-b", "delivery");
  expect(store.getSnapshot().surfaces["task:task-a"]).toBe("gate");
  expect(store.getSnapshot().surfaces["task:task-b"]).toBe("delivery");
  expect(createWorkbenchStore().create().getSnapshot().surfaces).toEqual({});
});
