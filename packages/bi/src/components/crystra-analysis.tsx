import { type ReactNode } from "react";
import type { TraceView } from "../domain/trace/trace-view";
import { Tabs } from "./collection-components";
import { Button, ButtonGroup, Typography } from "./design-system";
import { Icon } from "./icon";
import { TraceWaterfall, TraceTree } from "./trace-views";
import "../analysis-observation-study.css";
import "../crystra-analysis.css";
export type CrystraAnalysisPage =
  "analysis-overview" | "analysis-traces" | "analysis-reports";
const pages = [
  { value: "analysis-overview", label: "总览" },
  { value: "analysis-traces", label: "调用追踪" },
  { value: "analysis-reports", label: "对比分析" },
] as const;
/** Accepted v8 frame, with production data and navigation supplied by the host. */
export function CrystraAnalysisFrame({
  page,
  onNavigate,
  controls,
  children,
}: {
  page: CrystraAnalysisPage;
  onNavigate: (page: CrystraAnalysisPage) => void;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="wb-host obs-host crystra-analysis-host"
      data-section-id="main-surface-host"
    >
      <header
        className="wb-header wb-page-header obs-header"
        data-section-id="workspace-header"
      >
        <div data-header-slot="identity" className="wb-identity">
          <span className="wb-context-icon">
            <Icon name="activity" size="context-marker" />
          </span>
          <div>
            <Typography as="h1" variant="page-title">
              观测与分析
            </Typography>
            <Typography as="p" variant="description">
              了解运行，追溯调用，研究差异。
            </Typography>
          </div>
        </div>
        <div data-header-slot="navigation">
          <Tabs
            appearance="underline"
            aria-label="观测工作面"
            value={page}
            onValueChange={(value) => onNavigate(value as CrystraAnalysisPage)}
            items={pages.map((p) => ({ ...p, panel: null }))}
          />
        </div>
        {controls && (
          <div className="obs-header-scope" data-header-slot="context">
            {controls}
          </div>
        )}
      </header>
      {children}
    </section>
  );
}
export function CrystraTraceContent({
  phase,
  traceId,
  trace,
  view,
  onViewChange,
  error,
  directory,
}: {
  phase: "idle" | "loading" | "ready" | "partial" | "absent" | "error";
  traceId: string;
  trace?: TraceView;
  view: "waterfall" | "tree";
  onViewChange: (view: "waterfall" | "tree") => void;
  error?: string;
  directory?: ReactNode;
}) {
  return (
    <div className="obs-trace-layout" data-directory-open={Boolean(directory)}>
      <aside
        className="obs-trace-directory"
        aria-label="调用记录目录"
        aria-hidden={!directory}
        inert={!directory}
      >
        {directory}
      </aside>
      <div className="obs-scroll obs-trace-main">
        <div className="obs-trace-toolbar">
          <ButtonGroup segmented aria-label="Trace 视图">
            {(["waterfall", "tree"] as const).map((value) => (
              <Button
                key={value}
                appearance="segment"
                selected={view === value}
                onClick={() => onViewChange(value)}
              >
                {value === "waterfall" ? "Waterfall" : "Tree"}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <div data-section-id="trace-reconstruction" data-trace-id={traceId}>
          {phase === "idle" && (
            <p role="status">选择精确 Trace 查看调用记录。</p>
          )}
          {phase === "loading" && <p role="status">正在读取调用记录…</p>}
          {phase === "absent" && (
            <p role="status">
              当前 Trace 没有可用的调用记录，可能不存在或已过期。
            </p>
          )}
          {phase === "error" && <p role="alert">{error}</p>}
          {phase === "partial" && (
            <p role="status">调用记录不完整，当前仅展示已记录内容。</p>
          )}
          {(phase === "ready" || phase === "partial") &&
            trace &&
            (view === "waterfall" ? (
              <TraceWaterfall
                key={trace.traceId}
                trace={trace}
                showSummary={false}
                fillHeight
              />
            ) : (
              <TraceTree
                key={trace.traceId}
                trace={trace}
                showSummary={false}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
