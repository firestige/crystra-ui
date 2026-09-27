import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkflowResourceActions } from "../../../../wsr-dsh/src/client/workflows/use-workflow-resource-actions";
import type { WorkflowResourceWorkspace } from "crystra-ui-core";
const workspace: WorkflowResourceWorkspace = {
  root: "/test",
  title: "test",
  version: "1",
  files: [
    { path: "role.md", content: "old", truncated: false, internal: false },
  ],
  nodes: [],
  edges: [],
};
describe("workflow component ownership", () => {
  it.each([
    "workflow-map-workbench",
    "workflow-resource-browser",
    "workflow-crystallization",
  ])("%s has no preview data, storage, or host DOM discovery", (name) => {
    const source = readFileSync(
      `packages/bi/src/components/${name}.tsx`,
      "utf8",
    );
    expect(source).not.toMatch(
      /localStorage|window\.|document\.querySelector|crystraResourceWorkspaces|import .* from .*domain\/.*\.json/,
    );
  });
  it("host waits for persistence before replacing the resource snapshot", async () => {
    let finish!: (value: WorkflowResourceWorkspace) => void;
    const write = vi.fn(
      () =>
        new Promise<WorkflowResourceWorkspace>((resolve) => {
          finish = resolve;
        }),
    );
    const onSnapshot = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowResourceActions(
        workspace,
        { save: write, mutate: vi.fn() },
        onSnapshot,
      ),
    );
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.save("role.md", "old", "new");
    });
    expect(onSnapshot).not.toHaveBeenCalled();
    expect(workspace.files[0].content).toBe("old");
    const next = {
      ...workspace,
      files: [{ ...workspace.files[0], content: "new" }],
    };
    await act(async () => {
      finish(next);
      await pending;
    });
    expect(onSnapshot).toHaveBeenCalledWith(next);
  });
  it("host propagates save rejection without replacing the snapshot", async () => {
    const onSnapshot = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowResourceActions(
        workspace,
        { save: () => Promise.reject(new Error("conflict")), mutate: vi.fn() },
        onSnapshot,
      ),
    );
    await expect(result.current.save("role.md", "old", "new")).rejects.toThrow(
      "conflict",
    );
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
