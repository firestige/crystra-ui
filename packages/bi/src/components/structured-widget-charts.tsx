import type {
  DistributionData,
  MatrixData,
  View,
} from "../domain/widget-families";
import { WidgetTooltip } from "./widget-tooltip";
const colors = ["#679efe", "#f0b85e", "#ba92f5", "#32bd91"];
const label = (v: number | null, unit: string) =>
  v === null ? "无数据" : `${Number(v.toFixed(2))}${unit}`;
export function StructuredSeriesLegend({ data }: { data: MatrixData }) {
  return (
    <div className="structured-legend">
      {data.rows.map((r, i) => (
        <span key={r.name}>
          <svg width="25" height="12" aria-hidden="true">
            <line
              x1="0"
              x2="25"
              y1="6"
              y2="6"
              stroke={r.color ?? colors[i % 4]}
              strokeWidth="2"
              strokeDasharray={i % 2 ? "4 3" : undefined}
            />
            {i % 2 ? (
              <rect
                x="10"
                y="3"
                width="6"
                height="6"
                fill={r.color ?? colors[i % 4]}
              />
            ) : (
              <circle cx="13" cy="6" r="3" fill={r.color ?? colors[i % 4]} />
            )}
          </svg>
          {r.name}
        </span>
      ))}
    </div>
  );
}
export function StructuredChartLegend({
  data,
  view,
}: {
  data: MatrixData;
  view: View;
}) {
  if (view === "heatmap")
    return (
      <div className="structured-header-color-key" aria-label="颜色图例">
        <span>{data.legendLabel ?? data.unit}</span>
        <div className="expression-color-scale" />
        <span>
          {label(data.domain[0], data.unit)} —{" "}
          {label(data.domain[1], data.unit)}
        </span>
      </div>
    );
  return <StructuredSeriesLegend data={data} />;
}
function Distribution({ data, view }: { data: DistributionData; view: View }) {
  if (view === "frequency-table")
    return (
      <table className="structured-table">
        <caption>耗时区间 · {data.unit} / 频数</caption>
        <thead>
          <tr>
            <th>区间</th>
            <th>次数</th>
          </tr>
        </thead>
        <tbody>
          {data.bins.map((b, i) => (
            <tr key={b.from}>
              <th>
                {b.from}–{b.to}
                {i === data.bins.length - 1 ? "（含右端）" : ""}
              </th>
              <td>{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  const binMin = data.bins[0].from,
    binMax = data.bins.at(-1)!.to;
  const [rangeMin, rangeMax] = data.domain ?? [
    0,
    Math.max(1, ...data.bins.map((b) => b.count)) * 1.25,
  ];
  const x = (v: number) => 40 + ((v - binMin) / (binMax - binMin)) * 425,
    y = (v: number) => 185 - ((v - rangeMin) / (rangeMax - rangeMin)) * 145,
    baseline = y(Math.max(rangeMin, Math.min(rangeMax, 0)));
  return (
    <svg
      className="structured-plot"
      viewBox="0 0 490 235"
      role="img"
      aria-label={`${data.title}；${data.bins.map((b) => `${b.from}–${b.to}${data.unit}：${b.count}次`).join("；")}`}
    >
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1="40"
            x2="465"
            y1={y(rangeMin + t * (rangeMax - rangeMin))}
            y2={y(rangeMin + t * (rangeMax - rangeMin))}
            stroke="#ffffff20"
          />
          <text
            x="32"
            y={y(rangeMin + t * (rangeMax - rangeMin)) + 4}
            textAnchor="end"
          >
            {Number((rangeMin + t * (rangeMax - rangeMin)).toFixed(2))}
          </text>
        </g>
      ))}
      <text x="40" y="20">
        频数 · 次
      </text>
      {view === "frequency-line" && (
        <polyline
          points={data.bins
            .map((b) => `${x((b.from + b.to) / 2)},${y(b.count)}`)
            .join(" ")}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
        />
      )}
      {data.bins.map((b, i) => (
        <g key={b.from}>
          {view === "histogram" ? (
            <rect
              x={x(b.from)}
              y={Math.min(y(b.count), baseline)}
              width={x(b.to) - x(b.from)}
              height={Math.abs(baseline - y(b.count))}
              fill={colors[0]}
              stroke="#232323"
              strokeWidth="1"
            />
          ) : (
            <circle
              cx={x((b.from + b.to) / 2)}
              cy={y(b.count)}
              r="3"
              fill={colors[0]}
            />
          )}
          <title>
            {b.from}–{b.to} {data.unit}：{b.count} 次
          </title>
          {i % 2 === 0 && (
            <text x={x(b.from)} y="207" textAnchor="middle">
              {b.from}
            </text>
          )}
        </g>
      ))}
      <text x="465" y="207" textAnchor="middle">
        {binMax}
      </text>
      <text x="465" y="230" textAnchor="end">
        耗时 · {data.unit}
        {view === "frequency-line" ? "（区间中点频数）" : ""}
      </text>
    </svg>
  );
}
function MatrixTable({ data }: { data: MatrixData }) {
  return (
    <table className="structured-table">
      <caption>
        {data.legendLabel ??
          (data.family === "profile"
            ? "评分 · 向外/数值越大越优"
            : "数值")}{" "}
        · {data.unit}
      </caption>
      <thead>
        <tr>
          <th>对象</th>
          {data.dimensions.map((d) => (
            <th key={d}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row) => (
          <tr key={row.name}>
            <th>{row.name}</th>
            {row.values.map((v, i) => (
              <td key={i}>
                {label(v, data.unit)}
                {row.samples && (
                  <small className="obs-sample-count">
                    n = {row.samples[i]}
                  </small>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function Heatmap({ data }: { data: MatrixData }) {
  const [min, max] = data.domain;
  return (
    <div className="expression-heatmap-body">
      {data.xAxisLabel && (
        <div className="structured-heatmap-x-axis">{data.xAxisLabel}</div>
      )}
      <div className="structured-heatmap-axes">
        {data.yAxisLabel && (
          <div className="structured-heatmap-y-axis">{data.yAxisLabel}</div>
        )}
        <div
          className="expression-matrix"
          style={{
            gridTemplateColumns: `${data.rows.some((r) => r.name.length > 15) ? 132 : 76}px repeat(${data.dimensions.length},1fr)`,
            gridTemplateRows: `28px repeat(${data.rows.length},1fr)`,
          }}
        >
          <span />
          {data.dimensions.map((d) => (
            <label key={d}>{d}</label>
          ))}
          {data.rows.map((row) => (
            <div className="expression-matrix-row" key={row.name}>
              <label>{row.name}</label>
              {row.values.map((v, i) => {
                const pct =
                  v === null
                    ? 0
                    : Math.max(
                        0,
                        Math.min(100, ((v - min) / (max - min)) * 100),
                      );
                return (
                  <div
                    key={i}
                    className={v === null ? "expression-no-data" : undefined}
                    style={{
                      background:
                        v === null
                          ? undefined
                          : `color-mix(in srgb, #679efe ${pct}%, #202a3a)`,
                      color: pct >= 60 ? "#101827" : "#e9efff",
                    }}
                    title={`${row.name} · ${data.dimensions[i]} · ${label(v, data.unit)}`}
                  >
                    {v === null ? "—" : label(v, data.unit)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {data.legendPlacement !== "external" && (
        <div className="expression-color-key">
          <div>
            <span>
              {data.legendLabel ??
                (data.family === "profile" ? "评分" : "数值")}
            </span>
            <div className="expression-color-scale" />
            <div className="expression-scale-ticks">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <span key={t}>
                  {Number((min + (max - min) * t).toFixed(2))}
                  {data.unit}
                </span>
              ))}
            </div>
          </div>
          {data.rows.some((r) => r.values.includes(null)) && (
            <span className="expression-missing-key">
              <i className="expression-no-data" />
              无数据
            </span>
          )}
        </div>
      )}
    </div>
  );
}
function Radar({ data }: { data: MatrixData }) {
  const [min, max] = data.domain;
  const point = (i: number, value: number, r = 82) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / data.dimensions.length;
    return [
      153 + (Math.cos(angle) * r * (value - min)) / (max - min),
      118 + (Math.sin(angle) * r * (value - min)) / (max - min),
    ];
  };
  const polygon = (values: (number | null)[]) =>
    values.map((v, i) => point(i, v ?? min).join(",")).join(" ");
  return (
    <div className="expression-radar-body">
      <svg
        viewBox="0 0 306 232"
        role="img"
        aria-label={`${data.title}；${data.rows.map((r) => `${r.name}：${r.values.map((v) => label(v, data.unit)).join("/")}`).join("；")}`}
      >
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <polygon
            key={t}
            points={polygon(data.dimensions.map(() => min + t * (max - min)))}
            fill="none"
            stroke="#ffffff20"
          />
        ))}
        {data.dimensions.map((name, i) => {
          const [x, y] = point(i, max),
            [lx, ly] = point(i, max, 105);
          return (
            <g key={name}>
              <line x1="153" y1="118" x2={x} y2={y} stroke="#ffffff18" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
                {name}
              </text>
            </g>
          );
        })}
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x="158"
            y={118 - t * 82}
            className="expression-radar-tick"
          >
            {Number((min + t * (max - min)).toFixed(2))}
          </text>
        ))}
        {data.rows.map((row, j) => (
          <g key={row.name}>
            <polygon
              points={polygon(row.values)}
              fill={row.color ?? colors[j % 4]}
              fillOpacity=".10"
              stroke={row.color ?? colors[j % 4]}
              strokeWidth="2"
              strokeDasharray={j % 2 ? "5 3" : undefined}
            />
            {row.values.map((v, i) => {
              if (v === null) return null;
              const [x, y] = point(i, v);
              return (
                <g key={i}>
                  {j % 2 ? (
                    <rect
                      x={x - 3}
                      y={y - 3}
                      width="6"
                      height="6"
                      fill={row.color ?? colors[j % 4]}
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill={row.color ?? colors[j % 4]}
                    />
                  )}
                  <foreignObject x={x - 8} y={y - 8} width="16" height="16">
                    <WidgetTooltip
                      text={`${data.dimensions[i]}：${data.rows.map((r) => `${r.name} ${label(r.values[i], data.unit)}`).join("；")}`}
                    >
                      <span
                        style={{ display: "block", width: 16, height: 16 }}
                      />
                    </WidgetTooltip>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      {data.legendPlacement !== "external" && (
        <StructuredSeriesLegend data={data} />
      )}
      <div className="expression-radar-caption">
        {label(min, data.unit)}–{label(max, data.unit)}
      </div>
    </div>
  );
}
function GroupedBars({ data }: { data: MatrixData }) {
  const [min, max] = data.domain;
  return (
    <div className="structured-grouped-bars">
      <div className="structured-axis-note">
        {data.xAxisLabel ?? `${label(min, data.unit)}—${label(max, data.unit)}`}
      </div>
      <div className="structured-bar-groups">
        {data.dimensions.map((name, i) => (
          <div key={name}>
            <label>{name}</label>
            <div>
              {data.rows.map((row, j) => (
                <div className="structured-bar-row" key={row.name}>
                  <div className="expression-track">
                    <i
                      style={{
                        width:
                          row.values[i] === null
                            ? "0%"
                            : `${((row.values[i]! - min) / (max - min)) * 100}%`,
                        background: row.color ?? colors[j % 4],
                      }}
                    />
                  </div>
                  <span>{label(row.values[i], data.unit)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {data.yAxisLabel && (
        <div className="structured-bar-numeric-axis">
          <div>
            {[0, 0.5, 1].map((t) => (
              <span key={t}>{label(min + (max - min) * t, "")}</span>
            ))}
          </div>
          <span>{data.yAxisLabel}</span>
        </div>
      )}
      {data.legendPlacement !== "external" && (
        <StructuredSeriesLegend data={data} />
      )}
    </div>
  );
}
function MultiSeries({
  data,
  view,
  plotSize,
}: {
  data: MatrixData;
  view: View;
  plotSize?: { width: number; height: number };
}) {
  const width = plotSize?.width ?? 490,
    height = plotSize?.height ?? 228;
  const left = plotSize ? 64 : 35;
  const tickCount = Math.min(
    data.dimensions.length,
    Math.max(2, Math.floor((width - left - 90) / 80) + 1),
  );
  const visibleTicks = new Set(
    Array.from({ length: tickCount }, (_, i) =>
      Math.round(
        (i * (data.dimensions.length - 1)) / Math.max(1, tickCount - 1),
      ),
    ),
  );
  const stacked = view === "stacked-columns";
  const barStep = Math.min(
    data.dimensions.length === 1 ? 56 : stacked ? 28 : 14,
    ((width - left - 90) * 0.8) /
      Math.max(1, data.dimensions.length) /
      (stacked ? 1 : Math.max(1, data.rows.length)),
  );
  const baseline = height - (data.xAxisLabel ? 58 : 38),
    plotHeight = height - (data.xAxisLabel ? 108 : 78);
  const [min, max] =
    stacked && !data.rangeApplied
      ? [
          0,
          Math.max(
            1,
            ...data.dimensions.map((_, i) =>
              data.rows.reduce((s, r) => s + (r.values[i] ?? 0), 0),
            ),
          ) * 1.05,
        ]
      : data.domain;
  const x = (i: number) =>
      data.dimensions.length === 1
        ? (left + width - 20) / 2
        : left +
          30 +
          (i * (width - left - 90)) / Math.max(1, data.dimensions.length - 1),
    y = (v: number) => baseline - ((v - min) / (max - min)) * plotHeight;
  return (
    <div className="structured-series" data-chart-view={view}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={plotSize ? { height: plotSize.height } : undefined}
        role="img"
        aria-label={`${data.title}；${data.rows.map((r) => `${r.name}：${r.values.map((v) => label(v, data.unit)).join("/")}`).join("；")}`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - 20}
              y1={baseline - t * plotHeight}
              y2={baseline - t * plotHeight}
              stroke="#ffffff20"
            />
            <text
              x={left - 5}
              y={baseline + 4 - t * plotHeight}
              textAnchor="end"
            >
              {Number((min + t * (max - min)).toFixed(2))}
            </text>
          </g>
        ))}
        <text x={left} y="20">
          {data.yAxisLabel ?? data.unit}
        </text>
        {data.rows.map((row, j) => {
          const path = row.values
            .map((v, i) =>
              v === null
                ? ""
                : `${i === 0 || row.values[i - 1] === null ? "M" : "L"} ${x(i)} ${y(v)}`,
            )
            .join(" ");
          return (
            <g key={row.name}>
              {view === "area" &&
                row.values.map((value, index) => {
                  if (
                    value === null ||
                    (index > 0 && row.values[index - 1] !== null)
                  )
                    return null;
                  let end = index;
                  while (
                    end + 1 < row.values.length &&
                    row.values[end + 1] !== null
                  )
                    end++;
                  const points = row.values
                    .slice(index, end + 1)
                    .map((v, i) => `L ${x(index + i)} ${y(v!)}`)
                    .join(" ");
                  return (
                    <path
                      key={index}
                      data-area-fill
                      d={`M ${x(index)} ${baseline} ${points} L ${x(end)} ${baseline} Z`}
                      fill={row.color ?? colors[j % 4]}
                      fillOpacity=".16"
                    />
                  );
                })}
              {(view === "multi-line" || view === "area") && (
                <path
                  d={path}
                  fill="none"
                  stroke={row.color ?? colors[j % 4]}
                  strokeWidth="2"
                  strokeDasharray={j % 2 ? "5 3" : undefined}
                />
              )}
              {row.values.map((v, i) => {
                const px =
                  x(i) +
                  (view === "grouped-columns"
                    ? (j - (data.rows.length - 1) / 2) * barStep
                    : 0);
                const below = stacked
                  ? data.rows
                      .slice(0, j)
                      .reduce((s, r) => s + (r.values[i] ?? 0), 0)
                  : 0;
                return (
                  <g key={i}>
                    {v === null ? (
                      <path
                        d={`M ${px - 3} ${baseline - 13} l 6 6 M ${px + 3} ${baseline - 13} l -6 6`}
                        fill="none"
                        stroke={row.color ?? colors[j % 4]}
                        strokeWidth="1.5"
                      />
                    ) : view === "multi-line" || view === "area" ? (
                      <circle
                        cx={px}
                        cy={y(v)}
                        r="3"
                        fill={row.color ?? colors[j % 4]}
                      />
                    ) : (
                      <rect
                        x={px - (barStep * 3) / 7}
                        y={y(v + below)}
                        width={(barStep * 6) / 7}
                        height={
                          stacked ? y(below) - y(v + below) : baseline - y(v)
                        }
                        fill={row.color ?? colors[j % 4]}
                      />
                    )}
                    <title>
                      {row.name} · {data.dimensions[i]} · {label(v, data.unit)}
                    </title>
                  </g>
                );
              })}
            </g>
          );
        })}
        {data.dimensions.map((d, i) => (
          <text key={d} x={x(i)} y={baseline + 22} textAnchor="middle">
            {visibleTicks.has(i) ? d : ""}
          </text>
        ))}
        {data.xAxisLabel && (
          <text x={(left + width - 20) / 2} y={height - 5} textAnchor="middle">
            {data.xAxisLabel}
          </text>
        )}
      </svg>
      {data.legendPlacement !== "external" && (
        <StructuredSeriesLegend data={data} />
      )}
      {data.rows.some((r) => r.values.includes(null)) && (
        <span className="structured-axis-note">
          缺值保留断点；底部交叉标记表示无数据
        </span>
      )}
    </div>
  );
}
export function StructuredChart({
  data,
  view,
  plotSize,
}: {
  data: DistributionData | MatrixData;
  view: View;
  plotSize?: { width: number; height: number };
}) {
  if (data.family === "distribution")
    return <Distribution data={data} view={view} />;
  if (view === "value-table") return <MatrixTable data={data} />;
  if (view === "heatmap") return <Heatmap data={data} />;
  if (view === "radar") return <Radar data={data} />;
  if (view === "grouped-bars") return <GroupedBars data={data} />;
  return <MultiSeries data={data} view={view} plotSize={plotSize} />;
}
