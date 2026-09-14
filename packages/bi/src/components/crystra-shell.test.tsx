import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CrystraShell } from "../public";

it("routes v8 navigation with exact identities and leaves host actions to callbacks", () => {
  const navigate = vi.fn(),
    host = vi.fn(),
    create = vi.fn();
  render(
    <CrystraShell
      route="tasks"
      onNavigate={navigate}
      onOpenHarness={host}
      onNewTask={create}
      tasks={[
        { id: "task-1", title: "Same name" },
        { id: "task-2", title: "Same name" },
      ]}
      workflows={[]}
      onOpenSettings={() => undefined}
    >
      <p>Page content</p>
    </CrystraShell>,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Same name" })[1]);
  expect(navigate).toHaveBeenLastCalledWith("task", "task-2", undefined);
  fireEvent.click(screen.getByRole("button", { name: "全部工作流" }));
  expect(navigate).toHaveBeenLastCalledWith("workflows");
  fireEvent.click(screen.getByRole("button", { name: "调用追踪" }));
  expect(navigate).toHaveBeenLastCalledWith("analysis-traces");
  fireEvent.click(screen.getByRole("button", { name: "新建任务" }));
  expect(create).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole("button", { name: "切换到 DeepSeek Harness" }),
  );
  expect(host).toHaveBeenCalledOnce();
  expect(screen.getByText("Page content")).toBeVisible();
});

it("opens the accepted expandable search, filters tasks, and clears on Escape", () => {
  render(
    <CrystraShell
      route="tasks"
      tasks={[
        { id: "one", title: "First task" },
        { id: "two", title: "Second task" },
      ]}
      workflows={[]}
      onNavigate={() => undefined}
      onOpenHarness={() => undefined}
      onNewTask={() => undefined}
      onOpenSettings={() => undefined}
    >
      <p>Content</p>
    </CrystraShell>,
  );
  fireEvent.click(screen.getByRole("button", { name: "搜索任务" }));
  const search = screen.getByRole("searchbox", { name: "搜索任务" });
  fireEvent.change(search, { target: { value: "Second" } });
  expect(
    screen.queryByRole("button", { name: "First task" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Second task" })).toBeVisible();
  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.getByRole("button", { name: "First task" })).toBeVisible();
  expect(screen.getByRole("button", { name: "搜索任务" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
