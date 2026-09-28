import { useAnalysisPreviewState } from "./use-analysis-preview-state";
import { useEffect, useState } from "react";
import { AnalysisDataProvider } from "../components/analysis-data";
import {
  AnalysisSurface,
  type AnalysisPage,
} from "../components/analysis-observation-study";
import { ResultAnalysisSurface } from "../components/result-analysis-preview";
import { analysisDataFixture } from "./analysis-data-fixture";
import {
  observationRange,
  observationTimeZone,
} from "../components/observation-time";
const aliases: Record<string, AnalysisPage> = {
  dashboard: "dashboard",
  traces: "traces",
  reports: "reports",
  analysis: "traces",
  audit: "traces",
  compare: "reports",
};
/** Standalone HTML preview host only. Production UI never owns these listeners. */
export function AnalysisObservationStudy() {
  const preview = useAnalysisPreviewState();
  const [initial] = useState(() => new URLSearchParams(location.search));
  const sourceContext = Object.fromEntries(
    [...initial].filter(([key]) =>
      [
        "plan_run_id",
        "wave_id",
        "workflow_run_id",
        "trace_root_id",
        "from_gate_id",
        "attempt",
        "span_id",
        "event_id",
        "task_id",
        "delivery_id",
        "trace_id",
      ].includes(key),
    ),
  );
  const [view, setView] = useState<AnalysisPage>(
    aliases[initial.get("view") ?? ""] ??
      (Object.keys(sourceContext).length ? "traces" : "dashboard"),
  );
  const go = (next: AnalysisPage) => {
    setView(next);
    const url = new URL(location.href);
    url.searchParams.set("view", next);
    history.replaceState(null, "", url);
  };
  useEffect(() => {
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '[data-section-id^="analysis-"][data-section-id$="-action"]',
      ),
    ];
    const click = (event: MouseEvent) => {
      if (
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const next =
        aliases[
          new URL(
            (event.currentTarget as HTMLAnchorElement).href,
          ).searchParams.get("view") ?? ""
        ];
      if (next) {
        event.preventDefault();
        go(next);
      }
    };
    links.forEach((link) => link.addEventListener("click", click));
    return () =>
      links.forEach((link) => link.removeEventListener("click", click));
  }, []);
  useEffect(() => {
    document
      .querySelectorAll(
        '[data-section-id^="analysis-"][data-section-id$="-action"]',
      )
      .forEach((link) => {
        if (link.getAttribute("data-section-id") === `analysis-${view}-action`)
          link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
  }, [view]);
  return (
    <AnalysisDataProvider value={analysisDataFixture}>
      <AnalysisSurface
        {...preview}
        sourceNotice={
          Object.keys(sourceContext).length ? "预览数据未解析此来源" : undefined
        }
        view={view}
        sourceContext={sourceContext}
        onViewChange={go}
        initialPeriod={initial.get("period") ?? "7d"}
        initialScope={initial.get("scope") ?? "all"}
      />
    </AnalysisDataProvider>
  );
}
export function ResultAnalysisPreview() {
  const preview = useAnalysisPreviewState();
  const range = observationRange("7d", analysisDataFixture.referenceDate).map(
    (v) => v + observationTimeZone,
  ) as [string, string];
  return (
    <AnalysisDataProvider value={analysisDataFixture}>
      <ResultAnalysisSurface
        timeRange={range}
        settings={preview.settings}
        onSettingsChange={preview.onSettingsChange}
      />
    </AnalysisDataProvider>
  );
}
