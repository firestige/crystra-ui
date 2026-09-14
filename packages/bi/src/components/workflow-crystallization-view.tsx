import mapTokens from "../../../../design/workflow-map.tokens.json";
import { useId, useRef, useState, type CSSProperties } from "react";
import type { MapLayout } from "../domain/workflow-map-engine";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import "../workflow-crystallization.css";
import { Button, Card, Chip, IconButton, Typography } from "./design-system";
import { Icon } from "./icon";
import { ToggleSwitch } from "./toggle-switch";
import { WidgetTooltip } from "./widget-tooltip";
/** UI consumer projection only; predictions never populate measured metrics. */
export interface CrystallizationProjection {
  id: string;
  baselineRevision: string;
  candidateRevision: string;
  title: string;
  scope: string;
  notice: string;
  before: WorkflowMapIR;
  after: WorkflowMapIR;
  layouts: Record<
    "before" | "after",
    { ir: WorkflowMapIR; layout: MapLayout } | null
  >;
  beforeSummary?: string;
  afterSummary?: string;
  details: Record<
    string,
    {
      kind: "new" | "adjusted" | "retained";
      change: string;
      body: string;
      beforeBody?: string;
      input: string;
      output: string;
    }
  >;
  history?: {
    sampleLabel: string;
    costShare: string;
    criticalPathShare: string;
    summary: string;
  };
  forecast?: {
    costChange: string;
    latencyChange: string;
    summary: string;
    assumptions: string[];
  };
  measured?: {
    scope: string;
    metrics: { label: string; value: string }[];
    summary: string;
  };
  validation: string[];
}
export function WorkflowCrystallizationView({
  data,
  onQuote,
}: {
  data: CrystallizationProjection;
  onQuote?: (reference: {
    proposalId: string;
    nodeId: string | null;
    text: string;
  }) => void;
}) {
  const { before, after, details } = data;
  const markerId = useId();
  const quote = (text: string) =>
    onQuote?.({ proposalId: data.id, nodeId: selected, text });
  const [view, setView] = useState<"before" | "after">("after"),
    [selected, setSelected] = useState<string | null>(null),
    [benefits, setBenefits] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const ir = view === "before" ? before : after;
  const entry = data.layouts[view];
  const layout =
    entry && JSON.stringify(entry.ir) === JSON.stringify(ir)
      ? entry.layout
      : null;
  const error = "定义与布局不匹配，请重新生成候选布局。";
  const detail = selected ? details[selected] : null;
  return (
    <section
      className="crystal-workspace"
      style={mapTokens.dark as CSSProperties}
      data-section-id="workflow-crystallization"
    >
      <header className="crystal-header">
        <div>
          <Typography variant="meta" tone="muted">
            {data.scope}
          </Typography>
          <Typography as="h2" variant="section-title">
            {data.title}
          </Typography>
        </div>
        <div className="crystal-actions">
          <Chip>候选方案</Chip>
          <Button
            appearance="ghost"
            onClick={() => dialog.current?.showModal()}
          >
            检查方案
          </Button>
          <WidgetTooltip text="正式变更提交通路尚未接入" focusable>
            <Button disabled>应用到草稿</Button>
          </WidgetTooltip>
        </div>
      </header>
      <div className="crystal-subhead">
        <div className="crystal-actions">
          <Typography
            variant="label"
            tone={view === "before" ? "primary" : "muted"}
          >
            变更前
          </Typography>
          <ToggleSwitch
            mode="choice"
            shape="round"
            label="变更对比"
            labels={["变更前", "变更后"]}
            checked={view === "after"}
            onCheckedChange={(checked) => setView(checked ? "after" : "before")}
          />
          <Typography
            variant="label"
            tone={view === "after" ? "primary" : "muted"}
          >
            变更后
          </Typography>
        </div>
        <Typography variant="meta" tone="muted">
          {view === "before"
            ? (data.beforeSummary ?? "基线版本定义")
            : (data.afterSummary ?? "候选版本定义")}
        </Typography>
        <WidgetTooltip text="查看来源与验证边界" focusable={false}>
          <IconButton
            appearance="ghost"
            aria-label="查看来源与验证边界"
            onClick={() => dialog.current?.showModal()}
          >
            <Icon name="help" />
          </IconButton>
        </WidgetTooltip>
      </div>
      <div className="crystal-canvas">
        <div className="crystal-legend">
          <span>
            <i className="crystal-new" />
            新增
          </span>
          <span>
            <i className="crystal-adjusted" />
            调整
          </span>
          <span>
            <i className="crystal-retained" />
            保留
          </span>
          <Typography variant="meta" tone="muted">
            {data.notice}
          </Typography>
        </div>
        {layout ? (
          <svg
            role="img"
            aria-label={view === "before" ? "变更前活动图" : "变更后活动图"}
            viewBox={`-32 -32 ${layout.width + 64} ${layout.height + 94}`}
          >
            <defs>
              <marker
                id={markerId}
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="4"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8" fill="none" stroke="context-stroke" />
              </marker>
            </defs>
            {layout.edges.map((e) => {
              const edge = ir.edges.find((x) => x.id === e.id);
              return (
                <g
                  key={e.segmentKey || e.id}
                  className={
                    edge?.intent === "recovery"
                      ? "crystal-recovery"
                      : "crystal-flow"
                  }
                >
                  <path
                    d={e.path}
                    fill="none"
                    strokeWidth="2"
                    markerEnd={
                      e.arrow === false ? undefined : `url(#${markerId})`
                    }
                  />
                  {e.label && (
                    <text x={e.label.x + 4} y={e.label.y + 16}>
                      {e.label.text}
                    </text>
                  )}
                </g>
              );
            })}
            {layout.nodes.map((n) => {
              const node = ir.nodes.find((x) => x.id === n.id);
              if (!node) return null;
              const terminal = node.kind === "start" || node.kind === "end";
              return (
                <g
                  key={n.id}
                  role={terminal ? undefined : "button"}
                  tabIndex={terminal ? undefined : 0}
                  aria-label={node.title}
                  className="crystal-node"
                  data-change={
                    view === "before" || terminal
                      ? "retained"
                      : (details[n.id]?.kind ?? "retained")
                  }
                  data-selected={selected === n.id}
                  onClick={() => !terminal && setSelected(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(n.id);
                    }
                  }}
                >
                  {terminal ? (
                    <>
                      <circle
                        cx={n.x + n.width / 2}
                        cy={n.y + n.height / 2}
                        r="22"
                      />
                      {node.kind === "end" && (
                        <circle
                          cx={n.x + n.width / 2}
                          cy={n.y + n.height / 2}
                          r="13"
                        />
                      )}
                    </>
                  ) : node.kind === "decision" ? (
                    <path
                      d={`M${n.x + n.width / 2} ${n.y}L${n.x + n.width} ${n.y + n.height / 2}L${n.x + n.width / 2} ${n.y + n.height}L${n.x} ${n.y + n.height / 2}Z`}
                    />
                  ) : (
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.width}
                      height={n.height}
                      rx="12"
                    />
                  )}
                  <text
                    x={n.x + n.width / 2}
                    y={terminal ? n.y + n.height + 23 : n.y + n.height / 2 + 3}
                    textAnchor="middle"
                  >
                    {node.title}
                  </text>
                  {node.resources && (
                    <text
                      className="crystal-node-binding"
                      x={n.x + n.width / 2}
                      y={n.y + n.height / 2 + 27}
                      textAnchor="middle"
                    >
                      {node.resources[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <Typography variant="description">
            {error || "正在整理变更布局…"}
          </Typography>
        )}
        {detail && (
          <aside className="crystal-detail">
            <div className="crystal-actions">
              <Typography variant="label">{detail.change}</Typography>
              <WidgetTooltip text="关闭活动变化详情" focusable={false}>
                <IconButton
                  appearance="ghost"
                  aria-label="关闭活动变化详情"
                  onClick={() => setSelected(null)}
                >
                  <Icon name="x" />
                </IconButton>
              </WidgetTooltip>
            </div>
            <Typography as="h3" variant="item-title">
              {ir.nodes.find((n) => n.id === selected)?.title ||
                after.nodes.find((n) => n.id === selected)?.title}
            </Typography>
            <Typography as="p" variant="description" tone="secondary">
              {view === "before"
                ? (detail.beforeBody ?? detail.body)
                : detail.body}
            </Typography>
            <Typography as="p" variant="meta">
              输入：{detail.input}
            </Typography>
            <Typography as="p" variant="meta">
              输出：{detail.output}
            </Typography>
            <Button
              appearance="ghost"
              disabled={!onQuote}
              aria-label="在 Chat 中讨论此变化"
              onClick={() =>
                quote(
                  "关于结晶候选「" +
                    after.nodes.find((n) => n.id === selected)?.title +
                    "」：",
                )
              }
            >
              在 Chat 中讨论
            </Button>
          </aside>
        )}
      </div>
      <section className="crystal-benefits">
        <div className="crystal-benefit-head">
          <Button
            appearance="ghost"
            aria-expanded={benefits}
            onClick={() => setBenefits((v) => !v)}
          >
            <Icon
              name="chevron-down"
              style={{ transform: benefits ? "none" : "rotate(-90deg)" }}
            />
            收益与验证
          </Button>
          <Typography variant="meta" tone="muted">
            {data.baselineRevision} → {data.candidateRevision}
          </Typography>
        </div>
        {benefits && (
          <div className="crystal-metrics">
            <Card as="section" aria-label="历史依据" heading="历史依据">
              <Typography variant="meta" tone="muted">
                {data.history?.sampleLabel ?? "尚无已绑定历史样本"}
              </Typography>
              <div className="crystal-data-row">
                <Typography variant="description">
                  拟替代部分的模型费用占比
                </Typography>
                <Typography variant="item-title">
                  {data.history?.costShare ?? "暂无数据"}
                </Typography>
              </div>
              <div className="crystal-data-row">
                <Typography variant="description">关键路径时间占比</Typography>
                <Typography variant="item-title">
                  {data.history?.criticalPathShare ?? "暂无数据"}
                </Typography>
              </div>
              <Typography as="p" variant="meta" tone="secondary">
                {data.history?.summary ?? "历史占用尚未提供。"}
              </Typography>
              <Button
                disabled={!onQuote}
                appearance="ghost"
                onClick={() =>
                  quote(
                    "请解释候选的历史占用，列出样本范围、覆盖率与重复模式。",
                  )
                }
              >
                在 Chat 中查看依据
              </Button>
            </Card>
            <Card as="section" aria-label="收益预测" heading="收益预测">
              <Typography variant="meta" tone="muted">
                预测 · 非实测结果
              </Typography>
              <div className="crystal-data-row">
                <Typography variant="description">单次运行费用</Typography>
                <Typography variant="item-title">
                  {data.forecast?.costChange ?? "尚无预测"}
                </Typography>
              </div>
              <div className="crystal-data-row">
                <Typography variant="description">端到端延迟</Typography>
                <Typography variant="item-title">
                  {data.forecast?.latencyChange ?? "尚无预测"}
                </Typography>
              </div>
              <Typography as="p" variant="meta" tone="secondary">
                {data.forecast?.summary ?? "预测模型与假设尚未提供。"}
              </Typography>
              <Button
                appearance="ghost"
                onClick={() => dialog.current?.showModal()}
              >
                查看预测假设
              </Button>
            </Card>
            <Card as="section" aria-label="实测对比" heading="实测对比">
              <Typography variant="meta" tone="muted">
                {data.measured?.scope ?? "候选版本尚无运行数据"}
              </Typography>
              {data.measured?.metrics.length ? (
                data.measured.metrics.map((metric) => (
                  <div className="crystal-data-row" key={metric.label}>
                    <Typography variant="description">
                      {metric.label}
                    </Typography>
                    <Typography variant="item-title">{metric.value}</Typography>
                  </div>
                ))
              ) : (
                <div className="crystal-data-row">
                  <Typography variant="description">
                    费用 / Token / 延迟
                  </Typography>
                  <Typography variant="item-title">—</Typography>
                </div>
              )}
              <Typography as="p" variant="description" tone="secondary">
                {data.measured?.summary ??
                  "形成新版本并积累运行数据后，用 Evaluation 的正常指标与基线比较。"}
              </Typography>
              <Typography variant="meta" tone="muted">
                保留原预测，后续对照实测偏差
              </Typography>
            </Card>
          </div>
        )}
      </section>
      <dialog ref={dialog} className="map-dialog" aria-label="方案检查">
        <div className="crystal-actions">
          <Typography variant="section-title">方案检查</Typography>
          <IconButton
            appearance="ghost"
            aria-label="关闭方案检查"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="x" />
          </IconButton>
        </div>
        <Typography as="p" variant="description">
          {data.notice}
        </Typography>
        <Typography as="p" variant="description" tone="secondary">
          预测需保留样本、费用来源、关键路径、适用比例、恢复频率、脚本开销和算法版本；费用占比不能直接当作节省比例。
        </Typography>
        <ul>
          {(data.forecast?.assumptions ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ul>
          {data.validation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Typography as="p" variant="description" tone="secondary">
          检查完成后才能应用到工作流草稿；发布仍需通过版本门禁。当前不会写入包文件。
        </Typography>
        <Button
          disabled={!onQuote}
          appearance="ghost"
          onClick={() => {
            dialog.current?.close();
            quote("请继续完善结晶方案，先确认接口、历史依据与版本对比范围。");
          }}
        >
          在 Chat 中继续完善
        </Button>
      </dialog>
    </section>
  );
}
