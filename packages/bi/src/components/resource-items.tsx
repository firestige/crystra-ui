import type { ReactNode } from "react";
import { Card } from "./design-system";
import "./resource-items.css";
export interface ResourceGalleryCardProps {
  title: string;
  subtitle: string;
  href: string;
  selected?: boolean;
  selection: ReactNode;
  thumbnail: ReactNode;
  progress?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}
/** Resource-specific composition of the shared Card's full content slot. */
export function ResourceGalleryCard({
  title,
  subtitle,
  href,
  selected,
  selection,
  thumbnail,
  progress,
  status,
  actions,
}: ResourceGalleryCardProps) {
  return (
    <Card
      as="article"
      padding="none"
      data-ui-owner="components"
      className="crystra-resource-card"
      data-selected={selected}
    >
      <label className="crystra-resource-selection">{selection}</label>
      <a
        className="crystra-resource-link"
        href={href}
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="crystra-resource-thumbnail">{thumbnail}</div>
      </a>
      {progress}
      <div className="crystra-resource-copy">
        <div className="crystra-resource-heading">
          <h3 title={title}>
            <a className="crystra-resource-link" href={href}>
              {title}
            </a>
          </h3>
          {status}
        </div>
        <div className="crystra-resource-footer">
          <p title={subtitle}>{subtitle}</p>
          <div className="crystra-resource-actions">{actions}</div>
        </div>
      </div>
    </Card>
  );
}
export interface ResourceTableRowProps {
  title: string;
  href: string;
  selection: ReactNode;
  selected?: boolean;
  cells: ReactNode[];
  actions?: ReactNode;
}
/** Table semantics remain native; resource identity, selection and actions share one row recipe. */
export function ResourceTableRow({
  title,
  href,
  selection,
  selected,
  cells,
  actions,
}: ResourceTableRowProps) {
  return (
    <tr
      data-ui-owner="components"
      className="crystra-resource-row"
      data-selected={selected}
    >
      <td>{selection}</td>
      <td>
        <a href={href} title={title}>
          {title}
        </a>
      </td>
      {cells.map((cell, i) => (
        <td key={i}>{cell}</td>
      ))}
      <td>{actions}</td>
    </tr>
  );
}

/** Resource status uses the common dot-and-label recipe, not a filled capsule. */
export function ResourceStatus({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span className="crystra-resource-status" data-tone={tone}>
      {label}
    </span>
  );
}
