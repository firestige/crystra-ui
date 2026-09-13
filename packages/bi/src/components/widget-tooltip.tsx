import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "../widget-tooltip.css";

/** Portal avoids the widget's overflow clipping; hover and keyboard share one description. */
export function WidgetTooltip({
  text,
  children,
  className,
  focusable = true,
}: {
  text: string;
  children: ReactNode;
  className?: string;
  focusable?: boolean;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const cancelClose = () => clearTimeout(timer.current);
  const show = () => {
    cancelClose();
    setOpen(true);
  };
  const hideSoon = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 100);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const a = anchor.current.getBoundingClientRect();
    const t = tip.current.getBoundingClientRect();
    tip.current.style.left = `${Math.max(8, Math.min(a.left + (a.width - t.width) / 2, window.innerWidth - t.width - 8))}px`;
    tip.current.style.top = `${Math.max(8, a.top - t.height - 8 >= 8 ? a.top - t.height - 8 : Math.min(a.bottom + 8, window.innerHeight - t.height - 8))}px`;
  }, [open, text]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);
  return (
    <>
      <span
        ref={anchor}
        className={className}
        tabIndex={focusable ? 0 : undefined}
        aria-label={focusable ? text : undefined}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocus={show}
        onBlur={() => {
          cancelClose();
          setOpen(false);
        }}
        onClickCapture={() => {
          cancelClose();
          setOpen(false);
        }}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span
            ref={tip}
            id={id}
            role="tooltip"
            className="crystra-widget-tooltip"
            onMouseEnter={cancelClose}
            onMouseLeave={hideSoon}
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}
