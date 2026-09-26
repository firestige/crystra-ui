import { useMenuBehavior } from "./menu-behavior";
import "./action-menu.css";
import { useRef, type ReactNode } from "react";
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
  const anchor = useRef<HTMLElement>(trigger);
  anchor.current = trigger;
  const { close, onKeyDown } = useMenuBehavior({
    open: true,
    panel: root,
    trigger: anchor,
    inward,
    onClose,
  });
  return createPortal(
    <div className="crystra-bi" data-crystra-theme="dark">
      <div
        ref={root}
        className="crystra-menu-panel crystra-action-menu"
        role="menu"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
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
                close(true);
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
