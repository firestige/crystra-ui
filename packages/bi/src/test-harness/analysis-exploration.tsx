import {
  AnalysisWorkspace,
  type AnalysisWorkspacePage,
} from "../components/analysis-workspace";
import { analysisExplorationData } from "./analysis-exploration-data";
import { ResultAnalysisPreview } from "../components/result-analysis-preview";
import "../public";
/** Explicit design fixture boundary. Never exported from the production package. */
export function AnalysisExploration({
  page,
  onNavigate,
}: {
  page: AnalysisWorkspacePage;
  onNavigate: (page: AnalysisWorkspacePage) => void;
}) {
  return (
    <>
      <AnalysisWorkspace
        page={page}
        onPageChange={onNavigate}
        data={analysisExplorationData}
        initialPeriod="7d"
        referenceDate="2026-09-09"
        renderComparison={(props) => (
          <ResultAnalysisPreview embedded {...props} />
        )}
      />
      <aside
        role="note"
        aria-label="数据来源"
        style={{
          position: "fixed",
          right: 12,
          bottom: 8,
          padding: "4px 8px",
          background: "#29292c",
          color: "#d4d4d8",
          fontSize: 11,
          zIndex: 100,
        }}
      >
        草案探索 · v8 设计样本，非真实运行数据
      </aside>
    </>
  );
}
