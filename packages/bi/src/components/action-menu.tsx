import "./action-menu.css";
import { useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onChoose?: () => void;
  selected?: boolean;
}
/** Shared browser popup; owner callbacks determine available resource actions. */
export function ActionMenu({
  trigger,
  label,
  items,
  inward,
  onClose,
}: {
  trigger: HTMLElement;
  label: string;
  items: ActionMenuItem[];
  inward?: boolean;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const anchor = trigger.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(anchor.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${Math.max(8, inward ? anchor.bottom - el.offsetHeight : Math.min(anchor.bottom + 4, window.innerHeight - el.offsetHeight - 8))}px`;
    el.querySelector<HTMLButtonElement>('[role^="menuitem"]')?.focus({
      preventScroll: true,
    });
  }, [trigger, inward]);
  useEffect(() => {
    const outside = (e: Event) => {
      if (
        !root.current?.contains(e.target as Node) &&
        !trigger.contains(e.target as Node)
      )
        onClose();
    };
    const scroll = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [trigger, onClose]);
  const close = () => {
    onClose();
    trigger.focus({ preventScroll: true });
  };
  return createPortal(
    <div className="crystra-bi" data-crystra-theme="dark">
      <div
        ref={root}
        className="crystra-menu-panel crystra-action-menu"
        role="menu"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            close();
            return;
          }
          if (e.key === "Tab") {
            onClose();
            return;
          }
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const buttons = Array.from(
            root.current!.querySelectorAll<HTMLButtonElement>(
              '[role^="menuitem"]',
            ),
          );
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          buttons[
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? buttons.length - 1
                : (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                  buttons.length
          ]?.focus();
        }}
      >
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            className="crystra-menu-item"
            role={item.selected === undefined ? "menuitem" : "menuitemradio"}
            aria-checked={item.selected}
            aria-disabled={!item.onChoose}
            title={!item.onChoose ? "此操作尚未接通资源接口" : undefined}
            onClick={() => {
              if (item.onChoose) {
                close();
                item.onChoose();
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
