import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";
import { defaultSidebarPreferences, type SidebarProps } from "./model";

afterEach(cleanup);
const data = {
  tasks: [
    {
      id: "a",
      title: "Alpha",
      href: "/tasks/a",
      status: "review" as const,
      attention: 2,
      active: true,
      createdAt: 2,
      lastActivityAt: 1,
    },
    {
      id: "b",
      title: "Beta",
      href: "/tasks/b",
      status: "complete" as const,
      active: false,
      createdAt: 1,
      lastActivityAt: 3,
    },
  ],
  workflows: [
    {
      id: "w-v7",
      title: "Custom workflow",
      revision: "v7",
      href: "/workflows/w?revision=v7&from_task_id=a",
    },
  ],
  analysis: [
    {
      id: "overview",
      title: "Overview",
      href: "/analysis?view=dashboard",
      icon: "table" as const,
    },
  ],
};
function Harness(props: Partial<SidebarProps>) {
  const [preferences, onPreferencesChange] = useState(
    defaultSidebarPreferences,
  );
  return (
    <Sidebar
      {...data}
      preferences={preferences}
      onPreferencesChange={onPreferencesChange}
      allTasksHref="/tasks"
      allWorkflowsHref="/workflows"
      onNewTask={() => {}}
      {...props}
    />
  );
}

describe("data-driven Sidebar", () => {
  it("renders only supplied items, reacts to changes and has explicit empty states", () => {
    const view = render(<Harness />);
    expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute(
      "href",
      "/tasks/a",
    );
    expect(screen.queryByText("发布插件市场方案")).toBeNull();
    view.rerender(<Harness tasks={[]} workflows={[]} analysis={[]} />);
    expect(screen.queryByRole("link", { name: /Alpha/ })).toBeNull();
    expect(screen.getByText("暂无任务")).toBeTruthy();
    expect(screen.getByText("暂无工作流")).toBeTruthy();
  });
  it("dispatches exact workflow href and controlled selection", async () => {
    const onNavigate = vi.fn();
    render(
      <Harness
        onNavigate={onNavigate}
        workflows={[{ ...data.workflows[0], selected: true }]}
      />,
    );
    const link = screen.getByRole("link", { name: /Custom workflow/ });
    expect(link).toHaveAttribute("aria-current", "page");
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith(data.workflows[0].href);
  });
  it("keeps sections independent and searches in the header while preserving view preferences", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "任务" }));
    expect(screen.queryByRole("link", { name: /Alpha/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Custom workflow/ })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "搜索任务" }));
    await userEvent.type(
      screen.getByRole("searchbox", { name: "搜索任务" }),
      "Alpha",
    );
    expect(screen.queryByRole("link", { name: /Beta/ })).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("link", { name: /Beta/ })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "任务视图" }));
    await userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "仅显示活跃任务" }),
    );
    expect(screen.queryByRole("link", { name: /Beta/ })).toBeNull();
  });
  it("collapses without switching host and reuses directory DOM; Escape restores rail focus", async () => {
    const onOpenHarness = vi.fn();
    render(<Harness onOpenHarness={onOpenHarness} />);
    const original = screen.getByRole("link", { name: /Alpha/ });
    await userEvent.click(screen.getByRole("button", { name: "收起侧边栏" }));
    const rail = screen.getByRole("navigation", { name: "快捷导航" });
    const trigger = within(rail).getByRole("button", {
      name: "任务",
    });
    await userEvent.click(trigger);
    expect(screen.getByRole("link", { name: /Alpha/ })).toBe(original);
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "展开侧边栏" }));
    expect(onOpenHarness).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Alpha/ })).toBe(original);
  });
  it("keeps exact workflow href when filtering and hiding version labels", async () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "工作流视图" }));
    await userEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "显示版本标签" }),
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("v7")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "搜索工作流" }));
    await userEvent.type(
      screen.getByRole("searchbox", { name: "搜索工作流" }),
      "Custom",
    );
    await userEvent.click(
      screen.getByRole("link", { name: "Custom workflow" }),
    );
    expect(onNavigate).toHaveBeenCalledWith(data.workflows[0].href);
  });
  it("closes inner search before closing the collapsed directory", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "收起侧边栏" }));
    const rail = screen.getByRole("navigation", { name: "快捷导航" });
    await userEvent.click(within(rail).getByRole("button", { name: "任务" }));
    await userEvent.click(screen.getByRole("button", { name: "搜索任务" }));
    await userEvent.type(
      screen.getByRole("searchbox", { name: "搜索任务" }),
      "Alpha",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("link", { name: /Beta/ })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(within(rail).getByRole("button", { name: "任务" })).toHaveFocus();
  });
});
