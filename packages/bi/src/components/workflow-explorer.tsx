import { restoreWorkflowExplorerView } from "./workflow-explorer-view";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Menu } from "./collection-components";
import { Icon } from "./icon";
import { ToggleSwitch } from "./toggle-switch";
import { ResourceGalleryGroup } from "./resource-gallery-group";
import {
  queryWorkflowDefinitions,
  workflowEntryKey,
  type WorkflowDefinitionEntry,
  type WorkflowExplorerQuery,
} from "./workflow-explorer-model";
import "../task-browser.css";
import "../workflow-explorer.css";
export interface WorkflowExplorerProps {
  initialViewState?: string;
  onViewStateChange?: (value: string) => void;
  entries: readonly WorkflowDefinitionEntry[];
  phase?: "ready" | "loading" | "error" | "unavailable";
  error?: string;
  onOpen: (definitionId: string, revision: string) => void;
  onNewWorkflow?: () => void;
  onRefresh?: () => void;
  onArchive?: (entries: readonly WorkflowDefinitionEntry[]) => void;
  onAction?: (
    entry: WorkflowDefinitionEntry,
    action: "thumbnail" | "rename" | "pin",
  ) => void;
}
const statusLabels = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  DEPRECATED: "已弃用",
};
function Stamp({ value }: { value?: string }) {
  return value && Number.isFinite(Date.parse(value)) ? (
    <time dateTime={value} title={new Date(value).toISOString()}>
      {new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))}
    </time>
  ) : (
    <>时间未知</>
  );
}
/** Read-only directory consumer. No mutation exists without an explicit owner callback. */
export function WorkflowExplorer({
  entries,
  initialViewState,
  onViewStateChange,
  phase = "ready",
  error,
  onOpen,
  onNewWorkflow,
  onRefresh,
  onArchive,
  onAction,
}: WorkflowExplorerProps) {
  const [initial] = useState(() =>
    restoreWorkflowExplorerView(initialViewState),
  );
  const [query, setQuery] = useState<WorkflowExplorerQuery>({
    query: initial.query,
    filter: initial.filter,
    sort: initial.sort,
    versions: initial.versions,
  });
  const [list, setList] = useState(initial.view === "list"),
    [grouping, setGrouping] = useState<string>(initial.grouping),
    [selected, setSelected] = useState<Set<string>>(() => new Set()),
    [folded, setFolded] = useState<Set<string>>(() => new Set()),
    [page, setPage] = useState(initial.page),
    [size, setSize] = useState<number>(initial.pageSize),
    [geometry, setGeometry] = useState({ columns: 1, width: 280 });
  const scroll = useRef<HTMLDivElement>(null),
    gallery = useRef<HTMLDivElement>(null);
  const viewState = useMemo(
    () => ({
      version: 1,
      ...query,
      view: list ? "list" : "gallery",
      grouping,
      page,
      pageSize: size,
      ...(initial.anchorId ? { anchorId: initial.anchorId } : {}),
    }),
    [query, list, grouping, page, size, initial.anchorId],
  );
  const lastSaved = useRef("");
  useEffect(() => {
    const encoded = JSON.stringify(viewState);
    if (encoded !== lastSaved.current) {
      lastSaved.current = encoded;
      onViewStateChange?.(encoded);
    }
  }, [viewState, onViewStateChange]);
  const openEntry = (entry: WorkflowDefinitionEntry) => {
    onViewStateChange?.(
      JSON.stringify({ ...viewState, anchorId: workflowEntryKey(entry) }),
    );
    onOpen(entry.definitionId, entry.revision);
  };
  useEffect(() => {
    if (phase !== "ready" || !initial.anchorId) return;
    const target = Array.from(
      scroll.current?.querySelectorAll<HTMLElement>("[data-resource-id]") ?? [],
    ).find(
      (node) =>
        node.dataset.resourceId === initial.anchorId &&
        !node.closest("[hidden]"),
    );
    target?.scrollIntoView?.({ block: "nearest" });
  }, [phase, initial.anchorId, list, geometry.columns]);
  const matches = useMemo(
    () =>
      queryWorkflowDefinitions(entries, query).map((entry) => ({
        ...entry,
        id: workflowEntryKey(entry),
      })),
    [entries, query],
  );
  const selectedEntries = matches.filter((entry) => selected.has(entry.id));
  const pages = Math.max(1, Math.ceil(matches.length / size)),
    current = Math.min(page, pages);
  const groups = useMemo(() => {
    const value = new Map<string, typeof matches>();
    for (const entry of matches) {
      const key =
        grouping === "status"
          ? entry.status
            ? statusLabels[entry.status]
            : "状态未知"
          : "全部工作流";
      value.set(key, [...(value.get(key) ?? []), entry]);
    }
    return value;
  }, [matches, grouping]);
  const update = (patch: Partial<WorkflowExplorerQuery>) => {
    setQuery((old) => ({ ...old, ...patch }));
    setSelected(new Set());
    setPage(1);
  };
  const previous = useRef(query);
  useEffect(() => {
    if (previous.current !== query) {
      scroll.current?.scrollTo?.({ top: 0 });
      previous.current = query;
    }
  }, [query]);
  useEffect(() => {
    const node = gallery.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const available = node.clientWidth;
      if (!available) return;
      const columns = Math.max(1, Math.floor((available + 16) / 288));
      setGeometry({
        columns,
        width: (available - (columns - 1) * 16) / columns,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [list]);
  const checkbox = (entry: WorkflowDefinitionEntry) => {
    const id = workflowEntryKey(entry);
    return (
      <input
        type="checkbox"
        aria-label={`选择工作流：${entry.title}，${entry.revision}`}
        checked={selected.has(id)}
        onChange={() =>
          setSelected((old) => {
            const next = new Set(old);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
      />
    );
  };
  const status = (entry: WorkflowDefinitionEntry) => (
    <span
      className="browser-chip"
      data-tone={
        entry.status === "CONFIRMED"
          ? "success"
          : entry.status === "DRAFT"
            ? "warning"
            : "neutral"
      }
    >
      {entry.status ? statusLabels[entry.status] : "状态未知"}
    </span>
  );
  const menu = (entry: WorkflowDefinitionEntry) => (
    <div className="crystra-task-browser-menu">
      <Menu
        label={`工作流操作：${entry.title}，${entry.revision}`}
        triggerContent={<Icon name="dots" />}
        side={list ? "auto" : "top"}
        items={[
          {
            id: "thumbnail",
            label: "修改缩略图",
            disabled: !onAction,
            onSelect: () => onAction?.(entry, "thumbnail"),
          },
          {
            id: "rename",
            label: "改名",
            disabled: !onAction,
            onSelect: () => onAction?.(entry, "rename"),
          },
          {
            id: "archive",
            label: "归档",
            disabled: !onArchive,
            onSelect: () => onArchive?.([entry]),
          },
          {
            id: "pin",
            label: entry.pinned ? "取消 Pin" : "Pin",
            disabled: !onAction,
            onSelect: () => onAction?.(entry, "pin"),
          },
        ]}
      />
    </div>
  );
  const card = (entry: WorkflowDefinitionEntry) => (
    <article
      className="browser-task-card"
      key={workflowEntryKey(entry)}
      data-resource-id={workflowEntryKey(entry)}
      data-selected={selected.has(workflowEntryKey(entry))}
    >
      <label className="task-select">{checkbox(entry)}</label>
      <button
        type="button"
        className="task-card-link"
        aria-label={`打开工作流：${entry.title}，${entry.revision}`}
        onClick={() => openEntry(entry)}
      >
        <div className="task-thumbnail">
          {entry.thumbnail ? (
            <img src={entry.thumbnail} alt={`${entry.title}的缩略图`} />
          ) : (
            <Icon name="git-branch" />
          )}
          <span className="workflow-revision" title={entry.revision}>
            {entry.revision}
          </span>
        </div>
        <div className="task-card-body">
          <div className="task-card-heading">
            <h3 title={entry.title}>{entry.title}</h3>
            {status(entry)}
          </div>
          <p className="task-card-goal" title={entry.purpose}>
            {entry.purpose ?? "用途尚未提供"}
          </p>
        </div>
      </button>
      {menu(entry)}
    </article>
  );
  return (
    <section
      className="crystra-task-browser crystra-workflow-explorer"
      data-section-id="main-surface-host"
    >
      <header
        className="browser-header"
        data-section-id="workflow-browser-header"
      >
        <div data-header-slot="identity">
          <h1>全部工作流</h1>
          <p>浏览定义，复用工作流。</p>
        </div>
        <div data-header-slot="search">
          <label className="browser-search">
            <Icon name="search" />
            <input
              type="search"
              maxLength={256}
              aria-label="搜索工作流"
              placeholder="搜索工作流、用途或版本…"
              value={query.query}
              onChange={(event) => update({ query: event.target.value })}
            />
          </label>
        </div>
        <section
          className="browser-toolbar"
          data-header-slot="toolbar"
          aria-label="工作流浏览选项"
        >
          <div
            className="browser-button-group"
            role="group"
            aria-label="筛选与排序"
          >
            {(
              [
                ["all", "全部"],
                ["confirmed", "已确认"],
                ["draft", "草稿"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={query.filter === value}
                onClick={() => update({ filter: value })}
              >
                {label}
              </button>
            ))}
            <div className="crystra-task-browser-sort">
              <Menu
                label={`排序：${{ updated: "最近更新", created: "创建时间", name: "名称" }[query.sort]}`}
                triggerContent={<Icon name="sort-descending" />}
                items={(
                  [
                    ["updated", "最近更新"],
                    ["created", "创建时间"],
                    ["name", "名称"],
                  ] as const
                ).map(([value, label]) => ({
                  id: value,
                  label,
                  checked: query.sort === value,
                  onSelect: () => update({ sort: value }),
                }))}
              />
            </div>
          </div>
          <div
            className="browser-button-group"
            role="group"
            aria-label="版本展示"
          >
            {(
              [
                ["latest", "最新版本"],
                ["all", "全部版本"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={query.versions === value}
                onClick={() => update({ versions: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <ToggleSwitch
            checked={list}
            onCheckedChange={setList}
            label="工作流视图"
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
            disabled={!onArchive || !selectedEntries.length}
            onClick={() => onArchive?.(selectedEntries)}
          >
            <Icon name="archive" />
          </button>
          <button
            type="button"
            className="browser-button"
            disabled={!onNewWorkflow}
            title={onNewWorkflow ? "新建工作流" : "新建工作流通路尚未接入"}
            onClick={onNewWorkflow}
          >
            <Icon name="plus" />
            新建工作流
          </button>
        </div>
      </header>
      <div
        ref={scroll}
        data-browser-id="browser-scroll"
        data-section-id="workflow-browser-content"
      >
        <div className="browser-results">
          <div className="browser-selection-summary">
            <label>
              <input
                type="checkbox"
                aria-label="全选结果"
                disabled={!matches.length || phase !== "ready"}
                checked={
                  !!matches.length && selectedEntries.length === matches.length
                }
                onChange={() =>
                  setSelected(
                    selectedEntries.length === matches.length
                      ? new Set()
                      : new Set(matches.map((entry) => entry.id)),
                  )
                }
              />
              全选结果
            </label>
            {phase === "ready" && (
              <p role="status">
                {query.versions === "latest"
                  ? `${matches.length} 项工作流`
                  : `${matches.length} 个版本 · ${new Set(matches.map((entry) => entry.definitionId)).size} 项工作流`}
                {selectedEntries.length
                  ? ` · 已选择 ${selectedEntries.length} 项`
                  : ""}
              </p>
            )}
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
                onChange={(event) => setGrouping(event.target.value)}
              >
                <option value="none">不分组</option>
                <option value="status">状态</option>
              </select>
            </label>
          )}
        </div>
        {phase === "unavailable" && (
          <p role="status">工作流目录接口尚未接入。</p>
        )}
        {phase === "loading" && <p role="status">正在读取工作流…</p>}
        {phase === "error" && (
          <p role="alert">{error ?? "工作流目录读取失败"}</p>
        )}
        <section hidden={!list} data-browser-id="browser-list">
          <table>
            <thead>
              <tr>
                {[
                  "选择工作流",
                  "工作流",
                  "版本",
                  "状态",
                  "节点数",
                  "创建时间",
                  "最近更新",
                  "操作",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches
                .slice((current - 1) * size, current * size)
                .map((entry) => (
                  <tr
                    key={entry.id}
                    data-resource-id={entry.id}
                    data-selected={selected.has(entry.id)}
                  >
                    <td>{checkbox(entry)}</td>
                    <td>
                      <button
                        type="button"
                        className="cell-primary"
                        aria-label={`打开工作流：${entry.title}，${entry.revision}`}
                        onClick={() => openEntry(entry)}
                      >
                        {entry.title}
                      </button>
                      <span className="cell-secondary">
                        {entry.purpose ?? "用途尚未提供"}
                      </span>
                    </td>
                    <td className="workflow-version-cell">{entry.revision}</td>
                    <td>{status(entry)}</td>
                    <td>
                      {Number.isInteger(entry.nodeCount) &&
                      entry.nodeCount! >= 0
                        ? entry.nodeCount
                        : "节点数未知"}
                    </td>
                    <td>
                      <Stamp value={entry.createdAt} />
                    </td>
                    <td>
                      <Stamp value={entry.updatedAt} />
                    </td>
                    <td>{menu(entry)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
        <div
          hidden={list}
          ref={gallery}
          data-browser-id="browser-gallery"
          style={
            { "--browser-card-width": `${geometry.width}px` } as CSSProperties
          }
        >
          {[...groups].map(([title, items]) => (
            <ResourceGalleryGroup
              key={`${title}:${JSON.stringify(query)}`}
              title={title}
              tasks={items}
              columns={geometry.columns}
              root={scroll}
              active={!list}
              anchorId={initial.anchorId}
              collapsed={folded.has(title)}
              onToggle={() =>
                setFolded((old) => {
                  const next = new Set(old);
                  if (next.has(title)) next.delete(title);
                  else next.add(title);
                  return next;
                })
              }
            >
              {card}
            </ResourceGalleryGroup>
          ))}
        </div>
        {phase === "ready" && !matches.length && (
          <div data-browser-id="browser-empty">
            <Icon name="file" />
            <p>没有符合条件的工作流</p>
            <span>
              试试其他关键词或筛选条件
              {query.versions === "latest" &&
              entries.some((entry) => entry.isLatest === undefined)
                ? "；部分定义尚无明确的最新版本，可查看全部版本。"
                : ""}
            </span>
          </div>
        )}
        {list && (
          <footer data-browser-id="browser-pagination">
            <label className="browser-select">
              每页
              <select
                aria-label="每页条数"
                value={size}
                onChange={(event) => {
                  setSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[12, 24, 48].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              条
            </label>
            <div>
              <span>
                {matches.length ? current : 0} / {matches.length ? pages : 0}
              </span>
              <button
                type="button"
                className="browser-button"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
              >
                上一页
              </button>
              <button
                type="button"
                className="browser-button"
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
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
