import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { TaskBrowserSurface } from "./task-browser";
it("shares selection across views, navigates exact identities and resets selection on search", async () => {
  const user = userEvent.setup(),
    nav = vi.fn();
  render(
    <TaskBrowserSurface
      items={[
        { id: "task-a", title: "Alpha", lastActivityAt: 2 },
        { id: "task-b", title: "Beta", lastActivityAt: 1 },
      ]}
      taskHref={(id) => "/tasks/" + id}
      onNewTask={nav}
    />,
  );
  await user.click(screen.getByRole("checkbox", { name: "选择 Alpha" }));
  expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute(
    "href",
    "/tasks/task-a",
  );
  await user.click(screen.getByRole("button", { name: /Gallery.*List/ }));
  expect(screen.getByRole("checkbox", { name: "选择 Alpha" })).toBeChecked();
  expect(
    within(screen.getByRole("table")).getAllByText("进度未知"),
  ).toHaveLength(2);
  expect(screen.getByRole("button", { name: "归档所选" })).toBeDisabled();
  await user.type(screen.getByRole("searchbox", { name: "搜索任务" }), "Beta");
  expect(screen.queryByRole("checkbox", { name: "选择 Alpha" })).toBeNull();
  expect(screen.getByRole("checkbox", { name: "选择 Beta" })).not.toBeChecked();
  await user.click(screen.getByRole("button", { name: "新建任务" }));
  expect(nav).toHaveBeenCalledOnce();
});
it("exposes isolated item menus in both views and returns focus on Escape", async () => {
  const user = userEvent.setup();
  const archive = vi.fn();
  render(
    <TaskBrowserSurface
      items={[{ id: "menu-a", title: "Menu task", lastActivityAt: 1 }]}
      taskHref={(id) => "/tasks/" + id}
      onNewTask={() => {}}
      onArchive={archive}
    />,
  );
  const trigger = screen.getByRole("button", { name: "任务操作：Menu task" });
  await user.click(trigger);
  expect(
    screen.getByRole("menu", { name: "任务操作：Menu task" }),
  ).toBeVisible();
  expect(screen.getByRole("menuitem", { name: "改名" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(
    screen.getByRole("checkbox", { name: "选择 Menu task" }),
  ).not.toBeChecked();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("menu")).toBeNull();
  await user.click(screen.getByRole("button", { name: /Gallery.*List/ }));
  await user.click(screen.getByRole("button", { name: "任务操作：Menu task" }));
  await user.click(screen.getByRole("menuitem", { name: "归档" }));
  expect(archive).toHaveBeenCalledWith(["menu-a"]);
  expect(screen.queryByRole("menu")).toBeNull();
});
it("keeps task progress accessible in the shared gallery card", () => {
  render(
    <TaskBrowserSurface
      items={[
        {
          id: "progress",
          title: "Progress",
          lastActivityAt: 1,
          progress: { completed: 1, total: 3, scope: "waves" },
        },
      ]}
      taskHref={(id) => `/tasks/${id}`}
      onNewTask={() => {}}
    />,
  );
  expect(
    screen.getByRole("progressbar", { name: "Progress · waves" }),
  ).toHaveAttribute("aria-valuenow", "1");
});
it("does not use duplicate task titles as menu identity", async () => {
  const user = userEvent.setup();
  render(
    <TaskBrowserSurface
      items={[
        { id: "a", title: "Same", lastActivityAt: 2 },
        { id: "b", title: "Same", lastActivityAt: 1 },
      ]}
      taskHref={(id) => `/tasks/${id}`}
      onNewTask={() => {}}
    />,
  );
  const triggers = screen.getAllByRole("button", { name: "任务操作：Same" });
  await user.click(triggers[0]);
  expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
});
