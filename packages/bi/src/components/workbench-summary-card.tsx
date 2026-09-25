import type { ReactNode } from "react";
import {
  Card,
  Chip,
  Typography,
  type CardProps,
  type SemanticTone,
} from "./design-system";
import { Icon, type IconName } from "./icon";
import "../workbench-summary-card.css";
export interface WorkbenchSummaryCardProps extends Omit<
  CardProps,
  "heading" | "description" | "actions" | "children" | "title"
> {
  title: ReactNode;
  icon: IconName;
  description?: ReactNode;
  facts?: readonly { label: string; value: ReactNode }[];
  notices?: readonly { text: string; tone?: SemanticTone }[];
  actions?: ReactNode;
}
/** Semantic overview composed from Card. The caller supplies facts/tone, never layout. */
export function WorkbenchSummaryCard({
  title,
  icon,
  description,
  facts = [],
  notices = [],
  actions,
  tone = "neutral",
  className,
  ...props
}: WorkbenchSummaryCardProps) {
  return (
    <Card
      {...props}
      tone={tone}
      className={["crystra-workbench-summary", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="crystra-summary-layout">
        <span className="crystra-summary-icon">
          <Icon name={icon} size="context-marker" />
        </span>
        <div className="crystra-summary-copy">
          <Typography as="h2" variant="section-title">
            {title}
          </Typography>
          {description && (
            <Typography as="p" variant="description" tone="secondary">
              {description}
            </Typography>
          )}
        </div>
        {(facts.length > 0 || notices.length > 0 || actions) && (
          <div className="crystra-summary-context">
            {facts.length > 0 && (
              <dl className="crystra-summary-facts">
                {facts.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {notices.length > 0 && (
              <div className="crystra-summary-notices">
                {notices.map(({ text, tone: noticeTone }) => (
                  <Chip key={text} tone={noticeTone ?? tone}>
                    {text}
                  </Chip>
                ))}
              </div>
            )}
            {actions && (
              <div className="crystra-summary-actions">{actions}</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
