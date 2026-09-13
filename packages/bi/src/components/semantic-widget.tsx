import { useLayoutEffect, useRef, useState } from "react";
import {
  widgetSpan,
  type MonitoringWidgetSize,
} from "../domain/widget-catalog";
import {
  isWidgetSizeAllowed,
  type View,
  type WidgetData,
} from "../domain/widget-families";
import { Icon } from "./icon";
import { StructuredChart } from "./structured-widget-charts";
import { WidgetTooltip } from "./widget-tooltip";
const colors = ["#679efe", "#32bd91", "#ba92f5", "#f0b85e"];
const Num = ({ value, unit }: { value: number | string; unit?: string }) => (
  <span className="expression-number">
    {value}
    {unit && <small>{unit}</small>}
  </span>
);
const polar = (cx: number, cy: number, r: number, angle: number) => [
  cx + r * Math.cos(angle),
  cy + r * Math.sin(angle),
];
function arc(cx: number, cy: number, r: number, a: number, b: number) {
  const p = polar(cx, cy, r, a),
    q = polar(cx, cy, r, b);
  return `M ${p[0]} ${p[1]} A ${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${q[0]} ${q[1]}`;
}
function Gauge({
  data,
  compact,
}: {
  data: Extract<WidgetData, { family: "scalar" }>;
  compact: boolean;
}) {
  const [min, max] = data.domain!;
  const ratio = Math.max(0, Math.min(1, (data.value - min) / (max - min)));
  const angle = -Math.PI + ratio * Math.PI;
  const cx = compact ? 68 : 140,
    cy = compact ? 84 : 140,
    r = compact ? 54 : 110;
  const normal = data.normal;
  const bands = normal
    ? ([
        [min, normal[0], "#f0b85e"],
        [normal[0], normal[1], "#32bd91"],
        [normal[1], max, "#ec6464"],
      ] as const)
    : ([[min, max, data.color ?? colors[0]]] as const);
  const [px, py] = polar(cx, cy, r * 0.8, angle);
  return (
    <div className={compact ? "expression-mini-gauge" : "expression-gauge"}>
      <svg
        viewBox={compact ? "0 0 136 120" : "0 0 280 190"}
        role="img"
        aria-label={`${data.title} ${data.value} ${data.unit}，量程 ${min}—${max}`}
      >
        {bands
          .filter(([a, b]) => b > a)
          .map(([a, b, color], i) => (
            <path
              key={i}
              d={arc(
                cx,
                cy,
                r,
                -Math.PI + ((Math.max(min, a) - min) / (max - min)) * Math.PI,
                -Math.PI + ((Math.min(max, b) - min) / (max - min)) * Math.PI,
              )}
              stroke={color}
            />
          ))}
        {compact ? (
          <>
            <polygon
              points="-5,-69 5,-69 0,-59"
              transform={`translate(68 84) rotate(${ratio * 180 - 90})`}
              fill="#eee"
            />
            <text
              className="expression-mini-value"
              x="68"
              y="83"
              textAnchor="middle"
            >
              {data.value}
            </text>
            <text
              className="expression-mini-unit"
              x="68"
              y="103"
              textAnchor="middle"
            >
              {data.unit}
            </text>
          </>
        ) : (
          <g stroke="#eee" strokeWidth="2">
            <line x1={cx} y1={cy} x2={px} y2={py} />
            <circle cx={cx} cy={cy} r="5" fill="#eee" />
          </g>
        )}
        <text x={cx - r} y={compact ? 102 : 164} textAnchor="middle">
          {min}
        </text>
        <text x={cx + r} y={compact ? 102 : 164} textAnchor="middle">
          {max}
        </text>
        {!compact &&
          normal?.map((v) => {
            const [x, y] = polar(
              cx,
              cy,
              r + 17,
              -Math.PI + ((v - min) / (max - min)) * Math.PI,
            );
            return (
              <text key={v} x={x} y={y} textAnchor="middle">
                {v}
              </text>
            );
          })}
      </svg>
      {!compact && (
        <>
          <div>
            <Num value={data.value} unit={data.unit} />
          </div>
          <span className="expression-secondary">
            {normal
              ? `正常 ${normal[0]}—${normal[1]} ${data.unit}`
              : `量程 ${min}—${max} ${data.unit}`}
          </span>
        </>
      )}
    </div>
  );
}
function Series({
  data,
  view,
}: {
  data: Extract<WidgetData, { family: "series" }>;
  view: View;
}) {
  const [min, max] = data.domain ?? [0, Math.max(...data.values) * 1.15];
  if (view === "bars")
    return (
      <div className="expression-bars">
        {data.values.map((v, i) => (
          <div key={i}>
            <label>{data.labels[i]}</label>
            <span className="expression-track">
              <i
                style={{
                  width: `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`,
                }}
              />
            </span>
            <span>
              {v} {data.unit}
            </span>
          </div>
        ))}
      </div>
    );
  const x = (i: number) => 48 + (i * 400) / Math.max(1, data.values.length - 1),
    y = (v: number) => 190 - ((v - min) / (max - min)) * 150,
    baseline = y(Math.max(min, Math.min(max, 0)));
  return (
    <svg
      viewBox="0 0 490 230"
      role="img"
      aria-label={`${data.title}，${data.labels.map((l, i) => `${l} ${data.values[i]} ${data.unit}`).join("；")}`}
    >
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line
            x1="35"
            x2="468"
            y1={y(min + v * (max - min))}
            y2={y(min + v * (max - min))}
            stroke="#ffffff20"
          />
          <text x="30" y={y(min + v * (max - min)) + 4} textAnchor="end">
            {Number((min + v * (max - min)).toFixed(2))}
          </text>
        </g>
      ))}
      <text x="35" y="20">
        {data.unit}
      </text>
      {view === "line" && (
        <polyline
          points={data.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
        />
      )}
      {data.values.map((v, i) => (
        <g key={i}>
          {view === "line" ? (
            <circle cx={x(i)} cy={y(v)} r="3" fill={colors[0]} />
          ) : (
            <rect
              x={x(i) - Math.min(28, 300 / data.values.length) / 2}
              y={Math.min(y(v), baseline)}
              width={Math.min(28, 300 / data.values.length)}
              height={Math.abs(baseline - y(v))}
              rx="2"
              fill={colors[0]}
            />
          )}
          <text x={x(i)} y="213" textAnchor="middle">
            {i % Math.ceil(data.labels.length / 8) === 0 ||
            i === data.labels.length - 1
              ? data.labels[i]
              : ""}
          </text>
          <title>
            {data.labels[i]}：{v} {data.unit}
          </title>
        </g>
      ))}
    </svg>
  );
}
function Composition({
  data,
  view,
}: {
  data: Extract<WidgetData, { family: "composition" }>;
  view: View;
}) {
  const total = data.values.reduce((a, b) => a + b, 0);
  return (
    <div className="semantic-composition">
      {view === "stack" ? (
        <>
          <Num value={total} unit={data.unit} />
          <div className="expression-stack">
            {data.values.map((v, i) => (
              <i
                key={i}
                style={{
                  width: `${(v / total) * 100}%`,
                  background: colors[i],
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <svg viewBox="0 0 200 160" role="img" aria-label={data.title}>
          {data.values.map((v, i) => {
            const start =
              (data.values.slice(0, i).reduce((sum, value) => sum + value, 0) /
                total) *
              Math.PI *
              2;
            const offset = start + (v / total) * Math.PI * 2;
            const path = arc(
              100,
              80,
              65,
              start - Math.PI / 2,
              offset - Math.PI / 2,
            );
            return (
              <path
                key={i}
                d={view === "pie" ? `${path} L 100 80 Z` : path}
                fill={view === "pie" ? colors[i] : "none"}
                stroke={view === "pie" ? "#232323" : colors[i]}
                strokeWidth={view === "pie" ? 2 : 22}
              >
                <title>
                  {data.labels[i]}：{v} {data.unit}
                </title>
              </path>
            );
          })}
          {view === "donut" && (
            <text
              x="100"
              y="86"
              textAnchor="middle"
              style={{ fontSize: 24, fill: "#eee" }}
            >
              {total}
            </text>
          )}
        </svg>
      )}
      <div className="expression-legend">
        {data.values.map((v, i) => (
          <div key={i}>
            <i style={{ background: colors[i] }} />
            <span>{data.labels[i]}</span>
            <span>
              {v} · {Math.round((v / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function SemanticWidget({
  data,
  view,
  size,
  exampleId,
}: {
  data: WidgetData;
  view: View;
  size: MonitoringWidgetSize;
  exampleId?: string;
}) {
  if (!isWidgetSizeAllowed(data, view, size))
    throw new Error(`Unsupported ${data.family} / ${view} / ${size}`);
  const compact = size === "1x1",
    gauge = view === "gauge";
  const [h, w] = size.split("x").map(Number);
  const tooltip =
    data.family === "scalar" && data.normal
      ? `${data.title}：${data.value} ${data.unit}；正常区间 ${data.normal.join("—")} ${data.unit}`
      : data.title;
  let body;
  if (data.family === "activity")
    body = compact ? (
      <span className="expression-state">{data.state}</span>
    ) : (
      <>
        <p className="semantic-activity-state">{data.state}</p>
        {data.headline && (
          <p className="expression-headline">{data.headline}</p>
        )}
        {data.context && <p className="expression-secondary">{data.context}</p>}
      </>
    );
  else if (
    data.family === "distribution" ||
    data.family === "matrix" ||
    data.family === "profile"
  )
    body =
      data.family === "matrix" &&
      ["multi-line", "grouped-columns", "stacked-columns"].includes(view) ? (
        <FittedMatrixChart data={data} view={view} />
      ) : (
        <StructuredChart data={data} view={view} />
      );
  else if (data.family === "series") body = <Series data={data} view={view} />;
  else if (data.family === "composition")
    body = <Composition data={data} view={view} />;
  else if (gauge) body = <Gauge data={data} compact={compact} />;
  else if (view === "number" || view === "range") {
    const direction = data.normal
      ? data.value > data.normal[1]
        ? "up"
        : data.value < data.normal[0]
          ? "down"
          : null
      : null;
    body = (
      <div className="expression-range-value">
        <Num value={data.value} unit={data.unit} />
        {view === "range" && direction && (
          <WidgetTooltip
            text={`${direction === "up" ? "偏高" : "偏低"}；${tooltip}`}
          >
            <span className="expression-range-high">
              <Icon
                name="arrow-up"
                style={{
                  width: 24,
                  height: 24,
                  transform:
                    direction === "down" ? "rotate(180deg)" : undefined,
                }}
              />
            </span>
          </WidgetTooltip>
        )}
      </div>
    );
  } else {
    const fraction = data.value / data.target!;
    body =
      view === "bar" ? (
        <>
          <div className="expression-columns">
            <Num value={data.value} unit={`/ ${data.target} ${data.unit}`} />
            <span className="expression-secondary">{data.targetLabel}</span>
          </div>
          <div className="expression-track">
            <i
              style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%` }}
            />
          </div>
        </>
      ) : (
        <div className="expression-ring">
          <svg viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke="#ffffff12"
              strokeWidth="12"
            />
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke={colors[0]}
              strokeWidth="12"
              strokeDasharray={`${Math.max(0, Math.min(1, fraction)) * 478} 478`}
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div>
            <Num value={Math.round(fraction * 100)} unit="%" />
            <span className="expression-secondary">
              {data.value} / {data.target} {data.unit}
            </span>
          </div>
        </div>
      );
  }
  return (
    <article
      className={`widget crystra-monitoring-widget expression-widget ${compact && gauge ? "expression-gauge-compact" : ""}`}
      data-example-id={exampleId}
      data-size={size}
      data-family={data.family}
      data-view={view}
      aria-label={data.title}
      style={{ width: widgetSpan(w), height: widgetSpan(h) }}
    >
      {compact && (
        <span className="expression-corner-status">
          <WidgetTooltip text="当前结果可用">
            <Icon
              name="circle-check"
              style={{ width: 18, height: 18 }}
              aria-label="可用"
            />
          </WidgetTooltip>
        </span>
      )}
      {!(compact && gauge) && (
        <header className="crystra-monitoring-widget-header">
          {compact ? (
            <WidgetTooltip text={tooltip}>
              <Icon
                name={
                  data.family === "activity"
                    ? "activity"
                    : data.family === "scalar"
                      ? (data.identityIcon ?? "clock")
                      : "chart-dots"
                }
                size="widget-signal"
              />
            </WidgetTooltip>
          ) : (
            <span className="crystra-monitoring-widget-title">
              {data.title}
            </span>
          )}
        </header>
      )}
      {compact && gauge ? (
        <WidgetTooltip text={tooltip}>{body}</WidgetTooltip>
      ) : (
        <div className="crystra-monitoring-widget-content">{body}</div>
      )}
    </article>
  );
}

// Chart geometry follows the actual content slot, including wrapped titles and legends.
function FittedMatrixChart({
  data,
  view,
}: {
  data: Extract<WidgetData, { family: "matrix" }>;
  view: View;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = useState<{ width: number; height: number }>();
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const legend = el.querySelector<HTMLElement>(".structured-legend");
    const measure = () => {
      const next = {
        width: el.clientWidth,
        height: Math.max(
          80,
          el.clientHeight - (legend?.getBoundingClientRect().height ?? 0) - 6,
        ),
      };
      if (next.width > 0)
        setPlotSize((old) =>
          old?.width === next.width && old?.height === next.height ? old : next,
        );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (legend) observer.observe(legend);
    measure();
    return () => observer.disconnect();
  }, [data, view]);
  return (
    <div ref={root} className="widget-chart-fit">
      <StructuredChart data={data} view={view} plotSize={plotSize} />
    </div>
  );
}
