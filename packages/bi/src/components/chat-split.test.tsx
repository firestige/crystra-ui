import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatSplitDivider } from "./chat-split";
import { useChatSplit } from "./use-chat-split";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("clamps keyboard resizing to both pane limits and responds to container resize", () => {
  let resize!: ResizeObserverCallback;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  function Harness() {
    const {
      ref: splitRef,
      style: splitStyle,
      dividerProps,
    } = useChatSplit({ initialWidth: 380, minBenchWidth: 680 });
    return (
      <div ref={splitRef} style={splitStyle}>
        <ChatSplitDivider {...dividerProps} />
      </div>
    );
  }
  const { container } = render(<Harness />);
  const host = container.firstElementChild as HTMLElement;
  Object.defineProperty(host, "clientWidth", {
    configurable: true,
    value: 1200,
  });
  fireEvent(window, new Event("resize"));
  // Observer reports actual host width, not the browser width.
  const divider = screen.getByRole("separator");
  // Invoking through act keeps React's observer update synchronous.
  return import("@testing-library/react").then(({ act }) => {
    act(() => resize([], {} as ResizeObserver));
    fireEvent.keyDown(divider, { key: "End" });
    expect(divider).toHaveAttribute("aria-valuenow", "514");
    fireEvent.keyDown(divider, { key: "Home" });
    expect(divider).toHaveAttribute("aria-valuenow", "360");
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider).toHaveAttribute("aria-valuenow", "376");
    Object.defineProperty(host, "clientWidth", {
      configurable: true,
      value: 1046,
    });
    act(() => resize([], {} as ResizeObserver));
    expect(divider).toHaveAttribute("aria-valuenow", "360");
  });
});
