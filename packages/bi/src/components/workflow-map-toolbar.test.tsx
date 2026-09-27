import { render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { WorkflowMapToolbar } from "./workflow-map-toolbar";
it("only renders supplied status and uses shared command groups", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  const props = {
    container: document.createElement("div"),
    scale: 1,
    pathMode: "expected" as const,
    direction: "RIGHT" as const,
    canFocus: false,
    issueCount: 2,
    onZoom: vi.fn(),
    onFocus: vi.fn(),
    onFit: vi.fn(),
    onExpand: vi.fn(),
    onCollapse: vi.fn(),
    onPath: vi.fn(),
    onDirection: vi.fn(),
    onIssues: vi.fn(),
  };
  const { container, rerender } = render(<WorkflowMapToolbar {...props} />);
  expect(container.textContent).not.toContain("草稿");
  expect(
    container.querySelector('[data-tooltip="草稿 · 2 项待检查"]'),
  ).toBeNull();
  expect(container.querySelectorAll(".crystra-button-group").length).toBe(3);
  rerender(<WorkflowMapToolbar {...props} status={{ label: "已验证" }} />);
  expect(screen.getByText("已验证")).toBeTruthy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
