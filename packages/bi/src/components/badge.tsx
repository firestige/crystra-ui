import type { HTMLAttributes } from "react";
import "../badge.css";
/** Basic visual primitive; domain counts, visibility and motion belong to consumers. */
export function Badge({
  dot = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { dot?: boolean }) {
  return (
    <span
      {...props}
      className={["crystra-badge", className].filter(Boolean).join(" ")}
      data-dot={dot || undefined}
    >
      {dot ? null : children}
    </span>
  );
}
