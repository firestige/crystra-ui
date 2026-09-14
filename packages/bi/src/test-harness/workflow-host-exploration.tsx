import { useState } from "react";
import {
  WorkflowWorkbench,
  type WorkflowWorkbenchPage,
} from "../components/workflow-workbench";
import { WorkflowMapViewer } from "../components/workflow-map-viewer";
import {
  workflowDesignDefinitions,
  workflowExplorationEntries,
  resolveWorkflowDesignLayout,
} from "./workflow-map-design";
const identity = () => {};
export function WorkflowHostExploration({
  definitionId,
  revision,
}: {
  definitionId: string;
  revision: string;
}) {
  const [page, setPage] = useState<WorkflowWorkbenchPage>("studio"),
    [header, setHeader] = useState<HTMLDivElement | null>(null);
  const entry = workflowExplorationEntries[0];
  if (definitionId !== entry.definitionId || revision !== entry.revision)
    return <p role="status">当前精确身份没有对应的探索样本。</p>;
  return (
    <>
      <WorkflowWorkbench
        definitionId={definitionId}
        revision={revision}
        title={entry.title}
        description={entry.purpose}
        page={page}
        onPageChange={setPage}
        context={<div ref={setHeader} />}
        input={
          <p role="status" style={{ padding: 16 }}>
            这是定稿工作流的独立设计样本，尚未关联本实例的包工作区与会话。
          </p>
        }
        panels={{
          studio: (
            <WorkflowMapViewer
              initialIR={workflowDesignDefinitions[0]}
              resolveLayout={resolveWorkflowDesignLayout}
              mode="studio"
              onIdentity={identity}
              headerContainer={page === "studio" ? header : null}
            />
          ),
          resources: <p role="status">资源配置接入中。</p>,
          crystallization: <p role="status">结晶投影接入中。</p>,
        }}
      />
      <aside
        role="note"
        style={{
          position: "fixed",
          bottom: 4,
          right: 8,
          zIndex: 2147483640,
          padding: 4,
          background: "#17253a",
          color: "white",
          fontSize: 11,
        }}
      >
        草案探索 · v8 定稿工作流样本，非运行事实
      </aside>
    </>
  );
}
