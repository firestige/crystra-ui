import type { ReactNode } from "react";
import snapshot from "./workflow-resource-design.json";
import {
  WorkflowResourceViewer,
  type ResourceWorkspaceSnapshot,
  type ResourceDraftSave,
} from "../components/workflow-resource-viewer";
import { resourceCatalog } from "../components/resource-catalog";
import { ResourceRelationGraph } from "../components/resource-relation-graph";
const workspace = snapshot as ResourceWorkspaceSnapshot;
// This is the existing design adapter, not the production resource index. Document navigation is not a semantic dependency.
const relations = {
  ...workspace,
  edges: workspace.edges.filter((edge) => edge.label !== "文档链接"),
};
const catalog = resourceCatalog(
  workspace.files,
  workspace.nodes,
  relations.edges,
);
function DesignRelations({
  selection,
  onOpenFile,
}: {
  selection: { resourceId: string; path: string };
  onOpenFile: (path: string) => void;
}) {
  return (
    <ResourceRelationGraph
      key={selection.resourceId}
      source={relations}
      file={selection.path}
      onOpenFile={onOpenFile}
    />
  );
}
export function WorkflowResourceDesign({
  renderMarkdown,
  onDiscuss,
  workspace: authoredWorkspace,
  onSaveDraft,
}: {
  workspace?: ResourceWorkspaceSnapshot;
  onSaveDraft?: (proposal: ResourceDraftSave) => Promise<void>;
  renderMarkdown?: (text: string) => ReactNode;
  onDiscuss?: (selection: { resourceId: string; path: string }) => void;
}) {
  return (
    <WorkflowResourceViewer
      definitionId="draft-workflow-implementation"
      revision="v8-resource-snapshot"
      workspace={authoredWorkspace ?? workspace}
      onSaveDraft={onSaveDraft}
      catalog={catalog}
      renderMarkdown={renderMarkdown}
      onDiscuss={onDiscuss}
      renderRelations={
        authoredWorkspace?.files.some((file) =>
          file.revision?.startsWith("draft-sha256:"),
        )
          ? undefined
          : DesignRelations
      }
    />
  );
}
