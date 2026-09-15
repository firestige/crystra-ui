import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  CrystraAnalysisFrame,
  CrystraTraceContent,
  decodeEvidencePage,
} from "../public";
it("keeps distinct Analysis routes and requires no prototype data", () => {
  const navigate = vi.fn();
  render(
    <CrystraAnalysisFrame page="analysis-traces" onNavigate={navigate}>
      <p>Real content</p>
    </CrystraAnalysisFrame>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "对比分析" }));
  expect(navigate).toHaveBeenCalledWith("analysis-reports");
  expect(screen.getByText("Real content")).toBeVisible();
});
it("renders only Waterfall and Tree choices with explicit absent state", () => {
  const select = vi.fn();
  render(
    <CrystraTraceContent
      phase="absent"
      traceId={"a".repeat(32)}
      view="waterfall"
      onViewChange={select}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tree" }));
  expect(select).toHaveBeenCalledWith("tree");
  expect(screen.queryByText("Statistics")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("没有可用");
});
it("exports the existing formal Evidence decoder for host transports", () => {
  expect(decodeEvidencePage("traces", { items: [] }, 200).ok).toBe(false);
});
