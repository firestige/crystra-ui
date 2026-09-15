import { useState, type ReactNode } from "react";
import { Button, Card, Typography } from "./design-system";
import "../task-execution-panel.css";
export interface TaskRunIdentity {
  planRun: string;
  wave: string;
  workflow: string;
  workflowRun: string;
  traceRoot: string;
}
export interface TaskWaveProjection {
  id: string;
  title: string;
  status: string;
  identity: TaskRunIdentity;
  progress: string;
  output: string;
  boundary: string;
}
export interface TaskExecutionProjection {
  title: string;
  summary: string;
  metrics: readonly { label: string; value: string }[];
  frontier: string;
  waves: readonly TaskWaveProjection[];
}
/** Plan Run and Workflow Run are distinct views; opening a Wave never starts execution. */
export function TaskExecutionPanel({
  data,
  renderPlanGraph,
  renderWaveGraph,
  onAnalysis,
}: {
  data: TaskExecutionProjection;
  renderPlanGraph: (select: (id: string) => void) => ReactNode;
  renderWaveGraph: (wave: TaskWaveProjection) => ReactNode;
  onAnalysis?: (identity: TaskRunIdentity) => void;
}) {
  const [selected, setSelected] = useState<string>();
  const wave = data.waves.find((item) => item.id === selected);
  if (wave)
    return (
      <section
        className="crystra-task-execution"
        data-section-id="execution-wave-run-detail"
      >
        <header className="crystra-execution-header">
          <Button onClick={() => setSelected(undefined)}>返回计划执行</Button>
          <Typography as="span" variant="meta">
            计划执行 / {wave.title} / 工作流运行
          </Typography>
          {onAnalysis && (
            <Button onClick={() => onAnalysis(wave.identity)}>
              在分析中查看
            </Button>
          )}
        </header>
        <details className="crystra-execution-metadata">
          <summary>运行身份</summary>
          <dl>
            {Object.entries(wave.identity).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
        <Card
          heading={wave.title}
          description={wave.status}
          data-section-id="execution-dashboard"
        >
          <Typography as="p" variant="description">
            已发生路径与下一步候选
          </Typography>
          {renderWaveGraph(wave)}
        </Card>
        <div className="crystra-execution-bottom">
          <Card heading="当前节点" description={wave.status}>
            <Typography as="p" variant="body-compact">
              {wave.progress}
            </Typography>
          </Card>
          <Card heading="当前产出">
            <Typography as="p" variant="body-compact">
              {wave.output}
            </Typography>
          </Card>
        </div>
        <Card heading="下一个控制边界">
          <Typography as="p" variant="body-compact">
            {wave.boundary}
          </Typography>
        </Card>
      </section>
    );
  return (
    <section
      className="crystra-task-execution"
      data-section-id="execution-plan-run-overview"
    >
      <header className="crystra-execution-header">
        <div>
          <Typography as="h2" variant="section-title">
            {data.title}
          </Typography>
          <Typography as="p" variant="description" tone="secondary">
            {data.summary}
          </Typography>
        </div>
      </header>
      <dl className="crystra-execution-metrics">
        {data.metrics.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <Card
        heading="计划 DAG 的实际执行投影"
        description="节点是 Wave 或 Gate；选择 Wave 可查看其内部 Workflow Run"
        data-section-id="execution-plan-run-map"
      >
        {renderPlanGraph((id) => {
          if (data.waves.some((item) => item.id === id)) setSelected(id);
        })}
      </Card>
      <Card heading="当前执行前沿" data-section-id="execution-plan-frontier">
        <Typography as="p" variant="body-compact">
          {data.frontier}
        </Typography>
      </Card>
    </section>
  );
}
