import { useState, type ReactNode } from "react";
import { Button, IconButton, Typography } from "./design-system";
import { List, ListItem } from "./collection-components";
import { SearchField } from "./state-components";
import "../crystra-shell.css";

export type CrystraPage =
  | "tasks"
  | "task"
  | "workflows"
  | "workflow"
  | "analysis-overview"
  | "analysis-traces"
  | "analysis-reports";
export interface CrystraNavigationRecord {
  id: string;
  title: string;
  revision?: string;
}
export interface CrystraShellProps {
  route: CrystraPage;
  selectedId?: string;
  tasks: readonly CrystraNavigationRecord[];
  workflows: readonly CrystraNavigationRecord[];
  onNavigate: (page: CrystraPage, id?: string, revision?: string) => void;
  onOpenHarness: () => void;
  onNewTask: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
  settings?: ReactNode;
}

/** v8 layout composition; the host owns identities, navigation and persistence. */
export function CrystraShell(props: CrystraShellProps) {
  const [taskQuery, setTaskQuery] = useState("");
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [expanded, setExpanded] = useState({
    task: true,
    workflow: true,
    analysis: true,
  });
  const toggle = (key: keyof typeof expanded) =>
    setExpanded((old) => ({ ...old, [key]: !old[key] }));
  const records = (
    items: readonly CrystraNavigationRecord[],
    query: string,
    page: "task" | "workflow",
  ) => (
    <List size="compact" selectionAppearance="surface">
      {items
        .filter((item) =>
          `${item.title} ${item.id}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
        .map((item) => (
          <ListItem
            key={item.id}
            primary={item.title}
            selected={props.route === page && props.selectedId === item.id}
            data-object-id={item.id}
            onActivate={() => props.onNavigate(page, item.id, item.revision)}
          />
        ))}
    </List>
  );
  return (
    <div className="crystra-product-shell" data-product-surface="crystra">
      <aside data-section-id="sidebar" aria-label="Crystra 导航">
        <Button
          appearance="ghost"
          data-section-id="surface-banner"
          aria-label="切换到 DeepSeek Harness"
          onClick={props.onOpenHarness}
        >
          Crystra
        </Button>
        <Button
          appearance="outline"
          data-section-id="new-task-action"
          onClick={props.onNewTask}
        >
          新建 Task
        </Button>
        <section
          data-section-id="task-working-set"
          data-expanded={expanded.task}
        >
          <header data-section-id="task-section-header">
            <Button
              appearance="ghost"
              aria-expanded={expanded.task}
              onClick={() => toggle("task")}
            >
              任务
            </Button>
            <IconButton
              appearance="ghost"
              aria-label="全部任务"
              data-section-id="all-tasks-action"
              onClick={() => props.onNavigate("tasks")}
            >
              ▾
            </IconButton>
          </header>
          {expanded.task && (
            <div data-section-id="task-section-content">
              <SearchField
                label="搜索任务"
                hideLabel
                value={taskQuery}
                onChange={(event) => setTaskQuery(event.target.value)}
              />
              {records(props.tasks, taskQuery, "task")}
            </div>
          )}
        </section>
        <nav
          data-section-id="workflow-navigation"
          data-expanded={expanded.workflow}
          aria-label="工作流"
        >
          <header data-section-id="workflow-section-header">
            <Button
              appearance="ghost"
              aria-expanded={expanded.workflow}
              onClick={() => toggle("workflow")}
            >
              工作流
            </Button>
            <IconButton
              appearance="ghost"
              aria-label="全部工作流"
              data-section-id="all-workflows-action"
              onClick={() => props.onNavigate("workflows")}
            >
              ▾
            </IconButton>
          </header>
          {expanded.workflow && (
            <div data-section-id="workflow-section-content">
              <SearchField
                label="搜索工作流"
                hideLabel
                value={workflowQuery}
                onChange={(event) => setWorkflowQuery(event.target.value)}
              />
              {records(props.workflows, workflowQuery, "workflow")}
            </div>
          )}
        </nav>
        <nav
          data-section-id="analysis-navigation"
          data-expanded={expanded.analysis}
          aria-label="分析"
        >
          <Button
            appearance="ghost"
            aria-expanded={expanded.analysis}
            onClick={() => toggle("analysis")}
          >
            分析
          </Button>
          {expanded.analysis && (
            <div data-section-id="analysis-secondary-navigation">
              {(
                [
                  ["analysis-overview", "总览", "analysis-dashboard-action"],
                  ["analysis-traces", "调用追踪", "analysis-traces-action"],
                  ["analysis-reports", "研究报表", "analysis-reports-action"],
                ] as const
              ).map(([page, label, id]) => (
                <Button
                  key={page}
                  appearance="ghost"
                  data-section-id={id}
                  aria-current={props.route === page ? "page" : undefined}
                  onClick={() => props.onNavigate(page)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </nav>
        <footer data-section-id="sidebar-footer">
          {props.settings ?? (
            <Button appearance="ghost" onClick={props.onOpenSettings}>
              设置
            </Button>
          )}
          <Typography variant="caption" tone="secondary">
            Crystra
          </Typography>
        </footer>
      </aside>
      <main data-section-id="product-page">{props.children}</main>
    </div>
  );
}
