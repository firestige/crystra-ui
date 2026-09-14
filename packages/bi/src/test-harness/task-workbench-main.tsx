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
  Card,
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
            plan: <Card heading="计划投影">测试内容</Card>,
            execution: <Card heading="执行投影">测试内容</Card>,
            gate: <TaskGateExploration />,
            delivery: <TaskDeliveryPanel data={taskDeliveryExploration} />,
          }}
        />
      </CrystraShell>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<TaskFrameScenario />);
