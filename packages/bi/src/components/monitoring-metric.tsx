import { MetricTruthMark } from "./status";
import {
  metricTruthMessages,
  type MetricTruthLocale,
} from "../i18n/metric-truth";
import { WidgetTooltip } from "./widget-tooltip";
import { useRef, useState } from "react";
import type { MetricResult } from "../domain/evolution/types";
import { isMetricResult } from "../domain/evolution/validation";
import {
  compatibleVisualizerIds,
  selectDefaultVisualizer,
  type VisualizerId,
} from "../domain/visualization/registry";
import { presentExactValue } from "../domain/visualization/presentation";
import {
  MONITORING_RENDERERS,
  type MonitoringWidgetSize,
} from "../domain/widget-catalog";
import { MonitoringWidget } from "./monitoring-widget";
import { MetricPanel } from "./result-visualizer";
import { Chip, IconButton } from "./design-system";
import { Icon, type IconName } from "./icon";
import { OwnedInspector } from "./inspector";
import "../monitoring-bi.css";

function AvailableMark({ compact = false }: { compact?: boolean }) {
  return compact ? (
    <WidgetTooltip className="monitoring-available" text="Available">
      <Icon name="circle-check" size="content-marker" aria-label="Available" />
    </WidgetTooltip>
  ) : (
    <Chip tone="success" appearance="soft" size="compact">
      Available
    </Chip>
  );
}

/** Compact projection of a formal result; full truth/coverage/provenance remain in the inspector. */
export function MonitoringMetricPanel({
  locale = "en",
  result,
  visualizer,
  size,
  title,
  titleIcon,
  booleanLabels,
  booleanIcons,
  onEvidence,
  onExplain,
}: {
  locale?: MetricTruthLocale;
  result: MetricResult;
  visualizer?: VisualizerId;
  size?: MonitoringWidgetSize;
  title?: string;
  titleIcon?: IconName;
  shortTitle?: string;
  booleanLabels?: { true: string; false: string };
  booleanIcons?: { true: IconName; false: IconName };
  onEvidence?: (trigger: HTMLButtonElement) => void;
  onExplain?: (trigger: HTMLButtonElement) => void;
}) {
  const [open, setOpen] = useState(false);
  const invoker = useRef<HTMLButtonElement>(null);
  const valid = isMetricResult(result);
  const coordinate = valid
    ? `${result.metric_id}@${result.metric_version}`
    : "Metric Result incompatible";
  const resolved = valid
    ? (visualizer ?? selectDefaultVisualizer(result))
    : "numeric-card@1";
  const slice = valid ? result.slices[0] : undefined;
  const compatible =
    valid &&
    result.slices.every(
      (s) => !s.value || compatibleVisualizerIds(s).includes(resolved),
    );
  const records =
    valid && (resolved === "table@1" || result.slices.length !== 1);
  const category = !compatible
    ? "status"
    : records
      ? "records"
      : MONITORING_RENDERERS[resolved].category;
  const capacity =
    size ?? (records ? "2x3" : category === "progress" ? "1x2" : "1x1");
  const value =
    compatible && slice?.value ? presentExactValue(slice.value) : undefined;
  let ratio: number | undefined;
  if (compatible && slice?.value?.kind === "RATIO") {
    const [n, d = "1"] = slice.value.value.split("/");
    const numerator = BigInt(n!),
      denominator = BigInt(d);
    if (denominator > 0n && numerator >= 0n && numerator <= denominator)
      ratio = Number((numerator * 10000n) / denominator) / 100;
  }
  const titleText =
    title ?? (valid ? result.metric_id.replaceAll("-", " ") : coordinate);
  const compact = !compatible || capacity === "1x1";
  const booleanSignal = compatible && slice?.value?.kind === "BOOLEAN";
  const headingIcon =
    titleIcon ??
    (category === "progress"
      ? "target"
      : category === "status"
        ? "activity"
        : slice?.value?.kind === "DURATION_MS"
          ? "clock"
          : "chart-dots");
  return (
    <>
      <MonitoringWidget
        category={category}
        size={!compatible ? "1x1" : capacity}
        className="monitoring-metric"
        aria-label={titleText}
        data-metric-coordinate={coordinate}
        data-visualizer={resolved}
        leading={
          compact ? (
            <WidgetTooltip
              className="monitoring-title-icon"
              text={`${titleText} · ${coordinate}`}
            >
              <Icon name={headingIcon} size="widget-signal" />
            </WidgetTooltip>
          ) : undefined
        }
        title={
          compact ? undefined : (
            <span className="monitoring-title" title={coordinate}>
              {titleText}
            </span>
          )
        }
        primary={
          records ? undefined : (
            <div
              className="monitoring-signal"
              title={booleanSignal ? undefined : value?.exact}
            >
              {value ? (
                <>
                  {slice?.value?.kind === "BOOLEAN" ? (
                    <WidgetTooltip
                      className="monitoring-boolean"
                      text={`${titleText} · ${slice.value.value ? (booleanLabels?.true ?? "True") : (booleanLabels?.false ?? "False")} (${slice.value.value ? "True" : "False"})`}
                    >
                      {(!slice.value.value || booleanIcons?.true) && (
                        <Icon
                          name={
                            slice.value.value
                              ? (booleanIcons?.true ?? "circle-check")
                              : (booleanIcons?.false ?? "circle-x")
                          }
                          size="widget-signal"
                          aria-label={slice.value.value ? "True" : "False"}
                        />
                      )}
                      <span className="monitoring-boolean-label">
                        {slice.value.value
                          ? (booleanLabels?.true ?? "True")
                          : (booleanLabels?.false ?? "False")}
                      </span>
                    </WidgetTooltip>
                  ) : (
                    value.display.replace(/ (ms|tokens|ratio)$/, "")
                  )}
                  <small>
                    {slice?.value?.kind === "RATIO" ||
                    slice?.value?.kind === "BOOLEAN"
                      ? ""
                      : ` ${slice?.value?.unit}`}
                  </small>
                </>
              ) : (
                <span className="monitoring-empty">
                  {locale === "zh-CN" ? "暂无数值" : "No value"}
                </span>
              )}
            </div>
          )
        }
        visualization={
          records ? (
            <div className="monitoring-records">
              <table aria-label={`Result data: ${coordinate}`}>
                <thead>
                  <tr>
                    <th>Slice</th>
                    <th>State</th>
                    <th>Exact value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.slices.map((s) => (
                    <tr key={JSON.stringify(s.slice_key)}>
                      <td>{JSON.stringify(s.slice_key)}</td>
                      <td>
                        {s.state === "AVAILABLE" ? (
                          <AvailableMark />
                        ) : (
                          metricTruthMessages[locale][s.state].label
                        )}
                      </td>
                      <td>
                        {s.value
                          ? presentExactValue(s.value).exact
                          : s.withholding_reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : category === "progress" &&
            capacity !== "1x1" &&
            ratio !== undefined ? (
            <div
              className="monitoring-ratio"
              role="img"
              aria-label={`${value?.display}; exact ${value?.exact}`}
            >
              <i style={{ width: `${ratio}%` }} />
            </div>
          ) : undefined
        }
        footer={
          compact &&
          booleanSignal &&
          slice?.state === "AVAILABLE" ? undefined : (
            <span
              className="monitoring-truth"
              title={slice?.withholding_reason ?? slice?.reading}
            >
              {compact ? (
                <MetricTruthMark
                  state={
                    !compatible
                      ? "INCOMPATIBLE"
                      : (slice?.state ?? "UNAVAILABLE")
                  }
                  locale={locale}
                />
              ) : records ? (
                `${result.slices.length} slices`
              ) : slice?.state === "AVAILABLE" ? (
                <AvailableMark />
              ) : slice ? (
                metricTruthMessages[locale][slice.state].label
              ) : locale === "zh-CN" ? (
                "无结果"
              ) : (
                "No result"
              )}
            </span>
          )
        }
        actions={
          <WidgetTooltip
            text={`查看指标详情 · ${compatible ? (slice ? metricTruthMessages[locale][slice.state].label : "No result") : "Incompatible"}`}
            focusable={false}
          >
            <IconButton
              aria-label="查看指标详情"
              appearance="ghost"
              ref={invoker}
              onClick={() => setOpen(true)}
            >
              <Icon name="arrow-up-right" />
            </IconButton>
          </WidgetTooltip>
        }
      />
      <OwnedInspector
        open={open}
        modal
        kind="explanation"
        title={coordinate}
        invokerRef={invoker}
        onClose={() => setOpen(false)}
      >
        <MetricPanel
          result={result}
          visualizer={resolved}
          onEvidence={onEvidence}
          onExplain={onExplain}
        />
      </OwnedInspector>
    </>
  );
}
