import {
  useLayoutEffect,
  useRef,
  type RefObject,
  type KeyboardEvent,
} from "react";

/** Shared behavior for inline and portalled menu presentations. */
export function useMenuBehavior({
  open,
  panel,
  trigger,
  onClose,
  align = "end",
  inward = false,
  initial,
}: {
  open: boolean;
  panel: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "start" | "end";
  inward?: boolean;
  initial?: RefObject<"first" | "last">;
}) {
  const anchor = trigger.current;
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  const close = (restore = false) => {
    latestClose.current();
    if (restore) trigger.current?.focus({ preventScroll: true });
  };
  const buttons = () =>
    Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled)',
      ) ?? [],
    );
  useLayoutEffect(() => {
    const el = panel.current,
      anchorElement = trigger.current;
    if (!open || !el || !anchorElement) return;
    const anchor = anchorElement.getBoundingClientRect();
    const top = Math.max(
      8,
      inward
        ? anchor.bottom - el.offsetHeight
        : Math.min(anchor.bottom + 4, window.innerHeight - el.offsetHeight - 8),
    );
    el.style.left = `${Math.max(8, Math.min(align === "start" ? anchor.left : anchor.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${top}px`;
    el.style.maxHeight = `${Math.max(0, window.innerHeight - top - 8)}px`;
    const candidates = buttons();
    (initial?.current === "last" ? candidates.at(-1) : candidates[0])?.focus({
      preventScroll: true,
    });
    if (!candidates.length) el.focus({ preventScroll: true });
    const outside = (e: Event) => {
      if (
        !el.contains(e.target as Node) &&
        !anchorElement.contains(e.target as Node)
      )
        latestClose.current();
    };
    const scroll = (e: Event) => {
      if (
        e.target === window ||
        e.target === document ||
        (e.target instanceof Element && e.target.contains(anchorElement))
      )
        latestClose.current();
    };
    const resize = () => latestClose.current();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", resize);
    };
  }, [open, panel, trigger, anchor, align, inward, initial]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key === "Tab") {
      close(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const candidates = buttons();
    if (!candidates.length) return;
    const index = candidates.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? candidates.length - 1
          : (index + (e.key === "ArrowDown" ? 1 : -1) + candidates.length) %
            candidates.length;
    candidates[next]?.focus({ preventScroll: true });
  };
  return { close, onKeyDown };
}
