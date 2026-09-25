import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import example from "../../../../../../wsr-contracts/docs/proposals/plan-json-ir/example.json";
import { PlanDraftView } from "./plan-draft-view";
afterEach(cleanup);
it("resets document selection on revision replacement and fails closed on unsupported format", async () => {
  const { rerender } = render(<PlanDraftView draft={example} />);
  await userEvent.click(screen.getByRole("button", { name: "查看完整计划" }));
  await userEvent.click(
    screen.getByRole("button", { name: "上线前先过这几关" }),
  );
  rerender(
    <PlanDraftView
      draft={{ ...example, identity: { ...example.identity, revision: "r5" } }}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "计划 r5 · 定义草案" }),
  ).toBeVisible();
  rerender(<PlanDraftView draft={{ ...example, format: "future" }} />);
  expect(screen.getByRole("heading", { name: "计划暂不可展示" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "查看完整 DAG" }),
  ).not.toBeInTheDocument();
});
