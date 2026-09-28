import { render, act, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DeliveryDirectory } from "./delivery-directory";
it("requests a cursor page when the scrolling sentinel is visible, including an empty loaded page", () => {
  let intersect: IntersectionObserverCallback = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const load = vi.fn();
  render(
    <DeliveryDirectory
      records={[]}
      range={["2026-09-01", "2026-10-01"]}
      selectedId={null}
      onSelectionChange={() => {}}
      searchFields={[]}
      paging={{ hasMore: true, loading: false, onLoadMore: load }}
    />,
  );
  act(() =>
    intersect(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    ),
  );
  expect(load).toHaveBeenCalledTimes(1);
  expect(screen.getByText("已加载结果中 0 条命中")).toBeInTheDocument();
  vi.unstubAllGlobals();
});

it("keeps the rendered list bounded while revealing more loaded results", () => {
  let intersect: IntersectionObserverCallback = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const records = Array.from({ length: 100 }, (_, i) => ({
    deliveryId: `d-${i}`,
    traceId: "a".repeat(32),
    taskId: "t",
    taskName: "T",
    workflowId: "w",
    workflowName: "W",
    workflowVersion: "1",
    startedAt: "2026-09-10T00:00:00Z",
  }));
  const { container } = render(
    <DeliveryDirectory
      records={records}
      range={["2026-09-01", "2026-10-01"]}
      selectedId={null}
      onSelectionChange={() => {}}
      searchFields={[]}
    />,
  );
  for (let i = 0; i < 8; i++)
    act(() =>
      intersect(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ),
    );
  expect(
    container.querySelectorAll("[data-delivery-id]").length,
  ).toBeLessThanOrEqual(30);
  vi.unstubAllGlobals();
});
