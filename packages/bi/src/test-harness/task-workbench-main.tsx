import { TaskPlanExploration } from "./task-plan-exploration";
import { TaskExecutionExploration } from "./task-execution-exploration";
import { TaskGateExploration } from "./task-gate-exploration";
import { taskDeliveryExploration } from "./task-delivery-exploration";
import { taskRequirementsExploration } from "./task-requirements-exploration";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BiSurface,
  CrystraShell,
  TaskWorkbench,
  TaskRequirementsPanel,
  TaskDeliveryPanel,
  type TaskWorkbenchPage,
} from "../public";
export function TaskFrameScenario() {
  const [page, setPage] = useState<TaskWorkbenchPage>("gate");
  return (
    <BiSurface
      theme="dark"
      data-crystra-theme="dark"
      className="task-frame-test"
    >
      <style>
        {
          ".task-frame-test{height:100vh}.task-frame-test [data-host-owned] textarea{width:100%;height:100%;resize:none;background:#15191f;color:white}"
        }
      </style>
      <CrystraShell
        route="task"
        tasks={[]}
        workflows={[]}
        onNavigate={() => {}}
        onOpenHarness={() => {}}
        onNewTask={() => {}}
        onOpenSettings={() => {}}
      >
        <TaskWorkbench
          title="工作台结构验收"
          workspace="隔离测试输入，不是真实 Task"
          page={page}
          onPageChange={setPage}
          systemFocus="execution"
          input={
            <textarea aria-label="宿主输入替身" defaultValue="未发送草稿" />
          }
          panels={{
            grilling: (
              <TaskRequirementsPanel data={taskRequirementsExploration} />
            ),
            plan: <TaskPlanExploration />,
            execution: <TaskExecutionExploration />,
            gate: <TaskGateExploration />,
            delivery: <TaskDeliveryPanel data={taskDeliveryExploration} />,
          }}
        />
      </CrystraShell>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<TaskFrameScenario />);
