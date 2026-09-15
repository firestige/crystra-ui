import type { ReactNode } from "react";
import type { WorkflowMapIR } from "../domain/workflow-map-ir";
import {
  WorkflowResourceViewCore,
  type ResourceWorkspaceSnapshot,
} from "./workflow-resource-view-core";
declare global {
  interface Window {
    crystraResourceWorkspaces?: ResourceWorkspaceSnapshot[];
    crystraRenderResourceMarkdown?: (text: string) => ReactNode;
  }
}
/** Standalone design exploration; production consumes an explicit catalog with WorkflowResourceViewer. */
export function WorkflowResourceBrowser({
  workflow,
}: {
  workflow: WorkflowMapIR;
}) {
  return (
    <WorkflowResourceViewCore
      identityKey={workflow.title}
      workspace={window.crystraResourceWorkspaces?.find(
        (workspace) => workspace.title === workflow.title,
      )}
      exploration
      renderMarkdown={window.crystraRenderResourceMarkdown}
    />
  );
}
