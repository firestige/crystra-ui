import type { ComponentProps } from "react";
import "../comparison-widget.css";
import { presentExactValue } from "../domain/visualization/presentation";
import type { CompareResultFrame } from "./compare-result";
import { IconButton } from "./design-system";
import { Icon } from "./icon";
import { MonitoringWidget } from "./monitoring-widget";
import { WidgetTooltip } from "./widget-tooltip";

export function ComparisonWidget({
  coordinate,
  title,
  beforeLabel = "基准",
  afterLabel = "对照",
  before,
  after,
  beforeError,
  afterError,
  delta,
  onEvidence,
  onExplain,
  onRetryFailedSide,
  ownsFailedSide = true,
}: ComponentProps<typeof CompareResultFrame>) {
  const sides = [
    {
      key: "left",
      label: beforeLabel,
      role: "基准",
      slice: before,
      error: beforeError,
    },
    {
      key: "right",
      label: afterLabel,
      role: "对照",
      slice: after,
      error: afterError,
    },
  ] as const;
  const resolved = delta.state === "AVAILABLE" && delta.value !== undefined;
  const change = resolved
    ? presentExactValue(delta.value!).display
    : "不可比较";
  const direction =
    delta.direction === "INCREASE"
      ? "增加"
      : delta.direction === "DECREASE"
        ? "减少"
        : "不变";
  return (
    <MonitoringWidget
      category="comparison"
      size="1x3"
      className="comparison-widget"
      aria-label={`Compare ${coordinate}`}
      title={
        <WidgetTooltip text={coordinate}>
          <span>{title ?? coordinate}</span>
        </WidgetTooltip>
      }
      status={<Icon name="arrows-exchange" size="navigation" />}
      primary={
        <div className="comparison-values">
          {sides.map((side) => (
            <div className="comparison-value" key={side.key}>
              <span className="comparison-label">
                {side.role} ·{" "}
                {side.label === side.role ? "未指定对象" : side.label}
              </span>
              <WidgetTooltip
                text={
                  side.error
                    ? `${side.error.code}: ${side.error.detail}`
                    : side.slice?.value
                      ? `精确值 ${presentExactValue(side.slice.value).exact} · ${side.slice.state}`
                      : (side.slice?.state ?? "没有匹配数据")
                }
              >
                <span className="comparison-number">
                  {side.slice?.state === "AVAILABLE" && side.slice.value
                    ? presentExactValue(side.slice.value).display
                    : side.error
                      ? "读取失败"
                      : (side.slice?.state ?? "无数据")}
                </span>
              </WidgetTooltip>
            </div>
          ))}
          <div className="comparison-value comparison-change">
            <span className="comparison-label">变化 · 对照 − 基准</span>
            <WidgetTooltip
              text={
                resolved
                  ? `精确差值 ${presentExactValue(delta.value!).exact} · ${direction}；不代表好坏`
                  : (delta.withholding_reason ?? delta.state)
              }
            >
              <span className="comparison-number comparison-delta-number">
                {resolved && (
                  <Icon
                    className="comparison-direction"
                    data-direction={delta.direction}
                    name={
                      delta.direction === "INCREASE"
                        ? "triangle-filled"
                        : delta.direction === "DECREASE"
                          ? "triangle-inverted-filled"
                          : "minus"
                    }
                    size="inline-action"
                    aria-label={
                      delta.direction === "INCREASE"
                        ? "上涨"
                        : delta.direction === "DECREASE"
                          ? "下跌"
                          : "持平"
                    }
                  />
                )}
                {resolved && delta.direction === "INCREASE" ? "+" : ""}
                {delta.value?.kind === "RATIO"
                  ? change.replace("%", "")
                  : change}
                <small>
                  {resolved && delta.value?.kind === "RATIO" ? " pp" : ""}
                </small>
              </span>
            </WidgetTooltip>
          </div>
        </div>
      }
      footer={
        resolved
          ? delta.value?.kind === "RATIO"
            ? "pp = 百分点 · 非相对增长率"
            : `${direction} · 不代表好坏`
          : "缺少可比较结果，不生成差值"
      }
      actions={
        <div className="comparison-actions">
          {sides.map((side) => (
            <span key={side.key} className="comparison-side-actions">
              {onEvidence && (
                <WidgetTooltip text={`${side.label}的证据`}>
                  <IconButton
                    size="compact"
                    appearance="ghost"
                    aria-label={`查看${side.role}证据`}
                    onClick={(e) => onEvidence(side.key, e.currentTarget)}
                  >
                    <Icon name="file" />
                  </IconButton>
                </WidgetTooltip>
              )}
              {onExplain && (
                <WidgetTooltip text={`${side.label}的指标说明`}>
                  <IconButton
                    size="compact"
                    appearance="ghost"
                    aria-label={`查看${side.role}说明`}
                    onClick={(e) => onExplain(side.key, e.currentTarget)}
                  >
                    <Icon name="help" />
                  </IconButton>
                </WidgetTooltip>
              )}
              {side.error?.retryable && ownsFailedSide && onRetryFailedSide && (
                <button type="button" onClick={onRetryFailedSide}>
                  重试{side.role}
                </button>
              )}
            </span>
          ))}
        </div>
      }
    />
  );
}
