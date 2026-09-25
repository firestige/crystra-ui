import { useMemo, useState } from "react";
import {
  WorkflowMapReadonly,
  type WorkflowMapIR,
  Card,
  Typography,
} from "../public";
import "./plan-graph.css";
export interface PlanGraphProjection {
  nodes: {
    id: string;
    title: string;
    kind: string;
    shape?: "activity" | "decision";
    rank: number;
    details: string[];
  }[];
  edges: { id: string; from: string; to: string; label: string }[];
}
/** Read-only view. Ranks are projection layout; no runtime state inferred. */
export function PlanGraph({
  data,
  compact = false,
}: {
  data: PlanGraphProjection;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const node = data.nodes.find((n) => n.id === selected);
  const ir = useMemo<WorkflowMapIR>(
    () => ({
      version: "0.2",
      title: "计划前驱图",
      nodes: data.nodes.map((n) => ({
        id: n.id,
        title: n.title,
        kind: n.shape ?? "activity",
      })),
      edges: data.edges.map((e) => ({
        id: e.id,
        from: e.from,
        to: e.to,
        label: compact ? undefined : e.label,
        kind: "control",
      })),
    }),
    [data, compact],
  );
  const labels = useMemo(
    () => Object.fromEntries(data.nodes.map((n) => [n.id, n.kind])),
    [data],
  );
  return (
    <div className="crystra-plan-graph">
      <WorkflowMapReadonly
        ir={ir}
        labels={labels}
        edgeLabels={Object.fromEntries(data.edges.map((e) => [e.id, e.label]))}
        selected={selected}
        onSelect={setSelected}
        compact={compact}
      />
      {!compact && (
        <Typography as="p" variant="description" tone="muted">
          箭头表示前驱依赖；所有必需前驱满足后才能继续。选择节点查看条件与门禁。
        </Typography>
      )}
      {node && (
        <Card heading={node.title} description={`${node.kind} · ${node.id}`}>
          <ul>
            {node.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          {data.edges.some((e) => e.to === node.id) && (
            <>
              <Typography as="h4" variant="item-title">
                必需前驱（全部满足）
              </Typography>
              <ul>
                {data.edges
                  .filter((e) => e.to === node.id)
                  .map((e) => (
                    <li key={e.id}>
                      {data.nodes.find((n) => n.id === e.from)?.title}：
                      {e.label}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
