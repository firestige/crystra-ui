import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { PlanGraph } from "./plan-graph";
import { PlanMarkdown } from "./plan-markdown";
afterEach(cleanup);
it("shows all predecessors and gate requirements on selection", async () => {
  render(
    <PlanGraph
      data={{
        nodes: [
          { id: "a", title: "测试", kind: "工作单元", rank: 0, details: [] },
          { id: "b", title: "扫描", kind: "工作单元", rank: 0, details: [] },
          {
            id: "g",
            title: "发布确认",
            kind: "门禁",
            rank: 1,
            details: ["门禁标签：gate-publish"],
          },
        ],
        edges: [
          { id: "e1", from: "a", to: "g", label: "测试通过" },
          { id: "e2", from: "b", to: "g", label: "扫描通过" },
        ],
      }}
    />,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "门禁：发布确认" }),
  );
  expect(
    document.querySelector("[data-layout-engine=workflow-map]"),
  ).not.toBeNull();
  expect(document.querySelector(".map-node-shape")).not.toBeNull();
  expect(screen.getByText("门禁标签：gate-publish")).toBeVisible();
  expect(screen.getByText("测试：测试通过")).toBeVisible();
  expect(screen.getByText("扫描：扫描通过")).toBeVisible();
});
it("renders Markdown semantics without executing HTML or unsafe links", () => {
  const { container } = render(
    <PlanMarkdown
      source={
        "**加粗**\n\n- 条目\n\n[危险](javascript:alert(1))\n\n<script>alert(1)</script>"
      }
    />,
  );
  expect(container.querySelector("strong")).toHaveTextContent("加粗");
  expect(screen.getByRole("listitem")).toHaveTextContent("条目");
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("a")).toBeNull();
});
