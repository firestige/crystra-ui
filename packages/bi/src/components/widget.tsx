import type { HTMLAttributes, ReactNode } from "react";
export type WidgetSize = "1x1" | "1x2" | "1x3" | "2x2" | "3x3";
export interface WidgetProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> {
  size: WidgetSize;
  title: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}
/** @deprecated Use MonitoringWidget with a semantic category. Retained for existing consumers only. */
export function Widget({
  size,
  title,
  primary,
  secondary,
  status,
  actions,
  footer,
  className,
  ...props
}: WidgetProps) {
  return (
    <article
      {...props}
      className={["crystra-widget", className].filter(Boolean).join(" ")}
      data-size={size}
    >
      <header className="crystra-widget-header">
        <h3 className="crystra-widget-title">{title}</h3>
        {status != null && (
          <div className="crystra-widget-status">{status}</div>
        )}
      </header>
      <div className="crystra-widget-body">
        <div className="crystra-widget-primary">{primary}</div>
        {size !== "1x1" && secondary != null && (
          <div className="crystra-widget-secondary">{secondary}</div>
        )}
      </div>
      {(footer != null || actions != null) && (
        <footer className="crystra-widget-footer">
          {footer != null && (
            <div className="crystra-widget-marker">{footer}</div>
          )}
          {actions != null && (
            <div className="crystra-widget-actions">{actions}</div>
          )}
        </footer>
      )}
    </article>
  );
}
