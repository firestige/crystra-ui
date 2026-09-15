import { Card, Typography, type SemanticTone } from "./design-system";
import "../task-requirements-panel.css";
export interface TaskRequirementsProjection {
  heading: string;
  summary: string;
  remaining?: string;
  budget?: string;
  topics: readonly {
    id: string;
    title: string;
    progress: string;
    tone: SemanticTone;
  }[];
  reason?: string;
  briefSummary: string;
  fields: readonly {
    id: string;
    title: string;
    status: string;
    body: string;
    tone: SemanticTone;
  }[];
  changes: readonly { id: string; kind: "added" | "removed"; text: string }[];
}
/** Read-only v8 requirement composition. All business conclusions come from the supplied projection. */
export function TaskRequirementsPanel({
  data,
}: {
  data: TaskRequirementsProjection;
}) {
  return (
    <section
      className="crystra-task-requirements"
      data-section-id="grilling-workbench"
    >
      <section
        className="crystra-requirements-overview"
        data-section-id="grilling-overview"
      >
        <span className="crystra-requirements-marker" aria-hidden="true">
          ?
        </span>
        <div>
          <Typography as="h2" variant="section-title">
            {data.heading}
          </Typography>
          <Typography as="p" variant="meta" tone="muted">
            {data.summary}
          </Typography>
        </div>
        <div className="crystra-requirements-budget">
          <Typography as="p" variant="meta">
            {data.remaining}
          </Typography>
          <Typography as="p" variant="meta" tone="muted">
            {data.budget}
          </Typography>
        </div>
      </section>
      <div className="crystra-requirements-columns">
        <Card data-section-id="grilling-question-map">
          <header>
            <Typography as="h3" variant="card-title">
              问题地图
            </Typography>
            <Typography as="span" variant="meta" tone="muted">
              根据需求澄清 IR 生成
            </Typography>
          </header>
          <ul className="crystra-requirements-topics">
            {data.topics.map((topic) => (
              <li key={topic.id} data-tone={topic.tone}>
                <span className="crystra-requirements-dot" aria-hidden="true" />
                <span>{topic.title}</span>
                <span>{topic.progress}</span>
              </li>
            ))}
          </ul>
          {data.reason && (
            <aside className="crystra-requirements-reason">
              <Typography as="h4" variant="body-compact">
                为何新增这个问题？
              </Typography>
              <Typography as="p" variant="description" tone="muted">
                {data.reason}
              </Typography>
            </aside>
          )}
        </Card>
        <Card data-section-id="grilling-live-brief">
          <header>
            <Typography as="h3" variant="card-title">
              实时简报
            </Typography>
            <Typography as="span" variant="meta" tone="muted">
              {data.briefSummary}
            </Typography>
          </header>
          <dl className="crystra-requirements-fields">
            {data.fields.map((field) => (
              <div key={field.id} data-tone={field.tone}>
                <dt>
                  <Typography as="span" variant="body-compact">
                    {field.title}
                  </Typography>
                  <span className="crystra-requirements-status">
                    {field.status}
                  </span>
                </dt>
                <dd>
                  <Typography as="p" variant="body-compact" tone="secondary">
                    {field.body}
                  </Typography>
                </dd>
              </div>
            ))}
          </dl>
          {data.changes.length > 0 && (
            <section
              data-section-id="grilling-brief-changes"
              className="crystra-requirements-changes"
            >
              <header>
                <Typography as="h4" variant="body-compact">
                  本轮变更
                </Typography>
                <Typography as="span" variant="meta" tone="muted">
                  {data.changes.length} 项更新
                </Typography>
              </header>
              <ul>
                {data.changes.map((change) => (
                  <li key={change.id} data-change={change.kind}>
                    <span aria-hidden="true">
                      {change.kind === "added" ? "+" : "−"}
                    </span>{" "}
                    {change.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Card>
      </div>
    </section>
  );
}
