import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { GateWorkbench } from "./gate";
import { DeliveryWorkbench } from "./delivery";
it("does not claim no pending gate when data is unavailable", () => {
  render(<GateWorkbench />);
  expect(screen.getByText("审核信息尚不可用")).toBeVisible();
  expect(screen.queryByText("没有待裁决内容")).not.toBeInTheDocument();
});
it("does not preserve readiness when a projection is invalidated", () => {
  render(
    <DeliveryWorkbench
      data={{
        revision: "r2",
        status: "当前可交付",
        tone: "success",
        invalidated: true,
        artifacts: [],
        acceptance: [],
        risks: [],
        economics: [],
      }}
    />,
  );
  expect(screen.getByText("目标已变化 · 待重新计算")).toBeVisible();
  expect(screen.queryByText("当前可交付")).not.toBeInTheDocument();
});
it("shows a confirmed empty queue without completion claims", () => {
  render(
    <GateWorkbench data={{ revision: "r1", items: [] }} selectedId={null} />,
  );
  expect(screen.getByText("没有待裁决内容")).toBeVisible();
});
it("switches the complete Gate context and returns from an exact resource", async () => {
  const { gatePreview } =
    await import("../../../previews/review-delivery-fixture");
  const { rerender } = render(
    <GateWorkbench data={gatePreview} selectedId="gate-publish" />,
  );
  await userEvent.click(screen.getByRole("button", { name: "验证结果" }));
  expect(screen.getByRole("heading", { name: "验证结果" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "返回" }));
  rerender(<GateWorkbench data={gatePreview} selectedId="gate-budget" />);
  expect(screen.getByText("暂无可核验的相关已确认决定")).toBeVisible();
  expect(
    screen.queryByText(
      "仅授权当前候选 sha-example-082 的这一次发布，不包含后续版本自动发布。",
    ),
  ).not.toBeInTheDocument();
});
