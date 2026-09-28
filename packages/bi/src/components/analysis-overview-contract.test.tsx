import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AnalysisDataProvider } from "./analysis-data";
import { AnalysisSurface } from "./analysis-observation-study";

it("preserves the system overview and layout controls without data or Task selection", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(
    <AnalysisDataProvider value={{}}>
      <AnalysisSurface
        view="dashboard"
        onViewChange={() => {}}
        onLayoutChange={() => {}}
        sourceContext={{ task_id: "task-source" }}
      />
    </AnalysisDataProvider>,
  );
  expect(screen.getByRole("button", { name: "选择日期范围" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "资源消耗" })).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Workflow 运行质量" }),
  ).toBeTruthy();
  expect(screen.queryByRole("combobox", { name: "Evidence Task" })).toBeNull();
  expect(screen.getByText("按量实际费用")).toBeTruthy();
  expect(screen.getByText("Role × Model · 返工发生率")).toBeTruthy();
  expect(screen.getAllByText("时间范围数据尚未接入").length).toBeGreaterThan(3);
  fireEvent.click(screen.getByRole("button", { name: "编辑布局" }));
  expect(screen.getByRole("button", { name: "取消编辑" })).toBeTruthy();
});

it("keeps the global date range across tabs and supports restored URL periods", () => {
  const onPeriodChange = vi.fn();
  const props = {
    view: "dashboard" as const,
    onViewChange: () => {},
    onPeriodChange,
  };
  const wrap = (view: "dashboard" | "reports", initialPeriod = "7d") => (
    <AnalysisDataProvider value={{ referenceDate: "2026-09-28" }}>
      <AnalysisSurface {...props} view={view} period={initialPeriod} />
    </AnalysisDataProvider>
  );
  const { rerender } = render(wrap("dashboard"));
  fireEvent.click(screen.getByRole("button", { name: "选择日期范围" }));
  fireEvent.click(screen.getByRole("button", { name: "最近 30 天" }));
  expect(onPeriodChange).toHaveBeenCalledWith("30d");
  rerender(wrap("dashboard", "30d"));
  const range = screen
    .getByRole("button", { name: "选择日期范围" })
    .getAttribute("title");
  rerender(wrap("reports", "30d"));
  expect(
    screen.getByRole("button", { name: "选择日期范围" }).getAttribute("title"),
  ).toBe(range);
  rerender(wrap("dashboard", "7d"));
  expect(
    screen.getByRole("button", { name: "选择日期范围" }).getAttribute("title"),
  ).not.toBe(range);
  expect(screen.queryByRole("combobox", { name: "观察范围" })).toBeNull();
});
