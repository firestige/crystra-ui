import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TaskDeliveryPanel } from "./task-delivery-panel";
it("renders owner-supplied readiness without treating delivery as task closure", () => {
  const open = vi.fn();
  render(
    <TaskDeliveryPanel
      data={{
        readiness: {
          title: "暂不可交付",
          description: "等待证据",
          coverage: "2 / 4",
          tone: "warning",
        },
        recalculation: "新增目标后重新计算",
        artifacts: [
          {
            id: "artifact-1",
            name: "candidate.tgz",
            detail: "等待验证",
            status: "未确认",
          },
        ],
        acceptance: [{ id: "a", label: "签名检查", status: "待验证" }],
        risk: "兼容性未知",
        economics: [{ label: "耗时", value: "31 分钟" }],
      }}
      onOpenArtifact={open}
    />,
  );
  expect(screen.getByText("暂不可交付")).toBeVisible();
  expect(screen.queryByText("任务已完成")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "candidate.tgz" }));
  expect(open).toHaveBeenCalledWith("artifact-1");
});
