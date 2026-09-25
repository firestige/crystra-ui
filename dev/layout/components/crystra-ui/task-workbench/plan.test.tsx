import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { PlanWorkbench } from "./plan";
afterEach(cleanup);
it("keeps document navigation on the supplied revision and separates the readiness facts", async () => {
  render(
    <PlanWorkbench
      data={{
        revision: "v4",
        status: "候选",
        readiness: {
          control: {
            status: "就绪",
            tone: "success",
            items: [{ label: "预算", value: "30" }],
          },
        },
        document: [
          { id: "goals", title: "目标", content: "候选目标" },
          { id: "scope", title: "边界", content: "需要人工授权" },
        ],
      }}
    />,
  );
  expect(screen.getByText("证明准备度尚不可用")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "查看完整 DAG" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "查看完整计划" }));
  expect(
    screen.getByRole("heading", { name: "完整计划 · v4" }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "边界" }));
  expect(screen.getByText("需要人工授权")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "返回计划摘要" }));
  expect(screen.getByRole("heading", { name: "计划 v4 · 候选" })).toBeVisible();
});
it("does not enable exact-version reads or invent readiness without data", () => {
  render(<PlanWorkbench />);
  expect(screen.getByRole("button", { name: "查看完整计划" })).toBeDisabled();
  expect(screen.getByText("计划版本尚不可用")).toBeInTheDocument();
});
