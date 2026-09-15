import { useCallback, useEffect, useState } from "react";
import {
  AnalysisWorkspace,
  type AnalysisWorkspacePage,
} from "./analysis-workspace";
import { analysisExplorationData } from "../test-harness/analysis-exploration-data";
import { ResultAnalysisPreview } from "./result-analysis-preview";
const aliases: Record<string, AnalysisWorkspacePage> = {
  analysis: "traces",
  audit: "traces",
  compare: "reports",
  dashboard: "dashboard",
  traces: "traces",
  reports: "reports",
};
export function AnalysisObservationStudy() {
  const [initial] = useState(() => location.search);
  const [page, setPage] = useState<AnalysisWorkspacePage>(
    () =>
      aliases[new URLSearchParams(initial).get("view") ?? ""] ??
      (new URLSearchParams(initial).has("task_id") ? "traces" : "dashboard"),
  );
  useEffect(() => {
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '[data-section-id="analysis-dashboard-action"], [data-section-id="analysis-traces-action"], [data-section-id="analysis-reports-action"]',
      ),
    ];
    const navigate = (event: MouseEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      const view = new URL(
        (event.currentTarget as HTMLAnchorElement).href,
      ).searchParams.get("view")!;
      setPage(aliases[view]);
    };
    links.forEach((link) => link.addEventListener("click", navigate));
    return () =>
      links.forEach((link) => link.removeEventListener("click", navigate));
  }, []);
  const sync = useCallback(
    ({
      page,
      period,
      scope,
    }: {
      page: AnalysisWorkspacePage;
      period: string;
      scope: string;
    }) => {
      const query = new URLSearchParams(location.search);
      query.set("view", page);
      query.set("period", period);
      if (page !== "traces") query.delete("scope");
      else query.set("scope", scope);
      history.replaceState(null, "", "?" + query.toString());
      document
        .querySelectorAll(
          '[data-section-id^="analysis-"][data-section-id$="-action"]',
        )
        .forEach((el) => el.removeAttribute("aria-current"));
      document
        .querySelector(
          `[data-section-id="analysis-${page === "dashboard" ? "dashboard" : page}-action"]`,
        )
        ?.setAttribute("aria-current", "page");
    },
    [],
  );
  return (
    <AnalysisWorkspace
      page={page}
      onPageChange={setPage}
      data={analysisExplorationData}
      referenceDate="2026-09-09"
      initialQuery={initial}
      initialPeriod={new URLSearchParams(initial).get("period") ?? "7d"}
      onStateChange={sync}
      renderComparison={(props) => (
        <ResultAnalysisPreview embedded {...props} />
      )}
    />
  );
}
