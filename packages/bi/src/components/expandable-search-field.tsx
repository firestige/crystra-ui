import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Icon } from "./icon";
import { SearchField, type SearchFieldProps } from "./state-components";

export type ExpandableSearchFieldProps = Omit<
  SearchFieldProps,
  "appearance" | "hideLabel" | "title"
> & {
  title?: ReactNode;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  triggerContent?: ReactNode;
  cancelIcon?: ReactNode;
  cancelLabel?: string;
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement> & {
    "data-section-id"?: string;
  };
  cancelProps?: ButtonHTMLAttributes<HTMLButtonElement> & {
    "data-section-id"?: string;
  };
  onValueChange?: (value: string) => void;
};
/** Shared geometry and focus behavior; all displayed content can be supplied by callers. */
export function ExpandableSearchField({
  title,
  label,
  expanded,
  onExpandedChange,
  onValueChange,
  leading = <Icon name="search" />,
  triggerContent,
  cancelIcon = <Icon name="x" />,
  cancelLabel = "关闭搜索",
  triggerProps,
  cancelProps,
  size = "compact",
  value,
  defaultValue = "",
  onChange,
  onKeyDown,
  disabled,
  trailing,
  ...inputProps
}: ExpandableSearchFieldProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = expanded ?? localOpen;
  const setOpen = (next: boolean) => {
    setLocalOpen(next);
    onExpandedChange?.(next);
  };
  const [query, setQuery] = useState(String(defaultValue));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const id = useId();
  useLayoutEffect(() => {
    if (open) root.current?.querySelector("input")?.focus();
    else if (wasOpen.current) {
      trigger.current?.focus();
      setQuery("");
    }
    wasOpen.current = open;
  }, [open]);
  const close = () => {
    setQuery("");
    onValueChange?.("");
    setOpen(false);
  };
  return (
    <div
      ref={root}
      className="crystra-expandable-search"
      data-open={open}
      data-disabled={disabled || undefined}
    >
      <span className="crystra-expandable-search-title" aria-hidden={open}>
        {title}
      </span>
      <div
        id={id}
        className="crystra-expandable-search-content"
        inert={!open}
        aria-hidden={!open}
      >
        <SearchField
          {...inputProps}
          disabled={disabled}
          hideLabel
          size={size}
          label={label}
          leading={
            <span className="crystra-expandable-search-spacer">{leading}</span>
          }
          value={value ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            onValueChange?.(e.target.value);
            onChange?.(e);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.key === "Escape" && !e.defaultPrevented) close();
          }}
          trailing={
            <>
              {trailing}
              <button
                {...cancelProps}
                type="button"
                className="crystra-search-dismiss"
                aria-label={cancelLabel}
                onClick={close}
              >
                {cancelIcon}
              </button>
            </>
          }
        />
      </div>
      <button
        {...triggerProps}
        ref={trigger}
        type="button"
        disabled={disabled}
        className="crystra-expandable-search-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        tabIndex={open ? -1 : 0}
        onClick={() => {
          if (open) root.current?.querySelector("input")?.focus();
          else setOpen(true);
        }}
      >
        {open ? leading : (triggerContent ?? leading)}
      </button>
    </div>
  );
}
