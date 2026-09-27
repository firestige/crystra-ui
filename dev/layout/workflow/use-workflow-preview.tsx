import {
  useWorkflowResourceActions,
  type WorkflowResourcePort,
} from "../../../../wsr-dsh/src/client/workflows/use-workflow-resource-actions";
import { useCallback, useState } from "react";
import type {
  WorkflowMapIR,
  WorkflowResourceWorkspace,
  ResourceMutation,
  WorkflowLayoutResolver,
} from "crystra-ui-core";
import { layoutWorkflowMap } from "../../../packages/bi/src/domain/workflow-map-engine";
import development from "../../../packages/bi/src/domain/workflow-map-development.json";
import architecture from "../../../packages/bi/src/domain/workflow-map-architecture.json";
import research from "../../../packages/bi/src/domain/workflow-map-research.json";
import { saveResourceContent } from "./resource-content";
import { applyResourceMutation } from "./resource-mutations";
declare global {
  interface Window {
    crystraWorkflowMapCandidate?: {
      samples: WorkflowMapIR[];
      layout: (
        ir: WorkflowMapIR,
        expanded: ReadonlySet<string>,
        direction: string,
      ) => Awaited<ReturnType<WorkflowLayoutResolver>> | null;
    };
    crystraResourceWorkspaces?: WorkflowResourceWorkspace[];
  }
}
export const previewSamples =
  window.crystraWorkflowMapCandidate?.samples ||
  ([development, architecture, research] as WorkflowMapIR[]);
export const previewLayout: WorkflowLayoutResolver = async (
  ir,
  expanded,
  direction,
  bounds,
) => {
  const candidate = window.crystraWorkflowMapCandidate;
  if (!candidate) return layoutWorkflowMap(ir, expanded, direction, bounds);
  const result = candidate.layout(ir, expanded, direction);
  if (!result) throw Error("当前布局样本不覆盖这份定义，请重新生成布局资产。");
  return result;
};
const resourcePort: WorkflowResourcePort<
  WorkflowResourceWorkspace,
  ResourceMutation
> = {
  save(workspace, path, base, content) {
    const next = structuredClone(workspace);
    saveResourceContent(next, path, base, content);
    return next;
  },
  mutate(workspace, mutation, name, content) {
    const next = structuredClone(workspace);
    const event = applyResourceMutation(next, mutation, name, content);
    return { workspace: next, path: event.path };
  },
};
export function useWorkflowPreview() {
  const [workflow, setWorkflow] = useState(previewSamples[0]);
  const [workspaces, setWorkspaces] = useState(() =>
    structuredClone(window.crystraResourceWorkspaces || []),
  );
  const workspace = workspaces.find((w) => w.title === workflow.title) || null;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "user",
      text: "根据需求与设计完成开发。细化设计后逐单元进行 TDD，完成后并行复核与验证。",
    },
    {
      role: "assistant",
      text: "选择活动查看详情，或引用到 Chat 继续讨论。当前展示 v8 设计样本，未连接 Agent。",
    },
  ]);
  const quote = useCallback((text: string) => setDraft(text), []);
  const submit = () => {
    if (!draft.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: draft },
      {
        role: "assistant",
        text: "已收到讨论内容。当前为本地交互预览，未连接 Agent，此消息不会修改工作流文件。",
      },
    ]);
    setDraft("");
  };
  const replaceWorkspace = (next: WorkflowResourceWorkspace) =>
    setWorkspaces((old) => old.map((w) => (w.root === next.root ? next : w)));
  const { save, mutate, setDirty } = useWorkflowResourceActions(
    workspace,
    resourcePort,
    replaceWorkspace,
  );
  return {
    workflow,
    setWorkflow,
    workspace,
    draft,
    setDraft,
    messages,
    quote,
    submit,
    save,
    mutate,
    setDirty,
  };
}
