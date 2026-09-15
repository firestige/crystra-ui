import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import "../analysis-observation-study.css";
import "../crystra-analysis.css";
import {
  defaultChartRange,
  supportsChartRange,
  type ChartRange,
} from "../domain/chart-range";
import type { DeliverySearchRecord } from "../domain/delivery-search";
import {
  panelSizeForGrid,
  type DashboardLayout,
} from "../domain/layout/layout";
import { type MonitoringWidgetSize } from "../domain/widget-catalog";
import {
  chartMinimumSize,
  familyViews,
  isWidgetSizeAllowed,
  type View,
} from "../domain/widget-families";
import "../monitoring-bi.css";
import "../monitoring-widget-base.css";
import "../monitoring-widget.css";
import { PRESET_LAYOUTS } from "../domain/layout/layout";
import type { ObservationQueryCatalog } from "../domain/observation-query";
import type { TraceView } from "../domain/trace/trace-view";
import type { DeliverySearchField } from "../domain/delivery-search";
import type { ObservationSources } from "./observation-layout-codec";
const dashboardLayout = PRESET_LAYOUTS["default-overview@1"];
export interface AnalysisOverviewFilters {
  group: "provider" | "model";
  workflow: string;
  role: string;
  tokens: "total" | "input" | "output";
}
export interface AnalysisWorkspaceData {
  tasks: readonly { id: string; name: string }[];
  samples: readonly { task: string; date: string }[];
  roles: readonly string[];
  workflows: readonly { id: string; name: string }[];
  deliveries: readonly DeliverySearchRecord[];
  searchFields: readonly DeliverySearchField[];
  sources: (
    period: string,
    filters: AnalysisOverviewFilters,
  ) => ObservationSources;
  queries: (
    period: string,
    filters: AnalysisOverviewFilters,
  ) => ObservationQueryCatalog;
  trace: (record: DeliverySearchRecord) => TraceView | null;
}
import "../widget-expression-study.css";
import "../widget-tooltip.css";
import { Tabs } from "./collection-components";
import { DashboardGrid } from "./dashboard-grid";
import { DeliveryDirectory } from "./delivery-directory";
import { Button, ButtonGroup, Card, Typography } from "./design-system";
import { Icon } from "./icon";
import {
  resolveObservationSource,
  resolveObservationWidget,
} from "./observation-layout-codec";
import {
  ObservationLayoutEditor,
  ObservationRangeDialog,
  ObservationWidget,
} from "./observation-layout-editor";
import {
  inObservationRange,
  observationRange,
  observationRangeLabel,
  observationTimeZone,
} from "./observation-time";
import { ObservationTimeControls } from "./observation-time-controls";

import { TraceTree, TraceWaterfall } from "./trace-views";

export type AnalysisWorkspacePage = "dashboard" | "traces" | "reports";
const headings: Record<AnalysisWorkspacePage, string> = {
  dashboard: "总览",
  traces: "调用追踪",
  reports: "对比分析",
};
function Text({ children }: { children: ReactNode }) {
  return (
    <Typography variant="description" tone="secondary">
      {children}
    </Typography>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="obs-select">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <Icon name="chevron-down" />
    </label>
  );
}
function Placeholder({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="obs-empty">
      <Icon name="file" size="widget-signal" />
      <Typography variant="section-title">{title}</Typography>
      <Text>{children}</Text>
    </div>
  );
}
export function AnalysisWorkspace({
  page,
  onPageChange,
  data,
  initialPeriod,
  referenceDate,
  renderComparison,
  initialQuery = "",
  onStateChange,
  onRefresh,
}: {
  page: AnalysisWorkspacePage;
  onPageChange: (page: AnalysisWorkspacePage) => void;
  data: AnalysisWorkspaceData;
  initialPeriod: string;
  referenceDate: string;
  renderComparison: (props: {
    timeRange: readonly [string, string];
    rangeLabel: string;
  }) => ReactNode;
  initialQuery?: string;
  onStateChange?: (state: {
    page: AnalysisWorkspacePage;
    period: string;
    scope: string;
  }) => void;
  onRefresh?: () => void;
}) {
  const initial = useMemo(
    () => new URLSearchParams(initialQuery),
    [initialQuery],
  );
  const {
    tasks: observationTasks,
    samples: observationSamples,
    roles,
    deliveries: deliveryDirectoryRecords,
    searchFields: deliveryDirectorySearchFields,
    sources: overviewSources,
    queries: createObservationQueryCatalog,
  } = data;
  const sourceKeys = [
    "plan_run_id",
    "wave_id",
    "workflow_run_id",
    "trace_root_id",
    "from_gate_id",
    "attempt",
    "span_id",
    "event_id",
    "task_id",
    "delivery_id",
    "trace_id",
  ];
  const unresolved = sourceKeys.some((key) => initial.has(key));
  const [period, setPeriod] = useState(initialPeriod);
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = useCallback(() => {
    setRefreshCount((n) => n + 1);
    onRefresh?.();
  }, [onRefresh]);
  const [selectedScope, setScope] = useState(
    observationTasks.some((t) => t.id === initial.get("scope"))
      ? initial.get("scope")!
      : "all",
  );
  const scope = page === "traces" ? selectedScope : "all";
  const [notice, setNotice] = useState("");
  const [traceView, setTraceView] = useState("waterfall");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliverySearchRecord | null>(null);
  const [runDirectoryOpen, setRunDirectoryOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rangePanelId, setRangePanelId] = useState<string | null>(null);
  const records = useMemo(
    () =>
      observationSamples.filter(
        (r) =>
          (scope === "all" || r.task === scope) &&
          inObservationRange(r.date, period, referenceDate),
      ),
    [scope, period, referenceDate, observationSamples],
  );
  const go = (next: AnalysisWorkspacePage) => {
    onPageChange(next);
    setNotice("");
  };
  useEffect(() => {
    onStateChange?.({ page, period, scope });
  }, [page, period, scope, onStateChange]);
  const [overviewFilters, setOverviewFilters] =
    useState<AnalysisOverviewFilters>({
      group: "provider",
      workflow: "all",
      role: "all",
      tokens: "total",
    });
  const sourcePeriod =
    "custom:" + observationRange(period, referenceDate).join("/");
  const widgets = overviewSources(sourcePeriod, overviewFilters);
  const queries = createObservationQueryCatalog(sourcePeriod, overviewFilters);
  const initialLayout = (): DashboardLayout => {
    const panels: DashboardLayout["panels"] = [];
    for (const topic of ["resources", "quality"]) {
      let x = 0,
        y = 0,
        rowHeight = 0;
      const entries = Object.entries(widgets).filter(
        ([, item]) => item.topic === topic,
      );
      if (topic === "resources") {
        const order = [
          "spend",
          "equivalent",
          "calls",
          "input",
          "costTrend",
          "callTrend",
          "tokenTrend",
          "cache0",
          "cache1",
          "cache2",
          "subscription",
        ];
        entries.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
      }
      for (const [id, item] of entries) {
        const [h, w] = item.size.split("x").map(Number);
        // Keep summaries, daily trends, and cache/subscription context on separate rows.
        const startsResourceRow =
          topic === "resources" && ["cache0", "costTrend"].includes(id);
        if (x + w > 9 || (startsResourceRow && x > 0)) {
          y += rowHeight;
          x = 0;
          rowHeight = 0;
        }
        const grid = { x, y, w, h };
        panels.push({
          ...dashboardLayout.panels[0],
          panel_id: id,
          grid,
          size: panelSizeForGrid(grid),
          channels: { source: id },
        });
        x += w;
        rowHeight = Math.max(rowHeight, h);
      }
    }
    return { ...dashboardLayout, name: "系统观测", panels };
  };
  const [layout, setLayout] = useState(initialLayout);
  const [savedLayout, setSavedLayout] = useState(layout);
  const deliveryRange = useMemo<readonly [string, string]>(() => {
    const [start, end] = observationRange(period, referenceDate);
    return [start + observationTimeZone, end + observationTimeZone];
  }, [period, referenceDate]);
  const deliveryRecords = useMemo(
    () =>
      deliveryDirectoryRecords.filter(
        (record) => scope === "all" || record.taskId === scope,
      ),
    [scope, deliveryDirectoryRecords],
  );
  const trace = useMemo(
    () => (selectedDelivery ? data.trace(selectedDelivery) : null),
    [selectedDelivery, data],
  );
  const traceNavigation = (
    <ButtonGroup aria-label="Trace 表达方式">
      {[
        ["waterfall", "瀑布图"],
        ["tree", "树图"],
      ].map(([v, label]) => (
        <Button
          key={v}
          appearance="segment"
          aria-pressed={traceView === v}
          onClick={() => setTraceView(v)}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
  const rangePanel = rangePanelId
    ? layout.panels.find((panel) => panel.panel_id === rangePanelId)
    : undefined;
  const rangeResult = rangePanel
    ? resolveObservationSource(
        rangePanel.channels.source ?? rangePanel.panel_id,
        widgets,
        queries,
      )
    : undefined;
  const rangeView = rangePanel
    ? ((rangePanel.channels.expressionView ?? rangeResult?.view) as View)
    : undefined;
  return (
    <section
      className="wb-host obs-host crystra-analysis-host"
      data-section-id="main-surface-host"
    >
      <header
        className="wb-header wb-page-header obs-header"
        data-section-id="workspace-header"
      >
        <div data-header-slot="identity" className="wb-identity">
          <span className="wb-context-icon">
            <Icon name="activity" size="context-marker" />
          </span>
          <div>
            <Typography as="h1" variant="page-title">
              观测与分析
            </Typography>
            <Text>了解运行，追溯调用，研究差异。</Text>
          </div>
        </div>
        <div data-header-slot="navigation">
          <Tabs
            appearance="underline"
            aria-label="观测工作面"
            value={page}
            onValueChange={(value) => go(value as AnalysisWorkspacePage)}
            items={(Object.keys(headings) as AnalysisWorkspacePage[]).map(
              (value) => ({
                value,
                label: headings[value],
                panel: null,
              }),
            )}
          />
        </div>
        <ObservationTimeControls
          period={period}
          referenceDate={referenceDate}
          onChange={setPeriod}
          refreshCount={refreshCount}
          onRefresh={refresh}
        />
        <div className="obs-header-scope" data-header-slot="context">
          {page === "dashboard" && !unresolved && (
            <ObservationLayoutEditor
              editing={editing}
              layout={layout}
              sources={widgets}
              queries={queries}
              onChange={setLayout}
              onNotice={setNotice}
              onBegin={() => {
                setSavedLayout(layout);
                setEditing(true);
              }}
              onConfirm={() => {
                setSavedLayout(layout);
                setEditing(false);
              }}
              onCancel={() => {
                setLayout(savedLayout);
                setEditing(false);
              }}
            />
          )}
          {page === "traces" && (
            <Select label="观察范围" value={scope} onChange={setScope}>
              <option value="all">全部 Task</option>
              {observationTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </header>
      {unresolved ? (
        <div className="obs-scroll" data-section-id="unresolved-context">
          <Card heading="当前来源尚未解析">
            <Placeholder title="没有匹配的运行记录">
              保留指定的 Task、Delivery 和 Trace 身份，接入真实查询后读取。
            </Placeholder>
            <dl className="wb-fields">
              {sourceKeys
                .filter((k) => initial.has(k))
                .map((k) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{initial.get(k)}</dd>
                  </div>
                ))}
            </dl>
            {initial.has("from_gate_id") && (
              <a
                className="wb-return"
                href={
                  "crystra-task-work-v8-sidebar.html?" +
                  new URLSearchParams([
                    ...initial.entries(),
                    ["surface", "gate"],
                    ["gate_id", initial.get("from_gate_id")!],
                  ])
                }
              >
                返回审核关口
              </a>
            )}
          </Card>
        </div>
      ) : (
        <div className="obs-body" data-section-id="control-bench">
          {records.length === 0 && page === "dashboard" ? (
            <Placeholder title="所选时间范围没有记录">
              请调整日期范围。
            </Placeholder>
          ) : (
            page === "dashboard" && (
              <div
                className="obs-scroll"
                data-section-id="observation-dashboard"
              >
                {(["resources", "quality"] as const).map((topic) => (
                  <section
                    className="obs-overview-topic"
                    data-overview-topic={topic}
                    key={topic}
                  >
                    <div className="obs-topic-heading">
                      <div>
                        <Typography as="h2" variant="section-title">
                          {topic === "resources"
                            ? "资源消耗"
                            : "Workflow 运行质量"}
                        </Typography>
                        <Text>
                          {topic === "resources"
                            ? "周期消耗、来源分布与订阅使用价值"
                            : "执行效率、返工与人工介入"}
                        </Text>
                      </div>
                      <div className="obs-topic-controls">
                        {topic === "resources" ? (
                          <>
                            <Select
                              label="Tokens"
                              value={overviewFilters.tokens}
                              onChange={(value) =>
                                setOverviewFilters((f) => ({
                                  ...f,
                                  tokens:
                                    value as AnalysisOverviewFilters["tokens"],
                                }))
                              }
                            >
                              <option value="total">合计</option>
                              <option value="input">输入</option>
                              <option value="output">输出</option>
                            </Select>
                            <ButtonGroup aria-label="资源分组">
                              {(["provider", "model"] as const).map((value) => (
                                <Button
                                  key={value}
                                  appearance="segment"
                                  selected={overviewFilters.group === value}
                                  onClick={() =>
                                    setOverviewFilters((f) => ({
                                      ...f,
                                      group: value,
                                    }))
                                  }
                                >
                                  {value === "provider" ? "Provider" : "Model"}
                                </Button>
                              ))}
                            </ButtonGroup>
                          </>
                        ) : (
                          <>
                            <Select
                              label="Workflow"
                              value={overviewFilters.workflow}
                              onChange={(workflow) =>
                                setOverviewFilters((f) => ({ ...f, workflow }))
                              }
                            >
                              <option value="all">全部工作流</option>
                              {data.workflows.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </Select>
                            <Select
                              label="Role"
                              value={overviewFilters.role}
                              onChange={(role) =>
                                setOverviewFilters((f) => ({ ...f, role }))
                              }
                            >
                              <option value="all">全部角色</option>
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </Select>
                          </>
                        )}
                      </div>
                    </div>
                    <DashboardGrid
                      exactWidgets
                      layout={{
                        ...layout,
                        panels: layout.panels.filter(
                          (p) =>
                            resolveObservationWidget(p, widgets, queries)
                              .topic === topic,
                        ),
                      }}
                      editing={editing}
                      onLayoutChange={(next) =>
                        setLayout((current) => ({
                          ...current,
                          panels: [
                            ...current.panels.filter(
                              (p) =>
                                resolveObservationWidget(p, widgets, queries)
                                  .topic !== topic,
                            ),
                            ...next.panels,
                          ],
                        }))
                      }
                      getWidgetSizes={(p) =>
                        familyViews(
                          resolveObservationWidget(p, widgets, queries).data,
                        ).find(
                          (v) =>
                            v.id ===
                            (p.channels.expressionView ??
                              resolveObservationWidget(p, widgets, queries)
                                .view),
                        )!.sizes
                      }
                      getWidgetMinimumSize={(p) => {
                        const resolved = resolveObservationWidget(
                          p,
                          widgets,
                          queries,
                        );
                        const view = (p.channels.expressionView ??
                          resolved.view) as View;
                        return chartMinimumSize(resolved.data, view);
                      }}
                      canConfigureWidgetRange={(p) => {
                        const resolved = resolveObservationWidget(
                          p,
                          widgets,
                          queries,
                        );
                        const view = (p.channels.expressionView ??
                          resolved.view) as View;
                        return supportsChartRange(resolved.data, view);
                      }}
                      onConfigureWidgetRange={(p) => {
                        const resolved = resolveObservationWidget(
                          p,
                          widgets,
                          queries,
                        );
                        const view = (p.channels.expressionView ??
                          resolved.view) as View;
                        if (supportsChartRange(resolved.data, view))
                          setRangePanelId(p.panel_id);
                      }}
                      getWidgetViews={(p) =>
                        familyViews(
                          resolveObservationWidget(p, widgets, queries).data,
                        ).map((v) => ({
                          id: v.id,
                          label: v.label,
                          selected:
                            v.id ===
                            (p.channels.expressionView ??
                              resolveObservationWidget(p, widgets, queries)
                                .view),
                          onChoose: () =>
                            setLayout((current) => ({
                              ...current,
                              panels: current.panels.map((row) => {
                                if (row.panel_id !== p.panel_id) return row;
                                const old =
                                  `${row.grid.h}x${row.grid.w}` as MonitoringWidgetSize;
                                const data = resolveObservationWidget(
                                  p,
                                  widgets,
                                  queries,
                                ).data;
                                const [h, w] = (
                                  isWidgetSizeAllowed(data, v.id, old)
                                    ? old
                                    : v.sizes[0]
                                )
                                  .split("x")
                                  .map(Number);
                                return {
                                  ...row,
                                  channels: {
                                    ...row.channels,
                                    expressionView: v.id,
                                  },
                                  grid: { ...row.grid, h, w },
                                  size: panelSizeForGrid({ h, w }),
                                };
                              }),
                            })),
                        }))
                      }
                      renderPanel={(p) => (
                        <ObservationWidget
                          result={resolveObservationWidget(p, widgets, queries)}
                          view={
                            (p.channels.expressionView ??
                              resolveObservationWidget(p, widgets, queries)
                                .view) as View
                          }
                          size={
                            `${p.grid.h}x${p.grid.w}` as MonitoringWidgetSize
                          }
                          exampleId={p.panel_id}
                        />
                      )}
                    />
                  </section>
                ))}
              </div>
            )
          )}
          {page === "traces" && (
            <div
              className="obs-trace-layout"
              data-directory-open={runDirectoryOpen}
            >
              <aside
                id="trace-run-directory"
                className="obs-trace-directory"
                aria-label="调用记录目录"
                aria-hidden={!runDirectoryOpen}
                inert={!runDirectoryOpen}
              >
                <DeliveryDirectory
                  records={deliveryRecords}
                  searchFields={deliveryDirectorySearchFields}
                  range={deliveryRange}
                  selectedId={selectedDelivery?.deliveryId ?? null}
                  onSelectionChange={setSelectedDelivery}
                />
              </aside>
              <div className="obs-scroll obs-trace-main">
                <div className="obs-trace-toolbar">
                  <Button
                    appearance="ghost"
                    aria-label={
                      runDirectoryOpen ? "收起调用目录" : "展开调用目录"
                    }
                    title={runDirectoryOpen ? "收起调用目录" : "展开调用目录"}
                    aria-expanded={runDirectoryOpen}
                    aria-controls="trace-run-directory"
                    onClick={() => setRunDirectoryOpen((open) => !open)}
                  >
                    <Icon
                      name="chevron-down"
                      className="obs-directory-chevron"
                    />
                  </Button>
                  {traceNavigation}
                </div>
                <div
                  data-section-id="trace-reconstruction"
                  data-delivery-id={selectedDelivery?.deliveryId}
                  data-trace-id={trace?.traceId}
                >
                  {!trace ? (
                    <Placeholder title="没有匹配的调用记录">
                      请调整检索、筛选或时间范围。
                    </Placeholder>
                  ) : traceView === "waterfall" ? (
                    <TraceWaterfall
                      fillHeight
                      key={trace.traceId}
                      trace={trace}
                      showSummary={false}
                    />
                  ) : (
                    <TraceTree
                      key={trace.traceId}
                      trace={trace}
                      showSummary={false}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          <div
            hidden={page !== "reports"}
            className="obs-comparison-workspace"
            data-section-id="comparison-analysis"
          >
            {renderComparison({
              timeRange: deliveryRange,
              rangeLabel: observationRangeLabel(period, referenceDate),
            })}
          </div>
        </div>
      )}
      {notice && (
        <div className="obs-toast" role="status">
          <Icon name="circle-check" />
          {notice}
          <button aria-label="关闭通知" onClick={() => setNotice("")}>
            <Icon name="x" />
          </button>
        </div>
      )}
      {rangePanel && rangeResult && rangeView && (
        <ObservationRangeDialog
          data={{
            ...rangeResult.data,
            title: rangePanel.channels.title ?? rangeResult.data.title,
          }}
          view={rangeView}
          size={`${rangePanel.grid.h}x${rangePanel.grid.w}`}
          initial={
            rangePanel.channels.range
              ? (JSON.parse(rangePanel.channels.range) as ChartRange)
              : defaultChartRange(rangeView)
          }
          onClose={() => setRangePanelId(null)}
          onApply={(range) => {
            setLayout((current) => ({
              ...current,
              panels: current.panels.map((panel) =>
                panel.panel_id === rangePanel.panel_id
                  ? {
                      ...panel,
                      channels: {
                        ...panel.channels,
                        range: JSON.stringify(range),
                      },
                    }
                  : panel,
              ),
            }));
            setRangePanelId(null);
          }}
        />
      )}
    </section>
  );
}
