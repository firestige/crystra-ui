import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TaskRequirementsPanel } from "./task-requirements-panel";
it("renders supplied requirement facts without introducing answers or authorization controls", () => {
  render(
    <TaskRequirementsPanel
      data={{
        heading: "需求澄清 · 第 2 轮",
        summary: "3 个待回答",
        remaining: "还剩 3 个主题",
        budget: "问题预算：5",
        topics: [
          { id: "scope", title: "范围", progress: "2/4", tone: "warning" },
        ],
        reason: "发布凭据需要明确授权",
        briefSummary: "当前理解",
        fields: [
          {
            id: "goal",
            title: "目标",
            status: "待确认",
            body: "验证候选包",
            tone: "warning",
          },
        ],
        changes: [{ id: "c1", kind: "added", text: "明确回滚范围" }],
      }}
    />,
  );
  expect(screen.getByText("2/4")).toBeVisible();
  expect(screen.getByText("待确认")).toBeVisible();
  expect(screen.getByText("明确回滚范围")).toBeVisible();
  expect(screen.queryByText("已确认")).toBeNull();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});
it("keeps empty supplied collections empty instead of filling design samples", () => {
  render(
    <TaskRequirementsPanel
      data={{
        heading: "需求澄清",
        summary: "暂无投影",
        topics: [],
        briefSummary: "等待数据",
        fields: [],
        changes: [],
      }}
    />,
  );
  expect(screen.getByText("等待数据")).toBeVisible();
  expect(screen.queryByText("发布凭据需要明确授权")).toBeNull();
});
