import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TaskDetailPage,
  WorkflowStudioPage,
  TaskBrowserPage,
  WorkflowExplorerPage,
  AnalysisAuditPage,
} from "./pages";
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
describe("host-neutral pages", () => {
  it.each([TaskDetailPage, WorkflowStudioPage])(
    "renders host chat and bench slots without inventing task state",
    (Page) => {
      render(
        <Page
          title="Provided title"
          chat={<textarea aria-label="Host composer" />}
          bench={<div>Provided bench</div>}
        />,
      );
      expect(screen.getByRole("heading").textContent).toBe("Provided title");
      expect(
        screen.getByRole("textbox", { name: "Host composer" }),
      ).toBeTruthy();
      expect(screen.getByText("Provided bench")).toBeTruthy();
      expect(screen.queryByText("等待审核")).toBeNull();
    },
  );
  it.each([TaskBrowserPage, WorkflowExplorerPage, AnalysisAuditPage])(
    "renders a full main surface with no implicit chat",
    (Page) => {
      render(<Page title="Directory" bench={<div>Content slot</div>} />);
      expect(screen.getByText("Content slot")).toBeTruthy();
      expect(screen.queryByRole("textbox")).toBeNull();
    },
  );
});
