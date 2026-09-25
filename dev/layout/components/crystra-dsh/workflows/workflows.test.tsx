import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  createWorkflowsResource,
  createWorkflowsStore,
} from "./workflows-resource";
import { WorkflowsProvider } from "./workflows-provider";
import { useWorkflows } from "./use-workflows";
import { WorkflowStudio } from "./workflow-views";
import { createWorkflowsApi } from "./workflows-api";
const workflow = {
  definitionId: "stable-id",
  title: "Local workflow",
  version: "1.0.0",
  revision: "local:sha256:" + "a".repeat(64),
  packageName: "pkg",
  packageVersion: "1.0.0",
  packageStatus: "DRAFT",
  directory: "/bound/workflow",
};
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function Consumer() {
  const { items } = useWorkflows();
  return <span>{items[0]?.title}</span>;
}
it("shares one local catalogue read between consumers and does not resolve an obsolete Studio revision to latest", async () => {
  const read = vi.fn().mockResolvedValue([workflow]);
  const resource = createWorkflowsResource(
    { read },
    createWorkflowsStore().create(),
  );
  render(
    <WorkflowsProvider resource={resource}>
      <Consumer />
      <Consumer />
      <WorkflowStudio
        definitionId={workflow.definitionId}
        revision="old"
        chat={null}
        bench={null}
      />
    </WorkflowsProvider>,
  );
  await waitFor(() =>
    expect(screen.getAllByText("Local workflow")).toHaveLength(2),
  );
  expect(read).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/版本已变化/)).toBeInTheDocument();
  resource.dispose();
});
it("uses only local Workflow RPC and retains exact identity/version/content revision", async () => {
  const call = vi.fn().mockResolvedValue({
    ok: true,
    value: {
      schemaVersion: "crystra.local-workflows@1.0.0",
      revision: "catalogue",
      items: [workflow],
    },
  });
  expect(
    await createWorkflowsApi({ call }).read(new AbortController().signal),
  ).toEqual([workflow]);
  expect(call.mock.calls[0].slice(0, 3)).toEqual([
    "/crystra-workflows",
    "list",
    {},
  ]);
});
