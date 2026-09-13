import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { familyViews, type WidgetData } from "../domain/widget-families";
import { SemanticWidget } from "./semantic-widget";
describe("semantic widget content identity", () => {
  it("retains the independently supplied state when activity details change", () => {
    const data: WidgetData = {
      family: "activity",
      title: "当前运行",
      state: "已暂停",
      headline: "审查依赖变更",
    };
    const { rerender } = render(
      <SemanticWidget data={data} view="status" size="1x2" />,
    );
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByText("审查依赖变更")).toBeInTheDocument();
    rerender(
      <SemanticWidget
        data={{ family: "activity", title: "当前运行", state: "已暂停" }}
        view="status"
        size="1x2"
      />,
    );
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.queryByText("审查依赖变更")).not.toBeInTheDocument();
    expect(screen.queryByText("验证构建产物")).not.toBeInTheDocument();
  });
  it("does not offer a radar polygon that would turn missing dimensions into zero", () => {
    const views = familyViews({
      family: "profile",
      title: "两方案",
      unit: "分",
      ordered: false,
      domain: [0, 100],
      dimensions: ["质量", "速度"],
      rows: [
        { name: "A", values: [90, null] },
        { name: "B", values: [80, 70] },
      ],
    });
    expect(views.map((v) => v.id)).not.toContain("radar");
    expect(views.map((v) => v.id)).toContain("value-table");
    expect(views.map((v) => v.id)).toContain("heatmap");
  });
});
