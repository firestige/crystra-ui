import { useLayoutEffect, useRef, type ReactNode } from "react";
import { observationLayoutTokens } from "../domain/observation-layout-tokens";
import { chartColumnLayout } from "./chart-column-layout";
/** Preserve list order while stacking each responsive column independently. */
export function FixedColumnChartLayout({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const grid = root.current;
    if (!grid) return;
    let frame = 0;
    const measure = () => {
      const width = grid.getBoundingClientRect().width;
      const style = getComputedStyle(grid);
      const tokens = Object.fromEntries(
        Object.entries(observationLayoutTokens).map(([key, value]) => [
          key,
          style.getPropertyValue("--" + key).trim() || value,
        ]),
      );
      const { count, cardWidth, gap } = chartColumnLayout(width, tokens);
      grid.style.gridTemplateColumns = `repeat(${count}, ${cardWidth}px)`;
      grid.style.columnGap = `${gap}px`;
      grid.style.justifyContent = width < cardWidth ? "start" : "center";
      const offsets = Array(count).fill(0);
      Array.from(grid.children).forEach((child, index) => {
        if (!(child instanceof HTMLElement) || !child.firstElementChild) return;
        const column = index % count,
          rows = Math.ceil(
            child.firstElementChild.getBoundingClientRect().height,
          );
        child.style.gridColumnStart = String(column + 1);
        child.style.gridRowStart = String(offsets[column] + 1);
        child.style.gridRowEnd = `span ${Math.max(1, rows)}`;
        offsets[column] += rows + Math.ceil(gap);
      });
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(grid);
    for (const child of Array.from(grid.children))
      if (child.firstElementChild) observer.observe(child.firstElementChild);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [children]);
  return (
    <div ref={root} className="observation-setting-view">
      {children}
    </div>
  );
}
