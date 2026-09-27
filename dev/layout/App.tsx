import { WorkflowV8Assembly } from "./WorkflowV8Assembly";
import { TaskBrowser } from "./components/crystra-dsh/tasks/task-browser";
import { ProductPages } from "../../../wsr-dsh/src/client/shell/product-pages";
import { SettingsDialog } from "./components/crystra-dsh/settings/settings-dialog";
import { executionRpc } from "./execution-rpc";
import { useWorkflows } from "./components/crystra-dsh/workflows/use-workflows";
import { WorkflowsFeedback } from "./components/crystra-dsh/workflows/workflow-views";
import { useState, type MouseEvent } from "react";
import { Sidebar } from "./components/crystra-dsh/sidebar/sidebar";
import { navigate, useRoute } from "./useRoute";
import { ChatPlaceholder, BenchPlaceholder } from "./Placeholders";
import { sidebarFixtures } from "./fixtures";
import { defaultSidebarPreferences } from "./components/crystra-dsh/sidebar/model";
import { projectSidebar } from "../../../wsr-dsh/src/client/navigation/sidebar-model.js";
import { useTasks } from "./components/crystra-dsh/tasks/use-tasks";
import { TasksFeedback } from "./components/crystra-dsh/tasks/task-views";
import "./layout.css";

function followLink(event: MouseEvent<HTMLDivElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const anchor = (event.target as Element).closest<HTMLAnchorElement>(
    "a[href]",
  );
  if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url.pathname + url.search + url.hash);
}
export function App() {
  const route = useRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarPreferences, setSidebarPreferences] = useState(
    defaultSidebarPreferences,
  );
  const tasks = useTasks();
  const workflows = useWorkflows();
  const sidebar = projectSidebar(
    { ...sidebarFixtures, tasks: tasks.items, workflows: workflows.items },
    route,
  );
  const page =
    route.page === "tasks" ? (
      <TaskBrowser onNavigate={navigate} />
    ) : route.page === "workflow" ? (
      <WorkflowV8Assembly
        key={`${route.definitionId}:${route.revision}`}
        route={route}
      />
    ) : (
      <ProductPages
        route={route}
        chat={<ChatPlaceholder />}
        bench={<BenchPlaceholder />}
      />
    );
  return (
    <div
      data-section-id="app-shell"
      data-page={route.page}
      data-sidebar-collapsed={sidebarPreferences.collapsed}
      className="grid h-full overflow-hidden"
      onClick={followLink}
    >
      <Sidebar
        {...sidebar}
        taskFeedback={<TasksFeedback state={tasks} />}
        tasksReady={tasks.phase === "ready"}
        workflowFeedback={<WorkflowsFeedback state={workflows} />}
        workflowsReady={workflows.phase === "ready"}
        preferences={sidebarPreferences}
        onPreferencesChange={setSidebarPreferences}
        onNavigate={navigate}
        onNewTask={() => navigate("/tasks/new")}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen && (
        <SettingsDialog
          rpc={executionRpc}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            void workflows.actions.refresh();
          }}
        />
      )}
      <main
        data-section-id="task-workspace"
        className="relative flex min-w-0 flex-col overflow-hidden bg-[#101216]"
      >
        {page}
      </main>
    </div>
  );
}
