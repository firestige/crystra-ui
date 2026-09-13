import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MonitoringWidget } from "./monitoring-widget";
it("rejects oversized single-value widgets and omits unused modules", () => {
  expect(() =>
    render(
      <MonitoringWidget
        category="value"
        size="3x3"
        title="耗时"
        primary="42 ms"
      />,
    ),
  ).toThrow(/Unsupported/);
  render(
    <MonitoringWidget
      category="value"
      size="1x1"
      title="耗时"
      primary="42 ms"
    />,
  );
  expect(screen.getByText("42 ms")).toBeVisible();
  expect(document.querySelector(".widget footer")).toBeNull();
});
