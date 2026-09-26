import { useMenuBehavior } from "./menu-behavior";
import { createPortal } from "react-dom";
import {
  useId,
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
  size?: ComponentSize;
  appearance?: "soft" | "underline";
  /** Optional host-owned Header slot; panel IDs and state remain owned by Tabs. */
  navigationContainer?: HTMLElement | null;
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
  navigationContainer,
  className,
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
  const navigation = (
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
  );
  return (
    <div
      className={["crystra-tabs", className].filter(Boolean).join(" ")}
      data-appearance={appearance}
      data-size={size}
    >
      {navigationContainer
        ? createPortal(navigation, navigationContainer)
        : navigation}
      {items.map((item, index) => (
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
      ))}
    </div>
  );
}
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: SemanticTone;
  onSelect: () => void;
}
export interface MenuProps {
  label: string;
  items: readonly MenuItem[];
  size?: ComponentSize;
  align?: "start" | "end";
  disabled?: boolean;
}
/** Anchored action menu, kept in the theme subtree. No domain mutations are inferred. */
export function Menu({
  label,
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
  const { close, onKeyDown: keydown } = useMenuBehavior({
    open,
    panel,
    trigger,
    onClose: () => setOpen(false),
    align,
    initial,
  });
  return (
    <div ref={root} className="crystra-menu" data-align={align}>
      <Button
        ref={trigger}
        size={size}
        disabled={disabled}
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
        endIcon={<Icon name="chevron-down" />}
      >
        {label}
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
              role="menuitem"
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
