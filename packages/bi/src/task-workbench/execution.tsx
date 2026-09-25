import { useState, type ComponentType, type ComponentProps } from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Typography,
  WorkbenchSummaryCard,
  WorkflowMapReadonly,
  type WorkflowMapIR,
  type SemanticTone,
} from "../public";
import "./execution.css";
export interface ExecutionMotion {
  nodeId: string;
  edgeIds: string[];
  pace: "normal" | "slow" | "fast" | "error";
}
export type ExecutionMapProps = ComponentProps<typeof WorkflowMapReadonly> & {
  motion?: ExecutionMotion;
  effectsEnabled?: boolean;
};
export interface ExecutionRunIdentity {
  deliveryId?: string;
  taskId: string;
  planRunId: string;
  waveId: string;
  runId: string;
}
export interface ExecutionWave {
  id: string;
  title: string;
  status: string;
  tone: SemanticTone;
  outcome: string;
  run?: {
    identity: ExecutionRunIdentity;
    graph?: WorkflowMapIR;
    motion?: ExecutionMotion;
    traversedEdgeIds?: string[];
    calls?: {
      id: string;
      actionId: string;
      label: string;
      status: string;
      predecessors: string[];
      sequence: number;
    }[];
    observed: string[];
    frontier: string[];
    candidates: string[];
    nodes: {
      id: string;
      title: string;
      status: string;
      tone?: SemanticTone;
      elapsed?: string;
      progress?: number;
      output?: string;
      checks?: string[];
      nextBoundary?: string;
    }[];
  };
}
/** Read-only owner projection. Counts, frontiers and status are supplied, not inferred. */
export interface ExecutionProjection {
  planRevision: string;
  planRunId: string;
  summary: string;
  tone?: SemanticTone;
  monitor?: { revision: number; status: "live" | "stale" | "recovering" };
  facts: { label: string; value: string }[];
  graph?: WorkflowMapIR;
  waves: ExecutionWave[];
  motion?: ExecutionMotion;
}
export function ExecutionWorkbench({
  data,
  MapComponent = WorkflowMapReadonly,
}: {
  data?: ExecutionProjection;
  MapComponent?: ComponentType<ExecutionMapProps>;
}) {
  return (
    <ExecutionView
      key={data?.planRunId ?? "unavailable"}
      data={data}
      MapComponent={MapComponent}
    />
  );
}
function ExecutionView({
  data,
  MapComponent = WorkflowMapReadonly,
}: {
  data?: ExecutionProjection;
  MapComponent?: ComponentType<ExecutionMapProps>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const connected = !data?.monitor || data.monitor.status === "live";
  return (
    <section
      className="crystra-execution"
      data-section-id="execution-workbench"
    >
      {data?.monitor && (
        <div className="crystra-monitor-status" role="status">
          <Chip tone={connected ? "neutral" : "warning"}>
            {connected
              ? "实时检视"
              : data.monitor.status === "stale"
                ? "连接中断 · 保留最后快照"
                : "恢复中 · 等待 Execution 快照"}
          </Chip>
          <span>当前 Plan · 快照 #{data.monitor.revision}</span>
        </div>
      )}
      <div>
        <WorkbenchSummaryCard
          data-section-id="execution-plan-run-overview"
          icon="activity"
          tone={data ? (data.tone ?? "primary") : "neutral"}
          title="计划执行总览"
          description={
            data
              ? `计划 ${data.planRevision} · ${data.summary}`
              : "执行投影尚不可用"
          }
          facts={data?.facts}
        />
        <div className="crystra-execution-grid">
          <Card
            heading="计划 DAG 的实际执行投影"
            description="当前 Plan 的 Wave 状态与执行前沿。"
            data-section-id="execution-plan-run-map"
          >
            {data?.graph ? (
              <MapComponent
                ir={data.graph}
                selected={selected}
                onSelect={setSelected}
                motion={data.motion}
                effectsEnabled={connected}
                labels={Object.fromEntries(
                  data.waves.map((w) => [w.id, w.status]),
                )}
                nodeTones={Object.fromEntries(
                  data.waves.map((w) => [w.id, w.tone]),
                )}
              />
            ) : (
              <EmptyState label="尚无可读取的 Plan Run 图" />
            )}
          </Card>
          <Card heading="Wave 产出" data-section-id="execution-wave-outcomes">
            {!data ? (
              <EmptyState label="Wave 运行身份与产出尚不可用" />
            ) : data.waves.length === 0 ? (
              <EmptyState label="当前计划没有 Wave" />
            ) : (
              data.waves.map((w) => (
                <div className="crystra-execution-wave" key={w.id}>
                  <Button
                    appearance="ghost"
                    selected={w.id === selected}
                    onClick={() => setSelected(w.id)}
                  >
                    {w.title}
                  </Button>
                  <Chip tone={w.tone}>{w.status}</Chip>
                  <Typography as="p" variant="description">
                    {w.outcome}
                  </Typography>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
