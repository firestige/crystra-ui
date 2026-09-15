import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TaskExecutionPanel } from "./task-execution-panel";
it("opens only known Wave runs and carries exact identity into Analysis", () => {
  const analysis = vi.fn();
  const identity = {
    planRun: "p@4/r8",
    wave: "w1b",
    workflow: "build@3",
    workflowRun: "r8",
    traceRoot: "t42",
  };
  render(
    <TaskExecutionPanel
      data={{
        title: "计划执行总览",
        summary: "运行 8",
        metrics: [],
        frontier: "Wave 1B",
        waves: [
          {
            id: "w1b",
            title: "构建",
            status: "运行中",
            identity,
            progress: "68%",
            output: "candidate",
            boundary: "Gate",
          },
        ],
      }}
      renderPlanGraph={(select) => (
        <>
          <button onClick={() => select("missing")}>未知 Wave</button>
          <button onClick={() => select("w1b")}>Wave 1B</button>
        </>
      )}
      renderWaveGraph={() => <span>已发生路径</span>}
      onAnalysis={analysis}
    />,
  );
  fireEvent.click(screen.getByText("未知 Wave"));
  expect(screen.getByText("计划执行总览")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Wave 1B" }));
  expect(screen.getByText("已发生路径")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "在分析中查看" }));
  expect(analysis).toHaveBeenCalledWith(identity);
  fireEvent.click(screen.getByRole("button", { name: "返回计划执行" }));
  expect(screen.getByText("计划执行总览")).toBeVisible();
});
