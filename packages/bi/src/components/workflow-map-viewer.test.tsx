import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WorkflowMapViewer } from "./workflow-map-viewer";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const ir: WorkflowMapIR = {
  version: "0.2",
  title: "Exact definition",
  nodes: [
    { id: "s", kind: "start", title: "Start" },
    { id: "e", kind: "end", title: "Done", outcome: "completed" },
  ],
  edges: [
    {
      id: "edge",
      from: "s",
      to: "e",
      kind: "control",
      intent: "expected",
      layoutRole: "advance",
    },
  ],
};
it("does not replace host conversation content or intercept native Input in viewer mode", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  const layout = vi
    .fn()
    .mockResolvedValue({ width: 300, height: 200, nodes: [], edges: [] });
  const identity = vi.fn();
  render(
    <>
      <div data-section-id="conversation-feed">Native conversation</div>
      <section data-host-owned="dsh-input">
        <textarea aria-label="Native input" defaultValue="unsent" />
      </section>
      <WorkflowMapViewer
        initialIR={ir}
        resolveLayout={layout}
        mode="studio"
        onIdentity={identity}
      />
    </>,
  );
  await waitFor(() => expect(layout).toHaveBeenCalled());
  await screen.findByRole("group", { name: "工作流活动图" });
  expect(screen.getByText("Native conversation")).toBeInTheDocument();
  const input = screen.getByRole("textbox", { name: "Native input" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("unsent");
  expect(screen.queryByText("Agent 交互演示")).not.toBeInTheDocument();
  expect(identity).toHaveBeenCalledWith("Exact definition", "");
});
