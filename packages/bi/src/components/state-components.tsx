import { useDismissibleLayer } from "./use-dismissible-layer";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import "../search-field.css";
import "./compact-fields.css";
import "../select-dropdown.css";
import {
  Button,
  Card,
  IconButton,
  Typography,
  type ComponentSize,
} from "./design-system";
import { Icon } from "./icon";
export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> & {
  label: string;
  size?: ComponentSize;
  appearance?: "default" | "surface" | "outline";
  hideLabel?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};
export function SearchField({
  label,
  appearance = "surface",
  hideLabel = false,
  leading,
  trailing,
  size = "regular",
  id,
  ...props
}: SearchFieldProps) {
  const generated = useId();
  if (appearance !== "default")
    return (
      <div
        className="crystra-search-field"
        data-appearance={appearance}
        data-ui-owner={appearance === "outline" ? "components" : undefined}
        data-size={size}
        data-disabled={props.disabled || undefined}
      >
        {!hideLabel && (
          <label htmlFor={id ?? generated}>
            <Typography variant="label">{label}</Typography>
          </label>
        )}
        <div
          className="crystra-search-surface"
          onClick={(event) => {
            if (event.target === event.currentTarget)
              event.currentTarget.querySelector("input")?.focus();
          }}
        >
          {leading && <span className="crystra-search-leading">{leading}</span>}
          <input
            aria-label={hideLabel ? label : undefined}
            {...props}
            id={id ?? generated}
            type="search"
          />
          {trailing}
        </div>
      </div>
    );
  return (
    <label className="crystra-field" data-size={size} htmlFor={id ?? generated}>
      <Typography variant="label">{label}</Typography>
      <input {...props} id={id ?? generated} type="search" />
    </label>
  );
}
export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "children"
> & {
  label: string;
  size?: ComponentSize;
  appearance?: "default" | "embedded" | "inline" | "workspace";
  hideLabel?: boolean;
  menuPlacement?: "top" | "bottom";
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  children?: ReactNode;
  unframed?: boolean;
};
export function SelectField({
  label,
  menuPlacement = "bottom",
  appearance = "default",
  hideLabel = false,
  size = "regular",
  id,
  options,
  children,
  unframed = false,
  ...props
}: SelectFieldProps) {
  const generated = useId();
  const control = (
    <select
      {...props}
      className={[
        appearance === "workspace" ? "crystra-field-control" : "",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-appearance={appearance}
      data-ui-owner={appearance === "workspace" ? "components" : undefined}
      data-menu-placement={menuPlacement}
      aria-label={props["aria-label"] ?? label}
      id={id ?? generated}
    >
      {options
        ? options.map((x) => (
            <option key={x.value} value={x.value} disabled={x.disabled}>
              {x.label}
            </option>
          ))
        : children}
    </select>
  );
  if (unframed) return control;
  return (
    <label
      className="crystra-field"
      data-ui-owner={appearance === "inline" ? "components" : undefined}
      data-size={size}
      data-appearance={appearance}
      htmlFor={id ?? generated}
    >
      {!hideLabel && <Typography variant="label">{label}</Typography>}
      {control}
    </label>
  );
}

export type SelectionControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> & { label: string; type: "checkbox" | "radio" };
export function SelectionControl({
  label,
  type,
  ...props
}: SelectionControlProps) {
  return (
    <label className="crystra-selection">
      <input {...props} type={type} />
      <Typography variant="control">{label}</Typography>
    </label>
  );
}
export interface PopoverProps {
  label: string;
  children: ReactNode;
  size?: ComponentSize;
}
/** Non-modal form/content popover. Native Tab can leave; Escape returns to the trigger. */
export function Popover({ label, children, size = "compact" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !panel.current || !trigger.current) return;
    const r = trigger.current.getBoundingClientRect(),
      b = panel.current.getBoundingClientRect();
    const room = Math.max(0, innerHeight - r.bottom - 12);
    Object.assign(panel.current.style, {
      maxHeight: `${room}px`,
      left: `${Math.max(8, Math.min(r.left, innerWidth - b.width - 8))}px`,
      top: `${r.bottom + 4}px`,
    });
    panel.current.focus();
  }, [open]);
  useDismissibleLayer({ open, root, trigger, onDismiss: () => setOpen(false) });
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
  return (
    <div
      className="crystra-popover"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        size={size}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((x) => !x)}
      >
        {label}
      </Button>
      {open && (
        <div
          ref={panel}
          id={id}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className="crystra-popover-panel"
        >
          {children}
        </div>
      )}
    </div>
  );
}
export function EmptyState({ label = "没有内容" }: { label?: string }) {
  return (
    <div className="crystra-empty">
      <div aria-hidden="true" className="crystra-empty-skeleton">
        <Icon name="file" size="brand-slot" />
        <span />
        <span />
      </div>
      <Typography variant="description" tone="secondary">
        {label}
      </Typography>
    </div>
  );
}
export interface FullBenchViewerProps {
  title: string;
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
  preview: ReactNode;
  children: ReactNode;
}
/** The parent allocates the bench height; only the full-view content scrolls. */
export function FullBenchViewer({
  title,
  expanded,
  onExpandedChange,
  preview,
  children,
}: FullBenchViewerProps) {
  const expand = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  useEffect(() => {
    if (expanded) back.current?.focus();
    else if (wasExpanded.current) expand.current?.focus();
    wasExpanded.current = expanded;
  }, [expanded]);
  return (
    <Card
      className="crystra-bench-viewer"
      data-expanded={expanded}
      heading={title}
      actions={
        expanded ? (
          <Button
            ref={back}
            aria-label={`返回${title}`}
            onClick={() => onExpandedChange(false)}
            startIcon={<Icon name="arrow-left" />}
          >
            返回
          </Button>
        ) : (
          <Button
            ref={expand}
            aria-label={`展开${title}`}
            onClick={() => onExpandedChange(true)}
            endIcon={<Icon name="arrow-up-right" />}
          >
            展开
          </Button>
        )
      }
    >
      <div hidden={expanded} className="crystra-viewer-preview">
        {preview}
      </div>
      {expanded && (
        <div
          className="crystra-viewer-scroll"
          tabIndex={0}
          aria-label={`${title}完整内容`}
        >
          {children}
        </div>
      )}
    </Card>
  );
}
export interface ProgressNoticeProps {
  label: string;
  value: number;
  onDismiss: () => void;
}
export function ProgressNotice({
  label,
  value,
  onDismiss,
}: ProgressNoticeProps) {
  const progress = Math.max(
    0,
    Math.min(100, Number.isFinite(value) ? value : 0),
  );
  return (
    <aside className="crystra-progress-notice">
      <div className="crystra-viewer-header">
        <Typography variant="item-title" role="status">
          {label}
        </Typography>
        <IconButton aria-label="关闭通知" onClick={onDismiss}>
          <Icon name="x" />
        </IconButton>
      </div>
      <progress
        aria-label={label}
        aria-valuenow={progress}
        max={100}
        value={progress}
      />
      <Typography variant="meta">{progress}%</Typography>
    </aside>
  );
}
