import { useAnalysisPreviewState } from "../../packages/bi/src/test-harness/use-analysis-preview-state";
import {
  AnalysisSurface,
  AnalysisDataProvider,
  type AnalysisPage,
} from "crystra-ui-core";
import { analysisDataFixture } from "../../packages/bi/src/test-harness/analysis-data-fixture";
import { navigate } from "./useRoute";
/** Dev adapter owns fixture injection and navigation. */
export function AnalysisV8Assembly({ view }: { view: AnalysisPage }) {
  const preview = useAnalysisPreviewState();
  const query = new URLSearchParams(window.location.search);
  const sourceContext = Object.fromEntries(
    [...query].filter(([key]) =>
      [
        "task_id",
        "delivery_id",
        "trace_id",
        "span_id",
        "event_id",
        "plan_run_id",
        "wave_id",
        "workflow_run_id",
        "trace_root_id",
        "from_gate_id",
        "attempt",
      ].includes(key),
    ),
  );
  return (
    <AnalysisDataProvider value={analysisDataFixture}>
      <AnalysisSurface
        {...preview}
        sourceNotice={
          Object.keys(sourceContext).length ? "预览数据未解析此来源" : undefined
        }
        view={view}
        onViewChange={(next) => {
          const url = new URL(window.location.href);
          url.searchParams.set("view", next);
          navigate(url.pathname + url.search);
        }}
        initialPeriod={query.get("period") ?? "7d"}
        initialScope={query.get("scope") ?? "all"}
        sourceContext={sourceContext}
      />
    </AnalysisDataProvider>
  );
}
