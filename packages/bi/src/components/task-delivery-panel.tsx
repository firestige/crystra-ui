import { Card, Typography, Button, type SemanticTone } from "./design-system";
import "../task-delivery-panel.css";
export interface TaskDeliveryProjection {
  readiness: {
    title: string;
    description: string;
    coverage: string;
    tone: SemanticTone;
  };
  recalculation: string;
  artifacts: readonly {
    id: string;
    name: string;
    detail: string;
    status: string;
  }[];
  acceptance: readonly { id: string; label: string; status: string }[];
  risk: string;
  economics: readonly { label: string; value: string }[];
}
/** Delivery is a current projection, never a task-closing or release-authorizing command. */
export function TaskDeliveryPanel({
  data,
  onOpenArtifact,
}: {
  data: TaskDeliveryProjection;
  onOpenArtifact?: (id: string) => void;
}) {
  return (
    <section
      className="crystra-task-delivery"
      data-section-id="delivery-workbench"
    >
      <section
        className="crystra-delivery-readiness"
        data-section-id="delivery-current-readiness"
        data-tone={data.readiness.tone}
      >
        <div>
          <Typography as="h2" variant="section-title">
            {data.readiness.title}
          </Typography>
          <Typography as="p" variant="description" tone="secondary">
            {data.readiness.description}
          </Typography>
        </div>
        <Typography as="span" variant="body-compact">
          {data.readiness.coverage}
        </Typography>
      </section>
      <aside
        className="crystra-delivery-recalculation"
        data-section-id="delivery-readiness-invalidated-by-input"
      >
        <Typography as="p" variant="description" tone="secondary">
          {data.recalculation}
        </Typography>
      </aside>
      <div className="crystra-delivery-columns">
        <Card heading="当前交付候选" data-section-id="delivery-artifacts">
          <ul className="crystra-delivery-artifacts">
            {data.artifacts.map((artifact) => (
              <li key={artifact.id}>
                <div>
                  {onOpenArtifact ? (
                    <Button onClick={() => onOpenArtifact(artifact.id)}>
                      {artifact.name}
                    </Button>
                  ) : (
                    <Typography as="p" variant="body-compact">
                      {artifact.name}
                    </Typography>
                  )}
                  <Typography as="p" variant="meta" tone="muted">
                    {artifact.detail}
                  </Typography>
                </div>
                <Typography as="span" variant="meta" tone="secondary">
                  {artifact.status}
                </Typography>
              </li>
            ))}
          </ul>
        </Card>
        <Card heading="当前验收覆盖" data-section-id="delivery-acceptance">
          <ul className="crystra-delivery-acceptance">
            {data.acceptance.map((item) => (
              <li key={item.id}>
                <Typography as="span" variant="body-compact">
                  {item.label}
                </Typography>
                <Typography as="span" variant="meta" tone="secondary">
                  {item.status}
                </Typography>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="crystra-delivery-bottom">
        <Card heading="当前残余风险" data-section-id="delivery-residual-risk">
          <Typography as="p" variant="body-compact" tone="secondary">
            {data.risk}
          </Typography>
        </Card>
        <Card heading="任务累计成本" data-section-id="delivery-economics">
          <dl className="crystra-delivery-economics">
            {data.economics.map((item) => (
              <div key={item.label}>
                <dt>
                  <Typography variant="meta" tone="muted">
                    {item.label}
                  </Typography>
                </dt>
                <dd>
                  <Typography variant="section-title">{item.value}</Typography>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </section>
  );
}
