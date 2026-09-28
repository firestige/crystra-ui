import type { ObservationSetting } from "../domain/observation-settings";
import { SelectField } from "./state-components";
import { useAnalysisData } from "./analysis-context";
import type { OverviewFilters } from "../domain/analysis-overview";
import { createAnalysisLayout } from "../domain/analysis-default-layout";
import { LayoutHeader } from "../task-layout/layout-header";
import { useMemo, useState, type ReactNode } from "react";
import "../analysis-observation-study.css";
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
import "../widget-expression-study.css";
import "../widget-tooltip.css";
import { Tabs } from "./collection-components";
import { DashboardGrid } from "./dashboard-grid";
import { DeliveryDirectory } from "./delivery-directory";
import {
  IconButton,
  Button,
  ButtonGroup,
  Card,
  Typography,
} from "./design-system";
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
  observationRange,
  observationRangeLabel,
  observationTimeZone,
} from "./observation-time";
import { ObservationTimeControls } from "./observation-time-controls";
import { ResultAnalysisSurface } from "./result-analysis-preview";
import { TraceTree, TraceWaterfall } from "./trace-views";

export type AnalysisPage = "dashboard" | "traces" | "reports";
const headings: Record<AnalysisPage, string> = {
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
    <SelectField
      appearance="inline"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </SelectField>
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
/** Host-neutral analysis surface. URL and data adapters live outside the UI. */
export function AnalysisSurface({
  view: page,
  onViewChange,
  onReturnToGate,
  sourceContext = {},
  initialPeriod = "7d",
  period: controlledPeriod,
  onPeriodChange,
  initialScope = "all",
  sourceNotice,
  settings = [],
  onSettingsChange,
  layout: confirmedLayout,
  onLayoutChange,
  onRefresh,
  refreshCount = 0,
  refreshCadence = "0",
  onRefreshCadenceChange,
  dataNotice,
}: {
  view: AnalysisPage;
  onViewChange: (view: AnalysisPage) => void;
  onReturnToGate?: () => void;
  sourceContext?: Record<string, string>;
  initialPeriod?: string;
  period?: string;
  onPeriodChange?: (period: string) => void;
  initialScope?: string;
  sourceNotice?: string;
  dataNotice?: string;
  settings?: readonly ObservationSetting[];
  onSettingsChange?: (settings: ObservationSetting[]) => void;
  layout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onRefresh?: () => void;
  refreshCount?: number;
  refreshCadence?: string;
  onRefreshCadenceChange?: (cadence: string) => void;
}) {
  const data = useAnalysisData();
  const {
    referenceDate,
    tasks: observationTasks,
    roles,
    deliveries: deliveryDirectoryRecords,
    searchFields: deliveryDirectorySearchFields,
  } = data;
  const unresolved = !!sourceNotice;
  const sourceKeys = Object.keys(sourceContext);
  const [localPeriod, setPeriod] = useState(initialPeriod);
  const period = controlledPeriod ?? localPeriod;
  const [selectedScope, setScope] = useState(initialScope);
  const scope = page === "traces" ? selectedScope : "all";
  const [notice, setNotice] = useState("");
  const [traceView, setTraceView] = useState("waterfall");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliverySearchRecord | null>(null);
  const [runDirectoryOpen, setRunDirectoryOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rangePanelId, setRangePanelId] = useState<string | null>(null);
  const go = (next: AnalysisPage) => {
    onViewChange(next);
    setNotice("");
  };
  const [overviewFilters, setOverviewFilters] = useState<OverviewFilters>({
    group: "provider",
    workflow: "all",
    role: "all",
    tokens: "total",
  });
  const widgets = data.overview(period, overviewFilters);
  const queries = data.queries(period, overviewFilters);
  const [draftLayout, setDraftLayout] = useState<DashboardLayout | null>(null);
  const layout =
    draftLayout ?? confirmedLayout ?? createAnalysisLayout(widgets);
  const setLayout = (
    next: DashboardLayout | ((current: DashboardLayout) => DashboardLayout),
  ) => setDraftLayout(typeof next === "function" ? next(layout) : next);
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
      className="wb-host obs-host crystra-bi"
      data-crystra-theme="dark"
      data-section-id="main-surface-host"
    >
      <LayoutHeader
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
            onValueChange={(value) => go(value as AnalysisPage)}
            items={(Object.keys(headings) as AnalysisPage[]).map((value) => ({
              value,
              label: headings[value],
              panel: null,
            }))}
          />
        </div>
        <ObservationTimeControls
          referenceDate={referenceDate}
          period={period}
          onChange={(next) => {
            setPeriod(next);
            onPeriodChange?.(next);
          }}
          refreshDisabled={!!data.unavailableReason}
          refreshCount={refreshCount}
          onRefresh={onRefresh}
          cadence={refreshCadence}
          onCadenceChange={onRefreshCadenceChange}
        />
        <div className="obs-header-scope" data-header-slot="context">
          {page === "dashboard" &&
            !unresolved &&
            queries.metrics.length > 0 &&
            !!onLayoutChange && (
              <ObservationLayoutEditor
                editing={editing}
                layout={layout}
                sources={widgets}
                queries={queries}
                onChange={setLayout}
                onNotice={setNotice}
                onBegin={() => {
                  setDraftLayout(structuredClone(layout));
                  setEditing(true);
                }}
                onConfirm={() => {
                  onLayoutChange?.(layout);
                  setDraftLayout(null);
                  setEditing(false);
                }}
                onCancel={() => {
                  setDraftLayout(null);
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
      </LayoutHeader>
      {(dataNotice || data.unavailableReason) && (
        <p role="status" className="obs-data-status">
          {dataNotice || data.unavailableReason}
        </p>
      )}
      {unresolved ? (
        <div className="obs-scroll" data-section-id="unresolved-context">
          <Card heading="当前来源尚未解析">
            <Placeholder title="没有匹配的运行记录">{sourceNotice}</Placeholder>
            <dl className="wb-fields">
              {sourceKeys.map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{sourceContext[k]}</dd>
                </div>
              ))}
            </dl>
            {onReturnToGate && (
              <Button onClick={onReturnToGate}>返回审核关口</Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="obs-body" data-section-id="control-bench">
          {page === "dashboard" && (
            <div className="obs-scroll" data-section-id="observation-dashboard">
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
                                tokens: value as OverviewFilters["tokens"],
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
                                {w.label}
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
                            resolveObservationWidget(p, widgets, queries).view),
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
                            resolveObservationWidget(p, widgets, queries).view),
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
                        size={`${p.grid.h}x${p.grid.w}` as MonitoringWidgetSize}
                        exampleId={p.panel_id}
                      />
                    )}
                  />
                </section>
              ))}
            </div>
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
            <ResultAnalysisSurface
              embedded
              settings={settings}
              onSettingsChange={onSettingsChange}
              timeRange={deliveryRange}
              rangeLabel={observationRangeLabel(period, referenceDate)}
            />
          </div>
        </div>
      )}
      {notice && (
        <div className="obs-toast" role="status">
          <Icon name="circle-check" />
          {notice}
          <IconButton
            appearance="ghost"
            aria-label="关闭通知"
            onClick={() => setNotice("")}
          >
            <Icon name="x" />
          </IconButton>
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
