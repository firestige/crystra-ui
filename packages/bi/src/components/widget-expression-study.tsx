import { SemanticWidget } from "./semantic-widget";
import { FAMILY_FIXTURES } from "../domain/widget-families";
import { MonitoringWidget } from "./monitoring-widget";
import { Icon } from "./icon";
import { WidgetTooltip } from "./widget-tooltip";
import type { MonitoringWidgetSize } from "../domain/widget-catalog";
import "../widget-expression-study.css";

import {
  EXPRESSIONS,
  expressionSizes,
  type Kind,
  type Expression,
} from "../domain/widget-expressions";
const Stat = ({ value, unit }: { value: string; unit?: string }) => (
  <span className="expression-number">
    {value}
    {unit && <small>{unit}</small>}
  </span>
);
function Content({ id }: { id: Kind }) {
  switch (id) {
    case "pair":
      return (
        <div className="expression-columns">
          <div>
            <label>输入</label>
            <Stat value="8.2k" unit="tokens" />
          </div>
          <div>
            <label>输出</label>
            <Stat value="1.6k" unit="tokens" />
          </div>
        </div>
      );
    case "compare":
      return (
        <div className="expression-columns">
          <div>
            <label>基准 · A</label>
            <Stat value="64" unit="ms" />
          </div>
          <div>
            <label>对照 · B</label>
            <Stat value="42" unit="ms" />
          </div>
          <div className="expression-delta">
            <label>变化</label>
            <span className="expression-change">
              <Icon name="triangle-inverted-filled" />
              <Stat value="−22" unit="ms" />
            </span>
          </div>
        </div>
      );
    case "history":
      return (
        <div className="expression-history-body">
          <p className="expression-secondary">
            执行记录 · 09:00—11:00 · 色带长度代表持续时间
          </p>
          <div className="expression-history">
            {[
              {
                name: "构建 #128",
                segments: [
                  ["运行", 40],
                  ["待审核", 30],
                  ["运行", 20],
                  ["已完成", 30],
                ],
              },
              {
                name: "回归 #64",
                segments: [
                  ["运行", 65],
                  ["暂停", 20],
                  ["运行", 35],
                ],
              },
              {
                name: "审阅 #37",
                segments: [
                  ["待审核", 50],
                  ["运行", 30],
                  ["已完成", 40],
                ],
              },
              {
                name: "打包 #91",
                segments: [
                  ["运行", 30],
                  ["暂停", 15],
                  ["运行", 45],
                  ["已完成", 30],
                ],
              },
            ].map((row) => (
              <div key={row.name}>
                <label>{row.name}</label>
                <div>
                  {row.segments.map(([state, minutes], j) => (
                    <span
                      key={j}
                      title={`${row.name} · ${state} ${minutes} 分钟`}
                      style={{
                        flex: Number(minutes),
                        background: (
                          {
                            运行: "#679efe",
                            待审核: "#f0b85e",
                            暂停: "#ba92f5",
                            已完成: "#32bd91",
                          } as Record<string, string>
                        )[String(state)],
                      }}
                    >
                      {Number(minutes) >= 30 ? state : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="expression-time">
            {["09:00", "09:30", "10:00", "10:30", "11:00"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="expression-history-legend">
            {[
              ["运行", "#679efe"],
              ["待审核", "#f0b85e"],
              ["暂停", "#ba92f5"],
              ["已完成", "#32bd91"],
            ].map(([label, color]) => (
              <span key={label}>
                <i style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      );
  }
}

export function ExpressionWidget({
  id,
  size,
}: {
  id: Kind;
  size?: MonitoringWidgetSize;
}) {
  const fixture = FAMILY_FIXTURES[id];
  if (fixture)
    return (
      <SemanticWidget
        data={fixture.data}
        view={fixture.view}
        size={size ?? EXPRESSIONS.find((e) => e.id === id)!.size}
        exampleId={id}
      />
    );
  if (size && !expressionSizes(id).includes(size))
    throw new Error(`Unsupported ${id} size: ${size}`);
  const selected =
    (id === "gauge" || id === "gauge-compact") && size
      ? size === "1x1"
        ? "gauge-compact"
        : "gauge"
      : id;
  return <Specimen entry={EXPRESSIONS.find((e) => e.id === selected)!} />;
}
/** A fixed design specimen; no runtime HTML generated from model output. */
function Specimen({ entry }: { entry: Expression }) {
  if (entry.id === "gauge-compact")
    return (
      <article
        className="widget crystra-monitoring-widget expression-widget expression-gauge-compact"
        data-size="1x1"
        aria-label={entry.title}
        style={{ width: 160, height: 160 }}
      >
        <span className="expression-corner-status">
          <WidgetTooltip text="当前结果可用">
            <Icon
              name="circle-check"
              style={{ width: 18, height: 18 }}
              aria-label="可用"
            />
          </WidgetTooltip>
        </span>
        <Content id={entry.id} />
      </article>
    );
  if (["text", "pair", "gauge", "radar"].includes(entry.id))
    return (
      <article
        className={`widget crystra-monitoring-widget expression-widget expression-${entry.id}`}
        data-expression={entry.id}
        aria-label={entry.title}
        style={{ width: 336, height: entry.size === "2x2" ? 336 : 160 }}
      >
        <header className="crystra-monitoring-widget-header">
          <span className="crystra-monitoring-widget-title">{entry.title}</span>
        </header>
        <div className="crystra-monitoring-widget-content">
          <Content id={entry.id} />
        </div>
      </article>
    );
  const compact = entry.size === "1x1";
  // New text/pair draft frames reuse the base CSS without claiming a catalog category.
  return (
    <MonitoringWidget
      category={entry.category!}
      size={entry.size}
      className={`expression-widget expression-${entry.id}`}
      aria-label={entry.title}
      leading={
        compact ? (
          <WidgetTooltip text={entry.title}>
            <Icon
              name={entry.id === "state" ? "activity" : "clock"}
              size="widget-signal"
            />
          </WidgetTooltip>
        ) : undefined
      }
      title={compact ? undefined : entry.title}
      primary={<Content id={entry.id} />}
      status={
        compact ? (
          <span className="expression-corner-status">
            <WidgetTooltip text="当前结果可用">
              <Icon
                name="circle-check"
                style={{ width: 18, height: 18 }}
                aria-label="可用"
              />
            </WidgetTooltip>
          </span>
        ) : undefined
      }
    />
  );
}
export function WidgetExpressionStudy() {
  return (
    <main className="expression-study">
      <header>
        <h1>Widget 表达方式</h1>
        <p>
          先选择读者需要的表达，再评判视觉与尺寸。表达方式已确认；全部为虚构样例，固定代码渲染。
        </p>
        <p>
          1×1保留已定的中央图标与居中文本、左下角辅助状态。其他样本只提出一种明确配方；没有默认详情按钮。
        </p>
      </header>
      <div className="expression-study-grid">
        {EXPRESSIONS.map((entry, i) => (
          <section className="expression-study-item" key={entry.id}>
            <h2>
              {String(i + 1).padStart(2, "0")} · {entry.name}
            </h2>
            <p className="expression-question">{entry.question}</p>
            <div className="expression-stage">
              <ExpressionWidget id={entry.id} />
            </div>
            <p>{entry.rule}</p>
            <p className="expression-meta">
              建议 {entry.size.replace("x", "×")} · 内部输入：{entry.shape}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
