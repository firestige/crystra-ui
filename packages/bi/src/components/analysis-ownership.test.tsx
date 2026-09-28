import { render, screen } from "@testing-library/react";
import { expect, it, vi, afterEach } from "vitest";
import { AnalysisDataProvider } from "./analysis-data";
import { AnalysisSurface } from "./analysis-observation-study";
import { ResultAnalysisSurface } from "./result-analysis-preview";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
afterEach(() => vi.unstubAllGlobals());
it("accepts an empty page snapshot without fabricated service callbacks", () => {
  render(
    <AnalysisDataProvider value={{}}>
      <AnalysisSurface view="dashboard" onViewChange={() => {}} />
    </AnalysisDataProvider>,
  );
  expect(screen.getByRole("tab", { name: "总览" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "立即刷新" })).toBeDisabled();
});
it("renders current host configuration when it changes", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const setting = { id: "s1", name: "宿主设置", charts: [] };
  const renderSurface = (name: string) => (
    <AnalysisDataProvider value={{}}>
      <ResultAnalysisSurface
        timeRange={["2026-01-01", "2027-01-01"]}
        settings={[{ ...setting, name }]}
        onSettingsChange={vi.fn()}
      />
    </AnalysisDataProvider>
  );
  const { rerender } = render(renderSurface("宿主设置"));
  expect(
    screen.getByRole("button", { name: "编辑设置 宿主设置" }),
  ).toBeInTheDocument();
  rerender(renderSurface("外部修改"));
  expect(
    screen.getByRole("button", { name: "编辑设置 外部修改" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "编辑设置 宿主设置" }),
  ).not.toBeInTheDocument();
});
it("does not schedule data refresh within display controls", () => {
  const source = readFileSync(
    resolve(import.meta.dirname, "observation-time-controls.tsx"),
    "utf8",
  );
  expect(source).not.toMatch(/setInterval|setTimeout/);
});

it("does not infer query failure from the presence of a source identity", () => {
  render(
    <AnalysisDataProvider value={{}}>
      <AnalysisSurface
        view="traces"
        sourceContext={{ task_id: "task-1" }}
        onViewChange={() => {}}
      />
    </AnalysisDataProvider>,
  );
  expect(screen.queryByText("当前来源尚未解析")).not.toBeInTheDocument();
});
