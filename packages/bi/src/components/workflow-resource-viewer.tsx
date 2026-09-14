import type { ComponentProps } from "react";
import { WorkflowResourceViewCore } from "./workflow-resource-view-core";
import type { CatalogResource } from "./resource-catalog";
export type WorkflowResourceViewerProps = Omit<
  ComponentProps<typeof WorkflowResourceViewCore>,
  "identityKey" | "declaredCatalog" | "exploration"
> & { definitionId: string; revision: string; catalog: CatalogResource[] };
/** Exact snapshot; editing requires an explicit isolated draft persistence port. Only declared resources are listed; missing relation projection is unavailable. */
export function WorkflowResourceViewer({
  definitionId,
  revision,
  catalog,
  ...props
}: WorkflowResourceViewerProps) {
  return (
    <WorkflowResourceViewCore
      {...props}
      key={JSON.stringify([definitionId, revision, props.workspace?.root])}
      identityKey={JSON.stringify([
        definitionId,
        revision,
        props.workspace?.root,
      ])}
      declaredCatalog={catalog}
      exploration={false}
    />
  );
}
export type {
  ResourceWorkspaceSnapshot,
  ResourceDraftSave,
} from "./workflow-resource-view-core";
export type { CatalogResource as WorkflowCatalogResource } from "./resource-catalog";
