import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { CrystraShell } from "../public";
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
});
const defaults = {
  route: "tasks" as const,
  tasks: [],
  workflows: [],
  onNavigate: vi.fn(),
  onOpenHarness: vi.fn(),
  onNewTask: vi.fn(),
  onOpenSettings: vi.fn(),
};
it("uses accepted v8 search and view nodes without unmounting their header", async () => {
  const { container } = render(
    <CrystraShell {...defaults}>Content</CrystraShell>,
  );
  const view = container.querySelector<HTMLElement>(
    '[data-section-id="task-view-options-action"]',
  )!;
  const all = container.querySelector('[data-section-id="all-tasks-action"]')!;
  expect(all.querySelector("svg")).toHaveAttribute(
    "data-iconify",
    "tabler:player-play-filled",
  );
  fireEvent.click(screen.getByRole("button", { name: "搜索任务" }));
  expect(
    all.closest('[data-section-id="task-section-actions"]'),
  ).toHaveAttribute("hidden");
  fireEvent.keyDown(screen.getByRole("searchbox", { name: "搜索任务" }), {
    key: "Escape",
  });
  await waitFor(() =>
    expect(
      all.closest('[data-section-id="task-section-actions"]'),
    ).not.toHaveAttribute("hidden"),
  );
  fireEvent.click(view);
  expect(
    container.querySelector('[data-section-id="task-view-options-menu"]'),
  ).not.toHaveAttribute("hidden");
  expect(
    container.querySelector('[data-section-id="task-view-options-action"]'),
  ).toBe(view);
});
it("substitutes exact host identities without leaking mock row facts", () => {
  const navigate = vi.fn(),
    host = vi.fn(),
    create = vi.fn();
  const { container } = render(
    <CrystraShell
      {...defaults}
      tasks={[
        { id: "one", title: "Same name" },
        { id: "two", title: "Same name" },
      ]}
      workflows={[{ id: "wf", title: "Real workflow", revision: "r12" }]}
      onNavigate={navigate}
      onOpenHarness={host}
      onNewTask={create}
    >
      Page content
    </CrystraShell>,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Same name" })[1]);
  expect(navigate).toHaveBeenLastCalledWith("task", "two", undefined);
  fireEvent.click(container.querySelector('[data-object-id="wf"]')!);
  expect(navigate).toHaveBeenLastCalledWith("workflow", "wf", "r12");
  expect(screen.getByText("Real workflow")).toBeVisible();
  expect(container.textContent).not.toContain("发布插件市场方案");
  fireEvent.click(screen.getByRole("link", { name: "全部工作流" }));
  expect(navigate).toHaveBeenLastCalledWith("workflows");
  fireEvent.click(screen.getByRole("link", { name: "调用追踪" }));
  expect(navigate).toHaveBeenLastCalledWith("analysis-traces");
  fireEvent.click(screen.getByRole("button", { name: "新建任务" }));
  expect(create).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole("button", { name: "切换到 DeepSeek Harness" }),
  );
  expect(host).toHaveBeenCalledOnce();
});
it("filters through the accepted search bridge and clears with Escape", async () => {
  render(
    <CrystraShell
      {...defaults}
      tasks={[
        { id: "one", title: "First task" },
        { id: "two", title: "Second task" },
      ]}
    >
      Content
    </CrystraShell>,
  );
  fireEvent.click(screen.getByRole("button", { name: "搜索任务" }));
  const input = screen.getByRole("searchbox", { name: "搜索任务" });
  fireEvent.change(input, { target: { value: "Second" } });
  expect(
    screen.queryByRole("button", { name: "First task" }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Escape" });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "搜索任务" })).toHaveAttribute(
      "aria-expanded",
      "false",
    ),
  );
  expect(screen.getByRole("button", { name: "First task" })).toBeVisible();
});
it("preserves the native v8 nodes and child context through host rerenders", () => {
  const host = vi.fn();
  const props = { ...defaults, onOpenHarness: host };
  const { container, rerender } = render(
    <CrystraShell {...props}>
      <input aria-label="context" defaultValue="draft" />
    </CrystraShell>,
  );
  const sidebar = container.querySelector('[data-section-id="sidebar"]');
  const input = screen.getByRole("textbox");
  fireEvent.click(screen.getByRole("button", { name: "收起侧边栏" }));
  expect(
    container.querySelector('[data-product-surface="crystra"]'),
  ).toHaveAttribute("data-sidebar-collapsed", "true");
  rerender(
    <CrystraShell {...props} route="workflows">
      <input aria-label="context" defaultValue="draft" />
    </CrystraShell>,
  );
  expect(container.querySelector('[data-section-id="sidebar"]')).toBe(sidebar);
  expect(screen.getByRole("textbox")).toBe(input);
  fireEvent.click(
    container.querySelector('[data-section-id="surface-banner"]')!,
  );
  expect(host).not.toHaveBeenCalled();
  expect(
    container.querySelector('[data-product-surface="crystra"]'),
  ).toHaveAttribute("data-sidebar-collapsed", "false");
});
it("passes semantic configuration and token overrides to the v8 scope across rerenders", () => {
  const { container, rerender } = render(
    <CrystraShell
      {...defaults}
      data-icon-scale="prominent"
      data-typography="original"
      style={{ "--icon-tool-hit": "40px" }}
    >
      Content
    </CrystraShell>,
  );
  const root = container.querySelector<HTMLElement>(".crystra-v8-shell")!;
  expect(root).toHaveAttribute("data-icon-scale", "prominent");
  expect(root).toHaveAttribute("data-typography", "original");
  expect(root.style.getPropertyValue("--icon-tool-hit")).toBe("40px");
  rerender(
    <CrystraShell {...defaults} data-icon-scale="compact">
      Content
    </CrystraShell>,
  );
  expect(container.querySelector(".crystra-v8-shell")).toBe(root);
  expect(root).toHaveAttribute("data-icon-scale", "compact");
  expect(root.style.getPropertyValue("--icon-tool-hit")).toBe("");
});
