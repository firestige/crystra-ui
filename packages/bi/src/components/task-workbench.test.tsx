import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { TaskWorkbench, type TaskWorkbenchPage } from "./task-workbench";
it("changes only the read surface while retaining the same host input and independent system focus", () => {
  const change = vi.fn();
  function Scenario() {
    const [page, setPage] = useState<TaskWorkbenchPage>("gate");
    return (
      <TaskWorkbench
        title="Task A"
        workspace="/work/a"
        page={page}
        onPageChange={(next) => {
          change(next);
          setPage(next);
        }}
        systemFocus="execution"
        input={<textarea aria-label="Host draft" defaultValue="unfinished" />}
        panels={{
          grilling: <p>Brief projection</p>,
          plan: <p>Plan projection</p>,
          execution: <p>Run projection</p>,
          gate: <p>Gate projection</p>,
          delivery: <p>Readiness projection</p>,
        }}
      />
    );
  }
  render(<Scenario />);
  const input = screen.getByRole("textbox", { name: "Host draft" });
  fireEvent.change(input, { target: { value: "preserved draft" } });
  fireEvent.click(screen.getByRole("tab", { name: "计划", exact: true }));
  expect(change).toHaveBeenCalledWith("plan");
  expect(screen.getByText("Plan projection")).toBeVisible();
  expect(screen.getByText("Gate projection")).not.toBeVisible();
  expect(screen.getByRole("textbox", { name: "Host draft" })).toBe(input);
  expect(input).toHaveValue("preserved draft");
  expect(screen.getByLabelText("系统当前工作面：执行")).toBeVisible();
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
});
