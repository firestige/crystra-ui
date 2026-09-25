import { createWorkbenchStore } from "./workbench-store";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SessionTaskWorkbench } from "../../../../../../wsr-dsh/src/client/task-workbench/session-workbench";

it("mounts the production five-surface workbench in its Header and rejects stale session binding", () => {
  const workbench = createWorkbenchStore().create();
  let snapshot = {
    kind: "ready",
    view: {
      kind: "BOUND",
      sessionCorrelation: "session-1",
      delivery: {
        navigation: { sessionCorrelation: "session-1" },
        task: { identity: "task-1", displayName: "真实任务" },
      },
    },
  };
  let changed = () => {};
  const source = {
    subscribe: (notify: () => void) => {
      changed = notify;
      return () => {};
    },
    getSnapshot: () => snapshot,
  };
  const { container, rerender } = render(
    <SessionTaskWorkbench
      sessionId="session-1"
      source={source}
      workbench={workbench}
    />,
  );
  expect(screen.getByText("真实任务")).toBeInTheDocument();
  expect(screen.getAllByRole("tab")).toHaveLength(5);
  for (const name of ["需求", "计划", "执行", "审核", "交付"])
    fireEvent.click(screen.getByRole("tab", { name }));
  expect(screen.getByText("可交付性尚不可用")).toBeInTheDocument();
  expect(
    container.querySelector("header")?.querySelector('[role="tablist"]'),
  ).not.toBeNull();
  rerender(
    <SessionTaskWorkbench
      sessionId="session-2"
      source={source}
      workbench={workbench}
    />,
  );
  expect(screen.queryByText("真实任务")).not.toBeInTheDocument();
  expect(
    screen.getByText("当前 Session 尚无可核验的 Task 绑定。"),
  ).toBeInTheDocument();
  act(() => {
    snapshot = {
      ...snapshot,
      view: { ...snapshot.view, sessionCorrelation: "session-2" },
    };
    changed();
  });
  expect(screen.queryByText("真实任务")).not.toBeInTheDocument();
});
