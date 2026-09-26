import { AdaptiveChoice } from "../components/adaptive-choice";
import { ResourceBrowserHeader } from "../task-layout/resource-browser-header";
import {
  ResourceGalleryCard,
  ResourceTableRow,
} from "../components/resource-items";
import { Button, IconButton, ButtonGroup, Divider } from "../components/design-system";
import { BrowserMenu, type BrowserMenuItem } from "./browser-menu";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "../components/icon";
import "./task-browser.css";
export interface BrowserTask {
  id: string;
  title: string;
  subtitle?: string;
  workspace?: string;
  workspacePath?: string;
  status?: string;
  active?: boolean;
  attention?: number;
  createdAt?: number;
  lastActivityAt: number;
  cost?: number;
  thumbnail?: string;
  pinnedAt?: number | null;
  progress?: { completed: number; total: number; scope: string };
}
export interface TaskBrowserSurfaceProps {
  items: BrowserTask[];
  feedback?: ReactNode;
  busy?: boolean;
  archiveView?: boolean;
  onArchiveViewChange?: (archived: boolean) => void;
  taskHref: (id: string) => string;
  onNewTask: () => void;
  onRename?: (id: string) => void;
  onThumbnail?: (id: string) => void;
  onPin?: (id: string) => void;
  onArchive?: (ids: string[]) => void;
}
const stamp = (n?: number) =>
  n === undefined
    ? "暂无数据"
    : new Date(n).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
export function TaskBrowserSurface({
  items,
  feedback,
  busy = false,
  archiveView = false,
  onArchiveViewChange,
  taskHref,
  onNewTask,
  onArchive,
  onRename,
  onThumbnail,
  onPin,
}: TaskBrowserSurfaceProps) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("activity"),
    [list, setList] = useState(false),
    [group, setGroup] = useState("workspace"),
    [selectedIds, setSelected] = useState<string[]>([]),
    [collapsed, setCollapsed] = useState<string[]>([]),
    [page, setPage] = useState(1),
    [size, setSize] = useState(12),
    [limit, setLimit] = useState(24);
  const [menu, setMenu] = useState<{
    trigger: HTMLElement;
    label: string;
    items: BrowserMenuItem[];
    inward?: boolean;
  } | null>(null);
  const scroll = useRef<HTMLDivElement>(null),
    sentinel = useRef<HTMLDivElement>(null);
  const results = useMemo(
    () =>
      items
        .filter(
          (t) =>
            (filter === "all" ||
              (filter === "active"
                ? t.active === true
                : (t.attention ?? 0) > 0)) &&
            [t.title, t.subtitle, t.workspace, t.workspacePath].some((s) =>
              s?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
            ),
        )
        .sort(
          (a, b) =>
            Number(!!b.pinnedAt) - Number(!!a.pinnedAt) ||
            (sort === "cost"
              ? (b.cost ?? -1) - (a.cost ?? -1)
              : sort === "created"
                ? (b.createdAt ?? -1) - (a.createdAt ?? -1)
                : b.lastActivityAt - a.lastActivityAt),
        ),
    [items, query, filter, sort],
  );
  const selected = selectedIds.filter((id) => items.some((t) => t.id === id));
  const resetResults = () => {
    setMenu(null);
    setPage(1);
    setLimit(24);
    setSelected([]);
    scroll.current?.scrollTo?.(0, 0);
  };
  useEffect(() => {
    if (
      list ||
      !sentinel.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const o = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting))
          setLimit((n) => Math.min(results.length, n + 24));
      },
      { root: scroll.current, rootMargin: "250px" },
    );
    o.observe(sentinel.current);
    return () => o.disconnect();
  }, [list, limit, results.length, collapsed]);
  const lastPage = Math.max(1, Math.ceil(results.length / size)),
    currentPage = Math.min(page, lastPage);
  const shown = list
    ? results.slice((currentPage - 1) * size, currentPage * size)
    : results.slice(0, limit);
  const groupName = (t: BrowserTask) =>
    group === "none"
      ? "全部任务"
      : group === "status"
        ? (t.status ?? "状态未知")
        : (t.workspace ?? "Workspace 未提供");
  const groups = shown.reduce<Record<string, BrowserTask[]>>((acc, t) => {
    const key = groupName(t);
    (acc[key] ??= []).push(t);
    return acc;
  }, {});
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const check = (t: BrowserTask) => (
    <input
      type="checkbox"
      disabled={busy}
      aria-label={`选择 ${t.title}`}
      checked={selected.includes(t.id)}
      onChange={() => toggle(t.id)}
    />
  );
  const progress = (t: BrowserTask) =>
    t.progress && t.progress.total > 0 ? (
      <div
        className="browser-progress"
        role="progressbar"
        aria-label={`${t.title} · ${t.progress.scope}`}
        aria-valuenow={t.progress.completed}
        aria-valuemin={0}
        aria-valuemax={t.progress.total}
      >
        <span
          style={{
            width: `${Math.max(0, Math.min(100, (100 * t.progress.completed) / t.progress.total))}%`,
          }}
        />
      </div>
    ) : (
      <div className="gallery-divider" title="进度未知" />
    );
  const itemActions = (t: BrowserTask) => (
    <IconButton
      appearance="ghost"
      size="compact"
      className="browser-item-actions"
      data-ui-owner="components"
      disabled={busy}
      aria-label={`任务操作：${t.title}`}
      aria-haspopup="menu"
      aria-expanded={menu?.label === `任务操作：${t.title}`}
      onClick={(e) =>
        setMenu(
          menu?.trigger === e.currentTarget
            ? null
            : {
                trigger: e.currentTarget,
                label: `任务操作：${t.title}`,
                inward: !list,
                items: [
                  {
                    label: "修改缩略图",
                    icon: <Icon name="photo" />,
                    onChoose: onThumbnail ? () => onThumbnail(t.id) : undefined,
                  },
                  {
                    label: "改名",
                    icon: <Icon name="pencil" />,
                    onChoose: onRename ? () => onRename(t.id) : undefined,
                  },
                  {
                    label: t.pinnedAt ? "取消 Pin" : "Pin",
                    icon: <Icon name="pin" />,
                    onChoose: onPin ? () => onPin(t.id) : undefined,
                  },
                  {
                    label: archiveView ? "恢复" : "归档",
                    icon: <Icon name="archive" />,
                    onChoose: onArchive ? () => onArchive([t.id]) : undefined,
                  },
                ],
              },
        )
      }
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      <Icon name="dots" />
    </IconButton>
  );
  return (
    <section
      className="browser-host crystra-bi crystra-task-browser"
      data-crystra-theme="dark"
      data-section-id="task-browser"
    >
      <ResourceBrowserHeader
        identity={
          <div data-header-slot="identity">
            <h1>全部任务</h1>
            <p>Task Browser</p>
          </div>
        }
        search={
          <label className="browser-search" data-header-slot="search">
            <Icon name="search" />
            <input
              aria-label="搜索任务"
              placeholder="搜索任务、目标、Workspace"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetResults();
              }}
            />
          </label>
        }
        toolbar={
          <div data-header-slot="toolbar" className="browser-toolbar">
            <ButtonGroup joined divided segmented aria-label="任务浏览工具">
              <AdaptiveChoice
                label="筛选任务"
                functionIcon={<Icon name="filter" />}
                compactIconOnly
                value={filter}
                options={[
                  { value: "all", label: "全部", icon: <Icon name="list" /> },
                  {
                    value: "active",
                    label: "活跃",
                    icon: <Icon name="activity" />,
                  },
                  {
                    value: "attention",
                    label: "需要关注",
                    icon: <Icon name="alert-circle" />,
                  },
                ]}
                onChange={(value) => {
                  setFilter(value);
                  resetResults();
                }}
              />
              <Divider orientation="vertical" />
              <AdaptiveChoice
                label="任务排序"
                functionIcon={<Icon name="sort-descending" />}
                compactIconOnly
                value={sort}
                collapseBelow={1200}
                options={[
                  {
                    value: "activity",
                    label: "最近活动",
                    icon: <Icon name="clock" />,
                  },
                  {
                    value: "created",
                    label: "创建时间",
                    icon: <Icon name="calendar" />,
                  },
                  { value: "cost", label: "成本", icon: <Icon name="coins" /> },
                ]}
                onChange={(value) => {
                  setSort(value);
                  resetResults();
                }}
              />
              <Divider orientation="vertical" />
              <AdaptiveChoice
                label="任务视图"
                functionIcon={<Icon name="layout-grid" />}
                value={list ? "list" : "gallery"}
                collapseBelow={760}
                compactIconOnly
                options={[
                  {
                    value: "gallery",
                    label: "Gallery",
                    icon: <Icon name="table" />,
                  },
                  {
                    value: "list",
                    label: "List",
                    icon: <Icon name="clipboard-list" />,
                  },
                ]}
                onChange={(value) => {
                  setMenu(null);
                  setList(value === "list");
                  scroll.current?.scrollTo?.(0, 0);
                }}
              />
              <Divider orientation="vertical" />
              <IconButton
                appearance="solid"
                raised
                tone="danger"
                aria-label={archiveView ? "恢复所选" : "归档所选"}
                title={
                  onArchive
                    ? archiveView
                      ? "恢复所选"
                      : "归档所选"
                    : "归档接口尚未接通"
                }
                disabled={busy || !selected.length || !onArchive}
                onClick={() => onArchive?.(selected)}
              >
                <Icon name="archive" />
              </IconButton>
              <IconButton
                aria-label="新建任务"
                appearance="solid"
                raised
                tone="primary"
                onClick={onNewTask}
              >
                <Icon name="plus" />
              </IconButton>
            </ButtonGroup>
          </div>
        }
      />

      <div
        id="browser-scroll"
        ref={scroll}
        data-section-id="task-browser-content"
      >
        {feedback}
        <div className="browser-results">
          <div className="browser-selection-summary">
            {onArchiveViewChange && (
              <Button
                appearance="ghost"
                size="compact"
                type="button"
                disabled={busy}
                onClick={() => {
                  onArchiveViewChange(!archiveView);
                  resetResults();
                }}
              >
                <Icon name="archive" />
                {archiveView ? "返回未归档" : "已归档"}
              </Button>
            )}

            <label>
              <input
                type="checkbox"
                aria-label="全选结果"
                checked={
                  results.length > 0 &&
                  results.every((t) => selected.includes(t.id))
                }
                onChange={(e) =>
                  setSelected(e.target.checked ? results.map((t) => t.id) : [])
                }
              />{" "}
              全选结果
            </label>
            <span role="status">
              {results.length} 个任务
              {selected.length ? ` · 已选择 ${selected.length} 项` : ""}
            </span>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])}>取消选择</button>
            )}
          </div>
          {!list && (
            <label className="browser-select">
              分组
              <select
                aria-label="任务分组"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option value="workspace">Workspace</option>
                <option value="status">状态</option>
                <option value="none">不分组</option>
              </select>
            </label>
          )}
        </div>
        {!results.length ? (
          <div id="browser-empty">
            <Icon name="search" />
            <p>没有符合条件的任务</p>
          </div>
        ) : list ? (
          <section id="browser-list">
            <table>
              <thead>
                <tr>
                  {[
                    "选择",
                    "任务",
                    "状态",
                    "Workspace",
                    "当前进度",
                    "关注项",
                    "创建时间",
                    "最近活动",
                    "成本",
                    "操作",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <ResourceTableRow
                    key={t.id}
                    title={t.title}
                    href={taskHref(t.id)}
                    selection={check(t)}
                    selected={selected.includes(t.id)}
                    actions={itemActions(t)}
                    cells={[
                      t.status ?? "未知",
                      <span title={t.workspacePath}>
                        {t.workspace ?? "暂无数据"}
                      </span>,
                      t.progress ? progress(t) : "进度未知",
                      t.attention === undefined ? "未知" : `${t.attention} 项`,
                      <time
                        title={
                          t.createdAt === undefined
                            ? undefined
                            : new Date(t.createdAt).toISOString()
                        }
                      >
                        {stamp(t.createdAt)}
                      </time>,
                      <time title={new Date(t.lastActivityAt).toISOString()}>
                        {stamp(t.lastActivityAt)}
                      </time>,
                      t.cost === undefined
                        ? "暂无数据"
                        : `¥${t.cost.toFixed(2)}`,
                    ]}
                  />
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div id="browser-gallery">
            {Object.entries(groups).map(([name, tasks]) => (
              <section className="browser-group" key={name}>
                <button
                  className="browser-group-heading"
                  aria-expanded={!collapsed.includes(name)}
                  onClick={() =>
                    setCollapsed((s) =>
                      s.includes(name)
                        ? s.filter((x) => x !== name)
                        : [...s, name],
                    )
                  }
                >
                  <Icon name="chevron-down" />
                  {name}
                  <span className="group-count">{tasks?.length}</span>
                </button>
                <div className="browser-flow" hidden={collapsed.includes(name)}>
                  {tasks?.map((t) => (
                    <ResourceGalleryCard
                      key={t.id}
                      title={t.title}
                      subtitle={t.subtitle ?? t.id}
                      href={taskHref(t.id)}
                      selected={selected.includes(t.id)}
                      selection={
                        <>
                          {check(t)}
                          {t.pinnedAt && (
                            <Icon name="pin" aria-label="已置顶" />
                          )}
                        </>
                      }
                      thumbnail={
                        t.thumbnail ? (
                          <img src={t.thumbnail} alt="" />
                        ) : (
                          <Icon name="target" />
                        )
                      }
                      progress={progress(t)}
                      status={
                        <span className="browser-chip">
                          {t.status ?? "状态未知"}
                        </span>
                      }
                      actions={itemActions(t)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        {list ? (
          <footer id="browser-pagination">
            <label className="browser-select">
              每页
              <select
                aria-label="每页条数"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[12, 24, 48].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              条
            </label>
            <span>
              {currentPage} / {lastPage}
            </span>
            <button
              className="browser-button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              上一页
            </button>
            <button
              className="browser-button"
              disabled={currentPage === lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              下一页
            </button>
          </footer>
        ) : (
          <div ref={sentinel} data-load-more>
            {limit < results.length ? (
              <button onClick={() => setLimit((n) => n + 24)}>加载更多</button>
            ) : (
              "已显示全部任务"
            )}
          </div>
        )}
      </div>
      {menu && <BrowserMenu {...menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
