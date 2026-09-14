import { createPortal } from "react-dom";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Button,
  Typography,
  type ComponentSize,
  type SemanticTone,
} from "./design-system";
import { Icon } from "./icon";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  size?: ComponentSize;
  divided?: boolean;
  selectionAppearance?: "outline" | "surface";
}
export function List({
  size = "regular",
  divided = false,
  selectionAppearance = "outline",
  className,
  ...props
}: ListProps) {
  return (
    <ul
      {...props}
      className={["crystra-list", className].filter(Boolean).join(" ")}
      data-selection-appearance={selectionAppearance}
      data-size={size}
      data-divided={divided || undefined}
    />
  );
}
type ItemAction =
  | { href: string; onActivate?: never; disabled?: never }
  | { href?: never; onActivate?: () => void; disabled?: boolean };
export type ListItemProps = Omit<HTMLAttributes<HTMLLIElement>, "onClick"> &
  ItemAction & {
    primary: ReactNode;
    description?: ReactNode;
    leading?: ReactNode;
    metadata?: ReactNode;
    actions?: ReactNode;
    selected?: boolean;
  };
export function ListItem({
  primary,
  description,
  leading,
  metadata,
  actions,
  selected = false,
  href,
  onActivate,
  disabled,
  className,
  ...props
}: ListItemProps) {
  const content = (
    <>
      {leading && (
        <span className="crystra-list-leading" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="crystra-list-copy">
        <Typography variant="item-title">{primary}</Typography>
        {description && (
          <Typography variant="description" tone="secondary">
            {description}
          </Typography>
        )}
      </span>
      {metadata && <span className="crystra-list-meta">{metadata}</span>}
    </>
  );
  return (
    <li
      {...props}
      className={["crystra-list-item", className].filter(Boolean).join(" ")}
      data-selected={selected || undefined}
    >
      {href !== undefined ? (
        <a
          className="crystra-list-main"
          href={href}
          aria-current={selected ? "page" : undefined}
        >
          {content}
        </a>
      ) : onActivate ? (
        <button
          type="button"
          className="crystra-list-main"
          disabled={disabled}
          onClick={onActivate}
          aria-current={selected ? "true" : undefined}
        >
          {content}
        </button>
      ) : (
        <div className="crystra-list-main">{content}</div>
      )}
      {actions && <div className="crystra-list-actions">{actions}</div>}
    </li>
  );
}
export interface TabItem {
  value: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
}
export interface TabsProps {
  "aria-label": string;
  value: string;
  onValueChange: (value: string) => void;
  items: readonly TabItem[];
  /** Explicit host-owned panel location; null waits for that host to commit. */
  panelContainer?: HTMLElement | null;
  size?: ComponentSize;
  appearance?: "soft" | "underline";
  className?: string;
}
/** Controlled page-local tabs; arrows move focus, Enter/Space activate. Routes belong to the host. */
export function Tabs({
  "aria-label": label,
  value,
  onValueChange,
  items,
  size = "regular",
  appearance = "soft",
  className,
  panelContainer,
}: TabsProps) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = items.findIndex((x) => x.value === value);
  const entry =
    selected >= 0 && !items[selected].disabled
      ? selected
      : items.findIndex((x) => !x.disabled);
  const move = (event: KeyboardEvent, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabled = items
      .map((x, i) => (!x.disabled ? i : -1))
      .filter((i) => i >= 0);
    if (!enabled.length) return;
    const pos = enabled.indexOf(index);
    const target =
      event.key === "Home"
        ? enabled[0]
        : event.key === "End"
          ? enabled.at(-1)!
          : enabled[
              (pos + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) %
                enabled.length
            ];
    refs.current[target]?.focus();
  };
  const panels = items.map((item, index) => (
    <div
      key={item.value}
      id={`${id}-panel-${index}`}
      role="tabpanel"
      aria-labelledby={`${id}-tab-${index}`}
      hidden={item.value !== value}
      tabIndex={0}
      className="crystra-tab-panel"
    >
      {item.panel}
    </div>
  ));
  return (
    <div
      className={["crystra-tabs", className].filter(Boolean).join(" ")}
      data-appearance={appearance}
      data-size={size}
    >
      <div role="tablist" aria-label={label} className="crystra-tab-list">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${id}-tab-${index}`}
            role="tab"
            aria-selected={item.value === value}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === entry ? 0 : -1}
            disabled={item.disabled}
            onKeyDown={(e) => move(e, index)}
            onClick={() => onValueChange(item.value)}
            className="crystra-tab"
          >
            {item.label}
          </button>
        ))}
      </div>
      {panelContainer === undefined
        ? panels
        : panelContainer
          ? createPortal(panels, panelContainer)
          : null}
    </div>
  );
}
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  tone?: SemanticTone;
  onSelect: () => void;
}
export interface MenuProps {
  label: string;
  triggerContent?: ReactNode;
  side?: "top" | "bottom" | "auto";
  items: readonly MenuItem[];
  size?: ComponentSize;
  align?: "start" | "end";
  disabled?: boolean;
}
/** Anchored action menu, kept in the theme subtree. No domain mutations are inferred. */
export function Menu({
  label,
  triggerContent,
  side = "bottom",
  items,
  size = "compact",
  align = "end",
  disabled = false,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const initial = useRef<"first" | "last">("first");
  const id = useId();
  const buttons = () =>
    Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled)',
      ) ?? [],
    );
  const close = (restore = false) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const enabled = Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    (initial.current === "last" ? enabled.at(-1) : enabled[0])?.focus();
    if (!enabled.length) panel.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useLayoutEffect(() => {
    if (!open || !panel.current || !trigger.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const box = panel.current.getBoundingClientRect();
    const margin = 8;
    const below = window.innerHeight - anchor.bottom - margin - 4;
    const above = anchor.top - margin - 4;
    const placeAbove =
      side === "top" ||
      (side === "auto" && below < box.height && above > below);
    const room = Math.max(0, placeAbove ? above : below);
    panel.current.style.maxHeight = `${room}px`;
    panel.current.style.left = `${Math.max(margin, Math.min(align === "end" ? anchor.right - box.width : anchor.left, window.innerWidth - box.width - margin))}px`;
    panel.current.style.top = `${placeAbove ? Math.max(margin, anchor.top - 4 - Math.min(box.height, room)) : anchor.bottom + 4}px`;
  }, [open, align, side]);
  useEffect(() => {
    if (!open) return;
    const dismiss = () => setOpen(false);
    const scroll = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  const keydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const enabled = buttons();
    if (!enabled.length) return;
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? enabled.length - 1
          : (index + (e.key === "ArrowDown" ? 1 : -1) + enabled.length) %
            enabled.length;
    enabled[next]?.focus();
  };
  return (
    <div
      ref={root}
      className="crystra-menu"
      data-align={align}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        size={size}
        disabled={disabled}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          initial.current = "first";
          setOpen((x) => !x);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            initial.current = e.key === "ArrowUp" ? "last" : "first";
            setOpen(true);
          }
        }}
        endIcon={triggerContent ? undefined : <Icon name="chevron-down" />}
      >
        {triggerContent ?? label}
      </Button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          className="crystra-menu-panel"
          onKeyDown={keydown}
        >
          {items.map((item) => (
            <button
              type="button"
              role={item.checked === undefined ? "menuitem" : "menuitemradio"}
              aria-checked={item.checked}
              tabIndex={-1}
              key={item.id}
              disabled={item.disabled}
              data-tone={item.tone ?? "neutral"}
              className="crystra-menu-item"
              onClick={() => {
                close(true);
                item.onSelect();
              }}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
