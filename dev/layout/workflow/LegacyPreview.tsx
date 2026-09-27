/** Compatibility adapter for the standalone design preview, never exported by UI. */
import { useLayoutEffect, useState, useRef } from "react";
import {
  WorkflowMapWorkbench,
  WorkflowResourceBrowser,
  WorkflowCrystallization,
  type WorkflowMapIR,
} from "crystra-ui-core";
import {
  useWorkflowPreview,
  previewLayout,
  previewSamples,
} from "./use-workflow-preview";
import { DevWorkflowTools } from "./DevWorkflowTools";
import { crystallizationData } from "./crystallization-data";
declare global {
  interface Window {
    crystraRenderResourceMarkdown?: (text: string) => React.ReactNode;
  }
}
const quote = (text: string) => {
  const input = document.querySelector<HTMLTextAreaElement>(
    '[data-host-owned="dsh-input"] textarea',
  );
  if (input) {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }
};
export function LegacyWorkflowMap({
  mode,
  onWorkflow,
  onIdentity,
  requestedNode,
}: {
  mode: string;
  onWorkflow: (ir: WorkflowMapIR) => void;
  onIdentity: (title: string, description: string) => void;
  requestedNode?: { id: string; seq: number } | null;
}) {
  const host = useWorkflowPreview();
  const [header, setHeader] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legacy HTML supplies the portal target after mount.
    setHeader(
      document.querySelector(
        '[data-section-id="workspace-header"] [data-header-slot="context"]',
      ),
    );
  }, []);
  const callbacks = useRef({ onWorkflow, onIdentity });
  useLayoutEffect(() => {
    callbacks.current = { onWorkflow, onIdentity };
  });
  useLayoutEffect(() => {
    callbacks.current.onWorkflow(host.workflow);
    callbacks.current.onIdentity(
      host.workflow.title,
      host.workflow.description || "",
    );
  }, [host.workflow]);
  return (
    <WorkflowMapWorkbench
      workflow={host.workflow}
      mode={mode}
      requestedNode={requestedNode}
      headerContainer={header}
      onQuote={quote}
      layoutResolver={previewLayout}
      actions={
        <DevWorkflowTools
          ir={host.workflow}
          samples={previewSamples}
          previewLayout={previewLayout}
          onChange={host.setWorkflow}
        />
      }
      crystallization={
        <WorkflowCrystallization data={crystallizationData} quote={quote} />
      }
    />
  );
}
export function LegacyWorkflowResources({
  workflow,
}: {
  workflow: WorkflowMapIR;
}) {
  const host = useWorkflowPreview();
  const { setWorkflow } = host;
  useLayoutEffect(() => setWorkflow(workflow), [workflow, setWorkflow]);
  return (
    <WorkflowResourceBrowser
      workspace={host.workspace}
      onQuote={quote}
      onSave={host.save}
      onMutation={host.mutate}
      onDirtyChange={host.setDirty}
      renderMarkdown={window.crystraRenderResourceMarkdown}
      saveNotice="已保存到页面样本 · 未写入磁盘"
    />
  );
}
