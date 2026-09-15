import { WorkflowMapViewCore } from "./workflow-map-view-core";
import { WorkflowCrystallization } from "./workflow-crystallization";
import {
  layoutWorkflowMap,
  type MapLayout,
} from "../domain/workflow-map-engine";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import development from "../domain/workflow-map-development.json";
import architecture from "../domain/workflow-map-architecture.json";
import research from "../domain/workflow-map-research.json";
declare global {
  interface Window {
    crystraWorkflowMapCandidate?: {
      samples: WorkflowMapIR[];
      layout: (
        ir: WorkflowMapIR,
        expanded: ReadonlySet<string>,
        direction: string,
      ) => MapLayout | null;
    };
  }
}
const candidatePreview =
  typeof window !== "undefined"
    ? window.crystraWorkflowMapCandidate
    : undefined;
const samples =
  candidatePreview?.samples ||
  ([development, architecture, research] as WorkflowMapIR[]);
const previewLayout = async (
  ir: WorkflowMapIR,
  expanded: ReadonlySet<string>,
  direction: "RIGHT" | "DOWN",
  bounds?: { width: number; height: number },
) => {
  if (candidatePreview) {
    const result = candidatePreview.layout(ir, expanded, direction);
    if (!result)
      throw Error(
        "当前优先候选仅预生成三套样本；修改后的定义需重新运行候选布局生成器。",
      );
    return result;
  }
  return layoutWorkflowMap(ir, expanded, direction, bounds);
};

/** Standalone design exploration only; production uses WorkflowMapViewer. */
export function WorkflowMapWorkbench(props: {
  onIdentity: (title: string, description: string) => void;
  mode: string;
  onWorkflow?: (ir: WorkflowMapIR) => void;
  requestedNode?: { id: string; seq: number } | null;
}) {
  return (
    <WorkflowMapViewCore
      {...props}
      initialIR={samples[0]}
      examples={samples}
      resolveLayout={previewLayout}
      exploration
      precomputedLayout={!!candidatePreview}
      resourceWorkspaceForTitle={(title) =>
        window.crystraResourceWorkspaces?.find((w) => w.title === title)?.root
      }
      renderCrystallization={(quote) => (
        <WorkflowCrystallization quote={quote} />
      )}
    />
  );
}
