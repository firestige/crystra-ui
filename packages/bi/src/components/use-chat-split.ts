import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

/** Shared Workflow/Task split behavior. Widths are measured in the mounted host. */
export function useChatSplit({
  initialWidth = 380,
  initialRatio,
  minBenchWidth = 0,
}: {
  initialWidth?: number;
  initialRatio?: number;
  minBenchWidth?: number;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useRef(false);
  const [available, setAvailable] = useState(1200);
  const [width, setWidth] = useState(initialWidth);
  const [resizing, setResizing] = useState(false);
  const maximum = (total: number) =>
    Math.max(360, Math.min(total / 2, total - 6 - minBenchWidth));
  const clamp = (value: number, total: number) =>
    Math.min(maximum(total), Math.max(360, value));
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const total = element.clientWidth;
      if (!total) return;
      const max = Math.max(360, Math.min(total / 2, total - 6 - minBenchWidth));
      const first = !measured.current;
      measured.current = true;
      setAvailable(total);
      setWidth((old) =>
        Math.min(
          max,
          Math.max(
            360,
            first && initialRatio !== undefined ? total * initialRatio : old,
          ),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [initialRatio, minBenchWidth]);
  const dividerProps: HTMLAttributes<HTMLDivElement> = {
    "aria-valuemin": 360,
    "aria-valuemax": Math.floor(maximum(available)),
    "aria-valuenow": Math.round(width),
    onPointerDown(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setResizing(true);
    },
    onPointerMove(event) {
      const element = ref.current;
      if (element && event.currentTarget.hasPointerCapture(event.pointerId))
        setWidth(
          clamp(
            event.clientX - element.getBoundingClientRect().left - 3,
            element.clientWidth,
          ),
        );
    },
    onPointerUp(event) {
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      setResizing(false);
    },
    onPointerCancel() {
      setResizing(false);
    },
    onLostPointerCapture() {
      setResizing(false);
    },
    onKeyDown(event) {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      setWidth((old) =>
        clamp(
          event.key === "Home"
            ? 360
            : event.key === "End"
              ? maximum(available)
              : old + (event.key === "ArrowLeft" ? -16 : 16),
          available,
        ),
      );
    },
  };
  return {
    ref,
    resizing,
    dividerProps,
    style: {
      gridTemplateColumns: `${width}px 6px minmax(${minBenchWidth}px,1fr)`,
    } as CSSProperties,
  };
}
