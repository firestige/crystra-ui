import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { restoreTaskBrowserView } from "./task-browser-view";
import { Menu } from "./collection-components";
import { Icon } from "./icon";
import { ToggleSwitch } from "./toggle-switch";
import {
  queryBrowserTasks,
  taskProgress,
  type BrowserTaskRecord,
  type TaskBrowserQuery,
} from "./task-browser-model";
import "../task-browser.css";
type Grouping = "workspace" | "status" | "none";
export interface TaskBrowserProps {
  tasks: readonly BrowserTaskRecord[];
  initialViewState?: string;
  onViewStateChange?: (value: string) => void;
  phase?: "loading" | "ready" | "error";
  error?: string;
  onOpen: (id: string) => void;
  onNewTask: () => void;
  onRefresh?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onArchive?: (ids: readonly string[]) => void;
  onAction?: (id: string, action: "rename" | "thumbnail" | "pin") => void;
}
function Progress({
  task,
  gallery = false,
}: {
  task: BrowserTaskRecord;
  gallery?: boolean;
}) {
  const value = taskProgress(task);
  if (value === null)
    return gallery ? (
      <div className="gallery-divider" title="进度未知" />
    ) : (
      <span className="progress-unknown">进度未知</span>
    );
  return (
    <div className={gallery ? "browser-progress" : "list-progress"}>
      <div
        className="browser-progress"
        role="progressbar"
        aria-label={`${task.title} · 当前执行进度`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${task.progress!.scope}：${task.progress!.completed} / ${task.progress!.total}`}
      >
        <span style={{ width: `${value}%` }} />
      </div>
      {!gallery && <span>{value}%</span>}
    </div>
  );
}
function Stamp({ value }: { value?: string | null }) {
  if (!value || !Number.isFinite(Date.parse(value)))
    return <span>时间未知</span>;
  return (
    <time
      dateTime={value}
      title={new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        dateStyle: "medium",
        timeStyle: "long",
      }).format(new Date(value))}
    >
      {new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))}
    </time>
  );
}
function GalleryGroup({
  title,
  tasks,
  columns,
  root,
  active,
  anchorId,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  tasks: readonly BrowserTaskRecord[];
  columns: number;
  root: RefObject<HTMLDivElement | null>;
  active: boolean;
  anchorId?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: (task: BrowserTaskRecord) => React.ReactNode;
}) {
  const [count, setCount] = useState(() =>
    Math.max(columns, tasks.findIndex((task) => task.id === anchorId) + 1),
  );
  const marker = useRef<HTMLDivElement>(null);
  const visible = Math.max(columns, count);
  useEffect(() => {
    if (
      !active ||
      collapsed ||
      visible >= tasks.length ||
      !marker.current ||
      !root.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        const bounds = marker.current?.getBoundingClientRect(),
          viewport = root.current?.getBoundingClientRect();
        if (
          !bounds ||
          !viewport ||
          bounds.top > viewport.bottom + viewport.height * 0.5
        )
          return;
        setCount(
          (old) =>
            Math.max(old, columns) +
            columns *
              Math.max(
                1,
                Math.ceil(
                  viewport.height /
                    ((marker.current?.parentElement
                      ?.querySelector(".browser-task-card")
                      ?.getBoundingClientRect().height ?? 226) +
                      16),
                ),
              ),
        );
      },
      { root: root.current, rootMargin: "0px 0px 50% 0px" },
    );
    observer.observe(marker.current);
    return () => observer.disconnect();
  }, [active, collapsed, visible, tasks.length, columns, root]);
  return (
    <section className="browser-group">
      <button
        type="button"
        className="browser-group-heading"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <Icon name="chevron-down" />
        <span>{title}</span>
        <span className="group-count">{tasks.length}</span>
      </button>
      <div hidden={collapsed}>
        <div className="browser-flow">
          {tasks.slice(0, visible).map(children)}
        </div>
        {visible < tasks.length && (
          <div
            ref={marker}
            className="browser-load-marker"
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}
/** Accepted v8 Task collection. Actions require explicit host adapters; reading creates no objects. */
export function TaskBrowser({
  tasks,
  initialViewState,
  onViewStateChange,
  phase = "ready",
  error,
  onOpen,
  onNewTask,
  onRefresh,
  hasMore = false,
  onLoadMore,
  onArchive,
  onAction,
}: TaskBrowserProps) {
  const [initial] = useState(() => restoreTaskBrowserView(initialViewState));
  const [query, setQuery] = useState<TaskBrowserQuery>({
      query: initial.query,
      filter: initial.filter,
      sort: initial.sort,
    }),
    [list, setList] = useState(initial.view === "list"),
    [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
      () => new Set(),
    ),
    [grouping, setGrouping] = useState<Grouping>(initial.grouping),
    [selected, setSelected] = useState<Set<string>>(() => new Set()),
    [page, setPage] = useState(initial.page),
    [pageSize, setPageSize] = useState<number>(initial.pageSize),
    [columns, setColumns] = useState(1),
    [width, setWidth] = useState(280);
  const scroll = useRef<HTMLDivElement>(null),
    gallery = useRef<HTMLDivElement>(null);
  const nextPageMarker = useRef<HTMLDivElement>(null);
  const viewState = useMemo(
    () => ({
      version: 1,
      ...query,
      view: list ? "list" : "gallery",
      grouping,
      page,
      pageSize,
      ...(initial.anchorId ? { anchorId: initial.anchorId } : {}),
    }),
    [query, list, grouping, page, pageSize, initial.anchorId],
  );
  const lastSaved = useRef("");
  useEffect(() => {
    const encoded = JSON.stringify(viewState);
    if (encoded === lastSaved.current) return;
    lastSaved.current = encoded;
    onViewStateChange?.(encoded);
  }, [viewState, onViewStateChange]);
  const openTask = (id: string) => {
    onViewStateChange?.(JSON.stringify({ ...viewState, anchorId: id }));
    onOpen(id);
  };
  useEffect(() => {
    if (!initial.anchorId || phase !== "ready") return;
    const target = Array.from(
      scroll.current?.querySelectorAll<HTMLElement>("[data-resource-id]") ?? [],
    ).find(
      (node) =>
        node.dataset.resourceId === initial.anchorId &&
        !node.closest("[hidden]"),
    );
    target?.scrollIntoView?.({ block: "nearest" });
  }, [initial.anchorId, phase, list, columns]);
  useEffect(() => {
    if (
      list ||
      !hasMore ||
      !onLoadMore ||
      phase !== "ready" ||
      !scroll.current ||
      !nextPageMarker.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    let requested = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!requested && entries.some((entry) => entry.isIntersecting)) {
          requested = true;
          onLoadMore();
        }
      },
      { root: scroll.current, rootMargin: "0px 0px 50% 0px" },
    );
    observer.observe(nextPageMarker.current);
    return () => observer.disconnect();
  }, [list, hasMore, onLoadMore, phase, tasks.length]);
  const matches = useMemo(
    () => queryBrowserTasks(tasks, query),
    [tasks, query],
  );
  const selectedIds = matches
    .filter((task) => selected.has(task.id))
    .map((task) => task.id);
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize)),
    currentPage = Math.min(page, pageCount);
  const groups = useMemo(() => {
    const result = new Map<string, BrowserTaskRecord[]>();
    for (const task of matches) {
      const key =
        grouping === "workspace"
          ? (task.workspace?.name ?? "Workspace 未知")
          : grouping === "status"
            ? (task.status?.label ?? "状态未知")
            : "全部任务";
      result.set(key, [...(result.get(key) ?? []), task]);
    }
    return result;
  }, [matches, grouping]);
  useEffect(() => {
    if (!gallery.current || typeof ResizeObserver === "undefined") return;
    const node = gallery.current;
    const measure = () => {
      const available = node.clientWidth;
      if (!available) return;
      const cols = Math.max(1, Math.floor((available + 16) / 288));
      setColumns(cols);
      setWidth((available - (cols - 1) * 16) / cols);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [list]);
  const updateQuery = (patch: Partial<TaskBrowserQuery>) => {
    setQuery((old) => ({ ...old, ...patch }));
    setSelected(new Set());
    setPage(1);
  };
  const previousQuery = useRef(query);
  useEffect(() => {
    if (previousQuery.current !== query) {
      scroll.current?.scrollTo?.({ top: 0 });
      previousQuery.current = query;
    }
  }, [query]);
  const select = (id: string) =>
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const checkbox = (task: BrowserTaskRecord) => (
    <input
      type="checkbox"
      aria-label={`选择任务：${task.title}`}
      checked={selected.has(task.id)}
      onChange={() => select(task.id)}
    />
  );
  const status = (task: BrowserTaskRecord) => (
    <span className="browser-chip" data-tone={task.status?.tone ?? "neutral"}>
      {task.status?.label ?? "状态未知"}
    </span>
  );
  const menu = (task: BrowserTaskRecord) => (
    <div className="crystra-task-browser-menu">
      <Menu
        label={`任务操作：${task.title}`}
        triggerContent={<Icon name="dots" />}
        side={list ? "auto" : "top"}
        items={[
          {
            id: "thumbnail",
            label: "修改缩略图",
            disabled: !onAction,
            onSelect: () => onAction?.(task.id, "thumbnail"),
          },
          {
            id: "rename",
            label: "改名",
            disabled: !onAction,
            onSelect: () => onAction?.(task.id, "rename"),
          },
          {
            id: "archive",
            label: "归档",
            disabled: !onArchive,
            onSelect: () => onArchive?.([task.id]),
          },
          {
            id: "pin",
            label: task.pinned ? "取消 Pin" : "Pin",
            disabled: !onAction,
            onSelect: () => onAction?.(task.id, "pin"),
          },
        ]}
      />
    </div>
  );
  const card = (task: BrowserTaskRecord) => (
    <article
      className="browser-task-card"
      key={task.id}
      data-resource-id={task.id}
      data-selected={selected.has(task.id)}
    >
      <label className="task-select">{checkbox(task)}</label>
      <button
        type="button"
        className="task-card-link"
        aria-label={`打开任务：${task.title}`}
        onClick={() => openTask(task.id)}
      >
        <div className="task-thumbnail">
          {task.thumbnail ? (
            <img src={task.thumbnail} alt={`${task.title}的缩略图`} />
          ) : (
            <Icon name="target" />
          )}
        </div>
        <Progress task={task} gallery />
        {task.attention &&
          task.attention.count > 0 &&
          task.attention.severity && (
            <span
              className="task-attention-badge"
              data-severity={
                task.attention.severity === "error" ? "error" : "warn"
              }
              aria-label={`${task.attention.count} 项需要关注`}
            >
              {task.attention.count > 9 ? "9+" : task.attention.count}
            </span>
          )}
        <div className="task-card-body">
          <div className="task-card-heading">
            <h3 title={task.title}>{task.title}</h3>
            {status(task)}
          </div>
          <p className="task-card-goal">{task.goal ?? "目标尚未提供"}</p>
        </div>
      </button>
      {menu(task)}
    </article>
  );
  return (
    <section
      className="crystra-task-browser"
      data-section-id="main-surface-host"
    >
      <header className="browser-header" data-section-id="task-browser-header">
        <div data-header-slot="identity">
          <h1>全部任务</h1>
          <p>浏览任务，继续推进。</p>
        </div>
        <div data-header-slot="search">
          <label className="browser-search">
            <Icon name="search" />
            <input
              type="search"
              maxLength={256}
              aria-label="搜索任务"
              placeholder="搜索任务、目标或 Workspace…"
              value={query.query}
              onChange={(e) => updateQuery({ query: e.target.value })}
            />
          </label>
        </div>
        <section
          className="browser-toolbar"
          data-header-slot="toolbar"
          aria-label="任务浏览选项"
        >
          <div
            className="browser-button-group"
            role="group"
            aria-label="筛选与排序"
          >
            {(
              [
                ["all", "全部"],
                ["active", "活跃"],
                ["attention", "需要关注"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={query.filter === value}
                onClick={() => updateQuery({ filter: value })}
              >
                {label}
              </button>
            ))}
            <div className="crystra-task-browser-sort">
              <Menu
                label={`排序：${{ activity: "最近活动", created: "创建时间", cost: "成本" }[query.sort]}，降序`}
                triggerContent={<Icon name="sort-descending" />}
                items={(
                  [
                    ["activity", "最近活动"],
                    ["created", "创建时间"],
                    ["cost", "成本"],
                  ] as const
                ).map(([value, label]) => ({
                  id: value,
                  label,
                  checked: query.sort === value,
                  onSelect: () => updateQuery({ sort: value }),
                }))}
              />
            </div>
          </div>
          <ToggleSwitch
            checked={list}
            onCheckedChange={(value) => {
              setList(value);
              scroll.current?.scrollTo?.({ top: 0 });
            }}
            label="任务视图"
            mode="choice"
            labels={["Gallery", "List"]}
            shape="square"
            size="regular"
            iconPlacement="track"
            icons={[
              <Icon key="gallery" name="layout-grid" />,
              <Icon key="list" name="list" />,
            ]}
          />
        </section>
        <div data-header-slot="actions">
          <button
            type="button"
            className="browser-button"
            aria-label="归档所选"
            title={onArchive ? "归档所选" : "当前未提供归档接口"}
            disabled={!onArchive || !selectedIds.length}
            onClick={() => onArchive?.(selectedIds)}
          >
            <Icon name="archive" />
          </button>
          <button type="button" className="browser-button" onClick={onNewTask}>
            <Icon name="plus" />
            新建任务
          </button>
        </div>
      </header>
      <div
        ref={scroll}
        data-browser-id="browser-scroll"
        data-section-id="task-browser-content"
      >
        <div className="browser-results">
          <div className="browser-selection-summary">
            <label>
              <input
                type="checkbox"
                aria-label="全选结果"
                checked={
                  matches.length > 0 && selectedIds.length === matches.length
                }
                onChange={() =>
                  setSelected(
                    selectedIds.length === matches.length
                      ? new Set()
                      : new Set(matches.map((task) => task.id)),
                  )
                }
              />
              {hasMore ? "全选已加载结果" : "全选结果"}
            </label>
            <p role="status">
              {hasMore ? "已加载 " : ""}
              {matches.length} 项任务
              {selectedIds.length ? ` · 已选择 ${selectedIds.length} 项` : ""}
            </p>
            {onRefresh && (
              <button
                type="button"
                className="browser-button"
                onClick={onRefresh}
              >
                刷新
              </button>
            )}
          </div>
          {!list && (
            <label className="browser-select">
              分组
              <select
                aria-label="分组"
                value={grouping}
                onChange={(e) => setGrouping(e.target.value as Grouping)}
              >
                <option value="workspace">Workspace</option>
                <option value="status">状态</option>
                <option value="none">不分组</option>
              </select>
            </label>
          )}
        </div>
        {phase === "loading" && <p role="status">正在读取任务…</p>}
        {phase === "error" && <p role="alert">{error ?? "任务读取失败"}</p>}
        <>
          <section
            hidden={!list}
            data-browser-id="browser-list"
            data-section-id="task-browser-list"
          >
            <table>
              <thead>
                <tr>
                  {[
                    "选择任务",
                    "任务",
                    "状态",
                    "Workspace",
                    "当前进度",
                    "关注项",
                    "创建时间",
                    "最近活动",
                    "成本",
                    "操作",
                  ].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((task) => (
                    <tr
                      key={task.id}
                      data-resource-id={task.id}
                      data-selected={selected.has(task.id)}
                    >
                      <td>{checkbox(task)}</td>
                      <td>
                        <button
                          type="button"
                          className="cell-primary"
                          aria-label={`打开任务：${task.title}`}
                          onClick={() => openTask(task.id)}
                        >
                          {task.title}
                        </button>
                        <span className="cell-secondary">
                          {task.goal ?? "目标尚未提供"}
                        </span>
                      </td>
                      <td>{status(task)}</td>
                      <td title={task.workspace?.path}>
                        {task.workspace?.name ?? "Workspace 未知"}
                      </td>
                      <td>
                        <Progress task={task} />
                      </td>
                      <td>
                        {task.attention
                          ? `${task.attention.count} 项关注`
                          : "关注项未知"}
                      </td>
                      <td>
                        <Stamp value={task.createdAt} />
                      </td>
                      <td>
                        <Stamp value={task.lastActivityAt} />
                      </td>
                      <td>
                        {typeof task.cost === "number" &&
                        Number.isFinite(task.cost)
                          ? `¥${task.cost.toFixed(2)}`
                          : "成本未知"}
                      </td>
                      <td>{menu(task)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
          <div
            hidden={list}
            ref={gallery}
            data-browser-id="browser-gallery"
            data-section-id="task-browser-gallery"
            style={{ "--browser-card-width": `${width}px` } as CSSProperties}
          >
            {[...groups].map(([title, items]) => (
              <GalleryGroup
                key={`${title}:${JSON.stringify(query)}`}
                title={title}
                tasks={items}
                columns={columns}
                root={scroll}
                active={!list}
                anchorId={initial.anchorId}
                collapsed={collapsedGroups.has(`${grouping}:${title}`)}
                onToggle={() =>
                  setCollapsedGroups((old) => {
                    const next = new Set(old),
                      key = `${grouping}:${title}`;
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  })
                }
              >
                {card}
              </GalleryGroup>
            ))}
          </div>
        </>
        {phase === "ready" && !matches.length && (
          <div data-browser-id="browser-empty">
            <Icon name="file" />
            <p>没有符合条件的任务</p>
            <span>试试其他关键词或筛选条件</span>
          </div>
        )}
        {hasMore && (
          <div ref={nextPageMarker}>
            <button
              type="button"
              className="browser-button"
              disabled={phase === "loading" || !onLoadMore}
              onClick={onLoadMore}
            >
              加载更多任务
            </button>
          </div>
        )}
        {list && (
          <footer data-browser-id="browser-pagination">
            <label className="browser-select">
              每页
              <select
                aria-label="每页条数"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[12, 24, 48].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
              条
            </label>
            <div>
              <span>
                {matches.length ? currentPage : 0} /{" "}
                {matches.length ? pageCount : 0}
              </span>
              <button
                type="button"
                className="browser-button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                上一页
              </button>
              <button
                type="button"
                className="browser-button"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
}
