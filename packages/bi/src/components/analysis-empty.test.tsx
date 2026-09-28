import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AnalysisSurface } from "./analysis-observation-study";
import { AnalysisDataProvider } from "./analysis-data";
it("shows unavailable data explicitly and does not expose an unusable layout editor", () => {
  const data = { unavailableReason: "分析数据适配尚未接入" };
  render(
    <AnalysisDataProvider value={data}>
      <AnalysisSurface view="dashboard" onViewChange={() => {}} />
    </AnalysisDataProvider>,
  );
  expect(screen.getByText("分析数据适配尚未接入")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "编辑布局" }),
  ).not.toBeInTheDocument();
});
