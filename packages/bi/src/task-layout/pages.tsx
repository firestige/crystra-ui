import { ChatSplitDivider, useChatSplit } from "../public";
import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "./page-header";
import "./pages.css";

export interface BrowserPageProps extends PageHeaderProps {
  bench: ReactNode;
}
export interface WorkbenchPageProps extends BrowserPageProps {
  chat: ReactNode;
}

function BrowserFrame({ bench, ...header }: BrowserPageProps) {
  return (
    <>
      <PageHeader {...header} />
      <div className="crystra-page-content">{bench}</div>
    </>
  );
}
function WorkbenchFrame({ chat, bench, ...header }: WorkbenchPageProps) {
  const {
    ref: splitRef,
    style: splitStyle,
    resizing,
    dividerProps,
  } = useChatSplit({ initialRatio: 0.38, minBenchWidth: 680 });
  return (
    <>
      <PageHeader {...header} />
      <div
        className="crystra-page-columns"
        ref={splitRef}
        style={splitStyle}
        data-resizing={resizing}
        data-section-id="task-layout-region"
      >
        <div className="crystra-page-chat">{chat}</div>
        <ChatSplitDivider {...dividerProps} />
        <div className="crystra-page-bench">{bench}</div>
      </div>
    </>
  );
}
export function TaskBrowserPage(props: BrowserPageProps) {
  return <BrowserFrame {...props} />;
}
export function TaskDetailPage(props: WorkbenchPageProps) {
  return <WorkbenchFrame {...props} />;
}
export function WorkflowExplorerPage(props: BrowserPageProps) {
  return <BrowserFrame {...props} />;
}
export function WorkflowStudioPage(props: WorkbenchPageProps) {
  return <WorkbenchFrame {...props} />;
}
export function AnalysisAuditPage(props: BrowserPageProps) {
  return <BrowserFrame {...props} />;
}
