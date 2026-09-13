import {
  decodeObservationLayout,
  encodeObservationLayout,
  ObservationSources,
  resolveObservationSource,
  resolveObservationWidget,
} from "./observation-layout-codec";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  applyChartRange,
  defaultChartRange,
  supportsChartRange,
  type ChartRange,
} from "../domain/chart-range";
import {
  panelSizeForGrid,
  type DashboardLayout,
} from "../domain/layout/layout";
import {
  queryBinding,
  type ObservationQuery,
  type ObservationQueryCatalog,
} from "../domain/observation-query";
import type { MonitoringWidgetSize } from "../domain/widget-catalog";
import {
  chartMinimumSize,
  familyViews,
  isWidgetSizeAllowed,
  type View,
  type WidgetData,
} from "../domain/widget-families";
import { dashboardLayout } from "../test-harness/dashboard-fixture";
import { downloadConfiguration } from "./configuration-download";
import { ConfigurationFileInput } from "./configuration-file";
import { Button, ButtonGroup, IconButton } from "./design-system";
import { Icon, type IconName } from "./icon";
import { SemanticWidget } from "./semantic-widget";
import { WidgetTooltip } from "./widget-tooltip";
export function ObservationWidget({
  result,
  view,
  size,
  exampleId,
}: {
  result: { data: WidgetData; empty?: boolean };
  view: View;
  size: MonitoringWidgetSize;
  exampleId?: string;
}) {
  if (!result.empty)
    return (
      <SemanticWidget
        data={result.data}
        view={view}
        size={size}
        exampleId={exampleId}
      />
    );
  const [h, w] = size.split("x").map(Number);
  return (
    <article
      className="crystra-monitoring-widget"
      data-size={size}
      style={{ width: w * 160 + (w - 1) * 16, height: h * 160 + (h - 1) * 16 }}
      aria-label={result.data.title}
    >
      <header className="crystra-monitoring-widget-header">
        <span className="crystra-monitoring-widget-title">
          {result.data.title}
        </span>
      </header>
      <div className="crystra-monitoring-widget-content obs-query-empty">
        所选范围暂无数据
      </div>
    </article>
  );
}
export function ObservationLayoutEditor({
  editing,
  onBegin,
  onConfirm,
  onCancel,
  layout,
  onChange,
  sources,
  queries,
  onNotice,
}: {
  editing: boolean;
  onBegin: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  layout: DashboardLayout;
  onChange: (layout: DashboardLayout) => void;
  sources: ObservationSources;
  queries: ObservationQueryCatalog;
  onNotice: (text: string) => void;
}) {
  const [adding, setAdding] = useState(false),
    [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const exportFile = () => {
    try {
      downloadConfiguration(
        encodeObservationLayout(layout, sources, queries),
        "crystra-layout.json",
      );
      onNotice("布局下载已开始");
    } catch (error) {
      onNotice(
        `无法导出：${error instanceof Error ? error.message : "文件操作失败"}`,
      );
    }
  };
  const frame = useRef<HTMLDivElement>(null);
  const previousEditing = useRef(editing);
  const motion = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const root = frame.current;
    if (!root || previousEditing.current === editing) return;
    const from = motion.current.some(
      (a) => a.playState === "running" || a.playState === "paused",
    )
      ? root.getBoundingClientRect().width
      : previousEditing.current
        ? 184
        : 104;
    previousEditing.current = editing;
    motion.current.forEach((a) => a.cancel());
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const group = root.querySelector<HTMLElement>(".obs-layout-group")!;
    const trigger = root.querySelector<HTMLElement>(".obs-layout-trigger")!;
    const outgoing = editing ? trigger : group;
    const incoming = editing ? group : trigger;
    // One frame contracts fully before revealing and expanding its next content.
    // Explicit timelines keep the frame and both contents in the same phase.
    motion.current = [
      root.animate(
        [
          { width: `${from}px`, offset: 0, easing: "cubic-bezier(.4,0,.2,1)" },
          { width: "34px", offset: 0.45, easing: "cubic-bezier(.22,1,.36,1)" },
          { width: `${editing ? 184 : 104}px`, offset: 1 },
        ],
        { duration: 560 },
      ),
      outgoing.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 0, offset: 0.36 },
          { opacity: 0, offset: 1 },
        ],
        { duration: 560 },
      ),
      incoming.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.5 },
          { opacity: 1, offset: 0.88 },
          { opacity: 1, offset: 1 },
        ],
        { duration: 560 },
      ),
    ];
  }, [editing]);
  useEffect(() => () => motion.current.forEach((a) => a.cancel()), []);
  const actions: {
    label: string;
    icon: IconName;
    run: "export" | "import" | "add" | "save" | "cancel";
  }[] = [
    { label: "导出布局", icon: "download", run: "export" },
    {
      label: "导入布局",
      icon: "upload",
      run: "import",
    },
    { label: "添加 Widget", icon: "plus", run: "add" },
    { label: "保存布局", icon: "check", run: "save" },
    { label: "取消编辑", icon: "x", run: "cancel" },
  ];
  return (
    <>
      <ConfigurationFileInput
        inputRef={fileInput}
        label="导入布局文件"
        onBusy={setBusy}
        onFile={async (file) => {
          const imported = decodeObservationLayout(
            await file.text(),
            sources,
            queries,
          );
          onChange(imported);
          onNotice("布局已加载，可继续编辑后保存");
        }}
        onError={(error) =>
          onNotice(
            `无法导入：${error instanceof Error ? error.message : "文件操作失败"}`,
          )
        }
      />
      <div ref={frame} className="obs-layout-editor" data-expanded={editing}>
        <div
          className="obs-layout-group"
          inert={!editing}
          aria-hidden={!editing}
        >
          <ButtonGroup role="group" aria-label="布局编辑操作">
            {actions.map((action) => (
              <WidgetTooltip
                key={action.label}
                text={action.label}
                focusable={false}
              >
                <IconButton
                  aria-label={action.label}
                  appearance="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (action.run === "export") exportFile();
                    else if (action.run === "import")
                      fileInput.current?.click();
                    else if (action.run === "save") onConfirm();
                    else if (action.run === "cancel") onCancel();
                    else setAdding(true);
                  }}
                >
                  <Icon name={action.icon} />
                </IconButton>
              </WidgetTooltip>
            ))}
          </ButtonGroup>
        </div>
        <Button
          className="obs-layout-trigger"
          aria-hidden={editing}
          inert={editing}
          appearance="ghost"
          onClick={onBegin}
        >
          <Icon name="adjustments-horizontal" />
          编辑布局
        </Button>
      </div>
      {adding && (
        <AddObservationWidget
          queries={queries}
          onClose={() => setAdding(false)}
          onAdd={(source, title, view, size, range) => {
            const [h, w] = size.split("x").map(Number);
            const grid = {
              x: 0,
              y: Math.max(
                0,
                ...layout.panels
                  .filter(
                    (p) =>
                      resolveObservationWidget(p, sources, queries).topic ===
                      resolveObservationSource(source, sources, queries).topic,
                  )
                  .map((p) => p.grid.y + p.grid.h),
              ),
              w,
              h,
            };
            onChange({
              ...layout,
              panels: [
                ...layout.panels,
                {
                  ...dashboardLayout.panels[0],
                  panel_id: "widget-" + crypto.randomUUID(),
                  channels: {
                    source,
                    title,
                    expressionView: view,
                    ...(range ? { range: JSON.stringify(range) } : {}),
                  },
                  grid,
                  size: panelSizeForGrid(grid),
                },
              ],
            });
            setAdding(false);
          }}
        />
      )}
    </>
  );
}
function AddObservationWidget({
  queries,
  onAdd,
  onClose,
}: {
  queries: ObservationQueryCatalog;
  onAdd: (
    source: string,
    title: string,
    view: View,
    size: MonitoringWidgetSize,
    range?: ChartRange,
  ) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState<ObservationQuery>({
    metric: "calls",
    providers: "all",
    models: "all",
    groupBy: "none",
    time: "summary",
    tokens: "total",
  });
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [chosenView, setChosenView] = useState<View | null>(null);
  const [chosenSize, setChosenSize] = useState<MonitoringWidgetSize | null>(
    null,
  );
  const [customSizing, setCustomSizing] = useState(false);
  const [customRows, setCustomRows] = useState("3");
  const [customColumns, setCustomColumns] = useState("3");
  const [range, setRange] = useState<ChartRange | undefined>();
  const metric = queries.metrics.find((m) => m.id === query.metric)!;
  const result = queries.resolve(query);
  const recipes = familyViews(result.data);
  const view = recipes.some((v) => v.id === chosenView)
    ? chosenView!
    : result.view;
  const recipe = recipes.find((v) => v.id === view)!;
  const minimum = chartMinimumSize(result.data, view);
  const customSize =
    `${Number(customRows)}x${Number(customColumns)}` as MonitoringWidgetSize;
  const sizeError =
    customSizing && !isWidgetSizeAllowed(result.data, view, customSize);
  const size =
    customSizing && minimum && !sizeError
      ? customSize
      : chosenSize && isWidgetSizeAllowed(result.data, view, chosenSize)
        ? chosenSize
        : recipe.sizes.includes(result.size)
          ? result.size
          : recipe.sizes[0];
  const activeRange = range ?? defaultChartRange(view);
  let rangeError = "";
  let previewData = result.data;
  try {
    previewData = applyChartRange(result.data, view, activeRange);
  } catch (error) {
    rangeError = (error as Error).message;
  }
  const title = customTitle ?? result.data.title;
  const update = (patch: Partial<ObservationQuery>) =>
    setQuery((current) => ({ ...current, ...patch }));
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const groups = {
    none: "不分组 · 合并统计",
    provider: "按 Provider 比较",
    model: "按 Model 比较",
    role: "按 Role 比较",
  };
  const modelOptions = queries.models.filter(
    (m) => query.providers === "all" || query.providers.includes(m.provider),
  );
  return (
    <dialog
      ref={dialog}
      className="obs-widget-dialog obs-query-dialog"
      aria-label="添加 Widget"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <h2>添加 Widget</h2>
          <p className="obs-query-intro">
            选择要观察的指标，再决定如何比较与展示。
          </p>
        </div>
        <IconButton
          aria-label="关闭添加窗口"
          appearance="ghost"
          onClick={onClose}
        >
          <Icon name="x" />
        </IconButton>
      </header>
      <div className="obs-widget-form">
        <div className="obs-widget-fields">
          <section className="obs-query-section">
            <h3>
              <span>1</span> 观察指标
            </h3>
            <label>
              指标
              <select
                aria-label="指标"
                value={query.metric}
                onChange={(e) => {
                  const next = queries.metrics.find(
                    (m) => m.id === e.target.value,
                  )!;
                  setQuery({
                    ...query,
                    metric: next.id,
                    providers: "all",
                    models: "all",
                    groupBy:
                      next.id === "cache"
                        ? "provider"
                        : next.groups.includes(query.groupBy)
                          ? query.groupBy
                          : next.groups[0],
                    time: next.times.includes(query.time)
                      ? query.time
                      : next.times[0],
                  });
                  setCustomTitle(null);
                  setChosenView(null);
                  setChosenSize(null);
                  setCustomSizing(false);
                  setRange(undefined);
                }}
              >
                {["resources", "quality"].map((topic) => (
                  <optgroup
                    key={topic}
                    label={
                      topic === "resources" ? "资源消耗" : "Workflow 运行质量"
                    }
                  >
                    {queries.metrics
                      .filter((m) => m.topic === topic)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <p>{metric.description}</p>
          </section>
          <section className="obs-query-section">
            <h3>
              <span>2</span> 范围与数据组织
            </h3>
            {metric.dimensions && (
              <>
                <DimensionSelection
                  label="Provider"
                  options={queries.providers.map((p) => ({ id: p, label: p }))}
                  value={query.providers}
                  onChange={(providers) => update({ providers, models: "all" })}
                />
                <DimensionSelection
                  label="Model"
                  options={modelOptions}
                  value={query.models}
                  onChange={(models) => update({ models })}
                />
              </>
            )}
            <div className="obs-query-pair">
              <label>
                分组
                <select
                  aria-label="分组"
                  value={query.groupBy}
                  onChange={(e) =>
                    update({
                      groupBy: e.target.value as ObservationQuery["groupBy"],
                    })
                  }
                >
                  {metric.groups.map((g) => (
                    <option key={g} value={g}>
                      {groups[g]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                时间组织
                <select
                  aria-label="时间组织"
                  value={query.time}
                  onChange={(e) =>
                    update({ time: e.target.value as ObservationQuery["time"] })
                  }
                >
                  {metric.times.map((t) => (
                    <option key={t} value={t}>
                      {t === "summary" ? "所选周期汇总" : "按日趋势"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {query.metric === "tokens" && (
              <label>
                Token 类型
                <select
                  aria-label="Token 类型"
                  value={query.tokens}
                  onChange={(e) =>
                    update({
                      tokens: e.target.value as ObservationQuery["tokens"],
                    })
                  }
                >
                  <option value="total">合计</option>
                  <option value="input">输入</option>
                  <option value="output">输出</option>
                </select>
              </label>
            )}
            <p>
              跟随 Header
              时间范围。全部来源会自动纳入新接入的来源；指定来源保持所选集合。
            </p>
          </section>
          <section className="obs-query-section">
            <h3>
              <span>3</span> 表达与尺寸
            </h3>
            <div>
              <label>
                Widget 表达方式
                <select
                  aria-label="Widget 表达方式"
                  value={view}
                  onChange={(e) => setChosenView(e.target.value as View)}
                >
                  {recipes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="obs-widget-sizes">
              <legend>尺寸 · 行 × 列</legend>
              <div role="group" aria-label="尺寸">
                {recipe.sizes.map((s) => {
                  const [h, w] = s.split("x").map(Number);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-label={s.replace("x", " × ")}
                      aria-pressed={!customSizing && size === s}
                      onClick={() => {
                        setChosenSize(s);
                        setCustomSizing(false);
                      }}
                    >
                      <span
                        className="obs-size-grid"
                        aria-hidden="true"
                        style={{ gridTemplateColumns: `repeat(${w}, 5px)` }}
                      >
                        {Array.from({ length: h * w }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                      <span>{s.replace("x", " × ")}</span>
                      <small>
                        {w * 160 + (w - 1) * 16} × {h * 160 + (h - 1) * 16}px
                      </small>
                    </button>
                  );
                })}
                {minimum && (
                  <button
                    type="button"
                    aria-label="自定义"
                    aria-pressed={customSizing}
                    onClick={() => {
                      setCustomSizing(true);
                      const [h, w] = size.split("x");
                      setCustomRows(h);
                      setCustomColumns(w);
                    }}
                  >
                    自定义<small>仅限制最小尺寸</small>
                  </button>
                )}
              </div>
              {minimum && customSizing && (
                <div className="obs-query-pair obs-custom-size">
                  <label>
                    行数
                    <input
                      type="number"
                      aria-label="行数"
                      min={minimum.h}
                      step="1"
                      value={customRows}
                      onChange={(e) => setCustomRows(e.target.value)}
                    />
                  </label>
                  <label>
                    列数
                    <input
                      type="number"
                      aria-label="列数"
                      min={minimum.w}
                      step="1"
                      value={customColumns}
                      onChange={(e) => setCustomColumns(e.target.value)}
                    />
                  </label>
                </div>
              )}
              {minimum && (
                <p className={sizeError ? "obs-query-error" : undefined}>
                  最小 {minimum.h} × {minimum.w}；行列为整数，无上限。
                  {customSizing && !sizeError
                    ? `当前 ${Number(customColumns) * 176 - 16} × ${Number(customRows) * 176 - 16}px。`
                    : ""}
                </p>
              )}
            </fieldset>
            {supportsChartRange(result.data, view) && (
              <ChartRangeFields
                data={result.data}
                value={activeRange}
                onChange={setRange}
              />
            )}
            {rangeError && (
              <p role="alert" className="obs-query-error">
                {rangeError}
              </p>
            )}
            <label>
              标题
              <input
                aria-label="标题"
                value={title}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </label>
          </section>
        </div>
        <div className="obs-query-preview-column">
          <div className="obs-query-preview-heading">
            <span>实时预览</span>
            <span>
              {size.replace("x", " × ")} · {recipe.label}
            </span>
          </div>
          <div className="obs-widget-preview">
            {result.empty ? (
              <div className="obs-query-empty">所选范围暂无数据</div>
            ) : (
              <SemanticWidget
                data={{ ...previewData, title: title || result.data.title }}
                view={view}
                size={size}
              />
            )}
          </div>
          <p className="obs-query-summary">
            {metric.label} ·{" "}
            {query.providers === "all"
              ? "全部 Provider"
              : query.providers.join("、")}{" "}
            · {groups[query.groupBy]} ·{" "}
            {query.time === "daily" ? "按日趋势" : "周期汇总"}
          </p>
          {query.metric === "cache" && (
            <p className="obs-query-note">
              分组比较保留各来源命中率；不分组时按输入 Token
              加权合并。百分比不做堆叠相加。
            </p>
          )}
          <p className="obs-query-note">
            添加后放在所属主题的布局末尾，可拖拽调整位置。
          </p>
        </div>
      </div>
      <footer>
        <Button appearance="ghost" onClick={onClose}>
          取消
        </Button>
        <Button
          disabled={!title.trim() || sizeError || !!rangeError}
          onClick={() =>
            onAdd(
              queryBinding(query),
              title.trim(),
              view,
              size,
              supportsChartRange(result.data, view) ? activeRange : undefined,
            )
          }
        >
          添加到末尾
        </Button>
      </footer>
    </dialog>
  );
}
function DimensionSelection({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; provider?: string }[];
  value: "all" | readonly string[];
  onChange: (value: "all" | string[]) => void;
}) {
  return (
    <div className="obs-query-dimension">
      <label>
        {label}
        <select
          aria-label={label}
          value={value === "all" ? "all" : "selected"}
          onChange={(e) =>
            onChange(
              e.target.value === "all" ? "all" : options.map((o) => o.id),
            )
          }
        >
          <option value="all">全部 {label}</option>
          <option value="selected">指定 {label}</option>
        </select>
      </label>
      {value !== "all" && (
        <div
          className="obs-query-options"
          role="group"
          aria-label={`选择 ${label}`}
        >
          {options.map((option) => (
            <label key={option.id} className="obs-query-check">
              <input
                type="checkbox"
                checked={value.includes(option.id)}
                disabled={value.length === 1 && value.includes(option.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...value, option.id]
                      : value.filter((id) => id !== option.id),
                  )
                }
              />
              <span>
                {option.provider
                  ? `${option.provider} / ${option.label}`
                  : option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartRangeFields({
  data,
  value,
  onChange,
}: {
  data: WidgetData;
  value: ChartRange;
  onChange: (value: ChartRange) => void;
}) {
  const percent = "unit" in data && data.unit === "%";
  return (
    <div className="obs-chart-range-fields">
      <label>
        数值范围
        <select
          aria-label="数值范围"
          value={value.mode}
          onChange={(e) =>
            onChange({
              mode: e.target.value as ChartRange["mode"],
              ...(e.target.value === "custom"
                ? {
                    min: "domain" in data ? data.domain?.[0] : 0,
                    max: "domain" in data ? data.domain?.[1] : 100,
                  }
                : {}),
            })
          }
        >
          <option value="auto">自动 · 按数据范围</option>
          <option value="zero">从零开始</option>
          {percent && <option value="full">完整百分比 · 0—100%</option>}
          <option value="custom">自定义上下限</option>
        </select>
      </label>
      {value.mode === "custom" && (
        <div className="obs-query-pair">
          <label>
            下限
            <input
              type="number"
              step="any"
              aria-label="数值下限"
              value={value.min ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  min:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            上限
            <input
              type="number"
              step="any"
              aria-label="数值上限"
              value={value.max ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  max:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
        </div>
      )}
      <p>折线使用 Y 轴范围，热力图使用色标范围；自动范围随数据更新。</p>
    </div>
  );
}
export function ObservationRangeDialog({
  data,
  view,
  size,
  initial,
  onApply,
  onClose,
}: {
  data: WidgetData;
  view: View;
  size: MonitoringWidgetSize;
  initial?: ChartRange;
  onApply: (range: ChartRange) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [range, setRange] = useState(initial ?? defaultChartRange(view));
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  let error = "",
    preview = data;
  try {
    preview = applyChartRange(data, view, range);
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <dialog
      ref={dialog}
      className="obs-widget-dialog"
      aria-label="图表数值范围"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2>图表数值范围</h2>
        <IconButton aria-label="关闭范围设置" onClick={onClose}>
          <Icon name="x" />
        </IconButton>
      </header>
      <div className="obs-widget-form">
        <div className="obs-widget-fields">
          <ChartRangeFields data={data} value={range} onChange={setRange} />
          {error && <p role="alert">{error}</p>}
        </div>
        <div className="obs-widget-preview">
          <SemanticWidget data={preview} view={view} size={size} />
        </div>
      </div>
      <footer>
        <Button appearance="ghost" onClick={onClose}>
          取消
        </Button>
        <Button disabled={!!error} onClick={() => onApply(range)}>
          应用范围
        </Button>
      </footer>
    </dialog>
  );
}
