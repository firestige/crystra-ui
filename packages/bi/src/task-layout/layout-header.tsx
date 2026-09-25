import type { HTMLAttributes } from "react";
import "../layout-header.css";
/** Shared shell geometry; each surface supplies its own header slots. */
export function LayoutHeader({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <header
      {...props}
      data-section-id="workspace-header"
      className={["crystra-layout-header", className].filter(Boolean).join(" ")}
    />
  );
}
