import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { GrillingWorkbench } from "./grilling";
afterEach(cleanup);
it("keeps changes inside the live brief and provides read-only full viewing", async () => {
  render(
    <GrillingWorkbench
      data={{
        revision: "r1",
        topics: [
          {
            id: "authorization",
            title: "授权边界",
            status: "added",
            reason: "发布涉及外部凭据",
            source: "message-1",
          },
        ],
        fields: [
          { id: "goal", title: "目标", text: "完成验证", status: "confirmed" },
        ],
        changes: [
          { id: "c1", kind: "added", text: "必须授权", authority: "inferred" },
        ],
      }}
    />,
  );
  const brief = screen.getByRole("region", { name: "实时简报" });
  expect(within(brief).getByText("本轮变更")).toBeInTheDocument();
  expect(within(brief).getByText("AI 推测")).toBeInTheDocument();
  expect(screen.getByText(/message-1/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "展开问题地图" }));
  expect(
    screen.getByRole("button", { name: "返回问题地图" }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "返回问题地图" }));
  expect(screen.getByRole("button", { name: "展开问题地图" })).toHaveFocus();
  expect(
    screen.queryByRole("button", { name: "批准" }),
  ).not.toBeInTheDocument();
});
it("does not fabricate progress or confirmed intent without a projection", () => {
  render(<GrillingWorkbench />);
  expect(screen.getByText("问题覆盖信息尚不可用")).toBeInTheDocument();
  expect(screen.queryByText("已确认")).not.toBeInTheDocument();
  expect(screen.queryByText(/第 0 轮/)).not.toBeInTheDocument();
});
