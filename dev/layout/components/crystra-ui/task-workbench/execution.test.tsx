import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ExecutionWorkbench } from "./execution";
import { executionFrame } from "../../../previews/execution-simulation";
it("keeps unavailable owner data explicit", () => {
  render(<ExecutionWorkbench />);
  expect(screen.getByText("执行投影尚不可用")).toBeVisible();
});
it("keeps Wave selection on Plan Run even when the fixture contains a Delivery", async () => {
  render(<ExecutionWorkbench data={executionFrame(18, "normal")} />);
  await userEvent.click(screen.getByRole("button", { name: "批次 1B" }));
  expect(screen.getByRole("heading", { name: "计划执行总览" })).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Action 调用顺序" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Delivery 活动图" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "查看 Wave Run" }),
  ).not.toBeInTheDocument();
});
it("preserves stale Plan Run status", () => {
  const data = executionFrame(18, "normal");
  render(
    <ExecutionWorkbench
      data={{ ...data, monitor: { revision: 19, status: "stale" } }}
    />,
  );
  expect(screen.getByText(/连接中断/)).toBeVisible();
  expect(screen.getByRole("heading", { name: "计划执行总览" })).toBeVisible();
});
