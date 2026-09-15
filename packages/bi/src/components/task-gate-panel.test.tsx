import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TaskGatePanel } from "./task-gate-panel";
it("selection and evidence navigation do not become approval actions", () => {
  const select = vi.fn(),
    inspect = vi.fn();
  render(
    <TaskGatePanel
      queue={[
        { id: "g1", question: "允许重试？", impact: "阻塞主路径" },
        { id: "g2", question: "允许发布？", impact: "最终关口" },
      ]}
      selectedId="g1"
      onSelect={select}
      onInspect={inspect}
      data={{
        id: "g1",
        question: "允许重试？",
        trigger: "验证失败",
        location: "Wave 1",
        status: "等待决定",
        impact: "阻塞主路径",
        decisions: ["保持 API"],
        interpretation: "仅重试一次",
        interpretationStatus: "等待明确确认",
        deltas: [{ mark: "+", text: "重试一次", tone: "blue" }],
        previewTitle: "确认后将执行",
        previewStatus: "尚未授权",
        steps: [["重试", "保留边界"]],
        preserved: "发布权限不变",
        evidence: [
          {
            id: "e1",
            title: "trace",
            detail: "失败追踪",
            action: "打开追踪",
            tone: "neutral",
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("尚未授权")).toBeVisible();
  fireEvent.click(screen.getByText("待决策 2"));
  fireEvent.click(screen.getByText("允许发布？"));
  expect(select).toHaveBeenCalledWith("g2");
  fireEvent.click(
    screen.getByRole("button", { name: "trace 失败追踪 打开追踪" }),
  );
  expect(inspect).toHaveBeenCalledWith("e1");
  expect(screen.queryByRole("button", { name: "批准" })).toBeNull();
});
