import { useLayoutEffect, useRef } from "react";
import { Button, Card, Typography } from "./design-system";
import "../task-evidence-context.css";
export interface TaskEvidenceContextProjection {
  id: string;
  kind: string;
  title: string;
  summary: string;
  sections: readonly { title: string; body: string }[];
  references: string;
}
/** Read-only source inspection. Quoted decisions and receipts never grant new authority. */
export function TaskEvidenceContext({
  data,
  onBack,
}: {
  data: TaskEvidenceContextProjection;
  onBack: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = root.current?.closest<HTMLElement>('[role="tabpanel"]');
    if (panel) panel.scrollTop = 0;
  }, [data.id]);
  return (
    <section
      ref={root}
      className="crystra-task-evidence-context"
      data-section-id="gate-context-inspector"
    >
      <header>
        <Button onClick={onBack}>返回当前审核问题</Button>
        <Typography as="span" variant="meta">
          {data.kind} · {data.id}
        </Typography>
      </header>
      <div>
        <Typography as="h2" variant="section-title">
          {data.title}
        </Typography>
        <Typography as="p" variant="description" tone="secondary">
          {data.summary}
        </Typography>
      </div>
      <div className="crystra-evidence-context-columns">
        {data.sections.map((section) => (
          <Card key={section.title} heading={section.title}>
            <pre>{section.body}</pre>
          </Card>
        ))}
      </div>
      <Card heading="精确来源与关联">
        <pre>{data.references}</pre>
      </Card>
    </section>
  );
}
