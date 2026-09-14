import { Card, Typography, Button } from "./design-system";
import "../task-gate-panel.css";
export interface TaskGateProjection {
  id: string;
  question: string;
  trigger: string;
  location: string;
  status: string;
  impact: string;
  decisions: readonly string[];
  interpretation: string;
  interpretationStatus: string;
  deltas: readonly { mark: string; text: string; tone: string }[];
  previewTitle: string;
  previewStatus: string;
  steps: readonly (readonly [string, string])[];
  preserved: string;
  evidence: readonly {
    id: string;
    title: string;
    detail: string;
    action: string;
    tone: string;
  }[];
}
export interface TaskGateQueueItem {
  id: string;
  question: string;
  impact: string;
}
/** A read-only decision projection. Selection and inspection callbacks cannot approve a Gate. */
export function TaskGatePanel({
  queue,
  selectedId,
  data,
  onSelect,
  onInspect,
}: {
  queue: readonly TaskGateQueueItem[];
  selectedId: string;
  data: TaskGateProjection;
  onSelect: (id: string) => void;
  onInspect?: (id: string) => void;
}) {
  return (
    <section
      className="crystra-task-gate"
      data-section-id="gate-review-workbench"
    >
      <section
        className="crystra-gate-overview"
        data-section-id="gate-review-overview"
      >
        <div className="crystra-gate-overview-line">
          <details data-section-id="gate-decision-queue">
            <summary>待决策 {queue.length}</summary>
            <div className="crystra-gate-queue">
              {queue.map((item) => (
                <Button
                  key={item.id}
                  aria-pressed={item.id === selectedId}
                  onClick={() => onSelect(item.id)}
                >
                  <span>{item.question}</span>
                  <span>{item.impact}</span>
                </Button>
              ))}
            </div>
          </details>
          <Typography as="span" variant="meta">
            {data.impact}
          </Typography>
        </div>
        <Typography as="p" variant="meta" tone="muted">
          审核检查点 · {data.id}
        </Typography>
        <Typography as="h2" variant="section-title">
          {data.question}
        </Typography>
        <Typography as="p" variant="description" tone="secondary">
          触发原因：{data.trigger}
        </Typography>
        <Typography as="p" variant="meta" tone="muted">
          位置：{data.location}
        </Typography>
        <Typography as="p" variant="meta">
          {data.status}
        </Typography>
      </section>
      <Card heading="当前决策状态" data-section-id="gate-decision-state">
        <section data-section-id="gate-relevant-decisions">
          <Typography as="h3" variant="body-compact">
            与本次问题相关的已确认决定
          </Typography>
          <ul className="crystra-gate-decisions">
            {data.decisions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section
          className="crystra-gate-interpretation"
          data-section-id="gate-current-interpretation"
        >
          <header>
            <Typography as="h3" variant="card-title">
              AI 当前理解
            </Typography>
            <Typography as="span" variant="meta">
              {data.interpretationStatus}
            </Typography>
          </header>
          <Typography as="p" variant="body-compact">
            {data.interpretation}
          </Typography>
        </section>
        <section data-section-id="gate-understanding-delta">
          <Typography as="h3" variant="body-compact">
            相对既有决定
          </Typography>
          <ul className="crystra-gate-deltas">
            {data.deltas.map((delta, index) => (
              <li key={index} data-tone={delta.tone}>
                <span aria-hidden="true">{delta.mark}</span>
                {delta.text}
              </li>
            ))}
          </ul>
        </section>
      </Card>
      <Card heading="确认后的控制效果" data-section-id="gate-execution-preview">
        <header>
          <Typography as="h3" variant="body-compact">
            {data.previewTitle}
          </Typography>
          <Typography as="span" variant="meta">
            {data.previewStatus}
          </Typography>
        </header>
        <ol className="crystra-gate-steps">
          {data.steps.map(([title, detail], index) => (
            <li key={index}>
              <Typography as="h4" variant="body-compact">
                {title}
              </Typography>
              <Typography as="p" variant="description" tone="muted">
                {detail}
              </Typography>
            </li>
          ))}
        </ol>
        <Typography as="p" variant="meta" tone="muted">
          {data.preserved}
        </Typography>
      </Card>
      <Card
        heading="证据与上下文"
        description="快速核对当前问题的来源、边界与执行事实"
        data-section-id="gate-evidence"
      >
        <div className="crystra-gate-evidence">
          {data.evidence.map((item) => {
            const content = (
              <>
                <Typography as="span" variant="body-compact">
                  {item.title}
                </Typography>
                <Typography as="span" variant="meta" tone="muted">
                  {item.detail}
                </Typography>
                <Typography as="span" variant="meta">
                  {item.action}
                </Typography>
              </>
            );
            return onInspect ? (
              <Button
                key={item.id}
                aria-label={`${item.title} ${item.detail} ${item.action}`}
                onClick={() => onInspect(item.id)}
              >
                {content}
              </Button>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
