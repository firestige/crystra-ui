import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BiSurface,
  CrystraShell,
  CrystraAnalysisFrame,
  CrystraTraceContent,
  type CrystraAnalysisPage,
} from "../public";
import { observationTrace } from "./observation-fixture";
const trace = observationTrace("demo-release", "v3");
export function ProductScenario() {
  const [page, setPage] = useState<CrystraAnalysisPage>("analysis-traces");
  const [view, setView] = useState<"waterfall" | "tree">("waterfall");
  return (
    <BiSurface data-crystra-theme="dark" className="product-test-surface">
      <CrystraShell
        route={page}
        tasks={[]}
        workflows={[]}
        onNavigate={(value) => {
          if (value.startsWith("analysis-"))
            setPage(value as CrystraAnalysisPage);
        }}
        onOpenHarness={() => undefined}
        onNewTask={() => undefined}
        onOpenSettings={() => undefined}
      >
        <CrystraAnalysisFrame page={page} onNavigate={setPage}>
          {page === "analysis-traces" ? (
            <CrystraTraceContent
              phase="ready"
              trace={trace}
              traceId={trace.traceId!}
              view={view}
              onViewChange={setView}
            />
          ) : (
            <p>
              {page === "analysis-overview"
                ? "Overview fixture"
                : "Reports fixture"}
            </p>
          )}
        </CrystraAnalysisFrame>
      </CrystraShell>
    </BiSurface>
  );
}
const style = document.createElement("style");
style.textContent = "body{margin:0}.product-test-surface{height:100vh}";
document.head.append(style);
createRoot(document.getElementById("root")!).render(<ProductScenario />);
