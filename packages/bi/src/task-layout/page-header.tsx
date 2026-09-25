import { LayoutHeader } from "./layout-header";
import type { ReactNode } from "react";
// Structure and SVGs transcribed from the authoritative Task v8 HTML.
export interface PageHeaderProps {
  title: string;
  description?: string;
  context?: ReactNode;
  navigation?: ReactNode;
}
export function PageHeader({
  title,
  description,
  context,
  navigation,
}: PageHeaderProps) {
  return (
    <LayoutHeader
      data-section-id="workspace-header"
      className="crystra-page-header crystra-bi wb-header wb-page-header"
      data-crystra-theme="dark"
    >
      <div className="crystra-page-identity-text" data-header-slot="identity">
        <div className="crystra-page-identity">
          <span data-type="glyph" className="crystra-page-glyph">
            <svg
              data-iconify="tabler:arrow-up-right"
              data-icon-role="context-marker"
              data-icon-kind="svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 7L7 17M8 7h9v9"
              ></path>
            </svg>
          </span>
          <div className="crystra-page-identity-text">
            <h1 data-type="page-title" className="crystra-page-title">
              {title}
            </h1>
            {description && (
              <p
                data-type="header-description"
                className="crystra-page-description"
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div data-header-slot="navigation">{navigation}</div>
      <div
        data-header-slot="context"
        data-section-id="task-context"
        className="crystra-page-context"
      >
        {context}
      </div>
    </LayoutHeader>
  );
}
