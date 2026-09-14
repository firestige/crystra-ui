import { useState, type ReactNode } from "react";
import { Card, Typography, Button } from "./design-system";
import "../task-plan-panel.css";

export interface TaskPlanProjection {
  identity: string;
  status: string;
  question: string;
  goal: string;
  completion: string;
  nonGoals: string;
  readiness: readonly {
    id: string;
    title: string;
    status: string;
    items: readonly { label: string; value: string }[];
  }[];
  attention: readonly string[];
  changes: readonly string[];
}
/** Read-only plan composition. All document and graph content belongs to the supplied exact plan. */
export function TaskPlanPanel({
  data,
  summaryGraph,
  renderDocument,
  renderDag,
}: {
  data: TaskPlanProjection;
  summaryGraph: ReactNode;
  renderDocument: (identity: string) => ReactNode;
  renderDag: (identity: string) => ReactNode;
}) {
  const [view, setView] = useState<"summary" | "document" | "dag">("summary");
  if (view !== "summary")
    return (
      <section
        className="crystra-task-plan"
        data-section-id={
          view === "document" ? "plan-document-viewer" : "plan-full-dag"
        }
      >
        <header className="crystra-plan-view-header">
          <Button onClick={() => setView("summary")}>返回计划摘要</Button>
          <Typography as="span" variant="meta">
            {data.identity} · 只读
          </Typography>
        </header>
        {view === "document"
          ? renderDocument(data.identity)
          : renderDag(data.identity)}
      </section>
    );
  return (
    <section className="crystra-task-plan" data-section-id="plan-summary">
      <header className="crystra-plan-overview" data-section-id="plan-overview">
        <div>
          <Typography as="h2" variant="section-title">
            {data.identity} · {data.status}
          </Typography>
          <Typography as="p" variant="description" tone="secondary">
            {data.question}
          </Typography>
        </div>
        <Button onClick={() => setView("document")}>查看完整计划</Button>
      </header>
      <Card heading="目标与完成判定" data-section-id="plan-outcome-summary">
        <Typography as="p" variant="body-compact">
          {data.goal}
        </Typography>
        <dl className="crystra-plan-outcome">
          <div>
            <dt>完成标准</dt>
            <dd>{data.completion}</dd>
          </div>
          <div>
            <dt>非目标</dt>
            <dd>{data.nonGoals}</dd>
          </div>
        </dl>
      </Card>
      <Card
        heading="当前计划结构"
        description={`${data.identity} · 可由追加目标或 Replan 产生新版本`}
        data-section-id="plan-dag-projection"
      >
        <Button onClick={() => setView("dag")}>查看完整 DAG</Button>
        {summaryGraph}
      </Card>
      <div
        className="crystra-plan-readiness"
        data-section-id="plan-readiness-summaries"
      >
        {data.readiness.map((item) => (
          <Card key={item.id} heading={item.title} description={item.status}>
            <dl>
              {item.items.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
      <div className="crystra-plan-notes">
        <Card heading="需要关注" data-section-id="plan-attention-summary">
          <ul>
            {data.attention.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card heading="相较上一版的变更" data-section-id="plan-change-summary">
          <ul>
            {data.changes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
