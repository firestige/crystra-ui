import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it } from "vitest";
import { TaskPlanPanel } from "./task-plan-panel";
it("opens the exact supplied plan document and DAG without turning readiness into authorization", () => {
  render(
    <TaskPlanPanel
      data={{
        identity: "plan@4",
        status: "等待审核",
        question: "路径是否可信？",
        goal: "生成候选",
        completion: "5 已定义",
        nonGoals: "公开发布",
        readiness: [],
        attention: [],
        changes: [],
      }}
      summaryGraph={<span>概览图</span>}
      renderDocument={() => <p>来源 abc123</p>}
      renderDag={() => <p>完整版本 4 图</p>}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "查看完整计划" }));
  expect(screen.getByText("来源 abc123")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "返回计划摘要" }));
  fireEvent.click(screen.getByRole("button", { name: "查看完整 DAG" }));
  expect(screen.getByText("完整版本 4 图")).toBeVisible();
  expect(screen.queryByRole("button", { name: "授权" })).toBeNull();
});
