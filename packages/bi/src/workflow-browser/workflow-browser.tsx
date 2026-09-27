import { SearchField, SelectField } from "../components/state-components";
import { ResourceBrowserPagination } from "../task-layout/resource-browser-pagination";
import { ResourceViewToggle } from "../components/resource-view-toggle";
import { ResourceStatus } from "../components/resource-items";
import { useMemo, useState, type ReactNode } from "react";
import { ResourceBrowserHeader } from "../task-layout/resource-browser-header";
import {
  ResourceGalleryCard,
  ResourceTableRow,
} from "../components/resource-items";
import {
  Button,
  IconButton,
  ButtonGroup,
  Divider,
} from "../components/design-system";
import { AdaptiveChoice } from "../components/adaptive-choice";
import { ActionMenu, type ActionMenuItem } from "../components/action-menu";
import { Icon } from "../components/icon";
import { WidgetTooltip } from "../components/widget-tooltip";
import "../task-layout/resource-browser.css";
export interface BrowserWorkflow {
  definitionId: string;
  title: string;
  version: string;
  revision: string;
  packageStatus: string;
  packageName: string;
  directory: string;
  nodeCount?: number;
  updatedAt?: number;
  createdAt?: number;
}
export interface WorkflowBrowserSurfaceProps {
  items: BrowserWorkflow[];
  feedback?: ReactNode;
  busy?: boolean;
  workflowHref: (workflow: BrowserWorkflow) => string;
  onOpen: (
    workflow: BrowserWorkflow,
    view: "studio" | "resources" | "crystallization",
  ) => void;
  onCopyDirectory?: (workflow: BrowserWorkflow) => void;
}
const statusLabel = (status: string) =>
  ({ CONFIRMED: "已确认", DRAFT: "草稿" })[status] ?? status;
const stamp = (value?: number) =>
  value === undefined
    ? "暂无数据"
    : new Date(value).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
const identity = (w: BrowserWorkflow) =>
  JSON.stringify([w.definitionId, w.revision]);
/** Controlled local catalogue view. Host owns navigation, source discovery and writes. */
export function WorkflowBrowserSurface({
  items,
  feedback,
  busy = false,
  workflowHref,
  onOpen,
  onCopyDirectory,
}: WorkflowBrowserSurfaceProps) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("name"),
    [list, setList] = useState(false),
    [group, setGroup] = useState("none"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(12),
    [limit, setLimit] = useState(24),
    [selected, setSelected] = useState<string[]>([]),
    [collapsed, setCollapsed] = useState<string[]>([]);
  const [menu, setMenu] = useState<{
    resourceKey: string;
    trigger: HTMLElement;
    label: string;
    items: ActionMenuItem[];
    inward?: boolean;
  } | null>(null);
  const results = useMemo(
    () =>
      items
        .filter(
          (w) =>
            (filter === "all" || w.packageStatus === filter) &&
            [w.title, w.definitionId, w.packageName, w.version].some((v) =>
              v.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
            ),
        )
        .sort((a, b) =>
          sort === "updated"
            ? (b.updatedAt ?? 0) - (a.updatedAt ?? 0) ||
              a.title.localeCompare(b.title)
            : a.title.localeCompare(b.title),
        ),
    [items, query, filter, sort],
  );
  const reset = () => {
    setPage(1);
    setLimit(24);
    setSelected([]);
    setMenu(null);
  };
  const count = selected.filter((id) =>
    results.some((w) => identity(w) === id),
  ).length;
  const pages = Math.max(1, Math.ceil(results.length / size)),
    current = Math.min(page, pages),
    shown = list
      ? results.slice((current - 1) * size, current * size)
      : results.slice(0, limit);
  const groups = shown.reduce<Record<string, BrowserWorkflow[]>>((acc, w) => {
    const key = group === "status" ? w.packageStatus : "all";
    (acc[key] ??= []).push(w);
    return acc;
  }, {});
  const selection = (w: BrowserWorkflow) => (
    <input
      type="checkbox"
      aria-label={`选择 ${w.title}`}
      checked={selected.includes(identity(w))}
      onChange={() =>
        setSelected((ids) =>
          ids.includes(identity(w))
            ? ids.filter((id) => id !== identity(w))
            : [...ids, identity(w)],
        )
      }
    />
  );
  const actions = (w: BrowserWorkflow) => (
    <IconButton
      appearance="ghost"
      size="compact"
      className="browser-item-actions"
      disabled={busy}
      aria-label={`工作流操作：${w.title}`}
      aria-haspopup="menu"
      aria-expanded={menu?.resourceKey === identity(w)}
      onClick={(e) =>
        setMenu(
          menu?.trigger === e.currentTarget
            ? null
            : {
                resourceKey: identity(w),
                trigger: e.currentTarget,
                label: `工作流操作：${w.title}`,
                inward: !list,
                items: [
                  {
                    label: "流程设计",
                    icon: <Icon name="git-branch" />,
                    onChoose: () => onOpen(w, "studio"),
                  },
                  {
                    label: "资源配置",
                    icon: <Icon name="file" />,
                    onChoose: () => onOpen(w, "resources"),
                  },
                  {
                    label: "结晶分析",
                    icon: <Icon name="diamond" />,
                    onChoose: () => onOpen(w, "crystallization"),
                  },
                  {
                    label: "复制本地路径",
                    icon: <Icon name="copy" />,
                    onChoose: onCopyDirectory
                      ? () => onCopyDirectory(w)
                      : undefined,
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
      className="browser-host crystra-bi crystra-resource-browser crystra-workflow-browser"
      data-crystra-theme="dark"
      data-section-id="workflow-browser"
    >
      <ResourceBrowserHeader
        identity={
          <div data-header-slot="identity">
            <h1>全部工作流</h1>
            <p>浏览定义，复用工作流。</p>
          </div>
        }
        search={
          <div data-header-slot="search">
            <SearchField
              appearance="outline"
              hideLabel
              label="搜索工作流"
              leading={<Icon name="search" size="navigation" />}

              placeholder="搜索工作流、包名或版本…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
            />
          </div>
        }
        toolbar={
          <div data-header-slot="toolbar" className="browser-toolbar">
            <ButtonGroup joined divided segmented aria-label="工作流浏览工具">
              <AdaptiveChoice
                label="筛选工作流"
                functionIcon={<Icon name="filter" />}
                compactIconOnly
                value={filter}
                options={[
                  { value: "all", label: "全部", icon: <Icon name="list" /> },
                  {
                    value: "CONFIRMED",
                    label: "已确认",
                    icon: <Icon name="circle-check" />,
                  },
                  {
                    value: "DRAFT",
                    label: "草稿",
                    icon: <Icon name="pencil" />,
                  },
                ]}
                onChange={(v) => {
                  setFilter(v);
                  reset();
                }}
              />
              <Divider orientation="vertical" />
              <AdaptiveChoice
                label="工作流排序"
                functionIcon={<Icon name="sort-descending" />}
                compactIconOnly
                collapseBelow={1200}
                value={sort}
                options={[
                  { value: "name", label: "名称", icon: <Icon name="list" /> },
                  {
                    value: "updated",
                    label: "最近更新",
                    icon: <Icon name="clock" />,
                  },
                ]}
                onChange={(v) => {
                  setSort(v);
                  reset();
                }}
              />
              <Divider orientation="vertical" />
              <WidgetTooltip
                text="本地目录仅提供当前版本，暂无历史版本目录"
                focusable
              >
                <Button
                  appearance="segment"
                  selected
                  disabled
                  aria-label="版本显示：当前版本"
                >
                  当前版本
                </Button>
              </WidgetTooltip>
              <Divider orientation="vertical" />
              <ResourceViewToggle
                label="工作流视图"
                value={list ? "list" : "gallery"}
                onValueChange={(value) => {
                  setMenu(null);
                  setList(value === "list");
                }}
              />
              <Divider orientation="vertical" />
              <WidgetTooltip text="归档工作流尚未接入" focusable>
                <IconButton
                  aria-label="归档所选工作流"
                  tone="danger"
                  raised
                  disabled
                >
                  <Icon name="archive" />
                </IconButton>
              </WidgetTooltip>
              <WidgetTooltip
                text="新建工作流尚未接入，请先在设置中绑定已有的本地目录"
                focusable
              >
                <IconButton
                  aria-label="新建工作流"
                  tone="primary"
                  raised
                  disabled
                >
                  <Icon name="plus" />
                </IconButton>
              </WidgetTooltip>
            </ButtonGroup>
          </div>
        }
      />
      <div id="browser-scroll" data-section-id="workflow-explorer-content">
        {feedback}
        <div className="browser-results">
          <div className="browser-selection-summary">
            <label className="browser-select-all">
              <input
                type="checkbox"
                aria-label="全选结果"
                checked={results.length > 0 && count === results.length}
                disabled={!results.length}
                onChange={() =>
                  setSelected(
                    count === results.length ? [] : results.map(identity),
                  )
                }
              />
              全选结果
            </label>
            <p role="status">
              {results.length} 个工作流
              {count > 0 ? ` · 已选择 ${count} 个` : ""}
            </p>
            {count > 0 && (
              <Button appearance="ghost" onClick={() => setSelected([])}>
                取消选择
              </Button>
            )}
          </div>
          {!list && (
            <SelectField
              appearance="inline"
              label="分组"
              options={[
                { value: "none", label: "不分组" },
                { value: "status", label: "状态" },
              ]}
              aria-label="工作流分组"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setCollapsed([]);
              }}
            />
          )}
        </div>
        {!results.length ? (
          <div id="browser-empty">
            <Icon name="git-branch" />
            <p>{items.length ? "没有符合条件的工作流" : "暂无本地工作流"}</p>
            {!items.length && <p>在设置中绑定本地工作流目录。</p>}
          </div>
        ) : list ? (
          <section id="browser-list">
            <table>
              <thead>
                <tr>
                  {[
                    "选择",
                    "工作流",
                    "版本",
                    "状态",
                    "节点",
                    "创建时间",
                    "最近更新",
                    "操作",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((w) => (
                  <ResourceTableRow
                    key={identity(w)}
                    title={w.title}
                    href={workflowHref(w)}
                    selection={selection(w)}
                    selected={selected.includes(identity(w))}
                    cells={[
                      w.version,
                      statusLabel(w.packageStatus),
                      w.nodeCount ?? "暂无数据",
                      stamp(w.createdAt),
                      stamp(w.updatedAt),
                    ]}
                    actions={actions(w)}
                  />
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div id="browser-gallery">
            {Object.entries(groups).map(([key, rows]) => (
              <section className="browser-group" key={key}>
                <button
                  className="browser-group-heading"
                  aria-expanded={!collapsed.includes(key)}
                  onClick={() =>
                    setCollapsed((v) =>
                      v.includes(key)
                        ? v.filter((k) => k !== key)
                        : [...v, key],
                    )
                  }
                >
                  <Icon name="chevron-down" size="navigation" />
                  {key === "all" ? "全部工作流" : statusLabel(key)}
                  <span className="group-count">{rows.length}</span>
                </button>
                <div className="browser-flow" hidden={collapsed.includes(key)}>
                  {rows.map((w) => (
                    <ResourceGalleryCard
                      key={identity(w)}
                      title={w.title}
                      subtitle={`${w.version} · ${w.packageName}`}
                      href={workflowHref(w)}
                      selected={selected.includes(identity(w))}
                      selection={selection(w)}
                      thumbnail={<Icon name="git-branch" />}
                      status={
                        <ResourceStatus
                          label={statusLabel(w.packageStatus)}
                          tone={
                            w.packageStatus === "CONFIRMED"
                              ? "success"
                              : "neutral"
                          }
                        />
                      }
                      actions={actions(w)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        {list ? (
          <ResourceBrowserPagination
            page={current}
            pages={pages}
            pageSize={size}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setSize(value);
              setPage(1);
            }}
          />
        ) : (
          shown.length < results.length && (
            <Button onClick={() => setLimit((v) => v + 24)}>
              加载更多工作流
            </Button>
          )
        )}
      </div>
      {menu && <ActionMenu {...menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
