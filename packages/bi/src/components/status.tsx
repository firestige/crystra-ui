import type { Truth } from "../domain/evidence/types";
import type {
  Coverage,
  TruthState,
  WithholdingReason,
} from "../domain/evolution/types";
import {
  metricTruthMessages,
  type MetricTruthLocale,
} from "../i18n/metric-truth";
import { Icon, type IconName } from "./icon";
import { WidgetTooltip } from "./widget-tooltip";

const metricTruth: Record<
  TruthState,
  { label: string; marker: IconName; tone: string }
> = {
  AVAILABLE: { label: "Available", marker: "circle-check", tone: "available" },
  LOWER_BOUND: {
    label: "Lower bound",
    marker: "circle-arrow-up",
    tone: "attention",
  },
  NOT_APPLICABLE: {
    label: "Not applicable",
    marker: "circle-minus",
    tone: "unavailable",
  },
  UNAVAILABLE: {
    label: "Unavailable",
    marker: "circle-x",
    tone: "unavailable",
  },
  EXPIRED: { label: "Expired", marker: "clock", tone: "expired" },
  INCOMPATIBLE: {
    label: "Incompatible",
    marker: "exclamation-circle",
    tone: "incompatible",
  },
};

export function MetricTruthLabel({
  state,
  withholdingReason,
  reading,
  detail = "full",
  locale = "en",
}: {
  state: TruthState;
  withholdingReason?: WithholdingReason;
  reading?: string;
  detail?: "full" | "label";
  locale?: MetricTruthLocale;
}) {
  const truth = metricTruth[state];
  return (
    <div className="status-stack" data-state={state}>
      <span className={`status-label status-${truth.tone}`}>
        <span aria-hidden="true" className="status-label-marker">
          <Icon name={truth.marker} size="content-marker" />
        </span>
        <span className="status-label-text">
          {metricTruthMessages[locale][state].label}
        </span>
      </span>
      {detail === "label" || withholdingReason === undefined ? null : (
        <span className="status-reason">Reason: {withholdingReason}</span>
      )}
      {detail === "label" || reading === undefined ? null : (
        <span className="status-reading">{reading}</span>
      )}
    </div>
  );
}

const coverageLabels: Record<Coverage["state"], string> = {
  NO_POPULATION: "No applicable population",
  NO_COVERAGE: "No coverage",
  PARTIAL: "Partial coverage",
  FULL: "Full coverage",
};

const coveragePresentation: Record<
  Coverage["state"],
  { marker: IconName; tone: string }
> = {
  NO_POPULATION: { marker: "circle", tone: "unavailable" },
  NO_COVERAGE: { marker: "circle", tone: "attention" },
  PARTIAL: { marker: "exclamation-mark", tone: "attention" },
  FULL: { marker: "circle-filled", tone: "available" },
};

export function CoverageLabel({ coverage }: { coverage: Coverage | null }) {
  if (coverage === null)
    return (
      <div className="coverage-label" data-coverage="UNAVAILABLE">
        <span className="status-label status-unavailable">
          <Icon name="circle" size="content-marker" />
          Coverage unavailable
        </span>
      </div>
    );
  const presentation = coveragePresentation[coverage.state];
  return (
    <div className="coverage-label" data-coverage={coverage.state}>
      <span className={`status-label status-${presentation.tone}`}>
        <span aria-hidden="true">
          <Icon name={presentation.marker} size="content-marker" />
        </span>
        {coverageLabels[coverage.state]}
      </span>
      <span className="numeric-exact">
        {coverage.numerator} / {coverage.denominator}
      </span>
      {coverage.alert === "LOW_COVERAGE" ? (
        <span className="status-reason">Low coverage</span>
      ) : null}
    </div>
  );
}

const humanize = (value: string) => value.toLowerCase().replaceAll("_", " ");

type EvidenceLifecycleProps =
  | { truth: Truth; traceState?: never }
  | {
      truth?: never;
      traceState: "ABSENT" | "AVAILABLE" | "PARTIAL" | "EXPIRED";
    };

export function EvidenceLifecycleLabel(props: EvidenceLifecycleProps) {
  if (props.traceState !== undefined) {
    const label =
      props.traceState === "PARTIAL"
        ? "partial recorded data"
        : humanize(props.traceState);
    const tone =
      props.traceState === "AVAILABLE"
        ? "available"
        : props.traceState === "EXPIRED"
          ? "expired"
          : props.traceState === "PARTIAL"
            ? "attention"
            : "unavailable";
    return (
      <span className={`status-label status-${tone}`}>
        <Icon name="diamond" size="content-marker" />
        Trace: {label}
      </span>
    );
  }

  const { truth } = props;
  return (
    <div className="lifecycle-grid">
      <span>Completeness: {humanize(truth.completeness ?? "UNSPECIFIED")}</span>
      <span>Availability: {humanize(truth.availability)}</span>
      <span>Expiry: {humanize(truth.expiry)}</span>
    </div>
  );
}

export function ScopedError({
  title,
  detail,
  correlation,
  retryable,
  onRetry,
  announce,
}: {
  title: string;
  detail: string;
  correlation?: string;
  retryable: boolean;
  onRetry?: () => void;
  announce: "polite" | "assertive";
}) {
  return (
    <section
      aria-live={announce}
      className="scoped-error"
      role={announce === "assertive" ? "alert" : "status"}
    >
      <h3 className="text-heading">{title}</h3>
      <p className="text-body">{detail}</p>
      {correlation === undefined ? null : (
        <code className="text-code">Correlation: {correlation}</code>
      )}
      {retryable && onRetry !== undefined ? (
        <button className="action-control" onClick={onRetry} type="button">
          Retry
        </button>
      ) : null}
    </section>
  );
}

export function MetricTruthMark({
  state,
  locale = "en",
}: {
  state: TruthState;
  locale?: MetricTruthLocale;
}) {
  const truth = metricTruth[state];
  const text = metricTruthMessages[locale][state];
  return (
    <WidgetTooltip
      text={`${text.label} · ${text.description}`}
      className="monitoring-state-mark"
    >
      <Icon
        name={truth.marker}
        size="content-marker"
        aria-label={text.label}
        data-truth-state={state}
      />
    </WidgetTooltip>
  );
}
