import { useEffect, type RefObject } from "react";
/** Shared dismissal for anchored UI layers; no application state or data effects. */
export function useDismissibleLayer({
  open,
  root,
  trigger,
  onDismiss,
}: {
  open: boolean;
  root: RefObject<HTMLElement | null>;
  trigger: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onDismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        root.current?.contains(event.target as Node)
      ) {
        event.preventDefault();
        onDismiss();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, root, trigger, onDismiss]);
}
