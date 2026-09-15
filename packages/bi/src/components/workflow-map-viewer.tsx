import type { ComponentProps } from "react";
import { WorkflowMapViewCore } from "./workflow-map-view-core";
export type WorkflowMapViewerProps = Omit<
  ComponentProps<typeof WorkflowMapViewCore>,
  "exploration" | "examples" | "resourceWorkspaceForTitle" | "precomputedLayout"
>;
/** Host-neutral read-only viewer. Mount with an exact revision key; layout is supplied explicitly. */
export function WorkflowMapViewer(props: WorkflowMapViewerProps) {
  return <WorkflowMapViewCore {...props} exploration={false} />;
}
export type { WorkflowLayoutResolver } from "./workflow-map-view-core";
