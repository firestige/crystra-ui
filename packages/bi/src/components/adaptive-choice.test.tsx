import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AdaptiveChoice } from "./adaptive-choice";
afterEach(() => vi.unstubAllGlobals());
it("switches by container width and preserves the controlled selection across menu/segments", async () => {
  let resize: (entries: unknown[]) => void = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: typeof resize) {
        resize = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
  const onChange = vi.fn();
  const user = userEvent.setup();
  const props = {
    label: "筛选任务",
    compactIconOnly: true,
    functionIcon: <span data-testid="function-icon" />,
    value: "active",
    options: [
      { value: "all", label: "全部" },
      { value: "active", label: "活跃" },
      { value: "attention", label: "需要关注" },
    ],
    onChange,
  };
  const { rerender } = render(
    <div data-adaptive-container>
      <AdaptiveChoice {...props} />
    </div>,
  );
  expect(screen.getByRole("button", { name: "活跃" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  act(() => resize([{ contentRect: { width: 700 } }]));
  expect(screen.getByTestId("function-icon")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "筛选任务：活跃" }));
  expect(screen.getByRole("menuitemradio", { name: "活跃" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await user.click(screen.getByRole("menuitemradio", { name: "需要关注" }));
  expect(onChange).toHaveBeenCalledWith("attention");
  rerender(
    <div data-adaptive-container>
      <AdaptiveChoice {...props} value="attention" />
    </div>,
  );
  expect(screen.getByTestId("function-icon")).toBeVisible();
  act(() => resize([{ contentRect: { width: 1400 } }]));
  expect(screen.getByRole("button", { name: "需要关注" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.queryByRole("menu")).toBeNull();
});
