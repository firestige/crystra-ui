import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AnalysisWorkspace } from "./analysis-workspace";
const data = {
  tasks: [],
  samples: [],
  roles: [],
  workflows: [],
  deliveries: [],
  searchFields: [],
  sources: () => ({}),
  queries: () => ({
    metrics: [],
    providers: [],
    models: [],
    resolve: () => {
      throw new Error("No metric source");
    },
  }),
  trace: () => null,
};
it("renders accepted controls without inheriting URL identity or inventing sample results", () => {
  history.replaceState(null, "", "?task_id=unrelated&view=reports");
  const navigate = vi.fn();
  render(
    <AnalysisWorkspace
      page="dashboard"
      onPageChange={navigate}
      data={data}
      initialPeriod="7d"
      referenceDate="2026-09-09"
      renderComparison={() => <p>Comparison port</p>}
    />,
  );
  expect(screen.getByRole("heading", { name: "观测与分析" })).toBeVisible();
  expect(screen.getByRole("button", { name: "选择日期范围" })).toBeVisible();
  expect(screen.getByRole("button", { name: "编辑布局" })).toBeVisible();
  expect(screen.queryByText("112.04")).not.toBeInTheDocument();
  expect(screen.queryByText("unrelated")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "调用追踪" }));
  expect(navigate).toHaveBeenCalledWith("traces");
  expect(location.search).toBe("?task_id=unrelated&view=reports");
});
it("keeps directory and comparison as explicit ports in the original page composition", () => {
  render(
    <AnalysisWorkspace
      page="traces"
      onPageChange={() => {}}
      data={data}
      initialPeriod="7d"
      referenceDate="2026-09-09"
      renderComparison={() => <p>Comparison port</p>}
    />,
  );
  expect(screen.getByRole("button", { name: "展开调用目录" })).toBeVisible();
  expect(screen.getByRole("button", { name: "瀑布图" })).toBeVisible();
  expect(screen.getByRole("button", { name: "树图" })).toBeVisible();
});
it("anchors relative dates to the explicit host date instead of the design fixture date", () => {
  render(
    <AnalysisWorkspace
      page="traces"
      onPageChange={() => {}}
      data={data}
      initialPeriod="7d"
      referenceDate="2026-09-14"
      renderComparison={() => null}
    />,
  );
  expect(screen.getByRole("button", { name: "选择日期范围" })).toHaveAttribute(
    "title",
    expect.stringContaining("2026-09-08"),
  );
});
