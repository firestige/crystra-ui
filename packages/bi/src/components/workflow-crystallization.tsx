import { useRef, useState } from "react";
import type { MapLayout } from "../domain/workflow-map-engine";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import "../workflow-crystallization.css";
import { Button, Card, Chip, IconButton, Typography } from "./design-system";
import { Icon } from "./icon";
import { ToggleSwitch } from "./toggle-switch";
import { WidgetTooltip } from "./widget-tooltip";
export interface WorkflowCrystallizationData {
  before: WorkflowMapIR;
  after: WorkflowMapIR;
  generated: Record<
    "before" | "after",
    { ir: WorkflowMapIR; layout: MapLayout }
  >;
  details: Record<
    string,
    { change: string; body: string; input: string; output: string }
  >;
  context: string;
  title: string;
  status: string;
  notice: string;
  benefitsNotice: string;
  summaries: Record<"before" | "after", string>;
  changes: Record<string, "new" | "adjusted" | "retained">;
  metrics: {
    title: string;
    subtitle: string;
    rows: [string, string][];
    description: string;
    footnote?: string;
    action?: string;
    quote?: string;
  }[];
  checks: string[];
  continuePrompt: string;
}
export function WorkflowCrystallization({
  data,
  quote,
}: {
  data: WorkflowCrystallizationData;
  quote: (text: string) => void;
}) {
  const { before, after, generated, details } = data;
  const [view, setView] = useState<"before" | "after">("after"),
    [selected, setSelected] = useState<string | null>(null),
    [benefits, setBenefits] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const ir = view === "before" ? before : after;
  const entry = generated[view];
  const layout =
    JSON.stringify(entry.ir) === JSON.stringify(ir)
      ? (entry.layout as unknown as MapLayout)
      : null;
  const error = "定义与布局不匹配，请重新生成候选布局。";
  const detail = selected ? details[selected] : null;
  return (
    <section
      className="crystal-workspace"
      data-section-id="workflow-crystallization"
    >
      <header className="crystal-header">
        <div>
          <Typography variant="meta" tone="muted">
            {data.context}
          </Typography>
          <Typography as="h2" variant="section-title">
            {data.title}
          </Typography>
        </div>
        <div className="crystal-actions">
          <Chip>{data.status}</Chip>
          <Button
            appearance="ghost"
            onClick={() => dialog.current?.showModal()}
          >
            检查方案
          </Button>
          <WidgetTooltip text="脚本与接口尚未验证，暂不能应用" focusable>
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
          {data.summaries[view]}
        </Typography>
        <WidgetTooltip text="查看样本与验证边界" focusable={false}>
          <IconButton
            appearance="ghost"
            aria-label="查看样本与验证边界"
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
                id="crystal-arrow"
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
                      e.arrow === false ? undefined : "url(#crystal-arrow)"
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
                      : data.changes[n.id] || "retained"
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
              {detail.body}
            </Typography>
            <Typography as="p" variant="meta">
              输入：{detail.input}
            </Typography>
            <Typography as="p" variant="meta">
              输出：{detail.output}
            </Typography>
            <Button
              appearance="ghost"
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
            {data.benefitsNotice}
          </Typography>
        </div>
        {benefits && (
          <div className="crystal-metrics">
            {data.metrics.map((metric) => (
              <Card key={metric.title} heading={metric.title}>
                <Typography variant="meta" tone="muted">
                  {metric.subtitle}
                </Typography>
                {metric.rows.map(([label, value]) => (
                  <div key={label} className="crystal-data-row">
                    <Typography variant="description">{label}</Typography>
                    <Typography variant="item-title">{value}</Typography>
                  </div>
                ))}
                <Typography as="p" variant="meta" tone="secondary">
                  {metric.description}
                </Typography>
                {metric.footnote && (
                  <Typography variant="meta" tone="muted">
                    {metric.footnote}
                  </Typography>
                )}
                {metric.action && (
                  <Button
                    appearance="ghost"
                    onClick={() =>
                      metric.quote
                        ? quote(metric.quote)
                        : dialog.current?.showModal()
                    }
                  >
                    {metric.action}
                  </Button>
                )}
              </Card>
            ))}
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
        {data.checks.map((check) => (
          <Typography key={check} as="p" variant="description" tone="secondary">
            {check}
          </Typography>
        ))}
        <Button
          appearance="ghost"
          onClick={() => {
            dialog.current?.close();
            quote(data.continuePrompt);
          }}
        >
          在 Chat 中继续完善
        </Button>
      </dialog>
    </section>
  );
}
