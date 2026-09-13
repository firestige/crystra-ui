import type { HTMLAttributes, ReactNode } from "react";
import {
  WIDGET_CATALOG,
  widgetSpan,
  type MonitoringWidgetSize,
  type WidgetCategory,
} from "../domain/widget-catalog";
import "../monitoring-widget-base.css";
export interface MonitoringWidgetProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children" | "style"
> {
  category: WidgetCategory;
  size: MonitoringWidgetSize;
  title?: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  status?: ReactNode;
  primary?: ReactNode;
  visualization?: ReactNode;
  supporting?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}
/** Category selects legal capacity. Renderers provide the information composition. */
export function MonitoringWidget({
  category,
  size,
  title,
  subtitle,
  leading,
  status,
  primary,
  visualization,
  supporting,
  footer,
  actions,
  className,
  ...props
}: MonitoringWidgetProps) {
  if (!(WIDGET_CATALOG[category].sizes as readonly string[]).includes(size))
    throw new Error(`Unsupported ${category} widget size: ${size}`);
  const [rows, columns] = size.split("x").map(Number);
  const header =
    title != null || subtitle != null || leading != null || status != null;
  return (
    <article
      {...props}
      className={["widget", "crystra-monitoring-widget", className]
        .filter(Boolean)
        .join(" ")}
      data-category={category}
      data-size={size}
      style={{ width: widgetSpan(columns), height: widgetSpan(rows) }}
    >
      {header && (
        <header className="crystra-monitoring-widget-header">
          {leading}
          <div>
            {title != null && (
              <span className="title crystra-monitoring-widget-title">
                {title}
              </span>
            )}
            {subtitle != null && (
              <div className="muted crystra-monitoring-widget-subtitle">
                {subtitle}
              </div>
            )}
          </div>
          {status}
        </header>
      )}
      <div className="content crystra-monitoring-widget-content">
        {primary}
        {visualization}
        {supporting}
      </div>
      {(footer != null || actions != null) && (
        <footer className="crystra-monitoring-widget-footer">
          {footer != null && <span>{footer}</span>}
          {actions}
        </footer>
      )}
    </article>
  );
}
