import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BiSurface, CrystraShell, type AnalysisWorkspacePage } from "../public";
import { AnalysisExploration } from "./analysis-exploration";
const routes = {
  dashboard: "analysis-overview",
  traces: "analysis-traces",
  reports: "analysis-reports",
} as const;
export function ExplorationScenario() {
  const [page, setPage] = useState<AnalysisWorkspacePage>("dashboard");
  return (
    <BiSurface
      data-crystra-theme="dark"
      theme="dark"
      className="analysis-exploration-surface"
    >
      <style>{".analysis-exploration-surface{height:100vh}"}</style>
      <CrystraShell
        route={routes[page]}
        tasks={[]}
        workflows={[]}
        onNavigate={(next) => {
          const value = (Object.keys(routes) as AnalysisWorkspacePage[]).find(
            (k) => routes[k] === next,
          );
          if (value) setPage(value);
        }}
        onOpenHarness={() => {}}
        onNewTask={() => {}}
        onOpenSettings={() => {}}
      >
        <AnalysisExploration page={page} onNavigate={setPage} />
      </CrystraShell>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<ExplorationScenario />);
