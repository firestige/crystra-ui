import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./design-system";
import { Icon } from "./icon";
import { ActionMenu } from "./action-menu";
import "./adaptive-choice.css";
export interface AdaptiveChoiceProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string; icon?: ReactNode }[];
  expanded?: ReactNode;
  compactIconOnly?: boolean;
  functionIcon?: ReactNode;
  onChange: (value: string) => void;
  /** Container content width below which the options become a menu. */
  collapseBelow?: number;
}
/** Both representations use the same controlled value; host width, not viewport, drives layout. */
export function AdaptiveChoice({
  label,
  value,
  options,
  onChange,
  collapseBelow = 960,
  expanded,
  compactIconOnly = false,
  functionIcon,
}: AdaptiveChoiceProps) {
  const root = useRef<HTMLSpanElement>(null),
    restoreFocus = useRef(false);
  const [compact, setCompact] = useState(false),
    [trigger, setTrigger] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = root.current,
      container = el?.closest("[data-adaptive-container]") ?? el?.parentElement;
    if (!el || !container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined) return;
      restoreFocus.current =
        el.contains(document.activeElement) ||
        !!document.activeElement?.closest(".crystra-action-menu");
      setCompact(width < collapseBelow);
      setTrigger(null);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [collapseBelow]);
  useEffect(() => {
    if (restoreFocus.current) {
      root.current
        ?.querySelector<HTMLButtonElement>(
          '[aria-pressed="true"], [aria-haspopup="menu"]',
        )
        ?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [compact]);
  const selected = options.find((option) => option.value === value);
  return (
    <span
      ref={root}
      className="crystra-adaptive-choice"
      role="group"
      aria-label={label}
      data-compact={compact}
    >
      {compact ? (
        <Button
          appearance="segment"
          tone="primary"
          selected
          aria-label={`${label}：${selected?.label ?? value}`}
          aria-haspopup="menu"
          aria-expanded={!!trigger}
          title={`${label}：${selected?.label ?? value}`}
          endIcon={compactIconOnly ? undefined : <Icon name="chevron-down" />}
          onClick={(e) => setTrigger(trigger ? null : e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setTrigger(e.currentTarget);
            }
          }}
        >
          {compactIconOnly
            ? (functionIcon ?? selected?.icon ?? selected?.label)
            : (selected?.label ?? value)}
        </Button>
      ) : (
        (expanded ??
        options.map((option) => (
          <Button
            key={option.value}
            appearance="segment"
            tone="primary"
            startIcon={option.icon}
            selected={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        )))
      )}
      {trigger && (
        <ActionMenu
          trigger={trigger}
          label={label}
          items={options.map((option) => ({
            label: option.label,
            icon: option.icon,
            selected: option.value === value,
            onChoose: () => onChange(option.value),
          }))}
          onClose={() => setTrigger(null)}
        />
      )}
    </span>
  );
}
