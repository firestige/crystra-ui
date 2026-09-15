import { useState, useEffect, useRef, type ReactNode } from "react";
import { Button, IconButton } from "./design-system";
import { List, ListItem } from "./collection-components";
import { ExpandableSearchField } from "./expandable-search-field";
import { CrystraBrandMark } from "./crystra-brand-mark";
import { Icon } from "./icon";
import "../crystra-shell.css";

export type CrystraPage =
  | "new-task"
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
  createdAt?: string;
  lastActivityAt?: string;
  inactive?: boolean;
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
  initialSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

/** v8 layout composition; the host owns identities, navigation and persistence. */
export function CrystraShell(props: CrystraShellProps) {
  const [collapsed, updateCollapsed] = useState(
    props.initialSidebarCollapsed ?? false,
  );
  const setCollapsed = (value: boolean) => {
    updateCollapsed(value);
    props.onSidebarCollapsedChange?.(value);
  };
  const [flyout, setFlyout] = useState<"task" | "workflow" | "analysis">();
  const navigate = (...args: Parameters<CrystraShellProps["onNavigate"]>) => {
    setFlyout(undefined);
    props.onNavigate(...args);
  };
  const openFlyout = (key: "task" | "workflow" | "analysis") => {
    setExpanded((old) => ({ ...old, [key]: true }));
    setFlyout((old) => (old === key ? undefined : key));
  };
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!flyout) return;
    const close = (event: PointerEvent) => {
      if (!sidebarRef.current?.contains(event.target as Node))
        setFlyout(undefined);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [flyout]);
  const [taskSort, setTaskSort] = useState<"createdAt" | "lastActivityAt">(
    "createdAt",
  );
  const [activeOnly, setActiveOnly] = useState(false);
  const [workflowDescending, setWorkflowDescending] = useState(false);
  const [showVersion, setShowVersion] = useState(true);
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
            primary={
              page === "workflow" && showVersion && item.revision
                ? `${item.title} · ${item.revision}`
                : item.title
            }
            selected={props.route === page && props.selectedId === item.id}
            data-object-id={item.id}
            onActivate={() => navigate(page, item.id, item.revision)}
          />
        ))}
    </List>
  );
  return (
    <div
      className="crystra-product-shell"
      data-product-surface="crystra"
      data-sidebar-collapsed={collapsed}
      onKeyDown={(event) => {
        if (event.key === "Escape") setFlyout(undefined);
      }}
    >
      <aside
        ref={sidebarRef}
        data-section-id="sidebar"
        aria-label="Crystra 导航"
      >
        <div data-section-id="sidebar-logo-row">
          <Button
            appearance="ghost"
            data-section-id="surface-banner"
            aria-label={collapsed ? "展开侧边栏" : "切换到 DeepSeek Harness"}
            onClick={
              collapsed
                ? () => {
                    setCollapsed(false);
                    setFlyout(undefined);
                  }
                : props.onOpenHarness
            }
          >
            <CrystraBrandMark />
            <span data-section-id="sidebar-brand-name">Crystra</span>
          </Button>
          <IconButton
            appearance="ghost"
            aria-label="收起侧边栏"
            data-section-id="sidebar-toggle"
            onClick={() => {
              setCollapsed(true);
              setFlyout(undefined);
            }}
          >
            <Icon name="layout-sidebar-left-collapse" size="navigation" />
          </IconButton>
        </div>
        <Button
          appearance="outline"
          data-section-id="new-task-action"
          aria-label="新建任务"
          onClick={props.onNewTask}
        >
          <Icon name="plus" size="inline-action" />
          <span data-section-id="new-task-label">新建任务</span>
        </Button>
        <nav data-section-id="sidebar-rail" aria-label="快捷导航">
          {(
            [
              ["task", "任务", "clipboard-list"],
              ["workflow", "工作流", "git-branch"],
              ["analysis", "分析", "chart-dots"],
            ] as const
          ).map(([key, label, icon]) => (
            <IconButton
              key={key}
              appearance="ghost"
              aria-label={label}
              aria-expanded={flyout === key}
              aria-controls={`sidebar-panel-${key}`}
              onClick={() => openFlyout(key)}
            >
              <Icon name={icon} size="navigation" />
            </IconButton>
          ))}
        </nav>
        <section
          data-section-id="task-working-set"
          id="sidebar-panel-task"
          data-sidebar-flyout={
            collapsed && flyout === "task" ? "open" : undefined
          }
          data-expanded={expanded.task}
        >
          <SidebarHeader
            kind="task"
            label="任务"
            expanded={expanded.task}
            onToggle={() => toggle("task")}
            onExpand={() => setExpanded((old) => ({ ...old, task: true }))}
            query={taskQuery}
            onQuery={setTaskQuery}
            onAll={() => navigate("tasks")}
            selected={props.route === "tasks"}
            view={
              <>
                <button
                  role="menuitemradio"
                  aria-checked={taskSort === "createdAt"}
                  onClick={() => setTaskSort("createdAt")}
                >
                  创建时间（降序）
                </button>
                <button
                  role="menuitemradio"
                  aria-checked={taskSort === "lastActivityAt"}
                  onClick={() => setTaskSort("lastActivityAt")}
                >
                  最近活动（降序）
                </button>
                <button
                  role="menuitemcheckbox"
                  aria-checked={activeOnly}
                  onClick={() => setActiveOnly(!activeOnly)}
                >
                  仅显示活跃任务
                </button>
              </>
            }
          />
          {expanded.task && (
            <div data-section-id="task-section-content">
              {records(
                [...props.tasks]
                  .filter((task) => !activeOnly || task.inactive !== true)
                  .sort((a, b) =>
                    (b[taskSort] ?? "").localeCompare(a[taskSort] ?? ""),
                  ),
                taskQuery,
                "task",
              )}
            </div>
          )}
        </section>
        <nav
          data-section-id="workflow-navigation"
          id="sidebar-panel-workflow"
          data-sidebar-flyout={
            collapsed && flyout === "workflow" ? "open" : undefined
          }
          data-expanded={expanded.workflow}
          aria-label="工作流"
        >
          <SidebarHeader
            kind="workflow"
            label="工作流"
            expanded={expanded.workflow}
            onToggle={() => toggle("workflow")}
            onExpand={() => setExpanded((old) => ({ ...old, workflow: true }))}
            query={workflowQuery}
            onQuery={setWorkflowQuery}
            onAll={() => navigate("workflows")}
            selected={props.route === "workflows"}
            view={
              <>
                <button
                  role="menuitemradio"
                  aria-checked={!workflowDescending}
                  onClick={() => setWorkflowDescending(false)}
                >
                  名称升序
                </button>
                <button
                  role="menuitemradio"
                  aria-checked={workflowDescending}
                  onClick={() => setWorkflowDescending(true)}
                >
                  名称降序
                </button>
                <button
                  role="menuitemcheckbox"
                  aria-checked={showVersion}
                  onClick={() => setShowVersion(!showVersion)}
                >
                  显示版本
                </button>
              </>
            }
          />
          {expanded.workflow && (
            <div data-section-id="workflow-section-content">
              {records(
                [...props.workflows].sort(
                  (a, b) =>
                    a.title.localeCompare(b.title) *
                    (workflowDescending ? -1 : 1),
                ),
                workflowQuery,
                "workflow",
              )}
            </div>
          )}
        </nav>
        <nav
          data-section-id="analysis-navigation"
          id="sidebar-panel-analysis"
          data-sidebar-flyout={
            collapsed && flyout === "analysis" ? "open" : undefined
          }
          data-expanded={expanded.analysis}
          aria-label="分析"
        >
          <Button
            appearance="ghost"
            aria-expanded={expanded.analysis}
            data-section-id="analysis-section-header"
            className="crystra-sidebar-title"
            onClick={() => toggle("analysis")}
          >
            <Icon name="chevron-down" size="disclosure" />
            分析
          </Button>
          {expanded.analysis && (
            <div data-section-id="analysis-secondary-navigation">
              {(
                [
                  ["analysis-overview", "总览", "analysis-dashboard-action"],
                  ["analysis-traces", "调用追踪", "analysis-traces-action"],
                  ["analysis-reports", "对比分析", "analysis-reports-action"],
                ] as const
              ).map(([page, label, id]) => (
                <Button
                  key={page}
                  appearance="ghost"
                  data-section-id={id}
                  aria-current={props.route === page ? "page" : undefined}
                  onClick={() => navigate(page)}
                >
                  <Icon
                    name={
                      page === "analysis-overview"
                        ? "layout-columns"
                        : page === "analysis-traces"
                          ? "activity"
                          : "arrows-exchange"
                    }
                    size="navigation"
                  />
                  {label}
                </Button>
              ))}
            </div>
          )}
        </nav>
        <footer data-section-id="sidebar-footer">
          {props.settings ?? (
            <Button
              appearance="ghost"
              aria-label="设置"
              data-section-id="host-settings"
              onClick={props.onOpenSettings}
            >
              <Icon name="settings" size="navigation" />
              <span data-settings-label="">设置</span>
            </Button>
          )}
        </footer>
      </aside>
      <main
        data-section-id="product-page"
        onPointerDown={() => setFlyout(undefined)}
      >
        {props.children}
      </main>
    </div>
  );
}

function SidebarHeader({
  kind,
  label,
  expanded,
  onToggle,
  onExpand,
  query,
  onQuery,
  onAll,
  selected,
  view,
}: {
  kind: "task" | "workflow";
  label: string;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  query: string;
  onQuery: (value: string) => void;
  onAll: () => void;
  selected: boolean;
  view: ReactNode;
}) {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const root = useRef<HTMLElement>(null);
  const close = () => {
    setSearch(false);
    setMenu(false);
    onQuery("");
  };
  useEffect(() => {
    if (!search && !menu) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setSearch(false);
        setMenu(false);
        onQuery("");
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [search, menu, onQuery]);
  return (
    <header
      ref={root}
      data-section-id={kind + "-section-header"}
      className="crystra-sidebar-header"
      data-searching={search}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <ExpandableSearchField
        title={
          <Button
            appearance="ghost"
            className="crystra-sidebar-title"
            aria-expanded={expanded}
            onClick={() => {
              close();
              onToggle();
            }}
          >
            <Icon name="chevron-down" size="disclosure" />
            {label}
          </Button>
        }
        expanded={search}
        onExpandedChange={(open) => {
          setSearch(open);
          setMenu(false);
          if (open) onExpand();
        }}
        label={"搜索" + label}
        placeholder={"搜索" + label}
        value={query}
        onValueChange={onQuery}
        triggerProps={{ "data-section-id": kind + "-search-action" }}
        cancelProps={{ "data-section-id": kind + "-search-clear" }}
      />
      {!search && (
        <>
          <IconButton
            appearance="ghost"
            aria-label={label + "视图"}
            aria-haspopup="menu"
            aria-expanded={menu}
            data-section-id={kind + "-view-options-action"}
            onClick={() => setMenu(!menu)}
          >
            <Icon name="adjustments-horizontal" size="inline-action" />
          </IconButton>
          <IconButton
            appearance="ghost"
            aria-label={"全部" + label}
            aria-current={selected ? "page" : undefined}
            data-section-id={
              kind === "task" ? "all-tasks-action" : "all-workflows-action"
            }
            onClick={onAll}
          >
            <Icon name="player-play-filled" size="inline-action" />
          </IconButton>
        </>
      )}
      {menu && (
        <div
          role="menu"
          aria-label={label + "视图"}
          data-section-id={kind + "-view-options-menu"}
          className="crystra-sidebar-view-menu"
        >
          {view}
        </div>
      )}
    </header>
  );
}
