import { type ReactNode } from "react";
import { Tabs } from "./collection-components";
import { Typography } from "./design-system";
import "../task-workbench.css";
const pages = [
  ["grilling", "需求"],
  ["plan", "计划"],
  ["execution", "执行"],
  ["gate", "审核"],
  ["delivery", "交付"],
] as const;
export type TaskWorkbenchPage = (typeof pages)[number][0];
/** Accepted Task shell composition. The host owns Input and all semantic projections. */
export function TaskWorkbench({
  title,
  workspace,
  context,
  summary,
  input,
  page,
  onPageChange,
  systemFocus,
  panels,
}: {
  title: string;
  workspace: string;
  context?: ReactNode;
  summary?: ReactNode;
  input: ReactNode;
  page: TaskWorkbenchPage;
  onPageChange: (page: TaskWorkbenchPage) => void;
  systemFocus?: TaskWorkbenchPage;
  panels: Record<TaskWorkbenchPage, ReactNode>;
}) {
  return (
    <section
      className="crystra-task-workbench"
      data-section-id="task-workspace"
    >
      <header data-section-id="workspace-header">
        <div>
          <Typography as="h1" variant="page-title">
            {title}
          </Typography>
          <Typography as="p" variant="description" tone="secondary">
            {workspace}
          </Typography>
        </div>
        {context && <div data-section-id="task-context">{context}</div>}
      </header>
      <div data-section-id="task-layout-region">
        <section data-section-id="input-stream" data-host-owned="dsh-input">
          {input}
        </section>
        <section data-section-id="control-workspace">
          {summary && (
            <div data-section-id="task-execution-summary">{summary}</div>
          )}
          <div data-section-id="task-workbench-navigation">
            <Tabs
              aria-label="任务工作面"
              value={page}
              onValueChange={(next) => onPageChange(next as TaskWorkbenchPage)}
              items={pages.map(([value, label]) => ({
                value,
                label: (
                  <span data-section-id={`workbench-nav-${value}`}>
                    {label}
                    {systemFocus === value && (
                      <span
                        data-section-id="workbench-system-focus"
                        aria-label={`系统当前工作面：${label}`}
                        className="crystra-task-focus"
                      />
                    )}
                  </span>
                ),
                panel: (
                  <section
                    data-control-surface={value}
                    className="crystra-task-panel"
                  >
                    {panels[value]}
                  </section>
                ),
              }))}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
