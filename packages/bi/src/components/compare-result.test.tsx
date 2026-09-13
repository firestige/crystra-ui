import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type {
  DeltaEntry,
  MetricSlice,
  SideError,
} from "../domain/evolution/types";
import { CompareResultFrame } from "./compare-result";

const slice = (value: string): MetricSlice => ({
  slice_key: {},
  state: "AVAILABLE",
  value: { kind: "COUNT", value, unit: "deliveries" },
  measures: {},
  numerator: value,
  denominator: "10",
  contributing_count: "10",
  coverage: {
    numerator: "10",
    denominator: "10",
    raw_ratio: "1",
    state: "FULL",
    alert: null,
  },
  compatibility: {},
  exclusions: [],
  missing_inputs: [],
  provenance_refs: [],
});

describe("Before Delta After", () => {
  it("keeps Before and After symmetric and renders Evolution Delta last", () => {
    const delta: DeltaEntry = {
      metric_coordinate: "delivery-terminal-outcome-rate@2.0.0",
      slice_key: {},
      state: "AVAILABLE",
      value: { kind: "COUNT", value: "9007199254740993", unit: "deliveries" },
      direction: "INCREASE",
    };
    const { container } = render(
      <CompareResultFrame
        after={slice("9")}
        before={slice("2")}
        coordinate={delta.metric_coordinate}
        delta={delta}
      />,
    );

    const text = container.textContent!;
    expect(text.indexOf("Before")).toBeLessThan(text.indexOf("After"));
    expect(text.indexOf("After")).toBeLessThan(text.indexOf("Delta"));
    expect(screen.getByText("Increase")).toBeVisible();
    expect(screen.getByText("9,007,199,254,740,993 deliveries")).toBeVisible();
  });

  it("keeps the successful side and scopes retry to the failed side", async () => {
    const retry = vi.fn();
    const failure: SideError = {
      tag: "SIDE_ERROR",
      code: "UPSTREAM_UNAVAILABLE",
      retryable: true,
      detail: "Evidence is temporarily unavailable",
    };
    render(
      <CompareResultFrame
        afterError={failure}
        before={slice("2")}
        coordinate="delivery-terminal-outcome-rate@2.0.0"
        delta={{
          metric_coordinate: "delivery-terminal-outcome-rate@2.0.0",
          slice_key: {},
          state: "SIDE_UNRESOLVED",
        }}
        onRetryFailedSide={retry}
      />,
    );

    expect(
      within(
        screen.getByRole("region", { name: "Before result" }),
      ).getAllByText("2")[0],
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("After unavailable");
    expect(
      screen.getByText("Delta unavailable until both sides resolve"),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

it("represents one comparison with one widget and side-specific actions", async () => {
  const evidence = vi.fn();
  const { container } = render(
    <CompareResultFrame
      monitoring
      coordinate="example@2.0.0"
      before={slice("2")}
      after={slice("9")}
      delta={{
        metric_coordinate: "example@2.0.0",
        slice_key: {},
        state: "AVAILABLE",
        direction: "INCREASE",
        value: { kind: "COUNT", value: "7", unit: "deliveries" },
      }}
      onEvidence={evidence}
    />,
  );
  expect(container.querySelectorAll(".crystra-monitoring-widget")).toHaveLength(
    1,
  );
  expect(
    container.querySelector('[data-category="comparison"]'),
  ).toHaveAttribute("data-size", "1x3");
  await userEvent.click(screen.getByRole("button", { name: "查看对照证据" }));
  expect(evidence.mock.calls[0]?.[0]).toBe("right");
});

it.each([
  ["INCREASE", "上涨"],
  ["DECREASE", "下跌"],
  ["NO_CHANGE", "持平"],
] as const)(
  "shows a direction marker for %s without declaring performance",
  (direction, label) => {
    const { container } = render(
      <CompareResultFrame
        monitoring
        coordinate="example@2.0.0"
        before={slice("2")}
        after={slice("9")}
        delta={{
          metric_coordinate: "example@2.0.0",
          slice_key: {},
          state: "AVAILABLE",
          direction,
          value: {
            kind: "COUNT",
            value:
              direction === "DECREASE"
                ? "-7"
                : direction === "NO_CHANGE"
                  ? "0"
                  : "7",
            unit: "deliveries",
          },
        }}
      />,
    );
    expect(screen.getByRole("img", { name: label })).toBeVisible();
    expect(container.querySelector(".comparison-direction")).toHaveAttribute(
      "data-direction",
      direction,
    );
  },
);
