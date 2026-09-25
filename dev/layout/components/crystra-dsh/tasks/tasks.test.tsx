import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createTasksStore, createTasksResource } from "./tasks-resource";
import { useTasks } from "./use-tasks";
import { TasksProvider } from "./tasks-provider";
import { createExecutionTasksApi } from "./execution-tasks-api";
import type { Task } from "./types";
afterEach(cleanup);
const task: Task = {
  id: "task-1",
  title: "Execution task",
  createdAt: 1,
  lastActivityAt: 2,
  deliveryIds: ["delivery-1"],
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function Consumer({ name }: { name: string }) {
  const { items, phase } = useTasks();
  return (
    <div data-testid={name}>
      {phase}:{items.map((t) => t.title).join(",")}
    </div>
  );
}
describe("shared Execution tasks", () => {
  it("shares one request and snapshot between Sidebar and Browser consumers", async () => {
    const read = vi.fn().mockResolvedValue([task]);
    const resource = createTasksResource({ read }, createTasksStore().create());
    render(
      <TasksProvider resource={resource}>
        <Consumer name="sidebar" />
        <Consumer name="browser" />
      </TasksProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("sidebar").textContent).toBe(
        "ready:Execution task",
      ),
    );
    expect(screen.getByTestId("browser").textContent).toBe(
      "ready:Execution task",
    );
    expect(read).toHaveBeenCalledTimes(1);
    resource.dispose();
  });
  it("ignores stale responses, preserves items on failure, and retries explicitly", async () => {
    const old = deferred<Task[]>();
    const fresh = deferred<Task[]>();
    const read = vi
      .fn()
      .mockImplementationOnce(() => old.promise)
      .mockImplementationOnce(() => fresh.promise)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([]);
    const resource = createTasksResource({ read }, createTasksStore().create());
    const first = resource.actions.load();
    const second = resource.actions.refresh();
    fresh.resolve([task]);
    await second;
    old.resolve([{ ...task, title: "stale" }]);
    await first;
    expect(resource.getSnapshot().items[0].title).toBe("Execution task");
    await resource.actions.refresh();
    expect(resource.getSnapshot()).toMatchObject({
      phase: "error",
      error: "offline",
      items: [task],
    });
    await resource.actions.refresh();
    expect(resource.getSnapshot()).toMatchObject({ phase: "ready", items: [] });
    resource.dispose();
  });
  it("never publishes after its host owner disposes it", async () => {
    const pending = deferred<Task[]>();
    const resource = createTasksResource(
      { read: () => pending.promise },
      createTasksStore().create(),
    );
    const request = resource.actions.load();
    resource.dispose();
    const prior = resource.getSnapshot();
    pending.resolve([task]);
    await request;
    expect(resource.getSnapshot()).toBe(prior);
  });
  it("reads the Execution Task catalogue, including Tasks without Delivery records", async () => {
    const call = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        schemaVersion: "execution.tasks@1.0.0",
        revision: "r1",
        items: [
          task,
          {
            id: "empty",
            title: "No Delivery",
            createdAt: 1,
            lastActivityAt: 1,
            deliveryIds: [],
          },
        ],
      },
    });
    const result = await createExecutionTasksApi({ call }).read(
      new AbortController().signal,
    );
    expect(call.mock.calls[0].slice(0, 3)).toEqual([
      "/crystra-tasks",
      "list",
      {},
    ]);
    expect(result).toHaveLength(2);
    expect(result[1].deliveryIds).toEqual([]);
    expect(result[1].status).toBeUndefined();
  });
  it("refreshes shared state on owner invalidation and disposes the subscription", async () => {
    let invalidate = () => {};
    const stop = vi.fn();
    const read = vi
      .fn()
      .mockResolvedValueOnce([task])
      .mockResolvedValue([{ ...task, title: "changed" }]);
    const resource = createTasksResource(
      {
        read,
        subscribe(listener) {
          invalidate = listener;
          return stop;
        },
      },
      createTasksStore().create(),
    );
    await resource.actions.load();
    invalidate();
    await waitFor(() =>
      expect(resource.getSnapshot().items[0].title).toBe("changed"),
    );
    resource.dispose();
    expect(stop).toHaveBeenCalledOnce();
  });
  it("watches owner revisions and cancels the pending change read on disposal", async () => {
    const change = deferred<unknown>();
    let changeSignal: AbortSignal | undefined;
    const call = vi.fn(
      async (
        _channel: string,
        endpoint: string,
        _payload: Record<string, unknown>,
        signal?: AbortSignal,
      ) => {
        if (endpoint === "list")
          return {
            ok: true,
            value: {
              schemaVersion: "execution.tasks@1.0.0",
              revision: "r1",
              items: [task],
            },
          };
        changeSignal = signal;
        return change.promise;
      },
    );
    const api = createExecutionTasksApi({ call });
    await api.read(new AbortController().signal);
    const invalidate = vi.fn();
    const failure = vi.fn();
    const stop = api.subscribe!(invalidate, failure);
    expect(call.mock.calls[1].slice(0, 3)).toEqual([
      "/crystra-tasks",
      "changes",
      { after: "r1" },
    ]);
    stop();
    expect(changeSignal?.aborted).toBe(true);
    change.resolve({
      ok: true,
      value: {
        schemaVersion: "execution.tasks@1.0.0",
        revision: "r2",
        items: [],
      },
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(invalidate).not.toHaveBeenCalled();
    expect(failure).not.toHaveBeenCalled();
  });
  it("rejects incompatible or failed owner responses rather than returning an empty list", async () => {
    for (const answer of [
      { ok: false, error: { message: "unavailable" } },
      { ok: true, value: { items: [] } },
    ]) {
      await expect(
        createExecutionTasksApi({ call: async () => answer }).read(
          new AbortController().signal,
        ),
      ).rejects.toThrow();
    }
  });
});
