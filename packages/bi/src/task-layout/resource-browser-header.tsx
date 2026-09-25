import "./resource-browser-header.css";
import type { ReactNode } from "react";
import { LayoutHeader } from "./layout-header";
export function ResourceBrowserHeader({
  identity,
  search,
  toolbar,
  actions,
}: {
  identity: ReactNode;
  search: ReactNode;
  toolbar: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <LayoutHeader
      data-adaptive-container
      data-ui-owner="components"
      className="browser-header"
      data-unified-tools={!actions || undefined}
    >
      {identity}
      {search}
      {toolbar}
      {actions}
    </LayoutHeader>
  );
}
