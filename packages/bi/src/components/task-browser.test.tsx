import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TaskBrowser } from "./task-browser";
it("selection does not open tasks, survives view switching, and clears when a query changes", () => {
  const open = vi.fn(),
    archive = vi.fn();
  render(
    <TaskBrowser
      tasks={[
        { id: "first", title: "Same" },
        { id: "second", title: "Same" },
      ]}
      onOpen={open}
      onNewTask={() => {}}
      onArchive={archive}
    />,
  );
  fireEvent.click(
    screen.getAllByRole("checkbox", { name: "选择任务：Same" })[0],
  );
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "任务视图：Gallery，切换到 List" }),
  );
  expect(
    screen.getAllByRole("checkbox", { name: "选择任务：Same" })[0],
  ).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "归档所选" }));
  expect(archive).toHaveBeenCalledWith(["first"]);
  fireEvent.change(screen.getByRole("searchbox", { name: "搜索任务" }), {
    target: { value: "second" },
  });
  expect(
    screen.getByRole("checkbox", { name: "选择任务：Same" }),
  ).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "打开任务：Same" }));
  expect(open).toHaveBeenCalledWith("second");
});
it("missing metadata remains unknown and archive is unavailable without an adapter", () => {
  render(
    <TaskBrowser
      tasks={[{ id: "one", title: "One" }]}
      onOpen={() => {}}
      onNewTask={() => {}}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "任务视图：Gallery，切换到 List" }),
  );
  expect(screen.getByText("关注项未知")).toBeVisible();
  expect(screen.getByText("进度未知")).toBeVisible();
  expect(screen.getByRole("button", { name: "归档所选" })).toBeDisabled();
});
