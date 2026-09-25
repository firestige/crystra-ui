import { WorkbenchContext } from "./components/crystra-dsh/task-workbench/workbench-context";
import { createWorkbenchStore } from "./components/crystra-dsh/task-workbench/workbench-store";
import { createWorkflowsApi } from "./components/crystra-dsh/workflows/workflows-api";
import {
  createWorkflowsStore,
  createWorkflowsResource,
} from "./components/crystra-dsh/workflows/workflows-resource";
import { WorkflowsProvider } from "./components/crystra-dsh/workflows/workflows-provider";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { executionRpc } from "./execution-rpc";
import { createExecutionTasksApi } from "./components/crystra-dsh/tasks/execution-tasks-api";
import {
  createTasksStore,
  createTasksResource,
} from "./components/crystra-dsh/tasks/tasks-resource";
import { TasksProvider } from "./components/crystra-dsh/tasks/tasks-provider";
// The dev shell stands in for DSH's store-instance and host lifecycle ownership.
const resource = createTasksResource(
  createExecutionTasksApi(executionRpc),
  createTasksStore().create(),
);
const workflows = createWorkflowsResource(
  createWorkflowsApi(executionRpc),
  createWorkflowsStore().create(),
);
const workbench = createWorkbenchStore().create();
const root = createRoot(document.getElementById("root")!);
root.render(
  <TasksProvider resource={resource}>
    <WorkflowsProvider resource={workflows}>
      <WorkbenchContext.Provider value={workbench}>
        <App />
      </WorkbenchContext.Provider>
    </WorkflowsProvider>
  </TasksProvider>,
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    resource.dispose();
    workflows.dispose();
    root.unmount();
  });
