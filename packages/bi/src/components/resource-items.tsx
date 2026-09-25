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
      className="crystra-resource-card"
      data-selected={selected}
    >
      <label className="crystra-resource-selection">{selection}</label>
      <a className="crystra-resource-link" href={href}>
        <div className="crystra-resource-thumbnail">{thumbnail}</div>
        {progress}
        <div className="crystra-resource-copy">
          <div className="crystra-resource-heading">
            <h3 title={title}>{title}</h3>
            {status}
          </div>
          <p title={subtitle}>{subtitle}</p>
        </div>
      </a>
      <div className="crystra-resource-actions">{actions}</div>
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
    <tr className="crystra-resource-row" data-selected={selected}>
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
