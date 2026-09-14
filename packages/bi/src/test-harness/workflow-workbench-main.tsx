import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  BiSurface,
  WorkflowWorkbench,
  type WorkflowWorkbenchPage,
} from "../public";
export function Scenario() {
  const [page, setPage] = useState<WorkflowWorkbenchPage>("studio");
  return (
    <BiSurface
      theme="dark"
      data-crystra-theme="dark"
      className="workflow-workbench-harness"
    >
      <style>
        {
          "html,body,#root{margin:0;height:100%}.workflow-workbench-harness{height:100vh}"
        }
      </style>
      <WorkflowWorkbench
        definitionId="exploration-only"
        revision="draft.1"
        title="工作流布局检查"
        description="独立交互样本"
        page={page}
        onPageChange={setPage}
        input={<textarea aria-label="隔离 Input 替身" />}
        panels={{
          studio: <p>流程设计位置</p>,
          resources: <p>资源配置位置</p>,
          crystallization: <p>结晶分析位置</p>,
        }}
      />
      <aside role="note" style={{ position: "fixed", bottom: 4, right: 4 }}>
        草案探索 · Input 为隔离替身
      </aside>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<Scenario />);
